function m(){let n=0;const e=document.createElement("div");return e.setAttribute("style",`   position: absolute;
        top: 0;
        left: 0;
        color: white;
        font-size: 24px;
        pointer-events: none;
    `),document.body.appendChild(e),setInterval(()=>{e.innerText=`FPS: ${n}`,n=0},1e3),()=>{n++}}function h(n,e){let i=e?.theta??0,r=e?.phi??0,s=e?.radius??0,o=!1,d,u;document.addEventListener("mousedown",t=>{o=!0,d=t.clientX,u=t.clientY}),document.addEventListener("mouseup",()=>{o=!1}),document.addEventListener("mousemove",t=>{if(!o)return;const l=(d-t.clientX)*window.devicePixelRatio/n.width,c=(u-t.clientY)*window.devicePixelRatio/n.height;i=2*l*Math.PI*2,r=2*c*Math.PI*2}),document.addEventListener("wheel",t=>{s+=t.deltaY*.001});function a(){return{theta:i,phi:r,radius:s}}return{getTargets:a}}export{m as f,h as m};
