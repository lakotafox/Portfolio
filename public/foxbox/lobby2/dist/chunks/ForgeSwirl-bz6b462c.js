import{B as K,t as X,u as Y,x as J}from"./main-mznb6j68.js";import{C as ee,H as oe,J as Q}from"./main-csjpdy0q.js";var g=ee(oe(),1);if(typeof document<"u"){let t=document.createElement("style");t.dataset.src="forge-swirl/ForgeSwirl.css",t.textContent=`.forge-swirl-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
`,document.head.appendChild(t)}var F=(t)=>{let a=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);if(!a)return[1,1,1];return[parseInt(a[1],16)/255,parseInt(a[2],16)/255,parseInt(a[3],16)/255]},te=(t)=>t==="ember"?1:t==="frost"?2:0,ne=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,ie=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uScale;
uniform float uDetail;
uniform float uGlow;
uniform float uCoreSize;
uniform float uSwirl;
uniform float uFold;
uniform float uBlackPoint;
uniform float uBrightness;
uniform float uColorMode;
uniform float uGrain;
uniform float uGrainIntensity;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform bool uEnableMouse;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float time = iTime * uSpeed;
  vec2 p = uScale * ((gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y) - 0.5;

  vec2 drift = vec2(0.0);
  if (uEnableMouse) {
    drift = (uMouse - 0.5) * uMouseStrength * 2.0;
  }
  p += drift;

  vec2 i = p;
  float c = 0.0;
  float r = length(p + vec2(sin(time), sin(time * 0.3 + 5.0)) * 0.5);
  float d = length(p);
  float rot = d + time + p.x * uSwirl;

  float cosRot = cos(rot);
  mat2 warp = mat2(cos(rot - sin(time / 5.0)), sin(rot), -sin(cosRot - time), cosRot) * uFold;
  float glowCore = uGlow * uCoreSize;

  for (float n = 0.0; n < 8.0; n++) {
    if (n >= uDetail) break;
    p *= warp;
    float t = r - time / (n + 3.0);
    i -= p + vec2(cos(t - i.x - r) + sin(t + i.y), sin(t - i.y) + cos(t + i.x) + r);
    c += glowCore / length(vec2(sin(i.x + t), cos(i.y + t)));
  }

  c /= 6.0;

  float intensity = max(c - uBlackPoint, 0.0) * uBrightness;

  float g = clamp(intensity, 0.0, 1.0);

  float mid = 0.5;
  if (uColorMode > 1.5) {
    mid = 0.65;
  } else if (uColorMode > 0.5) {
    mid = 0.35;
  }

  vec3 col = mix(uColor1, uColor2, smoothstep(0.0, mid, g));
  col = mix(col, uColor3, smoothstep(mid, 1.0, g));

  float a = g;
  if (uGrain > 0.5) {
    float gr = hash(gl_FragCoord.xy + iTime);
    a += (gr - 0.5) * uGrainIntensity;
  }
  a = clamp(a, 0.0, 1.0) * uOpacity;
  fragColor = vec4(col * a, a);
}
`,S=new WeakMap,re=({color1:t="#5227FF",color2:a="#FF9FFC",color3:x="#FFFFFF",speed:b=0.35,scale:R=4,detail:E=3,glow:B=1.6,coreSize:G=0.1,swirl:A=1,fold:L=-0.2,blackPoint:T=0.05,brightness:I=1.3,colorMode:P="molten",grain:k=!0,grainIntensity:z=0.05,mouseInteraction:O=!0,mouseStrength:_=0.3,opacity:D=1,className:U=""})=>{let p=g.useRef(null);return g.useEffect(()=>{let n=p.current;if(!n)return;let u=new Y({webgl:2,alpha:!0,premultipliedAlpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)}),e=u.gl;e.clearColor(0,0,0,0);let o=e.canvas;o.style.width="100%",o.style.height="100%",o.style.display="block",n.appendChild(o);let h=new K(e),i=new X(e,{vertex:ne,fragment:ie,uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uSpeed:{value:0.35},uScale:{value:4},uDetail:{value:3},uGlow:{value:1.6},uCoreSize:{value:0.1},uSwirl:{value:1},uFold:{value:-0.2},uBlackPoint:{value:0.05},uBrightness:{value:1.3},uColorMode:{value:0},uGrain:{value:1},uGrainIntensity:{value:0.05},uOpacity:{value:1},uMouse:{value:new Float32Array([0.5,0.5])},uMouseStrength:{value:0.3},uEnableMouse:{value:!0},uColor1:{value:new Float32Array([1,1,1])},uColor2:{value:new Float32Array([1,1,1])},uColor3:{value:new Float32Array([1,1,1])}}}),l=new J(e,{geometry:h,program:i});S.set(n,{renderer:u,program:i,mesh:l});let s=()=>{let r=n.getBoundingClientRect(),d=Math.max(1,Math.floor(r.width)),j=Math.max(1,Math.floor(r.height));u.setSize(d,j);let N=i.uniforms.iResolution.value;N[0]=e.drawingBufferWidth,N[1]=e.drawingBufferHeight,u.render({scene:l})},c=new ResizeObserver(s);c.observe(n),s();let f=[0.5,0.5],m=[0.5,0.5],V=(r)=>{let d=o.getBoundingClientRect();f[0]=(r.clientX-d.left)/d.width,f[1]=1-(r.clientY-d.top)/d.height},W=()=>{f[0]=0.5,f[1]=0.5};o.addEventListener("mousemove",V),o.addEventListener("mouseleave",W);let v=0,w=!0,C=!document.hidden,Z=performance.now(),q=(r)=>{i.uniforms.iTime.value=(r-Z)*0.001,m[0]+=0.05*(f[0]-m[0]),m[1]+=0.05*(f[1]-m[1]),i.uniforms.uMouse.value[0]=m[0],i.uniforms.uMouse.value[1]=m[1],u.render({scene:l}),v=requestAnimationFrame(q)},y=()=>{if(w&&C&&v===0)v=requestAnimationFrame(q)},M=()=>{if(v!==0)cancelAnimationFrame(v),v=0},$=new IntersectionObserver(([r])=>{w=r.isIntersecting,w?y():M()},{threshold:0});$.observe(n);let H=()=>{C=!document.hidden,C?y():M()};return document.addEventListener("visibilitychange",H),y(),()=>{M(),c.disconnect(),$.disconnect(),document.removeEventListener("visibilitychange",H),o.removeEventListener("mousemove",V),o.removeEventListener("mouseleave",W),S.delete(n);try{n.removeChild(o)}catch{}e.getExtension("WEBGL_lose_context")?.loseContext()}},[]),g.useEffect(()=>{let n=p.current;if(!n)return;let u=S.get(n);if(!u)return;let e=u.program.uniforms;e.uSpeed.value=b,e.uScale.value=R,e.uDetail.value=E,e.uGlow.value=B,e.uCoreSize.value=Math.max(G,0.001),e.uSwirl.value=A,e.uFold.value=L,e.uBlackPoint.value=T,e.uBrightness.value=I,e.uColorMode.value=te(P),e.uGrain.value=k?1:0,e.uGrainIntensity.value=z,e.uOpacity.value=D,e.uMouseStrength.value=_,e.uEnableMouse.value=O;let o=F(t),h=F(a),i=F(x),l=e.uColor1.value,s=e.uColor2.value,c=e.uColor3.value;l[0]=o[0],l[1]=o[1],l[2]=o[2],s[0]=h[0],s[1]=h[1],s[2]=h[2],c[0]=i[0],c[1]=i[1],c[2]=i[2]},[t,a,x,b,R,E,B,G,A,L,T,I,P,k,z,O,_,D]),Q("div",{ref:p,className:`forge-swirl-container ${U}`.trim()})},se=re;export{se as default};
