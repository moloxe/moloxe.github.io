const raymarchFunctionsFrag = /* wgsl */ `

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
        let lambertian = dot(finalNormal, -rd);
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
`

export default raymarchFunctionsFrag
