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
`,U=`
fn rotate(pos: vec3<f32>, rot: vec3<f32>) -> vec3<f32> {
    var rotX: mat3x3<f32> = mat3x3<f32>(1.0, 0.0, 0.0, 0.0, cos(rot.x), -sin(rot.x), 0.0, sin(rot.x), cos(rot.x));
    var rotY: mat3x3<f32> = mat3x3<f32>(cos(rot.y), 0.0, sin(rot.y), 0.0, 1.0, 0.0, -sin(rot.y), 0.0, cos(rot.y));
    var rotZ: mat3x3<f32> = mat3x3<f32>(cos(rot.z), -sin(rot.z), 0.0, sin(rot.z), cos(rot.z), 0.0, 0.0, 0.0, 1.0);
    return rotX * rotY * rotZ * pos;
}

fn rotateXY(vec: vec3f, aX: f32, aY: f32) -> vec3f {
    let rotX = mat3x3<f32>(1.0, 0.0, 0.0, 0.0, cos(aX), -sin(aX), 0.0, sin(aX), cos(aX));
    let rotY = mat3x3<f32>(cos(aY), 0.0, sin(aY), 0.0, 1.0, 0.0, -sin(aY), 0.0, cos(aY));
    return rotX * rotY * vec;
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
`,P=`

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

const RM_MAX_ITER: i32 = 1024;
const RM_MIN_DIST: f32 = 1e-4;
const RM_MAX_DIST: f32 = 1e4;
fn rayMarch(ro: vec3<f32>, rd: vec3<f32>) -> f32 {
    var totalDist = 0.0;
    for (var i: i32 = 0; i < RM_MAX_ITER; i++) {
        let pos = ro + rd * totalDist;
        let currDist = abs(map(pos));
        if currDist < RM_MIN_DIST {
            break;
        }
        totalDist += currDist;
        if totalDist > RM_MAX_DIST {
            totalDist = -1.0;
            break;
        }
    }
    return totalDist;
}

struct Scene {
    dist: f32,
    pos: vec3<f32>,
    normal: vec3<f32>,
    materialIndex: i32,
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

    var rd = vec3<f32>(dir2d, -focalLength);
    rd = rotateXY(rd, spherical.z, spherical.y);

    let dist = rayMarch(ro, rd);
    
    var finalPos: vec3<f32>;
    var finalNormal: vec3<f32>;
    var finalColor = vec4<f32>(0.0, 0.0, 0.0, 1.0);

    var materialIndex = -1;
    if dist > 0.0 {
        finalPos = ro + rd * dist;
        finalNormal = calcNormal(finalPos);
        let material = sdMaterials(finalPos);
        materialIndex = material.index;

        // TODO: Implement lighting
        var lambertian = dot(finalNormal, -rd);
        lambertian = lambertian * 0.8 + pow(lambertian, 100.);
        finalColor = vec4<f32>(material.color.rgb * lambertian, 1.);
    }

    return Scene(
        dist,
        finalPos,
        finalNormal,
        materialIndex,
        finalColor
    );
}
`;function M(e){let t=P;const r=e.map((n,o)=>{const f=`vec3<f32>(U.material${o}Px, U.material${o}Py, U.material${o}Pz)`,l=`vec3<f32>(U.material${o}Rx, U.material${o}Ry, U.material${o}Rz)`;return`fn sdMaterial${o}(posIn: vec3<f32>) -> f32 {
        let mRotation = ${l};
        var pos = posIn - ${f};
        if length(mRotation) != 0.0 {
          pos = rotate(pos, mRotation);
        }
        ${n}
      }`}).join(`
`);t=t.replace("// #SD-INDIVIDUAL-MATERIALS",r);const i=`
    var material = SdMaterial(-1, 1e10, vec3<f32>(0.), vec3<f32>(0.));
    var curDist: f32;
    ${e.map((n,o)=>`
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
  `;t=t.replace("return SdMaterial(-1, 0., vec3<f32>(0.), vec3<f32>(1.)); // #SD-MATERIALS-FUNC",i);const a=`
    var dist: f32 = 1e10;
    var accDist: f32;
    var smoothness: f32 = 0.0;
    ${e.map((n,o)=>`
        dist = min(dist, sdMaterial${o}(pos));

        // Smoothness processing
        if smoothness > 0. {
          accDist = opSmoothUnion(accDist, dist, smoothness);
        } else {
          accDist = dist;
        }
        if (accDist < dist) {
          dist = accDist;
        }
        smoothness = U.material${o}smoothness;
        // End smoothness processing
      `).join(`
`)}
    return dist;
  `;return t=t.replace("return 0.; // #MAP",a),t}function R({main:e,functions:t,rtUniformKeys:r,materialSdFunctions:i}){let a=b;if(a=a.replace("UNIFORMS: f32, // #UNIFORMS",r.map(n=>`${n}: f32,`).join(`
`)),a=a.replace("// #COMMON",U),t&&(a=a.replace("// #FUNCTIONS",t)),i.length>0){const n=M(i);a=a.replace("// #RAY_MARCH_FUNCTIONS",n),e||(e=`
        let scene = calcScene(uv);
        return vec4<f32>(scene.color.rgb, 1.0);
      `)}return e&&(a=a.replace("return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN",e)),a}class C{device;buffer;uniform={};constructor(t,r){this.device=t;const i=Object.keys(r);this.buffer=t.createBuffer({size:i.length*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),i.forEach((a,n)=>{this.uniform[a]={value:r[a],offSet:n*4},this.set(a,r[a])})}getBuffer(){return this.buffer}getKeysSortedByOffset(){return Object.keys(this.uniform).toSorted((t,r)=>this.uniform[t].offSet-this.uniform[r].offSet)}set(t,r){if(!this.uniform[t])throw new Error(`Uniform ${t} not found`);this.uniform[t].value=r,this.device.queue.writeBuffer(this.buffer,this.uniform[t].offSet,new Float32Array([r]))}get(t){if(!this.uniform[t])throw new Error(`Uniform ${t} not found`);return this.uniform[t].value}}async function w({device:e,presentationFormat:t,context:r,canvas:i,main:a,materialSdFunctions:n,initialUniforms:o,functions:f,initalCustomUniforms:l}){const c=new C(e,{time:0,aspectRatio:i.width/i.height,width:i.width,height:i.height,camPosX:o.camPosX??0,camPosY:o.camPosY??0,camPosZ:o.camPosZ??0,camSphericalR:o.camSphericalR??0,camSphericalT:o.camSphericalT??0,camSphericalP:o.camSphericalP??0,camFov:o.camFov??90,...l}),m=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),h=e.createBindGroup({layout:m,entries:[{binding:0,resource:{buffer:c.getBuffer()}}]}),p=R({main:a,functions:f,materialSdFunctions:n,rtUniformKeys:c.getKeysSortedByOffset()}),v=e.createRenderPipeline({layout:e.createPipelineLayout({bindGroupLayouts:[m]}),vertex:{module:e.createShaderModule({code:S}),entryPoint:"main"},fragment:{module:e.createShaderModule({code:p}),entryPoint:"main",targets:[{format:t}]},primitive:{topology:"triangle-strip",frontFace:"ccw",stripIndexFormat:"uint32"}});function d({camera:s}){c.set("time",performance.now()/1e3),c.set("aspectRatio",i.width/i.height),c.set("width",i.width),c.set("height",i.height),c.set("camPosX",s.pos.x),c.set("camPosY",s.pos.y),c.set("camPosZ",s.pos.z),c.set("camSphericalR",s.spherical.radius),c.set("camSphericalT",s.spherical.theta),c.set("camSphericalP",s.spherical.phi),c.set("camFov",s.fov);const g={colorAttachments:[{view:r.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:1},storeOp:"store"}]},y=e.createCommandEncoder(),u=y.beginRenderPass(g);u.setPipeline(v),u.setBindGroup(0,h),u.draw(4,1,0,0),u.end(),e.queue.submit([y.finish()])}function x(s,g){c.set(s,g)}return{render:d,setUniform:x}}async function I(e){const r=await navigator.gpu.requestAdapter();if(!r)throw new Error("No adapter found");const i=r.features.has("texture-compression-bc");i||console.warn("shader-f16 not available");const a=await r.requestDevice({requiredFeatures:i?["shader-f16"]:[]}),n=navigator.gpu.getPreferredCanvasFormat(),o=e.getContext("webgpu");if(!o)throw new Error("No context found");return o.configure({device:a,format:n,alphaMode:"premultiplied"}),{context:o,device:a,presentationFormat:n}}function z(e,t,r){e.pos||(e.pos={x:0,y:0,z:0}),e.color||(e.color={r:1,g:1,b:1}),e.rotation||(e.rotation={x:0,y:0,z:0}),e.smoothness||(e.smoothness=0);const i=t.registerUniform(`material${r}Px`,e.pos.x),a=t.registerUniform(`material${r}Py`,e.pos.y),n=t.registerUniform(`material${r}Pz`,e.pos.z),o=s=>{s.x!==void 0&&i(s.x),s.y!==void 0&&a(s.y),s.z!==void 0&&n(s.z)},f=t.registerUniform(`material${r}Rx`,e.rotation.x),l=t.registerUniform(`material${r}Ry`,e.rotation.y),c=t.registerUniform(`material${r}Rz`,e.rotation.z),m=s=>{s.x!==void 0&&f(s.x),s.y!==void 0&&l(s.y),s.z!==void 0&&c(s.z)},h=t.registerUniform(`material${r}Cr`,e.color.r),p=t.registerUniform(`material${r}Cg`,e.color.g),v=t.registerUniform(`material${r}Cb`,e.color.b),d=s=>{s.r!==void 0&&h(s.r),s.g!==void 0&&p(s.g),s.b!==void 0&&v(s.b)},x=t.registerUniform(`material${r}smoothness`,e.smoothness);return{setPos:o,setRot:m,setColor:d,setSmoothness:x}}class F{canvas;main;functions;render;initalCustomUniforms={};setUniform;materialSdFunctions=[];camera;constructor({canvas:t,main:r,functions:i}){this.canvas=t,this.main=r,this.functions=i,this.camera={pos:{x:0,y:0,z:0},spherical:{radius:0,theta:0,phi:0},fov:90}}registerMaterial(t){if(this.render)throw new Error("Render already built");const r=this.materialSdFunctions.length,i=z(t,this,r);return this.materialSdFunctions.push(t.sdFunc),i}registerUniform(t,r){if(this.render)throw new Error("Render already built");return this.initalCustomUniforms[t]=r??0,a=>{if(!this.setUniform)throw new Error("Render not built");this.setUniform(t,a),this.initalCustomUniforms[t]=a}}async build(){const{device:t,context:r,presentationFormat:i}=await I(this.canvas),{render:a,setUniform:n}=await w({device:t,presentationFormat:i,context:r,canvas:this.canvas,main:this.main,materialSdFunctions:this.materialSdFunctions,functions:this.functions,initalCustomUniforms:this.initalCustomUniforms,initialUniforms:{camPosX:this.camera.pos.x,camPosY:this.camera.pos.y,camPosZ:this.camera.pos.z,camSphericalR:this.camera.spherical.radius,camSphericalT:this.camera.spherical.theta,camSphericalP:this.camera.spherical.phi,camFov:this.camera.fov}});this.setUniform=n,this.render=a}shoot(){this.render?.({camera:this.camera})}}export{F as R};
