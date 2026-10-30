import{a as m,b as v}from"./main-fbza8rfr.js";import{E as L,J as V,L as s,M as T}from"./main-jpng9c0t.js";var p=L(V(),1);if(typeof document<"u"){let n=document.createElement("style");n.dataset.src="origami-type/OrigamiType.css",n.textContent=`.origami-type {
  display: inline-block;
  color: var(--origami-type-color, currentColor);
  font-size: var(--origami-type-font-size, inherit);
  font-weight: var(--origami-type-font-weight, inherit);
  line-height: 0.95;
  letter-spacing: -0.04em;
  white-space: pre-wrap;
  user-select: text;
}

.origami-type-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.origami-type-visual {
  display: inline;
}

.origami-type-line {
  display: block;
}

.origami-type-whitespace {
  display: inline;
}

.origami-type-segment {
  display: inline-block;
  line-height: inherit;
  perspective: var(--fold-perspective, 700px);
  transform-style: preserve-3d;
  vertical-align: baseline;
}

.origami-type-segment[data-fold-split='line'] {
  display: block;
}

.origami-type-piece {
  position: relative;
  display: inline-block;
  color: inherit;
  line-height: inherit;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  will-change: transform, opacity;
}

.origami-type-piece::after {
  content: '';
  position: absolute;
  inset: -0.08em -0.02em;
  pointer-events: none;
  opacity: var(--fold-crease, 0);
  mix-blend-mode: multiply;
  border-radius: 0.08em;
}

.origami-type-piece[data-fold-hinge='top']::after {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.58) 0%, rgba(0, 0, 0, 0.22) 42%, rgba(255, 255, 255, 0.26) 100%);
}

.origami-type-piece[data-fold-hinge='bottom']::after {
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.58) 0%, rgba(0, 0, 0, 0.22) 42%, rgba(255, 255, 255, 0.26) 100%);
}

.origami-type-piece[data-fold-hinge='left']::after {
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.58) 0%, rgba(0, 0, 0, 0.22) 42%, rgba(255, 255, 255, 0.26) 100%);
}

.origami-type-piece[data-fold-hinge='right']::after {
  background: linear-gradient(270deg, rgba(0, 0, 0, 0.58) 0%, rgba(0, 0, 0, 0.22) 42%, rgba(255, 255, 255, 0.26) 100%);
}

@media (prefers-reduced-motion: reduce) {
  .origami-type-piece {
    transform: none !important;
  }

  .origami-type-piece::after {
    opacity: 0 !important;
  }
}
`,document.head.appendChild(n)}m.registerPlugin(v);var O={top:{origin:"50% 0%",rotateX:-92,rotateY:0},bottom:{origin:"50% 100%",rotateX:92,rotateY:0},left:{origin:"0% 50%",rotateX:0,rotateY:92},right:{origin:"100% 50%",rotateX:0,rotateY:-92}},q=(n,t,i)=>Math.min(i,Math.max(t,n)),z=(n,t)=>n.split(/(\n)/).map((i,c)=>{if(i===`
`)return s("br",{},`${t}-br-${c}`);if(!i)return null;return s("span",{className:"origami-type-whitespace",children:i.replace(/ /g," ")},`${t}-space-${c}`)}),F=({text:n="Design unfolds",splitBy:t="char",hinge:i="top",duration:c=0.65,stagger:y=0.045,ease:w="power3.out",perspective:k=700,creaseShading:E=0.55,trigger:d="mount",fontSize:h=80,fontWeight:D=800,color:I="#f7f2e8",className:P="",style:R={}})=>{let $=p.useRef(null),g=p.useRef(null),o=O[i]||O.top,M=q(E,0,1),N=Math.max(120,k),S=p.useMemo(()=>{let l=0,a=(e,r,b=t)=>{return l+=1,s("span",{className:"origami-type-segment","data-fold-split":b,style:{"--fold-perspective":`${N}px`},children:s("span",{className:"origami-type-piece","data-fold-hinge":i,style:{transformOrigin:o.origin,"--fold-crease":0},children:e||" "})},r)};if(t==="line")return n.split(`
`).map((e,r)=>s("span",{className:"origami-type-line",children:a(e||" ",`segment-line-${r}`,"line")},`line-${r}`));if(t==="word")return n.split(/(\s+)/).flatMap((e,r)=>{if(!e)return[];if(/^\s+$/.test(e))return z(e,`ws-${r}`);return a(e,`segment-word-${l}`)});return Array.from(n).map((e,r)=>{if(e===`
`)return s("br",{},`br-${r}`);return a(e===" "?" ":e,`segment-char-${r}`)})},[n,t,i,o.origin,N]);p.useEffect(()=>{if(typeof window>"u")return;let l=$.current;if(!l)return;let a=Array.from(l.querySelectorAll(".origami-type-piece"));if(!a.length)return;let e=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,r=e?Math.min(c,0.22):c,b=e?Math.min(y,0.02):y,X={opacity:0,rotateX:e?0:o.rotateX,rotateY:e?0:o.rotateY,"--fold-crease":e?0:M,transformOrigin:o.origin,force3D:!0},H={opacity:1,rotateX:0,rotateY:0,"--fold-crease":0,duration:r,ease:e?"power1.out":w,stagger:b,clearProps:"willChange"},Y=()=>{g.current?.kill(),g.current=null,m.killTweensOf(a)},f=(C)=>{return Y(),g.current=m.timeline({repeat:C?-1:0,repeatDelay:C?0.75:0}),g.current.fromTo(a,X,H),g.current},A,u;if(d==="hover")m.set(a,{opacity:1,rotateX:0,rotateY:0,"--fold-crease":0,transformOrigin:o.origin}),u=()=>f(!1),l.addEventListener("mouseenter",u);else if(d==="scroll")m.set(a,X),A=v.create({trigger:l,start:"top 82%",once:!0,onEnter:()=>f(!1)});else if(d==="loop")f(!0);else f(!1);return()=>{if(u)l.removeEventListener("mouseenter",u);A?.kill(),Y()}},[n,t,i,c,y,w,k,M,d,o.origin,o.rotateX,o.rotateY]);let G={"--origami-type-font-size":typeof h==="number"?`${h}px`:h,"--origami-type-font-weight":D,"--origami-type-color":I,...R};return T("span",{ref:$,className:`origami-type ${P}`.trim(),style:G,children:[s("span",{className:"origami-type-sr-only",children:n}),s("span",{className:"origami-type-visual","aria-hidden":"true",children:S})]})},Q=F;export{Q as default};
