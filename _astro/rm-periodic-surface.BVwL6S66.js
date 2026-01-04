import{R as r}from"./ReTina.CLr3yHkn.js";import{f as s}from"./freeControls.qr04tydI.js";const t=new r({showFps:!0});t.registerMaterial({sdFunc:`
    let t = 0f;
    pos = rotate(pos, vec3<f32>(0, t, -t));
    pos += vec3<f32>(cos(-t) * 16, 2.4, sin(-t) * 16);
    return (sin(pos.y) - (cos(pos.x) + cos(pos.y) + cos(pos.z))) * .6;
  `,lightFunc:`
    let lamb = dot(normal, -rd);
    let aoFactor = calculateDFAO(pos, normal);
    var c = (normal * .5 + .5) * sqrt(lamb) * aoFactor;
    let dist = length(pos - ro);
    return vec4(c, 1.);
  `});let o=0;t.registerUniform("pulse",o);t.canvas.addEventListener("click",()=>{o=1});performance.now();s(t);t.start({});
