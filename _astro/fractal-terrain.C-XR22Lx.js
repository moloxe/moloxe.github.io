import{R as r}from"./ReTina.DpIR3iFu.js";import{f as o}from"./freeControls.DrXCMInN.js";const e=new r({height:256,fps:24,useInterlacing:!0,main:`
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
    fn getLightPos() -> vec3f {
      return vec3f(0, 10, U.camPosZ - 5);
    }

    // Fractal Brownian Motion
    fn fbm(p: vec3f) -> f32 {
        var value: f32 = 0.0;
        var amplitude: f32 = 0.5;
        var frequency: f32 = 1.0;
        var shift = vec3f(100.0);
        var p_curr = p;
        for (var i: i32 = 0; i < 5; i++) {
            value += amplitude * snoise3d(p_curr);
            p_curr = p_curr * 2.0 + shift;
            amplitude *= 0.5;
        }
        return value;
    }
  `});e.registerMaterial({sdFunc:`
    let time = U.time;

    // Base terrain height using FBM
    let p = vec3f(pos.x, pos.y, pos.z);
    var height = fbm(p * 0.5) * 2.0;
    height += fbm(p * 2.0) * 0.5; // Add some more detail
    var terrain = pos.y - height;
    let cut = max(p.y - 0.65, -p.y + 0.6);
    terrain = opSmoothSubtraction(cut, terrain, 0.3);

    // Water
    let n = pos + snoise3d(pos);
    let water = pos.y - (sin(n.x * 100 - time * 10.) + sin(n.z * 100 + time * 10.) - 2) * 0.001;
    
    return opSmoothUnion(water, terrain, 0.01) * 0.2;
  `,lightFunc:`
    var minBright = 0.1;
    var diffuseColor = vec3f(0., 0.2, 0.5); // Water
    var power = 40.0;
    
    // Variation based on height
    if (pos.y > 0.59) {
        diffuseColor = vec3f(0.9, 0.9, 0.9); // Snow
        minBright = 0.8;
    } else if (pos.y > 0.2) {
        diffuseColor = vec3f(0.7, 0.6, 0.5); // Brown/Rock
    } else if (pos.y > 0.001) {
        diffuseColor = vec3f(0.5, 1., 0.5); // Greenish base
    } else {
        power = 128.0;
    }

    let shininess = 64.0;
    let lightPos = getLightPos();
    let lightColor = vec3f(1.0, 0.9, 0.8); // Warm sunlight
    
    let light = blinnPhong(
      // Environment
      rd, normal, minBright,
      // Material
      pos, diffuseColor, shininess,
      // Light
      lightPos, lightColor, power,
    );
    return vec4f(light, 1);
  `});e.camera.fov=60;e.camera.pos={x:0,y:.8,z:-5};e.camera.spherical={radius:0,theta:0,phi:-.2};o(e);await e.buildAndRun();
