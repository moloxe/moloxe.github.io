import{j as e}from"./jsx-runtime.7faW4zRM.js";import{r as c}from"./index.DhYZZe0J.js";const d=({photos:l})=>{const[r,t]=c.useState(0);function o(a){t(a)}return e.jsxs("div",{className:`photo-gallery relative grid overflow-hidden ${l.length>1?"grid-rows-[1fr_auto]":""}`,children:[l.length>1&&e.jsx("div",{className:"z-10 flex overflow-x-auto bg-[#000a]",children:e.jsx("div",{className:"flex",children:l.map((a,s)=>e.jsx("button",{className:`
                  flex overflow-hidden w-40 h-40
                  ${r===s?"border-2 border-white":""}
                `,onClick:()=>o(s),children:e.jsx("img",{className:`
                    flex h-full w-full object-cover
                    transition duration-300 ease-in-out scale-110 hover:scale-100
                  `,draggable:"false",src:a,alt:a+" option to select"})},a))})}),e.jsx("img",{className:"absolute z-0 top-0 flex h-full w-full aspect-[4/3] object-cover blur-lg",src:l[r],alt:"blured cover"}),e.jsx("div",{className:"z-10 overflow-hidden",children:e.jsx("img",{className:"flex h-auto w-full aspect-[4/3] object-contain transition duration-300 ease-in-out",src:l[r],alt:"product"})})]})};export{d as default};
