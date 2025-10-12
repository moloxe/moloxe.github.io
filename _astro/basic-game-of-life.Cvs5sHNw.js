import{R as c}from"./ReTina.Da95_7ih.js";const g={src:"/_astro/tina.4YsElRAf.jpeg"};async function f(h){const e=document.createElement("img");e.src=h,await e.decode();const t=document.createElement("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");if(!n)throw new Error("No canvas context found");n.drawImage(e,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),o=new Uint8Array(e.width*e.height*4);for(let i=0;i<e.width*e.height*4;i++)o[i]=s.data[i];return{textureData:o,width:e.width,height:e.height}}const a=await f(g.src),r=new c({fps:24,height:128,texs:[{width:a.width,height:a.height}],usePrevFrameTex:!0,functions:`
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
  `});await r.build();r.setTex(0,a.textureData);r.run();
