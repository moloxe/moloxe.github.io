import{R as a}from"./ReTina.UCwlsi6L.js";const t=document.createElement("canvas");t.width=window.innerWidth*window.devicePixelRatio;t.height=window.innerHeight*window.devicePixelRatio;t.style.width=`${window.innerWidth}px`;t.style.height=`${window.innerHeight}px`;document.body.appendChild(t);const i=new a({canvas:t});i.registerMaterial({sdFunc:`
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
  `});let e=0;const s=i.registerUniform("pulse",e);t.addEventListener("click",()=>{e=1,s(e)});await i.build();let o=performance.now();function r(){const n=performance.now(),c=.2/(n-o);o=n,i.shoot(),requestAnimationFrame(r),e-=c,e=Math.max(0,e),s(e)}r();
