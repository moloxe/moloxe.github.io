import{R as a}from"./ReTina.B4Rf-Pwk.js";const e=new a;e.registerMaterial({sdFunc:`
    let t = U.time * .3;
    pos = rotate(pos, vec3<f32>(0, t, -t));
    pos += vec3<f32>(cos(-t) * 16, 2.4, sin(-t) * 16);
    return (sin(pos.y) - (cos(pos.x) + cos(pos.y) + cos(pos.z))) * .6;
  `,lightFunc:`
    let lamb = dot(normal, -rd);
    let aoFactor = calculateDFAO(pos, normal);
    var c = (normal * .5 + .5) * sqrt(lamb) * aoFactor;
    let dist = length(pos - ro);
    let bri = pow(max(0, sin(dist * PI / 6.)), 6.) + U.pulse;
    c *= bri;
    return vec4(c, 1.);
  `});let t=0;const n=e.registerUniform("pulse",t);e.canvas.addEventListener("click",()=>{t=1});let s=performance.now();e.start({onFrame(){const o=performance.now(),r=.1/(o-s);t=Math.max(0,t-r),n(t),s=o}});
