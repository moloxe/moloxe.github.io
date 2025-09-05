import{R as t}from"./ReTina.UCwlsi6L.js";import{f as o,a}from"./freeControls.mEnd03r0.js";const r=document.createElement("canvas");r.width=window.innerWidth*window.devicePixelRatio;r.height=window.innerHeight*window.devicePixelRatio;r.style.width=`${window.innerWidth}px`;r.style.height=`${window.innerHeight}px`;document.body.appendChild(r);const e=new t({canvas:r,main:`
    let scene = calcScene(uv);
    var color = vec3<f32>(0.0);
    if scene.dist > 0 {
        let bri = max(max(scene.color.rgb.r, scene.color.rgb.g), scene.color.rgb.b);
        color = hsv2rgb(vec3<f32>(uv.x, 0.5, bri));
    }
    return vec4<f32>(color, 1.0);
  `});e.registerMaterial({sdFunc:`
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
  `});await e.build();e.camera.spherical.radius=2;o(e);const n=a();function i(){e.shoot(),requestAnimationFrame(i),n()}i();
