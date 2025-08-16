import { ReTina } from '@ReTina'
import frameCounter from './utils/frameCounter'

const canvas = document.createElement('canvas')
canvas.width = window.innerWidth * window.devicePixelRatio
canvas.height = window.innerHeight * window.devicePixelRatio
canvas.style.width = `${window.innerWidth}px`
canvas.style.height = `${window.innerHeight}px`

document.body.appendChild(canvas)

// Shader based on: https://webgpulab.xbdev.net/index.php?page=editor&id=mandelbulbbasic3&
const rt = new ReTina({
  canvas,
  main: /* wgsl */ `
    let scene = calcScene(uv);
    let color = hsv2rgb(vec3<f32>(uv.x, 0.5, scene.normal.z));
    return vec4<f32>(color, 1.0);
  `,
})

rt.registerMaterial({
  sdFunc: /* wgsl */ `
    var thres = length(pos) - 1.2;
    if thres > 0.2 {
        return thres;
    }

    var power = 6.0 + U.time * 0.1;
    var z = pos;
    var c = pos;

    var dr = 1.0;
    var r = 0.0;
    for (var i: i32 = 0; i < 5; i++) {        
        r = length(z);
        if r > 2.0 { break; }
        var theta = acos(z.z / r);
        var phi = atan2(z.y, z.x);
        dr = pow(r, power - 1.0) * power * dr + 1.0;
        var zr = pow(r, power);
        theta *= power;
        phi *= power;
        z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));
        z += c;
    }
    return 0.5 * log(r) * r / dr;
  `,
})

await rt.build()

let targetTheta = 0
let targetRadius = 2
document.addEventListener('mousemove', (event) => {
  const x = (event.clientY * window.devicePixelRatio) / canvas.height
  const y = (event.clientX * window.devicePixelRatio) / canvas.width
  targetRadius = 1 + x * 2
  targetTheta = y * Math.PI * 2
})

const increaseFrame = frameCounter()
function draw() {
  rt.camera.spherical.phi += 0.001
  rt.camera.spherical.theta += (targetTheta - rt.camera.spherical.theta) * 0.1
  rt.camera.spherical.radius +=
    (targetRadius - rt.camera.spherical.radius) * 0.1
  rt.shoot()
  requestAnimationFrame(draw)
  increaseFrame()
}

draw()
