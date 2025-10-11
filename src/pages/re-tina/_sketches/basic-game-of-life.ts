import { ReTina } from '@ReTina'
import TinaLogo from '@src/assets/img/tina.jpeg'
import { loadImage } from './utils/loadImage'

const img = await loadImage(TinaLogo.src)

const rt = new ReTina({
  fps: 24,
  height: 128,
  texs: [{ width: img.width, height: img.height }],
  usePrevFrameTex: true,
  functions: /* wgsl */ `
    fn isPixAlive(uv: vec2f) -> bool {
      return getPrevFrameTexSample(uv).r > 0.5;
    }
  `,
  main: /* wgsl */ `
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
  `,
})

await rt.build()

rt.setTex(0, img.textureData)
rt.run()
