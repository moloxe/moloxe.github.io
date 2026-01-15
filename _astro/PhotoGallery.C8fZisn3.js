import{u as e}from"./jsxRuntime.module.3hPXG6Fr.js";import{d as i}from"./hooks.module.WNmjjaza.js";import"./preact.module.D9mvYqus.js";const f=({photos:l})=>{const[o,t]=i(0);function c(a){t(a)}return e("div",{className:`photo-gallery relative grid overflow-hidden ${l.length>1?"grid-rows-[1fr_auto]":""}`,children:[l.length>1&&e("div",{className:"z-10 flex overflow-x-auto bg-[#000a]",children:e("div",{className:"flex",children:l.map((a,r)=>e("button",{className:`
                  flex overflow-hidden w-40 h-40
                  ${o===r?"border-2 border-white":""}
                `,onClick:()=>c(r),children:e("img",{className:`
                    flex h-full w-full object-cover
                    transition duration-300 ease-in-out scale-110 hover:scale-100
                  `,draggable:!1,src:a,alt:a+" option to select"})},a))})}),e("img",{className:"absolute z-0 top-0 flex h-full w-full aspect-[4/3] object-cover blur-lg",src:l[o],alt:"blured cover"}),e("div",{className:"z-10 overflow-hidden",children:e("img",{className:"flex h-auto w-full aspect-[4/3] object-contain transition duration-300 ease-in-out",src:l[o],alt:"product"})})]})};export{f as default};
