import { ReTina } from '@ReTina'

const canvas = document.createElement('canvas')
canvas.width = window.innerWidth * window.devicePixelRatio
canvas.height = window.innerHeight * window.devicePixelRatio
canvas.style.width = `${window.innerWidth}px`
canvas.style.height = `${window.innerHeight}px`

document.body.appendChild(canvas)

const rt = new ReTina({
  canvas,
  main: /* wgsl */ `
    let xy = uv * vec2<f32>(U.width, U.height);

    var minD = 1e9;
    var minIndex = -1;
    let t = U.time * 0.03;
    let nPoints = 10;
    for (var i: i32 = 0; i < nPoints; i++) {
      let x = (snoise(vec2<f32>(f32(i), t)) * 0.5 + 0.5) * U.width;
      let y = (snoise(vec2<f32>(f32(i) + 1e3, t)) * 0.5 + 0.5) * U.height;
      let d = length(xy - vec2<f32>(x, y));
      if d < minD {
        minD = d;
        minIndex = i;
      }
    }

    let dMouse = length(xy - vec2<f32>(U.mouseX, U.mouseY));
    var hue = f32(minIndex) / f32(nPoints - 1);
    if dMouse < minD {
        hue = .1;
        minD = dMouse;
    }
    var color = mix(
      hsv2rgb(vec3<f32>(hue, .6, 1.)),
      vec3(0.),
      log(minD / 60.) / 3.
    );
    return vec4<f32>(color, 1.0);
  `,
})

const setMouseX = rt.registerUniform('mouseX')
const setMouseY = rt.registerUniform('mouseY')

await rt.build()

document.addEventListener('mousemove', (event) => {
  setMouseX(event.clientX * window.devicePixelRatio)
  setMouseY(event.clientY * window.devicePixelRatio)
})

function draw() {
  rt.shoot()
  requestAnimationFrame(draw)
}

draw()
