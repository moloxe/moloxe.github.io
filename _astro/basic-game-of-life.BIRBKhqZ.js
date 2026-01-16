import{R as h}from"./ReTina.i_xWrEmA.js";const l={src:"/_astro/tina.4YsElRAf.jpeg"};async function f(s){const e=document.createElement("img");e.src=s,await e.decode();const t=document.createElement("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");if(!n)throw new Error("No canvas context found");n.drawImage(e,0,0,t.width,t.height);const u=n.getImageData(0,0,t.width,t.height),a=new Uint8Array(e.width*e.height*4);for(let i=0;i<e.width*e.height*4;i++)a[i]=u.data[i];return{textureData:a,width:e.width,height:e.height}}const o=await f(l.src),r=new h({fps:24,height:128,texs:[{width:o.width,height:o.height}],usePrevFrameTex:!0,functions:`
    fn isPixAlive(pos: vec2f) -> vec3f {
      return step(vec3f(0.5), getPrevFrameTexSample(pos).rgb);
    }
    fn golRule(_isAlive: f32, _nCount: f32) -> f32 {
      let isAlive = round(_isAlive) > 0.5;
      let nCount = round(_nCount);
      if isAlive {
        if nCount == 2 || nCount == 3 {
          return 1f;
        }
      } else if nCount == 3 {
        return 1f;
      }
      return 0f;
    }
  `,main:`
    if (U.time < 1) {
      return getTex0Sample(uv);
    } else {
      let res = vec2f(U.width, U.height);
      var nCount = vec3f(0);
      for (var i = -1; i <= 1; i = i + 1) {
        for (var j = -1; j <= 1; j = j + 1) {
          if (i == 0 && j == 0) {
            continue;
          }
          let pos = uv + vec2f(f32(i), f32(j)) / res;
          nCount += isPixAlive(pos);
        }
      }
      let isAlive = isPixAlive(uv);
      let newState = vec3f(
        golRule(isAlive.x, nCount.x),
        golRule(isAlive.y, nCount.y),
        golRule(isAlive.z, nCount.z)
      );
      return vec4f(newState, 1);
    }
  `});r.start({onBuild(){r.setTex(0,o.textureData)}});
