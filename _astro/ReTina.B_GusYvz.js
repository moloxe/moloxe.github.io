const S=`struct VSOut {
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
`,z=`
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
`,b=`struct GlobalUniform {
    UNIFORMS: f32, // #UNIFORMS
};

@group(0) @binding(0) var <uniform> U: GlobalUniform;

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
`;function M(o){let e=U;const t=o.map(r=>r.sdFunc),a=o.map(r=>r.lightFunc);{const r=t.map((s,i)=>{const m=`vec3<f32>(U.material${i}Px, U.material${i}Py, U.material${i}Pz)`,f=`vec3<f32>(U.material${i}Rx, U.material${i}Ry, U.material${i}Rz)`;return`fn sdMaterial${i}(posIn: vec3<f32>) -> f32 {
        let mRotation = ${f};
        var pos = posIn - ${m};
        if length(mRotation) != 0.0 {
          pos = rotate(pos, mRotation);
        }
        ${s}
      }`}).join(`
`);e=e.replace("// #SD-INDIVIDUAL-MATERIALS",r);const c=`
    var material = SdMaterial(-1, 1e10, vec3<f32>(0.), vec3<f32>(0.));
    var curDist: f32;
    ${t.map((s,i)=>`
        curDist = sdMaterial${i}(pos);
        if curDist < material.dist {
          material.index = ${i};
          material.dist = curDist;
          material.pos = vec3<f32>(
            U.material${i}Px,
            U.material${i}Py,
            U.material${i}Pz
          );
          material.color = vec3<f32>(
            U.material${i}Cr,
            U.material${i}Cg,
            U.material${i}Cb
          );
        }
      `).join(`
`)}
    return material;
  `;e=e.replace("return SdMaterial(-1, 0., vec3<f32>(0.), vec3<f32>(1.)); // #SD-MATERIALS-FUNC",c)}{const r=`
    var dist: f32 = 1e10;
    var accDist: f32;
    ${t.map((c,s)=>`dist = min(dist, sdMaterial${s}(pos));`).join(`
`)}
    return dist;
  `;e=e.replace("return 0.; // #MAP",r)}{const r=a.map((s,i)=>`
          fn calcLightMaterial${i}(
            ro: vec3<f32>,
            rd: vec3<f32>,
            pos: vec3<f32>,
            normal: vec3<f32>,
            color: vec3<f32>) -> vec4<f32> {
            ${s??`let lamb = dot(normal, -rd); // Camera as light
              let finalColor = max(color * 0.2, color * lamb);
              return vec4<f32>(finalColor, 1.);`}
          }`).join(`
`);e=e.replace("// #LIGHT-INDIVIDUAL-MATERIALS",r);const c=`
      var finalColor = vec4<f32>(0.0);
      ${a.map((s,i)=>`
        if(materialIndex == ${i}) {
          finalColor = calcLightMaterial${i}(ro, rd, pos, normal, color);
        }
        `).join(`
`)}
      return finalColor;
    `;e=e.replace("return vec4<f32>(0.0); // #LIGHT-MATERIALS-FUNC",c)}return e}function _({main:o,functions:e,rtUniformKeys:t,materialFuncs:a}){let r=b;if(r=r.replace("UNIFORMS: f32, // #UNIFORMS",t.map(c=>`${c}: f32,`).join(`
`)),r=r.replace("// #COMMON",z),e&&(r=r.replace("// #FUNCTIONS",e)),a.length>0){const c=M(a);r=r.replace("// #RAY_MARCH_FUNCTIONS",c),o||(o=`
        let scene = calcScene(uv);
        return vec4<f32>(scene.color.rgb, 1.0);
      `)}return o&&(r=r.replace("return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN",o)),r}class R{device;buffer;uniform={};constructor(e,t){this.device=e;const a=Object.keys(t);this.buffer=e.createBuffer({size:a.length*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),a.forEach((r,c)=>{this.uniform[r]={value:t[r],offSet:c*4},this.set(r,t[r])})}getBuffer(){return this.buffer}getKeysSortedByOffset(){return Object.keys(this.uniform).toSorted((e,t)=>this.uniform[e].offSet-this.uniform[t].offSet)}set(e,t){if(!this.uniform[e])throw new Error(`Uniform ${e} not found`);this.uniform[e].value=t,this.device.queue.writeBuffer(this.buffer,this.uniform[e].offSet,new Float32Array([t]))}get(e){if(!this.uniform[e])throw new Error(`Uniform ${e} not found`);return this.uniform[e].value}}async function C({device:o,presentationFormat:e,context:t,canvas:a,main:r,materialFuncs:c,initialUniforms:s,functions:i,initalCustomUniforms:m}){const f=new R(o,{time:0,aspectRatio:a.width/a.height,width:a.width,height:a.height,camPosX:s.camPosX??0,camPosY:s.camPosY??0,camPosZ:s.camPosZ??0,camSphericalR:s.camSphericalR??0,camSphericalT:s.camSphericalT??0,camSphericalP:s.camSphericalP??0,camFov:s.camFov??90,...m}),v=o.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),p=o.createBindGroup({layout:v,entries:[{binding:0,resource:{buffer:f.getBuffer()}}]}),x=_({main:r,functions:i,materialFuncs:c,rtUniformKeys:f.getKeysSortedByOffset()}),d=o.createRenderPipeline({layout:o.createPipelineLayout({bindGroupLayouts:[v]}),vertex:{module:o.createShaderModule({code:S}),entryPoint:"main"},fragment:{module:o.createShaderModule({code:x}),entryPoint:"main",targets:[{format:e}]},primitive:{topology:"triangle-strip",frontFace:"ccw",stripIndexFormat:"uint32"}});function y({camera:l}){f.set("time",performance.now()/1e3),f.set("aspectRatio",a.width/a.height),f.set("width",a.width),f.set("height",a.height),f.set("camPosX",l.pos.x),f.set("camPosY",l.pos.y),f.set("camPosZ",l.pos.z),f.set("camSphericalR",l.spherical.radius),f.set("camSphericalT",l.spherical.theta),f.set("camSphericalP",l.spherical.phi),f.set("camFov",l.fov);const h={colorAttachments:[{view:t.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:1},storeOp:"store"}]},g=o.createCommandEncoder(),u=g.beginRenderPass(h);u.setPipeline(d),u.setBindGroup(0,p),u.draw(4,1,0,0),u.end(),o.queue.submit([g.finish()])}function n(l,h){f.set(l,h)}return{render:y,setUniform:n}}async function w(o){const t=await navigator.gpu.requestAdapter();if(!t)throw new Error("No adapter found");const a=t.features.has("texture-compression-bc");a||console.warn("shader-f16 not available");const r=await t.requestDevice({requiredFeatures:a?["shader-f16"]:[]}),c=navigator.gpu.getPreferredCanvasFormat(),s=o.getContext("webgpu");if(!s)throw new Error("No context found");return s.configure({device:r,format:c,alphaMode:"premultiplied"}),{context:s,device:r,presentationFormat:c}}function I(o,e,t){o.pos||(o.pos={x:0,y:0,z:0}),o.color||(o.color={r:1,g:1,b:1}),o.rotation||(o.rotation={x:0,y:0,z:0});const a=e.registerUniform(`material${t}Px`,o.pos.x),r=e.registerUniform(`material${t}Py`,o.pos.y),c=e.registerUniform(`material${t}Pz`,o.pos.z),s=n=>{n.x!==void 0&&a(n.x),n.y!==void 0&&r(n.y),n.z!==void 0&&c(n.z)},i=e.registerUniform(`material${t}Rx`,o.rotation.x),m=e.registerUniform(`material${t}Ry`,o.rotation.y),f=e.registerUniform(`material${t}Rz`,o.rotation.z),v=n=>{n.x!==void 0&&i(n.x),n.y!==void 0&&m(n.y),n.z!==void 0&&f(n.z)},p=e.registerUniform(`material${t}Cr`,o.color.r),x=e.registerUniform(`material${t}Cg`,o.color.g),d=e.registerUniform(`material${t}Cb`,o.color.b);return{setPos:s,setRot:v,setColor:n=>{n.r!==void 0&&p(n.r),n.g!==void 0&&x(n.g),n.b!==void 0&&d(n.b)}}}class P{canvas;main;functions;render;initalCustomUniforms={};setUniform;materialFuncs=[];camera;constructor({canvas:e,main:t,functions:a}){this.canvas=e,this.main=t,this.functions=a,this.camera={pos:{x:0,y:0,z:0},spherical:{radius:0,theta:0,phi:0},fov:90}}registerMaterial(e){if(this.render)throw new Error("Render already built");const t=this.materialFuncs.length,a=I(e,this,t);return this.materialFuncs.push({sdFunc:e.sdFunc,lightFunc:e.lightFunc}),a}registerUniform(e,t){if(this.render)throw new Error("Render already built");return this.initalCustomUniforms[e]=t??0,r=>{if(!this.setUniform)throw new Error("Render not built");this.setUniform(e,r),this.initalCustomUniforms[e]=r}}async build(){const{device:e,context:t,presentationFormat:a}=await w(this.canvas),{render:r,setUniform:c}=await C({device:e,presentationFormat:a,context:t,canvas:this.canvas,main:this.main,materialFuncs:this.materialFuncs,functions:this.functions,initalCustomUniforms:this.initalCustomUniforms,initialUniforms:{camPosX:this.camera.pos.x,camPosY:this.camera.pos.y,camPosZ:this.camera.pos.z,camSphericalR:this.camera.spherical.radius,camSphericalT:this.camera.spherical.theta,camSphericalP:this.camera.spherical.phi,camFov:this.camera.fov}});this.setUniform=c,this.render=r}shoot(){this.render?.({camera:this.camera})}}export{P as R};
