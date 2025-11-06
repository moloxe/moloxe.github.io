import commonTemplateWGSL from './../shaders/common.wgsl?raw'
import getSdFragWGSL from './raymarch/get-sd-frag-wgsl'
import type { RTMaterialFuncs } from '../types'

type Props = {
  rtUniformKeys: string[]
  functions?: string
  materialFuncs: RTMaterialFuncs[]
  nTextures: number
  usePrevFrameTex?: boolean
}

function parseCommonShader({
  functions,
  rtUniformKeys,
  materialFuncs,
  nTextures,
  usePrevFrameTex,
}: Props) {
  let fragWGSL = commonTemplateWGSL

  fragWGSL = fragWGSL.replace(
    'UNIFORMS: f32, // #UNIFORMS',
    rtUniformKeys.map((u) => `${u}: f32,`).join('\n')
  )

  if (nTextures > 0) {
    function parseTexture(i: number) {
      return /* wgsl */ `
        @group(1) @binding(${i}) var tex${i}: texture_2d<f32>;
        fn getTex${i}Sample(uv: vec2<f32>) -> vec4<f32> {
          return textureSample(tex${i}, u_sampler, uv);
        }`
    }
    const textures = new Array(nTextures)
      .fill(0)
      .map((_, i) => parseTexture(i))
      .join('\n')
    fragWGSL = fragWGSL.replace('// #GROUP-1-BINDING-X', textures)
  }

  if (usePrevFrameTex) {
    const prevFrameFrag = /* wgsl */ `
      @group(2) @binding(0) var prevFrameTex: texture_2d<f32>;
      fn getPrevFrameTexSample(uv: vec2<f32>) -> vec4<f32> {
        return textureSample(prevFrameTex, u_sampler, uv);
      }`
    fragWGSL = fragWGSL.replace('// #GROUP-2-BINDING-X', prevFrameFrag)
  }

  if (functions) {
    fragWGSL = fragWGSL.replace('// #FUNCTIONS', functions)
  }

  if (materialFuncs.length > 0) {
    const sdFragWGSL = getSdFragWGSL(materialFuncs)
    fragWGSL = fragWGSL.replace('// #RAY_MARCH_FUNCTIONS', sdFragWGSL)
  }

  return fragWGSL
}

export default parseCommonShader
