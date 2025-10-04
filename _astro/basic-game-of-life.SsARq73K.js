import{R as g}from"./ReTina.BLr4UXLG.js";const w={src:"/_astro/tina.4YsElRAf.jpeg"};async function f(c){const e=document.createElement("img");e.src=c,await e.decode();const t=document.createElement("canvas");t.width=e.width,t.height=e.height;const r=t.getContext("2d");if(!r)throw new Error("No canvas context found");r.drawImage(e,0,0,t.width,t.height);const d=r.getImageData(0,0,t.width,t.height),h=new Uint8Array(e.width*e.height*4);for(let n=0;n<e.width*e.height*4;n++)h[n]=d.data[n];return{textureData:h,width:e.width,height:e.height}}const i=document.createElement("canvas");i.width=128*(window.innerWidth/window.innerHeight);i.height=128;i.style.width=`${window.innerWidth}px`;i.style.height=`${window.innerHeight}px`;i.style.imageRendering="pixelated";document.body.appendChild(i);const o=await f(w.src),a=new g({canvas:i,texs:[{width:o.width,height:o.height}],usePrevFrameTex:!0,functions:`
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
  `}),v=a.registerUniform("frame");await a.build();a.setTex(0,o.textureData);let s=0;setInterval(()=>{a.shoot(),s++,v(s)},1e3/24);
