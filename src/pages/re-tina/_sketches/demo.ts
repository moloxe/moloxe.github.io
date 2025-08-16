import { ReTina } from '@ReTina'

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

    if scene.dist > 0.0 {
      color = hsv2rgb(
        vec3f(uv.x, 0.5, scene.normal.z)
      ) + scene.color.rgb;
    }

    return vec4<f32>(color, 1.0);
  `,
})

rt.registerMaterial({
  color: { r: 0, g: 0, b: 0.5 },
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

rt.camera.spherical.radius = 2
document.addEventListener('mousemove', (event) => {
  const x = (event.clientY * window.devicePixelRatio) / canvas.height
  const y = (event.clientX * window.devicePixelRatio) / canvas.width
  rt.camera.spherical.radius = 1 + x
  rt.camera.spherical.theta = y * Math.PI * 2
})

let frameCounter = 0
function draw() {
  rt.camera.spherical.phi += 0.0008
  rt.shoot()
  frameCounter++
  requestAnimationFrame(draw)
}

draw()

const counter = document.createElement('div')
counter.setAttribute(
  'style',
  ` position: absolute;
    top: 0;
    left: 0;
    color: white;
    font-size: 24px;
    pointer-events: none;`
)

document.body.appendChild(counter)

setInterval(() => {
  counter.innerText = `FPS: ${frameCounter}`
  frameCounter = 0
}, 1000)
