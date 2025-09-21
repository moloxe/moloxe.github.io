import{R as r}from"./ReTina.D3-UZcjL.js";import{f as i,a as n}from"./freeControls.mEnd03r0.js";const o=document.createElement("canvas");o.width=window.innerWidth*window.devicePixelRatio;o.height=window.innerHeight*window.devicePixelRatio;o.style.width=`${window.innerWidth}px`;o.style.height=`${window.innerHeight}px`;document.body.appendChild(o);const e=new r({canvas:o});e.camera.fov=60;e.registerMaterial({color:{r:.5,g:.5,b:.5},sdFunc:`
    let dBox = sdBox(pos, vec3<f32>(0.26, 0.14, 0.08));
    let dSphere = sdSphere(pos, 0.1);
    return opSmoothUnion(dBox, dSphere, 0.5);
  `});e.registerMaterial({pos:{x:0,y:.03,z:.22},color:{r:0,g:0,b:0},lightFunc:`
    var spec = 0.;
    let lambertian = dot(normal, -rd);
    if lambertian > 0. {
        let lightDir = normalize(ro - pos);
        let halfDir = normalize(lightDir + -rd);
        spec = pow(max(dot(halfDir, normal), 0.), 512.);
    }
    return vec4<f32>(color * lambertian + spec, 1.);
  `,sdFunc:`
    let left  = sdBox(pos - vec3<f32>(0.15, 0.0, 0.0), vec3<f32>(0.12, 0.08, 0.001));
    let right = sdBox(pos - vec3<f32>(-0.15, 0.0, 0.0), vec3<f32>(0.12, 0.08, 0.001));
    let mid = sdCapsule(pos - vec3<f32>(0.0, 0.04, 0.0), vec3<f32>(0.05, 0, 0), vec3<f32>(-0.05, 0, 0), 0.01);
    return opSmoothUnion(min(left, right), mid, 0.02);
  `});e.registerMaterial({lightFunc:`
    var n = snoise3d(pos * 20.);
    n = snoise3d(vec3<f32>(pos.xy, n + U.time)) * 0.5 + 0.5;
    n = pow(n, 2.0);
    let c = hsv2rgb(vec3<f32>(pos.y + U.time, 1.0 - n, n));
    let lambertian = dot(normal, -rd);
    return vec4<f32>(c * lambertian, 1.);
  `,sdFunc:`
    let dBody = sdCapsule(pos, vec3<f32>(0, -0.32, 0), vec3<f32>(0, -0.4, 0), 0.08);
    let leftLeg = sdCapsule(pos, vec3<f32>(-0.04, -0.45, 0), vec3<f32>(-0.07, -0.55, 0), 0.05);
    let rightLeg = sdCapsule(pos, vec3<f32>(0.04, -0.45, 0), vec3<f32>(0.07, -0.55, 0), 0.05);
    let dLegs = min(leftLeg, rightLeg);
    return opSmoothUnion(dBody, dLegs, 0.04);
  `});e.registerMaterial({color:{r:.4,g:.4,b:.4},sdFunc:`
    let dFloor = sdBox(pos - vec3<f32>(0, -1, 0), vec3<f32>(1, 0.01, 1));
    let dWall = sdBox(pos - vec3<f32>(0, 0, -1), vec3<f32>(1, 1, 0.01));
    return min(dFloor, dWall);
  `});await e.build();e.camera.pos={x:0,y:-.2,z:-.5};e.camera.spherical={radius:1.5,phi:-.2,theta:.15};i(e);const a=n();function t(){e.shoot(),requestAnimationFrame(t),a()}t();
