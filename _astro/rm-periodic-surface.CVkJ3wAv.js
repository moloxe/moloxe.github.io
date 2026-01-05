import{R as r}from"./ReTina.B5BpWoZE.js";import{f as t}from"./freeControls.qr04tydI.js";const o=new r({showFps:!0});o.registerMaterial({sdFunc:`
    const t = 0f;
    pos += vec3<f32>(cos(-t) * 16, 2.4, sin(-t) * 16);
    return (sin(pos.y) - (cos(pos.x) + cos(pos.y) + cos(pos.z))) * .6;
  `,lightFunc:`
    let lamb = dot(normal, -rd);
    let aoFactor = calculateDFAO(pos, normal);
    var c = (normal * .5 + .5) * lamb * aoFactor;
    return vec4(c, 1.);
  `});t(o);o.start();
