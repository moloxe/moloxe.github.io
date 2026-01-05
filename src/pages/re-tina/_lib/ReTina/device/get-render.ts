import type { RenderProps, RTCamera, RTMaterialFuncs } from '../types'
import vertWGSL from './../shaders/vert.wgsl?raw'
import parseFragmentShader from '../shaders/parse-fragment-shader'
import RTUniform from '../utils/rt-uniform'
import RTTexture from '../utils/rt-texture'
import RTPingPong from '../utils/rt-ping-pong'

type Props = {
  device: GPUDevice
  presentationFormat: GPUTextureFormat
  context: GPUCanvasContext
  canvas: HTMLCanvasElement
  main?: string
  functions?: string
  materialFuncs: RTMaterialFuncs[]
  rtUniform: RTUniform
  rtTexture: RTTexture
  usePrevFrameTex?: boolean
  useInterlacing?: boolean
  bindGroupLayouts: GPUBindGroupLayout[]
}

async function getRender({
  device,
  presentationFormat,
  context,
  canvas,
  main,
  materialFuncs,
  functions,
  rtUniform,
  rtTexture,
  usePrevFrameTex,
  useInterlacing,
  bindGroupLayouts,
}: Props) {
  let rtPingPong: RTPingPong | null = null

  if (usePrevFrameTex) {
    rtPingPong = new RTPingPong(canvas, device, presentationFormat)
    bindGroupLayouts.push(rtPingPong.pingPongBindGroupLayout)
  }

  const fragWGSL = parseFragmentShader({
    main,
    functions,
    materialFuncs,
    rtUniformKeys: rtUniform.getKeysSortedByOffset(),
    nTextures: rtTexture.length(),
    usePrevFrameTex,
    useInterlacing,
  })

  const renderPipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts,
    }),
    vertex: {
      module: device.createShaderModule({
        code: vertWGSL,
      }),
      entryPoint: 'main',
    },
    fragment: {
      module: device.createShaderModule({
        code: fragWGSL,
      }),
      entryPoint: 'main',
      targets: [{ format: presentationFormat }],
    },
    primitive: {
      topology: 'triangle-strip',
      frontFace: 'ccw',
      stripIndexFormat: 'uint32',
    },
  })

  let frame = 0
  let initTime: number | null = null
  function updateSceneUniforms(camera: RTCamera) {
    const now = performance.now() / 1000
    if (initTime === null) initTime = performance.now() / 1000
    const time = now - initTime
    rtUniform.set('frame', frame)
    rtUniform.set('time', time)
    rtUniform.set('aspectRatio', canvas.width / canvas.height)
    rtUniform.set('width', canvas.width)
    rtUniform.set('height', canvas.height)
    rtUniform.set('camPosX', camera.pos.x)
    rtUniform.set('camPosY', camera.pos.y)
    rtUniform.set('camPosZ', camera.pos.z)
    rtUniform.set('camSphericalR', camera.spherical.radius)
    rtUniform.set('camSphericalT', camera.spherical.theta)
    rtUniform.set('camSphericalP', camera.spherical.phi)
    rtUniform.set('camFov', camera.fov)
  }

  const textureBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(1),
    entries: rtTexture.getTextureEntries(),
  })

  function render({ camera }: RenderProps) {
    updateSceneUniforms(camera)

    const currentView = rtPingPong
      ? rtPingPong.currentWriteTextureView
      : context.getCurrentTexture().createView()

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: currentView,
          loadOp: 'clear',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          storeOp: 'store',
        },
      ],
    }

    const commandEncoder = device.createCommandEncoder()

    const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor)

    renderPass.setPipeline(renderPipeline)

    renderPass.setBindGroup(0, rtUniform.uniformBindGroup)
    renderPass.setBindGroup(1, textureBindGroup)

    if (rtPingPong) {
      renderPass.setBindGroup(2, rtPingPong.currentBindGroupIn)
    }

    renderPass.draw(4, 1, 0, 0)
    renderPass.end()

    if (rtPingPong) {
      commandEncoder.copyTextureToTexture(
        { texture: rtPingPong.currentWriteTexture },
        { texture: context.getCurrentTexture() },
        rtPingPong.offscreenTextureSize
      )
    }

    device.queue.submit([commandEncoder.finish()])

    if (rtPingPong) {
      rtPingPong.swap()
    }

    frame++
  }

  return render
}

export default getRender
