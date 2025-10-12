import{R as o}from"./ReTina.Da95_7ih.js";import{f as r}from"./freeControls.BVGVdC3g.js";const e=new o;e.registerMaterial({color:{r:.5,g:.5,b:.5},sdFunc:`
    let dBox = sdBox(pos, vec3<f32>(0.26, 0.14, 0.08));
    let dSphere = sdSphere(pos, 0.1);
    return opSmoothUnion(dBox, dSphere, 0.5);
  `});e.registerMaterial({pos:{x:0,y:.03,z:.22},color:{r:0,g:0,b:0},lightFunc:`
    let minBright = 0.1;
    let diffuseColor = color;
    let shininess = 2056.;
    let lightPos = ro;
    let lightColor = vec3f(1);
    let power = 2.;
    let light = blinnPhong(
      // Environment
      rd, normal, minBright,
      // Material
      pos, diffuseColor, shininess,
      // Light
      lightPos, lightColor, power,
    );
    return vec4f(light, 1.);
  `,sdFunc:`
    let left  = sdBox(pos - vec3<f32>(0.15, 0.0, 0.0), vec3<f32>(0.12, 0.08, 0.001));
    let right = sdBox(pos - vec3<f32>(-0.15, 0.0, 0.0), vec3<f32>(0.12, 0.08, 0.001));
    let mid = sdCapsule(pos - vec3<f32>(0.0, 0.04, 0.0), vec3<f32>(0.05, 0, 0), vec3<f32>(-0.05, 0, 0), 0.01);
    return opSmoothUnion(min(left, right), mid, 0.02);
  `});e.registerMaterial({lightFunc:`
    var n = snoise3d(pos * 20.);
    n = snoise3d(vec3<f32>(pos.xy, n + U.time)) * 0.5 + 0.5;
    n = pow(n, 2.0);
    let c = hsv2rgb(vec3<f32>(pos.y + U.time, 1.0 - n, n));
    let lambertian = dot(normal, -rd);
    return vec4<f32>(c * lambertian, 1.);
  `,sdFunc:`
    let dBody = sdCapsule(pos, vec3<f32>(0, -0.32, 0), vec3<f32>(0, -0.4, 0), 0.08);
    let leftLeg = sdCapsule(pos, vec3<f32>(-0.04, -0.45, 0), vec3<f32>(-0.07, -0.55, 0), 0.05);
    let rightLeg = sdCapsule(pos, vec3<f32>(0.04, -0.45, 0), vec3<f32>(0.07, -0.55, 0), 0.05);
    let dLegs = min(leftLeg, rightLeg);
    return opSmoothUnion(dBody, dLegs, 0.04);
  `});e.registerMaterial({color:{r:.4,g:.4,b:.4},sdFunc:`
    let dFloor = sdBox(pos - vec3<f32>(0, -1, 0), vec3<f32>(1, 0.01, 1));
    let dWall = sdBox(pos - vec3<f32>(0, 0, -1), vec3<f32>(1, 1, 0.01));
    return min(dFloor, dWall);
  `});e.camera.fov=60;e.camera.pos.x=.2;e.camera.pos.z=1.2;e.camera.spherical.phi=-.1;e.camera.spherical.theta=.2;r(e);await e.buildAndRun();
