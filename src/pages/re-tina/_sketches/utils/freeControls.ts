import type { ReTina } from '../../_lib'

function freeControls(rt: ReTina) {
  const canvas = rt.canvas
  canvas.style.cursor = 'grab'

  let mousePressed = false
  let prevMouseX: number
  let prevMouseY: number

  document.addEventListener('mousedown', (event) => {
    mousePressed = true
    prevMouseX = event.clientX
    prevMouseY = event.clientY
    canvas.style.cursor = 'grabbing'
  })

  document.addEventListener('mousemove', (event) => {
    if (!mousePressed) return
    rt.camera.spherical.theta +=
      (3 * (prevMouseX - event.clientX)) / window.innerWidth
    rt.camera.spherical.phi +=
      (3 * (prevMouseY - event.clientY)) / window.innerHeight
    prevMouseX = event.clientX
    prevMouseY = event.clientY
  })

  document.addEventListener('mouseup', () => {
    mousePressed = false
    canvas.style.cursor = 'grab'
  })

  document.addEventListener('wheel', (event) => {
    rt.camera.spherical.radius += event.deltaY * 0.01
  })

  const vel = [0, 0, 0]
  const acc = 0.002

  keyboardListener((move) => {
    const yAngle = rt.camera.spherical.theta

    if (move.UP) {
      vel[1] += acc
    }
    if (move.DOWN) {
      vel[1] -= acc
    }
    if (move.FRONT) {
      vel[0] -= acc * Math.sin(yAngle)
      vel[2] -= acc * Math.cos(yAngle)
    }
    if (move.BACK) {
      vel[0] += acc * Math.sin(yAngle)
      vel[2] += acc * Math.cos(yAngle)
    }
    if (move.LEFT) {
      vel[0] -= acc * Math.cos(yAngle)
      vel[2] += acc * Math.sin(yAngle)
    }
    if (move.RIGHT) {
      vel[0] += acc * Math.cos(yAngle)
      vel[2] -= acc * Math.sin(yAngle)
    }

    rt.camera.pos.x += vel[0]
    rt.camera.pos.y += vel[1]
    rt.camera.pos.z += vel[2]

    vel[0] *= 0.9
    vel[1] *= 0.9
    vel[2] *= 0.9
  })
}

function keyboardListener(
  cb: (state: {
    UP?: boolean
    DOWN?: boolean
    FRONT?: boolean
    BACK?: boolean
    LEFT?: boolean
    RIGHT?: boolean
  }) => void
) {
  const codes: { [key: string]: boolean } = {}
  window.addEventListener('keydown', (event) => {
    event.preventDefault()
    codes[event.code] = true
  })
  window.addEventListener('keyup', (event) => {
    event.preventDefault()
    codes[event.code] = false
  })
  function update() {
    cb({
      UP: codes['Space'],
      DOWN: codes['MetaLeft'] || codes['ControlLeft'],
      FRONT: codes['KeyW'],
      BACK: codes['KeyS'],
      LEFT: codes['KeyA'],
      RIGHT: codes['KeyD'],
    })
    requestAnimationFrame(update)
  }
  update()
}

export default freeControls
