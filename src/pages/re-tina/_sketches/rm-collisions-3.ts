import { ReTina } from '@ReTina'

const rt = new ReTina({ showFps: true })

rt.camera.pos.x = -0.25
rt.camera.spherical.theta = -0.4
rt.camera.fov = 60

const N = 6

const spheres = new Array(N).fill(0).map((_, index) =>
  rt.registerMaterial({
    sdFunc: 'return sdSphere(pos, 0.05);',
    collisionGroup: index,
    enableCollisions: true,
  })
)

rt.registerMaterial({
  pos: { x: 0, y: -0.3, z: -0.5 },
  sdFunc: /* wgsl */ `
    return sdBox(pos, vec3f(0.01, 0.15, 0.1));
  `,
})

await rt.buildAndRun(async () => {
  const t = performance.now() / 1000

  for (let index = 0; index < spheres.length; index++) {
    const sphere = spheres[index]
    const angle = t / 2 + (2 * Math.PI * index) / N

    sphere.setPos({
      x: Math.cos(angle) * 0.2,
      y: Math.sin(angle) * 0.2 + 0.05,
      z: -0.5,
    })

    const result = await sphere.checkCollision()
    if (result.materialIndex !== -1) {
      sphere.setColor({ r: 0.3, g: 0.9, b: 0.3 })
    } else {
      sphere.setColor({ r: 1, g: 1, b: 1 })
    }
  }
})
