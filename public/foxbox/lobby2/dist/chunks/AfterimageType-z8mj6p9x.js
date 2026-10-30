import{E as ye,J as ge,L,M as Z}from"./main-jpng9c0t.js";var a=ye(ge(),1);if(typeof document<"u"){let t=document.createElement("style");t.dataset.src="afterimage-type/AfterimageType.css",t.textContent=`.afterimage-type {
  position: relative;
  display: inline-block;
  white-space: nowrap;
  line-height: 0.9;
  letter-spacing: -0.04em;
  user-select: none;
  contain: layout style;
  font-kerning: normal;
  text-rendering: geometricPrecision;
}

.afterimage-type__echo {
  position: absolute;
  inset: 0;
  display: block;
  pointer-events: none;
  transform: translate3d(0, 0, 0);
  transform-origin: 50% 50%;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.afterimage-type__echo--front {
  position: relative;
  z-index: 2;
  opacity: 1;
  filter: none;
  text-shadow: 0 0.035em 0 rgba(255, 255, 255, 0.04);
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .afterimage-type__echo:not(.afterimage-type__echo--front) {
    display: none;
  }

  .afterimage-type__echo--front {
    transform: none !important;
  }
}
`,document.head.appendChild(t)}var s=(t,X,v)=>Math.min(Math.max(t,X),v),U={right:{x:1,y:0},left:{x:-1,y:0},up:{x:0,y:-1},down:{x:0,y:1},diagonal:{x:0.72,y:0.72}},W={linear:(t)=>t,"ease-out":(t)=>1-Math.pow(1-t,3),"ease-in-out":(t)=>t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,snappy:(t)=>1-Math.pow(1-t,5)},ve=({text:t="Motion Echo",echoes:X=12,lag:v=0.24,offset:$=36,direction:P="right",fade:k=0.72,blur:C=3,tint:S="#7dd3fc",mode:h="both",cursorRadius:q=320,duration:B=900,ease:V="ease-out",fontSize:j="clamp(3rem, 9vw, 7rem)",fontWeight:ee=800,color:Y="#f8fafc",className:te="",style:ne})=>{let z=a.useRef(null),M=a.useRef([]),m=a.useRef(null),y=a.useRef(null),[A,re]=a.useState(!1),p=A?0:s(Math.round(X),0,24),oe=a.useMemo(()=>Array.from({length:p+1},(n,o)=>o),[p]);a.useEffect(()=>{if(typeof window>"u"||!window.matchMedia)return;let n=window.matchMedia("(prefers-reduced-motion: reduce)"),o=()=>re(n.matches);return o(),n.addEventListener?.("change",o),()=>n.removeEventListener?.("change",o)},[]),a.useEffect(()=>{let n=z.current;if(!n||A)return;let o=U[P]||U.right,f=s(Number($)||0,0,120),ie=s(Number(q)||320,40,1200),se=s(Number(v)||0.16,0.02,0.5),ce=s(Number(k)||0.64,0.1,0.95),D=s(Number(C)||0,0,16),H=Math.max(0,Number(B)||0),le=W[V]||W["ease-out"],w=h==="entrance"||h==="both",de=h==="pointer"||h==="both",pe=Array.from({length:p+1},(c,e)=>{let i=w?f*(e+0.35):0;return{x:o.x*i,y:o.y*i}});y.current={targetX:0,targetY:0,lastTargetX:0,lastTargetY:0,activity:w?1:0,positions:pe,startTime:performance.now()};let E=!1,I=()=>{};if(de&&window.matchMedia)E=window.matchMedia("(hover: hover) and (pointer: fine)").matches;let O=(c)=>{let e=y.current;if(!e)return;let i=n.getBoundingClientRect();if(!i.width||!i.height)return;let x=i.left+i.width/2,T=i.top+i.height/2,g=c.clientX-x,b=c.clientY-T,l=Math.hypot(g,b),_=l>0?s(l/ie,0,1):0,F=l>0?g/l:0,N=l>0?b/l:0;e.targetX=F*_*f,e.targetY=N*_*f*0.72},G=()=>{let c=y.current;if(!c)return;c.targetX=0,c.targetY=0};if(E)window.addEventListener("pointermove",O,{passive:!0}),document.addEventListener("pointerleave",G),I=()=>{window.removeEventListener("pointermove",O),document.removeEventListener("pointerleave",G)};let J=(c)=>{let e=y.current;if(!e)return;let i=c-e.startTime,x=w&&H>0?s(i/H,0,1):1,T=le(x),g=w?1-T:0,b=Math.hypot(e.targetX-e.lastTargetX,e.targetY-e.lastTargetY);e.lastTargetX=e.targetX,e.lastTargetY=e.targetY;let l=0;for(let r=0;r<=p;r+=1){let u=M.current[r],d=e.positions[r];if(!u||!d)continue;let K=g*f*(r+0.35),fe=e.targetX+o.x*K,me=e.targetY+o.y*K,Q=s(0.34/(1+r*se*4.2),0.018,0.36);if(d.x+=(fe-d.x)*Q,d.y+=(me-d.y)*Q,u.style.transform=`translate3d(${d.x.toFixed(3)}px, ${d.y.toFixed(3)}px, 0)`,r>0){let R=e.positions[0],ue=R?Math.hypot(d.x-R.x,d.y-R.y):0;l=Math.max(l,ue);let he=p?r/p:0;u.style.filter=D>0?`blur(${(D*he).toFixed(2)}px)`:"none"}}let _=f>0?s(l/(f*2.25),0,1):0,F=f>0?s(b/(f*0.35),0,1):0,N=Math.max(g,_,F);e.activity+=(N-e.activity)*0.18;for(let r=1;r<=p;r+=1){let u=M.current[r];if(!u)continue;u.style.opacity=String(Math.pow(ce,r)*e.activity)}if(e.activity>0.002||Math.abs(e.targetX)>0.01||Math.abs(e.targetY)>0.01||x<1||E)m.current=requestAnimationFrame(J);else m.current=null};return m.current=requestAnimationFrame(J),()=>{if(I(),m.current)cancelAnimationFrame(m.current);m.current=null,y.current=null}},[C,q,P,B,V,p,k,v,h,$,A]);let ae={fontSize:j,fontWeight:ee,color:Y,...ne};return Z("span",{ref:z,className:`afterimage-type ${te}`.trim(),style:ae,children:[oe.slice(1).reverse().map((n)=>L("span",{"aria-hidden":"true",className:"afterimage-type__echo","data-echo-index":n,ref:(o)=>{M.current[n]=o},style:{color:S?`color-mix(in srgb, ${S} ${Math.min(72,18+n*5)}%, ${Y})`:Y,opacity:0},children:t},`echo-${n}`)),L("span",{className:"afterimage-type__echo afterimage-type__echo--front","data-echo-index":"0",ref:(n)=>{M.current[0]=n},children:t})]})},be=ve;export{be as default};
