import{R as r,f as n}from"./fsCanvas.MrD-UkXb.js";import{l as i,T as s}from"./loadImage.DoVZmuyO.js";const t=await i(s.src),e=new r({canvas:n(),texs:[{width:t.width,height:t.height}],usePrevFrameTex:!0,functions:`
    fn getState(uv: vec2f) -> vec3f {
      return rgb2hsv(getPrevFrameTexSample(uv).rgb);
    }
  `,main:`
    if U.frame == 0 {
      let pix = getTex0Sample(uv).bgra; // TODO: Images should load as rgba, not bgra
      return pix;
    } else {
      let res = vec2f(U.width, U.height);
      let mixSpeed = pow(U.time / 8, 8);
      var newState = getState(uv);
      for (var i = 0; i < 180; i++) {
        let angle = f32(i) * PI / 6.;
        let rd = vec2f(cos(angle), sin(angle));
        // neighbor
        let nPos = uv + rd / res;
        let nState = getState(nPos);
        let nDir = nState.rg * 2 - 1; // hue, sat
        let nForce = nState.b; // bri
        let d = dot(rd, nDir);
        if d > 0 {
          newState = mix(newState, nState, min(mixSpeed, d));
        }
      }
      return vec4f(hsv2rgb(newState), 1);
    }
  `}),o=e.registerUniform("frame");await e.build();e.setTex(0,t.textureData);let a=0;setInterval(()=>{e.shoot(),a++,o(a)},1e3/30);
