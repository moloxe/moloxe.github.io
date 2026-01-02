import { ReTina } from '@ReTina'

const rt = new ReTina()

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
    let bri = pow(max(0, sin(dist * PI / 6.)), 6.) + U.pulse;
    c *= bri;
    return vec4(c, 1.);
  `,
})

let pulse = 0
const setPulse = rt.registerUniform('pulse', pulse)

rt.canvas.addEventListener('click', () => {
  pulse = 1
})

let lastTime = performance.now()
rt.start({
  onFrame() {
    const time = performance.now()
    const pulseSlowdown = 0.1 / (time - lastTime)
    pulse = Math.max(0, pulse - pulseSlowdown)
    setPulse(pulse)
    lastTime = time
  },
})
