import raymarchFunctionsFrag from '../shaders/raymarch-functions-frag'

function getSdFragWGSL(materialSdFunctions: string[]) {
  let sdFragWGSL = raymarchFunctionsFrag

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

  const map = `
    var dist: f32 = 1e10;
    var accDist: f32;
    ${materialSdFunctions
      .map((_, index) => `dist = min(dist, sdMaterial${index}(pos));`)
      .join('\n')}
    return dist;
  `

  sdFragWGSL = sdFragWGSL.replace('return 0.; // #MAP', map)

  return sdFragWGSL
}

export default getSdFragWGSL
