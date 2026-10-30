import{B as j,t as K,u as Q,x as U}from"./main-mznb6j68.js";import{C as ne,H as re,J as ee}from"./main-csjpdy0q.js";var p=ne(re(),1);if(typeof document<"u"){let t=document.createElement("style");t.dataset.src="horizon-swells/HorizonSwells.css",t.textContent=`.horizon-swells-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
`,document.head.appendChild(t)}var S=(t)=>{let s=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);if(!s)return[1,1,1];return[parseInt(s[1],16)/255,parseInt(s[2],16)/255,parseInt(s[3],16)/255]},ae=(t)=>{if(t==="low")return 40;if(t==="high")return 110;return 70},ue=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,ie=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaveScale;
uniform float uWaveRatio;
uniform float uSwell;
uniform float uTurbulence;
uniform float uTilt;
uniform float uZoom;
uniform float uHeight;
uniform float uFogDepth;
uniform float uSteps;
uniform float uBrightness;
uniform float uOpacity;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec2 uMouse;
uniform float uParallax;
uniform bool uEnableMouse;
uniform vec3 uHorizonColor;
uniform vec3 uWaveColor;
uniform vec3 uCrestColor;
out vec4 fragColor;

const float MAX_DIST = 20000.0;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float plasma(vec3 r, vec2 freq, vec4 tc) {
  float mx = r.x + tc.x;
  mx += uSwell * sin((r.y + mx) / 20.0 + tc.y);
  float my = r.y - tc.z;
  my += uTurbulence * cos(r.x / 23.0 + tc.w);
  return r.z - (sin(mx * freq.x) * uAmplitude + sin(my * freq.y) * uAmplitude + uHeight);
}

float raymarch(vec3 pos, vec3 dir, vec2 freq, vec4 tc) {
  float dist = 0.0;
  for (int i = 0; i < 128; i++) {
    if (float(i) >= uSteps) break;
    float dscene = plasma(pos + dist * dir, freq, tc);
    if (abs(dscene) < 0.1) break;
    dist += 0.9 * dscene;
    if (!(abs(dist) < MAX_DIST)) return MAX_DIST;
  }
  return dist;
}

void main() {
  float T = iTime * uSpeed;
  vec2 freq = vec2(uWaveScale / 7.0, (uWaveScale * uWaveRatio) / 3.0);
  vec4 tc = vec4(T / 0.130, T / 0.810, T / 0.200, T / 0.710);
  float c, s;
  float vfov = (3.14159 / 2.3) / max(uZoom, 0.05);
  vec3 cam = vec3(0.0, 0.0, 30.0);
  vec2 uv = (gl_FragCoord.xy / iResolution.xy) - 0.5;
  uv.x *= iResolution.x / iResolution.y;
  uv.y *= -1.0;

  vec3 dir = vec3(0.0, 0.0, -1.0);
  float ulen = length(uv);
  float xrot = vfov * ulen;
  c = cos(xrot); s = sin(xrot);
  dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  vec2 nuv = ulen > 1e-5 ? uv / ulen : vec2(1.0, 0.0);
  c = nuv.x; s = nuv.y;
  dir = mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0) * dir;
  c = cos(uTilt); s = sin(uTilt);
  dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;

  if (uEnableMouse) {
    float yaw = (uMouse.x - 0.5) * uParallax * 0.4;
    float pitch = (uMouse.y - 0.5) * uParallax * 0.4;
    c = cos(yaw); s = sin(yaw);
    dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;
    c = cos(pitch); s = sin(pitch);
    dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  }

  float dist = raymarch(cam, dir, freq, tc);
  vec3 pos = cam + dist * dir;

  float t = clamp(uFogDepth / max(dist, 0.001), 0.0, 1.0);
  vec3 body = mix(uWaveColor, uCrestColor, clamp(pos.z * 0.08 + 0.5, 0.0, 1.0));
  vec3 col = mix(uHorizonColor, body, t);
  col *= uBrightness;
  col = clamp(col, 0.0, 1.0);

  float alpha = clamp(t, 0.0, 1.0) * uOpacity;
  if (uGrain > 0.5) {
    float g = hash21(gl_FragCoord.xy + mod(iTime, 64.0) * 11.0);
    alpha += (g - 0.5) * uGrainIntensity;
  }
  alpha = clamp(alpha, 0.0, 1.0);
  fragColor = vec4(col * alpha, alpha);
}
`,T=new WeakMap,le=({horizonColor:t="#5227FF",waveColor:s="#FF9FFC",crestColor:R="#FFFFFF",speed:A=0.4,amplitude:W=2.5,waveScale:z=0.6,waveRatio:E=0.9,swell:H=35,turbulence:P=20,tilt:q=1.11,zoom:B=1,height:G=5.5,fogDepth:I=15,detail:L="medium",brightness:_=1,opacity:D=1,mouseInteraction:y=!0,parallaxStrength:O=0.5,grain:k=!0,grainIntensity:X=0.05,className:te=""})=>{let g=p.useRef(null),x=p.useRef(y);return p.useEffect(()=>{let o=g.current;if(!o)return;let i=new Q({webgl:2,alpha:!0,premultipliedAlpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)}),n=i.gl;n.clearColor(0,0,0,0);let e=n.canvas;e.style.width="100%",e.style.height="100%",e.style.display="block",o.appendChild(e);let h=new j(n),r=new K(n,{vertex:ue,fragment:ie,uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uSpeed:{value:0.4},uAmplitude:{value:2.5},uWaveScale:{value:0.6},uWaveRatio:{value:0.9},uSwell:{value:35},uTurbulence:{value:20},uTilt:{value:1.11},uZoom:{value:1},uHeight:{value:5.5},uFogDepth:{value:15},uSteps:{value:70},uBrightness:{value:1},uOpacity:{value:1},uGrain:{value:1},uGrainIntensity:{value:0.05},uMouse:{value:new Float32Array([0.5,0.5])},uParallax:{value:0.5},uEnableMouse:{value:!0},uHorizonColor:{value:new Float32Array([1,1,1])},uWaveColor:{value:new Float32Array([1,1,1])},uCrestColor:{value:new Float32Array([1,1,1])}}}),c=new U(n,{geometry:h,program:r});T.set(o,{renderer:i,program:r,mesh:c});let v=()=>{let u=o.getBoundingClientRect(),l=Math.max(1,Math.floor(u.width)),M=Math.max(1,Math.floor(u.height));i.setSize(l,M);let J=r.uniforms.iResolution.value;J[0]=n.drawingBufferWidth,J[1]=n.drawingBufferHeight,i.render({scene:c})},f=new ResizeObserver(v);f.observe(o),v();let a=[0.5,0.5],m=[0.5,0.5],Z=(u)=>{let l=e.getBoundingClientRect();m[0]=(u.clientX-l.left)/l.width,m[1]=1-(u.clientY-l.top)/l.height},V=()=>{m[0]=0.5,m[1]=0.5};e.addEventListener("pointermove",Z),e.addEventListener("pointerleave",V);let d=0,w=!0,b=!document.hidden,oe=performance.now(),$=(u)=>{r.uniforms.iTime.value=(u-oe)*0.001;let l=x.current?m[0]:0.5,M=x.current?m[1]:0.5;a[0]+=0.05*(l-a[0]),a[1]+=0.05*(M-a[1]),r.uniforms.uMouse.value[0]=a[0],r.uniforms.uMouse.value[1]=a[1],i.render({scene:c}),d=requestAnimationFrame($)},C=()=>{if(w&&b&&d===0)d=requestAnimationFrame($)},F=()=>{if(d!==0)cancelAnimationFrame(d),d=0},N=new IntersectionObserver(([u])=>{w=u.isIntersecting,w?C():F()},{threshold:0});N.observe(o);let Y=()=>{b=!document.hidden,b?C():F()};return document.addEventListener("visibilitychange",Y),C(),()=>{F(),f.disconnect(),N.disconnect(),document.removeEventListener("visibilitychange",Y),e.removeEventListener("pointermove",Z),e.removeEventListener("pointerleave",V),T.delete(o);try{o.removeChild(e)}catch{}n.getExtension("WEBGL_lose_context")?.loseContext()}},[]),p.useEffect(()=>{let o=g.current;if(!o)return;let i=T.get(o);if(!i)return;let{program:n}=i,e=n.uniforms;x.current=y,e.uSpeed.value=A,e.uAmplitude.value=W,e.uWaveScale.value=z,e.uWaveRatio.value=E,e.uSwell.value=H,e.uTurbulence.value=P,e.uTilt.value=q,e.uZoom.value=B,e.uHeight.value=G,e.uFogDepth.value=I,e.uSteps.value=ae(L),e.uBrightness.value=_,e.uOpacity.value=D,e.uGrain.value=k?1:0,e.uGrainIntensity.value=X,e.uParallax.value=O,e.uEnableMouse.value=y;let h=e.uHorizonColor.value,r=e.uWaveColor.value,c=e.uCrestColor.value,v=S(t),f=S(s),a=S(R);h[0]=v[0],h[1]=v[1],h[2]=v[2],r[0]=f[0],r[1]=f[1],r[2]=f[2],c[0]=a[0],c[1]=a[1],c[2]=a[2]},[t,s,R,A,W,z,E,H,P,q,B,G,I,L,_,D,k,X,y,O]),ee("div",{ref:g,className:`horizon-swells-container ${te}`.trim()})},fe=le;export{fe as default};
