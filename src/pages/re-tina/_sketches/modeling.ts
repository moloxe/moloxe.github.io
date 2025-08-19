import { ReTina } from '@ReTina'
import frameCounter from './utils/frameCounter'
import modelControls from './utils/modelControls'

const canvas = document.createElement('canvas')
canvas.width = window.innerWidth * window.devicePixelRatio
canvas.height = window.innerHeight * window.devicePixelRatio
canvas.style.width = `${window.innerWidth}px`
canvas.style.height = `${window.innerHeight}px`
canvas.style.height = `${window.innerHeight}px`

document.body.appendChild(canvas)

const rt = new ReTina({
  canvas,
})

rt.camera.fov = 60

// Based on ./src/pages/tina/_sketches/rm-modeling.js

// Head
rt.registerMaterial({
  color: { r: 0.5, g: 0.5, b: 0.5 },
  sdFunc: /* wgsl */ `
    let dBox = sdBox(pos, vec3<f32>(0.26, 0.14, 0.08));
    let dSphere = sdSphere(pos, 0.1);
    return opSmoothUnion(dBox, dSphere, 0.5);
  `,
})

// Sun glasses
rt.registerMaterial({
  pos: { x: 0, y: 0.03, z: 0.22 },
  color: { r: 0.1, g: 0.1, b: 0.1 },
  sdFunc: /* wgsl */ `
    let left  = sdBox(pos - vec3<f32>(0.15, 0.0, 0.0), vec3<f32>(0.12, 0.08, 0.001));
    let right = sdBox(pos - vec3<f32>(-0.15, 0.0, 0.0), vec3<f32>(0.12, 0.08, 0.001));
    let mid = sdCapsule(pos - vec3<f32>(0.0, 0.04, 0.0), vec3<f32>(0.05, 0, 0), vec3<f32>(-0.05, 0, 0), 0.01);
    return opSmoothUnion(min(left, right), mid, 0.02);
  `,
})

// Body
rt.registerMaterial({
  color: { r: 0.1, g: 0.3, b: 0.1 },
  sdFunc: /* wgsl */ `
    let dBody = sdCapsule(pos, vec3<f32>(0, -0.32, 0), vec3<f32>(0, -0.4, 0), 0.08);
    let leftLeg = sdCapsule(pos, vec3<f32>(-0.04, -0.45, 0), vec3<f32>(-0.07, -0.55, 0), 0.05);
    let rightLeg = sdCapsule(pos, vec3<f32>(0.04, -0.45, 0), vec3<f32>(0.07, -0.55, 0), 0.05);
    let dLegs = min(leftLeg, rightLeg);
    return opSmoothUnion(dBody, dLegs, 0.04);
  `,
})

// Environment
rt.registerMaterial({
  color: { r: 0.4, g: 0.4, b: 0.4 },
  sdFunc: /* wgsl */ `
    let dFloor = sdBox(pos - vec3<f32>(0, -1, 0), vec3<f32>(1, 0.01, 1));
    let dWall = sdBox(pos - vec3<f32>(0, 0, -1), vec3<f32>(1, 1, 0.01));
    return min(dFloor, dWall);
  `,
})

await rt.build()

const { getTargets } = modelControls(canvas, { radius: 2 })

const increaseFrameCounter = frameCounter()
function draw() {
  const target = getTargets()
  rt.camera.spherical.radius +=
    (target.radius - rt.camera.spherical.radius) * 0.1
  rt.camera.spherical.theta += (target.theta - rt.camera.spherical.theta) * 0.1
  rt.camera.spherical.phi += (target.phi - rt.camera.spherical.phi) * 0.1

  rt.shoot()
  requestAnimationFrame(draw)
  increaseFrameCounter()
}

draw()
