class RTUniform {
  device: GPUDevice
  buffer: GPUBuffer
  keys: string[]
  values: Float32Array<ArrayBuffer>
  constructor(
    device: GPUDevice,
    uniform: {
      [key: string]: number
    }
  ) {
    this.device = device
    // 4 bytes per float
    const size = Object.keys(uniform).length * 4
    this.buffer = device.createBuffer({
      size,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    this.keys = Object.keys(uniform)
    this.values = new Float32Array(Object.values(uniform))
  }
  set(key: string, value: number) {
    const index = this.keys.indexOf(key)
    if (index === -1) throw new Error(`Uniform ${key} not found`)
    this.values[index] = value
    this.device.queue.writeBuffer(
      this.buffer,
      index * 4,
      new Float32Array([value])
    )
  }
}

export default RTUniform
