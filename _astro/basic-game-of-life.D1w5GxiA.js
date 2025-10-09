import{R as n,f as r}from"./fsCanvas.MrD-UkXb.js";import{l as a,T as s}from"./loadImage.DoVZmuyO.js";const t=await a(s.src),e=new n({canvas:r({width:128*(window.innerWidth/window.innerHeight),height:128,pixelated:!0}),texs:[{width:t.width,height:t.height}],usePrevFrameTex:!0,functions:`
    fn isPixAlive(uv: vec2f) -> bool {
      return getPrevFrameTexSample(uv).r > 0.5;
    }
  `,main:`
    if (U.time < 1) {
      let pix = getTex0Sample(uv).rgb;
      if rgb2hsv(pix).b > 0.5 {
        return vec4f(1);
      }
      return vec4f(0, 0, 0, 1);
    } else {
      let res = vec2f(U.width, U.height);
      var nCount = 0;

      for (var i = -1; i <= 1; i = i + 1) {
        for (var j = -1; j <= 1; j = j + 1) {
          if (i == 0 && j == 0) {
            continue;
          }
          if isPixAlive(uv + vec2f(f32(i), f32(j)) / res) {
            nCount = nCount + 1;
          }
        }
      }

      let isAlive = isPixAlive(uv);
      var newState = 0f;
      if isAlive {
        if nCount == 2 || nCount == 3 {
          newState = 1;
        }
      } else {
        if nCount == 3 {
          newState = 1;
        }
      }
      return vec4f(vec3f(newState), 1);
    }
  `}),f=e.registerUniform("frame");await e.build();e.setTex(0,t.textureData);let i=0;setInterval(()=>{e.shoot(),i++,f(i)},1e3/24);
