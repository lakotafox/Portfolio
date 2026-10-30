import{B as ie,t as le,u as ue,x as ne}from"./main-mznb6j68.js";import{C as ve,H as de,J as re}from"./main-csjpdy0q.js";var v=ve(de(),1);if(typeof document<"u"){let i=document.createElement("style");i.dataset.src="fiber-rush/FiberRush.css",i.textContent=`.fiber-rush-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
`,document.head.appendChild(i)}var R=(i)=>{let c=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(i);if(!c)return[1,1,1];return[parseInt(c[1],16)/255,parseInt(c[2],16)/255,parseInt(c[3],16)/255]},me=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,he=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uFlowDir;
uniform float uPulseSpeed;
uniform float uPulseLength;
uniform float uPulseBlend;
uniform float uPulseWidth;
uniform float uCableCount;
uniform float uThickness;
uniform float uRimWidth;
uniform float uWaviness;
uniform float uSway;
uniform float uSize;
uniform vec2 uCenter;
uniform vec2 uMouseOffset;
uniform float uGlow;
uniform float uFadeNear;
uniform float uFadeFar;
uniform float uBrightness;
uniform float uColorVariance;
uniform float uOpacity;
uniform vec3 uCableColor;
uniform vec3 uPulseColor;
uniform vec3 uTunnelColor;
uniform float uTunnelOpacity;
uniform float uGrain;
uniform float uGrainIntensity;
out vec4 fragColor;

void mainImage(out vec4 o, in vec2 fragCoord) {
  float size = uSize * 2.0;
  float flowDir = uFlowDir;
  float speedBase = uSpeed * 4.0 * flowDir;
  float waviness = uWaviness * 0.15;
  float rotationOsc = uSway * 0.5;
  float baseThick = uThickness * 0.35 + 0.05;
  float borderWeight = uRimWidth * 0.15 + 0.01;
  float cablesCount = floor(uCableCount);

  vec2 res = iResolution.xy;
  vec2 uv = (fragCoord - 0.5 * res) / min(res.y, res.x);
  uv -= (uCenter + uMouseOffset);
  uv /= (size + 0.0001);

  float r = length(uv);
  float angle = atan(uv.y, uv.x);
  float depth = -log(r + 0.0001);

  float swing = sin(iTime * (uSpeed * 0.5 + 0.1)) * rotationOsc;
  float waveOffset = sin(depth * 1.2 + iTime * speedBase * 0.25) * waviness;

  float angleNormalized = (angle / 6.2831853) + 0.5;
  float finalAngle = fract(angleNormalized + waveOffset + swing);

  float cableID = floor(finalAngle * cablesCount);
  float gvX = (fract(finalAngle * cablesCount) - 0.5);

  float rand = fract(sin(cableID * 12.9898) * 43758.5453);
  float randSpeed = (0.4 + rand * 0.6) * speedBase * uPulseSpeed;
  float cableThick = baseThick * (0.6 + rand * 0.4);

  vec3 cableCol = uCableColor;
  cableCol *= 1.0 + (rand - 0.5) * 0.4 * uColorVariance;
  cableCol = mix(cableCol, uPulseColor, rand * 0.25 * uColorVariance);

  float scroll = depth + (iTime * randSpeed);
  float pulseFact = fract(scroll);

  float distToCore = abs(gvX);
  float wireMask = smoothstep(cableThick, cableThick - 0.05, distToCore);
  float rimGlow = smoothstep(borderWeight, 0.0, abs(distToCore - cableThick));

  float pulseThick = cableThick * uPulseWidth;
  float pulseMask = smoothstep(pulseThick, pulseThick - 0.05 * uPulseWidth, distToCore);

  float pulseDist = abs(pulseFact - 0.5);
  float pulseTotal = uPulseLength;
  float pulseCore = pulseTotal * (1.0 - uPulseBlend);
  float pulseLo = min(pulseCore, pulseTotal - max(fwidth(scroll), 1e-4));
  float dataPulse = 1.0 - smoothstep(pulseLo, pulseTotal, pulseDist);

  float aBody = wireMask * uTunnelOpacity;
  float aRim = rimGlow;
  float aPulse = clamp(dataPulse * pulseMask, 0.0, 1.0);

  vec3 fiberCol = uTunnelColor * aBody
    + cableCol * aRim * 1.3 * uGlow
    + uPulseColor * dataPulse * 3.0 * pulseMask;

  float distFade = smoothstep(0.0, uFadeNear, r) * smoothstep(uFadeFar, uFadeFar - 0.9, r);
  float inten = clamp(aBody + aRim + aPulse, 0.0, 1.0) * distFade;

  vec3 finalCol = fiberCol * uBrightness;
  float alpha = clamp(inten, 0.0, 1.0) * uOpacity;
  vec3 outRgb = finalCol * alpha;

  if (uGrain > 0.5) {
    float gv = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453) - 0.5) * uGrainIntensity;
    outRgb = clamp(outRgb + gv, 0.0, 1.0);
    alpha = clamp(alpha + gv, 0.0, 1.0);
  }

  o = vec4(outRgb, alpha);
}

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  fragColor = o;
}
`,M=new WeakMap,pe=({cableColor:i="#A855F7",pulseColor:c="#A855F7",tunnelColor:S="#5227FF",tunnelOpacity:k=0,speed:x=0.1,flowDirection:B="outward",pulseSpeed:O=2,pulseLength:W=0.28,pulseBlend:A=1,pulseWidth:G=1,cableCount:L=20,thickness:E=0.35,rimWidth:z=0.15,waviness:I=0.3,sway:D=0.5,size:V=1,centerX:N=0,centerY:_=0,glow:U=1,fadeNear:q=0.5,fadeFar:X=2,brightness:$=1,colorVariance:H=!0,grain:J=!0,grainIntensity:K=0.05,opacity:Q=1,mouseInteraction:g=!0,mouseStrength:C=0.1,className:se=""})=>{let b=v.useRef(null),Y=v.useRef(g),w=v.useRef(C);return v.useEffect(()=>{let a=b.current;if(!a)return;let r=new ue({webgl:2,alpha:!0,premultipliedAlpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)}),t=r.gl;t.clearColor(0,0,0,0);let e=t.canvas;e.style.width="100%",e.style.height="100%",e.style.display="block",a.appendChild(e);let p=new ie(t),l=new le(t,{vertex:me,fragment:he,uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uSpeed:{value:0.1},uFlowDir:{value:-1},uPulseSpeed:{value:2},uPulseLength:{value:0.28},uPulseBlend:{value:1},uPulseWidth:{value:1},uCableCount:{value:20},uThickness:{value:0.35},uRimWidth:{value:0.15},uWaviness:{value:0.3},uSway:{value:0.5},uSize:{value:1},uCenter:{value:new Float32Array([0,0])},uMouseOffset:{value:new Float32Array([0,0])},uGlow:{value:1},uFadeNear:{value:0.5},uFadeFar:{value:2},uBrightness:{value:1},uColorVariance:{value:1},uOpacity:{value:1},uCableColor:{value:new Float32Array([0.65882353,0.33333333,0.96862745])},uPulseColor:{value:new Float32Array([0.65882353,0.33333333,0.96862745])},uTunnelColor:{value:new Float32Array([0.32156863,0.15294118,1])},uTunnelOpacity:{value:0},uGrain:{value:1},uGrainIntensity:{value:0.05}}}),f=new ne(t,{geometry:p,program:l});M.set(a,{renderer:r,program:l,mesh:f});let d=()=>{let u=a.getBoundingClientRect(),n=Math.max(1,Math.floor(u.width)),fe=Math.max(1,Math.floor(u.height));r.setSize(n,fe);let te=l.uniforms.iResolution.value;te[0]=t.drawingBufferWidth,te[1]=t.drawingBufferHeight,r.render({scene:f})},m=new ResizeObserver(d);m.observe(a),d();let o=[0.5,0.5],s=[0.5,0.5],Z=(u)=>{let n=e.getBoundingClientRect();s=[(u.clientX-n.left)/n.width,1-(u.clientY-n.top)/n.height]},j=()=>{s=[0.5,0.5]};e.addEventListener("mousemove",Z),e.addEventListener("mouseleave",j);let h=0,y=!0,T=!document.hidden,ce=performance.now(),ee=(u)=>{if(l.uniforms.iTime.value=(u-ce)*0.001,Y.current)o[0]+=0.05*(s[0]-o[0]),o[1]+=0.05*(s[1]-o[1]);else o[0]+=0.05*(0.5-o[0]),o[1]+=0.05*(0.5-o[1]);let n=l.uniforms.uMouseOffset.value;n[0]=(o[0]-0.5)*w.current,n[1]=(o[1]-0.5)*w.current,r.render({scene:f}),h=requestAnimationFrame(ee)},F=()=>{if(y&&T&&h===0)h=requestAnimationFrame(ee)},P=()=>{if(h!==0)cancelAnimationFrame(h),h=0},oe=new IntersectionObserver(([u])=>{y=u.isIntersecting,y?F():P()},{threshold:0});oe.observe(a);let ae=()=>{T=!document.hidden,T?F():P()};return document.addEventListener("visibilitychange",ae),F(),()=>{P(),m.disconnect(),oe.disconnect(),document.removeEventListener("visibilitychange",ae),e.removeEventListener("mousemove",Z),e.removeEventListener("mouseleave",j),M.delete(a);try{a.removeChild(e)}catch{}t.getExtension("WEBGL_lose_context")?.loseContext()}},[]),v.useEffect(()=>{Y.current=g,w.current=C;let a=b.current;if(!a)return;let r=M.get(a);if(!r)return;let{program:t}=r,e=t.uniforms;e.uSpeed.value=x,e.uFlowDir.value=B==="outward"?-1:1,e.uPulseSpeed.value=O,e.uPulseLength.value=W,e.uPulseBlend.value=A,e.uPulseWidth.value=G,e.uCableCount.value=L,e.uThickness.value=E,e.uRimWidth.value=z,e.uWaviness.value=I,e.uSway.value=D,e.uSize.value=V;let p=e.uCenter.value;p[0]=N,p[1]=_,e.uGlow.value=U,e.uFadeNear.value=q,e.uFadeFar.value=X,e.uBrightness.value=$,e.uColorVariance.value=H?1:0,e.uGrain.value=J?1:0,e.uGrainIntensity.value=K,e.uOpacity.value=Q;let l=R(i),f=e.uCableColor.value;f[0]=l[0],f[1]=l[1],f[2]=l[2];let d=R(c),m=e.uPulseColor.value;m[0]=d[0],m[1]=d[1],m[2]=d[2];let o=R(S),s=e.uTunnelColor.value;s[0]=o[0],s[1]=o[1],s[2]=o[2],e.uTunnelOpacity.value=k},[i,c,S,k,x,B,O,W,A,G,L,E,z,I,D,V,N,_,U,q,X,$,H,J,K,Q,g,C]),re("div",{ref:b,className:`fiber-rush-container ${se}`.trim()})},we=pe;export{we as default};
