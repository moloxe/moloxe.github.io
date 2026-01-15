const _=`struct VSOut {\r
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
`,I=`struct GlobalUniform {\r
    UNIFORMS: f32, // #UNIFORMS\r
};\r
\r
@group(0) @binding(0) var <uniform> U: GlobalUniform;\r
@group(0) @binding(1) var u_sampler: sampler;\r
@group(0) @binding(2) var<storage, read_write> arbitrary_result: array<f32>;\r
\r
// Textures template:\r
// #GROUP-1-BINDING-X\r
// Prev. frame (ping-pong) template:\r
// #GROUP-2-BINDING-X\r
\r
const PI = f32(3.1415926535897932384626433832795);\r
const TWO_PI = f32(6.283185307179586476925286766559);\r
const INF = f32(1e10);\r
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
    let colorLinear = ambientColor + (diffuseColor * lambertian * lightPower + /* specColor * */ specular * lightPower);\r
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
    let C: vec2<f32> = vec2<f32>(1.0 / 6.0, 1.0 / 3.0);\r
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
        i.z + vec4<f32>(0.0, i1.z, i2.z, 1.0)\r
    ) + i.y + vec4<f32>(0.0, i1.y, i2.y, 1.0)) + i.x + vec4<f32>(0.0, i1.x, i2.x, 1.0));\r
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
`,U=`struct SdMaterial {\r
    index: i32,\r
    dist: f32,\r
    pos: vec3<f32>,\r
    color: vec3<f32>,\r
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
        k.xyy * map(pos + k.xyy * h) + k.yyx * map(pos + k.yyx * h) + k.yxy * map(pos + k.yxy * h) + k.xxx * map(pos + k.xxx * h)\r
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
const RM_MAX_ITER: i32 = 1024;\r
const RM_MIN_DIST: f32 = 1e-4;\r
const RM_MAX_DIST: f32 = 1e4;\r
fn rayMarch(ro: vec3<f32>, rd: vec3<f32>) -> SdMaterial {\r
    var totalDist = 0.0;\r
    var material = SdMaterial(-1, 0.0, vec3<f32>(0.0), vec3<f32>(0.0));\r
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
    return SdMaterial(-1, -1.0, vec3<f32>(0.0), vec3<f32>(0.0));\r
}\r
\r
fn rayMarchDDA(ro: vec3<f32>, rd: vec3<f32>, voxelSize: f32) -> SdMaterial {\r
    let ro_grid = ro / voxelSize;\r
    var mapPos = floor(ro_grid);\r
    let deltaDist = abs(vec3<f32>(1.0) / rd);\r
    let rayStep = sign(rd);\r
    var sideDist = (rayStep * (mapPos - ro_grid) + (rayStep * 0.5) + 0.5) * deltaDist;\r
    var mask = vec3<f32>(0.0);\r
\r
    for (var i: i32 = 0; i < RM_MAX_ITER; i++) {\r
        if any(mapPos < vec3<f32>(-100.0 / voxelSize)) || any(mapPos > vec3<f32>(100.0 / voxelSize)) { break; }\r
\r
        let voxelCenter = (mapPos + 0.5) * voxelSize;\r
        var material = sdMaterials(voxelCenter);\r
\r
        if material.dist < (voxelSize * 0.5) {\r
            var dist = 0.0;\r
            if mask.x > 0.5 { dist = sideDist.x - deltaDist.x; } else if mask.y > 0.5 { dist = sideDist.y - deltaDist.y; } else { dist = sideDist.z - deltaDist.z; }\r
            material.dist = dist * voxelSize;\r
            return material;\r
        }\r
\r
        if sideDist.x < sideDist.y {\r
            if sideDist.x < sideDist.z {\r
                sideDist.x += deltaDist.x;\r
                mapPos.x += rayStep.x;\r
                mask = vec3<f32>(1.0, 0.0, 0.0);\r
            } else {\r
                sideDist.z += deltaDist.z;\r
                mapPos.z += rayStep.z;\r
                mask = vec3<f32>(0.0, 0.0, 1.0);\r
            }\r
        } else {\r
            if sideDist.y < sideDist.z {\r
                sideDist.y += deltaDist.y;\r
                mapPos.y += rayStep.y;\r
                mask = vec3<f32>(0.0, 1.0, 0.0);\r
            } else {\r
                sideDist.z += deltaDist.z;\r
                mapPos.z += rayStep.z;\r
                mask = vec3<f32>(0.0, 0.0, 1.0);\r
            }\r
        }\r
    }\r
\r
    return SdMaterial(-1, -1.0, vec3<f32>(0.0), vec3<f32>(0.0));\r
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
        aoSum += (1f - visibility) * (1f - t_ratio);\r
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
    // TODO: Play with this XD\r
    // let material = rayMarchDDA(ro, rd, 0.1);\r
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
`;function R({sdWGSL:a,materialSdFunctions:e}){function r(s,i){const l=`vec3<f32>(U.material${i}Px, U.material${i}Py, U.material${i}Pz)`,c=`vec3<f32>(U.material${i}Rx, U.material${i}Ry, U.material${i}Rz)`;return`
        fn sdMaterial${i}(posIn: vec3<f32>) -> f32 {
          let mRotation = ${c};
          var pos = posIn - ${l};
          if length(mRotation) != 0.0 {
            pos = rotate(pos, mRotation);
          }
          ${s}
        }`}const t=e.map(r).join(`
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
        }`}const o=`
      var material = SdMaterial(-1, INF, vec3<f32>(0.), vec3<f32>(0.));
      var curDist: f32;

      ${e.map((s,i)=>n(i)).join(`
`)}

      return material;
    `;return a=a.replace("// #SD-MATERIALS-FUNC",o),a}function M({materialSdFunctions:a,sdWGSL:e}){function r(n){return`dist = min(dist, sdMaterial${n}(pos));`}const t=`
      var dist: f32 = INF;
      var accDist: f32;

      ${a.map((n,o)=>r(o)).join(`
`)}

      return dist;`;return e=e.replace("// #MAP",t),e}function D({materialLightFunctions:a,sdWGSL:e}){function r(s,i){return s||(s=`
          let lamb = dot(normal, -rd); // Camera as light
          let aoFactor = calculateDFAO(pos, normal);
          let finalColor = color * sqrt(lamb) * aoFactor;
          return vec4f(finalColor, 1.);`),`
        fn calcLightMaterial${i}(
          ro: vec3<f32>,
          rd: vec3<f32>,
          pos: vec3<f32>,
          normal: vec3<f32>,
          color: vec3<f32>
        ) -> vec4<f32> {
            ${s}
        }`}const t=a.map(r).join(`
`);e=e.replace("// #LIGHT-INDIVIDUAL-MATERIALS",t);function n(s){return`
        if(materialIndex == ${s}) {
          finalColor = calcLightMaterial${s}(ro, rd, pos, normal, color);
        }`}const o=`
      var finalColor = vec4<f32>(0.0);
      ${a.map((s,i)=>n(i)).join(`
`)}
      return finalColor;`;return e=e.replace("// #LIGHT-MATERIALS-FUNC",o),e}function B(a){let e=U;const r=a.map(n=>n.sdFunc),t=a.map(n=>n.lightFunc);return e=R({sdWGSL:e,materialSdFunctions:r}),e=M({materialSdFunctions:r,sdWGSL:e}),e=D({sdWGSL:e,materialLightFunctions:t}),e}function b({functions:a,rtUniformKeys:e,materialFuncs:r,nTextures:t,usePrevFrameTex:n}){let o=I;if(o=o.replace("UNIFORMS: f32, // #UNIFORMS",e.map(s=>`${s}: f32,`).join(`
`)),t>0){let s=function(l){return`
        @group(1) @binding(${l}) var tex${l}: texture_2d<f32>;
        fn getTex${l}Sample(uv: vec2<f32>) -> vec4<f32> {
          return textureSample(tex${l}, u_sampler, uv);
        }`};const i=new Array(t).fill(0).map((l,c)=>s(c)).join(`
`);o=o.replace("// #GROUP-1-BINDING-X",i)}if(n&&(o=o.replace("// #GROUP-2-BINDING-X",`
      @group(2) @binding(0) var prevFrameTex: texture_2d<f32>;
      fn getPrevFrameTexSample(uv: vec2<f32>) -> vec4<f32> {
        return textureSample(prevFrameTex, u_sampler, uv);
      }`)),a&&(o=o.replace("// #FUNCTIONS",a)),r.length>0){const s=B(r);o=o.replace("// #RAY_MARCH_FUNCTIONS",s)}return o}function F({main:a,functions:e,rtUniformKeys:r,materialFuncs:t,nTextures:n,usePrevFrameTex:o,useInterlacing:s}){const i=b({functions:e,materialFuncs:t,nTextures:n,rtUniformKeys:r,usePrevFrameTex:o});t.length>0&&!a&&(a=`
      let scene = calcScene(uv);
      return vec4f(scene.color.rgb, 1.0);
    `);let l=`
    ${i}
    @fragment
    fn main(@location(0) fragCoord: vec2f) -> @location(0) vec4f {
        let uv = 1. - fragCoord.xy;
        // #INTERLACING
        ${a??"return vec4f(0, 0, 0, 1);"}
    }
  `;return s&&(l=l.replace("// #INTERLACING",`
      let _prev_pix_ = getPrevFrameTexSample(uv);
      if i32(U.height * uv.y) % 2 == i32(U.frame) % 2 {
        return _prev_pix_;
      }
    `)),l}class E{device;buffer;uniform={};uniformBindGroupLayout;uniformBindGroup;constructor(e,r){this.device=e;const t=Object.keys(r);this.buffer=e.createBuffer({size:t.length*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),t.forEach((n,o)=>{this.uniform[n]={value:r[n],offSet:o*4},this.set(n,r[n])}),this.uniformBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"non-filtering"}}]}),this.uniformBindGroup=this.device.createBindGroup({layout:this.uniformBindGroupLayout,entries:[{binding:0,resource:{buffer:this.getBuffer()}},{binding:1,resource:this.device.createSampler({addressModeU:"repeat",addressModeV:"repeat",magFilter:"nearest",minFilter:"nearest"})}]})}getBuffer(){return this.buffer}getKeysSortedByOffset(){return Object.keys(this.uniform).toSorted((e,r)=>this.uniform[e].offSet-this.uniform[r].offSet)}set(e,r){if(!this.uniform[e])throw new Error(`Uniform ${e} not found`);this.uniform[e].value=r,this.device.queue.writeBuffer(this.buffer,this.uniform[e].offSet,new Float32Array([r]))}get(e){if(!this.uniform[e])throw new Error(`Uniform ${e} not found`);return this.uniform[e].value}getCustomBindingsForCollisions(e){const r=this.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE,sampler:{type:"non-filtering"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),t=this.device.createBindGroup({layout:r,entries:[{binding:0,resource:{buffer:this.getBuffer()}},{binding:1,resource:this.device.createSampler({addressModeU:"repeat",addressModeV:"repeat",magFilter:"nearest",minFilter:"nearest"})},{binding:2,resource:{buffer:e}}]});return{uniformBindGroupLayout:r,uniformBindGroup:t}}}class A{texs;device;textures;textureEntries;textureBindGroupLayout;constructor(e,r){this.texs=r,this.device=e,this.textures=this.texs.map(({width:t,height:n})=>this.device.createTexture({size:[t,n,1],format:"rgba8unorm",usage:GPUTextureUsage.COPY_DST|GPUTextureUsage.TEXTURE_BINDING})),this.textureEntries=this.textures.map((t,n)=>({binding:n,resource:t.createView()})),this.textureBindGroupLayout=e.createBindGroupLayout({entries:r.map((t,n)=>({binding:n,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"unfilterable-float"}}))})}setTexture(e,r){const t=this.texs[e].width,n=this.texs[e].height,o=this.textures[e];this.device.queue.writeTexture({texture:o},r,{offset:0,bytesPerRow:t*4,rowsPerImage:n},[t,n,1])}getTextureEntries(){return this.textureEntries}length(){return this.texs.length}}class N{pingPongBindGroupLayout;bindGroupPingIn;bindGroupPongIn;currentReadTexture;currentReadTextureView;currentWriteTexture;currentWriteTextureView;currentBindGroupIn;offscreenTextureSize;constructor(e,r,t){this.pingPongBindGroupLayout=r.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"unfilterable-float"}}]}),this.bindGroupPingIn={},this.bindGroupPongIn={},this.currentReadTexture={},this.currentReadTextureView={},this.currentWriteTexture={},this.currentWriteTextureView={},this.currentBindGroupIn={},this.offscreenTextureSize=[0,0,1],this.init(e.width,e.height,r,t)}preSubmit(){}swap(){const e=this.currentReadTexture,r=this.currentReadTextureView,t=this.currentBindGroupIn;this.currentReadTexture=this.currentWriteTexture,this.currentReadTextureView=this.currentWriteTextureView,this.currentBindGroupIn=t===this.bindGroupPingIn?this.bindGroupPongIn:this.bindGroupPingIn,this.currentWriteTexture=e,this.currentWriteTextureView=r}resize(e,r,t,n){this.currentReadTexture.destroy(),this.currentWriteTexture.destroy(),this.init(e,r,t,n)}init(e,r,t,n){this.offscreenTextureSize=[e,r,1];const o=t.createTexture({size:this.offscreenTextureSize,format:n,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),s=t.createTexture({size:this.offscreenTextureSize,format:n,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),i=o.createView(),l=s.createView();this.bindGroupPingIn=t.createBindGroup({layout:this.pingPongBindGroupLayout,entries:[{binding:0,resource:o.createView()}]}),this.bindGroupPongIn=t.createBindGroup({layout:this.pingPongBindGroupLayout,entries:[{binding:0,resource:s.createView()}]}),this.currentReadTexture=o,this.currentReadTextureView=i,this.currentWriteTexture=s,this.currentWriteTextureView=l,this.currentBindGroupIn=this.bindGroupPingIn}}async function L({device:a,presentationFormat:e,context:r,canvas:t,main:n,materialFuncs:o,functions:s,rtUniform:i,rtTexture:l,usePrevFrameTex:c,useInterlacing:p,bindGroupLayouts:d,rtPingPong:f,transparent:u}){const v=F({main:n,functions:s,materialFuncs:o,rtUniformKeys:i.getKeysSortedByOffset(),nTextures:l.length(),usePrevFrameTex:c,useInterlacing:p}),T=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:d}),vertex:{module:a.createShaderModule({code:_}),entryPoint:"main"},fragment:{module:a.createShaderModule({code:v}),entryPoint:"main",targets:[{format:e}]},primitive:{topology:"triangle-strip",frontFace:"ccw",stripIndexFormat:"uint32"}});let P=0,x=null;function w(m){const S=performance.now()/1e3;x===null&&(x=performance.now()/1e3);const y=S-x;i.set("frame",P),i.set("time",y),i.set("aspectRatio",t.width/t.height),i.set("width",t.width),i.set("height",t.height),i.set("camPosX",m.pos.x),i.set("camPosY",m.pos.y),i.set("camPosZ",m.pos.z),i.set("camSphericalR",m.spherical.radius),i.set("camSphericalT",m.spherical.theta),i.set("camSphericalP",m.spherical.phi),i.set("camFov",m.fov)}const C=a.createBindGroup({layout:T.getBindGroupLayout(1),entries:l.getTextureEntries()});function z({camera:m}){w(m);const y={colorAttachments:[{view:f?f.currentWriteTextureView:r.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:u?0:1},storeOp:"store"}]},g=a.createCommandEncoder(),h=g.beginRenderPass(y);h.setPipeline(T),h.setBindGroup(0,i.uniformBindGroup),h.setBindGroup(1,C),f&&h.setBindGroup(2,f.currentBindGroupIn),h.draw(4,1,0,0),h.end(),f&&g.copyTextureToTexture({texture:f.currentWriteTexture},{texture:r.getCurrentTexture()},f.offscreenTextureSize),a.queue.submit([g.finish()]),f&&f.swap(),P++}return z}async function $(){const a=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!a)throw new Error("No adapter found");const e=a.features.has("texture-compression-bc");return e||console.warn("shader-f16 not available"),{device:await a.requestDevice({requiredFeatures:e?["shader-f16"]:[]}),presentationFormat:navigator.gpu.getPreferredCanvasFormat()}}class O{setPos;setRot;setColor;setCollisionGroup;checkForCollisions;collisionGroup=-1;index;rt;constructor({material:e,rt:r,index:t}){this.rt=r,e.pos||(e.pos={x:0,y:0,z:0}),e.color||(e.color={r:1,g:1,b:1}),e.rotation||(e.rotation={x:0,y:0,z:0});const n=r.registerUniform(`material${t}Px`,e.pos.x),o=r.registerUniform(`material${t}Py`,e.pos.y),s=r.registerUniform(`material${t}Pz`,e.pos.z);this.setPos=u=>{u.x!==void 0&&n(u.x),u.y!==void 0&&o(u.y),u.z!==void 0&&s(u.z)};const i=r.registerUniform(`material${t}Rx`,e.rotation.x),l=r.registerUniform(`material${t}Ry`,e.rotation.y),c=r.registerUniform(`material${t}Rz`,e.rotation.z);this.setRot=u=>{u.x!==void 0&&i(u.x),u.y!==void 0&&l(u.y),u.z!==void 0&&c(u.z)};const p=r.registerUniform(`material${t}Cr`,e.color.r),d=r.registerUniform(`material${t}Cg`,e.color.g),f=r.registerUniform(`material${t}Cb`,e.color.b);this.setColor=u=>{u.r!==void 0&&p(u.r),u.g!==void 0&&d(u.g),u.b!==void 0&&f(u.b)},e.enableCollisions&&(this.collisionGroup=t),this.setCollisionGroup=r.registerUniform(`material${t}CollisionGroup`,this.collisionGroup),this.index=t}checkCollision(){return this.rt.checkCollision(this.index)}getIndex(){return this.index}}function k({functions:a,rtUniformKeys:e,materialFuncs:r,nTextures:t,usePrevFrameTex:n}){const o=b({functions:a,materialFuncs:r,nTextures:t,rtUniformKeys:e,usePrevFrameTex:n}),s=r.map(c=>c.sdFunc);function i(c,p){return`
      curDist = sdMaterial${c}(pos);
      if curDist < material.dist && i32(U.material${c}CollisionGroup) ${p} params.collisionGroup {
        material.index = ${c};
        material.dist = curDist;
        material.pos = vec3f(
          U.material${c}Px,
          U.material${c}Py,
          U.material${c}Pz
        );
        material.color = vec3f(
          U.material${c}Cr,
          U.material${c}Cg,
          U.material${c}Cb
        );
      }`}return`
    ${o}
    
    struct CollisionParams {
      collisionGroup: i32,
      pos: vec3f,
    }

    @group(2) @binding(0) var<uniform> params: CollisionParams;

    fn sdInternalCollisionGroup(pos: vec3f) -> SdMaterial {
      var material = SdMaterial(-1, INF, vec3f(0.), vec3f(0.));
      var curDist: f32;

      ${s.map((c,p)=>i(p,"==")).join(`
`)}

      return material;
    }

    fn sdExternalCollisionGroup(pos: vec3f) -> SdMaterial {
      var material = SdMaterial(-1, INF, vec3f(0.), vec3f(0.));
      var curDist: f32;

      ${s.map((c,p)=>i(p,"!=")).join(`
`)}

      return material;
    }

    fn calcExternalNormal(pos: vec3f) -> vec3f {
      var h = 1e-4;
      var k = vec2f(1., -1.);
      return normalize(
          k.xyy * sdExternalCollisionGroup(pos + k.xyy * h).dist +
          k.yyx * sdExternalCollisionGroup(pos + k.yyx * h).dist +
          k.yxy * sdExternalCollisionGroup(pos + k.yxy * h).dist +
          k.xxx * sdExternalCollisionGroup(pos + k.xxx * h).dist
      );
    }

    fn calcInternalNormal(pos: vec3f) -> vec3f {
      var h = 1e-4;
      var k = vec2f(1., -1.);
      return normalize(
          k.xyy * sdInternalCollisionGroup(pos + k.xyy * h).dist +
          k.yyx * sdInternalCollisionGroup(pos + k.yyx * h).dist +
          k.yxy * sdInternalCollisionGroup(pos + k.yxy * h).dist +
          k.xxx * sdInternalCollisionGroup(pos + k.xxx * h).dist
      );
    }

    struct CollisionResult {
      index: i32,
      dist: f32,
      normal: vec3f,
    }

    @compute @workgroup_size(1)
    fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
      var pos = params.pos;

      var collision = CollisionResult(-1, INF, vec3f(0));

      for (var i: i32 = 0; i < RM_MAX_ITER; i++) {
        let externalMaterial = sdExternalCollisionGroup(pos);
        let internalMaterial = sdInternalCollisionGroup(pos);
        
        let d = max(externalMaterial.dist, internalMaterial.dist);

        if d < RM_MIN_DIST {
          collision.index = externalMaterial.index;
          collision.dist = d;
          collision.normal = calcExternalNormal(pos);
          break;
        }

        if d > RM_MAX_DIST {
          break;
        }

        var normal: vec3f;
        if externalMaterial.dist > internalMaterial.dist {
          normal = calcExternalNormal(pos);
        } else {
          normal = calcInternalNormal(pos);
        }

        pos = pos - normal * d;
      }

      arbitrary_result[0] = f32(collision.index);
      arbitrary_result[1] = collision.dist;
      arbitrary_result[2] = collision.normal.x;
      arbitrary_result[3] = collision.normal.y;
      arbitrary_result[4] = collision.normal.z;
    }
  `}class X{device;computePipeline;paramsBindGroup;paramsBuffer;uniformBindGroup;resultBufferSize;resultBuffer;rtTexture;constructor({device:e,functions:r,rtUniformKeys:t,materialFuncs:n,nTextures:o,usePrevFrameTex:s,rtUniform:i,rtTexture:l}){this.device=e,this.rtTexture=l;const c=5;this.resultBufferSize=Float32Array.BYTES_PER_ELEMENT*c,this.resultBuffer=e.createBuffer({size:this.resultBufferSize,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});const{uniformBindGroupLayout:p,uniformBindGroup:d}=i.getCustomBindingsForCollisions(this.resultBuffer);this.uniformBindGroup=d,this.paramsBuffer=e.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const f=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}}]});this.paramsBindGroup=e.createBindGroup({layout:f,entries:[{binding:0,resource:{buffer:this.paramsBuffer}}]});const u=[p,this.rtTexture.textureBindGroupLayout,f],v=k({functions:r,rtUniformKeys:t,materialFuncs:n,nTextures:o,usePrevFrameTex:s});this.computePipeline=e.createComputePipeline({layout:e.createPipelineLayout({bindGroupLayouts:u}),compute:{module:e.createShaderModule({code:v}),entryPoint:"main"}})}async checkCollision(e,r){this.device.queue.writeBuffer(this.paramsBuffer,0,new Int32Array([e])),this.device.queue.writeBuffer(this.paramsBuffer,16,new Float32Array([r.x,r.y,r.z]));const t=this.device.createCommandEncoder(),n=t.beginComputePass();n.setPipeline(this.computePipeline),n.setBindGroup(0,this.uniformBindGroup);const o=this.device.createBindGroup({layout:this.computePipeline.getBindGroupLayout(1),entries:this.rtTexture.getTextureEntries()});n.setBindGroup(1,o),n.setBindGroup(2,this.paramsBindGroup),n.dispatchWorkgroups(1),n.end();const s=this.device.createBuffer({size:this.resultBufferSize,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});t.copyBufferToBuffer(this.resultBuffer,0,s,0,this.resultBufferSize),this.device.queue.submit([t.finish()]),await s.mapAsync(GPUMapMode.READ);const i=new Float32Array(s.getMappedRange());try{const l=i[0],c=i[1],p={x:i[2],y:i[3],z:i[4]};return{materialIndex:l,collisionDist:c,collisionNormal:p}}finally{s.unmap()}}}class Y{shoot;fps;fpsCounter=0;showFps;cb;constructor({cb:e,shoot:r,fps:t,showFps:n}){this.shoot=r,this.cb=e,this.fps=t,this.showFps=n}startFpsCounter(){const e=document.createElement("div");e.setAttribute("style",` position: absolute;
        top: 0;
        left: 0;
        color: green;
        background: black;
        font-size: 16px;
        font-family: monospace;
        pointer-events: none;`),document.body.appendChild(e),setInterval(()=>{e.innerText=`FPS: ${this.fpsCounter}`,this.fpsCounter=0},1e3)}start(){this.showFps&&this.startFpsCounter();const e=this.cb,r=this.shoot,t=()=>{this.fpsCounter++},n=this.fps;let o=async()=>{requestAnimationFrame(o),await e(),r(),t()};if(n!==void 0){const s=1e3/n;let i=0;o=async l=>{requestAnimationFrame(o);const c=l-i;c>s&&(i=l-c%s,await e(),r(),t())}}requestAnimationFrame(o)}}function G(a,e){a.height=e??window.innerHeight,a.width=a.height*(window.innerWidth/window.innerHeight)}function V(a,e){const r=document.createElement("canvas");return G(r,a),r.style.position="fixed",r.style.top="0",r.style.left="0",r.style.width="100vw",r.style.height="100vh",e&&(r.style.pointerEvents="none"),a&&(r.style.imageRendering="pixelated"),document.body.appendChild(r),r}class q{canvas;main;functions;render;initalCustomUniforms={};setUniform;materialFuncs=[];usePrevFrameTex;useInterlacing;setDeviceTexure;texs;fps;showFps;transparent;rtCollision;rtUniform;rtPingPong;device;presentationFormat;camera={pos:{x:0,y:0,z:0},spherical:{radius:0,theta:0,phi:0},fov:90};constructor({main:e,functions:r,texs:t,usePrevFrameTex:n,useInterlacing:o,fps:s,height:i,showFps:l,transparent:c}={}){this.canvas=V(i,c),this.main=e,this.functions=r,this.texs=t??[],this.useInterlacing=o,this.usePrevFrameTex=this.useInterlacing||n,this.fps=s,this.showFps=l,this.transparent=c}registerMaterial(e){if(this.render)throw new Error("Render already built");const r=this.materialFuncs.length,t=new O({rt:this,material:e,index:r});return this.materialFuncs.push({sdFunc:e.sdFunc,lightFunc:e.lightFunc}),t}setTex(e,r){if(!this.setDeviceTexure)throw new Error("Render not built");this.setDeviceTexure(e,r)}registerUniform(e,r){if(this.render)throw new Error("Render already built");return this.initalCustomUniforms[e]=r??0,n=>{if(!this.setUniform)throw new Error("Render not built");this.setUniform(e,n),this.initalCustomUniforms[e]=n}}async build(){const{device:e,presentationFormat:r}=await $();this.device=e,this.presentationFormat=r;const t=this.canvas.getContext("webgpu");if(!t)throw new Error("No context found");t.configure({device:e,format:r,alphaMode:this.transparent?"premultiplied":"opaque",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_DST});const n=new E(e,{frame:0,time:0,aspectRatio:this.canvas.width/this.canvas.height,width:this.canvas.width,height:this.canvas.height,camPosX:this.camera.pos.x??0,camPosY:this.camera.pos.y??0,camPosZ:this.camera.pos.z??0,camSphericalR:this.camera.spherical.radius??0,camSphericalT:this.camera.spherical.theta??0,camSphericalP:this.camera.spherical.phi??0,camFov:this.camera.fov??90,...this.initalCustomUniforms});this.rtUniform=n;const o=new A(e,this.texs),s=[n.uniformBindGroupLayout,o.textureBindGroupLayout];this.usePrevFrameTex&&(this.rtPingPong=new N(this.canvas,e,r),s.push(this.rtPingPong.pingPongBindGroupLayout)),this.render=await L({device:e,bindGroupLayouts:s,presentationFormat:r,context:t,canvas:this.canvas,main:this.main,materialFuncs:this.materialFuncs,functions:this.functions,rtUniform:n,rtTexture:o,usePrevFrameTex:this.usePrevFrameTex,useInterlacing:this.useInterlacing,rtPingPong:this.rtPingPong,transparent:this.transparent}),this.setUniform=(i,l)=>{n.set(i,l)},this.setDeviceTexure=(i,l)=>{o.setTexture(i,l)},this.materialFuncs.length>0&&(this.rtCollision=new X({device:e,rtUniformKeys:n.getKeysSortedByOffset(),functions:this.functions,materialFuncs:this.materialFuncs,nTextures:this.texs.length,usePrevFrameTex:this.usePrevFrameTex,rtUniform:n,rtTexture:o}))}checkCollision(e){if(!this.rtCollision||!this.rtUniform)throw new Error("Render not built");const r=this.rtUniform.get(`material${e}Px`),t=this.rtUniform.get(`material${e}Py`),n=this.rtUniform.get(`material${e}Pz`);return this.rtCollision.checkCollision(e,{x:r,y:t,z:n})}async start(e){if(await this.build(),e?.onBuild?.(),e?.once){this.render?.({camera:this.camera});return}new Y({cb:e?.onFrame??(()=>{}),shoot:()=>{this.render?.({camera:this.camera})},fps:this.fps,showFps:this.showFps}).start(),window.addEventListener("resize",()=>{this.resize()})}resize(){G(this.canvas,this.canvas.height),this.rtPingPong&&this.device&&this.presentationFormat&&this.rtPingPong.resize(this.canvas.width,this.canvas.height,this.device,this.presentationFormat)}}export{q as R};
