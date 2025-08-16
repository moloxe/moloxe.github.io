import commonFrag from '../shaders/common'
import fragTemplateWGSL from './../shaders/frag.wgsl?raw'
import getSdFragWGSL from './get-sd-frag-wgsl'

type Props = {
  main: string
  rtUniformKeys: string[]
  functions?: string
  materialSdFunctions: string[]
}

function getFragWGSL({
  main,
  functions,
  rtUniformKeys,
  materialSdFunctions,
}: Props) {
  let fragWGSL = fragTemplateWGSL

  fragWGSL = fragWGSL.replace(
    'UNIFORMS: f32, // #UNIFORMS',
    rtUniformKeys.map((u) => `${u}: f32,`).join('\n')
  )

  fragWGSL = fragWGSL.replace('// #COMMON', commonFrag)

  if (functions) {
    fragWGSL = fragWGSL.replace('// #FUNCTIONS', functions)
  }

  if (materialSdFunctions.length > 0) {
    const sdFragWGSL = getSdFragWGSL(materialSdFunctions)
    fragWGSL = fragWGSL.replace('// #RAY_MARCH_FUNCTIONS', sdFragWGSL)
  }

  fragWGSL = fragWGSL.replace(
    'return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN',
    main
  )

  return fragWGSL
}

export default getFragWGSL
