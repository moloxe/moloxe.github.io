function n(){let e=0;const t=document.createElement("div");return t.setAttribute("style",`   position: absolute;
        top: 0;
        left: 0;
        color: white;
        font-size: 24px;
        pointer-events: none;
    `),document.body.appendChild(t),setInterval(()=>{t.innerText=`FPS: ${e}`,e=0},1e3),()=>{e++}}export{n as f};
