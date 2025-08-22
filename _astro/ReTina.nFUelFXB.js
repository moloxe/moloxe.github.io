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
`,M=`struct GlobalUniform {
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

struct Scene {
    dist: f32,
    pos: vec3<f32>,
    normal: vec3<f32>,
    materialIndex: i32,
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

        // TODO: Implement lighting
        let lambertian = dot(finalNormal, -rd);
        var spec = 1.;
        if lambertian > 0. {
            let lightDir = normalize(ro - finalPos);
            let halfDir = normalize(lightDir + -rd);
            spec = pow(max(dot(halfDir, finalNormal), 0.), 500.);
        }
        finalColor = vec4<f32>(material.color.rgb * lambertian + spec, 1.);
    }

    return Scene(material.dist, finalPos, finalNormal, material.index, finalColor);
}
`;function R(t){let e=P;const r=t.map((n,a)=>{const l=`vec3<f32>(U.material${a}Px, U.material${a}Py, U.material${a}Pz)`,m=`vec3<f32>(U.material${a}Rx, U.material${a}Ry, U.material${a}Rz)`;return`fn sdMaterial${a}(posIn: vec3<f32>) -> f32 {
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
    ${t.map((n,a)=>`
        curDist = sdMaterial${a}(pos);
        if curDist < material.dist {
          material.index = ${a};
          material.dist = curDist;
          material.pos = vec3<f32>(
            U.material${a}Px,
            U.material${a}Py,
            U.material${a}Pz
          );
          material.color = vec3<f32>(
            U.material${a}Cr,
            U.material${a}Cg,
            U.material${a}Cb
          );
        }
      `).join(`
`)}
    return material;
  `;e=e.replace("return SdMaterial(-1, 0., vec3<f32>(0.), vec3<f32>(1.)); // #SD-MATERIALS-FUNC",i);const o=`
    var dist: f32 = 1e10;
    var accDist: f32;
    ${t.map((n,a)=>`dist = min(dist, sdMaterial${a}(pos));`).join(`
`)}
    return dist;
  `;return e=e.replace("return 0.; // #MAP",o),e}function b({main:t,functions:e,rtUniformKeys:r,materialSdFunctions:i}){let o=M;if(o=o.replace("UNIFORMS: f32, // #UNIFORMS",r.map(n=>`${n}: f32,`).join(`
`)),o=o.replace("// #COMMON",U),e&&(o=o.replace("// #FUNCTIONS",e)),i.length>0){const n=R(i);o=o.replace("// #RAY_MARCH_FUNCTIONS",n),t||(t=`
        let scene = calcScene(uv);
        return vec4<f32>(scene.color.rgb, 1.0);
      `)}return t&&(o=o.replace("return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN",t)),o}class z{device;buffer;uniform={};constructor(e,r){this.device=e;const i=Object.keys(r);this.buffer=e.createBuffer({size:i.length*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),i.forEach((o,n)=>{this.uniform[o]={value:r[o],offSet:n*4},this.set(o,r[o])})}getBuffer(){return this.buffer}getKeysSortedByOffset(){return Object.keys(this.uniform).toSorted((e,r)=>this.uniform[e].offSet-this.uniform[r].offSet)}set(e,r){if(!this.uniform[e])throw new Error(`Uniform ${e} not found`);this.uniform[e].value=r,this.device.queue.writeBuffer(this.buffer,this.uniform[e].offSet,new Float32Array([r]))}get(e){if(!this.uniform[e])throw new Error(`Uniform ${e} not found`);return this.uniform[e].value}}async function C({device:t,presentationFormat:e,context:r,canvas:i,main:o,materialSdFunctions:n,initialUniforms:a,functions:l,initalCustomUniforms:m}){const c=new z(t,{time:0,aspectRatio:i.width/i.height,width:i.width,height:i.height,camPosX:a.camPosX??0,camPosY:a.camPosY??0,camPosZ:a.camPosZ??0,camSphericalR:a.camSphericalR??0,camSphericalT:a.camSphericalT??0,camSphericalP:a.camSphericalP??0,camFov:a.camFov??90,...m}),u=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),v=t.createBindGroup({layout:u,entries:[{binding:0,resource:{buffer:c.getBuffer()}}]}),h=b({main:o,functions:l,materialSdFunctions:n,rtUniformKeys:c.getKeysSortedByOffset()}),d=t.createRenderPipeline({layout:t.createPipelineLayout({bindGroupLayouts:[u]}),vertex:{module:t.createShaderModule({code:S}),entryPoint:"main"},fragment:{module:t.createShaderModule({code:h}),entryPoint:"main",targets:[{format:e}]},primitive:{topology:"triangle-strip",frontFace:"ccw",stripIndexFormat:"uint32"}});function g({camera:f}){c.set("time",performance.now()/1e3),c.set("aspectRatio",i.width/i.height),c.set("width",i.width),c.set("height",i.height),c.set("camPosX",f.pos.x),c.set("camPosY",f.pos.y),c.set("camPosZ",f.pos.z),c.set("camSphericalR",f.spherical.radius),c.set("camSphericalT",f.spherical.theta),c.set("camSphericalP",f.spherical.phi),c.set("camFov",f.fov);const x={colorAttachments:[{view:r.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:1},storeOp:"store"}]},y=t.createCommandEncoder(),p=y.beginRenderPass(x);p.setPipeline(d),p.setBindGroup(0,v),p.draw(4,1,0,0),p.end(),t.queue.submit([y.finish()])}function s(f,x){c.set(f,x)}return{render:g,setUniform:s}}async function w(t){const r=await navigator.gpu.requestAdapter();if(!r)throw new Error("No adapter found");const i=r.features.has("texture-compression-bc");i||console.warn("shader-f16 not available");const o=await r.requestDevice({requiredFeatures:i?["shader-f16"]:[]}),n=navigator.gpu.getPreferredCanvasFormat(),a=t.getContext("webgpu");if(!a)throw new Error("No context found");return a.configure({device:o,format:n,alphaMode:"premultiplied"}),{context:a,device:o,presentationFormat:n}}function _(t,e,r){t.pos||(t.pos={x:0,y:0,z:0}),t.color||(t.color={r:1,g:1,b:1}),t.rotation||(t.rotation={x:0,y:0,z:0});const i=e.registerUniform(`material${r}Px`,t.pos.x),o=e.registerUniform(`material${r}Py`,t.pos.y),n=e.registerUniform(`material${r}Pz`,t.pos.z),a=s=>{s.x!==void 0&&i(s.x),s.y!==void 0&&o(s.y),s.z!==void 0&&n(s.z)},l=e.registerUniform(`material${r}Rx`,t.rotation.x),m=e.registerUniform(`material${r}Ry`,t.rotation.y),c=e.registerUniform(`material${r}Rz`,t.rotation.z),u=s=>{s.x!==void 0&&l(s.x),s.y!==void 0&&m(s.y),s.z!==void 0&&c(s.z)},v=e.registerUniform(`material${r}Cr`,t.color.r),h=e.registerUniform(`material${r}Cg`,t.color.g),d=e.registerUniform(`material${r}Cb`,t.color.b);return{setPos:a,setRot:u,setColor:s=>{s.r!==void 0&&v(s.r),s.g!==void 0&&h(s.g),s.b!==void 0&&d(s.b)}}}class I{canvas;main;functions;render;initalCustomUniforms={};setUniform;materialSdFunctions=[];camera;constructor({canvas:e,main:r,functions:i}){this.canvas=e,this.main=r,this.functions=i,this.camera={pos:{x:0,y:0,z:0},spherical:{radius:0,theta:0,phi:0},fov:90}}registerMaterial(e){if(this.render)throw new Error("Render already built");const r=this.materialSdFunctions.length,i=_(e,this,r);return this.materialSdFunctions.push(e.sdFunc),i}registerUniform(e,r){if(this.render)throw new Error("Render already built");return this.initalCustomUniforms[e]=r??0,o=>{if(!this.setUniform)throw new Error("Render not built");this.setUniform(e,o),this.initalCustomUniforms[e]=o}}async build(){const{device:e,context:r,presentationFormat:i}=await w(this.canvas),{render:o,setUniform:n}=await C({device:e,presentationFormat:i,context:r,canvas:this.canvas,main:this.main,materialSdFunctions:this.materialSdFunctions,functions:this.functions,initalCustomUniforms:this.initalCustomUniforms,initialUniforms:{camPosX:this.camera.pos.x,camPosY:this.camera.pos.y,camPosZ:this.camera.pos.z,camSphericalR:this.camera.spherical.radius,camSphericalT:this.camera.spherical.theta,camSphericalP:this.camera.spherical.phi,camFov:this.camera.fov}});this.setUniform=n,this.render=o}shoot(){this.render?.({camera:this.camera})}}export{I as R};
