import { ReTina } from '@ReTina'
import frameCounter from './utils/frameCounter'
import freeControls from './utils/freeControls'
import fsCanvas from './utils/fsCanvas'

// Shader based on: https://webgpulab.xbdev.net/index.php?page=editor&id=mandelbulbbasic3&
const rt = new ReTina({
  canvas: fsCanvas(),
})

rt.registerMaterial({
  sdFunc: /* wgsl */ `
    var thres = length(pos) - 1.2;
    if thres > 0.2 {
        return thres;
    }

    var power = 6 + 4 * sin(U.time * 0.4);
    var z = pos;
    var c = pos;

    var dr = 1.0;
    var r = 0.0;
    for (var i: i32 = 0; i < 32; i++) {        
        r = length(z);
        if r > 2.0 { break; }
        var theta = acos(z.z / r);
        var phi = atan2(z.y, z.x);
        dr = pow(r, power - 1.0) * power * dr + 1.0;
        var zr = pow(r, power);
        theta *= power;
        phi *= power;
        z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));
        z += c;
    }
    return 0.5 * log(r) * r / dr;
  `,
  lightFunc: /* wgsl */ `
    let diffuseColor = hsv2rgb(vec3f(toSpherical(pos).y + U.time * 0.3, 0.5, 0.8));
    let light = blinnPhong(
      // Environment
      rd, normal, /* minBright */ 0,
      // Material
      pos, diffuseColor, /* shininess */ 256,
      // Light
      /* lightPos */ ro, /* lightColor */ vec3f(1), /* power */ 1,
    );
    return vec4f(light, 1.);
  `,
})

await rt.build()

rt.camera.spherical = {
  phi: -0.5,
  radius: 1.8,
  theta: 0.4,
}

freeControls(rt)

const increaseFrameCounter = frameCounter()
function draw() {
  rt.shoot()
  requestAnimationFrame(draw)
  increaseFrameCounter()
}

draw()
