import commonFrag from './common'
import fragTemplateWGSL from './../shaders/frag.wgsl?raw'
import getSdFragWGSL from '../raymarch/get-sd-frag-wgsl'
import type { RTMaterialFuncs } from '../types'

type Props = {
  main?: string
  rtUniformKeys: string[]
  functions?: string
  materialFuncs: RTMaterialFuncs[]
  nTextures: number
  usePrevFrameTex?: boolean
  useInterlacing?: boolean
}

function getFragWGSL({
  main,
  functions,
  rtUniformKeys,
  materialFuncs,
  nTextures,
  usePrevFrameTex,
  useInterlacing,
}: Props) {
  let fragWGSL = fragTemplateWGSL

  fragWGSL = fragWGSL.replace(
    'UNIFORMS: f32, // #UNIFORMS',
    rtUniformKeys.map((u) => `${u}: f32,`).join('\n')
  )
  if (nTextures > 0) {
    const textures = new Array(nTextures)
      .fill(0)
      .map(
        (_, i) => `
          @group(1) @binding(${i}) var tex${i}: texture_2d<f32>;
          fn getTex${i}Sample(uv: vec2<f32>) -> vec4<f32> {
            return textureSample(tex${i}, u_sampler, uv);
          }
        `
      )
      .join('\n')
    fragWGSL = fragWGSL.replace('// #GROUP-1-BINDING-X', textures)
  }

  if (usePrevFrameTex) {
    fragWGSL = fragWGSL.replace(
      '// #GROUP-2-BINDING-X',
      `@group(2) @binding(0) var prevFrameTex: texture_2d<f32>;
      fn getPrevFrameTexSample(uv: vec2<f32>) -> vec4<f32> {
        return textureSample(prevFrameTex, u_sampler, uv);
      }`
    )
  }

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

  if (useInterlacing) {
    fragWGSL = fragWGSL.replace(
      '// #INTERLACING',
      ` let _prev_pix_ = getPrevFrameTexSample(uv);
        if i32(U.height * uv.y) % 2 == i32(U.frame) % 2 {
        return _prev_pix_;
        }`
    )
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
