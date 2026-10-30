import{D as ne,v as oe,w as te,z as ue}from"./main-ghsx4cn4.js";import{E as me,J as de,L as ee}from"./main-jpng9c0t.js";var f=me(de(),1);if(typeof document<"u"){let o=document.createElement("style");o.dataset.src="contour-field/ContourField.css",o.textContent=`.contour-field-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
`,document.head.appendChild(o)}var b=(o)=>{let s=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(o);if(!s)return[1,1,1];return[parseInt(s[1],16)/255,parseInt(s[2],16)/255,parseInt(s[3],16)/255]},he=(o)=>{if(o==="uniform")return 1;if(o==="alternating")return 2;return 0},pe=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,Ce=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uMorphAmount;
uniform float uBands;
uniform float uThickness;
uniform float uScale;
uniform float uPixelSize;
uniform float uGlow;
uniform float uColorMode;
uniform float uContrast;
uniform float uBrightness;
uniform float uFillBands;
uniform float uOpacity;
uniform vec3 uLow;
uniform vec3 uMid;
uniform vec3 uHigh;
uniform vec2 uMouse;
uniform float uMouseEnabled;
uniform float uMouseRadius;
uniform float uMouseStrength;
uniform float uMouseActive;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec4 uCtrlA;
uniform vec4 uCtrlB;
uniform vec4 uCtrlC;
uniform vec4 uCtrlD;
out vec4 fragColor;

float bez(float t, vec4 c) {
  float w = 6.2831853 * t;
  return 0.5 * (c.x * sin(w) + c.y * cos(w) + c.z * sin(2.0 * w) + c.w * cos(2.0 * w));
}

float field(vec2 uv) {
  vec2 a = vec2(bez(uv.x, uCtrlA), bez(uv.x, uCtrlB));
  vec2 b = vec2(bez(uv.y, uCtrlC), bez(uv.y, uCtrlD));
  return distance(a, b);
}

vec3 elevationColor(float e) {
  vec3 c = mix(uLow, uMid, smoothstep(0.0, 0.5, e));
  c = mix(c, uHigh, smoothstep(0.5, 1.0, e));
  return c;
}

void main() {
  vec2 res = iResolution.xy;
  vec2 uv = gl_FragCoord.xy / res;

  vec2 suv = (uv - 0.5) / max(uScale, 0.001) + 0.5;

  vec2 sampleUv = suv;
  if (uPixelSize > 1.0) {
    vec2 px = res / uPixelSize;
    sampleUv = (floor(suv * px) + 0.5) / px;
  }

  float fv = field(sampleUv);

  if (uMouseEnabled > 0.5) {
    vec2 d = uv - uMouse;
    d.x *= res.x / max(res.y, 1.0);
    float r = max(uMouseRadius, 0.001);
    float bump = exp(-dot(d, d) / (r * r)) * uMouseStrength * uMouseActive;
    fv += bump;
  }

  float f = fv * uBands;
  float frac = fract(f);
  float lineDist = min(frac, 1.0 - frac);

  float aa = fwidth(f) + 0.0001;
  float mask = 1.0 - smoothstep(uThickness - aa, uThickness + aa, lineDist);

  float glowR = uThickness + uGlow * 0.5 + aa;
  float glow = (1.0 - smoothstep(uThickness, glowR, lineDist)) * step(0.0001, uGlow);

  float elev = clamp(fv / (uMorphAmount * 2.5 + 0.001), 0.0, 1.0);

  vec3 lineCol;
  if (uColorMode < 0.5) {
    lineCol = elevationColor(elev);
  } else if (uColorMode < 1.5) {
    lineCol = uMid;
  } else {
    float parity = mod(floor(f), 2.0);
    lineCol = mix(uMid, uHigh, parity);
  }

  float coverage = clamp(mask + glow * 0.55, 0.0, 1.0);
  coverage = pow(coverage, max(uContrast, 0.001));

  vec3 outColor = lineCol;
  float outAlpha = coverage;

  if (uFillBands > 0.5) {
    vec3 fillCol = elevationColor(elev);
    float fillA = 0.1 * elev;
    outColor = mix(fillCol, lineCol, coverage);
    outAlpha = clamp(coverage + fillA, 0.0, 1.0);
  }

  if (uGrain > 0.5) {
    float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453);
    outAlpha += (g - 0.5) * uGrainIntensity;
  }

  outColor *= uBrightness;
  outColor = clamp(outColor, 0.0, 1.0);

  float a = clamp(outAlpha, 0.0, 1.0) * uOpacity;
  fragColor = vec4(outColor * a, a);
}
`,S=new WeakMap,ge=[[1,-2,3,-4],[9,-8,7,-6],[5,2,5,-5],[-1,-3,8,9]],Me=({lowColor:o="#5227FF",midColor:s="#FF9FFC",highColor:B="#FFFFFF",speed:R=0.35,morphAmount:T=3,morphSpeed:E=0.05,bands:G=2,thickness:z=0.01,scale:L=1,pixelSize:k=1,glow:I=0.5,colorMode:P="elevation",contrast:D=3,brightness:H=1,fillBands:O=!1,opacity:_=1,grain:U=!0,grainIntensity:V=0.05,mouseInteraction:W=!0,mouseRadius:q=0.3,mouseStrength:N=0.4,className:le=""})=>{let C=f.useRef(null);return f.useEffect(()=>{let t=C.current;if(!t)return;let r=new te({webgl:2,alpha:!0,premultipliedAlpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)}),u=r.gl;u.clearColor(0,0,0,0);let e=u.canvas;e.style.width="100%",e.style.height="100%",e.style.display="block",t.appendChild(e);let ae=new ne(u),i=new oe(u,{vertex:pe,fragment:Ce,uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uSpeed:{value:0.35},uMorphAmount:{value:3},uMorphSpeed:{value:0.05},uBands:{value:2},uThickness:{value:0.01},uScale:{value:1},uPixelSize:{value:1},uGlow:{value:0.5},uColorMode:{value:0},uContrast:{value:3},uBrightness:{value:1},uFillBands:{value:0},uOpacity:{value:1},uGrain:{value:1},uGrainIntensity:{value:0.05},uLow:{value:new Float32Array([1,1,1])},uMid:{value:new Float32Array([1,1,1])},uHigh:{value:new Float32Array([1,1,1])},uMouse:{value:new Float32Array([0.5,0.5])},uMouseEnabled:{value:1},uMouseRadius:{value:0.3},uMouseStrength:{value:0.4},uMouseActive:{value:0},uCtrlA:{value:new Float32Array([0,0,0,0])},uCtrlB:{value:new Float32Array([0,0,0,0])},uCtrlC:{value:new Float32Array([0,0,0,0])},uCtrlD:{value:new Float32Array([0,0,0,0])}}}),g=new ue(u,{geometry:ae,program:i});S.set(t,{renderer:r,program:i,mesh:g});let $=()=>{let n=t.getBoundingClientRect(),l=Math.max(1,Math.floor(n.width)),a=Math.max(1,Math.floor(n.height));r.setSize(l,a);let d=i.uniforms.iResolution.value;d[0]=u.drawingBufferWidth,d[1]=u.drawingBufferHeight,r.render({scene:g})},X=new ResizeObserver($);X.observe(t),$();let c=[0.5,0.5],m=[0.5,0.5],M=0,w=0,Y=(n)=>{let l=e.getBoundingClientRect();m[0]=(n.clientX-l.left)/l.width,m[1]=1-(n.clientY-l.top)/l.height,w=1},J=()=>{w=0};e.addEventListener("mousemove",Y),e.addEventListener("mouseleave",J);let re=[i.uniforms.uCtrlA.value,i.uniforms.uCtrlB.value,i.uniforms.uCtrlC.value,i.uniforms.uCtrlD.value],v=0,y=!0,A=!document.hidden,ie=performance.now(),K=(n)=>{let l=(n-ie)*0.001,a=i.uniforms;a.iTime.value=l;let d=a.uMorphAmount.value,se=a.uSpeed.value,ce=a.uMorphSpeed.value;for(let h=0;h<4;h++){let ve=re[h],fe=ge[h];for(let p=0;p<4;p++){let j=fe[p];ve[p]=d*Math.sin(l*se*Math.sin(j*ce)+j)}}c[0]+=0.05*(m[0]-c[0]),c[1]+=0.05*(m[1]-c[1]),a.uMouse.value[0]=c[0],a.uMouse.value[1]=c[1],M+=0.05*(w-M),a.uMouseActive.value=M,r.render({scene:g}),v=requestAnimationFrame(K)},x=()=>{if(y&&A&&v===0)v=requestAnimationFrame(K)},F=()=>{if(v!==0)cancelAnimationFrame(v),v=0},Q=new IntersectionObserver(([n])=>{y=n.isIntersecting,y?x():F()},{threshold:0});Q.observe(t);let Z=()=>{A=!document.hidden,A?x():F()};return document.addEventListener("visibilitychange",Z),x(),()=>{F(),X.disconnect(),Q.disconnect(),document.removeEventListener("visibilitychange",Z),e.removeEventListener("mousemove",Y),e.removeEventListener("mouseleave",J),S.delete(t);try{t.removeChild(e)}catch{}u.getExtension("WEBGL_lose_context")?.loseContext()}},[]),f.useEffect(()=>{let t=C.current;if(!t)return;let r=S.get(t);if(!r)return;let{program:u}=r,e=u.uniforms;e.uSpeed.value=R,e.uMorphAmount.value=T,e.uMorphSpeed.value=E,e.uBands.value=G,e.uThickness.value=z,e.uScale.value=L,e.uPixelSize.value=k,e.uGlow.value=I,e.uColorMode.value=he(P),e.uContrast.value=D,e.uBrightness.value=H,e.uFillBands.value=O?1:0,e.uOpacity.value=_,e.uGrain.value=U?1:0,e.uGrainIntensity.value=V,e.uLow.value=new Float32Array(b(o)),e.uMid.value=new Float32Array(b(s)),e.uHigh.value=new Float32Array(b(B)),e.uMouseEnabled.value=W?1:0,e.uMouseRadius.value=q,e.uMouseStrength.value=N},[o,s,B,R,T,E,G,z,L,k,I,P,D,H,O,_,U,V,W,q,N]),ee("div",{ref:C,className:`contour-field-container ${le}`.trim()})},xe=Me;export{xe as default};
