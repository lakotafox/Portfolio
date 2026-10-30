import{D as Z,v as J,w as K,z as Q}from"./main-ghsx4cn4.js";import{E as oe,J as te,L as $}from"./main-jpng9c0t.js";var n=oe(te(),1);if(typeof document<"u"){let o=document.createElement("style");o.dataset.src="flux-pool/FluxPool.css",o.textContent=`.flux-pool-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
`,document.head.appendChild(o)}var Y=8,re=(o)=>{let u=o.replace("#","").padEnd(6,"0"),a=parseInt(u.slice(0,2),16)/255,c=parseInt(u.slice(2,4),16)/255,t=parseInt(u.slice(4,6),16)/255;return[a,c,t]},ne=(o)=>{let u=(o&&o.length?o:["#4F46E5","#06B6D4","#E0F2FE"]).slice(0,Y),a=u.length,c=[];for(let r=0;r<Y;r++)c.push(re(u[Math.min(r,u.length-1)]));let t=[0,0,0];for(let r=0;r<a;r++)t[0]+=c[r][0],t[1]+=c[r][1],t[2]+=c[r][2];return t[0]/=a,t[1]/=a,t[2]/=a,{arr:c,count:a,avg:t}},le=(o)=>{switch(o){case"up":return[0,1];case"down":return[0,-1];case"left":return[-1,0];case"right":return[1,0];default:return[0,-1]}},ue=`
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`,ae=`
precision highp float;

uniform vec3  iResolution;
uniform vec2  iMouse;
uniform float iTime;

uniform vec3  uColor0;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform vec3  uColor4;
uniform vec3  uColor5;
uniform vec3  uColor6;
uniform vec3  uColor7;
uniform int   uColorCount;

uniform vec3  uMouseColor;
uniform vec2  uFlow;
uniform float uSpeed;
uniform float uScale;
uniform float uTurbulence;
uniform float uFluidity;
uniform float uRimWidth;
uniform float uSharpness;
uniform float uShimmer;
uniform float uGlow;
uniform float uOpacity;
uniform float uMouseEnabled;
uniform float uMouseStrength;
uniform float uMouseRadius;

varying vec2 vUv;

#define PI 3.14159265

vec3 palette(float h) {
  int count = uColorCount;
  if (count < 1) count = 1;
  int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
  if (idx <= 0) return uColor0;
  if (idx == 1) return uColor1;
  if (idx == 2) return uColor2;
  if (idx == 3) return uColor3;
  if (idx == 4) return uColor4;
  if (idx == 5) return uColor5;
  if (idx == 6) return uColor6;
  return uColor7;
}

float hash(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float smin(float a, float b, float k) {
  float r = exp2(-a / k) + exp2(-b / k);
  return -k * log2(r);
}

float sinlerp(float a, float b, float w) {
  return mix(a, b, (sin(w * PI - PI / 2.0) + 1.0) / 2.0);
}

float vn(vec2 p, float s, float seed) {
  vec2 cellp = floor(p / s);
  vec2 relp = mod(p, s);
  float g1 = hash(vec3(cellp, seed));
  float g2 = hash(vec3(cellp.x + 1.0, cellp.y, seed));
  float g3 = hash(vec3(cellp.x + 1.0, cellp.y + 1.0, seed));
  float g4 = hash(vec3(cellp.x, cellp.y + 1.0, seed));
  float bx = sinlerp(g1, g2, relp.x / s);
  float tx = sinlerp(g4, g3, relp.x / s);
  return sinlerp(bx, tx, relp.y / s);
}

float dbn(vec2 p, float s, float seed) {
  float o = s / 2.0;
  float n0 = vn(p, s, seed);
  float n1 = vn(p + vec2(o, o), s, seed + 0.1);
  float n2 = vn(p + vec2(-o, o), s, seed + 0.2);
  float n3 = vn(p + vec2(o, -o), s, seed + 0.3);
  float n4 = vn(p + vec2(-o, -o), s, seed + 0.4);
  return (2.0 * n0 + 1.5 * n1 + 1.25 * n2 + 1.125 * n3 + n4) / 7.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  float ref = 700.0 / max(uScale, 0.05);
  vec2 p = fragCoord / iResolution.y * ref;

  float spd = 200.0 * uSpeed;
  float t = iTime;

  vec2 dir = uFlow;
  vec2 perp = vec2(-dir.y, dir.x);

  float distort1 = vn(p + perp * (t * spd), 60.0, 10.0) * 50.0 * uTurbulence;
  float distort2 = vn(p - perp * (t * spd), 120.0, 15.0) * 100.0 * uTurbulence;

  float peaks = dbn(p + distort1 + dir * (t * spd * 0.5), 40.0, 1.0);
  float peaks2 = dbn(p + distort2 - dir * (t * spd * 0.5), 40.0, 0.0);

  float mapeaks = smin(peaks, peaks2, max(uFluidity, 0.001));

  float mGlow = 0.0;
  if (uMouseEnabled > 0.5) {
    vec2 mp = iMouse / iResolution.y * ref;
    float md = length(p - mp) / ref;
    float rr = max(uMouseRadius, 0.02);
    mGlow = exp(-md * md / (rr * rr)) * uMouseStrength;
  }

  float band = (uRimWidth - abs((mapeaks - 0.4) * 2.0)) * 5.0;
  float ltn = clamp(band - vn(p + dir * (t * spd * 0.5), 60.0, 12.0) * uShimmer, 0.0, 1.0);
  ltn = pow(ltn, uSharpness) * uGlow;
  ltn *= clamp(1.0 - mGlow, 0.0, 1.0);

  float h = clamp(0.5 + (peaks - peaks2) * 0.8, 0.0, 1.0);
  vec3 col = palette(h);

  vec3 outc = col * ltn;
  float a = clamp(max(outc.r, max(outc.g, outc.b)), 0.0, 1.0);
  fragColor = vec4(outc, a * uOpacity);
}

void main() {
  vec4 color;
  mainImage(color, vUv * iResolution.xy);
  gl_FragColor = color;
}
`,ce=({className:o,dpr:u,paused:a=!1,colors:c=["#ffffff","#ffffff","#ffffff"],speed:t=0.5,scale:r=1.6,turbulence:k=1,fluidity:E=0.1,rimWidth:T=0.2,sharpness:P=2.5,shimmer:B=1.5,glow:G=2,flowDirection:I="down",opacity:O=1,mouseInteraction:w=!0,mouseStrength:z=1,mouseRadius:A=0.35,mouseDampening:y=0.15,mixBlendMode:U})=>{let W=n.useRef(null),R=n.useRef(null),b=n.useRef(null),m=n.useRef(null),F=n.useRef(null),S=n.useRef(null),L=n.useRef([0,0]),h=n.useRef(0);return n.useEffect(()=>{let p=W.current;if(!p)return;let g=new K({dpr:u??(typeof window<"u"?window.devicePixelRatio||1:1),alpha:!0,antialias:!0});S.current=g;let f=g.gl,s=f.canvas;f.clearColor(0,0,0,0),s.style.width="100%",s.style.height="100%",s.style.display="block",p.appendChild(s);let{arr:v,count:D,avg:j}=ne(c),C={iResolution:{value:[f.drawingBufferWidth,f.drawingBufferHeight,1]},iMouse:{value:[0,0]},iTime:{value:0},uColor0:{value:v[0]},uColor1:{value:v[1]},uColor2:{value:v[2]},uColor3:{value:v[3]},uColor4:{value:v[4]},uColor5:{value:v[5]},uColor6:{value:v[6]},uColor7:{value:v[7]},uColorCount:{value:D},uMouseColor:{value:j},uFlow:{value:le(I)},uSpeed:{value:t},uScale:{value:r},uTurbulence:{value:k},uFluidity:{value:E},uRimWidth:{value:T},uSharpness:{value:P},uShimmer:{value:B},uGlow:{value:G},uOpacity:{value:O},uMouseEnabled:{value:w?1:0},uMouseStrength:{value:z},uMouseRadius:{value:A}},_=new J(f,{vertex:ue,fragment:ae,uniforms:C});b.current=_;let q=new Z(f);F.current=q;let ee=new Q(f,{geometry:q,program:_});m.current=ee;let H=()=>{let e=p.getBoundingClientRect();g.setSize(e.width,e.height),C.iResolution.value=[f.drawingBufferWidth,f.drawingBufferHeight,1]};H();let X=new ResizeObserver(H);X.observe(p);let N=(e)=>{let l=s.getBoundingClientRect(),d=g.dpr||1,i=(e.clientX-l.left)*d,x=(l.height-(e.clientY-l.top))*d;if(L.current=[i,x],y<=0)C.iMouse.value=[i,x]};if(w)s.addEventListener("pointermove",N);let V=(e)=>{if(R.current=requestAnimationFrame(V),C.iTime.value=e*0.001,y>0){if(!h.current)h.current=e;let l=(e-h.current)/1000;h.current=e;let d=Math.max(0.0001,y),i=1-Math.exp(-l/d);if(i>1)i=1;let x=L.current,M=C.iMouse.value;M[0]+=(x[0]-M[0])*i,M[1]+=(x[1]-M[1])*i}else h.current=e;if(!a&&b.current&&m.current)try{g.render({scene:m.current})}catch(l){console.error(l)}};return R.current=requestAnimationFrame(V),()=>{if(R.current)cancelAnimationFrame(R.current);if(w)s.removeEventListener("pointermove",N);if(X.disconnect(),s.parentElement===p)p.removeChild(s);let e=(l,d)=>{let i=l&&l[d];if(typeof i==="function")i.call(l)};e(b.current,"remove"),e(F.current,"remove"),e(m.current,"remove"),e(S.current,"destroy"),b.current=null,F.current=null,m.current=null,S.current=null}},[u,a,c,t,r,k,E,T,P,B,G,I,O,w,z,A,y]),$("div",{ref:W,className:`flux-pool-container ${o??""}`,style:{...U&&{mixBlendMode:U}}})},ve=ce;export{ve as default};
