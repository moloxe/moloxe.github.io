import{f as c,R as l}from"./fsCanvas.MrD-UkXb.js";const n=c({useExactPixels:!0}),t=new l({canvas:n});t.registerMaterial({sdFunc:`
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
  `});let s=0;const r=t.registerUniform("pulse",s);n.addEventListener("click",()=>{s=1,r(s)});await t.build();let o=performance.now();function i(){const e=performance.now(),a=.2/(e-o);o=e,t.shoot(),requestAnimationFrame(i),s-=a,s=Math.max(0,s),r(s)}i();
