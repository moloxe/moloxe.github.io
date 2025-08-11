const raymarchFunctionsFrag = /* wgsl */ `

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
`

export default raymarchFunctionsFrag
