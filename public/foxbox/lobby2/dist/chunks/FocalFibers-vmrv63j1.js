import{D as ne,v as ee,w as oe,z as te}from"./main-ghsx4cn4.js";import{E as ie,J as le,L as j}from"./main-jpng9c0t.js";var d=ie(le(),1);if(typeof document<"u"){let a=document.createElement("style");a.dataset.src="focal-fibers/FocalFibers.css",a.textContent=`.focal-fibers-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
`,document.head.appendChild(a)}var A=(a)=>{let l=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(a);if(!l)return[1,1,1];return[parseInt(l[1],16)/255,parseInt(l[2],16)/255,parseInt(l[3],16)/255]},se={center:0,left:1,right:2},ce=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,fe=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uThreadCount;
uniform float uFrequency;
uniform float uSpread;
uniform float uTaper;
uniform float uPosition;
uniform float uFanMode;
uniform float uGlow;
uniform float uFalloff;
uniform float uThickness;
uniform float uBrightness;
uniform float uOpacity;
uniform float uMirror;
uniform float uShimmer;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform float uEnableMouse;
uniform float uMouseActive;
out vec4 fragColor;

#define TAU 6.28318530718
#define MAX_THREADS 10

float glow(float x, float str, float dist) {
  return dist / pow(max(x, 1e-4), str);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float n = max(uThreadCount, 1.0);

  float pinchX = uFanMode < 0.5 ? 0.5 : (uFanMode < 1.5 ? 0.0 : 1.0);
  if (uEnableMouse > 0.5) {
    pinchX = mix(pinchX, uMouse.x, clamp(uMouseStrength, 0.0, 1.0) * uMouseActive);
  }

  float spreadDx = uSpread * abs(uv.x - pinchX);
  float baseT = iTime * uSpeed;
  float tauOverN = TAU / n;
  float mirror = uMirror > 0.5 ? sign(pinchX - uv.x) : 1.0;
  bool doShimmer = uShimmer > 0.5;
  float shimmerT = iTime * 1.7;
  float invThickness = 1.0 / max(uThickness, 0.01);
  float xFreq = uv.x * uFrequency;
  float yOff = uv.y - uPosition;
  float ciScale = n > 1.0 ? 1.0 / (n - 1.0) : 0.0;

  vec3 col = vec3(0.0);
  float gsum = 0.0;

  for (int idx = 0; idx < MAX_THREADS; idx++) {
    float i = float(idx);
    if (i >= n) break;

    float amplitude = spreadDx * (1.0 + i * uTaper);
    float shimmer = doShimmer ? sin(shimmerT + i * 1.3) * 0.35 : 0.0;
    float phase = (baseT + i * tauOverN) * mirror + shimmer;

    float sdf = abs(yOff + sin(xFreq + phase) * amplitude) * invThickness;

    float g = glow(sdf, uFalloff, uGlow);
    float ci = i * ciScale;
    vec3 threadCol = mix(uColor1, uColor2, ci);

    col += g * threadCol;
    gsum += g;
  }

  float coreAmt = smoothstep(0.5, 2.2, gsum);
  col = mix(col, uColor3 * gsum, coreAmt * 0.5);

  float bright = uBrightness;
  if (uEnableMouse > 0.5) {
    vec2 md = uv - uMouse;
    float d2 = dot(md, md);
    bright += clamp(uMouseStrength, 0.0, 1.0) * uMouseActive * exp(-d2 * 6.0) * 0.6;
  }
  col *= bright;

  float alpha = clamp(gsum, 0.0, 1.0) * uOpacity;

  vec3 outRgb = col * alpha;

  if (uGrain > 0.5) {
    float gv = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453) - 0.5) * uGrainIntensity;
    outRgb = clamp(outRgb + gv, 0.0, 1.0);
    alpha = clamp(alpha + gv, 0.0, 1.0);
  }

  fragColor = vec4(outRgb, alpha);
}
`,E=new WeakMap,me=({color1:a="#5227FF",color2:l="#FF9FFC",color3:R="#FFFFFF",speed:G=0.2,threadCount:O=6,frequency:L=5,spread:B=0.18,taper:k=1,position:P=0.5,fanMode:X="center",glow:_=0.02,falloff:q=0.6,thickness:I=1.1,brightness:D=0.6,opacity:N=1,mirror:z=!0,shimmer:H=!1,grain:V=!0,grainIntensity:W=0.05,mouseInteraction:F=!0,mouseStrength:b=0.3,className:ue=""})=>{let x=d.useRef(null),g=d.useRef({enabled:!0,strength:0.3});return d.useEffect(()=>{let t=x.current;if(!t)return;let i=new oe({webgl:2,alpha:!0,premultipliedAlpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)}),n=i.gl;n.clearColor(0,0,0,0);let e=n.canvas;e.style.width="100%",e.style.height="100%",e.style.display="block",t.appendChild(e);let h=new ne(n),o=new ee(n,{vertex:ce,fragment:fe,uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uSpeed:{value:0.2},uThreadCount:{value:6},uFrequency:{value:5},uSpread:{value:0.18},uTaper:{value:1},uPosition:{value:0.5},uFanMode:{value:0},uGlow:{value:0.02},uFalloff:{value:0.6},uThickness:{value:1.1},uBrightness:{value:0.6},uOpacity:{value:1},uMirror:{value:1},uShimmer:{value:0},uGrain:{value:1},uGrainIntensity:{value:0.05},uColor1:{value:new Float32Array([1,1,1])},uColor2:{value:new Float32Array([1,1,1])},uColor3:{value:new Float32Array([1,1,1])},uMouse:{value:new Float32Array([0.5,0.5])},uMouseStrength:{value:0.3},uEnableMouse:{value:1},uMouseActive:{value:0}}}),s=new te(n,{geometry:h,program:o});E.set(t,{renderer:i,program:o,mesh:s});let c=()=>{let r=t.getBoundingClientRect(),v=Math.max(1,Math.floor(r.width)),ae=Math.max(1,Math.floor(r.height));i.setSize(v,ae);let Z=o.uniforms.iResolution.value;Z[0]=n.drawingBufferWidth,Z[1]=n.drawingBufferHeight,i.render({scene:s})},f=new ResizeObserver(c);f.observe(t),c();let u=[0.5,0.5],p=[0.5,0.5],y=0,M=0,U=(r)=>{let v=e.getBoundingClientRect();p[0]=(r.clientX-v.left)/v.width,p[1]=1-(r.clientY-v.top)/v.height,M=1},$=()=>{M=1},Y=()=>{M=0};e.addEventListener("mousemove",U),e.addEventListener("mouseenter",$),e.addEventListener("mouseleave",Y);let m=0,w=!0,C=!document.hidden,re=performance.now(),J=(r)=>{o.uniforms.iTime.value=(r-re)*0.001,u[0]+=0.05*(p[0]-u[0]),u[1]+=0.05*(p[1]-u[1]),y+=0.05*(M-y),o.uniforms.uMouse.value[0]=u[0],o.uniforms.uMouse.value[1]=u[1],o.uniforms.uMouseActive.value=y,o.uniforms.uEnableMouse.value=g.current.enabled?1:0,o.uniforms.uMouseStrength.value=g.current.strength,i.render({scene:s}),m=requestAnimationFrame(J)},T=()=>{if(w&&C&&m===0)m=requestAnimationFrame(J)},S=()=>{if(m!==0)cancelAnimationFrame(m),m=0},K=new IntersectionObserver(([r])=>{w=r.isIntersecting,w?T():S()},{threshold:0});K.observe(t);let Q=()=>{C=!document.hidden,C?T():S()};return document.addEventListener("visibilitychange",Q),T(),()=>{S(),f.disconnect(),K.disconnect(),document.removeEventListener("visibilitychange",Q),e.removeEventListener("mousemove",U),e.removeEventListener("mouseenter",$),e.removeEventListener("mouseleave",Y),E.delete(t);try{t.removeChild(e)}catch{}n.getExtension("WEBGL_lose_context")?.loseContext()}},[]),d.useEffect(()=>{let t=x.current;if(!t)return;let i=E.get(t);if(!i)return;let{program:n}=i,e=n.uniforms;e.uSpeed.value=G,e.uThreadCount.value=Math.round(O),e.uFrequency.value=L,e.uSpread.value=B,e.uTaper.value=k,e.uPosition.value=P,e.uFanMode.value=se[X]??0,e.uGlow.value=_,e.uFalloff.value=q,e.uThickness.value=I,e.uBrightness.value=D,e.uOpacity.value=N,e.uMirror.value=z?1:0,e.uShimmer.value=H?1:0,e.uGrain.value=V?1:0,e.uGrainIntensity.value=W;let h=e.uColor1.value,o=A(a);h[0]=o[0],h[1]=o[1],h[2]=o[2];let s=e.uColor2.value,c=A(l);s[0]=c[0],s[1]=c[1],s[2]=c[2];let f=e.uColor3.value,u=A(R);f[0]=u[0],f[1]=u[1],f[2]=u[2],e.uMouseStrength.value=b,e.uEnableMouse.value=F?1:0,g.current.enabled=F,g.current.strength=b},[a,l,R,G,O,L,B,k,P,X,_,q,I,D,N,z,H,V,W,F,b]),j("div",{ref:x,className:`focal-fibers-container ${ue}`.trim()})},ge=me;export{ge as default};
