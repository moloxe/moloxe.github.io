import parseCollisionShader from '../shaders/collision/parse-collision-shader'
import type { RTMaterialFuncs } from '../types'
import type RTTexture from './rt-texture'
import type RTUniform from './rt-uniform'

export type RTCollisionProps = {
  device: GPUDevice
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
  private paramsBindGroup: GPUBindGroup
  private paramsBuffer: GPUBuffer
  private uniformBindGroup: GPUBindGroup
  private resultBufferSize: number
  private resultBuffer: GPUBuffer
  private rtTexture: RTTexture


  constructor({
    device,
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

    this.paramsBuffer = device.createBuffer({
      size: 32, // Struct { i32, vec3f } -> 4 (i32) + 12 (padding) + 12 (vec3) + 4 (padding to 16 byte align) = 32? Actually WGSL alignment rules for structs.
      // struct CollisionParams { collisionGroup: i32, pos: vec3f }
      // collisionGroup: offset 0, size 4.
      // pos: offset 16 (vec3 alignment is 16), size 12.
      // total size 28 -> rounded to 32?
      // Let's be safe and use 32.
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    
    // Create BindGroup 2 for Params
    const paramsBindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'uniform' },
        },
      ],
    })

    this.paramsBindGroup = device.createBindGroup({
      layout: paramsBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.paramsBuffer } },
      ],
    })

    const bindGroupLayouts = [
      uniformBindGroupLayout,
      this.rtTexture.textureBindGroupLayout,
      paramsBindGroupLayout
    ]

    const collisionShader = parseCollisionShader({
      functions,
      rtUniformKeys,
      materialFuncs,
      nTextures,
      usePrevFrameTex,
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

  async checkCollision(collisionGroup: number, pos: { x: number; y: number; z: number }) {
    // Update params buffer
    // i32 at offset 0
    this.device.queue.writeBuffer(
      this.paramsBuffer,
      0,
      new Int32Array([collisionGroup])
    )
    // vec3f at offset 16 (16-byte alignment for vec3 in uniform)
    this.device.queue.writeBuffer(
      this.paramsBuffer,
      16,
      new Float32Array([pos.x, pos.y, pos.z])
    )

    const commandEncoder = this.device.createCommandEncoder()

    const passEncoder = commandEncoder.beginComputePass()

    passEncoder.setPipeline(this.computePipeline)

    passEncoder.setBindGroup(0, this.uniformBindGroup)

    const textureBindGroup = this.device.createBindGroup({
      layout: this.computePipeline.getBindGroupLayout(1),
      entries: this.rtTexture.getTextureEntries(),
    })

    passEncoder.setBindGroup(1, textureBindGroup)
    passEncoder.setBindGroup(2, this.paramsBindGroup)

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
