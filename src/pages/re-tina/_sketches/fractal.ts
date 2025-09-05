import { ReTina } from '@ReTina'
import frameCounter from './utils/frameCounter'
import freeControls from './utils/freeControls'

const canvas = document.createElement('canvas')
canvas.width = window.innerWidth
canvas.height = window.innerHeight
canvas.style.width = '100vw'
canvas.style.height = '100vh'

document.body.appendChild(canvas)

const rt = new ReTina({
  canvas,
})

// Based on: https://shaders.skia.org/?id=ed72577c437c036447372e4c873462fc1bbfc0cb5e9fb0630ab1c07368a0db48
rt.registerMaterial({
  sdFunc: /* wgsl */ `
    pos = asin(sin(pos)) - vec3<f32>(3.0);
    for (var i = 0; i < 9; i++) {
        pos = abs(vec3<f32>(pos.xz, pos.y).xzy);
        if (pos.x < pos.y) {
            pos = pos.zxy;
        } else {
            pos = pos.zyx;
        }
        pos = pos + pos - vec3<f32>(1.0, 3.0, 7.0);
    }
    let dist = max(pos.x, pos.z) / 1000.0 - 0.01;
    return dist;
  `,
  lightFunc: /* wgsl */ `
    var spec = 0.;
    let lambertian = dot(normal, -rd);
    if lambertian > 0. {
        let lightDir = normalize(ro - pos);
        let halfDir = normalize(lightDir + -rd);
        spec = pow(max(dot(halfDir, normal), 0.), 2000.);
    }
    var dd = length(pos - ro); dd = 1 + (dd * dd  * .01);
    var out = normal * normal;
    out = rgb2hsv(out);
    out = hsv2rgb(vec3<f32>(out.x + U.time * .2 + sin(pos.x + pos.y) / 4., .6, .6));
    out = (out * lambertian + spec) / dd;
    return vec4<f32>(out, 1.);
  `,
})

await rt.build()

rt.camera.fov = 100
rt.camera.spherical = {
  radius: 0,
  phi: 0,
  theta: 0.2,
}

freeControls(rt)

const increaseFrameCounter = frameCounter()
function draw() {
  rt.camera.pos.z -= 0.005
  rt.shoot()
  requestAnimationFrame(draw)
  increaseFrameCounter()
}

draw()
