import{R as e}from"./ReTina.B45RerBY.js";import{f as t}from"./freeControls.BVGVdC3g.js";const r=new e({height:600,useInterlacing:!0,showFps:!0});r.registerMaterial({sdFunc:`
    var thres = length(pos) - 1.2;
    if thres > 0.2 {
        return thres;
    }

    var power = 6 + 4 * sin(U.time * 0.1);
    var z = pos;
    var c = pos;

    var dr = 1.0;
    var r = 0.0;
    for (var i: i32 = 0; i < 128; i++) {
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
  `,lightFunc:`
    let diffuseColor = hsv2rgb(vec3f(toSpherical(pos).y + U.time * 0.3, 0.5, 0.8));
    let lightPos = toCartesian(vec3f(2, toSpherical(ro).yz));
    let light = blinnPhong(
      // Environment
      rd, normal, /* minBright */ 0,
      // Material
      pos, diffuseColor, /* shininess */ 256,
      // Light
      /* lightPos */ lightPos, /* lightColor */ vec3f(1), /* power */ 2,
    );
    return vec4f(light, 1.);
  `});r.camera.spherical={phi:-.5,radius:1.8,theta:.4};t(r);await r.buildAndRun();
