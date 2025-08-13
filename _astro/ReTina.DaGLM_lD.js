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
`,P=`
fn rotate(pos: vec3<f32>, aX: f32, aY: f32, aZ: f32) -> vec3<f32> {
    var rotX: mat3x3<f32> = mat3x3<f32>(1.0, 0.0, 0.0, 0.0, cos(aX), -sin(aX), 0.0, sin(aX), cos(aX));
    var rotY: mat3x3<f32> = mat3x3<f32>(cos(aY), 0.0, sin(aY), 0.0, 1.0, 0.0, -sin(aY), 0.0, cos(aY));
    var rotZ: mat3x3<f32> = mat3x3<f32>(cos(aZ), -sin(aZ), 0.0, sin(aZ), cos(aZ), 0.0, 0.0, 0.0, 1.0);
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
`,w=`

fn map(pos: vec3<f32>) -> f32 {
    return 0.; // #MAP
}

fn calcNormal(pos: vec3<f32>) -> vec3<f32> {
    var h = 1e-4;
    var k = vec2<f32>(1., -1.);
    return normalize(
        k.xyy * map(pos + k.xyy * h) + k.yyx * map(pos + k.yyx * h) + k.yxy * map(pos + k.yxy * h) + k.xxx * map(pos + k.xxx * h)
    );
}

struct RayMarch {
    dist: f32,
    materialIndex: i32
}

const RM_MAX_ITER: i32 = 1024;
const RM_MIN_DIST: f32 = 1e-4;
const RM_MAX_DIST: f32 = 1e4;
fn rayMarch(ro: vec3<f32>, rd: vec3<f32>) -> RayMarch {
    var materialIndex = -1;
    var totalDist = 0.0;
    for (var i: i32 = 0; i < RM_MAX_ITER; i++) {
        let pos = ro + totalDist * rd;
        let currDist = abs(map(pos));
        if currDist < RM_MIN_DIST {
            // TODO: implement material processing
            // materialIndex = [returned-from-map-sd-functions].materialIndex;
            break;
        }
        totalDist += currDist;
        if totalDist > RM_MAX_DIST {
            totalDist = -1.0;
            break;
        }
    }
    return RayMarch(totalDist, materialIndex);
}

struct Scene {
    dist: f32,
    pos: vec3<f32>,
    normal: vec3<f32>,
    materialIndex: i32,
    color: vec4<f32>,
};

fn calcScene(uv: vec2<f32>) -> Scene {
    var dir2d = (uv * 2. - 1.);
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

    let rm = rayMarch(ro, rd);
    
    let materialPos = ro + rd * rm.dist;
    let materialNormal = calcNormal(materialPos);

    // TODO: implement material processing
    let materialColor = vec4<f32>(1.0, 1.0, 1.0, 1.0);

    return Scene(
        rm.dist,
        materialPos,
        materialNormal,
        rm.materialIndex,
        materialColor
    );
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
`;function b({main:o,map:a,functions:r,rtUniformKeys:t}){let e=M;return e=e.replace("UNIFORMS: f32, // #UNIFORMS",t.map(c=>`${c}: f32,`).join(`
`)),e=e.replace("// #COMMON",P),r&&(e=e.replace("// #FUNCTIONS",r)),a&&(e=e.replace("// #RAY_MARCH_FUNCTIONS",w),e=e.replace("return 0.; // #MAP",a)),e=e.replace("return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN",o),e}class R{device;buffer;keys;values;constructor(a,r){this.device=a;const t=Object.keys(r).length*4;this.buffer=a.createBuffer({size:t,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.keys=Object.keys(r),this.values=new Float32Array(Object.values(r))}set(a,r){const t=this.keys.indexOf(a);if(t===-1)throw new Error(`Uniform ${a} not found`);this.values[t]=r,this.device.queue.writeBuffer(this.buffer,t*4,new Float32Array([r]))}}async function U({device:o,presentationFormat:a,context:r,canvas:t,main:e,map:c,initialUniforms:i,functions:p,initalCustomUniforms:x}){const n=new R(o,{...x,time:0,aspectRatio:t.width/t.height,width:t.width,height:t.height,camPosX:i.camPosX??0,camPosY:i.camPosY??0,camPosZ:i.camPosZ??0,camSphericalR:i.camSphericalR??0,camSphericalT:i.camSphericalT??0,camSphericalP:i.camSphericalP??0,camFov:i.camFov??90}),l=o.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),h=o.createBindGroup({layout:l,entries:[{binding:0,resource:{buffer:n.buffer}}]}),v=b({main:e,map:c,functions:p,rtUniformKeys:n.keys}),d=o.createRenderPipeline({layout:o.createPipelineLayout({bindGroupLayouts:[l]}),vertex:{module:o.createShaderModule({code:S}),entryPoint:"main"},fragment:{module:o.createShaderModule({code:v}),entryPoint:"main",targets:[{format:a}]},primitive:{topology:"triangle-strip",frontFace:"ccw",stripIndexFormat:"uint32"}});function y({camera:s}){n.set("time",performance.now()/1e3),n.set("aspectRatio",t.width/t.height),n.set("width",t.width),n.set("height",t.height),n.set("camPosX",s.pos.x),n.set("camPosY",s.pos.y),n.set("camPosZ",s.pos.z),n.set("camSphericalR",s.spherical.radius),n.set("camSphericalT",s.spherical.theta),n.set("camSphericalP",s.spherical.phi),n.set("camFov",s.fov);const m={colorAttachments:[{view:r.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:1},storeOp:"store"}]},u=o.createCommandEncoder(),f=u.beginRenderPass(m);f.setPipeline(d),f.setBindGroup(0,h),f.draw(4,1,0,0),f.end(),o.queue.submit([u.finish()])}function g(s,m){n.set(s,m)}return{render:y,setUniform:g}}async function I(o){const r=await navigator.gpu.requestAdapter();if(!r)throw new Error("No adapter found");const t=r.features.has("texture-compression-bc");t||console.warn("shader-f16 not available");const e=await r.requestDevice({requiredFeatures:t?["shader-f16"]:[]}),c=navigator.gpu.getPreferredCanvasFormat(),i=o.getContext("webgpu");if(!i)throw new Error("No context found");return i.configure({device:e,format:c,alphaMode:"premultiplied"}),{context:i,device:e,presentationFormat:c}}class C{canvas;main;map;functions;render;initalCustomUniforms={};setUniform;camera;constructor({canvas:a,map:r,main:t,functions:e}){this.canvas=a,this.map=r,this.main=t,this.functions=e,this.camera={pos:{x:0,y:0,z:0},spherical:{radius:0,theta:0,phi:0},fov:90}}registerUniform(a,r){if(this.render)throw new Error("Render already built");return this.initalCustomUniforms[a]=r??0,e=>{if(!this.setUniform)throw new Error("Render not built");this.setUniform(a,e),this.initalCustomUniforms[a]=e}}async build(){const{device:a,context:r,presentationFormat:t}=await I(this.canvas),{render:e,setUniform:c}=await U({device:a,presentationFormat:t,context:r,canvas:this.canvas,main:this.main,map:this.map,functions:this.functions,initalCustomUniforms:this.initalCustomUniforms,initialUniforms:{camPosX:this.camera.pos.x,camPosY:this.camera.pos.y,camPosZ:this.camera.pos.z,camSphericalR:this.camera.spherical.radius,camSphericalT:this.camera.spherical.theta,camSphericalP:this.camera.spherical.phi,camFov:this.camera.fov}});this.setUniform=c,this.render=e}shoot(){this.render?.({camera:this.camera})}}export{C as R};
