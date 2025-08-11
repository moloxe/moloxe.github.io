const P=`struct VSOut {
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
`,b=`
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
`,M=`

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
    let dir2d = vec2<f32>(
        uv.x * U.aspectRatio,
        uv.y
    );

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
`,R=`struct GlobalUniform {
    UNIFORMS: f32, // #UNIFORMS
};

@group(0) @binding(0) var <uniform> U: GlobalUniform;

// #COMMON
// #RAY_MARCH_FUNCTIONS

@fragment
fn main(@location(0) fragCoord: vec2<f32>) -> @location(0) vec4<f32> {
    let uv = (-1.0 + 2.0 * fragCoord.xy);
    return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN
}
`;function F({main:a,map:t,rtUniformKeys:r}){let e=R;return e=e.replace("UNIFORMS: f32, // #UNIFORMS",r.map(c=>`${c}: f32,`).join(`
`)),e=e.replace("// #COMMON",b),t&&(e=e.replace("// #RAY_MARCH_FUNCTIONS",M),e=e.replace("return 0.; // #MAP",t)),e=e.replace("return vec4<f32>(0.0, 0.0, 0.0, 1.0); // #MAIN",a),e}class I{device;buffer;keys;values;constructor(t,r){this.device=t;const e=Object.keys(r).length*4;this.buffer=t.createBuffer({size:e,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.keys=Object.keys(r),this.values=new Float32Array(Object.values(r))}set(t,r){const e=this.keys.indexOf(t);if(e===-1)throw new Error(`Uniform ${t} not found`);this.values[e]=r,this.device.queue.writeBuffer(this.buffer,e*4,new Float32Array([r]))}}async function O({device:a,presentationFormat:t,context:r,canvas:e,main:c,map:p,initialUniforms:o}){const n=new I(a,{time:0,aspectRatio:e.width/e.height,camPosX:o.camPosX??0,camPosY:o.camPosY??0,camPosZ:o.camPosZ??0,camSphericalR:o.camSphericalR??0,camSphericalT:o.camSphericalT??0,camSphericalP:o.camSphericalP??0,camFov:o.camFov??90}),u=a.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),x=a.createBindGroup({layout:u,entries:[{binding:0,resource:{buffer:n.buffer}}]}),y=F({main:c,map:p,rtUniformKeys:n.keys}),g=a.createRenderPipeline({layout:a.createPipelineLayout({bindGroupLayouts:[u]}),vertex:{module:a.createShaderModule({code:P}),entryPoint:"main"},fragment:{module:a.createShaderModule({code:y}),entryPoint:"main",targets:[{format:t}]},primitive:{topology:"triangle-strip",frontFace:"ccw",stripIndexFormat:"uint32"}});function w({camera:s}){n.set("time",performance.now()/1e3),n.set("aspectRatio",e.width/e.height),n.set("camPosX",s.pos.x),n.set("camPosY",s.pos.y),n.set("camPosZ",s.pos.z),n.set("camSphericalR",s.spherical.radius),n.set("camSphericalT",s.spherical.theta),n.set("camSphericalP",s.spherical.phi),n.set("camFov",s.fov);const S={colorAttachments:[{view:r.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:0,a:1},storeOp:"store"}]},v=a.createCommandEncoder(),f=v.beginRenderPass(S);f.setPipeline(g),f.setBindGroup(0,x),f.draw(4,1,0,0),f.end(),a.queue.submit([v.finish()])}return{render:w}}async function X(a){const r=await navigator.gpu.requestAdapter();if(!r)throw new Error("No adapter found");const e=r.features.has("texture-compression-bc");e||console.warn("shader-f16 not available");const c=await r.requestDevice({requiredFeatures:e?["shader-f16"]:[]}),p=navigator.gpu.getPreferredCanvasFormat(),o=a.getContext("webgpu");if(!o)throw new Error("No context found");return o.configure({device:c,format:p,alphaMode:"premultiplied"}),{context:o,device:c,presentationFormat:p}}class Y{canvas;main;map;render;camera;constructor({canvas:t,map:r,main:e}){this.canvas=t,this.map=r,this.main=e,this.camera={pos:{x:0,y:0,z:0},spherical:{radius:0,theta:0,phi:0},fov:90}}async build(){const{device:t,context:r,presentationFormat:e}=await X(this.canvas),{render:c}=await O({device:t,presentationFormat:e,context:r,canvas:this.canvas,main:this.main,map:this.map,initialUniforms:{camPosX:this.camera.pos.x,camPosY:this.camera.pos.y,camPosZ:this.camera.pos.z,camSphericalR:this.camera.spherical.radius,camSphericalT:this.camera.spherical.theta,camSphericalP:this.camera.spherical.phi,camFov:this.camera.fov}});this.render=c}shoot(){this.render?.({camera:this.camera})}}const i=document.createElement("canvas");i.width=window.innerWidth*window.devicePixelRatio;i.height=window.innerHeight*window.devicePixelRatio;i.style.width=`${window.innerWidth}px`;i.style.height=`${window.innerHeight}px`;document.body.appendChild(i);const l=new Y({canvas:i,main:`
    let scene = calcScene(uv);
    var color = vec3<f32>(0.0);

    if scene.dist > 0.0 {
      color = hsv2rgb(
        vec3f(uv.x, 0.5, scene.normal.z)
      );
    }

    return vec4<f32>(color, 1.0);
  `,map:`
    var thres = length(pos) - 1.2;
    if thres > 0.2 {
        return thres;
    }

    var power = 6.0 + U.time * 0.1;
    var z = pos;
    var c = pos;

    var dr = 1.0;
    var r = 0.0;
    for (var i: i32 = 0; i < 5; i++) {        
        r = length(z);
        if r > 2.0 { break; }
        var theta = acos(z.z / r);
        var phi = atan2(z.y, z.x);
        dr = pow(r, power - 1.0) * power * dr + 1.0;
        var zr = pow(r, power);
        theta *= power;
        phi *= power;
        z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));
        z += c;
    }
    return 0.5 * log(r) * r / dr;
  `});await l.build();l.camera.spherical.radius=2;let m=0;function d(){l.camera.spherical.theta+=.001,l.camera.spherical.phi+=.001,l.shoot(),m++,requestAnimationFrame(d)}d();const h=document.createElement("div");h.setAttribute("style",` position: absolute;
    top: 0;
    left: 0;
    color: white;
    font-size: 24px;
    pointer-events: none;`);document.body.appendChild(h);setInterval(()=>{h.innerText=`FPS: ${m}`,m=0},1e3);
