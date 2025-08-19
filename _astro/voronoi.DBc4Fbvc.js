import{R as t}from"./ReTina.DDuzLWef.js";const e=document.createElement("canvas");e.width=window.innerWidth*window.devicePixelRatio;e.height=window.innerHeight*window.devicePixelRatio;e.style.width=`${window.innerWidth}px`;e.style.height=`${window.innerHeight}px`;document.body.appendChild(e);const i=new t({canvas:e,functions:`
    fn pdist(pos1: vec2<f32>, pos2: vec2<f32>, p: f32) -> f32 {
      return pow(
        pow(abs(pos1.x - pos2.x), p) +
        pow(abs(pos1.y - pos2.y), p),
      1. / p);
    }
  `,main:`
    let xy = uv * vec2<f32>(U.width, U.height);
    let power = 3.;

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
      log(minD / 20.) / 4.
    );
    return vec4<f32>(color, 1.0);
  `}),s=i.registerUniform("mouseX"),d=i.registerUniform("mouseY");await i.build();document.addEventListener("mousemove",n=>{s(n.clientX*window.devicePixelRatio),d(n.clientY*window.devicePixelRatio)});function o(){i.shoot(),requestAnimationFrame(o)}o();
