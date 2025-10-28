import{R as o}from"./ReTina.B5Rdf2Fp.js";const e=new o({useInterlacing:!0,height:240,main:`
    let scene = calcScene(uv);
    var color = vec3f(0);
    if scene.dist > 0 {
        color = dither8x8(uv, scene.color.rgb);
    }
    return vec4f(color, 1);
  `,functions:`
    fn getLightPos() -> vec3f {
      return vec3f(0, 2, U.camPosZ - 10);
    }
    fn dither8x8(pos: vec2<f32>, color: vec3f) -> vec3f {
      let x = i32(pos.x) % 8;
      let y = i32(pos.y) % 8;
      let index = x + y * 8;
      let threshold = f32(index) / 64.0 - 0.5 / 64.0;
      var result = color;
      if color.r < threshold {
          result.r = floor(color.r * 16.0) / 16.0;
      } else {
          result.r = ceil(color.r * 16.0) / 16.0;
      }
      if color.g < threshold {
          result.g = floor(color.g * 16.0) / 16.0;
      } else {
          result.g = ceil(color.g * 16.0) / 16.0;
      }
      if color.b < threshold {
          result.b = floor(color.b * 16.0) / 16.0;
      } else {
          result.b = ceil(color.b * 16.0) / 16.0;
      }
      return result;
    }
  `});e.registerMaterial({sdFunc:"return sdSphere((pos - getLightPos()), 1);",lightFunc:"return vec4f(1);"});e.registerMaterial({sdFunc:`
    let terrain = (pos.y - snoise3d(vec3f(pos.xz, pos.y - U.time / 10))) / 6;
    let capsule = sdCapsule(pos, vec3f(U.camPosX, U.camPosY, U.camPosZ), getLightPos(), 0.2);
    return opSmoothSubtraction(capsule, terrain, .1);
  `,lightFunc:`
    let minBright = 0.1;
    let diffuseColor = color;
    let shininess = 1024f;
    let lightPos = getLightPos();
    let lightColor = vec3f(0.8, 0.9, 0.9);
    let power = 128f;
    let light = blinnPhong(
      // Environment
      rd, normal, minBright,
      // Material
      pos, diffuseColor, shininess,
      // Light
      lightPos, lightColor, power,
    );
    return vec4f(light, 1);
  `});await e.buildAndRun(()=>{const r=performance.now()/1e3;e.camera.pos={x:0,y:.6,z:-r/4},e.camera.spherical={radius:.1,theta:Math.sin(r/2)/2,phi:-.3}});
