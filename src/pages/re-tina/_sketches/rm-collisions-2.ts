import { ReTina } from '@ReTina'

const rt = new ReTina({ showFps: true })

rt.camera.pos.x = -0.25
rt.camera.pos.y = 0.25
rt.camera.spherical.theta = -0.4
rt.camera.fov = 60

const sphere = rt.registerMaterial({
  pos: { x: 0, y: 0.25, z: -0.5 },
  sdFunc: /* wgsl */ `
    var dist = INF;
    for (var i = 0; i < 6; i++) {
      let angle = U.time / 5 + TWO_PI * f32(i) / 6;
      let posOffset = vec3f(cos(angle), sin(angle),  0) * 0.2;
      let sphereDist = sdSphere(pos - posOffset, 0.05);
      dist = min(dist, sphereDist);
    }
    return dist;
  `,
  enableCollisions: true,
})

rt.registerMaterial({
  pos: { x: 0, y: 0, z: -0.5 },
  sdFunc: /* wgsl */ `
    return sdBox(pos, vec3f(0.01, 0.1, 0.1));
  `,
})

await rt.buildAndRun(async () => {
  const result = await sphere.checkCollision()
  if (result.materialIndex === 1) {
    sphere.setColor({ r: 0.3, g: 0.9, b: 0.3 })
  } else {
    sphere.setColor({ r: 1, g: 1, b: 1 })
  }
})
