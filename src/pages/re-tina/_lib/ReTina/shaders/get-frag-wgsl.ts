import commonFrag from './common'
import fragTemplateWGSL from './../shaders/frag.wgsl?raw'
import getSdFragWGSL from '../raymarch/get-sd-frag-wgsl'
import type { RTMaterialFuncs } from '../types'

type Props = {
  main?: string
  rtUniformKeys: string[]
  functions?: string
  materialFuncs: RTMaterialFuncs[]
}

function getFragWGSL({ main, functions, rtUniformKeys, materialFuncs }: Props) {
  let fragWGSL = fragTemplateWGSL

  fragWGSL = fragWGSL.replace(
    'UNIFORMS: f32, // #UNIFORMS',
    rtUniformKeys.map((u) => `${u}: f32,`).join('\n')
  )

  fragWGSL = fragWGSL.replace('// #COMMON', commonFrag)

  if (functions) {
    fragWGSL = fragWGSL.replace('// #FUNCTIONS', functions)
  }

  if (materialFuncs.length > 0) {
    const sdFragWGSL = getSdFragWGSL(materialFuncs)
    fragWGSL = fragWGSL.replace('// #RAY_MARCH_FUNCTIONS', sdFragWGSL)
    if (!main) {
      main = `
        let scene = calcScene(uv);
        return vec4<f32>(scene.color.rgb, 1.0);
      `
    }
  }

  if (main) {
    fragWGSL = fragWGSL.replace(
      'return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN',
      main
    )
  }

  return fragWGSL
}

export default getFragWGSL
