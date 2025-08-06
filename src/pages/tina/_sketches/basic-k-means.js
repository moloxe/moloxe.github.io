let tina

function setup() {
  createCanvas(windowWidth, windowHeight)
  tina = new Tina(width, height)

  const nPoints = 10
  const seeds = []
  const hues = []
  for (let i = 0; i < nPoints; i++) {
    seeds.push(createVector(random(width), random(height)))
    hues.push(random())
  }

  tina.build(/* glsl */ `
    uniform float mouseX;
    uniform float mouseY;
    const int nPoints = ${nPoints};
    vec2 seeds[nPoints] = vec2[nPoints](
        ${seeds.map((s) => /* glsl */ `vec2(${s.x}, ${s.y})`)}
    );
    float hues[nPoints] = float[nPoints](
        ${hues.map((h) => /* glsl */ `float(${h})`)}
    );
    const float centDist = 5.;
    ---
    vec2 xy = uv * vec2(width, height);

    float minD = 1e9;
    int minIndex = 0;
    float t = time * 0.01;
    for (int i = 0; i < nPoints; i++) {
      float x = snoise(vec3(seeds[i].xy, t)) + 1.;
      float y = snoise(vec3(seeds[i].yx, t)) + 1.;
      x = mod(x * width, width);
      y = mod(y * height, height);
      float d = length(xy - vec2(x, y));
      if (d < minD) {
        minD = d;
        minIndex = i;
      }
    }

    vec2 cMouse = vec2(mouseX, mouseY);
    float dMouse = length(xy - cMouse);

    float hue = hues[minIndex];
    if (dMouse < minD) {
      hue = .1;
      minD = dMouse;
    }

    vec3 color = mix(
      hsv2rgb(hue, .6, 1.),
      vec3(0.), log(minD / 20.) / 3.
    );
    fragColor = vec4(color, 1.);
  `)

  noCursor()
}

function draw() {
  const graphics = tina.update({
    mouseX,
    mouseY,
  })
  image(graphics, 0, 0, width, height)
}
