export function dumbFsCanvas(height?: number) {
  const canvas = document.createElement('canvas')

  canvas.height = height ?? window.innerHeight
  canvas.width = canvas.height * (window.innerWidth / window.innerHeight)

  canvas.style.width = '100vw'
  canvas.style.height = '100vh'

  if (height) {
    canvas.style.imageRendering = 'pixelated'
  }

  document.body.appendChild(canvas)

  return canvas
}
