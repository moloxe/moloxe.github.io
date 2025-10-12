import type { RTTex } from '../types'

class RTTexture {
  private texs: RTTex[]
  private device: GPUDevice
  private presentationFormat: GPUTextureFormat
  private textures: GPUTexture[]
  private textureEntries: GPUBindGroupEntry[]
  textureBindGroupLayout: GPUBindGroupLayout

  constructor(
    device: GPUDevice,
    presentationFormat: GPUTextureFormat,
    texs: RTTex[]
  ) {
    this.texs = texs
    this.device = device
    this.presentationFormat = presentationFormat
    this.textures = this.texs.map(({ width, height }) =>
      this.device.createTexture({
        size: [width, height, 1],
        format: this.presentationFormat,
        usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
      })
    )
    this.textureEntries = this.textures.map((texture, binding) => ({
      binding,
      resource: texture.createView(),
    }))
    this.textureBindGroupLayout = device.createBindGroupLayout({
      entries: texs.map((_, binding) => ({
        binding,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: 'unfilterable-float' },
      })),
    })
  }

  setTexture(index: number, textureData: Uint8Array) {
    const width = this.texs[index].width
    const height = this.texs[index].height
    const texture = this.textures[index]
    this.device.queue.writeTexture(
      { texture },
      textureData as any, // It may be a problem with "@webgpu/types" expecting Uint8Array<ArrayBufferLike>
      { offset: 0, bytesPerRow: width * 4, rowsPerImage: height },
      [width, height, 1]
    )
    this.textureEntries[index].resource = texture.createView()
  }

  getTextureEntries() {
    return this.textureEntries
  }
}

export default RTTexture
