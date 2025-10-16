import{R as i}from"./ReTina.B45RerBY.js";const t=new i;t.registerMaterial({sdFunc:`
    let t = U.time * .3;
    pos = rotate(pos, vec3<f32>(0, t, -t));
    pos += vec3<f32>(cos(-t) * 16, 2.4, sin(-t) * 16);
    return (sin(pos.y) - (cos(pos.x) + cos(pos.y) + cos(pos.z))) * .6;
  `,lightFunc:`
    var c = normal * .5 + .5;
    let dist = length(pos - ro);
    let bri = pow(sin(dist * PI / 6.), 6.);
    c *= (bri + U.pulse);
    return vec4(c, 1.);
  `});let e=0;const n=t.registerUniform("pulse",e);t.canvas.addEventListener("click",()=>{e=1,n(e)});let o=performance.now();await t.buildAndRun(()=>{const s=performance.now(),r=.2/(s-o);o=s,e-=r,e=Math.max(0,e),n(e)});
