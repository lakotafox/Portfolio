(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,92166,e=>{"use strict";var u=e.i(41929),o=e.i(49456),r=e.i(26881),t=e.i(36048),a=e.i(81484),l=e.i(63617),i=e.i(46308);let n=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,s=`
precision highp float;
varying vec2 vUv;

uniform float uTime;
uniform vec2 uRes;
uniform float uSpeed;
uniform float uZoom;
uniform float uCount;
uniform float uOrbSize;
uniform float uGlow;
uniform float uContrast;
uniform float uSplits;
uniform bool uWarp;
uniform float uDistFade;
uniform vec3 uColorShift;
uniform float uColorRate;
uniform vec3 uBg;
uniform float uAlpha;
uniform vec2 uPointer;
uniform float uCursorActive;
uniform float uCursorIntensity;

const float TAU = 6.2831853;
const float PI = 3.14159265;

vec2 mirror(vec2 p, float seg) {
  float a = atan(p.y, p.x);
  a = ((a / PI) + 1.0) * 0.5;
  a = mod(a, 1.0 / seg) * seg;
  a = -abs(2.0 * a - 1.0) + 1.0;
  float r = length(p);
  a *= r;
  return vec2(a, r);
}

void main() {
  vec2 st = 2.0 * vUv - 1.0;
  st.x *= uRes.x / uRes.y;
  st *= uZoom;

  float dist = length(st);

  vec2 warpSt = uWarp ? st * mirror(st, uSplits) : st;

  vec2 pointerPos = (uPointer * 2.0 - 1.0) * vec2(uRes.x / uRes.y, 1.0) * uZoom;
  float cursorDist = length(st - pointerPos);
  float cursorInfluence = smoothstep(2.5, 0.0, cursorDist) * uCursorActive * uCursorIntensity;

  vec2 pullDir = normalize(pointerPos - warpSt + 0.001);
  warpSt += pullDir * cursorInfluence * 0.15;

  float localGlow = uGlow + cursorInfluence * uGlow * 0.5;
  float localDistFade = uDistFade + cursorInfluence * 0.08;

  vec3 acc = vec3(0.0);

  for (float i = 0.0; i < 30.0; i++) {
    if (i >= uCount) break;
    float t = uTime * uSpeed * 0.5 - i * PI / uCount * cos(uTime * uSpeed * 0.5 / max(i, 0.0001));
    vec2 orb = vec2(cos(t), sin(t)) / sin(i / uCount * PI / dist + uTime * uSpeed * 0.5);
    vec3 hue = cos(uColorShift * TAU / PI + PI * (uTime * uSpeed * 0.5 / (i + 1.0) * uColorRate)) * localGlow + localGlow;
    acc += dist * localDistFade / length(warpSt - orb * uOrbSize) * hue;
  }

  acc = pow(max(acc, 0.0), vec3(uContrast));

  acc += cursorInfluence * 0.03;

  float lum = dot(acc, vec3(0.299, 0.587, 0.114));
  vec3 result = mix(uBg, acc, clamp(lum * 6.0, 0.0, 1.0));

  gl_FragColor = vec4(result, uAlpha);
}
`,c=({speed:e,zoom:r,particleCount:l,orbSize:c,glow:f,contrast:v,mirrorSplits:m,warpEnabled:p,distanceFade:d,colorShiftR:h,colorShiftG:C,colorShiftB:S,colorSpeed:g,backgroundColor:w,opacity:x,pointer:I,cursorInteraction:b,cursorIntensity:y})=>{let R=(0,o.useRef)(null),{size:P}=(0,a.useThree)(),T=(0,o.useRef)(new i.Vector2(.5,.5)),A=(0,o.useMemo)(()=>({uTime:{value:0},uRes:{value:new i.Vector2(1,1)},uSpeed:{value:1},uZoom:{value:1.8},uCount:{value:13},uOrbSize:{value:.75},uGlow:{value:.08},uContrast:{value:3},uSplits:{value:2},uWarp:{value:!0},uDistFade:{value:.35},uColorShift:{value:new i.Vector3(-6,-6,-6)},uColorRate:{value:.2},uBg:{value:new i.Vector3(0,0,0)},uAlpha:{value:1},uPointer:{value:new i.Vector2(.5,.5)},uCursorActive:{value:0},uCursorIntensity:{value:1}}),[]);return(0,t.useFrame)((u,o)=>{if(!R.current)return;let t=R.current.material;t.uniforms.uTime.value=u.clock.elapsedTime,t.uniforms.uRes.value.set(P.width,P.height),t.uniforms.uSpeed.value=e,t.uniforms.uZoom.value=r,t.uniforms.uCount.value=l,t.uniforms.uOrbSize.value=c,t.uniforms.uGlow.value=f,t.uniforms.uContrast.value=v,t.uniforms.uSplits.value=m,t.uniforms.uWarp.value=p,t.uniforms.uDistFade.value=d,t.uniforms.uColorShift.value.set(h,C,S),t.uniforms.uColorRate.value=g;let a=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(w);a&&t.uniforms.uBg.value.set(parseInt(a[1],16)/255,parseInt(a[2],16)/255,parseInt(a[3],16)/255),t.uniforms.uAlpha.value=x,t.uniforms.uCursorActive.value=+!!b,t.uniforms.uCursorIntensity.value=y;let i=1-Math.exp(-o/.15);T.current.x+=(I[0]-T.current.x)*i,T.current.y+=(I[1]-T.current.y)*i,t.uniforms.uPointer.value.set(T.current.x,T.current.y)}),(0,u.jsxs)("mesh",{ref:R,children:[(0,u.jsx)("planeGeometry",{args:[2,2]}),(0,u.jsx)("shaderMaterial",{vertexShader:n,fragmentShader:s,uniforms:A,transparent:!0})]})},f=({width:e="100%",height:t="100%",className:a,children:i,speed:n=1,zoom:s=1.8,particleCount:f=13,orbSize:v=.75,glow:m=.08,contrast:p=3,mirrorSplits:d=2,warpEnabled:h=!0,distanceFade:C=.35,colorShiftR:S=-6,colorShiftG:g=-6,colorShiftB:w=-6,colorSpeed:x=.2,backgroundColor:I="#000000",opacity:b=1,cursorInteraction:y=!1,cursorIntensity:R=1})=>{let P=(0,o.useRef)(null),[T,A]=(0,o.useState)([.5,.5]),D=(0,o.useCallback)(e=>{if(!y)return;let u=P.current?.getBoundingClientRect();u&&A([(e.clientX-u.left)/u.width,1-(e.clientY-u.top)/u.height])},[y]);return(0,u.jsxs)("div",{ref:P,className:(0,l.cn)("relative overflow-hidden",a),style:{width:e,height:t},onPointerMove:D,children:[(0,u.jsx)(r.Canvas,{className:"absolute inset-0",gl:{antialias:!0,alpha:!0},orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},children:(0,u.jsx)(c,{speed:n,zoom:s,particleCount:f,orbSize:v,glow:m,contrast:p,mirrorSplits:d,warpEnabled:h,distanceFade:C,colorShiftR:S,colorShiftG:g,colorShiftB:w,colorSpeed:x,backgroundColor:I,opacity:b,pointer:T,cursorInteraction:y,cursorIntensity:R})}),i&&(0,u.jsx)("div",{className:"relative z-10",children:i})]})};f.displayName="BlackHole",e.s(["default",0,f])}]);