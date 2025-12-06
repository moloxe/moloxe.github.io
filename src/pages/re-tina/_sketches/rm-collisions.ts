import { ReTina } from '@ReTina'

const rt = new ReTina({ showFps: true })

rt.camera.pos.y = 0.2
rt.camera.fov = 100

const sphere = rt.registerMaterial({
  sdFunc: /* wgsl */ `
    return sdSphere(pos, 0.1);
  `,
  enableCollisions: true,
})

rt.registerMaterial({
  sdFunc: /* wgsl */ `
    return (pos.y - sin(pos.x * 15 + U.time) / 10) * 0.5;
  `,
})

window.addEventListener('mousemove', async (event) => {
  const mouseX = event.clientX / window.innerWidth
  const mouseY = event.clientY / window.innerHeight
  sphere.setPos({ x: mouseX - 0.5, y: 0.7 - mouseY, z: -0.5 })
})

await rt.buildAndRun(async () => {
  const result = await sphere.checkCollision()
  if (result.materialIndex === 1) {
    console.log(result)
    sphere.setColor({ r: 0.3, g: 0.9, b: 0.3 })
  } else {
    sphere.setColor({ r: 1, g: 1, b: 1 })
  }
})
