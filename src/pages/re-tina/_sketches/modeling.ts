import { ReTina } from '@ReTina'
import frameCounter from './utils/frameCounter'
import freeControls from './utils/freeControls'

const canvas = document.createElement('canvas')
canvas.width = window.innerWidth * window.devicePixelRatio
canvas.height = window.innerHeight * window.devicePixelRatio
canvas.style.width = `${window.innerWidth}px`
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
  color: { r: 0, g: 0, b: 0 },
  lightFunc: /* wgsl */ `
    var spec = 0.;
    let lambertian = dot(normal, -rd);
    if lambertian > 0. {
        let lightDir = normalize(ro - pos);
        let halfDir = normalize(lightDir + -rd);
        spec = pow(max(dot(halfDir, normal), 0.), 512.);
    }
    return vec4<f32>(color * lambertian + spec, 1.);
  `,
  sdFunc: /* wgsl */ `
    let left  = sdBox(pos - vec3<f32>(0.15, 0.0, 0.0), vec3<f32>(0.12, 0.08, 0.001));
    let right = sdBox(pos - vec3<f32>(-0.15, 0.0, 0.0), vec3<f32>(0.12, 0.08, 0.001));
    let mid = sdCapsule(pos - vec3<f32>(0.0, 0.04, 0.0), vec3<f32>(0.05, 0, 0), vec3<f32>(-0.05, 0, 0), 0.01);
    return opSmoothUnion(min(left, right), mid, 0.02);
  `,
})

// Body
rt.registerMaterial({
  lightFunc: /* wgsl */ `
    var n = snoise3d(pos * 20.);
    n = snoise3d(vec3<f32>(pos.xy, n + U.time)) * 0.5 + 0.5;
    n = pow(n, 2.0);
    let c = hsv2rgb(vec3<f32>(pos.y + U.time, 1.0 - n, n));
    let lambertian = dot(normal, -rd);
    return vec4<f32>(c * lambertian, 1.);
  `,
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

rt.camera.pos = {
  x: 0,
  y: -0.2,
  z: -0.5,
}
rt.camera.spherical = {
  radius: 1.5,
  phi: -0.2,
  theta: 0.15,
}
freeControls(rt)

const increaseFrameCounter = frameCounter()
function draw() {
  rt.shoot()
  requestAnimationFrame(draw)
  increaseFrameCounter()
}

draw()
