import{R as i}from"./ReTina.DEMKjgxf.js";import{m as a,f as s}from"./modelControls.D0ohSsn_.js";const t=document.createElement("canvas");t.width=window.innerWidth*window.devicePixelRatio;t.height=window.innerHeight*window.devicePixelRatio;t.style.width=`${window.innerWidth}px`;t.style.height=`${window.innerHeight}px`;document.body.appendChild(t);const e=new i({canvas:t});e.camera.fov=60;e.registerMaterial({color:{r:.5,g:.5,b:.5},sdFunc:`
    let dBox = sdBox(pos, vec3<f32>(0.26, 0.14, 0.08));
    let dSphere = sdSphere(pos, 0.1);
    return opSmoothUnion(dBox, dSphere, 0.5);
  `});e.registerMaterial({pos:{x:0,y:.03,z:.22},color:{r:.1,g:.1,b:.1},sdFunc:`
    let left  = sdBox(pos - vec3<f32>(0.15, 0.0, 0.0), vec3<f32>(0.12, 0.08, 0.001));
    let right = sdBox(pos - vec3<f32>(-0.15, 0.0, 0.0), vec3<f32>(0.12, 0.08, 0.001));
    let mid = sdCapsule(pos - vec3<f32>(0.0, 0.04, 0.0), vec3<f32>(0.05, 0, 0), vec3<f32>(-0.05, 0, 0), 0.01);
    return opSmoothUnion(min(left, right), mid, 0.02);
  `});e.registerMaterial({color:{r:.1,g:.3,b:.1},sdFunc:`
    let dBody = sdCapsule(pos, vec3<f32>(0, -0.32, 0), vec3<f32>(0, -0.4, 0), 0.08);
    let leftLeg = sdCapsule(pos, vec3<f32>(-0.04, -0.45, 0), vec3<f32>(-0.07, -0.55, 0), 0.05);
    let rightLeg = sdCapsule(pos, vec3<f32>(0.04, -0.45, 0), vec3<f32>(0.07, -0.55, 0), 0.05);
    let dLegs = min(leftLeg, rightLeg);
    return opSmoothUnion(dBody, dLegs, 0.04);
  `});e.registerMaterial({color:{r:.4,g:.4,b:.4},sdFunc:`
    let dFloor = sdBox(pos - vec3<f32>(0, -1, 0), vec3<f32>(1, 0.01, 1));
    let dWall = sdBox(pos - vec3<f32>(0, 0, -1), vec3<f32>(1, 1, 0.01));
    return min(dFloor, dWall);
  `});await e.build();const{getTargets:d}=a(t,{radius:2}),c=s();function o(){const r=d();e.camera.spherical.radius+=(r.radius-e.camera.spherical.radius)*.1,e.camera.spherical.theta+=(r.theta-e.camera.spherical.theta)*.1,e.camera.spherical.phi+=(r.phi-e.camera.spherical.phi)*.1,e.shoot(),requestAnimationFrame(o),c()}o();
