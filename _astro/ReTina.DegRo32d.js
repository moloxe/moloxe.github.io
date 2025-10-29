const R=`struct VSOut {
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
`,G=`
const PI = f32(3.1415926535897932384626433832795);

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

    let colorLinear = ambientColor +
      (
        diffuseColor *    lambertian * lightPower +
        /* specColor * */ specular   * lightPower
      );

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
  let C: vec2<f32> = vec2<f32>(1.0/6.0, 1.0/3.0);
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
      i.z + vec4<f32>(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4<f32>(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4<f32>(0.0, i1.x, i2.x, 1.0));
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
`,C=`struct GlobalUniform {
    UNIFORMS: f32, // #UNIFORMS
};

@group(0) @binding(0) var <uniform> U: GlobalUniform;
@group(0) @binding(1) var u_sampler: sampler;
// #GROUP-1-BINDING-X
// #GROUP-2-BINDING-X

// #COMMON
// #FUNCTIONS
// #RAY_MARCH_FUNCTIONS

@fragment
fn main(@location(0) fragCoord: vec2<f32>) -> @location(0) vec4f {
    let uv = 1. - fragCoord.xy;
    // #INTERLACING
    return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN
}
`,U=`

struct SdMaterial {
    index: i32,
    dist: f32,
    pos: vec3<f32>,
    color: vec3<f32>,
}

// #SD-INDIVIDUAL-MATERIALS

fn sdMaterials(pos: vec3<f32>) -> SdMaterial {
    return SdMaterial(-1, 0., vec3<f32>(0.), vec3<f32>(1.)); // #SD-MATERIALS-FUNC
}

// This function is exclusive for calcNormal
fn map(pos: vec3<f32>) -> f32 {
    return 0.; // #MAP
}

fn calcNormal(pos: vec3<f32>) -> vec3<f32> {
    var h = 1e-3;
    var k = vec2<f32>(1., -1.);
    return normalize(
        k.xyy * map(pos + k.xyy * h) +
        k.yyx * map(pos + k.yyx * h) +
        k.yxy * map(pos + k.yxy * h) +
        k.xxx * map(pos + k.xxx * h)
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
    return vec4<f32>(0.0); // #LIGHT-MATERIALS-FUNC
}

struct Scene {
    dist: f32,
    pos: vec3<f32>,
    normal: vec3<f32>,
    color: vec4<f32>,
};

const RM_MAX_ITER: i32 = 1024;
const RM_MIN_DIST: f32 = 1e-3;
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
`;function _(n){let e=U;const r=n.map(i=>i.sdFunc),o=n.map(i=>i.lightFunc);{const i=r.map((a,t)=>{const f=`vec3<f32>(U.material${t}Px, U.material${t}Py, U.material${t}Pz)`,p=`vec3<f32>(U.material${t}Rx, U.material${t}Ry, U.material${t}Rz)`;return`fn sdMaterial${t}(posIn: vec3<f32>) -> f32 {
        let mRotation = ${p};
        var pos = posIn - ${f};
        if length(mRotation) != 0.0 {
          pos = rotate(pos, mRotation);
        }
        ${a}
      }`}).join(`
`);e=e.replace("// #SD-INDIVIDUAL-MATERIALS",i);const s=`
    var material = SdMaterial(-1, 1e10, vec3<f32>(0.), vec3<f32>(0.));
    var curDist: f32;
    ${r.map((a,t)=>`
        curDist = sdMaterial${t}(pos);
        if curDist < material.dist {
          material.index = ${t};
          material.dist = curDist;
          material.pos = vec3<f32>(
            U.material${t}Px,
            U.material${t}Py,
            U.material${t}Pz
          );
          material.color = vec3<f32>(
            U.material${t}Cr,
            U.material${t}Cg,
            U.material${t}Cb
          );
        }
      `).join(`
`)}
    return material;
  `;e=e.replace("return SdMaterial(-1, 0., vec3<f32>(0.), vec3<f32>(1.)); // #SD-MATERIALS-FUNC",s)}{const i=`
    var dist: f32 = 1e10;
    var accDist: f32;
    ${r.map((s,a)=>`dist = min(dist, sdMaterial${a}(pos));`).join(`
`)}
    return dist;
  `;e=e.replace("return 0.; // #MAP",i)}{const i=o.map((a,t)=>`
          fn calcLightMaterial${t}(
            ro: vec3<f32>,
            rd: vec3<f32>,
            pos: vec3<f32>,
            normal: vec3<f32>,
            color: vec3<f32>) -> vec4<f32> {
            ${a??`let lamb = dot(normal, -rd); // Camera as light
              let finalColor = max(color * 0.2, color * lamb);
              return vec4<f32>(finalColor, 1.);`}
          }`).join(`
`);e=e.replace("// #LIGHT-INDIVIDUAL-MATERIALS",i);const s=`
      var finalColor = vec4<f32>(0.0);
      ${o.map((a,t)=>`
        if(materialIndex == ${t}) {
          finalColor = calcLightMaterial${t}(ro, rd, pos, normal, color);
        }
        `).join(`
`)}
      return finalColor;
    `;e=e.replace("return vec4<f32>(0.0); // #LIGHT-MATERIALS-FUNC",s)}return e}function F({main:n,functions:e,rtUniformKeys:r,materialFuncs:o,nTextures:i,usePrevFrameTex:s,useInterlacing:a}){let t=C;if(t=t.replace("UNIFORMS: f32, // #UNIFORMS",r.map(f=>`${f}: f32,`).join(`
`)),i>0){const f=new Array(i).fill(0).map((p,h)=>`
          @group(1) @binding(${h}) var tex${h}: texture_2d<f32>;
          fn getTex${h}Sample(uv: vec2<f32>) -> vec4<f32> {
            return textureSample(tex${h}, u_sampler, uv);
          }
        `).join(`
`);t=t.replace("// #GROUP-1-BINDING-X",f)}if(s&&(t=t.replace("// #GROUP-2-BINDING-X",`@group(2) @binding(0) var prevFrameTex: texture_2d<f32>;
      fn getPrevFrameTexSample(uv: vec2<f32>) -> vec4<f32> {
        return textureSample(prevFrameTex, u_sampler, uv);
      }`)),t=t.replace("// #COMMON",G),e&&(t=t.replace("// #FUNCTIONS",e)),o.length>0){const f=_(o);t=t.replace("// #RAY_MARCH_FUNCTIONS",f),n||(n=`
        let scene = calcScene(uv);
        return vec4<f32>(scene.color.rgb, 1.0);
      `)}return a&&(t=t.replace("// #INTERLACING",` let _prev_pix_ = getPrevFrameTexSample(uv);
        if i32(U.height * uv.y) % 2 == i32(U.frame) % 2 {
        return _prev_pix_;
        }`)),n&&(t=t.replace("return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN",n)),t}class M{device;buffer;uniform={};uniformBindGroupLayout;uniformBindGroup;constructor(e,r){this.device=e;const o=Object.keys(r);this.buffer=e.createBuffer({size:o.length*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),o.forEach((i,s)=>{this.uniform[i]={value:r[i],offSet:s*4},this.set(i,r[i])}),this.uniformBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"non-filtering"}}]}),this.uniformBindGroup=this.device.createBindGroup({layout:this.uniformBindGroupLayout,entries:[{binding:0,resource:{buffer:this.getBuffer()}},{binding:1,resource:this.device.createSampler({addressModeU:"repeat",addressModeV:"repeat",magFilter:"nearest",minFilter:"nearest"})}]})}getBuffer(){return this.buffer}getKeysSortedByOffset(){return Object.keys(this.uniform).toSorted((e,r)=>this.uniform[e].offSet-this.uniform[r].offSet)}set(e,r){if(!this.uniform[e])throw new Error(`Uniform ${e} not found`);this.uniform[e].value=r,this.device.queue.writeBuffer(this.buffer,this.uniform[e].offSet,new Float32Array([r]))}get(e){if(!this.uniform[e])throw new Error(`Uniform ${e} not found`);return this.uniform[e].value}}class N{texs;device;presentationFormat;textures;textureEntries;textureBindGroupLayout;constructor(e,r,o){this.texs=o,this.device=e,this.presentationFormat=r,this.textures=this.texs.map(({width:i,height:s})=>this.device.createTexture({size:[i,s,1],format:this.presentationFormat,usage:GPUTextureUsage.COPY_DST|GPUTextureUsage.TEXTURE_BINDING})),this.textureEntries=this.textures.map((i,s)=>({binding:s,resource:i.createView()})),this.textureBindGroupLayout=e.createBindGroupLayout({entries:o.map((i,s)=>({binding:s,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"unfilterable-float"}}))})}setTexture(e,r){const o=this.texs[e].width,i=this.texs[e].height,s=this.textures[e];this.device.queue.writeTexture({texture:s},r,{offset:0,bytesPerRow:o*4,rowsPerImage:i},[o,i,1]),this.textureEntries[e].resource=s.createView()}getTextureEntries(){return this.textureEntries}}class D{pingPongBindGroupLayout;bindGroupPingIn;bindGroupPongIn;currentReadTexture;currentReadTextureView;currentWriteTexture;currentWriteTextureView;currentBindGroupIn;offscreenTextureSize;constructor(e,r,o){this.offscreenTextureSize=[e.width,e.height,1];const i=r.createTexture({size:this.offscreenTextureSize,format:o,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),s=r.createTexture({size:this.offscreenTextureSize,format:o,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),a=i.createView(),t=s.createView();this.pingPongBindGroupLayout=r.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"unfilterable-float"}}]}),this.bindGroupPingIn=r.createBindGroup({layout:this.pingPongBindGroupLayout,entries:[{binding:0,resource:i.createView()}]}),this.bindGroupPongIn=r.createBindGroup({layout:this.pingPongBindGroupLayout,entries:[{binding:0,resource:s.createView()}]}),this.currentReadTexture=i,this.currentReadTextureView=a,this.currentWriteTexture=s,this.currentWriteTextureView=t,this.currentBindGroupIn=this.bindGroupPingIn}preSubmit(){}swap(){const e=this.currentReadTexture,r=this.currentReadTextureView,o=this.currentBindGroupIn;this.currentReadTexture=this.currentWriteTexture,this.currentReadTextureView=this.currentWriteTextureView,this.currentBindGroupIn=o===this.bindGroupPingIn?this.bindGroupPongIn:this.bindGroupPingIn,this.currentWriteTexture=e,this.currentWriteTextureView=r}}async function L({device:n,presentationFormat:e,context:r,canvas:o,main:i,materialFuncs:s,functions:a,rtUniform:t,texs:f,usePrevFrameTex:p,useInterlacing:h}){const m=new N(n,e,f),x=[t.uniformBindGroupLayout,m.textureBindGroupLayout];let l=null;p&&(l=new D(o,n,e),x.push(l.pingPongBindGroupLayout));const y=F({main:i,functions:a,materialFuncs:s,rtUniformKeys:t.getKeysSortedByOffset(),nTextures:f.length,usePrevFrameTex:p,useInterlacing:h}),c=n.createRenderPipeline({layout:n.createPipelineLayout({bindGroupLayouts:x}),vertex:{module:n.createShaderModule({code:R}),entryPoint:"main"},fragment:{module:n.createShaderModule({code:y}),entryPoint:"main",targets:[{format:e}]},primitive:{topology:"triangle-strip",frontFace:"ccw",stripIndexFormat:"uint32"}});let T=0;function w(u){t.set("frame",T),t.set("time",performance.now()/1e3),t.set("aspectRatio",o.width/o.height),t.set("width",o.width),t.set("height",o.height),t.set("camPosX",u.pos.x),t.set("camPosY",u.pos.y),t.set("camPosZ",u.pos.z),t.set("camSphericalR",u.spherical.radius),t.set("camSphericalT",u.spherical.theta),t.set("camSphericalP",u.spherical.phi),t.set("camFov",u.fov)}function b({camera:u}){w(u);const z={colorAttachments:[{view:l?l.currentWriteTextureView:r.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:1},storeOp:"store"}]},g=n.createCommandEncoder(),v=g.beginRenderPass(z);v.setPipeline(c),v.setBindGroup(0,t.uniformBindGroup);const I=n.createBindGroup({layout:c.getBindGroupLayout(1),entries:m.getTextureEntries()});v.setBindGroup(1,I),l&&v.setBindGroup(2,l.currentBindGroupIn),v.draw(4,1,0,0),v.end(),l&&g.copyTextureToTexture({texture:l.currentWriteTexture},{texture:r.getCurrentTexture()},l.offscreenTextureSize),n.queue.submit([g.finish()]),l&&l.swap(),T++}function S(u,d){t.set(u,d)}function P(u,d){m.setTexture(u,d)}return{render:b,setUniform:S,setTexture:P}}async function A(n){const r=await navigator.gpu.requestAdapter();if(!r)throw new Error("No adapter found");const o=r.features.has("texture-compression-bc");o||console.warn("shader-f16 not available");const i=await r.requestDevice({requiredFeatures:o?["shader-f16"]:[]}),s=navigator.gpu.getPreferredCanvasFormat(),a=n.getContext("webgpu");if(!a)throw new Error("No context found");return a.configure({device:i,format:s,alphaMode:"opaque",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_DST}),{context:a,device:i,presentationFormat:s}}function E(n,e,r){n.pos||(n.pos={x:0,y:0,z:0}),n.color||(n.color={r:1,g:1,b:1}),n.rotation||(n.rotation={x:0,y:0,z:0});const o=e.registerUniform(`material${r}Px`,n.pos.x),i=e.registerUniform(`material${r}Py`,n.pos.y),s=e.registerUniform(`material${r}Pz`,n.pos.z),a=c=>{c.x!==void 0&&o(c.x),c.y!==void 0&&i(c.y),c.z!==void 0&&s(c.z)},t=e.registerUniform(`material${r}Rx`,n.rotation.x),f=e.registerUniform(`material${r}Ry`,n.rotation.y),p=e.registerUniform(`material${r}Rz`,n.rotation.z),h=c=>{c.x!==void 0&&t(c.x),c.y!==void 0&&f(c.y),c.z!==void 0&&p(c.z)},m=e.registerUniform(`material${r}Cr`,n.color.r),x=e.registerUniform(`material${r}Cg`,n.color.g),l=e.registerUniform(`material${r}Cb`,n.color.b);return{setPos:a,setRot:h,setColor:c=>{c.r!==void 0&&m(c.r),c.g!==void 0&&x(c.g),c.b!==void 0&&l(c.b)}}}class B{shoot;fps;fpsCounter=0;showFps;cb;constructor({cb:e,shoot:r,fps:o,showFps:i}){this.shoot=r,this.cb=e,this.fps=o,this.showFps=i}startFpsCounter(){const e=document.createElement("div");e.setAttribute("style",` position: absolute;
        top: 0;
        left: 0;
        color: green;
        background: black;
        font-size: 16px;
        font-family: monospace;
        pointer-events: none;`),document.body.appendChild(e),setInterval(()=>{e.innerText=`FPS: ${this.fpsCounter}`,this.fpsCounter=0},1e3)}start(){this.showFps&&this.startFpsCounter();const e=this.cb,r=this.shoot,o=()=>{this.fpsCounter++},i=this.fps;let s=()=>{requestAnimationFrame(s),e(),r(),o()};if(i!==void 0){const a=1e3/i;let t=0;s=f=>{requestAnimationFrame(s);const p=f-t;p>a&&(t=f-p%a,e(),r(),o())}}requestAnimationFrame(s)}}function X(n){const e=document.createElement("canvas");return e.height=n??window.innerHeight*window.devicePixelRatio,e.width=e.height*(window.innerWidth/window.innerHeight),e.style.width="100vw",e.style.height="100vh",n&&(e.style.imageRendering="pixelated"),document.body.appendChild(e),e}class ${canvas;main;functions;render;initalCustomUniforms={};setUniform;materialFuncs=[];usePrevFrameTex;useInterlacing;setDeviceTexure;texs;fps;showFps;camera={pos:{x:0,y:0,z:0},spherical:{radius:0,theta:0,phi:0},fov:90};constructor({main:e,functions:r,texs:o,usePrevFrameTex:i,useInterlacing:s,fps:a,height:t,showFps:f}={}){this.canvas=X(t),this.main=e,this.functions=r,this.texs=o??[],this.useInterlacing=s,this.usePrevFrameTex=this.useInterlacing||i,this.fps=a,this.showFps=f}registerMaterial(e){if(this.render)throw new Error("Render already built");const r=this.materialFuncs.length,o=E(e,this,r);return this.materialFuncs.push({sdFunc:e.sdFunc,lightFunc:e.lightFunc}),o}setTex(e,r){if(!this.setDeviceTexure)throw new Error("Render not built");this.setDeviceTexure(e,r)}registerUniform(e,r){if(this.render)throw new Error("Render already built");return this.initalCustomUniforms[e]=r??0,i=>{if(!this.setUniform)throw new Error("Render not built");this.setUniform(e,i),this.initalCustomUniforms[e]=i}}async build(){const{device:e,context:r,presentationFormat:o}=await A(this.canvas),i=new M(e,{frame:0,time:0,aspectRatio:this.canvas.width/this.canvas.height,width:this.canvas.width,height:this.canvas.height,camPosX:this.camera.pos.x??0,camPosY:this.camera.pos.y??0,camPosZ:this.camera.pos.z??0,camSphericalR:this.camera.spherical.radius??0,camSphericalT:this.camera.spherical.theta??0,camSphericalP:this.camera.spherical.phi??0,camFov:this.camera.fov??90,...this.initalCustomUniforms}),{render:s,setUniform:a,setTexture:t}=await L({device:e,presentationFormat:o,context:r,canvas:this.canvas,main:this.main,materialFuncs:this.materialFuncs,functions:this.functions,rtUniform:i,texs:this.texs,usePrevFrameTex:this.usePrevFrameTex,useInterlacing:this.useInterlacing});this.setUniform=a,this.render=s,this.setDeviceTexure=t}run(e=()=>{}){new B({cb:e,shoot:()=>{this.render?.({camera:this.camera})},fps:this.fps,showFps:this.showFps}).start()}async buildAndRun(e=()=>{}){await this.build(),this.run(e)}}export{$ as R};
