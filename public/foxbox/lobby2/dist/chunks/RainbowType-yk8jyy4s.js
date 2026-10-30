import{a as $,b as E,c as L,e as F}from"./main-yv1c953r.js";import{C as j,H as v,J,K as _}from"./main-csjpdy0q.js";var n=j(v(),1);if(typeof document<"u"){let h=document.createElement("style");h.dataset.src="rainbow-type/RainbowType.css",h.textContent=`.animated-rainbow-type {
  position: relative;
  margin: 0 auto;
  display: flex;
  max-width: fit-content;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-radius: 1.25rem;
  font-weight: 500;
  backdrop-filter: blur(10px);
  transition: box-shadow 0.5s ease-out;
  overflow: hidden;
  cursor: pointer;
}

.animated-rainbow-type.with-border {
  padding: 0.35rem 0.75rem;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  z-index: 0;
  pointer-events: none;
}

.gradient-overlay::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  border-radius: inherit;
  width: calc(100% - 2px);
  height: calc(100% - 2px);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background-color: #120F17;
  z-index: -1;
}

.text-content {
  display: inline-block;
  position: relative;
  z-index: 2;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}
`,document.head.appendChild(h)}function M({children:h,className:V="",colors:K=["#5227FF","#FF9FFC","#B497CF"],animationSpeed:Q=8,showBorder:U=!1,direction:t="horizontal",pauseOnHover:k=!1,yoyo:W=!0}){let[d,X]=n.useState(!1),x=$(0),q=n.useRef(0),z=n.useRef(null),w=Q*1000;L((b)=>{if(d){z.current=null;return}if(z.current===null){z.current=b;return}let N=b-z.current;if(z.current=b,q.current+=N,W){let g=w*2,G=q.current%g;if(G<w)x.set(G/w*100);else x.set(100-(G-w)/w*100)}else x.set(q.current/w*100)}),n.useEffect(()=>{q.current=0,x.set(0)},[Q,x,W]);let Y=E(x,(b)=>{if(t==="horizontal")return`${b}% 50%`;else if(t==="vertical")return`50% ${b}%`;else return`${b}% 50%`}),f=n.useCallback(()=>{if(k)X(!0)},[k]),A=n.useCallback(()=>{if(k)X(!1)},[k]),C=t==="horizontal"?"to right":t==="vertical"?"to bottom":"to bottom right",I=[...K,K[0]].join(", "),Z={backgroundImage:`linear-gradient(${C}, ${I})`,backgroundSize:t==="horizontal"?"300% 100%":t==="vertical"?"100% 300%":"300% 300%",backgroundRepeat:"repeat"};return _(F.div,{className:`animated-rainbow-type ${U?"with-border":""} ${V}`,onMouseEnter:f,onMouseLeave:A,children:[U&&J(F.div,{className:"gradient-overlay",style:{...Z,backgroundPosition:Y}}),J(F.div,{className:"text-content",style:{...Z,backgroundPosition:Y},children:h})]})}export{M as default};
