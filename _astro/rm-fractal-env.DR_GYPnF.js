import{R as r}from"./ReTina.DegRo32d.js";import{f as s}from"./freeControls.BVGVdC3g.js";const o=new r({showFps:!0,height:600,useInterlacing:!0});o.registerMaterial({sdFunc:`
    pos.z -= U.time * 0.5;
    pos = asin(sin(pos)) - vec3<f32>(3.0);
    for (var i = 0; i < 9; i++) {
        pos = abs(vec3<f32>(pos.xz, pos.y).xzy);
        if (pos.x < pos.y) {
            pos = pos.zxy;
        } else {
            pos = pos.zyx;
        }
        pos = pos + pos - vec3<f32>(1.0, 3.0, 7.0);
    }
    let dist = max(pos.x, pos.z) / 1000.0 - 0.01;
    return dist;
  `,lightFunc:`
    var spec = 0.;
    let lambertian = dot(normal, -rd);
    if lambertian > 0. {
        let lightDir = normalize(ro - pos);
        let halfDir = normalize(lightDir + -rd);
        spec = pow(max(dot(halfDir, normal), 0.), 2000.);
    }
    var dd = length(pos - ro); dd = 1 + (dd * dd  * .01);
    var out = normal * normal;
    out = rgb2hsv(out);
    out = hsv2rgb(vec3<f32>(out.x + U.time * .2 + sin(pos.x + pos.y) / 4., .6, .6));
    out = (out * lambertian + spec) / dd;
    return vec4<f32>(out, 1.);
  `});await o.build();o.camera.fov=100;o.camera.spherical={radius:0,phi:0,theta:.2};s(o);o.buildAndRun();
