import{R as c}from"./ReTina.CUjPK151.js";import{f as i}from"./freeControls.DZjuNu_h.js";const e=new c({showFps:!0,height:256,useInterlacing:!0});e.registerMaterial({sdFunc:`
    var d = max(pos.y, -pos.y - 0.1);
    d = max(d, -sdSphere(pos - vec3f(0, 0, -2), 1.5));
    return d;
  `});e.registerMaterial({color:{r:1,g:0,b:1},sdFunc:`
    let t = U.time;
    pos = pos - vec3f(2, 0.6 - sin(t) * 0.2, -2);
    pos = rotate(pos, vec3f(0, t, 0));
    return sdBox(pos, vec3f(1, 0.1, 1));
  `});const r=e.registerMaterial({enableCollisions:!0,sdFunc:`
    let camPos = vec3f(U.camPosX, U.camPosY, U.camPosZ);
    let head = sdSphere(pos - camPos, 0.3);
    let body = sdCapsule(pos - camPos, vec3f(0, 0, 0), vec3f(0, -0.6, 0), 0.2);
    return opSmoothUnion(head, body, 0.2);
  `});e.camera.fov=90;e.camera.pos.y=1;e.camera.spherical.radius=2;let s=!1;const{applyForce:a,setVelocity:n,getVelocity:p}=i(e,{slowDown:{x:.9,y:1,z:.9},onSpace:()=>{s&&a({y:.01})}});let t=!1;setInterval(()=>{t||(t=!0,r.checkCollision().then(l=>{if(l.materialIndex!==-1){const o=l.collisionNormal;o.y>.9?(s=!0,r.setColor({r:.3,g:.9,b:.3}),p().y<0&&n({y:0})):a({x:o.x*.3,y:o.y*.3,z:o.z*.3})}else r.setColor({r:1,g:1,b:1}),s=!1}),t=!1),s||a({y:-.005})},1e3/60);e.start();
