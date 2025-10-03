import type { RenderProps, RTMaterialFuncs } from '../types'
import vertWGSL from './../shaders/vert.wgsl?raw'
import getFragWGSL from '../shaders/get-frag-wgsl'
import RTUniform from '../utils/rt-uniform'

// Based on:
// https://webgpulab.xbdev.net/index.php?page=editor&id=mandelbulbbasic3&
// https://www.youtube.com/watch?v=rPp7HZFNXnM

type Props = {
  device: GPUDevice
  presentationFormat: GPUTextureFormat
  context: GPUCanvasContext
  canvas: HTMLCanvasElement
  main?: string
  functions?: string
  materialFuncs: RTMaterialFuncs[]
  rtUniform: RTUniform
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
}: Props) {
  const sceneUniformBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      },
    ],
  })

  const uniformBindGroup = device.createBindGroup({
    layout: sceneUniformBindGroupLayout,
    entries: [{ binding: 0, resource: { buffer: rtUniform.getBuffer() } }],
  })

  const bindGroupLayouts = [sceneUniformBindGroupLayout]

  const fragWGSL = getFragWGSL({
    main,
    functions,
    materialFuncs,
    rtUniformKeys: rtUniform.getKeysSortedByOffset(),
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

  function render({ camera }: RenderProps) {
    rtUniform.set('time', performance.now() / 1000)
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

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadOp: 'clear',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          storeOp: 'store',
        },
      ],
    }

    const commandEncoder = device.createCommandEncoder()

    const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor)
    renderPass.setPipeline(renderPipeline)
    renderPass.setBindGroup(0, uniformBindGroup)
    renderPass.draw(4, 1, 0, 0)
    renderPass.end()

    device.queue.submit([commandEncoder.finish()])
  }

  function setUniform(name: string, value: number) {
    rtUniform.set(name, value)
  }

  return { render, setUniform }
}

export default getRender
