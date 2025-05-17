let tina,
  lights = [],
  spheres = []

function setup() {
  createCanvas(windowWidth, windowHeight)
  tina = new Tina(width, height)
  tina.minBright = 0

  tina.shape({
    sdFunc: `(sin(pos.y) - (cos(pos.x) + cos(pos.y) + cos(pos.z))) / 2.`,
    shininess: 4096,
  })
  lights[0] = tina.pointLight({
    color: [1, 0, 0],
    computeShadows: true,
  })
  spheres[0] = tina.sphere({
    radius: 0.05,
    color: [1, 0, 0],
  })
  lights[1] = tina.pointLight({
    color: [0, 0, 1],
    computeShadows: true,
  })
  spheres[1] = tina.sphere({
    radius: 0.05,
    color: [0, 0, 1],
  })

  tina.pos = [2.8, 2.5, 1.5]
  tina.spherical[1] = 1.24
  tina.fov = 120

  tina.build(/* glsl */ `
    Scene scene = calcScene();
    vec3 color = sqrt(scene.color.rgb);
    color += snoise(vec3(uv * vec2(width, height) / 2., time * 4.)) * 0.04;
    fragColor = vec4(color, 1.);
  `)
}

function draw() {
  const time = performance.now() / 1000
  lights[0].pos = [2.4 * cos(time / 2), 2.5, 2.4 * sin(time / 2)]
  spheres[0].pos = [...lights[0].pos]
  lights[1].pos = [2.4 * cos(time / 2 + PI), 2.5, 2.4 * sin(time / 2 + PI)]
  spheres[1].pos = [...lights[1].pos]

  const graphics = tina.update()
  image(graphics, 0, 0, width, height)
}
