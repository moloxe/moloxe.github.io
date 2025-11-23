import{R as r}from"./ReTina.Bp3DGIDB.js";const t=new r;t.registerMaterial({sdFunc:`
    let t = U.time * .3;
    pos = rotate(pos, vec3<f32>(0, t, -t));
    pos += vec3<f32>(cos(-t) * 16, 2.4, sin(-t) * 16);
    return (sin(pos.y) - (cos(pos.x) + cos(pos.y) + cos(pos.z))) * .6;
  `,lightFunc:`
    var c = normal * .5 + .5;
    let dist = length(pos - ro);
    let bri = pow(max(0, sin(dist * PI / 6.)), 6.) + U.pulse;
    c *= bri;
    return vec4(c, 1.);
  `});let e=0;const c=t.registerUniform("pulse",e);t.canvas.addEventListener("click",()=>{e=1});let o=performance.now();await t.buildAndRun(()=>{const s=performance.now(),n=.5/(s-o);e=Math.max(0,e-n),c(e),o=s});
