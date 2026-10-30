import{B as c,t as p,u,x as m}from"./main-mznb6j68.js";import{C as B0,H as H0,J as l}from"./main-csjpdy0q.js";var O=B0(H0(),1);if(typeof document<"u"){let H=document.createElement("style");H.dataset.src="nebula-drift/NebulaDrift.css",H.textContent=`.nebula-drift-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
`,document.head.appendChild(H)}var J0=(H)=>{let X=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(H);if(!X)return[1,0.5,0.2];return[parseInt(X[1],16)/255,parseInt(X[2],16)/255,parseInt(X[3],16)/255]},K0=`#version 300 es
precision highp float;
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`,W0=60,X0=(H)=>{return`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uCustomColor;
uniform float uUseCustomColor;
uniform float uSpeed;
uniform float uDirection;
uniform float uScale;   
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseInteractive;
uniform float uQuality;
uniform float uStepScale;
out vec4 fragColor;

void mainImage(out vec4 o, vec2 C) {
  vec2 center = iResolution.xy * 0.5;
  C = (C - center) / uScale + center;
  
  vec2 mouseOffset = (uMouse - center) * 0.0002;
  C += mouseOffset * length(C - center) * step(0.5, uMouseInteractive);
  
  float i, d, z, T = iTime * uSpeed * uDirection;
  vec3 O, p, S;

  for (vec2 r = iResolution.xy, Q; ++i < 60.0; O += o.w/d*o.xyz) {
    p = z*normalize(vec3(C-.5*r,r.y)); 
    p.z -= 4.; 
    S = p;
    d = p.y-T;
    
    p.x += .4*(1.+p.y)*sin(d + p.x*0.1)*cos(.34*d + p.x*0.05); 
    Q = p.xz *= mat2(cos(p.y+vec4(0,11,33,0)-T)); 
    z += d = (abs(sqrt(length(Q*Q)) - .25*(5.+S.y))/3.+8e-4) * uStepScale;
    o = 1.+sin(S.y+p.z*.5+S.z-length(S-p)+vec4(2,1,0,8));
    if (i >= uQuality) break;
  }
  
  o.xyz = tanh(O/1e4);
}

bool finite1(float x){ return !(isnan(x) || isinf(x)); }
vec3 sanitize(vec3 c){
  return vec3(
    finite1(c.r) ? c.r : 0.0,
    finite1(c.g) ? c.g : 0.0,
    finite1(c.b) ? c.b : 0.0
  );
}

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  vec3 rgb = sanitize(o.rgb);
  
  float intensity = (rgb.r + rgb.g + rgb.b) / 3.0;
  vec3 customColor = intensity * uCustomColor;
  vec3 finalColor = mix(rgb, customColor, step(0.5, uUseCustomColor));
  
  float alpha = length(rgb) * uOpacity;
  fragColor = vec4(finalColor, alpha);
}`},Z0=({color:H="#ffffff",speed:X=1,direction:D="forward",scale:S=1,opacity:F=1,mouseInteractive:Q=!0,renderScale:y=0.55,maxDpr:I=1.5,targetFps:M=60,iterations:A=60})=>{let C=O.useRef(null),P=O.useRef({x:0,y:0}),N=O.useRef(null);return O.useEffect(()=>{if(!C.current)return;let W=C.current,U=typeof window<"u"&&window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,n=H?1:0,s=H?J0(H):[1,1,1],i=D==="reverse"?-1:1,Y;try{Y=new u({webgl:2,alpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,I)})}catch{return}let Z=Y.gl;if(!Z)return;let J=Z.canvas;J.style.display="block",J.style.width="100%",J.style.height="100%",W.appendChild(J);let a=new c(Z),$=new p(Z,{vertex:K0,fragment:X0(A),uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uCustomColor:{value:new Float32Array(s)},uUseCustomColor:{value:n},uSpeed:{value:X*0.4},uDirection:{value:i},uScale:{value:S},uOpacity:{value:F},uMouse:{value:new Float32Array([0,0])},uMouseInteractive:{value:Q?1:0},uQuality:{value:A},uStepScale:{value:W0/A}}}),R=new m(Z,{geometry:a,program:$}),V=(q)=>{if(!Q)return;let K=W.getBoundingClientRect();N.current={x:q.clientX-K.left,y:q.clientY-K.top}};if(Q)W.addEventListener("mousemove",V,{passive:!0});let T=!1,h=()=>{let q=W.getBoundingClientRect(),K=Math.max(1,Math.floor(q.width*y)),w=Math.max(1,Math.floor(q.height*y));Y.setSize(K,w),J.style.width="100%",J.style.height="100%";let z=$.uniforms.iResolution.value;z[0]=Z.drawingBufferWidth,z[1]=Z.drawingBufferHeight},x=new ResizeObserver(()=>{if(T)return;T=!0,requestAnimationFrame(()=>{T=!1,h()})});x.observe(W),h();let B=0,_=!1,k=!0,j=document.visibilityState!=="hidden",t=performance.now(),o=1000/M,E=0,r=()=>{$.uniforms.iTime.value=0,Y.render({scene:R})},G=(q)=>{if(_||!k||!j)return;if(q-E<o){B=requestAnimationFrame(G);return}if(E=q,N.current){P.current=N.current,N.current=null;let w=$.uniforms.uMouse.value;w[0]=P.current.x,w[1]=P.current.y}let K=(q-t)*0.001;if(D==="pingpong"){let z=K%10,e=Math.floor(K/10)%2===0,L=z/10,d=L*L*(3-2*L),q0=e?d*10:(1-d)*10;$.uniforms.uDirection.value=1,$.uniforms.iTime.value=q0}else $.uniforms.iTime.value=K;Y.render({scene:R}),B=requestAnimationFrame(G)},b=(q)=>{q.preventDefault(),_=!0,cancelAnimationFrame(B)},v=()=>{if(_=!1,k&&j&&!U)cancelAnimationFrame(B),B=requestAnimationFrame(G)};J.addEventListener("webglcontextlost",b),J.addEventListener("webglcontextrestored",v);let f=new IntersectionObserver(([q])=>{let K=k;if(k=q.isIntersecting,k&&!K&&!_&&j&&!U)cancelAnimationFrame(B),B=requestAnimationFrame(G)},{threshold:0});f.observe(W);let g=()=>{if(j=document.visibilityState!=="hidden",j&&k&&!_&&!U)cancelAnimationFrame(B),E=0,B=requestAnimationFrame(G);else cancelAnimationFrame(B)};if(document.addEventListener("visibilitychange",g),U)r();else B=requestAnimationFrame(G);return()=>{if(cancelAnimationFrame(B),x.disconnect(),f.disconnect(),document.removeEventListener("visibilitychange",g),J.removeEventListener("webglcontextlost",b),J.removeEventListener("webglcontextrestored",v),Q&&W)W.removeEventListener("mousemove",V);try{W?.removeChild(J)}catch{}}},[H,X,D,S,F,Q,y,I,M,A]),l("div",{ref:C,className:"nebula-drift-container"})},O0=Z0;export{O0 as default,Z0 as NebulaDrift};
