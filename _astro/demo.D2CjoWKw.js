import{R as o}from"./ReTina.DaGLM_lD.js";const e=document.createElement("canvas");e.width=window.innerWidth*window.devicePixelRatio;e.height=window.innerHeight*window.devicePixelRatio;e.style.width=`${window.innerWidth}px`;e.style.height=`${window.innerHeight}px`;document.body.appendChild(e);const r=new o({canvas:e,main:`
    let scene = calcScene(uv);
    var color = vec3<f32>(0.0);

    if scene.dist > 0.0 {
      color = hsv2rgb(
        vec3f(uv.x, 0.5, scene.normal.z)
      );
    }

    return vec4<f32>(color, 1.0);
  `,map:`
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
  `});await r.build();r.camera.spherical.radius=2;let t=0;function n(){r.camera.spherical.theta+=.001,r.camera.spherical.phi+=.001,r.shoot(),t++,requestAnimationFrame(n)}n();const i=document.createElement("div");i.setAttribute("style",` position: absolute;
    top: 0;
    left: 0;
    color: white;
    font-size: 24px;
    pointer-events: none;`);document.body.appendChild(i);setInterval(()=>{i.innerText=`FPS: ${t}`,t=0},1e3);
