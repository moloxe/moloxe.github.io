import type { RenderProps } from '../types'
import vertWGSL from './../shaders/vert.wgsl?raw'
import getFragWGSL from './../utils/get-frag-wgsl'
import RTUniform from './rt-uniform'

// Based on:
// https://webgpulab.xbdev.net/index.php?page=editor&id=mandelbulbbasic3&
// https://www.youtube.com/watch?v=rPp7HZFNXnM

type Props = {
  device: GPUDevice
  presentationFormat: GPUTextureFormat
  context: GPUCanvasContext
  canvas: HTMLCanvasElement
  main: string
  map?: string
  initialUniforms: {
    camPosX: number
    camPosY: number
    camPosZ: number
    camSphericalR: number
    camSphericalT: number
    camSphericalP: number
    camFov: number
  }
}

async function getRender({
  device,
  presentationFormat,
  context,
  canvas,
  main,
  map,
  initialUniforms,
}: Props) {
  const rtUniform = new RTUniform(device, {
    time: 0,
    aspectRatio: canvas.width / canvas.height,
    camPosX: initialUniforms.camPosX ?? 0,
    camPosY: initialUniforms.camPosY ?? 0,
    camPosZ: initialUniforms.camPosZ ?? 0,
    camSphericalR: initialUniforms.camSphericalR ?? 0,
    camSphericalT: initialUniforms.camSphericalT ?? 0,
    camSphericalP: initialUniforms.camSphericalP ?? 0,
    camFov: initialUniforms.camFov ?? 90,
  })

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
    entries: [{ binding: 0, resource: { buffer: rtUniform.buffer } }],
  })

  const fragWGSL = getFragWGSL({ main, map, rtUniformKeys: rtUniform.keys })

  const renderPipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [sceneUniformBindGroupLayout],
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

  return { render }
}

export default getRender
