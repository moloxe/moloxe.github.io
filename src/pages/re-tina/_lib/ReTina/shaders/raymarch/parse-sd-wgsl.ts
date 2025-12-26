import type { RTMaterialFuncs } from '../../types'
import raymarchWGSL from './raymarch.wgsl?raw'

type ParserProps = {
  sdWGSL: string
  materialSdFunctions: string[]
  materialLightFunctions: (string | undefined)[]
}

function PARSE_MATERIALS({ sdWGSL, materialSdFunctions }: ParserProps) {
  function parseSdMaterial(sdFunc: string, index: number) {
    const materialPos = `vec3<f32>(U.material${index}Px, U.material${index}Py, U.material${index}Pz)`
    const materialRot = `vec3<f32>(U.material${index}Rx, U.material${index}Ry, U.material${index}Rz)`
    return /* wgsl */ `
        fn sdMaterial${index}(posIn: vec3<f32>) -> f32 {
          let mRotation = ${materialRot};
          var pos = posIn - ${materialPos};
          if length(mRotation) != 0.0 {
            pos = rotate(pos, mRotation);
          }
          ${sdFunc}
        }`
  }

  const sdIndividualMaterials = materialSdFunctions
    .map(parseSdMaterial)
    .join('\n')

  sdWGSL = sdWGSL.replace('// #SD-INDIVIDUAL-MATERIALS', sdIndividualMaterials)

  function parseSdMaterials(index: number) {
    return /* wgsl */ `
        curDist = sdMaterial${index}(pos);
        if curDist < material.dist {
          material.index = ${index};
          material.dist = curDist;
          material.pos = vec3<f32>(
            U.material${index}Px,
            U.material${index}Py,
            U.material${index}Pz
          );
          material.color = vec3<f32>(
            U.material${index}Cr,
            U.material${index}Cg,
            U.material${index}Cb
          );
        }`
  }

  const sdMaterialsFunc = /* wgsl */ `
      var material = SdMaterial(-1, INF, vec3<f32>(0.), vec3<f32>(0.));
      var curDist: f32;

      ${materialSdFunctions
        .map((_, index) => parseSdMaterials(index))
        .join('\n')}

      return material;
    `

  sdWGSL = sdWGSL.replace('// #SD-MATERIALS-FUNC', sdMaterialsFunc)

  return sdWGSL
}

function PARSE_MAP({ materialSdFunctions, sdWGSL }: ParserProps) {
  function parseMap(index: number) {
    return /* wgsl */ `dist = min(dist, sdMaterial${index}(pos));`
  }

  const map = /* wgsl */ `
      var dist: f32 = INF;
      var accDist: f32;

      ${materialSdFunctions.map((_, index) => parseMap(index)).join('\n')}

      return dist;`

  sdWGSL = sdWGSL.replace('// #MAP', map)

  return sdWGSL
}

function PARSE_LIGHT({ materialLightFunctions, sdWGSL }: ParserProps) {
  function parseMaterialLight(lightFunc: string | undefined, index: number) {
    if (!lightFunc) {
      // Default light function
      lightFunc = /* wgsl */ `
          let lamb = dot(normal, -rd); // Camera as light
          let aoFactor = calculateDFAO(pos, normal);
          let finalColor = color * sqrt(lamb) * aoFactor;
          return vec4f(finalColor, 1.);`
    }

    return /* wgsl */ `
        fn calcLightMaterial${index}(
          ro: vec3<f32>,
          rd: vec3<f32>,
          pos: vec3<f32>,
          normal: vec3<f32>,
          color: vec3<f32>
        ) -> vec4<f32> {
            ${lightFunc}
        }`
  }

  const lightIndividualMaterials = materialLightFunctions
    .map(parseMaterialLight)
    .join('\n')

  sdWGSL = sdWGSL.replace(
    '// #LIGHT-INDIVIDUAL-MATERIALS',
    lightIndividualMaterials
  )

  function parseMaterialsLight(index: number) {
    return /* wgsl */ `
        if(materialIndex == ${index}) {
          finalColor = calcLightMaterial${index}(ro, rd, pos, normal, color);
        }`
  }

  const lightMaterialsFunc = /* wgsl */ `
      var finalColor = vec4<f32>(0.0);
      ${materialLightFunctions
        .map((_, index) => parseMaterialsLight(index))
        .join('\n')}
      return finalColor;`

  sdWGSL = sdWGSL.replace('// #LIGHT-MATERIALS-FUNC', lightMaterialsFunc)

  return sdWGSL
}

function parseSDWGSL(materialFuncs: RTMaterialFuncs[]) {
  let sdWGSL = raymarchWGSL
  const materialSdFunctions = materialFuncs.map((m) => m.sdFunc)
  const materialLightFunctions = materialFuncs.map((m) => m.lightFunc)

  sdWGSL = PARSE_MATERIALS({
    sdWGSL,
    materialSdFunctions,
    materialLightFunctions,
  })

  sdWGSL = PARSE_MAP({
    materialSdFunctions,
    sdWGSL,
    materialLightFunctions,
  })

  sdWGSL = PARSE_LIGHT({
    materialSdFunctions,
    sdWGSL,
    materialLightFunctions,
  })

  return sdWGSL
}

export default parseSDWGSL
