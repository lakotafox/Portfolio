import{B as oe,t as Z,u as j,x as ee}from"./main-mznb6j68.js";import{C as le,H as ie,J as te}from"./main-csjpdy0q.js";var c=le(ie(),1);if(typeof document<"u"){let n=document.createElement("style");n.dataset.src="slat-ripple/SlatRipple.css",n.textContent=`.slat-ripple-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
`,document.head.appendChild(n)}var x=(n)=>{let i=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(n);if(!i)return[1,1,1];return[parseInt(i[1],16)/255,parseInt(i[2],16)/255,parseInt(i[3],16)/255]},re=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,se=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uColumns;
uniform float uRows;
uniform float uThickness;
uniform float uSpeed;
uniform float uTravel;
uniform float uWaveSpread;
uniform float uRowOffset;
uniform float uSoftness;
uniform float uGlow;
uniform float uBrightness;
uniform float uContrast;
uniform float uOpacity;
uniform float uVertical;
uniform float uAlternate;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform float uMouseRadius;
uniform float uEnableMouse;
uniform float uMouseActive;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 grid = vec2(max(uColumns, 1.0), max(uRows, 1.0));
  vec2 p = uv * grid;
  vec2 gv = fract(p) - 0.5;
  vec2 id = floor(p);

  float barCoord, waveId, offId, along;
  if (uVertical > 0.5) {
    barCoord = gv.x; waveId = id.y; offId = id.x; along = uv.y;
  } else {
    barCoord = gv.y; waveId = id.x; offId = id.y; along = uv.x;
  }

  float dir = 1.0;
  if (uAlternate > 0.5 && mod(offId, 2.0) >= 1.0) dir = -1.0;

  float phase = iTime * uSpeed + waveId * uWaveSpread + cos(offId * uRowOffset);
  float mv = sin(phase) * 0.5 + 0.5;
  if (dir < 0.0) mv = 1.0 - mv;

  float infl = 0.0;
  if (uEnableMouse > 0.5) {
    float md = distance(uv, uMouse);
    infl = smoothstep(uMouseRadius, 0.0, md) * uMouseStrength * uMouseActive;
  }

  float thick = clamp(uThickness + infl * 0.25, 0.0, 1.0);
  float startPos = (0.5 - thick * 0.5) * uTravel;
  float endPos = (-0.5 + thick * 0.5) * uTravel;
  float pos = mix(startPos, endPos, mv);

  float aa = max(uSoftness, 0.0005);
  float d = abs(barCoord + pos) - thick * 0.5;
  float aaWidth = fwidth(uVertical > 0.5 ? p.x : p.y);
  float edge = max(aa, aaWidth);
  float mask = smoothstep(edge, -edge, d);
  float glow = exp(-max(d, 0.0) * (7.0 / (uGlow + 0.001))) * clamp(uGlow, 0.0, 1.0);
  float intensity = clamp(mask + glow * (1.0 - mask), 0.0, 1.0);

  if (uGrain > 0.5) {
    float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453);
    intensity = clamp(intensity + (g - 0.5) * uGrainIntensity, 0.0, 1.0);
  }

  float tint = mv;
  vec3 grad = mix(uColor2, uColor1, tint);
  grad = mix(grad, uColor3, clamp(along, 0.0, 1.0) * 0.45);

  vec3 col = grad * uBrightness * (1.0 + infl * 0.6);
  col = (col - 0.5) * uContrast + 0.5;
  col = clamp(col, 0.0, 1.0);

  float a = intensity * uOpacity;
  fragColor = vec4(col * a, a);
}
`,R=new WeakMap,fe=({color1:n="#FF9FFC",color2:i="#5227FF",color3:S="#B497CF",columns:b=14,rows:A=8,barThickness:F=0.1,speed:I=0.35,travel:T=0.7,waveSpread:E=0.9,rowOffset:G=1,softness:k=0.05,glow:B=0,brightness:O=1,contrast:W=1,opacity:L=0.5,orientation:P="horizontal",alternate:V=!1,mouseInteraction:_=!0,mouseStrength:z=1,mouseRadius:q=0.3,grain:$=!0,grainIntensity:H=0.05,className:ae=""})=>{let d=c.useRef(null);return c.useEffect(()=>{let t=d.current;if(!t)return;let l=new j({webgl:2,alpha:!0,premultipliedAlpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)}),e=l.gl;e.clearColor(0,0,0,0);let o=e.canvas;o.style.width="100%",o.style.height="100%",o.style.display="block",t.appendChild(o);let v=new oe(e),a=new Z(e,{vertex:re,fragment:se,uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uColumns:{value:14},uRows:{value:8},uThickness:{value:0.1},uSpeed:{value:0.35},uTravel:{value:0.7},uWaveSpread:{value:0.9},uRowOffset:{value:1},uSoftness:{value:0.05},uGlow:{value:0},uBrightness:{value:1},uContrast:{value:1},uOpacity:{value:0.5},uVertical:{value:0},uAlternate:{value:0},uMouse:{value:new Float32Array([0.5,0.5])},uMouseStrength:{value:1},uMouseRadius:{value:0.3},uEnableMouse:{value:1},uMouseActive:{value:0},uGrain:{value:1},uGrainIntensity:{value:0.05},uColor1:{value:new Float32Array([1,1,1])},uColor2:{value:new Float32Array([1,1,1])},uColor3:{value:new Float32Array([1,1,1])}}}),m=new ee(e,{geometry:v,program:a});R.set(t,{renderer:l,program:a,mesh:m});let N=()=>{let u=t.getBoundingClientRect(),f=Math.max(1,Math.floor(u.width)),ne=Math.max(1,Math.floor(u.height));l.setSize(f,ne);let U=a.uniforms.iResolution.value;U[0]=e.drawingBufferWidth,U[1]=e.drawingBufferHeight,l.render({scene:m})},X=new ResizeObserver(N);X.observe(t),N();let r=[0.5,0.5],p=[0.5,0.5],h=0,g=0,Y=(u)=>{let f=o.getBoundingClientRect();p=[(u.clientX-f.left)/f.width,1-(u.clientY-f.top)/f.height],g=1},D=()=>{g=0};o.addEventListener("mousemove",Y),o.addEventListener("mouseleave",D);let s=0,C=!0,w=!document.hidden,ue=performance.now(),J=(u)=>{a.uniforms.iTime.value=(u-ue)*0.001,r[0]+=0.05*(p[0]-r[0]),r[1]+=0.05*(p[1]-r[1]),h+=0.05*(g-h),a.uniforms.uMouse.value[0]=r[0],a.uniforms.uMouse.value[1]=r[1],a.uniforms.uMouseActive.value=h,l.render({scene:m}),s=requestAnimationFrame(J)},M=()=>{if(C&&w&&s===0)s=requestAnimationFrame(J)},y=()=>{if(s!==0)cancelAnimationFrame(s),s=0},K=new IntersectionObserver(([u])=>{C=u.isIntersecting,C?M():y()},{threshold:0});K.observe(t);let Q=()=>{w=!document.hidden,w?M():y()};return document.addEventListener("visibilitychange",Q),M(),()=>{y(),X.disconnect(),K.disconnect(),document.removeEventListener("visibilitychange",Q),o.removeEventListener("mousemove",Y),o.removeEventListener("mouseleave",D),R.delete(t);try{t.removeChild(o)}catch{}e.getExtension("WEBGL_lose_context")?.loseContext()}},[]),c.useEffect(()=>{let t=d.current;if(!t)return;let l=R.get(t);if(!l)return;let e=l.program.uniforms;e.uColumns.value=Math.max(1,Math.round(b)),e.uRows.value=Math.max(1,Math.round(A)),e.uThickness.value=F,e.uSpeed.value=I,e.uTravel.value=T,e.uWaveSpread.value=E,e.uRowOffset.value=G,e.uSoftness.value=k,e.uGlow.value=B,e.uBrightness.value=O,e.uContrast.value=W,e.uOpacity.value=L,e.uVertical.value=P==="vertical"?1:0,e.uAlternate.value=V?1:0,e.uMouseStrength.value=z,e.uMouseRadius.value=q,e.uEnableMouse.value=_?1:0,e.uGrain.value=$?1:0,e.uGrainIntensity.value=H;let o=x(n);e.uColor1.value[0]=o[0],e.uColor1.value[1]=o[1],e.uColor1.value[2]=o[2];let v=x(i);e.uColor2.value[0]=v[0],e.uColor2.value[1]=v[1],e.uColor2.value[2]=v[2];let a=x(S);e.uColor3.value[0]=a[0],e.uColor3.value[1]=a[1],e.uColor3.value[2]=a[2]},[n,i,S,b,A,F,I,T,E,G,k,B,O,W,L,P,V,_,z,q,$,H]),te("div",{ref:d,className:`slat-ripple-container ${ae}`.trim()})},me=fe;export{me as default};
