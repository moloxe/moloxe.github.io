import { ReTina } from '../_lib'

const canvas = document.createElement('canvas')
canvas.width = window.innerWidth * window.devicePixelRatio
canvas.height = window.innerHeight * window.devicePixelRatio
canvas.style.width = `${window.innerWidth}px`
canvas.style.height = `${window.innerHeight}px`

document.body.appendChild(canvas)

const rt = new ReTina({
  canvas,
})

rt.registerMaterial({
  sdFunc: `
    let t = U.time * .3;
    pos = rotate(pos, vec3<f32>(0, t, -t));
    pos += vec3<f32>(cos(-t) * 16, 2.4, sin(-t) * 16);
    return (sin(pos.y) - (cos(pos.x) + cos(pos.y) + cos(pos.z))) * .6;
  `,
  lightFunc: `
    var c = normal * .5 + .5;
    let dist = length(pos - ro);
    let bri = pow(sin(dist * PI / 6.), 6.);
    c *= (bri + U.pulse);
    return vec4(c, 1.);
  `,
})

let pulse = 0
const setUniformPulse = rt.registerUniform('pulse', pulse)

canvas.addEventListener('click', () => {
  pulse = 1
  setUniformPulse(pulse)
})

await rt.build()

let lastTime = performance.now()
function draw() {
  const time = performance.now()
  const pulseSlowdown = 0.2 / (time - lastTime)
  lastTime = time

  rt.shoot()
  requestAnimationFrame(draw)

  pulse -= pulseSlowdown
  pulse = Math.max(0, pulse)
  setUniformPulse(pulse)
}

draw()
