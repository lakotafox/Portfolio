import{C as V,H as W,J as _,K as Y}from"./main-csjpdy0q.js";var a=V(W(),1);if(typeof document<"u"){let e=document.createElement("style");e.dataset.src="extruded-type/ExtrudedType.css",e.textContent=`.extruded-type {
  display: inline-block;
  perspective: var(--extruded-type-perspective);
  perspective-origin: 50% 48%;
  isolation: isolate;
}

.extruded-type__stage {
  position: relative;
  display: inline-grid;
  place-items: center;
  transform-style: preserve-3d;
  transform: rotateX(-2.4deg) rotateY(3.15deg);
  transform-origin: 50% 50%;
  will-change: transform;
}

.extruded-type__layer,
.extruded-type__face {
  grid-area: 1 / 1;
  display: inline-block;
  font-size: var(--extruded-type-font-size);
  font-weight: var(--extruded-type-font-weight);
  line-height: 0.86;
  letter-spacing: -0.065em;
  white-space: nowrap;
  user-select: none;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  font-kerning: normal;
  text-rendering: geometricPrecision;
}

.extruded-type__layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  filter: saturate(0.95) brightness(0.92);
  pointer-events: none;
}

.extruded-type__face {
  position: relative;
  z-index: 1;
  color: var(--extruded-type-face-color);
  text-shadow: var(--extruded-type-shadow);
  transform: translateZ(0.6px);
}

@media (hover: hover) and (pointer: fine) {
  .extruded-type {
    cursor: default;
  }
}

@media (prefers-reduced-motion: reduce) {
  .extruded-type__stage {
    will-change: auto;
  }
}
`,document.head.appendChild(e)}var C=64,s=(e,i,f)=>Math.min(Math.max(e,i),f),j=(e,i,f,p)=>{let d=p<=1?1:f/p,M=d*d,y=Math.round((1-M)*72+4);return`color-mix(in srgb, ${e} ${y}%, ${i})`},X=(e,i)=>`rotateX(${e.toFixed(3)}deg) rotateY(${i.toFixed(3)}deg)`,ee=({text:e="Elevate",layers:i=34,depth:f=2.4,faceColor:p="#f8fafc",depthColor:d="#7c3aed",tilt:M=7.5,pointerTracking:y=!0,smoothing:q=0.14,perspective:I=900,autoOrbit:$=!0,orbitSpeed:Z=0.35,fontSize:B="clamp(3rem, 12vw, 7rem)",fontWeight:D=900,shadow:G=!0,className:H="",style:J={}})=>{let P=a.useRef(null),k=a.useRef(null),x=s(Math.round(Number(i)||1),2,C),A=s(Number(f)||0,0,12),r=s(Number(M)||0,0,12),E=s(Number(q)||0.14,0.02,0.35),K=s(Number(I)||900,300,2000),R=s(Number(Z)||0,0,2),t=a.useMemo(()=>({x:-r*0.32,y:r*0.42}),[r]),O=a.useMemo(()=>Array.from({length:x},(c,m)=>{let l=x-m;return{index:l,color:j(p,d,l,x),transform:`translateZ(${-l*A}px)`}}),[x,A,p,d]);a.useEffect(()=>{let c=P.current,m=k.current;if(!c||!m||typeof window>"u")return;let l=window.matchMedia("(prefers-reduced-motion: reduce)").matches,U=window.matchMedia("(hover: hover) and (pointer: fine)").matches,h=y&&U&&!l,L=0,N=!1,T=performance.now(),u={...t},o={...t},z=()=>{m.style.transform=X(u.x,u.y)};if(l){m.style.transform=X(t.x,t.y);return}let F=(v)=>{let n=c.getBoundingClientRect();if(!n.width||!n.height)return;N=!0;let w=s((v.clientX-(n.left+n.width/2))/(n.width*0.8),-1,1),b=s((v.clientY-(n.top+n.height/2))/(n.height*0.8),-1,1);o.x=t.x-b*r,o.y=t.y+w*r},g=()=>{N=!1,o.x=t.x,o.y=t.y};if(h)window.addEventListener("pointermove",F),window.addEventListener("pointerleave",g),window.addEventListener("blur",g);let S=(v)=>{if((!h||!N)&&$){let w=(v-T)/1000*R*Math.PI*2,b=h?0.18:0.55;o.x=t.x+Math.sin(w)*r*b,o.y=t.y+Math.cos(w*0.85)*r*b}u.x+=(o.x-u.x)*E,u.y+=(o.y-u.y)*E,z(),L=requestAnimationFrame(S)};return z(),L=requestAnimationFrame(S),()=>{if(h)window.removeEventListener("pointermove",F),window.removeEventListener("pointerleave",g),window.removeEventListener("blur",g);cancelAnimationFrame(L),T=0}},[$,t,y,R,E,r]);let Q={...J,"--extruded-type-perspective":`${K}px`,"--extruded-type-font-size":B,"--extruded-type-font-weight":D,"--extruded-type-face-color":p,"--extruded-type-depth-color":d,"--extruded-type-shadow":G?`0 22px 34px color-mix(in srgb, ${d} 36%, transparent), 0 4px 8px rgba(0, 0, 0, 0.28)`:"none"};return _("span",{ref:P,className:`extruded-type ${H}`.trim(),style:Q,children:Y("span",{ref:k,className:"extruded-type__stage",children:[O.map((c)=>_("span",{"aria-hidden":"true",className:"extruded-type__layer",style:{color:c.color,transform:c.transform},children:e},c.index)),_("span",{className:"extruded-type__face",children:e})]})})},re=ee;export{re as default};
