import{D as V,v as J,w as K,z as Q}from"./main-ghsx4cn4.js";import{E as te,J as ne,L as $}from"./main-jpng9c0t.js";var u=te(ne(),1);if(typeof document<"u"){let n=document.createElement("style");n.dataset.src="neon-downpour/NeonDownpour.css",n.textContent=`.neon-downpour-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
`,document.head.appendChild(n)}var X=8,j=(n)=>{let c=n.replace("#","").padEnd(6,"0"),l=parseInt(c.slice(0,2),16)/255,i=parseInt(c.slice(2,4),16)/255,o=parseInt(c.slice(4,6),16)/255;return[l,i,o]},ue=(n)=>{let c=(n&&n.length?n:["#A6C8FF","#5227FF","#FF9FFC"]).slice(0,X),l=c.length,i=[];for(let r=0;r<X;r++)i.push(j(c[Math.min(r,c.length-1)]));let o=[0,0,0];for(let r=0;r<l;r++)o[0]+=i[r][0],o[1]+=i[r][1],o[2]+=i[r][2];return o[0]/=l,o[1]/=l,o[2]/=l,{arr:i,count:l,avg:o}},ce=`
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`,le=`
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

uniform vec3  uBgColor;
uniform vec3  uMouseColor;
uniform float uSpeed;
uniform int   uStreakCount;
uniform float uStreakWidth;
uniform float uStreakLength;
uniform float uGlow;
uniform float uDensity;
uniform float uTwinkle;
uniform float uZoom;
uniform float uBgGlow;
uniform float uOpacity;
uniform float uMouseEnabled;
uniform float uMouseStrength;
uniform float uMouseRadius;

varying vec2 vUv;

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

vec3 tanhv(vec3 x) {
  vec3 e = exp(-2.0 * x);
  return (1.0 - e) / (1.0 + e);
}

vec2 sceneC(vec2 frag, vec2 r) {
  vec2 P = (frag + frag - r) / r.x;
  float z = 0.0;
  float d = 1e3;
  vec4 O = vec4(0.0);
  for (int k = 0; k < 39; k++) {
    if (d <= 1e-4) break;
    O = z * normalize(vec4(P, uZoom, 0.0)) - vec4(0.0, 4.0, 1.0, 0.0) / 4.5;
    d = 1.0 - sqrt(length(O * O));
    z += d;
  }
  return vec2(O.x, atan(O.z, O.y));
}

void mainImage(out vec4 o, vec2 C) {
  vec2 r = iResolution.xy;
  vec2 uv0 = (C + C - r) / r.x;
  float T = 0.1 * iTime * uSpeed + 9.0;
  float angRings = max(1.0, floor(6.28318530718 * max(uDensity, 0.05) + 0.5));
  vec2 Y = vec2(5e-3, 6.28318530718 / angRings);

  vec2 c0 = sceneC(C, r);
  vec2 cdx = sceneC(C + vec2(1.0, 0.0), r);
  vec2 cdy = sceneC(C + vec2(0.0, 1.0), r);
  vec2 dCx = cdx - c0;
  vec2 dCy = cdy - c0;
  dCx.y -= 6.28318530718 * floor(dCx.y / 6.28318530718 + 0.5);
  dCy.y -= 6.28318530718 * floor(dCy.y / 6.28318530718 + 0.5);
  vec2 fw = abs(dCx) + abs(dCy);
  C = c0;

  vec2 P = vec2(2.0, 1.0) * uv0 - (r / r.x) * vec2(0.0, 1.0);
  vec4 O = vec4(uBgColor * 90.0 * uBgGlow / (1e3 * dot(P, P) + 6.0), 0.0);

  float mGlow = 0.0;
  if (uMouseEnabled > 0.5) {
    vec2 mN = (iMouse + iMouse - r) / r.x;
    float md = length(uv0 - mN);
    mGlow = exp(-md * md / max(uMouseRadius * uMouseRadius, 1e-4)) * uMouseStrength;
    O.rgb += uMouseColor * mGlow * 0.25;
  }

  float zr = 5e-4 * uStreakWidth;
  vec2 rr = vec2(max(length(fw), 1e-5));
  float tail = 19.0 / max(uStreakLength, 0.05);

  for (int m = 0; m < 16; m++) {
    if (m >= uStreakCount) break;
    float jf = float(m) + 1.0;
    float ic = fract(sin(dot(vec2(jf, floor(C.x / Y.x + 0.5)), vec2(7.0, 11.0)) * 73.0));
    vec2 Pp = C - (T + T * ic) * vec2(0.0, 1.0);
    Pp -= floor(Pp / Y + 0.5) * Y;
    float h = fract(8663.0 * ic);
    vec3 col = palette(h);
    float weight = mix(1.5, 1.0 + sin(T + 7.0 * h + 4.0), uTwinkle);
    weight *= (1.0 + mGlow * 2.0);
    vec2 inner = vec2(length(max(Pp, vec2(-1.0, 0.0))), length(Pp) - zr) - zr;
    vec2 sm = vec2(1.0) - smoothstep(-rr, rr, inner);
    O.rgb += dot(sm, vec2(exp(tail * Pp.y), 3.0)) * col * weight;
    C.x += Y.x / 8.0;
  }

  vec3 colr = sqrt(tanhv(max(O.rgb * uGlow - vec3(0.04, 0.08, 0.02), 0.0)));
  o = vec4(colr, uOpacity);
}

void main() {
  vec4 color;
  mainImage(color, vUv * iResolution.xy);
  gl_FragColor = color;
}
`,ie=({className:n,dpr:c,paused:l=!1,colors:i=["#A6C8FF","#5227FF","#FF9FFC"],backgroundColor:o="#0A29FF",speed:r=0.5,streakCount:P=2,streakWidth:T=1,streakLength:b=1,glow:B=1,density:k=0.6,twinkle:z=1,zoom:G=3,backgroundGlow:E=0.5,opacity:A=1,mouseInteraction:w=!0,mouseStrength:Y=0.5,mouseRadius:L=1,mouseDampening:y=0.15,mixBlendMode:N})=>{let q=u.useRef(null),M=u.useRef(null),R=u.useRef(null),C=u.useRef(null),O=u.useRef(null),S=u.useRef(null),U=u.useRef([0,0]),g=u.useRef(0);return u.useEffect(()=>{let d=q.current;if(!d)return;let h=new K({dpr:c??(typeof window<"u"?window.devicePixelRatio||1:1),alpha:!0,antialias:!0});S.current=h;let v=h.gl,a=v.canvas;a.style.width="100%",a.style.height="100%",a.style.display="block",d.appendChild(a);let{arr:f,count:ee,avg:oe}=ue(i),p={iResolution:{value:[v.drawingBufferWidth,v.drawingBufferHeight,1]},iMouse:{value:[0,0]},iTime:{value:0},uColor0:{value:f[0]},uColor1:{value:f[1]},uColor2:{value:f[2]},uColor3:{value:f[3]},uColor4:{value:f[4]},uColor5:{value:f[5]},uColor6:{value:f[6]},uColor7:{value:f[7]},uColorCount:{value:ee},uBgColor:{value:j(o)},uMouseColor:{value:oe},uSpeed:{value:r},uStreakCount:{value:Math.max(1,Math.min(16,Math.round(P)))},uStreakWidth:{value:T},uStreakLength:{value:b},uGlow:{value:B},uDensity:{value:k},uTwinkle:{value:z},uZoom:{value:G},uBgGlow:{value:E},uOpacity:{value:A},uMouseEnabled:{value:w?1:0},uMouseStrength:{value:Y},uMouseRadius:{value:L}},W=new J(v,{vertex:ce,fragment:le,uniforms:p});R.current=W;let I=new V(v);O.current=I;let re=new Q(v,{geometry:I,program:W});C.current=re;let Z=()=>{let e=d.getBoundingClientRect();h.setSize(e.width,e.height),p.iResolution.value=[v.drawingBufferWidth,v.drawingBufferHeight,1]};Z();let _=new ResizeObserver(Z);_.observe(d);let D=(e)=>{let t=a.getBoundingClientRect(),s=h.dpr||1,m=(e.clientX-t.left)*s,x=(t.height-(e.clientY-t.top))*s;if(U.current=[m,x],y<=0)p.iMouse.value=[m,x]};if(w)a.addEventListener("pointermove",D);let H=(e)=>{if(M.current=requestAnimationFrame(H),p.iTime.value=e*0.001,y>0){if(!g.current)g.current=e;let t=(e-g.current)/1000;g.current=e;let s=Math.max(0.0001,y),m=1-Math.exp(-t/s);if(m>1)m=1;let x=U.current,F=p.iMouse.value;F[0]+=(x[0]-F[0])*m,F[1]+=(x[1]-F[1])*m}else g.current=e;if(!l&&R.current&&C.current)try{h.render({scene:C.current})}catch(t){console.error(t)}};return M.current=requestAnimationFrame(H),()=>{if(M.current)cancelAnimationFrame(M.current);if(w)a.removeEventListener("pointermove",D);if(_.disconnect(),a.parentElement===d)d.removeChild(a);let e=(t,s)=>{if(t&&typeof t[s]==="function")t[s].call(t)};e(R.current,"remove"),e(O.current,"remove"),e(C.current,"remove"),e(S.current,"destroy"),R.current=null,O.current=null,C.current=null,S.current=null}},[c,l,i,o,r,P,T,b,B,k,z,G,E,A,w,Y,L,y]),$("div",{ref:q,className:`neon-downpour-container ${n??""}`,style:{...N&&{mixBlendMode:N}}})},se=ie;export{se as default};
