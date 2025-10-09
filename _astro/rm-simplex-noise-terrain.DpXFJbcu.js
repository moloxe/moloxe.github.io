import{R as n,f as r}from"./fsCanvas.MrD-UkXb.js";const e=new n({canvas:r({width:320*(window.innerWidth/window.innerHeight),height:320,pixelated:!0}),main:`
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
  `});e.registerMaterial({sdFunc:`
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
    let power = 124.;
    let light = blinnPhong(
      // Environment
      rd, normal, minBright,
      // Material
      pos, diffuseColor, shininess,
      // Light
      lightPos, lightColor, power,
    );
    return vec4f(light, 1.);
  `});e.registerMaterial({sdFunc:"return sdSphere((pos - getLightPos()), 1.0);",lightFunc:"return vec4f(1);"});await e.build();function i(){const t=performance.now()/1e3;e.camera.pos={x:0,y:1,z:-t/4},e.camera.spherical={radius:-1e-4,theta:Math.sin(t/2)/2,phi:0},e.shoot(),requestAnimationFrame(i)}requestAnimationFrame(i);
