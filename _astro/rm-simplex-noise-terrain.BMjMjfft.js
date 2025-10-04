import{R as o}from"./ReTina.BLr4UXLG.js";const e=document.createElement("canvas");e.width=320*(window.innerWidth/window.innerHeight);e.height=320;e.style.width=`${window.innerWidth}px`;e.style.height=`${window.innerHeight}px`;e.style.imageRendering="pixelated";document.body.appendChild(e);const t=new o({canvas:e,main:`
    let scene = calcScene(uv);
    var color = vec3<f32>(0.0);
    if scene.dist > 0 {
        color = round(scene.color.rgb * 16.) / 16.;
    }
    return vec4<f32>(color, 1.0);
  `,functions:`
    fn getLightPos() -> vec3f {
      return vec3f(0, 2, U.camPosZ - 10);
    }
  `});t.registerMaterial({sdFunc:`
    let n1 = snoise(vec2<f32>(pos.x, pos.y - U.time / 10.));
    let n2 = snoise(vec2<f32>(pos.z, -pos.y - U.time / 10.));
    let terrain = (pos.y - n1 - n2) / 6;
    let capsule = sdCapsule(pos, vec3f(U.camPosX, U.camPosY, U.camPosZ), getLightPos(), 0.2);
    return max(-capsule, terrain);
  `,lightFunc:`
    let minBright = 0.1;
    let diffuseColor = color;
    let shininess = 1024.;
    let lightPos = getLightPos();
    let lightColor = vec3f(0.8, 0.9, 0.9);
    let power = 50.;
    let light = blinnPhong(
      // Environment
      rd, normal, minBright,
      // Material
      pos, diffuseColor, shininess,
      // Light
      lightPos, lightColor, power,
    );
    return vec4f(light, 1.);
  `});t.registerMaterial({sdFunc:"return sdSphere((pos - getLightPos()), 1.0);",lightFunc:"return vec4f(1);"});await t.build();function i(){const n=performance.now()/1e3;t.camera.pos={x:0,y:1,z:-n/4},t.camera.spherical={radius:-1e-4,theta:Math.sin(n/2)/2,phi:0},t.shoot(),requestAnimationFrame(i)}requestAnimationFrame(i);
