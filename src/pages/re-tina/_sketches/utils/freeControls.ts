import type { ReTina } from '../../_lib'

function freeControls(rt: ReTina) {
  const canvas = rt.canvas
  canvas.style.cursor = 'grab'

  let mousePressed = false
  let prevX: number
  let prevY: number

  function actionDown(coord: { x: number; y: number }) {
    mousePressed = true
    prevX = coord.x
    prevY = coord.y
  }

  document.addEventListener('mousedown', ({ clientX, clientY }) => {
    actionDown({ x: clientX, y: clientY })
    canvas.style.cursor = 'grabbing'
  })
  document.addEventListener('touchstart', ({ changedTouches }) => {
    const touch = changedTouches[0]
    actionDown({ x: touch.clientX, y: touch.clientY })
  })

  function actionMove(coord: { x: number; y: number }) {
    rt.camera.spherical.theta += (3 * (prevX - coord.x)) / window.innerWidth
    rt.camera.spherical.phi += (3 * (prevY - coord.y)) / window.innerHeight
    prevX = coord.x
    prevY = coord.y
  }

  document.addEventListener('mousemove', (event) => {
    if (!mousePressed) return
    actionMove({ x: event.clientX, y: event.clientY })
  })
  document.addEventListener('touchmove', (event) => {
    if (!mousePressed) return
    const touch = event.changedTouches[0]
    actionMove({ x: touch.clientX, y: touch.clientY })
  })

  document.addEventListener('mouseup', () => {
    mousePressed = false
    canvas.style.cursor = 'grab'
  })
  document.addEventListener('touchend', () => {
    mousePressed = false
  })

  document.addEventListener('wheel', (event) => {
    rt.camera.spherical.radius += event.deltaY * 0.001
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
      UP: codes['KeyE'],
      DOWN: codes['KeyQ'],
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
