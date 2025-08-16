import{R as s}from"./ReTina.CP4Al_db.js";import{f as h}from"./frameCounter.Csf5rvfL.js";const r=document.createElement("canvas");r.width=window.innerWidth*window.devicePixelRatio;r.height=window.innerHeight*window.devicePixelRatio;r.style.width=`${window.innerWidth}px`;r.style.height=`${window.innerHeight}px`;document.body.appendChild(r);const e=new s({canvas:r,main:`
    let scene = calcScene(uv);
    let color = hsv2rgb(vec3<f32>(uv.x, 0.5, scene.normal.z));
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
  `});await e.build();let i=0,a=2;document.addEventListener("mousemove",t=>{const o=t.clientY*window.devicePixelRatio/r.height,c=t.clientX*window.devicePixelRatio/r.width;a=1+o*2,i=c*Math.PI*2});const d=h();function n(){e.camera.spherical.phi+=.001,e.camera.spherical.theta+=(i-e.camera.spherical.theta)*.1,e.camera.spherical.radius+=(a-e.camera.spherical.radius)*.1,e.shoot(),requestAnimationFrame(n),d()}n();
