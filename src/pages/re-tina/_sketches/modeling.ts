import { ReTina } from '@ReTina'
import frameCounter from './utils/frameCounter'

const canvas = document.createElement('canvas')
canvas.width = window.innerWidth * window.devicePixelRatio
canvas.height = window.innerHeight * window.devicePixelRatio
canvas.style.width = `${window.innerWidth}px`
canvas.style.height = `${window.innerHeight}px`

document.body.appendChild(canvas)

const rt = new ReTina({
  canvas,
})

// Based on ./src/pages/tina/_sketches/rm-modeling.js

// TODO: REMOVE SMOOTHNESS
// opSmoothUnion is fine but...
// Modeling with a 'balance' might make more sense than making 2 sdFunctions

// Head
rt.registerMaterial({
  color: { r: 0.5, g: 0.5, b: 0.5 },
  sdFunc: /* wgsl */ `
    let dBox = sdBox(pos, vec3<f32>(0.24, 0.14, 0.14));
    let dSphere = sdSphere(pos, 0.54);
    const balance = 0.8;
    return (balance * dBox + (1.0 - balance) * dSphere) * 0.8;
  `,
})

// Sun glasses
rt.registerMaterial({
  smoothness: 0.02,
  pos: { x: 0, y: 0.03, z: 0.22 },
  color: { r: 0.1, g: 0.1, b: 0.1 },
  sdFunc: /* wgsl */ `
    let left  = sdBox(pos + vec3<f32>(-0.15, 0.0, 0.0), vec3<f32>(0.12, 0.08, 0.001));
    let right = sdBox(pos + vec3<f32>(0.15, 0.0, 0.0), vec3<f32>(0.12, 0.08, 0.001));
    let mid = sdCapsule(pos + vec3<f32>(0.0, -0.04, 0.0), vec3<f32>(0.05, 0, 0), vec3<f32>(-0.05, 0, 0), 0.01);
    return min(min(left, right), mid) * 0.8;
  `,
})

await rt.build()

let targetTheta = 0
let targetRadius = 2
document.addEventListener('mousemove', (event) => {
  const x = (event.clientY * window.devicePixelRatio) / canvas.height
  const y = (event.clientX * window.devicePixelRatio) / canvas.width
  targetRadius = 0.5 + x
  targetTheta = 2 * y * Math.PI * 2
})

const increaseFrame = frameCounter()
function draw() {
  rt.camera.spherical.theta += (targetTheta - rt.camera.spherical.theta) * 0.1
  rt.camera.spherical.radius +=
    (targetRadius - rt.camera.spherical.radius) * 0.1
  rt.shoot()
  requestAnimationFrame(draw)
  increaseFrame()
}

draw()
