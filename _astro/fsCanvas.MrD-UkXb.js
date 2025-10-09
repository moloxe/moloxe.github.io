const z=`struct VSOut {
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
`,R=`
const PI = f32(3.1415926535897932384626433832795);

fn toSpherical(pos: vec3<f32>) -> vec3<f32> {
    let r = length(pos);
    let theta = acos(pos.z / r);
    let phi = atan2(pos.y, pos.x);
    return vec3<f32>(r, theta, phi);
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

//  MIT License. © Ian McEwan, Stefan Gustavson, Munrocket, Johan Helsing
//
fn mod289(x: vec2f) -> vec2f {
    return x - floor(x * (1. / 289.)) * 289.;
}

fn mod289_3(x: vec3f) -> vec3f {
    return x - floor(x * (1. / 289.)) * 289.;
}

fn permute3(x: vec3f) -> vec3f {
    return mod289_3(((x * 34.) + 1.) * x);
}

// https://gist.github.com/munrocket/236ed5ba7e409b8bdf1ff6eca5dcdc39#simplex-noise
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

// Translated from: https://github.com/ashima/webgl-noise/blob/master/src/noise3D.glsl
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
`,G=`struct GlobalUniform {
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
fn main(@location(0) fragCoord: vec2<f32>) -> @location(0) vec4<f32> {
    let uv = 1. - fragCoord.xy;
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
    var h = 1e-4;
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
`;function I(o){let e=U;const t=o.map(i=>i.sdFunc),s=o.map(i=>i.lightFunc);{const i=t.map((a,r)=>{const v=`vec3<f32>(U.material${r}Px, U.material${r}Py, U.material${r}Pz)`,u=`vec3<f32>(U.material${r}Rx, U.material${r}Ry, U.material${r}Rz)`;return`fn sdMaterial${r}(posIn: vec3<f32>) -> f32 {
        let mRotation = ${u};
        var pos = posIn - ${v};
        if length(mRotation) != 0.0 {
          pos = rotate(pos, mRotation);
        }
        ${a}
      }`}).join(`
`);e=e.replace("// #SD-INDIVIDUAL-MATERIALS",i);const n=`
    var material = SdMaterial(-1, 1e10, vec3<f32>(0.), vec3<f32>(0.));
    var curDist: f32;
    ${t.map((a,r)=>`
        curDist = sdMaterial${r}(pos);
        if curDist < material.dist {
          material.index = ${r};
          material.dist = curDist;
          material.pos = vec3<f32>(
            U.material${r}Px,
            U.material${r}Py,
            U.material${r}Pz
          );
          material.color = vec3<f32>(
            U.material${r}Cr,
            U.material${r}Cg,
            U.material${r}Cb
          );
        }
      `).join(`
`)}
    return material;
  `;e=e.replace("return SdMaterial(-1, 0., vec3<f32>(0.), vec3<f32>(1.)); // #SD-MATERIALS-FUNC",n)}{const i=`
    var dist: f32 = 1e10;
    var accDist: f32;
    ${t.map((n,a)=>`dist = min(dist, sdMaterial${a}(pos));`).join(`
`)}
    return dist;
  `;e=e.replace("return 0.; // #MAP",i)}{const i=s.map((a,r)=>`
          fn calcLightMaterial${r}(
            ro: vec3<f32>,
            rd: vec3<f32>,
            pos: vec3<f32>,
            normal: vec3<f32>,
            color: vec3<f32>) -> vec4<f32> {
            ${a??`let lamb = dot(normal, -rd); // Camera as light
              let finalColor = max(color * 0.2, color * lamb);
              return vec4<f32>(finalColor, 1.);`}
          }`).join(`
`);e=e.replace("// #LIGHT-INDIVIDUAL-MATERIALS",i);const n=`
      var finalColor = vec4<f32>(0.0);
      ${s.map((a,r)=>`
        if(materialIndex == ${r}) {
          finalColor = calcLightMaterial${r}(ro, rd, pos, normal, color);
        }
        `).join(`
`)}
      return finalColor;
    `;e=e.replace("return vec4<f32>(0.0); // #LIGHT-MATERIALS-FUNC",n)}return e}function C({main:o,functions:e,rtUniformKeys:t,materialFuncs:s,nTextures:i,usePrevFrameTex:n}){let a=G;if(a=a.replace("UNIFORMS: f32, // #UNIFORMS",t.map(r=>`${r}: f32,`).join(`
`)),i>0){const r=new Array(i).fill(0).map((v,u)=>`
          @group(1) @binding(${u}) var tex${u}: texture_2d<f32>;
          fn getTex${u}Sample(uv: vec2<f32>) -> vec4<f32> {
            return textureSample(tex${u}, u_sampler, uv);
          }
        `).join(`
`);a=a.replace("// #GROUP-1-BINDING-X",r)}if(n&&(a=a.replace("// #GROUP-2-BINDING-X",`@group(2) @binding(0) var prevFrameTex: texture_2d<f32>;
      fn getPrevFrameTexSample(uv: vec2<f32>) -> vec4<f32> {
        return textureSample(prevFrameTex, u_sampler, uv);
      }`)),a=a.replace("// #COMMON",R),e&&(a=a.replace("// #FUNCTIONS",e)),s.length>0){const r=I(s);a=a.replace("// #RAY_MARCH_FUNCTIONS",r),o||(o=`
        let scene = calcScene(uv);
        return vec4<f32>(scene.color.rgb, 1.0);
      `)}return o&&(a=a.replace("return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN",o)),a}class _{device;buffer;uniform={};uniformBindGroupLayout;uniformBindGroup;constructor(e,t){this.device=e;const s=Object.keys(t);this.buffer=e.createBuffer({size:s.length*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),s.forEach((i,n)=>{this.uniform[i]={value:t[i],offSet:n*4},this.set(i,t[i])}),this.uniformBindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"non-filtering"}}]}),this.uniformBindGroup=this.device.createBindGroup({layout:this.uniformBindGroupLayout,entries:[{binding:0,resource:{buffer:this.getBuffer()}},{binding:1,resource:this.device.createSampler({addressModeU:"repeat",addressModeV:"repeat",magFilter:"nearest",minFilter:"nearest"})}]})}getBuffer(){return this.buffer}getKeysSortedByOffset(){return Object.keys(this.uniform).toSorted((e,t)=>this.uniform[e].offSet-this.uniform[t].offSet)}set(e,t){if(!this.uniform[e])throw new Error(`Uniform ${e} not found`);this.uniform[e].value=t,this.device.queue.writeBuffer(this.buffer,this.uniform[e].offSet,new Float32Array([t]))}get(e){if(!this.uniform[e])throw new Error(`Uniform ${e} not found`);return this.uniform[e].value}}class M{texs;device;presentationFormat;textures;textureEntries;textureBindGroupLayout;constructor(e,t,s){this.texs=s,this.device=e,this.presentationFormat=t,this.textures=this.texs.map(({width:i,height:n})=>this.device.createTexture({size:[i,n,1],format:this.presentationFormat,usage:GPUTextureUsage.COPY_DST|GPUTextureUsage.TEXTURE_BINDING})),this.textureEntries=this.textures.map((i,n)=>({binding:n,resource:i.createView()})),this.textureBindGroupLayout=e.createBindGroupLayout({entries:s.map((i,n)=>({binding:n,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"unfilterable-float"}}))})}setTexture(e,t){const s=this.texs[e].width,i=this.texs[e].height,n=this.textures[e];this.device.queue.writeTexture({texture:n},t,{offset:0,bytesPerRow:s*4,rowsPerImage:i},[s,i,1]),this.textureEntries[e].resource=n.createView()}getTextureEntries(){return this.textureEntries}}class D{pingPongBindGroupLayout;bindGroupPingIn;bindGroupPongIn;currentReadTexture;currentReadTextureView;currentWriteTexture;currentWriteTextureView;currentBindGroupIn;offscreenTextureSize;constructor(e,t,s){this.offscreenTextureSize=[e.width,e.height,1];const i=t.createTexture({size:this.offscreenTextureSize,format:s,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),n=t.createTexture({size:this.offscreenTextureSize,format:s,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),a=i.createView(),r=n.createView();this.pingPongBindGroupLayout=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"unfilterable-float"}}]}),this.bindGroupPingIn=t.createBindGroup({layout:this.pingPongBindGroupLayout,entries:[{binding:0,resource:i.createView()}]}),this.bindGroupPongIn=t.createBindGroup({layout:this.pingPongBindGroupLayout,entries:[{binding:0,resource:n.createView()}]}),this.currentReadTexture=i,this.currentReadTextureView=a,this.currentWriteTexture=n,this.currentWriteTextureView=r,this.currentBindGroupIn=this.bindGroupPingIn}preSubmit(){}swap(){const e=this.currentReadTexture,t=this.currentReadTextureView,s=this.currentBindGroupIn;this.currentReadTexture=this.currentWriteTexture,this.currentReadTextureView=this.currentWriteTextureView,this.currentBindGroupIn=s===this.bindGroupPingIn?this.bindGroupPongIn:this.bindGroupPingIn,this.currentWriteTexture=e,this.currentWriteTextureView=t}}async function N({device:o,presentationFormat:e,context:t,canvas:s,main:i,materialFuncs:n,functions:a,rtUniform:r,texs:v,usePrevFrameTex:u}){const x=new M(o,e,v),m=[r.uniformBindGroupLayout,x.textureBindGroupLayout];let f=null;u&&(f=new D(s,o,e),m.push(f.pingPongBindGroupLayout));const d=C({main:i,functions:a,materialFuncs:n,rtUniformKeys:r.getKeysSortedByOffset(),nTextures:v.length,usePrevFrameTex:u}),g=o.createRenderPipeline({layout:o.createPipelineLayout({bindGroupLayouts:m}),vertex:{module:o.createShaderModule({code:z}),entryPoint:"main"},fragment:{module:o.createShaderModule({code:d}),entryPoint:"main",targets:[{format:e}]},primitive:{topology:"triangle-strip",frontFace:"ccw",stripIndexFormat:"uint32"}});function c(l){r.set("time",performance.now()/1e3),r.set("aspectRatio",s.width/s.height),r.set("width",s.width),r.set("height",s.height),r.set("camPosX",l.pos.x),r.set("camPosY",l.pos.y),r.set("camPosZ",l.pos.z),r.set("camSphericalR",l.spherical.radius),r.set("camSphericalT",l.spherical.theta),r.set("camSphericalP",l.spherical.phi),r.set("camFov",l.fov)}function T({camera:l}){c(l);const b={colorAttachments:[{view:f?f.currentWriteTextureView:t.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:1},storeOp:"store"}]},y=o.createCommandEncoder(),p=y.beginRenderPass(b);p.setPipeline(g),p.setBindGroup(0,r.uniformBindGroup);const S=o.createBindGroup({layout:g.getBindGroupLayout(1),entries:x.getTextureEntries()});p.setBindGroup(1,S),f&&p.setBindGroup(2,f.currentBindGroupIn),p.draw(4,1,0,0),p.end(),f&&y.copyTextureToTexture({texture:f.currentWriteTexture},{texture:t.getCurrentTexture()},f.offscreenTextureSize),o.queue.submit([y.finish()]),f&&f.swap()}function w(l,h){r.set(l,h)}function P(l,h){x.setTexture(l,h)}return{render:T,setUniform:w,setTexture:P}}async function F(o){const t=await navigator.gpu.requestAdapter();if(!t)throw new Error("No adapter found");const s=t.features.has("texture-compression-bc");s||console.warn("shader-f16 not available");const i=await t.requestDevice({requiredFeatures:s?["shader-f16"]:[]}),n=navigator.gpu.getPreferredCanvasFormat(),a=o.getContext("webgpu");if(!a)throw new Error("No context found");return a.configure({device:i,format:n,alphaMode:"premultiplied",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_DST}),{context:a,device:i,presentationFormat:n}}function L(o,e,t){o.pos||(o.pos={x:0,y:0,z:0}),o.color||(o.color={r:1,g:1,b:1}),o.rotation||(o.rotation={x:0,y:0,z:0});const s=e.registerUniform(`material${t}Px`,o.pos.x),i=e.registerUniform(`material${t}Py`,o.pos.y),n=e.registerUniform(`material${t}Pz`,o.pos.z),a=c=>{c.x!==void 0&&s(c.x),c.y!==void 0&&i(c.y),c.z!==void 0&&n(c.z)},r=e.registerUniform(`material${t}Rx`,o.rotation.x),v=e.registerUniform(`material${t}Ry`,o.rotation.y),u=e.registerUniform(`material${t}Rz`,o.rotation.z),x=c=>{c.x!==void 0&&r(c.x),c.y!==void 0&&v(c.y),c.z!==void 0&&u(c.z)},m=e.registerUniform(`material${t}Cr`,o.color.r),f=e.registerUniform(`material${t}Cg`,o.color.g),d=e.registerUniform(`material${t}Cb`,o.color.b);return{setPos:a,setRot:x,setColor:c=>{c.r!==void 0&&m(c.r),c.g!==void 0&&f(c.g),c.b!==void 0&&d(c.b)}}}class B{canvas;main;functions;render;initalCustomUniforms={};setUniform;materialFuncs=[];usePrevFrameTex;setDeviceTexure;texs;camera;constructor({canvas:e,main:t,functions:s,texs:i,usePrevFrameTex:n}){this.canvas=e,this.main=t,this.functions=s,this.camera={pos:{x:0,y:0,z:0},spherical:{radius:0,theta:0,phi:0},fov:90},this.texs=i??[],this.usePrevFrameTex=n}registerMaterial(e){if(this.render)throw new Error("Render already built");const t=this.materialFuncs.length,s=L(e,this,t);return this.materialFuncs.push({sdFunc:e.sdFunc,lightFunc:e.lightFunc}),s}setTex(e,t){if(!this.setDeviceTexure)throw new Error("Render not built");this.setDeviceTexure(e,t)}registerUniform(e,t){if(this.render)throw new Error("Render already built");return this.initalCustomUniforms[e]=t??0,i=>{if(!this.setUniform)throw new Error("Render not built");this.setUniform(e,i),this.initalCustomUniforms[e]=i}}async build(){const{device:e,context:t,presentationFormat:s}=await F(this.canvas),i=new _(e,{time:0,aspectRatio:this.canvas.width/this.canvas.height,width:this.canvas.width,height:this.canvas.height,camPosX:this.camera.pos.x??0,camPosY:this.camera.pos.y??0,camPosZ:this.camera.pos.z??0,camSphericalR:this.camera.spherical.radius??0,camSphericalT:this.camera.spherical.theta??0,camSphericalP:this.camera.spherical.phi??0,camFov:this.camera.fov??90,...this.initalCustomUniforms}),{render:n,setUniform:a,setTexture:r}=await N({device:e,presentationFormat:s,context:t,canvas:this.canvas,main:this.main,materialFuncs:this.materialFuncs,functions:this.functions,rtUniform:i,texs:this.texs,usePrevFrameTex:this.usePrevFrameTex});this.setUniform=a,this.render=n,this.setDeviceTexure=r}shoot(){this.render?.({camera:this.camera})}}function A({width:o,height:e,pixelated:t,useExactPixels:s}={}){const i=s?window.devicePixelRatio:1,n=document.createElement("canvas");return n.width=(o??window.innerWidth)*i,n.height=(e??window.innerHeight)*i,n.style.width="100vw",n.style.height="100vh",t&&(n.style.imageRendering="pixelated"),document.body.appendChild(n),n}export{B as R,A as f};
