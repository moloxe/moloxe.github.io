class RTPingPong {
  pingPongBindGroupLayout: GPUBindGroupLayout
  bindGroupPingIn: GPUBindGroup
  bindGroupPongIn: GPUBindGroup
  currentReadTexture: GPUTexture
  currentReadTextureView: GPUTextureView
  currentWriteTexture: GPUTexture
  currentWriteTextureView: GPUTextureView
  currentBindGroupIn: GPUBindGroup
  offscreenTextureSize: [number, number, number]

  constructor(
    canvas: HTMLCanvasElement,
    device: GPUDevice,
    presentationFormat: GPUTextureFormat
  ) {
    this.offscreenTextureSize = [canvas.width, canvas.height, 1]

    const pingTexture = device.createTexture({
      size: this.offscreenTextureSize,
      format: presentationFormat,
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_SRC,
    })

    const pongTexture = device.createTexture({
      size: this.offscreenTextureSize,
      format: presentationFormat,
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_SRC,
    })

    const pingTextureView = pingTexture.createView()
    const pongTextureView = pongTexture.createView()

    this.pingPongBindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'unfilterable-float' },
        },
      ],
    })

    this.bindGroupPingIn = device.createBindGroup({
      layout: this.pingPongBindGroupLayout,
      entries: [{ binding: 0, resource: pingTexture.createView() }],
    })

    this.bindGroupPongIn = device.createBindGroup({
      layout: this.pingPongBindGroupLayout,
      entries: [{ binding: 0, resource: pongTexture.createView() }],
    })

    this.currentReadTexture = pingTexture
    this.currentReadTextureView = pingTextureView
    this.currentWriteTexture = pongTexture
    this.currentWriteTextureView = pongTextureView
    this.currentBindGroupIn = this.bindGroupPingIn
  }

  preSubmit() {}

  swap() {
    const tempTexture = this.currentReadTexture
    const tempView = this.currentReadTextureView
    const tempBindGroup = this.currentBindGroupIn

    this.currentReadTexture = this.currentWriteTexture
    this.currentReadTextureView = this.currentWriteTextureView
    this.currentBindGroupIn =
      tempBindGroup === this.bindGroupPingIn
        ? this.bindGroupPongIn
        : this.bindGroupPingIn

    this.currentWriteTexture = tempTexture
    this.currentWriteTextureView = tempView
  }
}

export default RTPingPong
