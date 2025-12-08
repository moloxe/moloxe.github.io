import parseCollisionShader from '../shaders/collision/parse-collision-shader'
import type { RTMaterialFuncs } from '../types'
import type RTTexture from './rt-texture'
import type RTUniform from './rt-uniform'

export type RTCollisionProps = {
  device: GPUDevice
  collisionGroup: number
  rtUniformKeys: string[]
  functions?: string
  materialFuncs: RTMaterialFuncs[]
  nTextures: number
  usePrevFrameTex?: boolean
  rtUniform: RTUniform
  rtTexture: RTTexture
}

class RTCollision {
  private device: GPUDevice
  private computePipeline: GPUComputePipeline
  private uniformBindGroup: GPUBindGroup
  private resultBufferSize: number
  private resultBuffer: GPUBuffer
  private rtTexture: RTTexture

  constructor({
    device,
    collisionGroup,
    functions,
    rtUniformKeys,
    materialFuncs,
    nTextures,
    usePrevFrameTex,
    rtUniform,
    rtTexture,
  }: RTCollisionProps) {
    this.device = device
    this.rtTexture = rtTexture

    // 1: Material-Index
    // 1: Collision-Dist
    // 3: Collision-Normal
    const elements = 1 + 1 + 3
    this.resultBufferSize = Float32Array.BYTES_PER_ELEMENT * elements
    this.resultBuffer = device.createBuffer({
      size: this.resultBufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    })

    const { uniformBindGroupLayout, uniformBindGroup } =
      rtUniform.getCustomBindingsForCollisions(this.resultBuffer)
    this.uniformBindGroup = uniformBindGroup

    const bindGroupLayouts = [
      uniformBindGroupLayout,
      this.rtTexture.textureBindGroupLayout,
    ]

    const collisionShader = parseCollisionShader({
      functions,
      rtUniformKeys,
      materialFuncs,
      nTextures,
      usePrevFrameTex,
      collisionGroup,
    })

    this.computePipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts,
      }),
      compute: {
        module: device.createShaderModule({ code: collisionShader }),
        entryPoint: 'main',
      },
    })
  }

  async checkCollision() {
    const commandEncoder = this.device.createCommandEncoder()

    const passEncoder = commandEncoder.beginComputePass()

    passEncoder.setPipeline(this.computePipeline)

    passEncoder.setBindGroup(0, this.uniformBindGroup)

    const textureBindGroup = this.device.createBindGroup({
      layout: this.computePipeline.getBindGroupLayout(1),
      entries: this.rtTexture.getTextureEntries(),
    })

    passEncoder.setBindGroup(1, textureBindGroup)

    passEncoder.dispatchWorkgroups(1)
    passEncoder.end()

    const readBuffer = this.device.createBuffer({
      size: this.resultBufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    })

    commandEncoder.copyBufferToBuffer(
      this.resultBuffer,
      0,
      readBuffer,
      0,
      this.resultBufferSize
    )

    this.device.queue.submit([commandEncoder.finish()])

    await readBuffer.mapAsync(GPUMapMode.READ)

    const resultArray = new Float32Array(readBuffer.getMappedRange())

    try {
      const materialIndex = resultArray[0]
      const collisionDist = resultArray[1]
      const collisionNormal = {
        x: resultArray[2],
        y: resultArray[3],
        z: resultArray[4],
      }

      return {
        materialIndex,
        collisionDist,
        collisionNormal,
      }
    } finally {
      readBuffer.unmap()
    }
  }
}

export default RTCollision
