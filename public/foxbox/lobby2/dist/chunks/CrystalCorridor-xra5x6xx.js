import{B as he,t as O,u as ge,x as W,y as _}from"./main-mznb6j68.js";import{C as Re,H as Se,J as xe}from"./main-csjpdy0q.js";var i=Re(Se(),1);if(typeof document<"u"){let l=document.createElement("style");l.dataset.src="crystal-corridor/CrystalCorridor.css",l.textContent=`.crystal-corridor-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
`,document.head.appendChild(l)}var I=(l)=>{let m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(l);if(!m)return[1,1,1];return[parseInt(m[1],16)/255,parseInt(m[2],16)/255,parseInt(m[3],16)/255]},de={low:20,medium:32,high:48},be=(l)=>de[l]||de.medium,pe=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,Fe=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uWaveDepth;
uniform float uZoom;
uniform float uDensity;
uniform float uSpread;
uniform float uStepSize;
uniform float uGlow;
uniform float uExposure;
uniform float uColorShift;
uniform float uContrast;
uniform float uBrightness;
uniform float uOpacity;
uniform float uSteps;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform float uMouseRadius;
uniform float uEnableMouse;
uniform float uMouseActive;
uniform float uGrain;
uniform float uGrainIntensity;
out vec4 fragColor;

void main() {
  vec2 frag = gl_FragCoord.xy;
  float zoom = max(uZoom, 0.05);
  float aspect = iResolution.x / iResolution.y;
  vec2 ndc = (2.0 * frag - iResolution.xy) / iResolution.y;
  vec2 dir = ndc * (0.5 / zoom);

  vec2 mouseNdc = vec2(uMouse.x * aspect, uMouse.y);
  float mr = max(uMouseRadius, 0.01);
  vec2 md = ndc - mouseNdc;
  float dent = exp(-dot(md, md) / (mr * mr)) * (3.0 * uMouseStrength * uEnableMouse * uMouseActive);

  float travel = sin(iTime * uSpeed) * uWaveDepth;
  float density = max(uDensity, 1.0);
  float spread = clamp(uSpread, 0.05, 0.6);
  float stepSize = max(uStepSize, 0.0005);
  float glowGain = max(uGlow, 0.0);

  vec3 tOffset = vec3(0.0, dent, travel);
  vec3 p = vec3(0.0);
  float s = 0.0;
  float glow = 0.0;

  for (int i = 0; i < 64; i++) {
    if (float(i) >= uSteps) break;
    p += vec3(dir * s, s);
    vec3 q = p + tOffset;
    s += density - length(q.xz) + length(ceil(q).xy);
    s = stepSize + abs(s) * spread;
    glow += glowGain / s;
  }

  float e = glow / max(uExposure, 1.0);
  float shimmer = 0.5 + 0.5 * dot(cos(iTime * uColorShift + p), vec3(0.3333));
  float v = tanh(e * uBrightness * mix(0.7, 1.05, shimmer));
  v = clamp((v - 0.5) * uContrast + 0.5, 0.0, 1.0);

  vec3 col = mix(uColor1, uColor2, smoothstep(0.0, 0.55, v));
  col = mix(col, uColor3, smoothstep(0.55, 1.0, v));
  col *= v;

  float a = clamp(v, 0.0, 1.0) * uOpacity;
  vec3 outRgb = col * a;
  if (uGrain > 0.5) {
    float gv = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453) - 0.5) * uGrainIntensity;
    outRgb = clamp(outRgb + gv, 0.0, 1.0);
    a = clamp(a + gv, 0.0, 1.0);
  }
  fragColor = vec4(outRgb, a);
}
`,Ge=`#version 300 es
precision highp float;
uniform sampler2D tMap;
uniform vec2 iResolution;
uniform vec2 uDirection;
uniform float uRadius;
uniform float uGrain;
uniform float uGrainIntensity;
uniform float iTime;
out vec4 fragColor;

vec4 samp(vec2 uv) {
  return texture(tMap, uv);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution;
  vec2 texel = uDirection / iResolution;
  float st = uRadius * 0.25;
  vec4 sum = samp(uv) * 0.2026;
  sum += (samp(uv + texel * st) + samp(uv - texel * st)) * 0.179;
  sum += (samp(uv + texel * (st * 2.0)) + samp(uv - texel * (st * 2.0))) * 0.124;
  sum += (samp(uv + texel * (st * 3.0)) + samp(uv - texel * (st * 3.0))) * 0.0672;
  sum += (samp(uv + texel * (st * 4.0)) + samp(uv - texel * (st * 4.0))) * 0.0285;
  vec4 col = sum;
  if (uGrain > 0.5) {
    float gv = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453) - 0.5) * uGrainIntensity;
    col.rgb = clamp(col.rgb + gv, 0.0, 1.0);
    col.a = clamp(col.a + gv, 0.0, 1.0);
  }
  fragColor = col;
}
`,L=new WeakMap,Ee=({color1:l="#5227FF",color2:m="#A855F7",color3:P="#FFFFFF",detail:q="medium",speed:Z=0.7,waveDepth:k=1,zoom:N=1.3,density:V=10,glow:H=1,exposure:$=2700,spread:X=0.3,stepSize:Y=0.002,colorShift:J=0,contrast:K=1,brightness:Q=1,opacity:U=1,mouseInteraction:w=!0,mouseStrength:C=0.1,mouseRadius:j=0.35,blur:M=0,grain:R=!0,grainIntensity:S=0.05,className:ye=""})=>{let b=i.useRef(null),ee=i.useRef([0,0]),we=i.useRef([0,0]),F=i.useRef(w),te=i.useRef(C),G=i.useRef(0),E=i.useRef(0),T=i.useRef(M),oe=i.useRef(R),ue=i.useRef(S);return i.useEffect(()=>{let n=b.current;if(!n)return;let c=new ge({webgl:2,alpha:!0,premultipliedAlpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)}),t=c.gl;t.clearColor(0,0,0,0);let e=t.canvas;e.style.width="100%",e.style.height="100%",e.style.display="block",n.appendChild(e);let p=new he(t),r=new O(t,{vertex:pe,fragment:Fe,uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uSpeed:{value:0.7},uWaveDepth:{value:1},uZoom:{value:1.3},uDensity:{value:10},uSpread:{value:0.3},uStepSize:{value:0.002},uGlow:{value:1},uExposure:{value:2700},uColorShift:{value:0},uContrast:{value:1},uBrightness:{value:1},uOpacity:{value:1},uSteps:{value:32},uColor1:{value:new Float32Array([1,1,1])},uColor2:{value:new Float32Array([1,1,1])},uColor3:{value:new Float32Array([1,1,1])},uMouse:{value:new Float32Array([0,0])},uMouseStrength:{value:0.1},uMouseRadius:{value:0.35},uEnableMouse:{value:1},uMouseActive:{value:0},uGrain:{value:1},uGrainIntensity:{value:0.05}}}),d=new W(t,{geometry:p,program:r}),v=new O(t,{vertex:pe,fragment:Ge,uniforms:{tMap:{value:null},iResolution:{value:new Float32Array([1,1])},uDirection:{value:new Float32Array([1,0])},uRadius:{value:0},uGrain:{value:0},uGrainIntensity:{value:0.05},iTime:{value:0}}}),g=new W(t,{geometry:p,program:v}),s=null,h=null,Ce=()=>{if(!s){let{drawingBufferWidth:o,drawingBufferHeight:u}=t;s=new _(t,{width:o,height:u,depth:!1}),h=new _(t,{width:o,height:u,depth:!1})}},ne=()=>{let o=oe.current?1:0,u=ue.current;if(r.uniforms.uGrainIntensity.value=u,v.uniforms.uGrainIntensity.value=u,T.current>0){Ce(),r.uniforms.uGrain.value=0,c.render({scene:d,target:s});let a=v.uniforms;a.uRadius.value=T.current*14,a.tMap.value=s.texture,a.uDirection.value[0]=1,a.uDirection.value[1]=0,a.uGrain.value=0,c.render({scene:g,target:h}),a.tMap.value=h.texture,a.uDirection.value[0]=0,a.uDirection.value[1]=1,a.uGrain.value=o,c.render({scene:g})}else r.uniforms.uGrain.value=o,c.render({scene:d})};L.set(n,{renderer:c,program:r,mesh:d});let re=()=>{let o=n.getBoundingClientRect(),u=Math.max(1,Math.floor(o.width)),a=Math.max(1,Math.floor(o.height));c.setSize(u,a);let{drawingBufferWidth:f,drawingBufferHeight:y}=t,fe=r.uniforms.iResolution.value;fe[0]=f,fe[1]=y;let me=v.uniforms.iResolution.value;if(me[0]=f,me[1]=y,s)s.setSize(f,y),h.setSize(f,y);ne()},ae=new ResizeObserver(re);ae.observe(n),re();let ie=(o)=>{let u=n.getBoundingClientRect(),a=((o.clientX-u.left)/u.width-0.5)*2,f=-((o.clientY-u.top)/u.height-0.5)*2;ee.current=[a,f],E.current=1},se=()=>{E.current=0};n.addEventListener("mousemove",ie),n.addEventListener("mouseleave",se);let x=0,A=!0,D=!document.hidden,Me=performance.now(),le=(o)=>{r.uniforms.iTime.value=(o-Me)*0.001;let u=we.current,a=ee.current;u[0]+=0.05*(a[0]-u[0]),u[1]+=0.05*(a[1]-u[1]);let f=r.uniforms.uMouse.value;f[0]=u[0],f[1]=u[1];let y=F.current?E.current:0;G.current+=0.05*(y-G.current),r.uniforms.uMouseActive.value=G.current,r.uniforms.uEnableMouse.value=F.current?1:0,r.uniforms.uMouseStrength.value=te.current,v.uniforms.iTime.value=r.uniforms.iTime.value,ne(),x=requestAnimationFrame(le)},z=()=>{if(A&&D&&x===0)x=requestAnimationFrame(le)},B=()=>{if(x!==0)cancelAnimationFrame(x),x=0},ce=new IntersectionObserver(([o])=>{A=o.isIntersecting,A?z():B()},{threshold:0});ce.observe(n);let ve=()=>{D=!document.hidden,D?z():B()};return document.addEventListener("visibilitychange",ve),z(),()=>{if(B(),ae.disconnect(),ce.disconnect(),document.removeEventListener("visibilitychange",ve),n.removeEventListener("mousemove",ie),n.removeEventListener("mouseleave",se),L.delete(n),s)t.deleteFramebuffer(s.buffer),t.deleteFramebuffer(h.buffer),s.textures.forEach((o)=>t.deleteTexture(o.texture)),h.textures.forEach((o)=>t.deleteTexture(o.texture));try{n.removeChild(e)}catch{}t.getExtension("WEBGL_lose_context")?.loseContext()}},[]),i.useEffect(()=>{let n=b.current;if(!n)return;let c=L.get(n);if(!c)return;let{program:t}=c,e=t.uniforms;e.uSpeed.value=Z,e.uWaveDepth.value=k,e.uZoom.value=N,e.uDensity.value=V,e.uSpread.value=X,e.uStepSize.value=Y,e.uGlow.value=H,e.uExposure.value=$,e.uColorShift.value=J,e.uContrast.value=K,e.uBrightness.value=Q,e.uOpacity.value=U,e.uSteps.value=be(q),e.uMouseRadius.value=j;let p=I(l),r=e.uColor1.value;r[0]=p[0],r[1]=p[1],r[2]=p[2];let d=I(m),v=e.uColor2.value;v[0]=d[0],v[1]=d[1],v[2]=d[2];let g=I(P),s=e.uColor3.value;s[0]=g[0],s[1]=g[1],s[2]=g[2],F.current=w,te.current=C,T.current=M,oe.current=R,ue.current=S},[l,m,P,q,Z,k,N,V,H,$,X,Y,J,K,Q,U,w,C,j,M,R,S]),xe("div",{ref:b,className:`crystal-corridor-container ${ye}`.trim()})},ze=Ee;export{ze as default};
