class RTUniform {
  private device: GPUDevice
  private buffer: GPUBuffer
  private uniform: { [key: string]: { value: number; offSet: number } } = {}
  constructor(
    device: GPUDevice,
    uniform: {
      [key: string]: number
    }
  ) {
    this.device = device
    const keys = Object.keys(uniform)
    this.buffer = device.createBuffer({
      size: keys.length * 4, // 4 bytes per float
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    keys.forEach((key, index) => {
      this.uniform[key] = {
        value: uniform[key],
        offSet: index * 4,
      }
      this.set(key, uniform[key])
    })
  }
  getBuffer() {
    return this.buffer
  }
  getKeysSortedByOffset() {
    return Object.keys(this.uniform).toSorted((a, b) => {
      return this.uniform[a].offSet - this.uniform[b].offSet
    })
  }
  set(key: string, value: number) {
    if (!this.uniform[key]) throw new Error(`Uniform ${key} not found`)
    this.uniform[key].value = value
    this.device.queue.writeBuffer(
      this.buffer,
      this.uniform[key].offSet,
      new Float32Array([value])
    )
  }
  get(key: string) {
    if (!this.uniform[key]) throw new Error(`Uniform ${key} not found`)
    return this.uniform[key].value
  }
}

export default RTUniform
