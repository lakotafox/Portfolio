import{D as K,v as $,w as k,z as J}from"./main-ghsx4cn4.js";import{E as ee,J as oe,L as Y}from"./main-jpng9c0t.js";var u=ee(oe(),1);if(typeof document<"u"){let r=document.createElement("style");r.dataset.src="shutter-glow/ShutterGlow.css",r.textContent=`.shutter-glow-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
`,document.head.appendChild(r)}var B=8,te=(r)=>{let t=r.replace("#","").padEnd(6,"0"),s=parseInt(t.slice(0,2),16)/255,m=parseInt(t.slice(2,4),16)/255,c=parseInt(t.slice(4,6),16)/255;return[s,m,c]},re=(r)=>{let t=(r&&r.length?r:["#FF9FFC","#5227FF"]).slice(0,B);if(t.length===1)t.push(t[0]);while(t.length<B)t.push(t[t.length-1]);let s=[];for(let c=0;c<B;c++)s.push(te(t[c]));let m=Math.max(2,Math.min(B,r?.length??2));return{arr:s,count:m}},ne=({className:r,dpr:t,paused:s=!1,gradientColors:m,angle:c=0,noise:E=0.3,blindCount:g=16,blindMinWidth:w=60,mouseDampening:M=0.15,mirrorGradient:I=!1,spotlightRadius:G=0.5,spotlightSoftness:O=1,spotlightOpacity:P=1,distortAmount:_=0,shineDirection:z="left",mixBlendMode:L="lighten"})=>{let N=u.useRef(null),R=u.useRef(null),y=u.useRef(null),h=u.useRef(null),F=u.useRef(null),T=u.useRef(null),A=u.useRef([0,0]),p=u.useRef(0),U=u.useRef(!0);return u.useEffect(()=>{let d=N.current;if(!d)return;let C=new k({dpr:t??(typeof window<"u"?window.devicePixelRatio||1:1),alpha:!0,antialias:!0});T.current=C;let l=C.gl,i=l.canvas;i.style.width="100%",i.style.height="100%",i.style.display="block",d.appendChild(i);let Q=`
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`,V=`
#ifdef GL_ES
precision mediump float;
#endif

uniform vec3  iResolution;
uniform vec2  iMouse;
uniform float iTime;

uniform float uAngle;
uniform float uNoise;
uniform float uBlindCount;
uniform float uSpotlightRadius;
uniform float uSpotlightSoftness;
uniform float uSpotlightOpacity;
uniform float uMirror;
uniform float uDistort;
uniform float uShineFlip;
uniform vec3  uColor0;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform vec3  uColor4;
uniform vec3  uColor5;
uniform vec3  uColor6;
uniform vec3  uColor7;
uniform int   uColorCount;

varying vec2 vUv;

float rand(vec2 co){
  return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
}

vec2 rotate2D(vec2 p, float a){
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c) * p;
}

vec3 getGradientColor(float t){
  float tt = clamp(t, 0.0, 1.0);
  int count = uColorCount;
  if (count < 2) count = 2;
  float scaled = tt * float(count - 1);
  float seg = floor(scaled);
  float f = fract(scaled);

  if (seg < 1.0) return mix(uColor0, uColor1, f);
  if (seg < 2.0 && count > 2) return mix(uColor1, uColor2, f);
  if (seg < 3.0 && count > 3) return mix(uColor2, uColor3, f);
  if (seg < 4.0 && count > 4) return mix(uColor3, uColor4, f);
  if (seg < 5.0 && count > 5) return mix(uColor4, uColor5, f);
  if (seg < 6.0 && count > 6) return mix(uColor5, uColor6, f);
  if (seg < 7.0 && count > 7) return mix(uColor6, uColor7, f);
  if (count > 7) return uColor7;
  if (count > 6) return uColor6;
  if (count > 5) return uColor5;
  if (count > 4) return uColor4;
  if (count > 3) return uColor3;
  if (count > 2) return uColor2;
  return uColor1;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv0 = fragCoord.xy / iResolution.xy;

    float aspect = iResolution.x / iResolution.y;
    vec2 p = uv0 * 2.0 - 1.0;
    p.x *= aspect;
    vec2 pr = rotate2D(p, uAngle);
    pr.x /= aspect;
    vec2 uv = pr * 0.5 + 0.5;

    vec2 uvMod = uv;
    if (uDistort > 0.0) {
      float a = uvMod.y * 6.0;
      float b = uvMod.x * 6.0;
      float w = 0.01 * uDistort;
      uvMod.x += sin(a) * w;
      uvMod.y += cos(b) * w;
    }
    float t = uvMod.x;
    if (uMirror > 0.5) {
      t = 1.0 - abs(1.0 - 2.0 * fract(t));
    }
    vec3 base = getGradientColor(t);

    vec2 offset = vec2(iMouse.x/iResolution.x, iMouse.y/iResolution.y);
  float d = length(uv0 - offset);
  float r = max(uSpotlightRadius, 1e-4);
  float dn = d / r;
  float spot = (1.0 - 2.0 * pow(dn, uSpotlightSoftness)) * uSpotlightOpacity;
  vec3 cir = vec3(spot);
  float stripe = fract(uvMod.x * max(uBlindCount, 1.0));
  if (uShineFlip > 0.5) stripe = 1.0 - stripe;
    vec3 ran = vec3(stripe);

    vec3 col = cir + base - ran;
    col += (rand(gl_FragCoord.xy + iTime) - 0.5) * uNoise;

    fragColor = vec4(col, 1.0);
}

void main() {
    vec4 color;
    mainImage(color, vUv * iResolution.xy);
    gl_FragColor = color;
}
`,{arr:a,count:Z}=re(m),f={iResolution:{value:[l.drawingBufferWidth,l.drawingBufferHeight,1]},iMouse:{value:[0,0]},iTime:{value:0},uAngle:{value:c*Math.PI/180},uNoise:{value:E},uBlindCount:{value:Math.max(1,g)},uSpotlightRadius:{value:G},uSpotlightSoftness:{value:O},uSpotlightOpacity:{value:P},uMirror:{value:I?1:0},uDistort:{value:_},uShineFlip:{value:z==="right"?1:0},uColor0:{value:a[0]},uColor1:{value:a[1]},uColor2:{value:a[2]},uColor3:{value:a[3]},uColor4:{value:a[4]},uColor5:{value:a[5]},uColor6:{value:a[6]},uColor7:{value:a[7]},uColorCount:{value:Z}},H=new $(l,{vertex:Q,fragment:V,uniforms:f});y.current=H;let b=new K(l);F.current=b;let j=new J(l,{geometry:b,program:H});h.current=j;let q=()=>{let o=d.getBoundingClientRect();if(C.setSize(o.width,o.height),f.iResolution.value=[l.drawingBufferWidth,l.drawingBufferHeight,1],w&&w>0){let e=Math.max(1,Math.floor(o.width/w)),n=g?Math.min(g,e):e;f.uBlindCount.value=Math.max(1,n)}else f.uBlindCount.value=Math.max(1,g);if(U.current){U.current=!1;let e=l.drawingBufferWidth/2,n=l.drawingBufferHeight/2;f.iMouse.value=[e,n],A.current=[e,n]}};q();let D=new ResizeObserver(q);D.observe(d);let X=(o)=>{let e=i.getBoundingClientRect(),n=C.dpr||1,v=(o.clientX-e.left)*n,x=(e.height-(o.clientY-e.top))*n;if(A.current=[v,x],M<=0)f.iMouse.value=[v,x]};i.addEventListener("pointermove",X);let W=(o)=>{if(R.current=requestAnimationFrame(W),f.iTime.value=o*0.001,M>0){if(!p.current)p.current=o;let e=(o-p.current)/1000;p.current=o;let n=Math.max(0.0001,M),v=1-Math.exp(-e/n);if(v>1)v=1;let x=A.current,S=f.iMouse.value;S[0]+=(x[0]-S[0])*v,S[1]+=(x[1]-S[1])*v}else p.current=o;if(!s&&y.current&&h.current)try{C.render({scene:h.current})}catch(e){console.error(e)}};return R.current=requestAnimationFrame(W),()=>{if(R.current)cancelAnimationFrame(R.current);if(i.removeEventListener("pointermove",X),D.disconnect(),i.parentElement===d)d.removeChild(i);let o=(e,n)=>{if(e&&typeof e[n]==="function")e[n].call(e)};o(y.current,"remove"),o(F.current,"remove"),o(h.current,"remove"),o(T.current,"destroy"),y.current=null,F.current=null,h.current=null,T.current=null}},[t,s,m,c,E,g,w,M,I,G,O,P,_,z]),Y("div",{ref:N,className:`shutter-glow-container ${r}`,style:{...L&&{mixBlendMode:L}}})},ce=ne;export{ce as default};
