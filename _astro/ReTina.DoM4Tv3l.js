const _=`struct VSOut {
    @builtin(position) Position: vec4<f32>,
    @location(0)       uvs: vec2<f32>
};

@vertex
fn main(@builtin(vertex_index) VertexIndex: u32) -> VSOut {
    var pos = array<vec2<f32>, 4>(vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(1.0, -1.0));

    var uvs = array<vec2<f32>, 4>(vec2<f32>(1.0, 1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, -1.0));

    var vsOut: VSOut;
    vsOut.Position = vec4<f32>(pos[ VertexIndex ], 0.0, 1.0);
    vsOut.uvs = uvs[ VertexIndex ] * 0.5 + 0.5;
    return vsOut;
}
`,I=`struct GlobalUniform {
    UNIFORMS: f32, // #UNIFORMS
};

@group(0) @binding(0) var <uniform> U: GlobalUniform;
@group(0) @binding(1) var u_sampler: sampler;
@group(0) @binding(2) var<storage, read_write> arbitrary_result: array<f32>;

// Textures template:
// #GROUP-1-BINDING-X
// Prev. frame (ping-pong) template:
// #GROUP-2-BINDING-X

const PI = f32(3.1415926535897932384626433832795);
const TWO_PI = f32(6.283185307179586476925286766559);
const INF = f32(1e10);

fn toSpherical(pos: vec3<f32>) -> vec3<f32> {
    let r = length(pos);
    let theta = acos(pos.z / r);
    let phi = atan2(pos.y, pos.x);
    return vec3<f32>(r, theta, phi);
}

fn toCartesian(sph: vec3<f32>) -> vec3<f32> {
    let r = sph.x;
    let theta = sph.y;
    let phi = sph.z;
    let sinTheta = sin(theta);
    return vec3<f32>(
        r * sinTheta * cos(phi),
        r * sinTheta * sin(phi),
        r * cos(theta)
    );
}

fn rotate(pos: vec3<f32>, rot: vec3<f32>) -> vec3<f32> {
    var result = pos;
    // Rotation around the Z axis
    let sinZ = sin(rot.z);
    let cosZ = cos(rot.z);
    var temp_x = result.x * cosZ - result.y * sinZ;
    var temp_y = result.x * sinZ + result.y * cosZ;
    result.x = temp_x;
    result.y = temp_y;
    // Rotation around the Y axis
    let sinY = sin(rot.y);
    let cosY = cos(rot.y);
    temp_x = result.x * cosY + result.z * sinY;
    var temp_z = result.z * cosY - result.x * sinY;
    result.x = temp_x;
    result.z = temp_z;
    // Rotation around the X axis
    let sinX = sin(rot.x);
    let cosX = cos(rot.x);
    temp_y = result.y * cosX - result.z * sinX;
    temp_z = result.y * sinX + result.z * cosX;
    result.y = temp_y;
    result.z = temp_z;
    return result;
}

fn rotateXY(vec: vec3f, aX: f32, aY: f32) -> vec3f {
    // Rotation around the X axis
    let sinX = sin(aX);
    let cosX = cos(aX);
    let temp_y = vec.y * cosX - vec.z * sinX;
    let temp_z = vec.y * sinX + vec.z * cosX;
    let rotatedX = vec3f(vec.x, temp_y, temp_z);
    // Rotation around the Y axis (applied to the result of the X rotation)
    let sinY = sin(aY);
    let cosY = cos(aY);
    let temp_x = rotatedX.x * cosY + rotatedX.z * sinY;
    let temp_z_final = rotatedX.z * cosY - rotatedX.x * sinY;
    return vec3f(temp_x, rotatedX.y, temp_z_final);
}

fn hsv2rgb(c: vec3f) -> vec3<f32> {
    let K = vec4<f32>(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    let p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, vec3<f32>(0.0), vec3<f32>(1.0)), c.y);
}

fn rgb2hsv(c: vec3f) -> vec3<f32> {
    let K = vec4<f32>(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    let p = mix(vec4<f32>(c.zy, K.wz), vec4<f32>(c.yz, K.xy), step(c.b, c.g));
    let q = mix(vec4<f32>(p.xyw, c.r), vec4<f32>(c.r, p.yzx), step(p.x, c.r));
    let d = q.x - min(q.w, q.y);
    let e = 1.0e-10;
    return vec3<f32>(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

fn blinnPhong(
  // Environment
    rd: vec3<f32>,
    normal: vec3<f32>,
    minBright: f32,
  // Material
    pos: vec3<f32>,
    diffuseColor: vec3<f32>,
    shininess: f32,
  // Light
    lightPos: vec3<f32>,
    lightColor: vec3<f32>,
    power: f32,
) -> vec3<f32> {
    let viewDir = -rd;
    var lightDir = lightPos - pos;
    var distance = length(lightDir); distance *= distance;
    lightDir = normalize(lightDir);
    let lambertian = dot(normal, lightDir);

    var specular = 0.;
    if lambertian > 0. {
        let halfDir = normalize(lightDir + viewDir);
        let specAngle = max(dot(halfDir, normal), 0.);
        specular = pow(specAngle, shininess);
    }

    let lightPower = lightColor * power / distance;
    let ambientColor = minBright * mix(diffuseColor, lightColor, .5);

    let colorLinear = ambientColor + (diffuseColor * lambertian * lightPower + /* specColor * */ specular * lightPower);

    return colorLinear;
}

// https://iquilezles.org/articles/distfunctions/ 💪

fn sdSphere(p: vec3f, s: f32) -> f32 {
    return length(p) - s;
}

fn sdBox(p: vec3f, b: vec3f) -> f32 {
    let q = abs(p) - b;
    return length(max(q, vec3<f32>(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
}

fn sdCapsule(p: vec3f, a: vec3f, b: vec3f, r: f32) -> f32 {
    let pa = p - a;
    let ba = b - a;
    let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}

fn opSmoothUnion(d1: f32, d2: f32, k: f32) -> f32 {
    let h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

fn opSmoothSubtraction(d1: f32, d2: f32, k: f32) -> f32 {
    return -opSmoothUnion(d1, -d2, k);
}

// https://gist.github.com/munrocket/236ed5ba7e409b8bdf1ff6eca5dcdc39#simplex-noise

//  MIT License. © Ian McEwan, Stefan Gustavson, Munrocket, Johan Helsing
fn mod289(x: vec2f) -> vec2f {
    return x - floor(x * (1. / 289.)) * 289.;
}

fn mod289_3(x: vec3f) -> vec3f {
    return x - floor(x * (1. / 289.)) * 289.;
}

fn permute3(x: vec3f) -> vec3f {
    return mod289_3(((x * 34.) + 1.) * x);
}
//  MIT License. © Ian McEwan, Stefan Gustavson, Munrocket
fn snoise(v: vec2f) -> f32 {
    let C = vec4(
        0.211324865405187, // (3.0-sqrt(3.0))/6.0
        0.366025403784439, // 0.5*(sqrt(3.0)-1.0)
        -0.577350269189626, // -1.0 + 2.0 * C.x
        0.024390243902439 // 1.0 / 41.0
    );

    // First corner
    var i = floor(v + dot(v, C.yy));
    let x0 = v - i + dot(i, C.xx);

    // Other corners
    var i1 = select(vec2(0., 1.), vec2(1., 0.), x0.x > x0.y);

    // x0 = x0 - 0.0 + 0.0 * C.xx ;
    // x1 = x0 - i1 + 1.0 * C.xx ;
    // x2 = x0 - 1.0 + 2.0 * C.xx ;
    var x12 = x0.xyxy + C.xxzz;
    x12.x = x12.x - i1.x;
    x12.y = x12.y - i1.y;

    // Permutations
    i = mod289(i); // Avoid truncation effects in permutation

    var p = permute3(permute3(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
    var m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), vec3(0.));
    m *= m;
    m *= m;

    // Gradients: 41 points uniformly over a line, mapped onto a diamond.
    // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
    let x = 2. * fract(p * C.www) - 1.;
    let h = abs(x) - 0.5;
    let ox = floor(x + 0.5);
    let a0 = x - ox;

    // Normalize gradients implicitly by scaling m
    // Approximation of: m *= inversesqrt( a0*a0 + h*h );
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    // Compute final noise value at P
    let g = vec3(a0.x * x0.x + h.x * x0.y, a0.yz * x12.xz + h.yz * x12.yw);
    return 130. * dot(m, g);
}

// Translated from:
// https://github.com/ashima/webgl-noise/blob/master/src/noise3D.glsl
fn mod289_v3(x: vec3<f32>) -> vec3<f32> {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
fn mod289_v4(x: vec4<f32>) -> vec4<f32> {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
fn permute(x: vec4<f32>) -> vec4<f32> {
    return mod289_v4((x * 34.0 + 10.0) * x);
}
fn taylorInvSqrt(r: vec4<f32>) -> vec4<f32> {
    return 1.79284291400159 - 0.85373472095314 * r;
}
fn snoise3d(v: vec3<f32>) -> f32 {
    let C: vec2<f32> = vec2<f32>(1.0 / 6.0, 1.0 / 3.0);
    let D: vec4<f32> = vec4<f32>(0.0, 0.5, 1.0, 2.0);
    var i: vec3<f32> = floor(v + dot(v, vec3<f32>(C.y)));
    let x0: vec3<f32> = v - i + dot(i, vec3<f32>(C.x));
    let g: vec3<f32> = step(x0.yzx, x0.xyz);
    let l: vec3<f32> = 1.0 - g;
    let i1: vec3<f32> = min(g.xyz, l.zxy);
    let i2: vec3<f32> = max(g.xyz, l.zxy);
    let x1: vec3<f32> = x0 - i1 + vec3<f32>(C.x);
    let x2: vec3<f32> = x0 - i2 + vec3<f32>(C.y);
    let x3: vec3<f32> = x0 - vec3<f32>(D.y);
    i = mod289_v3(i);
    let p: vec4<f32> = permute(permute(permute(
        i.z + vec4<f32>(0.0, i1.z, i2.z, 1.0)
    ) + i.y + vec4<f32>(0.0, i1.y, i2.y, 1.0)) + i.x + vec4<f32>(0.0, i1.x, i2.x, 1.0));
    let n_: f32 = 0.142857142857;
    let ns: vec3<f32> = n_ * D.wyz - D.xzx;
    let j: vec4<f32> = p - 49.0 * floor(p * ns.z * ns.z);
    let x_: vec4<f32> = floor(j * ns.z);
    let y_: vec4<f32> = floor(j - 7.0 * x_);
    let x: vec4<f32> = x_ * ns.x + vec4<f32>(ns.y);
    let y: vec4<f32> = y_ * ns.x + vec4<f32>(ns.y);
    let h: vec4<f32> = 1.0 - abs(x) - abs(y);
    let b0: vec4<f32> = vec4<f32>(x.xy, y.xy);
    let b1: vec4<f32> = vec4<f32>(x.zw, y.zw);
    let s0: vec4<f32> = floor(b0) * 2.0 + 1.0;
    let s1: vec4<f32> = floor(b1) * 2.0 + 1.0;
    let sh: vec4<f32> = -step(h, vec4<f32>(0.0));
    let a0: vec4<f32> = b0.xzyw + s0.xzyw * sh.xxyy;
    let a1: vec4<f32> = b1.xzyw + s1.xzyw * sh.zzww;
    let p0: vec3<f32> = vec3<f32>(a0.xy, h.x);
    let p1: vec3<f32> = vec3<f32>(a0.zw, h.y);
    let p2: vec3<f32> = vec3<f32>(a1.xy, h.z);
    let p3: vec3<f32> = vec3<f32>(a1.zw, h.w);
    let norm: vec4<f32> = taylorInvSqrt(vec4<f32>(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    let p0_norm: vec3<f32> = p0 * norm.x;
    let p1_norm: vec3<f32> = p1 * norm.y;
    let p2_norm: vec3<f32> = p2 * norm.z;
    let p3_norm: vec3<f32> = p3 * norm.w;
    var m: vec4<f32> = max(0.5 - vec4<f32>(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), vec4<f32>(0.0));
    m = m * m;
    return 105.0 * dot(m * m, vec4<f32>(dot(p0_norm, x0), dot(p1_norm, x1), dot(p2_norm, x2), dot(p3_norm, x3)));
}

// #FUNCTIONS
// #RAY_MARCH_FUNCTIONS
`,U=`struct SdMaterial {
    index: i32,
    dist: f32,
    pos: vec3<f32>,
    color: vec3<f32>,
}

// #SD-INDIVIDUAL-MATERIALS

fn sdMaterials(pos: vec3<f32>) -> SdMaterial {
    // #SD-MATERIALS-FUNC
}

// This function is exclusive for calcNormal
fn map(pos: vec3<f32>) -> f32 {
    // #MAP
}

fn calcNormal(pos: vec3<f32>) -> vec3<f32> {
    var h = 1e-4;
    var k = vec2<f32>(1., -1.);
    return normalize(
        k.xyy * map(pos + k.xyy * h) + k.yyx * map(pos + k.yyx * h) + k.yxy * map(pos + k.yxy * h) + k.xxx * map(pos + k.xxx * h)
    );
}

// #LIGHT-INDIVIDUAL-MATERIALS

fn calcLight(
    ro: vec3<f32>,
    rd: vec3<f32>,
    pos: vec3<f32>,
    normal: vec3<f32>,
    color: vec3<f32>,
    materialIndex: i32
) -> vec4<f32> {
    // #LIGHT-MATERIALS-FUNC
}

const RM_MAX_ITER: i32 = 1024;
const RM_MIN_DIST: f32 = 1e-4;
const RM_MAX_DIST: f32 = 1e4;
fn rayMarch(ro: vec3<f32>, rd: vec3<f32>) -> SdMaterial {
    var totalDist = 0.0;
    var material = SdMaterial(-1, 0.0, vec3<f32>(0.0), vec3<f32>(0.0));
    for (var i: i32 = 0; i < RM_MAX_ITER; i++) {
        let pos = ro + rd * totalDist;
        material = sdMaterials(pos);
        let currDist = material.dist;
        if currDist < RM_MIN_DIST {
            material.dist = totalDist;
            return material;
        }
        totalDist += currDist;
        if totalDist > RM_MAX_DIST {
            break;
        }
    }
    return SdMaterial(-1, -1.0, vec3<f32>(0.0), vec3<f32>(0.0));
}

fn rayMarchDDA(ro: vec3<f32>, rd: vec3<f32>, voxelSize: f32) -> SdMaterial {
    let ro_grid = ro / voxelSize;
    var mapPos = floor(ro_grid);
    let deltaDist = abs(vec3<f32>(1.0) / rd);
    let rayStep = sign(rd);
    var sideDist = (rayStep * (mapPos - ro_grid) + (rayStep * 0.5) + 0.5) * deltaDist;
    var mask = vec3<f32>(0.0);

    for (var i: i32 = 0; i < RM_MAX_ITER; i++) {
        if any(mapPos < vec3<f32>(-100.0 / voxelSize)) || any(mapPos > vec3<f32>(100.0 / voxelSize)) { break; }

        let voxelCenter = (mapPos + 0.5) * voxelSize;
        var material = sdMaterials(voxelCenter);

        if material.dist < (voxelSize * 0.5) {
            var dist = 0.0;
            if mask.x > 0.5 { dist = sideDist.x - deltaDist.x; } else if mask.y > 0.5 { dist = sideDist.y - deltaDist.y; } else { dist = sideDist.z - deltaDist.z; }
            material.dist = dist * voxelSize;
            return material;
        }

        if sideDist.x < sideDist.y {
            if sideDist.x < sideDist.z {
                sideDist.x += deltaDist.x;
                mapPos.x += rayStep.x;
                mask = vec3<f32>(1.0, 0.0, 0.0);
            } else {
                sideDist.z += deltaDist.z;
                mapPos.z += rayStep.z;
                mask = vec3<f32>(0.0, 0.0, 1.0);
            }
        } else {
            if sideDist.y < sideDist.z {
                sideDist.y += deltaDist.y;
                mapPos.y += rayStep.y;
                mask = vec3<f32>(0.0, 1.0, 0.0);
            } else {
                sideDist.z += deltaDist.z;
                mapPos.z += rayStep.z;
                mask = vec3<f32>(0.0, 0.0, 1.0);
            }
        }
    }

    return SdMaterial(-1, -1.0, vec3<f32>(0.0), vec3<f32>(0.0));
}

fn calculateDFAO(pos: vec3<f32>, normal: vec3<f32>) -> f32 {
    let AO_RADIUS = 1.;
    let AO_EPSILON = 1e-4;
    let numSamples = 8;
    var aoSum = 0.0;
    for (var i: i32 = 0; i < numSamples; i++) {
        let t_ratio = f32(i + 1) / f32(numSamples - 1);
        let t_real_dist = AO_EPSILON + t_ratio * (AO_RADIUS - AO_EPSILON);
        let samplePos = pos + normal * t_real_dist;
        let dist = sdMaterials(samplePos).dist;
        let visibility = clamp(dist / t_real_dist, 0f, 1f);
        aoSum += (1f - visibility) * (1f - t_ratio);
    }
    let aoFactor = 1f - aoSum / f32(numSamples);
    return clamp(aoFactor, 0f, 1f);
}

struct Scene {
    dist: f32,
    pos: vec3<f32>,
    normal: vec3<f32>,
    color: vec4<f32>,
};

fn calcScene(uv: vec2<f32>) -> Scene {
    var dir2d = vec2<f32>(uv.x, 1. - uv.y) * 2. - 1.;
    dir2d.x *= U.aspectRatio;

    let pos = vec3<f32>(U.camPosX, U.camPosY, U.camPosZ);
    let spherical = vec3<f32>(U.camSphericalR, U.camSphericalT, U.camSphericalP);

    let radFoc = radians(U.camFov);
    let focalLength = 1. / tan(radFoc * .5);

    var ro = vec3<f32>(0.);
    ro.z += spherical.x;
    ro = rotateXY(ro, spherical.z, spherical.y);
    ro += pos;

    var rd = normalize(vec3<f32>(dir2d, -focalLength));
    rd = rotateXY(rd, spherical.z, spherical.y);

    let material = rayMarch(ro, rd);
    // TODO: Play with this XD
    // let material = rayMarchDDA(ro, rd, 0.1);

    var finalPos: vec3<f32>;
    var finalNormal: vec3<f32>;
    var finalColor = vec4<f32>(0.0, 0.0, 0.0, 1.0);

    if material.index != -1 {
        finalPos = ro + rd * material.dist;
        finalNormal = calcNormal(finalPos);
        finalColor = calcLight(
            ro,
            rd,
            finalPos,
            finalNormal,
            material.color,
            material.index
        );
    }

    return Scene(material.dist, finalPos, finalNormal, finalColor);
}
`;function R({sdWGSL:a,materialSdFunctions:e}){function t(s,i){const l=`vec3<f32>(U.material${i}Px, U.material${i}Py, U.material${i}Pz)`,c=`vec3<f32>(U.material${i}Rx, U.material${i}Ry, U.material${i}Rz)`;return`
        fn sdMaterial${i}(posIn: vec3<f32>) -> f32 {
          let mRotation = ${c};
          var pos = posIn - ${l};
          if length(mRotation) != 0.0 {
            pos = rotate(pos, mRotation);
          }
          ${s}
        }`}const n=e.map(t).join(`
`);a=a.replace("// #SD-INDIVIDUAL-MATERIALS",n);function r(s){return`
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

      ${e.map((s,i)=>r(i)).join(`
`)}

      return material;
    `;return a=a.replace("// #SD-MATERIALS-FUNC",o),a}function M({materialSdFunctions:a,sdWGSL:e}){function t(r){return`dist = min(dist, sdMaterial${r}(pos));`}const n=`
      var dist: f32 = INF;
      var accDist: f32;

      ${a.map((r,o)=>t(o)).join(`
`)}

      return dist;`;return e=e.replace("// #MAP",n),e}function D({materialLightFunctions:a,sdWGSL:e}){function t(s,i){return s||(s=`
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
        }`}const n=a.map(t).join(`
`);e=e.replace("// #LIGHT-INDIVIDUAL-MATERIALS",n);function r(s){return`
        if(materialIndex == ${s}) {
          finalColor = calcLightMaterial${s}(ro, rd, pos, normal, color);
        }`}const o=`
      var finalColor = vec4<f32>(0.0);
      ${a.map((s,i)=>r(i)).join(`
`)}
      return finalColor;`;return e=e.replace("// #LIGHT-MATERIALS-FUNC",o),e}function B(a){let e=U;const t=a.map(r=>r.sdFunc),n=a.map(r=>r.lightFunc);return e=R({sdWGSL:e,materialSdFunctions:t}),e=M({materialSdFunctions:t,sdWGSL:e}),e=D({sdWGSL:e,materialLightFunctions:n}),e}function b({functions:a,rtUniformKeys:e,materialFuncs:t,nTextures:n,usePrevFrameTex:r}){let o=I;if(o=o.replace("UNIFORMS: f32, // #UNIFORMS",e.map(s=>`${s}: f32,`).join(`
`)),n>0){let s=function(l){return`
        @group(1) @binding(${l}) var tex${l}: texture_2d<f32>;
        fn getTex${l}Sample(uv: vec2<f32>) -> vec4<f32> {
          return textureSample(tex${l}, u_sampler, uv);
        }`};const i=new Array(n).fill(0).map((l,c)=>s(c)).join(`
`);o=o.replace("// #GROUP-1-BINDING-X",i)}if(r&&(o=o.replace("// #GROUP-2-BINDING-X",`
      @group(2) @binding(0) var prevFrameTex: texture_2d<f32>;
      fn getPrevFrameTexSample(uv: vec2<f32>) -> vec4<f32> {
        return textureSample(prevFrameTex, u_sampler, uv);
      }`)),a&&(o=o.replace("// #FUNCTIONS",a)),t.length>0){const s=B(t);o=o.replace("// #RAY_MARCH_FUNCTIONS",s)}return o}function F({main:a,functions:e,rtUniformKeys:t,materialFuncs:n,nTextures:r,usePrevFrameTex:o,useInterlacing:s}){const i=b({functions:e,materialFuncs:n,nTextures:r,rtUniformKeys:t,usePrevFrameTex:o});n.length>0&&!a&&(a=`
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
    `)),l}class E{device;buffer;uniform={};uniformBindGroupLayout;uniformBindGroup;constructor(e,t){this.device=e;const n=Object.keys(t);this.buffer=e.createBuffer({size:n.length*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),n.forEach((r,o)=>{this.uniform[r]={value:t[r],offSet:o*4},this.set(r,t[r])}),this.uniformBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"non-filtering"}}]}),this.uniformBindGroup=this.device.createBindGroup({layout:this.uniformBindGroupLayout,entries:[{binding:0,resource:{buffer:this.getBuffer()}},{binding:1,resource:this.device.createSampler({addressModeU:"repeat",addressModeV:"repeat",magFilter:"nearest",minFilter:"nearest"})}]})}getBuffer(){return this.buffer}getKeysSortedByOffset(){return Object.keys(this.uniform).toSorted((e,t)=>this.uniform[e].offSet-this.uniform[t].offSet)}set(e,t){if(!this.uniform[e])throw new Error(`Uniform ${e} not found`);this.uniform[e].value=t,this.device.queue.writeBuffer(this.buffer,this.uniform[e].offSet,new Float32Array([t]))}get(e){if(!this.uniform[e])throw new Error(`Uniform ${e} not found`);return this.uniform[e].value}getCustomBindingsForCollisions(e){const t=this.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE,sampler:{type:"non-filtering"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),n=this.device.createBindGroup({layout:t,entries:[{binding:0,resource:{buffer:this.getBuffer()}},{binding:1,resource:this.device.createSampler({addressModeU:"repeat",addressModeV:"repeat",magFilter:"nearest",minFilter:"nearest"})},{binding:2,resource:{buffer:e}}]});return{uniformBindGroupLayout:t,uniformBindGroup:n}}}class A{texs;device;textures;textureEntries;textureBindGroupLayout;constructor(e,t){this.texs=t,this.device=e,this.textures=this.texs.map(({width:n,height:r})=>this.device.createTexture({size:[n,r,1],format:"rgba8unorm",usage:GPUTextureUsage.COPY_DST|GPUTextureUsage.TEXTURE_BINDING})),this.textureEntries=this.textures.map((n,r)=>({binding:r,resource:n.createView()})),this.textureBindGroupLayout=e.createBindGroupLayout({entries:t.map((n,r)=>({binding:r,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"unfilterable-float"}}))})}setTexture(e,t){const n=this.texs[e].width,r=this.texs[e].height,o=this.textures[e];this.device.queue.writeTexture({texture:o},t,{offset:0,bytesPerRow:n*4,rowsPerImage:r},[n,r,1])}getTextureEntries(){return this.textureEntries}length(){return this.texs.length}}class N{pingPongBindGroupLayout;bindGroupPingIn;bindGroupPongIn;currentReadTexture;currentReadTextureView;currentWriteTexture;currentWriteTextureView;currentBindGroupIn;offscreenTextureSize;constructor(e,t,n){this.pingPongBindGroupLayout=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"unfilterable-float"}}]}),this.bindGroupPingIn={},this.bindGroupPongIn={},this.currentReadTexture={},this.currentReadTextureView={},this.currentWriteTexture={},this.currentWriteTextureView={},this.currentBindGroupIn={},this.offscreenTextureSize=[0,0,1],this.init(e.width,e.height,t,n)}preSubmit(){}swap(){const e=this.currentReadTexture,t=this.currentReadTextureView,n=this.currentBindGroupIn;this.currentReadTexture=this.currentWriteTexture,this.currentReadTextureView=this.currentWriteTextureView,this.currentBindGroupIn=n===this.bindGroupPingIn?this.bindGroupPongIn:this.bindGroupPingIn,this.currentWriteTexture=e,this.currentWriteTextureView=t}resize(e,t,n,r){this.currentReadTexture.destroy(),this.currentWriteTexture.destroy(),this.init(e,t,n,r)}init(e,t,n,r){this.offscreenTextureSize=[e,t,1];const o=n.createTexture({size:this.offscreenTextureSize,format:r,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),s=n.createTexture({size:this.offscreenTextureSize,format:r,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),i=o.createView(),l=s.createView();this.bindGroupPingIn=n.createBindGroup({layout:this.pingPongBindGroupLayout,entries:[{binding:0,resource:o.createView()}]}),this.bindGroupPongIn=n.createBindGroup({layout:this.pingPongBindGroupLayout,entries:[{binding:0,resource:s.createView()}]}),this.currentReadTexture=o,this.currentReadTextureView=i,this.currentWriteTexture=s,this.currentWriteTextureView=l,this.currentBindGroupIn=this.bindGroupPingIn}}async function L({device:a,presentationFormat:e,context:t,canvas:n,main:r,materialFuncs:o,functions:s,rtUniform:i,rtTexture:l,usePrevFrameTex:c,useInterlacing:p,bindGroupLayouts:d,rtPingPong:f,transparent:u}){const v=F({main:r,functions:s,materialFuncs:o,rtUniformKeys:i.getKeysSortedByOffset(),nTextures:l.length(),usePrevFrameTex:c,useInterlacing:p}),T=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:d}),vertex:{module:a.createShaderModule({code:_}),entryPoint:"main"},fragment:{module:a.createShaderModule({code:v}),entryPoint:"main",targets:[{format:e}]},primitive:{topology:"triangle-strip",frontFace:"ccw",stripIndexFormat:"uint32"}});let P=0,x=null;function w(m){const S=performance.now()/1e3;x===null&&(x=performance.now()/1e3);const y=S-x;i.set("frame",P),i.set("time",y),i.set("aspectRatio",n.width/n.height),i.set("width",n.width),i.set("height",n.height),i.set("camPosX",m.pos.x),i.set("camPosY",m.pos.y),i.set("camPosZ",m.pos.z),i.set("camSphericalR",m.spherical.radius),i.set("camSphericalT",m.spherical.theta),i.set("camSphericalP",m.spherical.phi),i.set("camFov",m.fov)}const C=a.createBindGroup({layout:T.getBindGroupLayout(1),entries:l.getTextureEntries()});function z({camera:m}){w(m);const y={colorAttachments:[{view:f?f.currentWriteTextureView:t.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:u?0:1},storeOp:"store"}]},g=a.createCommandEncoder(),h=g.beginRenderPass(y);h.setPipeline(T),h.setBindGroup(0,i.uniformBindGroup),h.setBindGroup(1,C),f&&h.setBindGroup(2,f.currentBindGroupIn),h.draw(4,1,0,0),h.end(),f&&g.copyTextureToTexture({texture:f.currentWriteTexture},{texture:t.getCurrentTexture()},f.offscreenTextureSize),a.queue.submit([g.finish()]),f&&f.swap(),P++}return z}async function $(){const a=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!a)throw new Error("No adapter found");const e=a.features.has("texture-compression-bc");return e||console.warn("shader-f16 not available"),{device:await a.requestDevice({requiredFeatures:e?["shader-f16"]:[]}),presentationFormat:navigator.gpu.getPreferredCanvasFormat()}}class O{setPos;setRot;setColor;setCollisionGroup;checkForCollisions;collisionGroup=-1;index;rt;constructor({material:e,rt:t,index:n}){this.rt=t,e.pos||(e.pos={x:0,y:0,z:0}),e.color||(e.color={r:1,g:1,b:1}),e.rotation||(e.rotation={x:0,y:0,z:0});const r=t.registerUniform(`material${n}Px`,e.pos.x),o=t.registerUniform(`material${n}Py`,e.pos.y),s=t.registerUniform(`material${n}Pz`,e.pos.z);this.setPos=u=>{u.x!==void 0&&r(u.x),u.y!==void 0&&o(u.y),u.z!==void 0&&s(u.z)};const i=t.registerUniform(`material${n}Rx`,e.rotation.x),l=t.registerUniform(`material${n}Ry`,e.rotation.y),c=t.registerUniform(`material${n}Rz`,e.rotation.z);this.setRot=u=>{u.x!==void 0&&i(u.x),u.y!==void 0&&l(u.y),u.z!==void 0&&c(u.z)};const p=t.registerUniform(`material${n}Cr`,e.color.r),d=t.registerUniform(`material${n}Cg`,e.color.g),f=t.registerUniform(`material${n}Cb`,e.color.b);this.setColor=u=>{u.r!==void 0&&p(u.r),u.g!==void 0&&d(u.g),u.b!==void 0&&f(u.b)},e.enableCollisions&&(this.collisionGroup=n),this.setCollisionGroup=t.registerUniform(`material${n}CollisionGroup`,this.collisionGroup),this.index=n}checkCollision(){return this.rt.checkCollision(this.index)}getIndex(){return this.index}}function k({functions:a,rtUniformKeys:e,materialFuncs:t,nTextures:n,usePrevFrameTex:r}){const o=b({functions:a,materialFuncs:t,nTextures:n,rtUniformKeys:e,usePrevFrameTex:r}),s=t.map(c=>c.sdFunc);function i(c,p){return`
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
  `}class X{device;computePipeline;paramsBindGroup;paramsBuffer;uniformBindGroup;resultBufferSize;resultBuffer;rtTexture;constructor({device:e,functions:t,rtUniformKeys:n,materialFuncs:r,nTextures:o,usePrevFrameTex:s,rtUniform:i,rtTexture:l}){this.device=e,this.rtTexture=l;const c=5;this.resultBufferSize=Float32Array.BYTES_PER_ELEMENT*c,this.resultBuffer=e.createBuffer({size:this.resultBufferSize,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});const{uniformBindGroupLayout:p,uniformBindGroup:d}=i.getCustomBindingsForCollisions(this.resultBuffer);this.uniformBindGroup=d,this.paramsBuffer=e.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const f=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}}]});this.paramsBindGroup=e.createBindGroup({layout:f,entries:[{binding:0,resource:{buffer:this.paramsBuffer}}]});const u=[p,this.rtTexture.textureBindGroupLayout,f],v=k({functions:t,rtUniformKeys:n,materialFuncs:r,nTextures:o,usePrevFrameTex:s});this.computePipeline=e.createComputePipeline({layout:e.createPipelineLayout({bindGroupLayouts:u}),compute:{module:e.createShaderModule({code:v}),entryPoint:"main"}})}async checkCollision(e,t){this.device.queue.writeBuffer(this.paramsBuffer,0,new Int32Array([e])),this.device.queue.writeBuffer(this.paramsBuffer,16,new Float32Array([t.x,t.y,t.z]));const n=this.device.createCommandEncoder(),r=n.beginComputePass();r.setPipeline(this.computePipeline),r.setBindGroup(0,this.uniformBindGroup);const o=this.device.createBindGroup({layout:this.computePipeline.getBindGroupLayout(1),entries:this.rtTexture.getTextureEntries()});r.setBindGroup(1,o),r.setBindGroup(2,this.paramsBindGroup),r.dispatchWorkgroups(1),r.end();const s=this.device.createBuffer({size:this.resultBufferSize,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});n.copyBufferToBuffer(this.resultBuffer,0,s,0,this.resultBufferSize),this.device.queue.submit([n.finish()]),await s.mapAsync(GPUMapMode.READ);const i=new Float32Array(s.getMappedRange());try{const l=i[0],c=i[1],p={x:i[2],y:i[3],z:i[4]};return{materialIndex:l,collisionDist:c,collisionNormal:p}}finally{s.unmap()}}}class Y{shoot;fps;fpsCounter=0;showFps;cb;constructor({cb:e,shoot:t,fps:n,showFps:r}){this.shoot=t,this.cb=e,this.fps=n,this.showFps=r}startFpsCounter(){const e=document.createElement("div");e.setAttribute("style",` position: absolute;
        top: 0;
        left: 0;
        color: green;
        background: black;
        font-size: 16px;
        font-family: monospace;
        pointer-events: none;`),document.body.appendChild(e),setInterval(()=>{e.innerText=`FPS: ${this.fpsCounter}`,this.fpsCounter=0},1e3)}start(){this.showFps&&this.startFpsCounter();const e=this.cb,t=this.shoot,n=()=>{this.fpsCounter++},r=this.fps;let o=async()=>{requestAnimationFrame(o),await e(),t(),n()};if(r!==void 0){const s=1e3/r;let i=0;o=async l=>{requestAnimationFrame(o);const c=l-i;c>s&&(i=l-c%s,await e(),t(),n())}}requestAnimationFrame(o)}}function G(a,e){const t=e??window.innerHeight,n=t*(window.innerWidth/window.innerHeight);a.height=Math.max(1,t),a.width=Math.max(1,n)}function V(a,e){const t=document.createElement("canvas");return G(t,a),t.style.position="fixed",t.style.top="0",t.style.left="0",t.style.width="100lvw",t.style.height="100lvh",e&&(t.style.pointerEvents="none"),a&&(t.style.imageRendering="pixelated"),document.body.appendChild(t),t}class q{canvas;main;functions;render;initalCustomUniforms={};setUniform;materialFuncs=[];usePrevFrameTex;useInterlacing;setDeviceTexure;texs;fps;showFps;transparent;rtCollision;rtUniform;rtPingPong;device;presentationFormat;camera={pos:{x:0,y:0,z:0},spherical:{radius:0,theta:0,phi:0},fov:90};constructor({main:e,functions:t,texs:n,usePrevFrameTex:r,useInterlacing:o,fps:s,height:i,showFps:l,transparent:c}={}){this.canvas=V(i,c),this.main=e,this.functions=t,this.texs=n??[],this.useInterlacing=o,this.usePrevFrameTex=this.useInterlacing||r,this.fps=s,this.showFps=l,this.transparent=c}registerMaterial(e){if(this.render)throw new Error("Render already built");const t=this.materialFuncs.length,n=new O({rt:this,material:e,index:t});return this.materialFuncs.push({sdFunc:e.sdFunc,lightFunc:e.lightFunc}),n}setTex(e,t){if(!this.setDeviceTexure)throw new Error("Render not built");this.setDeviceTexure(e,t)}registerUniform(e,t){if(this.render)throw new Error("Render already built");return this.initalCustomUniforms[e]=t??0,r=>{if(!this.setUniform)throw new Error("Render not built");this.setUniform(e,r),this.initalCustomUniforms[e]=r}}async build(){const{device:e,presentationFormat:t}=await $();this.device=e,this.presentationFormat=t;const n=this.canvas.getContext("webgpu");if(!n)throw new Error("No context found");n.configure({device:e,format:t,alphaMode:this.transparent?"premultiplied":"opaque",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_DST});const r=new E(e,{frame:0,time:0,aspectRatio:this.canvas.width/this.canvas.height,width:this.canvas.width,height:this.canvas.height,camPosX:this.camera.pos.x??0,camPosY:this.camera.pos.y??0,camPosZ:this.camera.pos.z??0,camSphericalR:this.camera.spherical.radius??0,camSphericalT:this.camera.spherical.theta??0,camSphericalP:this.camera.spherical.phi??0,camFov:this.camera.fov??90,...this.initalCustomUniforms});this.rtUniform=r;const o=new A(e,this.texs),s=[r.uniformBindGroupLayout,o.textureBindGroupLayout];this.usePrevFrameTex&&(this.rtPingPong=new N(this.canvas,e,t),s.push(this.rtPingPong.pingPongBindGroupLayout)),this.render=await L({device:e,bindGroupLayouts:s,presentationFormat:t,context:n,canvas:this.canvas,main:this.main,materialFuncs:this.materialFuncs,functions:this.functions,rtUniform:r,rtTexture:o,usePrevFrameTex:this.usePrevFrameTex,useInterlacing:this.useInterlacing,rtPingPong:this.rtPingPong,transparent:this.transparent}),this.setUniform=(i,l)=>{r.set(i,l)},this.setDeviceTexure=(i,l)=>{o.setTexture(i,l)},this.materialFuncs.length>0&&(this.rtCollision=new X({device:e,rtUniformKeys:r.getKeysSortedByOffset(),functions:this.functions,materialFuncs:this.materialFuncs,nTextures:this.texs.length,usePrevFrameTex:this.usePrevFrameTex,rtUniform:r,rtTexture:o}))}checkCollision(e){if(!this.rtCollision||!this.rtUniform)throw new Error("Render not built");const t=this.rtUniform.get(`material${e}Px`),n=this.rtUniform.get(`material${e}Py`),r=this.rtUniform.get(`material${e}Pz`);return this.rtCollision.checkCollision(e,{x:t,y:n,z:r})}async start(e){if(await this.build(),e?.onBuild?.(),e?.once){this.render?.({camera:this.camera});return}new Y({cb:e?.onFrame??(()=>{}),shoot:()=>{this.render?.({camera:this.camera})},fps:this.fps,showFps:this.showFps}).start(),window.addEventListener("resize",()=>{this.resize()})}resize(){G(this.canvas,this.canvas.height),this.rtPingPong&&this.device&&this.presentationFormat&&this.rtPingPong.resize(this.canvas.width,this.canvas.height,this.device,this.presentationFormat)}}export{q as R};
