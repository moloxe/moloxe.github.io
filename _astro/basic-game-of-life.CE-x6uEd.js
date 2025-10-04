import{R as r}from"./ReTina.BLr4UXLG.js";import{l as a}from"./loadImage.DWgqKgWY.js";const o={src:"/_astro/tina.4YsElRAf.jpeg"},e=document.createElement("canvas");e.width=128*(window.innerWidth/window.innerHeight);e.height=128;e.style.width=`${window.innerWidth}px`;e.style.height=`${window.innerHeight}px`;e.style.imageRendering="pixelated";document.body.appendChild(e);const i=await a(o.src),t=new r({canvas:e,texs:[{width:i.width,height:i.height}],usePrevFrameTex:!0,functions:`
    fn isPixAlive(uv: vec2f) -> bool {
      return getPrevFrameTexSample(uv).r > 0.5;
    }
  `,main:`
    if (U.frame < 24) {
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
  `}),s=t.registerUniform("frame");await t.build();t.setTex(0,i.textureData);let n=0;setInterval(()=>{t.shoot(),n++,s(n)},1e3/24);
