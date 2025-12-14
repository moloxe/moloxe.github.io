const I=`struct VSOut {\r
    @builtin(position) Position: vec4<f32>,\r
    @location(0)       uvs: vec2<f32>\r
};\r
\r
@vertex\r
fn main(@builtin(vertex_index) VertexIndex: u32) -> VSOut {\r
    var pos = array<vec2<f32>, 4>(vec2<f32>(-1.0, 1.0),\r
        vec2<f32>(-1.0, -1.0),\r
        vec2<f32>(1.0, 1.0),\r
        vec2<f32>(1.0, -1.0));\r
\r
    var uvs = array<vec2<f32>, 4>(vec2<f32>(1.0, 1.0),\r
        vec2<f32>(1.0, -1.0),\r
        vec2<f32>(-1.0, 1.0),\r
        vec2<f32>(-1.0, -1.0));\r
\r
    var vsOut: VSOut;\r
    vsOut.Position = vec4<f32>(pos[ VertexIndex ], 0.0, 1.0);\r
    vsOut.uvs = uvs[ VertexIndex ] * 0.5 + 0.5;\r
    return vsOut;\r
}\r
`,_=`struct GlobalUniform {\r
    UNIFORMS: f32, // #UNIFORMS\r
};\r
\r
@group(0) @binding(0) var <uniform> U: GlobalUniform;\r
@group(0) @binding(1) var u_sampler: sampler;\r
\r
// Textures template:\r
// #GROUP-1-BINDING-X\r
// Prev. frame (ping-pong) template:\r
// #GROUP-2-BINDING-X\r
\r
const PI = f32(3.1415926535897932384626433832795);\r
\r
fn toSpherical(pos: vec3<f32>) -> vec3<f32> {\r
    let r = length(pos);\r
    let theta = acos(pos.z / r);\r
    let phi = atan2(pos.y, pos.x);\r
    return vec3<f32>(r, theta, phi);\r
}\r
\r
fn toCartesian(sph: vec3<f32>) -> vec3<f32> {\r
    let r = sph.x;\r
    let theta = sph.y;\r
    let phi = sph.z;\r
    let sinTheta = sin(theta);\r
    return vec3<f32>(\r
        r * sinTheta * cos(phi),\r
        r * sinTheta * sin(phi),\r
        r * cos(theta)\r
    );\r
}\r
\r
fn rotate(pos: vec3<f32>, rot: vec3<f32>) -> vec3<f32> {\r
    var result = pos;\r
    // Rotation around the Z axis\r
    let sinZ = sin(rot.z);\r
    let cosZ = cos(rot.z);\r
    var temp_x = result.x * cosZ - result.y * sinZ;\r
    var temp_y = result.x * sinZ + result.y * cosZ;\r
    result.x = temp_x;\r
    result.y = temp_y;\r
    // Rotation around the Y axis\r
    let sinY = sin(rot.y);\r
    let cosY = cos(rot.y);\r
    temp_x = result.x * cosY + result.z * sinY;\r
    var temp_z = result.z * cosY - result.x * sinY;\r
    result.x = temp_x;\r
    result.z = temp_z;\r
    // Rotation around the X axis\r
    let sinX = sin(rot.x);\r
    let cosX = cos(rot.x);\r
    temp_y = result.y * cosX - result.z * sinX;\r
    temp_z = result.y * sinX + result.z * cosX;\r
    result.y = temp_y;\r
    result.z = temp_z;\r
    return result;\r
}\r
\r
fn rotateXY(vec: vec3f, aX: f32, aY: f32) -> vec3f {\r
    // Rotation around the X axis\r
    let sinX = sin(aX);\r
    let cosX = cos(aX);\r
    let temp_y = vec.y * cosX - vec.z * sinX;\r
    let temp_z = vec.y * sinX + vec.z * cosX;\r
    let rotatedX = vec3f(vec.x, temp_y, temp_z);\r
    // Rotation around the Y axis (applied to the result of the X rotation)\r
    let sinY = sin(aY);\r
    let cosY = cos(aY);\r
    let temp_x = rotatedX.x * cosY + rotatedX.z * sinY;\r
    let temp_z_final = rotatedX.z * cosY - rotatedX.x * sinY;\r
    return vec3f(temp_x, rotatedX.y, temp_z_final);\r
}\r
\r
fn hsv2rgb(c: vec3f) -> vec3<f32> {\r
    let K = vec4<f32>(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\r
    let p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\r
    return c.z * mix(K.xxx, clamp(p - K.xxx, vec3<f32>(0.0), vec3<f32>(1.0)), c.y);\r
}\r
\r
fn rgb2hsv(c: vec3f) -> vec3<f32> {\r
    let K = vec4<f32>(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\r
    let p = mix(vec4<f32>(c.zy, K.wz), vec4<f32>(c.yz, K.xy), step(c.b, c.g));\r
    let q = mix(vec4<f32>(p.xyw, c.r), vec4<f32>(c.r, p.yzx), step(p.x, c.r));\r
    let d = q.x - min(q.w, q.y);\r
    let e = 1.0e-10;\r
    return vec3<f32>(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\r
}\r
\r
fn blinnPhong(\r
  // Environment\r
  rd: vec3<f32>,\r
  normal: vec3<f32>,\r
  minBright: f32,\r
  // Material\r
  pos: vec3<f32>,\r
  diffuseColor: vec3<f32>,\r
  shininess: f32,\r
  // Light\r
  lightPos: vec3<f32>,\r
  lightColor: vec3<f32>,\r
  power: f32,\r
) -> vec3<f32> {\r
    let viewDir = -rd;\r
    var lightDir = lightPos - pos;\r
    var distance = length(lightDir); distance *= distance;\r
    lightDir = normalize(lightDir);\r
    let lambertian = dot(normal, lightDir);\r
\r
    var specular = 0.;\r
    if lambertian > 0. {\r
        let halfDir = normalize(lightDir + viewDir);\r
        let specAngle = max(dot(halfDir, normal), 0.);\r
        specular = pow(specAngle, shininess);\r
    }\r
\r
    let lightPower = lightColor * power / distance;\r
    let ambientColor = minBright * mix(diffuseColor, lightColor, .5);\r
\r
    let colorLinear = ambientColor +\r
      (\r
        diffuseColor *    lambertian * lightPower +\r
        /* specColor * */ specular   * lightPower\r
      );\r
\r
    return colorLinear;\r
}\r
\r
// https://iquilezles.org/articles/distfunctions/ 💪\r
\r
fn sdSphere(p: vec3f, s: f32) -> f32 {\r
  return length(p) - s;\r
}\r
\r
fn sdBox(p: vec3f, b: vec3f) -> f32 {\r
    let q = abs(p) - b;\r
    return length(max(q, vec3<f32>(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);\r
}\r
\r
fn sdCapsule(p: vec3f, a: vec3f, b: vec3f, r: f32) -> f32 {\r
    let pa = p - a;\r
    let ba = b - a;\r
    let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);\r
    return length(pa - ba * h) - r;\r
}\r
\r
fn opSmoothUnion(d1: f32, d2: f32, k: f32) -> f32 {\r
    let h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);\r
    return mix(d2, d1, h) - k * h * (1.0 - h);\r
}\r
\r
fn opXor(d1: f32, d2: f32) -> f32 {\r
    return max(min(d1, d2), -max(d1, d2));\r
}\r
\r
fn opSmoothSubtraction(d1: f32, d2: f32, k: f32) -> f32 {\r
    return -opSmoothUnion(d1, -d2, k);\r
}\r
\r
// https://gist.github.com/munrocket/236ed5ba7e409b8bdf1ff6eca5dcdc39#simplex-noise\r
\r
//  MIT License. © Ian McEwan, Stefan Gustavson, Munrocket, Johan Helsing\r
fn mod289(x: vec2f) -> vec2f {\r
    return x - floor(x * (1. / 289.)) * 289.;\r
}\r
\r
fn mod289_3(x: vec3f) -> vec3f {\r
    return x - floor(x * (1. / 289.)) * 289.;\r
}\r
\r
fn permute3(x: vec3f) -> vec3f {\r
    return mod289_3(((x * 34.) + 1.) * x);\r
}\r
//  MIT License. © Ian McEwan, Stefan Gustavson, Munrocket\r
fn snoise(v: vec2f) -> f32 {\r
    let C = vec4(\r
        0.211324865405187, // (3.0-sqrt(3.0))/6.0\r
        0.366025403784439, // 0.5*(sqrt(3.0)-1.0)\r
        -0.577350269189626, // -1.0 + 2.0 * C.x\r
        0.024390243902439 // 1.0 / 41.0\r
    );\r
\r
    // First corner\r
    var i = floor(v + dot(v, C.yy));\r
    let x0 = v - i + dot(i, C.xx);\r
\r
    // Other corners\r
    var i1 = select(vec2(0., 1.), vec2(1., 0.), x0.x > x0.y);\r
\r
    // x0 = x0 - 0.0 + 0.0 * C.xx ;\r
    // x1 = x0 - i1 + 1.0 * C.xx ;\r
    // x2 = x0 - 1.0 + 2.0 * C.xx ;\r
    var x12 = x0.xyxy + C.xxzz;\r
    x12.x = x12.x - i1.x;\r
    x12.y = x12.y - i1.y;\r
\r
    // Permutations\r
    i = mod289(i); // Avoid truncation effects in permutation\r
\r
    var p = permute3(permute3(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));\r
    var m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), vec3(0.));\r
    m *= m;\r
    m *= m;\r
\r
    // Gradients: 41 points uniformly over a line, mapped onto a diamond.\r
    // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)\r
    let x = 2. * fract(p * C.www) - 1.;\r
    let h = abs(x) - 0.5;\r
    let ox = floor(x + 0.5);\r
    let a0 = x - ox;\r
\r
    // Normalize gradients implicitly by scaling m\r
    // Approximation of: m *= inversesqrt( a0*a0 + h*h );\r
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);\r
\r
    // Compute final noise value at P\r
    let g = vec3(a0.x * x0.x + h.x * x0.y, a0.yz * x12.xz + h.yz * x12.yw);\r
    return 130. * dot(m, g);\r
}\r
\r
// Translated from:\r
// https://github.com/ashima/webgl-noise/blob/master/src/noise3D.glsl\r
fn mod289_v3(x: vec3<f32>) -> vec3<f32> {\r
  return x - floor(x * (1.0 / 289.0)) * 289.0;\r
}\r
fn mod289_v4(x: vec4<f32>) -> vec4<f32> {\r
  return x - floor(x * (1.0 / 289.0)) * 289.0;\r
}\r
fn permute(x: vec4<f32>) -> vec4<f32> {\r
  return mod289_v4((x * 34.0 + 10.0) * x);\r
}\r
fn taylorInvSqrt(r: vec4<f32>) -> vec4<f32> {\r
  return 1.79284291400159 - 0.85373472095314 * r;\r
}\r
fn snoise3d(v: vec3<f32>) -> f32 {\r
  let C: vec2<f32> = vec2<f32>(1.0/6.0, 1.0/3.0);\r
  let D: vec4<f32> = vec4<f32>(0.0, 0.5, 1.0, 2.0);\r
  var i: vec3<f32> = floor(v + dot(v, vec3<f32>(C.y)));\r
  let x0: vec3<f32> = v - i + dot(i, vec3<f32>(C.x));\r
  let g: vec3<f32> = step(x0.yzx, x0.xyz);\r
  let l: vec3<f32> = 1.0 - g;\r
  let i1: vec3<f32> = min(g.xyz, l.zxy);\r
  let i2: vec3<f32> = max(g.xyz, l.zxy);\r
  let x1: vec3<f32> = x0 - i1 + vec3<f32>(C.x);\r
  let x2: vec3<f32> = x0 - i2 + vec3<f32>(C.y);\r
  let x3: vec3<f32> = x0 - vec3<f32>(D.y);\r
  i = mod289_v3(i);\r
  let p: vec4<f32> = permute(permute(permute(\r
      i.z + vec4<f32>(0.0, i1.z, i2.z, 1.0))\r
      + i.y + vec4<f32>(0.0, i1.y, i2.y, 1.0))\r
      + i.x + vec4<f32>(0.0, i1.x, i2.x, 1.0));\r
  let n_: f32 = 0.142857142857;\r
  let ns: vec3<f32> = n_ * D.wyz - D.xzx;\r
  let j: vec4<f32> = p - 49.0 * floor(p * ns.z * ns.z);\r
  let x_: vec4<f32> = floor(j * ns.z);\r
  let y_: vec4<f32> = floor(j - 7.0 * x_);\r
  let x: vec4<f32> = x_ * ns.x + vec4<f32>(ns.y);\r
  let y: vec4<f32> = y_ * ns.x + vec4<f32>(ns.y);\r
  let h: vec4<f32> = 1.0 - abs(x) - abs(y);\r
  let b0: vec4<f32> = vec4<f32>(x.xy, y.xy);\r
  let b1: vec4<f32> = vec4<f32>(x.zw, y.zw);\r
  let s0: vec4<f32> = floor(b0) * 2.0 + 1.0;\r
  let s1: vec4<f32> = floor(b1) * 2.0 + 1.0;\r
  let sh: vec4<f32> = -step(h, vec4<f32>(0.0));\r
  let a0: vec4<f32> = b0.xzyw + s0.xzyw * sh.xxyy;\r
  let a1: vec4<f32> = b1.xzyw + s1.xzyw * sh.zzww;\r
  let p0: vec3<f32> = vec3<f32>(a0.xy, h.x);\r
  let p1: vec3<f32> = vec3<f32>(a0.zw, h.y);\r
  let p2: vec3<f32> = vec3<f32>(a1.xy, h.z);\r
  let p3: vec3<f32> = vec3<f32>(a1.zw, h.w);\r
  let norm: vec4<f32> = taylorInvSqrt(vec4<f32>(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));\r
  let p0_norm: vec3<f32> = p0 * norm.x;\r
  let p1_norm: vec3<f32> = p1 * norm.y;\r
  let p2_norm: vec3<f32> = p2 * norm.z;\r
  let p3_norm: vec3<f32> = p3 * norm.w;\r
  var m: vec4<f32> = max(0.5 - vec4<f32>(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), vec4<f32>(0.0));\r
  m = m * m;\r
  return 105.0 * dot(m * m, vec4<f32>(dot(p0_norm, x0), dot(p1_norm, x1), dot(p2_norm, x2), dot(p3_norm, x3)));\r
}\r
\r
// #FUNCTIONS\r
// #RAY_MARCH_FUNCTIONS\r
`,R=`struct SdMaterial {\r
    index: i32,\r
    dist: f32,\r
    pos: vec3<f32>,\r
    color: vec3<f32>,\r
    collisionGroup: i32,\r
}\r
\r
// #SD-INDIVIDUAL-MATERIALS\r
\r
fn sdMaterials(pos: vec3<f32>) -> SdMaterial {\r
    // #SD-MATERIALS-FUNC\r
}\r
\r
// This function is exclusive for calcNormal\r
fn map(pos: vec3<f32>) -> f32 {\r
    // #MAP\r
}\r
\r
fn calcNormal(pos: vec3<f32>) -> vec3<f32> {\r
    var h = 1e-4;\r
    var k = vec2<f32>(1., -1.);\r
    return normalize(\r
        k.xyy * map(pos + k.xyy * h) +\r
        k.yyx * map(pos + k.yyx * h) +\r
        k.yxy * map(pos + k.yxy * h) +\r
        k.xxx * map(pos + k.xxx * h)\r
    );\r
}\r
\r
// #LIGHT-INDIVIDUAL-MATERIALS\r
\r
fn calcLight(\r
    ro: vec3<f32>,\r
    rd: vec3<f32>,\r
    pos: vec3<f32>,\r
    normal: vec3<f32>,\r
    color: vec3<f32>,\r
    materialIndex: i32\r
) -> vec4<f32> {\r
    // #LIGHT-MATERIALS-FUNC\r
}\r
\r
fn calculateDFAO(pos: vec3<f32>, normal: vec3<f32>) -> f32 {\r
    let AO_RADIUS = 1.;\r
    let AO_EPSILON = 1e-4;\r
    let numSamples = 8;\r
    var aoSum = 0.0;\r
    for (var i: i32 = 0; i < numSamples; i++) {\r
        let t_ratio = f32(i + 1) / f32(numSamples - 1);\r
        let t_real_dist = AO_EPSILON + t_ratio * (AO_RADIUS - AO_EPSILON);\r
        let samplePos = pos + normal * t_real_dist;\r
        let dist = sdMaterials(samplePos).dist;\r
        let visibility = clamp(dist / t_real_dist, 0f, 1f);\r
        aoSum += (1f - visibility) * (1f - t_ratio); \r
    }\r
    let aoFactor = 1f - aoSum / f32(numSamples);\r
    return clamp(aoFactor, 0f, 1f);\r
}\r
\r
struct Scene {\r
    dist: f32,\r
    pos: vec3<f32>,\r
    normal: vec3<f32>,\r
    color: vec4<f32>,\r
};\r
\r
const RM_MAX_ITER: i32 = 1024;\r
const RM_MIN_DIST: f32 = 1e-4;\r
const RM_MAX_DIST: f32 = 1e4;\r
fn rayMarch(ro: vec3<f32>, rd: vec3<f32>) -> SdMaterial {\r
    var totalDist = 0.0;\r
    var material = SdMaterial(-1, 0.0, vec3<f32>(0.0), vec3<f32>(0.0), -1);\r
    for (var i: i32 = 0; i < RM_MAX_ITER; i++) {\r
        let pos = ro + rd * totalDist;\r
        material = sdMaterials(pos);\r
        let currDist = material.dist;\r
        if currDist < RM_MIN_DIST {\r
            material.dist = totalDist;\r
            return material;\r
        }\r
        totalDist += currDist;\r
        if totalDist > RM_MAX_DIST {\r
            break;\r
        }\r
    }\r
    return SdMaterial(-1, -1.0, vec3<f32>(0.0), vec3<f32>(0.0), -1);\r
}\r
\r
fn calcScene(uv: vec2<f32>) -> Scene {\r
    var dir2d = vec2<f32>(uv.x, 1. - uv.y) * 2. - 1.;\r
    dir2d.x *= U.aspectRatio;\r
\r
    let pos = vec3<f32>(U.camPosX, U.camPosY, U.camPosZ);\r
    let spherical = vec3<f32>(U.camSphericalR, U.camSphericalT, U.camSphericalP);\r
\r
    let radFoc = radians(U.camFov);\r
    let focalLength = 1. / tan(radFoc * .5);\r
\r
    var ro = vec3<f32>(0.);\r
    ro.z += spherical.x;\r
    ro = rotateXY(ro, spherical.z, spherical.y);\r
    ro += pos;\r
\r
    var rd = normalize(vec3<f32>(dir2d, -focalLength));\r
    rd = rotateXY(rd, spherical.z, spherical.y);\r
\r
    let material = rayMarch(ro, rd);\r
\r
    var finalPos: vec3<f32>;\r
    var finalNormal: vec3<f32>;\r
    var finalColor = vec4<f32>(0.0, 0.0, 0.0, 1.0);\r
\r
    if material.index != -1 {\r
        finalPos = ro + rd * material.dist;\r
        finalNormal = calcNormal(finalPos);\r
        finalColor = calcLight(\r
            ro,\r
            rd,\r
            finalPos,\r
            finalNormal,\r
            material.color,\r
            material.index\r
        );\r
    }\r
\r
    return Scene(material.dist, finalPos, finalNormal, finalColor);\r
}\r
`;function z({sdWGSL:a,materialSdFunctions:r}){function e(s,o){const c=`vec3<f32>(U.material${o}Px, U.material${o}Py, U.material${o}Pz)`,u=`vec3<f32>(U.material${o}Rx, U.material${o}Ry, U.material${o}Rz)`;return`
        fn sdMaterial${o}(posIn: vec3<f32>) -> f32 {
          let mRotation = ${u};
          var pos = posIn - ${c};
          if length(mRotation) != 0.0 {
            pos = rotate(pos, mRotation);
          }
          ${s}
        }`}const t=r.map(e).join(`
`);a=a.replace("// #SD-INDIVIDUAL-MATERIALS",t);function n(s){return`
        curDist = sdMaterial${s}(pos);
        if curDist < material.dist {
          material.index = ${s};
          material.dist = curDist;
          material.pos = vec3<f32>(
            U.material${s}Px,
            U.material${s}Py,
            U.material${s}Pz
          );
          material.color = vec3<f32>(
            U.material${s}Cr,
            U.material${s}Cg,
            U.material${s}Cb
          );
        }`}const i=`
      var material = SdMaterial(-1, 1e10, vec3<f32>(0.), vec3<f32>(0.), -1);
      var curDist: f32;

      ${r.map((s,o)=>n(o)).join(`
`)}

      return material;
    `;return a=a.replace("// #SD-MATERIALS-FUNC",i),a}function U({materialSdFunctions:a,sdWGSL:r}){function e(n){return`dist = min(dist, sdMaterial${n}(pos));`}const t=`
      var dist: f32 = 1e10;
      var accDist: f32;

      ${a.map((n,i)=>e(i)).join(`
`)}

      return dist;`;return r=r.replace("// #MAP",t),r}function C({materialLightFunctions:a,sdWGSL:r}){function e(s,o){return s||(s=`
          let lamb = dot(normal, -rd); // Camera as light
          let aoFactor = calculateDFAO(pos, normal);
          let finalColor = color * sqrt(lamb) * aoFactor;
          return vec4f(finalColor, 1.);`),`
        fn calcLightMaterial${o}(
          ro: vec3<f32>,
          rd: vec3<f32>,
          pos: vec3<f32>,
          normal: vec3<f32>,
          color: vec3<f32>
        ) -> vec4<f32> {
            ${s}
        }`}const t=a.map(e).join(`
`);r=r.replace("// #LIGHT-INDIVIDUAL-MATERIALS",t);function n(s){return`
        if(materialIndex == ${s}) {
          finalColor = calcLightMaterial${s}(ro, rd, pos, normal, color);
        }`}const i=`
      var finalColor = vec4<f32>(0.0);
      ${a.map((s,o)=>n(o)).join(`
`)}
      return finalColor;`;return r=r.replace("// #LIGHT-MATERIALS-FUNC",i),r}function G(a){let r=R;const e=a.map(n=>n.sdFunc),t=a.map(n=>n.lightFunc);return r=z({sdWGSL:r,materialSdFunctions:e}),r=U({materialSdFunctions:e,sdWGSL:r}),r=C({sdWGSL:r,materialLightFunctions:t}),r}function F({functions:a,rtUniformKeys:r,materialFuncs:e,nTextures:t,usePrevFrameTex:n}){let i=_;if(i=i.replace("UNIFORMS: f32, // #UNIFORMS",r.map(s=>`${s}: f32,`).join(`
`)),t>0){let s=function(c){return`
        @group(1) @binding(${c}) var tex${c}: texture_2d<f32>;
        fn getTex${c}Sample(uv: vec2<f32>) -> vec4<f32> {
          return textureSample(tex${c}, u_sampler, uv);
        }`};const o=new Array(t).fill(0).map((c,u)=>s(u)).join(`
`);i=i.replace("// #GROUP-1-BINDING-X",o)}if(n&&(i=i.replace("// #GROUP-2-BINDING-X",`
      @group(2) @binding(0) var prevFrameTex: texture_2d<f32>;
      fn getPrevFrameTexSample(uv: vec2<f32>) -> vec4<f32> {
        return textureSample(prevFrameTex, u_sampler, uv);
      }`)),a&&(i=i.replace("// #FUNCTIONS",a)),e.length>0){const s=G(e);i=i.replace("// #RAY_MARCH_FUNCTIONS",s)}return i}function M({main:a,functions:r,rtUniformKeys:e,materialFuncs:t,nTextures:n,usePrevFrameTex:i,useInterlacing:s}){const o=F({functions:r,materialFuncs:t,nTextures:n,rtUniformKeys:e,usePrevFrameTex:i});t.length>0&&!a&&(a=`
      let scene = calcScene(uv);
      return vec4f(scene.color.rgb, 1.0);
    `);let c=`
    ${o}
    @fragment
    fn main(@location(0) fragCoord: vec2f) -> @location(0) vec4f {
        let uv = 1. - fragCoord.xy;
        // #INTERLACING
        ${a??"return vec4f(0, 0, 0, 1);"}
    }
  `;return s&&(c=c.replace("// #INTERLACING",`
      let _prev_pix_ = getPrevFrameTexSample(uv);
      if i32(U.height * uv.y) % 2 == i32(U.frame) % 2 {
        return _prev_pix_;
      }
    `)),c}class A{device;buffer;uniform={};uniformBindGroupLayout;uniformBindGroup;constructor(r,e){this.device=r;const t=Object.keys(e);this.buffer=r.createBuffer({size:t.length*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),t.forEach((n,i)=>{this.uniform[n]={value:e[n],offSet:i*4},this.set(n,e[n])}),this.uniformBindGroupLayout=r.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"non-filtering"}}]}),this.uniformBindGroup=this.device.createBindGroup({layout:this.uniformBindGroupLayout,entries:[{binding:0,resource:{buffer:this.getBuffer()}},{binding:1,resource:this.device.createSampler({addressModeU:"repeat",addressModeV:"repeat",magFilter:"nearest",minFilter:"nearest"})}]})}getBuffer(){return this.buffer}getKeysSortedByOffset(){return Object.keys(this.uniform).toSorted((r,e)=>this.uniform[r].offSet-this.uniform[e].offSet)}set(r,e){if(!this.uniform[r])throw new Error(`Uniform ${r} not found`);this.uniform[r].value=e,this.device.queue.writeBuffer(this.buffer,this.uniform[r].offSet,new Float32Array([e]))}get(r){if(!this.uniform[r])throw new Error(`Uniform ${r} not found`);return this.uniform[r].value}}class D{texs;device;presentationFormat;textures;textureEntries;textureBindGroupLayout;constructor(r,e,t){this.texs=t,this.device=r,this.presentationFormat=e,this.textures=this.texs.map(({width:n,height:i})=>this.device.createTexture({size:[n,i,1],format:this.presentationFormat,usage:GPUTextureUsage.COPY_DST|GPUTextureUsage.TEXTURE_BINDING})),this.textureEntries=this.textures.map((n,i)=>({binding:i,resource:n.createView()})),this.textureBindGroupLayout=r.createBindGroupLayout({entries:t.map((n,i)=>({binding:i,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"unfilterable-float"}}))})}setTexture(r,e){const t=this.texs[r].width,n=this.texs[r].height,i=this.textures[r];this.device.queue.writeTexture({texture:i},e,{offset:0,bytesPerRow:t*4,rowsPerImage:n},[t,n,1]),this.textureEntries[r].resource=i.createView()}getTextureEntries(){return this.textureEntries}length(){return this.texs.length}}class N{pingPongBindGroupLayout;bindGroupPingIn;bindGroupPongIn;currentReadTexture;currentReadTextureView;currentWriteTexture;currentWriteTextureView;currentBindGroupIn;offscreenTextureSize;constructor(r,e,t){this.offscreenTextureSize=[r.width,r.height,1];const n=e.createTexture({size:this.offscreenTextureSize,format:t,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),i=e.createTexture({size:this.offscreenTextureSize,format:t,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),s=n.createView(),o=i.createView();this.pingPongBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"unfilterable-float"}}]}),this.bindGroupPingIn=e.createBindGroup({layout:this.pingPongBindGroupLayout,entries:[{binding:0,resource:n.createView()}]}),this.bindGroupPongIn=e.createBindGroup({layout:this.pingPongBindGroupLayout,entries:[{binding:0,resource:i.createView()}]}),this.currentReadTexture=n,this.currentReadTextureView=s,this.currentWriteTexture=i,this.currentWriteTextureView=o,this.currentBindGroupIn=this.bindGroupPingIn}preSubmit(){}swap(){const r=this.currentReadTexture,e=this.currentReadTextureView,t=this.currentBindGroupIn;this.currentReadTexture=this.currentWriteTexture,this.currentReadTextureView=this.currentWriteTextureView,this.currentBindGroupIn=t===this.bindGroupPingIn?this.bindGroupPongIn:this.bindGroupPingIn,this.currentWriteTexture=r,this.currentWriteTextureView=e}}async function E({device:a,presentationFormat:r,context:e,canvas:t,main:n,materialFuncs:i,functions:s,rtUniform:o,rtTexture:c,usePrevFrameTex:u,useInterlacing:v}){const h=[o.uniformBindGroupLayout,c.textureBindGroupLayout];let f=null;u&&(f=new N(t,a,r),h.push(f.pingPongBindGroupLayout));const l=M({main:n,functions:s,materialFuncs:i,rtUniformKeys:o.getKeysSortedByOffset(),nTextures:c.length(),usePrevFrameTex:u,useInterlacing:v}),g=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:h}),vertex:{module:a.createShaderModule({code:I}),entryPoint:"main"},fragment:{module:a.createShaderModule({code:l}),entryPoint:"main",targets:[{format:r}]},primitive:{topology:"triangle-strip",frontFace:"ccw",stripIndexFormat:"uint32"}});let y=0;const T=performance.now()/1e3;function w(p){const x=performance.now()/1e3-T;o.set("frame",y),o.set("time",x),o.set("aspectRatio",t.width/t.height),o.set("width",t.width),o.set("height",t.height),o.set("camPosX",p.pos.x),o.set("camPosY",p.pos.y),o.set("camPosZ",p.pos.z),o.set("camSphericalR",p.spherical.radius),o.set("camSphericalT",p.spherical.theta),o.set("camSphericalP",p.spherical.phi),o.set("camFov",p.fov)}function b({camera:p}){w(p);const x={colorAttachments:[{view:f?f.currentWriteTextureView:e.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:1},storeOp:"store"}]},d=a.createCommandEncoder(),m=d.beginRenderPass(x);m.setPipeline(g),m.setBindGroup(0,o.uniformBindGroup);const S=a.createBindGroup({layout:g.getBindGroupLayout(1),entries:c.getTextureEntries()});m.setBindGroup(1,S),f&&m.setBindGroup(2,f.currentBindGroupIn),m.draw(4,1,0,0),m.end(),f&&d.copyTextureToTexture({texture:f.currentWriteTexture},{texture:e.getCurrentTexture()},f.offscreenTextureSize),a.queue.submit([d.finish()]),f&&f.swap(),y++}return b}async function L(){const a=await navigator.gpu.requestAdapter();if(!a)throw new Error("No adapter found");const r=a.features.has("texture-compression-bc");return r||console.warn("shader-f16 not available"),{device:await a.requestDevice({requiredFeatures:r?["shader-f16"]:[]}),presentationFormat:navigator.gpu.getPreferredCanvasFormat()}}class B{setPos;setRot;setColor;constructor({material:r,rt:e,index:t}){r.pos||(r.pos={x:0,y:0,z:0}),r.color||(r.color={r:1,g:1,b:1}),r.rotation||(r.rotation={x:0,y:0,z:0}),r.collisionGroup||(r.collisionGroup=-1);const n=e.registerUniform(`material${t}Px`,r.pos.x),i=e.registerUniform(`material${t}Py`,r.pos.y),s=e.registerUniform(`material${t}Pz`,r.pos.z);this.setPos=l=>{l.x!==void 0&&n(l.x),l.y!==void 0&&i(l.y),l.z!==void 0&&s(l.z)};const o=e.registerUniform(`material${t}Rx`,r.rotation.x),c=e.registerUniform(`material${t}Ry`,r.rotation.y),u=e.registerUniform(`material${t}Rz`,r.rotation.z);this.setRot=l=>{l.x!==void 0&&o(l.x),l.y!==void 0&&c(l.y),l.z!==void 0&&u(l.z)};const v=e.registerUniform(`material${t}Cr`,r.color.r),h=e.registerUniform(`material${t}Cg`,r.color.g),f=e.registerUniform(`material${t}Cb`,r.color.b);this.setColor=l=>{l.r!==void 0&&v(l.r),l.g!==void 0&&h(l.g),l.b!==void 0&&f(l.b)}}}class ${shoot;fps;fpsCounter=0;showFps;cb;constructor({cb:r,shoot:e,fps:t,showFps:n}){this.shoot=e,this.cb=r,this.fps=t,this.showFps=n}startFpsCounter(){const r=document.createElement("div");r.setAttribute("style",` position: absolute;
        top: 0;
        left: 0;
        color: green;
        background: black;
        font-size: 16px;
        font-family: monospace;
        pointer-events: none;`),document.body.appendChild(r),setInterval(()=>{r.innerText=`FPS: ${this.fpsCounter}`,this.fpsCounter=0},1e3)}start(){this.showFps&&this.startFpsCounter();const r=this.cb,e=this.shoot,t=()=>{this.fpsCounter++},n=this.fps;let i=()=>{requestAnimationFrame(i),r(),e(),t()};if(n!==void 0){const s=1e3/n;let o=0;i=c=>{requestAnimationFrame(i);const u=c-o;u>s&&(o=c-u%s,r(),e(),t())}}requestAnimationFrame(i)}}function X(a){const r=document.createElement("canvas");return r.height=a??window.innerHeight,r.width=r.height*(window.innerWidth/window.innerHeight),r.style.width="100vw",r.style.height="100vh",a&&(r.style.imageRendering="pixelated"),document.body.appendChild(r),r}class O{canvas;main;functions;render;initalCustomUniforms={};setUniform;materialFuncs=[];usePrevFrameTex;useInterlacing;setDeviceTexure;texs;fps;showFps;camera={pos:{x:0,y:0,z:0},spherical:{radius:0,theta:0,phi:0},fov:90};constructor({main:r,functions:e,texs:t,usePrevFrameTex:n,useInterlacing:i,fps:s,height:o,showFps:c}={}){this.canvas=X(o),this.main=r,this.functions=e,this.texs=t??[],this.useInterlacing=i,this.usePrevFrameTex=this.useInterlacing||n,this.fps=s,this.showFps=c}registerMaterial(r){if(this.render)throw new Error("Render already built");const e=this.materialFuncs.length,t=new B({rt:this,material:r,index:e});return this.materialFuncs.push({sdFunc:r.sdFunc,lightFunc:r.lightFunc}),t}setTex(r,e){if(!this.setDeviceTexure)throw new Error("Render not built");this.setDeviceTexure(r,e)}registerUniform(r,e){if(this.render)throw new Error("Render already built");return this.initalCustomUniforms[r]=e??0,n=>{if(!this.setUniform)throw new Error("Render not built");this.setUniform(r,n),this.initalCustomUniforms[r]=n}}async build(){const{device:r,presentationFormat:e}=await L(),t=this.canvas.getContext("webgpu");if(!t)throw new Error("No context found");t.configure({device:r,format:e,alphaMode:"opaque",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_DST});const n=new A(r,{frame:0,time:0,aspectRatio:this.canvas.width/this.canvas.height,width:this.canvas.width,height:this.canvas.height,camPosX:this.camera.pos.x??0,camPosY:this.camera.pos.y??0,camPosZ:this.camera.pos.z??0,camSphericalR:this.camera.spherical.radius??0,camSphericalT:this.camera.spherical.theta??0,camSphericalP:this.camera.spherical.phi??0,camFov:this.camera.fov??90,...this.initalCustomUniforms}),i=new D(r,e,this.texs);this.render=await E({device:r,presentationFormat:e,context:t,canvas:this.canvas,main:this.main,materialFuncs:this.materialFuncs,functions:this.functions,rtUniform:n,rtTexture:i,usePrevFrameTex:this.usePrevFrameTex,useInterlacing:this.useInterlacing}),this.setUniform=(s,o)=>{n.set(s,o)},this.setDeviceTexure=(s,o)=>{i.setTexture(s,o)}}async start(r){if(await this.build(),r?.onBuild?.(),r?.once){this.render?.({camera:this.camera});return}new $({cb:r?.onFrame??(()=>{}),shoot:()=>{this.render?.({camera:this.camera})},fps:this.fps,showFps:this.showFps}).start()}}export{O as R};
