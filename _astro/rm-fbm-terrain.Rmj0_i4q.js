import{R as o}from"./ReTina.B4Rf-Pwk.js";import{f as t}from"./freeControls.DZjuNu_h.js";const e=new o({height:128,showFps:!0,useInterlacing:!0,main:`
    let scene = calcScene(uv);
    var color = vec3f(0);
    if scene.dist > 0 {
        color = scene.color.rgb; 
        // Fog
        let dist = scene.dist;
        let fogAmount = 1.0 - exp(-dist * 0.1);
        let fogColor = vec3f(0.5, 0.6, 0.7);
        color = mix(color, fogColor, fogAmount);
    } else {
        // Sky color
        color = vec3f(0.5, 0.6, 0.7) - uv.y * 0.2;
    }
    return vec4f(color, 1);
  `,functions:`
    const lightColor = vec3f(1.0, 0.9, 0.8);
    const lightPower = 40.0;
    fn getLightPos() -> vec3f {
      return vec3f(0, 8, U.camPosZ - 5);
    }

    // Fractal Brownian Motion
    fn fbm(p_in: vec3f, OCTAVES: i32) -> f32 {
        var value = 0.0;
        var amplitude = 0.5;
        var frequency = 1.0;
        var p = p_in;
        for (var i = 0; i < OCTAVES; i++) {
            value += amplitude * snoise3d(p * frequency);
            p = p * 2.0;
            frequency *= 1.2;
            amplitude *= 0.5;
        }
        return value;
    }
  `});e.registerMaterial({sdFunc:`
    let height = fbm(pos * 0.5, 4) * 2.0;
    var terrain = pos.y - height + 0.2;
    let zone = sdSphere(pos, 2);
    terrain = max(zone, terrain);
    return terrain * 0.2;
  `,lightFunc:`
    let minBright = 0.1;
    let diffuseColor = vec3f(0.5, 1., 0.5);
    let shininess = 32.0;
    let lightPos = getLightPos();
    let light = blinnPhong(
      // Environment
      rd, normal, minBright,
      // Material
      pos, diffuseColor, shininess,
      // Light
      lightPos, lightColor, lightPower,
    );
    return vec4f(light, 1);
  `});e.registerMaterial({sdFunc:`
    let zone = sdSphere(pos, 2);
    return max(zone, pos.y);
  `,lightFunc:`
    let minBright = 0.1;
    let diffuseColor = vec3f(0.2, 0.6, 1.);
    let shininess = 512.0;
    let lightPos = getLightPos();
    let n = pos + snoise3d(pos);
    let t = U.time * 5;
    let waves = vec3f(sin(n.x * 25 - t) * 0.1, pos.y, cos(n.z * 25 + t) * 0.1);
    let light = blinnPhong(
      // Environment
      rd, normalize(normal + waves), minBright,
      // Material
      pos, diffuseColor, shininess,
      // Light
      lightPos, lightColor, lightPower,
    );
    return vec4f(light, 1);
  `});e.registerMaterial({sdFunc:`
    let zone = sdSphere(pos, 2);
    pos.x += U.time / 30;
    pos.x /= 3;
    pos.z /= 3;
    var cloud =
      pos.y -
      fbm(pos, 4) * 2.0 +
      snoise3d((vec3f(pos.x, pos.y + U.time / 20, pos.z)) * 2.0) * 0.5;
    cloud = opSmoothSubtraction(pos.y - 0.65, cloud, 0.3);
    cloud = max(zone, cloud);
    return cloud * 0.2;
  `,lightFunc:`
    let minBright = 0.8;
    let diffuseColor = vec3f(0.9, 0.9, 0.9);
    let shininess = 64.0;
    let lightPos = getLightPos();
    let light = blinnPhong(
      // Environment
      rd, normal, minBright,
      // Material
      pos, diffuseColor, shininess,
      // Light
      lightPos, lightColor, lightPower,
    );
    return vec4f(light, 1);
  `});e.camera.fov=50;e.camera.spherical={radius:5,theta:.5,phi:-.5};t(e);e.start();
