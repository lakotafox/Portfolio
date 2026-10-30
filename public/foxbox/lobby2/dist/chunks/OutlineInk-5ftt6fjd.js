import{f as t,g as T}from"./main-nsb57ycz.js";import{C as J,H as K,J as l,K as U}from"./main-csjpdy0q.js";var n=J(K(),1);if(typeof document<"u"){let u=document.createElement("style");u.dataset.src="outline-ink/OutlineInk.css",u.textContent=`.outline-ink {
  display: block;
  width: 100%;
  line-height: 0;
}

.outline-ink--hover {
  cursor: pointer;
}

.outline-ink__svg {
  display: block;
  width: 100%;
  height: var(--outline-ink-height, 160px);
}

.outline-ink__stroke,
.outline-ink__fill {
  user-select: none;
}
`,document.head.appendChild(u)}if(typeof window<"u")t.registerPlugin(T);var Q="Draw Attention",V=({text:u=Q,strokeColor:q="#A78BFA",fillColor:S="#F8FAFC",strokeWidth:$=1.4,drawDuration:y=1.6,fillDelay:_=0.2,stagger:v=0.05,ease:M="power2.out",trigger:k="mount",fillMode:m="wipe",fontSize:a=128,fontWeight:b=800,letterSpacing:A=-4,reverse:O=!1,className:H="",style:X={}})=>{let R=n.useRef(null),w=n.useRef(null),B=n.useRef(null),[o,Y]=n.useState(null),I=`outline-ink-wipe-${n.useId().replace(/[^a-zA-Z0-9_-]/g,"")}`,E=n.useMemo(()=>Array.from(String(u??"")),[u]),g=Math.max(a*7,200),L=n.useMemo(()=>({fontSize:`${a}px`,fontWeight:b,letterSpacing:`${A}px`}),[a,b,A]);n.useLayoutEffect(()=>{if(!w.current)return;let r=!1,d=()=>{if(r||!w.current)return;let e;try{e=w.current.getBBox()}catch{return}if(!e||!e.width)return;let s=Math.max(Number($)||1,a*0.1),h={x:e.x-s,y:e.y-s,width:e.width+s*2,height:e.height+s*2};Y((c)=>c&&Math.abs(c.x-h.x)<0.5&&Math.abs(c.width-h.width)<0.5&&Math.abs(c.y-h.y)<0.5?c:h)};if(d(),typeof document<"u"&&document.fonts?.ready)document.fonts.ready.then(d).catch(()=>{});return()=>{r=!0}},[E,a,b,A,$]),n.useEffect(()=>{let i=R.current;if(typeof window>"u"||!i||!o)return;let r=t.utils.toArray(i.querySelectorAll("[data-stroke-char]")),d=t.utils.toArray(i.querySelectorAll("[data-fill-char]")),e=B.current;if(!r.length)return;let s=m!=="none",h=s&&m==="wipe",c=Math.max(0.4,y*0.5),F=O?{each:v,from:"end"}:v,x=[...r,...d,e].filter(Boolean),G=()=>{if(t.killTweensOf(x),t.set(r,{strokeDasharray:g,strokeDashoffset:g}),t.set(d,{opacity:h?1:0}),e)t.set(e,{attr:{width:0}})},N=()=>{if(t.killTweensOf(x),t.set(r,{strokeDasharray:g,strokeDashoffset:0}),t.set(d,{opacity:s?1:0}),e)t.set(e,{attr:{width:s?o.width:0}})};if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return N(),()=>t.killTweensOf(x);let P=()=>{G();let p=t.timeline({paused:!0,repeat:k==="loop"?-1:0,repeatDelay:k==="loop"?0.9:0,defaults:{overwrite:"auto"}});if(p.to(r,{strokeDashoffset:0,duration:y,ease:M,stagger:F},0),h&&e)p.to(e,{attr:{width:o.width},duration:c,ease:"power2.inOut"},y+_);else if(s)p.to(d,{opacity:1,duration:c,ease:"power2.out",stagger:F},y+_);return p},f=null,C=null,D=null;if(k==="hover"){N();let p=()=>{f?.kill(),f=P(),f.play(0)};i.addEventListener("pointerenter",p),D=()=>i.removeEventListener("pointerenter",p)}else if(f=P(),k==="scroll")C=T.create({trigger:i,start:"top 82%",once:!0,onEnter:()=>f?.play(0)});else f.play(0);return()=>{D?.(),C?.kill(),f?.kill(),t.killTweensOf(x)}},[o,g,y,_,v,M,k,m,O]);let Z=o?`${o.x} ${o.y} ${o.width} ${o.height}`:`0 ${-a} 600 ${a*1.3}`;return l("span",{ref:R,className:`outline-ink ${k==="hover"?"outline-ink--hover":""} ${H}`.trim(),style:{...X,"--outline-ink-height":`${Math.round(a*1.3)}px`},role:"img","aria-label":String(u??""),children:U("svg",{className:"outline-ink__svg",viewBox:Z,preserveAspectRatio:"xMidYMid meet","aria-hidden":"true",children:[m==="wipe"&&o&&l("defs",{children:l("clipPath",{id:I,clipPathUnits:"userSpaceOnUse",children:l("rect",{ref:B,x:o.x,y:o.y,width:"0",height:o.height})})}),l("text",{ref:w,className:"outline-ink__stroke",x:"0",y:"0",fill:"none",stroke:q,strokeWidth:$,strokeLinejoin:"round",strokeLinecap:"round",style:L,children:E.map((i,r)=>l("tspan",{"data-stroke-char":!0,children:i},`s-${r}`))}),l("text",{className:"outline-ink__fill",x:"0",y:"0",fill:S,stroke:"none",style:L,clipPath:m==="wipe"&&o?`url(#${I})`:void 0,children:E.map((i,r)=>l("tspan",{"data-fill-char":!0,children:i},`f-${r}`))})]})})},oe=V;export{oe as default};
