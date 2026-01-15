import{R as d}from"./ReTina.CUjPK151.js";import{i as x,g as v,l as g,a as y,c as p}from"./index.CSW1phrM.js";const l=100,r=new d({transparent:!0,texs:[{width:l,height:1}],functions:`
    fn unpack(h: f32, l: f32) -> f32 {
      // Reconstruct 16-bit value from two 8-bit normalized floats
      // h is high byte/255, l is low byte/255
      let high = h * 255.0;
      let low = l * 255.0;
      let val16 = high * 256.0 + low;
      return val16 / 65535.0;
    }

    fn circle(uv: vec2f, center: vec2f, radius: f32) -> f32 {
        let d = length(uv - center);
        return 1.0 - smoothstep(radius, radius + 2.0, d);
    }
  `,main:`
    let xy = uv * vec2f(U.width, U.height);
    var color = vec4f(0); // Background

    // Draw other ants
    let count = i32(U.antCount);
    for (var i: i32 = 0; i < count; i++) {
        // Load packed position from texture
        // Texture is 100x1
        let texVal = textureLoad(tex0, vec2<i32>(i, 0), 0);
        let ax = unpack(texVal.r, texVal.g);
        let ay = unpack(texVal.b, texVal.a);
        let pos = vec2f(ax, ay) * vec2f(U.width, U.height);

        // Simple visual for ant: Circle
        // Different color based on ID/Index? We don't have ID in texture, just index.
        let hue = f32(i) / f32(10.0);
        let antColor = hsv2rgb(vec3f(hue, 0.8, 0.9));
        let c = circle(xy, pos, 15.0);
        color = mix(color, vec4f(antColor, 1), c);
    }

    // Draw local mouse (white ring)
    let mousePos = vec2f(U.mouseX, U.mouseY);
    let m = circle(xy, mousePos, 10.0) - circle(xy, mousePos, 8.0); 
    color = mix(color, vec4f(1, 0, 0, 1), max(0.0, m));

    return color;
  `}),w=r.registerUniform("mouseX"),U=r.registerUniform("mouseY"),b=r.registerUniform("antCount");function u(i){const n=Math.max(0,Math.min(1,i))*65535,o=Math.floor(n/256),t=Math.floor(n%256);return[o,t]}r.start({onBuild(){x();const i=v();g(n=>{const o=n.filter(e=>e.id&&e.id!==i&&typeof e.x=="number"&&typeof e.y=="number");b(o.length);const t=new Uint8Array(l*4);o.forEach((e,c)=>{if(c>=l)return;const[a,f]=u(e.x),[h,m]=u(e.y),s=c*4;t[s]=a,t[s+1]=f,t[s+2]=h,t[s+3]=m}),r.setTex(0,t)}),document.addEventListener("mousemove",n=>{const o=r.canvas.getBoundingClientRect(),t=n.clientX-o.left,e=n.clientY-o.top;w(t),U(e);const c=t/o.width,a=e/o.height;y({id:i,x:c,y:a})}),window.addEventListener("beforeunload",()=>{p()})}});
