import{R as t}from"./ReTina.B4Rf-Pwk.js";const e=new t({functions:`
    const nPoints = 7;
    fn pdist(pos1: vec2f, pos2: vec2f) -> f32 {
      return pow(
        pow(abs(pos1.x - pos2.x), U.power) +
        pow(abs(pos1.y - pos2.y), U.power), 1 / U.power);
    }
  `,main:`
    let xy = uv * vec2f(U.width, U.height);

    var minD = 1e9;
    var minIndex = -1;
    let t = (U.time + U.timestamp) * 0.01;
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
    var hue = f32(minIndex) / f32(nPoints + 1);
    if dMouse < minD {
        hue = f32(nPoints) / f32(nPoints + 1);
        minD = dMouse;
    }

    var color = hsv2rgb(vec3f(hue + 0.7, .6, .5));
    let bg = hsv2rgb(vec3(.5, .5, .05));

    color = mix(color, bg, log(minD / 5) / 4);

    return vec4f(color, 1f);
  `}),i=e.registerUniform("mouseX"),s=e.registerUniform("mouseY");e.registerUniform("power",Math.round(1+Math.random()*3));e.registerUniform("timestamp",Date.now()%1e3);e.canvas.style.zIndex="-1";e.start({onBuild(){document.addEventListener("mousemove",o=>{i(o.clientX),s(o.clientY)})}});const r=Object.freeze(Object.defineProperty({__proto__:null},Symbol.toStringTag,{value:"Module"}));export{r as b};
