import type { RTMaterialFuncs } from '../../types'
import raymarchFunctionsFrag from './raymarch-functions-frag'

function getSdFragWGSL(materialFuncs: RTMaterialFuncs[]) {
  let sdFragWGSL = raymarchFunctionsFrag
  const materialSdFunctions = materialFuncs.map((m) => m.sdFunc)
  const materialLightFunctions = materialFuncs.map((m) => m.lightFunc)

  // MATERIALS
  {
    const sdIndividualMaterials = materialSdFunctions
      .map((sdFunc, index) => {
        const materialPos = `vec3<f32>(U.material${index}Px, U.material${index}Py, U.material${index}Pz)`
        const materialRot = `vec3<f32>(U.material${index}Rx, U.material${index}Ry, U.material${index}Rz)`
        return `fn sdMaterial${index}(posIn: vec3<f32>) -> f32 {
        let mRotation = ${materialRot};
        var pos = posIn - ${materialPos};
        if length(mRotation) != 0.0 {
          pos = rotate(pos, mRotation);
        }
        ${sdFunc}
      }`
      })
      .join('\n')

    sdFragWGSL = sdFragWGSL.replace(
      '// #SD-INDIVIDUAL-MATERIALS',
      sdIndividualMaterials
    )

    const sdMaterialsFunc = `
    var material = SdMaterial(-1, 1e10, vec3<f32>(0.), vec3<f32>(0.));
    var curDist: f32;
    ${materialSdFunctions
      .map(
        (_, index) => `
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
        }
      `
      )
      .join('\n')}
    return material;
  `

    sdFragWGSL = sdFragWGSL.replace(
      'return SdMaterial(-1, 0., vec3<f32>(0.), vec3<f32>(1.)); // #SD-MATERIALS-FUNC',
      sdMaterialsFunc
    )
  }

  // MAP
  {
    const map = `
    var dist: f32 = 1e10;
    var accDist: f32;
    ${materialSdFunctions
      .map((_, index) => `dist = min(dist, sdMaterial${index}(pos));`)
      .join('\n')}
    return dist;
  `

    sdFragWGSL = sdFragWGSL.replace('return 0.; // #MAP', map)
  }

  // LIGHT
  {
    const lightIndividualMaterials = materialLightFunctions
      .map((lightFunc, index) => {
        return `
          fn calcLightMaterial${index}(
            ro: vec3<f32>,
            rd: vec3<f32>,
            pos: vec3<f32>,
            normal: vec3<f32>,
            color: vec3<f32>) -> vec4<f32> {
            ${
              lightFunc ??
              `let lamb = dot(normal, -rd); // Camera as light
              let finalColor = max(color * 0.2, color * lamb);
              return vec4<f32>(finalColor, 1.);`
            }
          }`
      })
      .join('\n')

    sdFragWGSL = sdFragWGSL.replace(
      '// #LIGHT-INDIVIDUAL-MATERIALS',
      lightIndividualMaterials
    )

    const lightMaterialsFunc = `
      var finalColor = vec4<f32>(0.0);
      ${materialLightFunctions
        .map(
          (_, index) => `
        if(materialIndex == ${index}) {
          finalColor = calcLightMaterial${index}(ro, rd, pos, normal, color);
        }
        `
        )
        .join('\n')}
      return finalColor;
    `

    sdFragWGSL = sdFragWGSL.replace(
      'return vec4<f32>(0.0); // #LIGHT-MATERIALS-FUNC',
      lightMaterialsFunc
    )
  }

  return sdFragWGSL
}

export default getSdFragWGSL
