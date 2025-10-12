import { ReTina } from '@ReTina'

const rt = new ReTina({
  functions: /* wgsl */ `
    fn pdist(pos1: vec2<f32>, pos2: vec2<f32>, p: f32) -> f32 {
      return pow(
        pow(abs(pos1.x - pos2.x), p) +
        pow(abs(pos1.y - pos2.y), p),
      1. / p);
    }
  `,
  main: /* wgsl */ `
    let xy = uv * vec2<f32>(U.width, U.height);
    let power = 4.;

    var minD = 1e9;
    var minIndex = -1;
    let t = U.time * 0.03;
    let nPoints = 10;
    for (var i: i32 = 0; i < nPoints; i++) {
      let x = (snoise(vec2<f32>(f32(i), t)) * 0.5 + 0.5) * U.width;
      let y = (snoise(vec2<f32>(f32(i) + 1e3, t)) * 0.5 + 0.5) * U.height;
      let d = pdist(xy, vec2<f32>(x, y), power);
      if d < minD {
        minD = d;
        minIndex = i;
      }
    }

    let dMouse = pdist(xy, vec2<f32>(U.mouseX, U.mouseY), power);
    var hue = f32(minIndex) / f32(nPoints);
    if dMouse < minD {
        hue = 1.;
        minD = dMouse;
    }
    var color = mix(
      hsv2rgb(vec3<f32>(hue, .6, 1.)),
      vec3(0.),
      log(minD / 10.) / 4.
    );
    return vec4<f32>(color, 1.0);
  `,
})

const setMouseX = rt.registerUniform('mouseX')
const setMouseY = rt.registerUniform('mouseY')

document.addEventListener('mousemove', (event) => {
  setMouseX(event.clientX)
  setMouseY(event.clientY)
})

await rt.buildAndRun()
