type Props = {
  width?: number
  height?: number
  pixelated?: boolean
  useExactPixels?: boolean
}

function fsCanvas({ width, height, pixelated, useExactPixels }: Props = {}) {
  const ratio = useExactPixels ? window.devicePixelRatio : 1
  const canvas = document.createElement('canvas')

  canvas.width = (width ?? window.innerWidth) * ratio
  canvas.height = (height ?? window.innerHeight) * ratio

  canvas.style.width = '100vw'
  canvas.style.height = '100vh'

  if (pixelated) {
    canvas.style.imageRendering = 'pixelated'
  }

  document.body.appendChild(canvas)

  return canvas
}

export default fsCanvas
