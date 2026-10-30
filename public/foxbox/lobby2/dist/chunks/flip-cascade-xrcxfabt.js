import{h as o}from"./main-65kze1qp.js";import{E as k0,J as z0,K as l,L as X,M as H}from"./main-jpng9c0t.js";var w=k0(z0(),1);if(typeof document<"u"){let z=document.createElement("style");z.dataset.src="flip-cascade/flip-cascade.css",z.textContent=`.letter-3d-swap-container {
  position: relative;
  perspective: 1000px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.letter-3d-swap-word {
  display: inline-block;
  transform-style: preserve-3d;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.letter-3d-swap-char-box-item {
  display: inline-block;
  position: relative;
  transform-style: preserve-3d;
  transform: translateZ(-0.5lh);
  transform-origin: center center;
  will-change: transform;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.letter-3d-swap-front-face {
  position: relative;
  height: 1lh;
  display: inline-block;
  transform: translateZ(0.5lh);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: inherit;
}

.letter-3d-swap-back-face {
  position: absolute;
  height: 1lh;
  top: 0;
  left: 0;
  display: inline-block;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: inherit;
}

.letter-3d-swap-space {
  display: inline-block;
  width: 1ch;
  min-width: 1ch;
}

.sr-only {
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
`,document.head.appendChild(z)}var w0=(z)=>{if(typeof Intl<"u"&&"Segmenter"in Intl){let Z=new Intl.Segmenter("en",{granularity:"grapheme"});return Array.from(Z.segment(z),({segment:L})=>L)}return Array.from(z)},D=(z)=>{if(z==null)return"";if(typeof z==="string")return z;if(typeof z==="number")return String(z);if(Array.isArray(z))return z.map(D).join("");if(w.default.isValidElement(z)){let L=z.props.children;if(L!=null)return D(L);return""}},Z0=({char:z,frontFaceClassName:Z="",backFaceClassName:L="",flipDirection:y,blur:Y})=>{let Q=y==="top"?"rotateX(-90deg) translateZ(0.5lh)":"rotateX(90deg) translateZ(0.5lh)",U={filter:Y?"blur(0px)":void 0,opacity:Y?1:void 0},V={transform:Q,filter:Y?"blur(0px)":void 0,opacity:Y?0:void 0};return H("span",{className:"letter-3d-swap-char-box-item",children:[X("span",{className:`letter-3d-swap-front-face ${Z}`,style:U,children:z}),X("span",{className:`letter-3d-swap-back-face ${L}`,style:V,children:z})]})},n=({children:z,as:Z="p",className:L="",frontFaceClassName:y="",backFaceClassName:Y="",staggerInterval:Q=0.05,staggerOrigin:U="first",animation:V={type:"spring",damping:30,stiffness:300},flipDirection:f="top",playOnScroll:G=!1,scrollThreshold:F=0.1,blur:E=!1,blurAmount:h=4,duration:R,onAnimationStart:p,onAnimationComplete:A,respectReducedMotion:t=!0})=>{let[S,I]=w.useState(!1),[O,x]=w.useState(!1),[v,a]=w.useState(!1),[r,W]=o(),C=w.useRef(null),g=r,e=typeof window<"u"?window.matchMedia("(prefers-reduced-motion: reduce)").matches:!1,P=!t||!e,N=f==="top"?"rotateX(90deg)":"rotateX(-90deg)",T=w.useMemo(()=>{try{return D(z)}catch(k){return console.error(k),""}},[z]),b=w.useMemo(()=>{let k=T?.split(" ")??[];return k.map((J,K)=>({characters:w0(J),needsSpace:K!==k.length-1}))},[T]),u=w.useCallback((k,q)=>{let J=q;if(U==="first")return k*Q;if(U==="last")return(J-1-k)*Q;if(U==="center"){let K=Math.floor(J/2);return Math.abs(K-k)*Q}if(U==="random"){let K=Math.floor(Math.random()*J);return Math.abs(K-k)*Q}return Math.abs(U-k)*Q},[U,Q]),M=w.useCallback(async()=>{if(S||!P)return;I(!0),p?.();let k=b.reduce((B,j)=>B+j.characters.length,0),q=Array.from({length:k},(B,j)=>{return u(j,k)}),J=R!==void 0?R:typeof V==="object"&&("duration"in V)?V.duration:0.6,K=0.2,_=0.1,$=Math.min(J*0.1,0.15);if(E)await Promise.all([W(".letter-3d-swap-char-box-item",{transform:N},{...V,delay:(B)=>q[B]}),W(".letter-3d-swap-front-face",{filter:`blur(${h}px)`,opacity:0},{duration:K,ease:"easeOut",delay:(B)=>q[B]}),W(".letter-3d-swap-back-face",{filter:"blur(0px)",opacity:1},{duration:_,ease:"easeIn",delay:(B)=>q[B]+$})]);else await W(".letter-3d-swap-char-box-item",{transform:N},{...V,delay:(B)=>q[B]});if(await W(".letter-3d-swap-char-box-item",{transform:f==="top"?"rotateX(0deg)":"rotateX(0deg)"},{duration:0}),E)await Promise.all([W(".letter-3d-swap-front-face",{filter:"blur(0px)",opacity:1},{duration:0}),W(".letter-3d-swap-back-face",{filter:"blur(0px)",opacity:0},{duration:0})]);I(!1),A?.()},[S,P,b,V,u,N,p,A,E,h,f,R,W]),d=w.useCallback(async()=>{if(O||G)return;x(!0),await M()},[O,G,M]),c=w.useCallback(()=>{x(!1)},[]);w.useEffect(()=>{if(!G||v||!P)return;let k=C.current;if(!k)return;let q=new IntersectionObserver((J)=>{J.forEach((K)=>{if(K.isIntersecting&&!v)a(!0),M()})},{threshold:F});return q.observe(k),()=>{q.disconnect()}},[G,v,F,M,P]);let m=w.useCallback((k)=>{g.current=k,C.current=k},[g]),s=H(l,{children:[X("span",{className:"sr-only",children:T}),b.map((k,q,J)=>{let K=J.slice(0,q).reduce((_,$)=>_+$.characters.length,0);return H("span",{className:"letter-3d-swap-word",children:[k.characters.map((_,$)=>{let B=K+$;return X(Z0,{char:_,frontFaceClassName:y,backFaceClassName:Y,flipDirection:f,blur:E},B)}),k.needsSpace&&X("span",{className:"letter-3d-swap-space",children:" "})]},q)})]}),i=`letter-3d-swap-container ${L}`.trim();if(Z==="p"||Z==="div"||Z==="span"||Z==="h1"||Z==="h2"||Z==="h3"||Z==="h4"||Z==="h5"||Z==="h6")return X(Z,{className:i,onMouseEnter:d,onMouseLeave:c,ref:m,children:s});return X("div",{className:i,onMouseEnter:d,onMouseLeave:c,ref:m,children:s})};n.displayName="FlipCascade";var V0=n;export{V0 as default};
