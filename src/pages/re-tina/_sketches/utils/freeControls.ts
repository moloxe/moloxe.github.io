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
      (3 * (prevMouseX - event.clientX)) / canvas.width
    rt.camera.spherical.phi +=
      (3 * (prevMouseY - event.clientY)) / canvas.height
    prevMouseX = event.clientX
    prevMouseY = event.clientY
  })

  document.addEventListener('mouseup', () => {
    mousePressed = false
    canvas.style.cursor = 'grab'
  })

  document.addEventListener('wheel', (event) => {
    rt.camera.spherical.radius += event.deltaY * 0.1
  })

  const vel = [0, 0, 0]
  const acc = 0.02
  function move(move: string) {
    const yAngle = rt.camera.spherical.theta
    if (move === 'UP') {
      vel[1] += 0.05
    }
    if (move === 'DOWN') {
      vel[1] -= 0.05
    }
    if (move === 'FRONT') {
      vel[0] -= acc * Math.sin(yAngle)
      vel[2] -= acc * Math.cos(yAngle)
    }
    if (move === 'BACK') {
      vel[0] += acc * Math.sin(yAngle)
      vel[2] += acc * Math.cos(yAngle)
    }
    if (move === 'LEFT') {
      vel[0] -= acc * Math.cos(yAngle)
      vel[2] += acc * Math.sin(yAngle)
    }
    if (move === 'RIGHT') {
      vel[0] += acc * Math.cos(yAngle)
      vel[2] -= acc * Math.sin(yAngle)
    }
  }

  keyboardListener({
    Space: () => move('UP'),
    MetaLeft: () => move('DOWN'),
    ControlLeft: () => move('DOWN'),
    KeyW: () => move('FRONT'),
    KeyS: () => move('BACK'),
    KeyA: () => move('LEFT'),
    KeyD: () => move('RIGHT'),
  })

  let lastTime = performance.now()
  const freq = 1000 / 60
  setInterval(() => {
    const now = performance.now()
    const delta = (now - lastTime) / freq
    lastTime = now

    rt.camera.pos.x += vel[0] * delta
    rt.camera.pos.y += vel[1] * delta
    rt.camera.pos.z += vel[2] * delta

    vel[0] *= 0.9
    vel[1] *= 0.9
    vel[2] *= 0.9
  }, freq)
}

function keyboardListener(actions: { [key: string]: () => void }) {
  const codes: { [key: string]: boolean } = {}
  const keys = Object.keys(actions)
  window.addEventListener('keydown', (event) => {
    event.preventDefault()
    codes[event.code] = true
  })
  window.addEventListener('keyup', (event) => {
    event.preventDefault()
    codes[event.code] = false
  })
  setInterval(() => {
    keys.forEach((key) => {
      if (codes[key]) actions[key]()
    })
  }, 1000 / 60)
}

export default freeControls
