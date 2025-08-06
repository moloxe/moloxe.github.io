let tina

function setup() {
  createCanvas(windowWidth, windowHeight)
  tina = new Tina(width, height)

  tina.build(/* glsl */ `
    uniform float mouseX;
    uniform float mouseY;
    const int nPoints = 10;
    const float centDist = 5.;
    ---
    vec2 xy = uv * vec2(width, height);

    float minD = 1e9;
    int minIndex = 0;
    float t = time * 0.01;
    for (int i = 0; i < nPoints; i++) {
      float x = snoise(vec3(x, float(i), t)) + 1.;
      float y = snoise(vec3(y, float(i), t)) + 1.;
      x = mod(x * width, width);
      y = mod(y * height, height);
      float d = length(xy - vec2(x, y));
      if (d < minD) {
        minD = d;
        minIndex = i;
      }
    }

    float dMouse = length(xy - vec2(mouseX, mouseY));
    float hue = float(minIndex) / float(nPoints - 1);
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
