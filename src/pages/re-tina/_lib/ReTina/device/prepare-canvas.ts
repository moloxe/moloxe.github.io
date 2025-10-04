async function prepareCanvas(canvas: HTMLCanvasElement) {
  const gpu = navigator.gpu

  const adapter = await gpu.requestAdapter()

  if (!adapter) {
    throw new Error('No adapter found')
  }

  const f16Support = adapter.features.has('texture-compression-bc')

  if (!f16Support) {
    console.warn('shader-f16 not available')
  }

  const device = await adapter.requestDevice({
    requiredFeatures: f16Support ? ['shader-f16'] : [],
  })

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat()

  const context = canvas.getContext('webgpu')

  if (!context) {
    throw new Error('No context found')
  }

  context.configure({
    device,
    format: presentationFormat,
    alphaMode: 'premultiplied',
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
  })

  return { context, device, presentationFormat }
}

export default prepareCanvas
