type Target = {
  theta: number
  phi: number
  radius: number
}

function modelControls(
  canvas: HTMLCanvasElement,
  initTarget?: Partial<Target>
) {
  let targetTheta = initTarget?.theta ?? 0
  let targetPhi = initTarget?.phi ?? 0
  let targetRadius = initTarget?.radius ?? 0

  let mousePressed = false
  let startMouseX: number
  let startMouseY: number

  document.addEventListener('mousedown', (event) => {
    mousePressed = true
    startMouseX = event.clientX
    startMouseY = event.clientY
  })

  document.addEventListener('mouseup', () => {
    mousePressed = false
  })

  document.addEventListener('mousemove', (event) => {
    if (!mousePressed) return
    const x =
      ((startMouseX - event.clientX) * window.devicePixelRatio) / canvas.width
    const y =
      ((startMouseY - event.clientY) * window.devicePixelRatio) / canvas.height
    targetTheta = 2 * x * Math.PI * 2
    targetPhi = 2 * y * Math.PI * 2
  })

  document.addEventListener('wheel', (event) => {
    targetRadius += event.deltaY * 0.001
  })

  function getTargets() {
    return {
      theta: targetTheta,
      phi: targetPhi,
      radius: targetRadius,
    }
  }

  return {
    getTargets,
  }
}

export default modelControls
