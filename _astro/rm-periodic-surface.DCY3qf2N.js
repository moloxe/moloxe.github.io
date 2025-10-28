import{R as c}from"./ReTina.B5Rdf2Fp.js";const o=new c({main:`
    let scene = calcScene(uv);
    var color = vec3f(0);
    if scene.dist > 0 {
        color = dither8x8(uv, scene.color.rgb);
    }
    return vec4f(color, 1);
  `,functions:`
    fn dither8x8(pos: vec2<f32>, color: vec3f) -> vec3f {
      let x = i32(pos.x) % 8;
      let y = i32(pos.y) % 8;
      let index = x + y * 8;
      let threshold = f32(index) / 64.0 - 0.5 / 64.0;
      var result = color;
      if color.r < threshold {
          result.r = floor(color.r * 16.0) / 16.0;
      } else {
          result.r = ceil(color.r * 16.0) / 16.0;
      }
      if color.g < threshold {
          result.g = floor(color.g * 16.0) / 16.0;
      } else {
          result.g = ceil(color.g * 16.0) / 16.0;
      }
      if color.b < threshold {
          result.b = floor(color.b * 16.0) / 16.0;
      } else {
          result.b = ceil(color.b * 16.0) / 16.0;
      }
      return result;
    }
  `});o.registerMaterial({sdFunc:`
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
  `});let e=0;const t=o.registerUniform("pulse",e);o.canvas.addEventListener("click",()=>{e=1,t(e)});let l=performance.now();await o.buildAndRun(()=>{const r=performance.now(),s=.2/(r-l);l=r,e-=s,e=Math.max(0,e),t(e)});
