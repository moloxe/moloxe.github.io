async function getDevice() {
  const adapter = await navigator.gpu.requestAdapter()

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

  return {
    device,
    presentationFormat: navigator.gpu.getPreferredCanvasFormat(),
  }
}

export default getDevice
