import{R as a}from"./ReTina.S5QauHkN.js";import{f as n}from"./freeControls.qr04tydI.js";const o=new a({showFps:!0});o.registerMaterial({sdFunc:`
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
  `});let t=0;const l=o.registerUniform("pulse",t);o.canvas.addEventListener("click",()=>{t=1});let s=performance.now();n(o);o.start({onFrame(){const e=performance.now(),r=.5/(e-s);t=Math.max(0,t-r),l(t),s=e}});
