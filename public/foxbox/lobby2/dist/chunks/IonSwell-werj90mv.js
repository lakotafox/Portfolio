import{s as M,t as P,u as V,v as j,w as y,x as z}from"./main-mznb6j68.js";import{C as g,H as s,J as G}from"./main-csjpdy0q.js";var K=g(s(),1);if(typeof document<"u"){let q=document.createElement("style");q.dataset.src="ion-swell/IonSwell.css",q.textContent=`.ion-swell-container {
  width: 100%;
  height: 100%;
}
`,document.head.appendChild(q)}function S(q){let U=parseInt(q.slice(1,3),16)/255,W=parseInt(q.slice(3,5),16)/255,X=parseInt(q.slice(5,7),16)/255;return[U,W,X]}var o=`
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,e=`
precision mediump float;
uniform float iTime;
uniform vec2  iResolution;
uniform vec2  uOffset;
uniform float uRotation;
uniform float uFocalLength;
uniform float uSpeed1;
uniform float uSpeed2;
uniform float uDir2;
uniform float uBend1;
uniform float uBend2;
uniform vec3  uColor1;
uniform vec3  uColor2;

const float lt   = 0.3;
const float pi   = 3.14159;
const float pi2  = 6.28318;
const float pi_2 = 1.5708;
#define MAX_STEPS 14

void mainImage(out vec4 C, in vec2 U) {
  float t = iTime * pi;
  float s = 1.0;
  float d = 0.0;
  vec2  R = iResolution;

  vec3 o = vec3(0.0, 0.0, -7.0);
  vec3 u = normalize(vec3((U - 0.5 * R) / R.y, uFocalLength));
  vec2 k = vec2(0.0);
  vec3 p;

  float t1 = t * 0.7;
  float t2 = t * 0.9;
  float tSpeed1 = t * uSpeed1;
  float tSpeed2 = t * uSpeed2 * uDir2;

  for (int i = 0; i < MAX_STEPS; ++i) {
    p = o + u * d;
    p.x -= 15.0;

    float px = p.x;
    float wob1 = uBend1 + sin(t1 + px * 0.8) * 0.1;
    float wob2 = uBend2 + cos(t2 + px * 1.1) * 0.1;

    float px2 = px + pi_2;
    vec2 sinOffset = sin(vec2(px, px2) + tSpeed1) * wob1;
    vec2 cosOffset = cos(vec2(px, px2) + tSpeed2) * wob2;

    vec2 yz = p.yz;
    float pxLt = px + lt;
    k.x = max(pxLt, length(yz - sinOffset) - lt);
    k.y = max(pxLt, length(yz - cosOffset) - lt);

    float current = min(k.x, k.y);
    s = min(s, current);
    if (s < 0.001 || d > 300.0) break;
    d += s * 0.7;
  }

  float sqrtD = sqrt(d);
  vec3 raw = max(cos(d * pi2) - s * sqrtD - vec3(k, 0.0), 0.0);
  raw.gb += 0.1;
  float maxC = max(raw.r, max(raw.g, raw.b));
  if (maxC < 0.15) discard;
  raw = raw * 0.4 + raw.brg * 0.6 + raw * raw;
  float lum = dot(raw, vec3(0.299, 0.587, 0.114));
  float w1 = max(0.0, 1.0 - k.x * 2.0);
  float w2 = max(0.0, 1.0 - k.y * 2.0);
  float wt = w1 + w2 + 0.001;
  vec3 c = (uColor1 * w1 + uColor2 * w2) / wt * lum * 3.5;
  C = vec4(c, 1.0);
}

void main() {
  vec2 coord = gl_FragCoord.xy + uOffset;
  coord -= 0.5 * iResolution;
  float c = cos(uRotation), s = sin(uRotation);
  coord = mat2(c, -s, s, c) * coord;
  coord += 0.5 * iResolution;

  vec4 color;
  mainImage(color, coord);
  gl_FragColor = color;
}
`;function r(q){let{xOffset:U=0,yOffset:W=0,rotationDeg:X=0,focalLength:L=0.8,speed1:I=0.05,speed2:O=0.05,dir2:T=1,bend1:b=1,bend2:d=0.5,colors:$=["#A855F7","#06B6D4"]}=q,k=K.useRef(q);k.current=q;let v=K.useRef(null);return K.useEffect(()=>{let H=v.current;if(!H)return;let J=new V({alpha:!0,dpr:Math.min(window.devicePixelRatio,1.5),antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1,powerPreference:"high-performance"}),C=J.gl;C.clearColor(0,0,0,0),H.appendChild(C.canvas);let u=new y(C),w=new j,h=new M(C,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])}}),Y=new Float32Array([U,W]),Z=new Float32Array([1,1]),x=S($[0]),R=S($[1]),B=new P(C,{vertex:o,fragment:e,uniforms:{iTime:{value:0},iResolution:{value:Z},uOffset:{value:Y},uRotation:{value:X*Math.PI/180},uFocalLength:{value:L},uSpeed1:{value:I},uSpeed2:{value:O},uDir2:{value:T},uBend1:{value:b},uBend2:{value:d},uColor1:{value:x},uColor2:{value:R}}});new z(C,{geometry:h,program:B}).setParent(w);function A(){if(!H)return;let{width:N,height:Q}=H.getBoundingClientRect();J.setSize(N,Q),Z[0]=N*J.dpr,Z[1]=Q*J.dpr,C.viewport(0,0,C.drawingBufferWidth,C.drawingBufferHeight)}let D=new ResizeObserver(A);D.observe(H),A();let c=performance.now(),_,E=(N)=>{let{xOffset:Q=0,yOffset:l=0,rotationDeg:i=0,focalLength:m=0.8,speed1:n=0.05,speed2:t=0.05,dir2:f=1,bend1:a=1,bend2:p=0.5,colors:F=["#A855F7","#06B6D4"]}=k.current;Y[0]=Q,Y[1]=l,B.uniforms.iTime.value=(N-c)*0.001,B.uniforms.uRotation.value=i*Math.PI/180,B.uniforms.uFocalLength.value=m,B.uniforms.uSpeed1.value=n,B.uniforms.uSpeed2.value=t,B.uniforms.uDir2.value=f,B.uniforms.uBend1.value=a,B.uniforms.uBend2.value=p,B.uniforms.uColor1.value=S(F[0]),B.uniforms.uColor2.value=S(F[1]),J.render({scene:w,camera:u}),_=requestAnimationFrame(E)};return _=requestAnimationFrame(E),()=>{if(cancelAnimationFrame(_),D.disconnect(),H&&C.canvas.parentNode===H)H.removeChild(C.canvas);C.getExtension("WEBGL_lose_context")?.loseContext()}},[]),G("div",{ref:v,className:"ion-swell-container"})}export{r as default};
