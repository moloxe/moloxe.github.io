const z=`struct VSOut {\r
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
`,S=`
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
`,b=`struct GlobalUniform {\r
    UNIFORMS: f32, // #UNIFORMS\r
};\r
\r
@group(0) @binding(0) var <uniform> U: GlobalUniform;\r
\r
// #COMMON\r
// #FUNCTIONS\r
// #RAY_MARCH_FUNCTIONS\r
\r
@fragment\r
fn main(@location(0) fragCoord: vec2<f32>) -> @location(0) vec4<f32> {\r
    let uv = 1. - fragCoord.xy;\r
    return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN\r
}\r
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
    var h = 0.1;
    var k = vec2<f32>(1., -1.);
    return normalize(
        k.xyy * map(pos + k.xyy * h) +
        k.yyx * map(pos + k.yyx * h) +
        k.yxy * map(pos + k.yxy * h) +
        k.xxx * map(pos + k.xxx * h)
    );
}

struct Scene {
    dist: f32,
    pos: vec3<f32>,
    normal: vec3<f32>,
    materialIndex: i32,
    color: vec4<f32>,
};

const RM_MAX_ITER: i32 = 1024;
const RM_MIN_DIST: f32 = 1e-1;
const RM_MAX_DIST: f32 = 1e3;
fn rayMarch(ro: vec3<f32>, rd: vec3<f32>) -> SdMaterial {
    var totalDist = 0.0;
    var material = SdMaterial(-1, 0.0, vec3<f32>(0.0), vec3<f32>(0.0));
    for (var i: i32 = 0; i < RM_MAX_ITER; i++) {
        let pos = ro + rd * totalDist;
        material = sdMaterials(pos);
        let currDist = abs(material.dist);
        if currDist < RM_MIN_DIST {
            material.dist = totalDist;
            return material;
        }
        totalDist += currDist * 0.6;
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

        // TODO: Implement lighting
        let lambertian = dot(finalNormal, -rd);
        // var spec = 1.;
        // if lambertian > 0. {
        //     let lightDir = normalize(ro - finalPos);
        //     let halfDir = normalize(lightDir + -rd);
        //     spec = pow(max(dot(halfDir, finalNormal), 0.), 1000.);
        // }
        let hue = sin(length(finalPos));
        finalColor = vec4<f32>(
            hsv2rgb(vec3<f32>(hue, 0.6, pow(lambertian, 3.))),
        1.);
    }

    return Scene(material.dist, finalPos, finalNormal, material.index, finalColor);
}
`;function _(t){let e=U;const r=t.map((n,o)=>{const l=`vec3<f32>(U.material${o}Px, U.material${o}Py, U.material${o}Pz)`,m=`vec3<f32>(U.material${o}Rx, U.material${o}Ry, U.material${o}Rz)`;return`fn sdMaterial${o}(posIn: vec3<f32>) -> f32 {
        let mRotation = ${m};
        var pos = posIn - ${l};
        if length(mRotation) != 0.0 {
          pos = rotate(pos, mRotation);
        }
        ${n}
      }`}).join(`
`);e=e.replace("// #SD-INDIVIDUAL-MATERIALS",r);const i=`
    var material = SdMaterial(-1, 1e10, vec3<f32>(0.), vec3<f32>(0.));
    var curDist: f32;
    ${t.map((n,o)=>`
        curDist = sdMaterial${o}(pos);
        if curDist < material.dist {
          material.index = ${o};
          material.dist = curDist;
          material.pos = vec3<f32>(
            U.material${o}Px,
            U.material${o}Py,
            U.material${o}Pz
          );
          material.color = vec3<f32>(
            U.material${o}Cr,
            U.material${o}Cg,
            U.material${o}Cb
          );
        }
      `).join(`
`)}
    return material;
  `;e=e.replace("return SdMaterial(-1, 0., vec3<f32>(0.), vec3<f32>(1.)); // #SD-MATERIALS-FUNC",i);const a=`
    var dist: f32 = 1e10;
    var accDist: f32;
    ${t.map((n,o)=>`dist = min(dist, sdMaterial${o}(pos));`).join(`
`)}
    return dist;
  `;return e=e.replace("return 0.; // #MAP",a),e}function w({main:t,functions:e,rtUniformKeys:r,materialSdFunctions:i}){let a=b;if(a=a.replace("UNIFORMS: f32, // #UNIFORMS",r.map(n=>`${n}: f32,`).join(`
`)),a=a.replace("// #COMMON",S),e&&(a=a.replace("// #FUNCTIONS",e)),i.length>0){const n=_(i);a=a.replace("// #RAY_MARCH_FUNCTIONS",n),t||(t=`
        let scene = calcScene(uv);
        return vec4<f32>(scene.color.rgb, 1.0);
      `)}return t&&(a=a.replace("return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN",t)),a}class P{device;buffer;uniform={};constructor(e,r){this.device=e;const i=Object.keys(r);this.buffer=e.createBuffer({size:i.length*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),i.forEach((a,n)=>{this.uniform[a]={value:r[a],offSet:n*4},this.set(a,r[a])})}getBuffer(){return this.buffer}getKeysSortedByOffset(){return Object.keys(this.uniform).toSorted((e,r)=>this.uniform[e].offSet-this.uniform[r].offSet)}set(e,r){if(!this.uniform[e])throw new Error(`Uniform ${e} not found`);this.uniform[e].value=r,this.device.queue.writeBuffer(this.buffer,this.uniform[e].offSet,new Float32Array([r]))}get(e){if(!this.uniform[e])throw new Error(`Uniform ${e} not found`);return this.uniform[e].value}}async function M({device:t,presentationFormat:e,context:r,canvas:i,main:a,materialSdFunctions:n,initialUniforms:o,functions:l,initalCustomUniforms:m}){const c=new P(t,{time:0,aspectRatio:i.width/i.height,width:i.width,height:i.height,camPosX:o.camPosX??0,camPosY:o.camPosY??0,camPosZ:o.camPosZ??0,camSphericalR:o.camSphericalR??0,camSphericalT:o.camSphericalT??0,camSphericalP:o.camSphericalP??0,camFov:o.camFov??90,...m}),v=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),p=t.createBindGroup({layout:v,entries:[{binding:0,resource:{buffer:c.getBuffer()}}]}),x=w({main:a,functions:l,materialSdFunctions:n,rtUniformKeys:c.getKeysSortedByOffset()}),d=t.createRenderPipeline({layout:t.createPipelineLayout({bindGroupLayouts:[v]}),vertex:{module:t.createShaderModule({code:z}),entryPoint:"main"},fragment:{module:t.createShaderModule({code:x}),entryPoint:"main",targets:[{format:e}]},primitive:{topology:"triangle-strip",frontFace:"ccw",stripIndexFormat:"uint32"}});function y({camera:f}){c.set("time",performance.now()/1e3),c.set("aspectRatio",i.width/i.height),c.set("width",i.width),c.set("height",i.height),c.set("camPosX",f.pos.x),c.set("camPosY",f.pos.y),c.set("camPosZ",f.pos.z),c.set("camSphericalR",f.spherical.radius),c.set("camSphericalT",f.spherical.theta),c.set("camSphericalP",f.spherical.phi),c.set("camFov",f.fov);const h={colorAttachments:[{view:r.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:1},storeOp:"store"}]},g=t.createCommandEncoder(),u=g.beginRenderPass(h);u.setPipeline(d),u.setBindGroup(0,p),u.draw(4,1,0,0),u.end(),t.queue.submit([g.finish()])}function s(f,h){c.set(f,h)}return{render:y,setUniform:s}}async function R(t){const r=await navigator.gpu.requestAdapter();if(!r)throw new Error("No adapter found");const i=r.features.has("texture-compression-bc");i||console.warn("shader-f16 not available");const a=await r.requestDevice({requiredFeatures:i?["shader-f16"]:[]}),n=navigator.gpu.getPreferredCanvasFormat(),o=t.getContext("webgpu");if(!o)throw new Error("No context found");return o.configure({device:a,format:n,alphaMode:"premultiplied"}),{context:o,device:a,presentationFormat:n}}function C(t,e,r){t.pos||(t.pos={x:0,y:0,z:0}),t.color||(t.color={r:1,g:1,b:1}),t.rotation||(t.rotation={x:0,y:0,z:0});const i=e.registerUniform(`material${r}Px`,t.pos.x),a=e.registerUniform(`material${r}Py`,t.pos.y),n=e.registerUniform(`material${r}Pz`,t.pos.z),o=s=>{s.x!==void 0&&i(s.x),s.y!==void 0&&a(s.y),s.z!==void 0&&n(s.z)},l=e.registerUniform(`material${r}Rx`,t.rotation.x),m=e.registerUniform(`material${r}Ry`,t.rotation.y),c=e.registerUniform(`material${r}Rz`,t.rotation.z),v=s=>{s.x!==void 0&&l(s.x),s.y!==void 0&&m(s.y),s.z!==void 0&&c(s.z)},p=e.registerUniform(`material${r}Cr`,t.color.r),x=e.registerUniform(`material${r}Cg`,t.color.g),d=e.registerUniform(`material${r}Cb`,t.color.b);return{setPos:o,setRot:v,setColor:s=>{s.r!==void 0&&p(s.r),s.g!==void 0&&x(s.g),s.b!==void 0&&d(s.b)}}}class I{canvas;main;functions;render;initalCustomUniforms={};setUniform;materialSdFunctions=[];camera;constructor({canvas:e,main:r,functions:i}){this.canvas=e,this.main=r,this.functions=i,this.camera={pos:{x:0,y:0,z:0},spherical:{radius:0,theta:0,phi:0},fov:90}}registerMaterial(e){if(this.render)throw new Error("Render already built");const r=this.materialSdFunctions.length,i=C(e,this,r);return this.materialSdFunctions.push(e.sdFunc),i}registerUniform(e,r){if(this.render)throw new Error("Render already built");return this.initalCustomUniforms[e]=r??0,a=>{if(!this.setUniform)throw new Error("Render not built");this.setUniform(e,a),this.initalCustomUniforms[e]=a}}async build(){const{device:e,context:r,presentationFormat:i}=await R(this.canvas),{render:a,setUniform:n}=await M({device:e,presentationFormat:i,context:r,canvas:this.canvas,main:this.main,materialSdFunctions:this.materialSdFunctions,functions:this.functions,initalCustomUniforms:this.initalCustomUniforms,initialUniforms:{camPosX:this.camera.pos.x,camPosY:this.camera.pos.y,camPosZ:this.camera.pos.z,camSphericalR:this.camera.spherical.radius,camSphericalT:this.camera.spherical.theta,camSphericalP:this.camera.spherical.phi,camFov:this.camera.fov}});this.setUniform=n,this.render=a}shoot(){this.render?.({camera:this.camera})}}export{I as R};
