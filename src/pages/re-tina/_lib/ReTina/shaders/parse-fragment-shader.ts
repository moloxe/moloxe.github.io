import type { RTMaterialFuncs } from '../types'
import parseCommonShader from './parse-common-shader'

type Props = {
  main?: string
  rtUniformKeys: string[]
  functions?: string
  materialFuncs: RTMaterialFuncs[]
  nTextures: number
  usePrevFrameTex?: boolean
  useInterlacing?: boolean
}

function parseFragmentShader({
  main,
  functions,
  rtUniformKeys,
  materialFuncs,
  nTextures,
  usePrevFrameTex,
  useInterlacing,
}: Props) {
  const commonWGSL = parseCommonShader({
    functions,
    materialFuncs,
    nTextures,
    rtUniformKeys,
    usePrevFrameTex,
  })

  if (materialFuncs.length > 0 && !main) {
    main = /* wgsl */ `
      let scene = calcScene(uv);
      return vec4f(scene.color.rgb, 1.0);
    `
  }

  let fragWGSL = /* wgsl */ `
    ${commonWGSL}
    @fragment
    fn main(@location(0) fragCoord: vec2f) -> @location(0) vec4f {
        let uv = 1. - fragCoord.xy;
        // #INTERLACING
        ${main ?? 'return vec4f(0, 0, 0, 1);'}
    }
  `

  if (useInterlacing) {
    const interlacingFrag = /* wgsl */ `
      let _prev_pix_ = getPrevFrameTexSample(uv);
      if i32(U.height * uv.y) % 2 == i32(U.frame) % 2 {
        return _prev_pix_;
      }
    `
    fragWGSL = fragWGSL.replace('// #INTERLACING', interlacingFrag)
  }

  return fragWGSL
}

export default parseFragmentShader
