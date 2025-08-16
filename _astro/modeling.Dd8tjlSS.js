import{R as d}from"./ReTina.CP4Al_db.js";import{f as s}from"./frameCounter.Csf5rvfL.js";const t=document.createElement("canvas");t.width=window.innerWidth*window.devicePixelRatio;t.height=window.innerHeight*window.devicePixelRatio;t.style.width=`${window.innerWidth}px`;t.style.height=`${window.innerHeight}px`;document.body.appendChild(t);const e=new d({canvas:t});e.registerMaterial({color:{r:.5,g:.5,b:.5},sdFunc:`
    let dBox = sdBox(pos, vec3<f32>(0.24, 0.14, 0.14));
    let dSphere = sdSphere(pos, 0.54);
    const balance = 0.8;
    return (balance * dBox + (1.0 - balance) * dSphere) * 0.8;
  `});e.registerMaterial({smoothness:.02,pos:{x:0,y:.03,z:.22},color:{r:.1,g:.1,b:.1},sdFunc:`
    let left  = sdBox(pos + vec3<f32>(-0.15, 0.0, 0.0), vec3<f32>(0.12, 0.08, 0.001));
    let right = sdBox(pos + vec3<f32>(0.15, 0.0, 0.0), vec3<f32>(0.12, 0.08, 0.001));
    let mid = sdCapsule(pos + vec3<f32>(0.0, -0.04, 0.0), vec3<f32>(0.05, 0, 0), vec3<f32>(-0.05, 0, 0), 0.01);
    return min(min(left, right), mid) * 0.8;
  `});await e.build();let a=0,n=2;document.addEventListener("mousemove",i=>{const r=i.clientY*window.devicePixelRatio/t.height,c=i.clientX*window.devicePixelRatio/t.width;n=.5+r,a=2*c*Math.PI*2});const l=s();function o(){e.camera.spherical.theta+=(a-e.camera.spherical.theta)*.1,e.camera.spherical.radius+=(n-e.camera.spherical.radius)*.1,e.shoot(),requestAnimationFrame(o),l()}o();
