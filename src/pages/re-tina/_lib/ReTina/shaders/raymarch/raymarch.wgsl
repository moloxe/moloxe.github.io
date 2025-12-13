struct SdMaterial {
    index: i32,
    dist: f32,
    pos: vec3<f32>,
    color: vec3<f32>,
    collisionGroup: i32,
}

// #SD-INDIVIDUAL-MATERIALS

fn sdMaterials(pos: vec3<f32>) -> SdMaterial {
    // #SD-MATERIALS-FUNC
}

// This function is exclusive for calcNormal
fn map(pos: vec3<f32>) -> f32 {
    // #MAP
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
    // #LIGHT-MATERIALS-FUNC
}

fn calculateDFAO(pos: vec3<f32>, normal: vec3<f32>) -> f32 {
    let AO_RADIUS = 1.;
    let AO_EPSILON = 1e-4;
    let numSamples = 8;
    var aoSum = 0.0;
    for (var i: i32 = 0; i < numSamples; i++) {
        let t_ratio = f32(i + 1) / f32(numSamples - 1);
        let t_real_dist = AO_EPSILON + t_ratio * (AO_RADIUS - AO_EPSILON);
        let samplePos = pos + normal * t_real_dist;
        let dist = sdMaterials(samplePos).dist;
        let visibility = clamp(dist / t_real_dist, 0f, 1f);
        aoSum += (1f - visibility) * (1f - t_ratio); 
    }
    let aoFactor = 1f - aoSum / f32(numSamples);
    return clamp(aoFactor, 0f, 1f);
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
    var material = SdMaterial(-1, 0.0, vec3<f32>(0.0), vec3<f32>(0.0), -1);
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
    return SdMaterial(-1, -1.0, vec3<f32>(0.0), vec3<f32>(0.0), -1);
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
