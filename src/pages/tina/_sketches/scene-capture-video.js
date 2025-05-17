let capture, tina

function setup() {
  const W = windowWidth
  const H = windowHeight
  const RATIO = windowWidth / windowHeight
  createCanvas(W, H)
  const dim = [480, (H / W) * 480]
  capture = createCapture(VIDEO, { flipped: false })
  capture.size(...dim)
  capture.hide()

  tina = new Tina(...dim, {
    useInterlacing: true,
  })

  tina.shape({
    sdFunc: `(sin(pos.y) - (cos(pos.x) + cos(pos.y) + cos(pos.z))) / 2.`,
  })

  tina.build(/* glsl */ `
    // https://www.shadertoy.com/view/llBGWc
    #define padding 0.05
    #define threshold 0.55
    uniform sampler2D capture;
    const float ratio = (4. / 3.) / ${RATIO.toFixed(4)};

    vec4 getPix() {
      vec2 fixedUv = vec2(
        1. - (uv.x / ratio) * 2.,
        uv.y * 2. - 1.
      );
      if(
        fixedUv.x > 1. || fixedUv.x < 0. ||
        fixedUv.y > 1. || fixedUv.y < 0.
      ) return vec4(0., 1., 0., 1.);
      vec4 pix = texture(capture, fixedUv);
      return pix;
    }

    vec4 mixCapture(vec4 bg) {
      vec4 pix = getPix();
      vec3 diff = pix.rgb - vec3(0., 1., 0.);
      float fac = smoothstep(
        threshold - padding,
        threshold + padding,
        dot(diff, diff)
      );
      return mix(pix, bg, 1. - fac);
    }
    ---
    vec2 dir2d = uv * 2. - 1.;
    dir2d *= vec2(width / height, -1);

    float t = time * .1;
    vec3 ro = vec3(cos(-t) * 16., 2.4, sin(-t) * 16.);
    vec3 rd = normalize(vec3(dir2d, -.8));
    rd *= rotate(vec3(0., t, -t));

    RayMarch rm = rayMarch(ro, rd);
    if(rm.materialIndex == -1) return;

    vec3 normal = calcSceneNormal(rm.pos) / 2. + .5;
    float dist = length(rm.pos - ro);
    float bri = pow(sin(dist * PI / 6.), 6.);

    vec4 sceneColor = vec4(normal * bri, 1.);
	  fragColor = mixCapture(sceneColor);
  `)
  noSmooth()
  frameRate(24)
}

function draw() {
  const uniforms = {}
  if (capture) uniforms.capture = capture
  const graphics = tina.update(uniforms)
  image(graphics, 0, 0, width, height)
}
