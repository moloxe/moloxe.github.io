import{R as n}from"./ReTina.BLr4UXLG.js";import{l as i}from"./loadImage.DWgqKgWY.js";const s={src:"/_astro/castle.ChpmK7ow.jpg"},e=await i(s.src),t=document.createElement("canvas");t.width=e.width;t.height=e.height;document.body.appendChild(t);const a=new n({canvas:t,texs:[{width:e.width,height:e.height}],usePrevFrameTex:!0,functions:`
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
  `}),o=a.registerUniform("frame");await a.build();a.setTex(0,e.textureData);let r=0;setInterval(()=>{a.shoot(),r++,o(r)},1e3/30);
