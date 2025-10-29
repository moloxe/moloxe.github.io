import{R as e}from"./ReTina.DegRo32d.js";import{f as t}from"./freeControls.BVGVdC3g.js";const r=new e({height:600,useInterlacing:!0,showFps:!0});r.registerMaterial({sdFunc:`
    var thres = length(pos) - 1.2;
    var power = 6 + 4 * sin(U.time * 0.1);
    var z = pos;
    var c = pos;
    var dr = 1.0;
    var r = 0.0;
    for (var i: i32 = 0; i < 16; i++) {
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
    let lightPos = toCartesian(vec3f(2, toSpherical(ro).yz));
    let hue = toSpherical(pos).y + U.time * 0.2;
    let diffuseColor = hsv2rgb(vec3f(hue, 0.5, 1));
    let lightColor = hsv2rgb(vec3f(0.2));
    let light = blinnPhong(
      // Environment
      rd, normal, /* minBright */ 0,
      // Material
      pos, diffuseColor, /* shininess */ 128,
      // Light
      lightPos, lightColor, /* power */ 8,
    );
    return vec4f(light, 1.);
  `});r.camera={fov:60,pos:{x:.6,y:.8,z:1.5},spherical:{phi:-.5,radius:0,theta:.4}};t(r);await r.buildAndRun();
