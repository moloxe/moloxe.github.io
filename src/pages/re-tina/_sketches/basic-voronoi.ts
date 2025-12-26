import { ReTina } from '@ReTina'

const rt = new ReTina({
  functions: /* wgsl */ `
    const nPoints = 12;
    const power = 2f;
    fn pdist(pos1: vec2f, pos2: vec2f) -> f32 {
      return pow(
        pow(abs(pos1.x - pos2.x), power) +
        pow(abs(pos1.y - pos2.y), power), 1 / power);
    }
  `,
  main: /* wgsl */ `
    let xy = uv * vec2f(U.width, U.height);

    var minD = 1e9;
    var minIndex = -1;
    let t = U.time * 0.03;
    for (var i: i32 = 0; i < nPoints; i++) {
      let x = (snoise(vec2f(f32(i), t)) * 0.5 + 0.5) * U.width;
      let y = (snoise(vec2f(f32(i) + 1e3, t)) * 0.5 + 0.5) * U.height;
      let dist = pdist(xy, vec2f(x, y));
      if dist < minD {
        minD = dist;
        minIndex = i;
      }
    }

    let dMouse = pdist(xy, vec2f(U.mouseX, U.mouseY));
    var hue = f32(minIndex) / f32(nPoints);
    if dMouse < minD {
        hue = 1.;
        minD = dMouse;
    }
    var color = mix(
      hsv2rgb(vec3f(hue, .6, 1)),
      vec3(0.),
      log(minD / 10) / 4
    );
    return vec4f(color, 1);
  `,
})

const setMouseX = rt.registerUniform('mouseX')
const setMouseY = rt.registerUniform('mouseY')

document.addEventListener('mousemove', (event) => {
  setMouseX(event.clientX)
  setMouseY(event.clientY)
})

rt.start()
