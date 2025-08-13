import commonFrag from '../shaders/common'
import raymarchFunctionsFrag from '../shaders/raymarch-functions-frag'
import fragTemplateWGSL from './../shaders/frag.wgsl?raw'

type Props = {
  main: string
  map?: string
  functions?: string
  rtUniformKeys: string[]
}

function getFragWGSL({ main, map, functions, rtUniformKeys }: Props) {
  let fragWGSL = fragTemplateWGSL

  fragWGSL = fragWGSL.replace(
    'UNIFORMS: f32, // #UNIFORMS',
    rtUniformKeys.map((u) => `${u}: f32,`).join('\n')
  )

  fragWGSL = fragWGSL.replace('// #COMMON', commonFrag)

  if (functions) {
    fragWGSL = fragWGSL.replace('// #FUNCTIONS', functions)
  }

  if (map) {
    fragWGSL = fragWGSL.replace(
      '// #RAY_MARCH_FUNCTIONS',
      raymarchFunctionsFrag
    )
    fragWGSL = fragWGSL.replace('return 0.; // #MAP', map)
  }

  fragWGSL = fragWGSL.replace(
    'return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN',
    main
  )

  return fragWGSL
}

export default getFragWGSL
