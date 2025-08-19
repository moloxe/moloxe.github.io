import { ReTina } from '@ReTina'
import frameCounter from './utils/frameCounter'
import modelControls from './utils/modelControls'

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
    var color = vec3<f32>(0.0);
    if scene.materialIndex != -1 {
        let bri = max(max(scene.color.rgb.r, scene.color.rgb.g), scene.color.rgb.b);
        color = hsv2rgb(vec3<f32>(uv.x, 0.5, bri));
    }
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

const { getTargets } = modelControls(canvas, { radius: 2 })
const increaseFrameCounter = frameCounter()
function draw() {
  const target = getTargets()
  rt.camera.spherical.radius +=
    (target.radius - rt.camera.spherical.radius) * 0.1
  rt.camera.spherical.theta += (target.theta - rt.camera.spherical.theta) * 0.1
  rt.camera.spherical.phi += 0.1
  rt.camera.spherical.phi += (target.phi - rt.camera.spherical.phi) * 0.1

  rt.shoot()
  requestAnimationFrame(draw)
  increaseFrameCounter()
}

draw()
