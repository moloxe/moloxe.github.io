import{R as o}from"./ReTina.DaGLM_lD.js";const e=document.createElement("canvas");e.width=window.innerWidth*window.devicePixelRatio;e.height=window.innerHeight*window.devicePixelRatio;e.style.width=`${window.innerWidth}px`;e.style.height=`${window.innerHeight}px`;document.body.appendChild(e);const i=new o({canvas:e,main:`
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
  `}),d=i.registerUniform("mouseX"),s=i.registerUniform("mouseY");await i.build();document.addEventListener("mousemove",n=>{d(n.clientX*window.devicePixelRatio),s(n.clientY*window.devicePixelRatio)});function t(){i.shoot(),requestAnimationFrame(t)}t();
