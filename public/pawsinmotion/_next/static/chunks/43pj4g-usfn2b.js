(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,75825,e=>{"use strict";var u=e.i(41929),t=e.i(49456),r=e.i(26881),a=e.i(36048),o=e.i(81484),n=e.i(63617),i=e.i(46308);let l=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,s=`
precision highp float;
varying vec2 vUv;

uniform float uTime;
uniform vec2  uRes;
uniform float uSpeed;
uniform float uZoom;
uniform int   uIter;
uniform float uEps;
uniform float uTangent;
uniform float uGrad;
uniform vec3  uPhase;
uniform float uRange;
uniform float uBias;
uniform float uBright;
uniform vec3  uBg;
uniform float uAlpha;
uniform vec2  uPointer;
uniform float uCursorActive;
uniform float uCursorIntensity;

float wave(vec2 p, float t) {
  return sin(p.x + sin(p.y + t * 0.1)) * sin(p.y * p.x * 0.1 + t * 0.2);
}

vec2 flow(vec2 p, float t) {
  vec2 ep = vec2(uEps, 0.0);
  vec2 out_v = vec2(0.0);
  for (int i = 0; i < 12; i++) {
    if (i >= uIter) break;
    float s0 = wave(p, t);
    float sx = wave(p + ep, t);
    float sy = wave(p + ep.yx, t);
    vec2 g = vec2(sx - s0, sy - s0) / ep.xx;
    vec2 tang = vec2(-g.y, g.x);
    p += uTangent * tang + g * uGrad;
    out_v = tang;
  }
  return out_v;
}

void main() {
  vec2 st = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * uZoom;
  float t = uTime * uSpeed;

  vec2 pointerUv = (uPointer - 0.5) * vec2(uRes.x / uRes.y, 1.0) * uZoom;
  float cursorDist = length(st - pointerUv);
  float cursorInfluence = smoothstep(3.0, 0.0, cursorDist) * uCursorActive * uCursorIntensity;

  vec2 ep = vec2(uEps, 0.0);
  vec2 p = st;
  vec2 out_v = vec2(0.0);
  float localTangent = uTangent + cursorInfluence * 0.5;
  float localGrad = uGrad + cursorInfluence * 0.1;
  for (int i = 0; i < 12; i++) {
    if (i >= uIter) break;
    float s0 = wave(p, t);
    float sx = wave(p + ep, t);
    float sy = wave(p + ep.yx, t);
    vec2 g = vec2(sx - s0, sy - s0) / ep.xx;
    vec2 tang = vec2(-g.y, g.x);
    p += localTangent * tang + g * localGrad;
    out_v = tang;
  }

  float val = out_v.x - out_v.y;
  vec3 col = sin(uPhase + val) * uRange + uBias;
  col *= uBright;

  col += cursorInfluence * 0.06 * uBright;

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 result = mix(uBg, col, clamp(lum * 4.0, 0.0, 1.0));

  gl_FragColor = vec4(result, uAlpha);
}
`,v=({speed:e,zoom:r,iterations:n,sampleGap:v,tangentForce:c,gradientForce:f,colorPhaseR:m,colorPhaseG:p,colorPhaseB:g,colorRange:h,colorBias:d,brightness:x,bgRgb:y,opacity:R,pointer:w,cursorInteraction:B,cursorIntensity:I})=>{let T=(0,t.useRef)(null),{size:P,viewport:C}=(0,o.useThree)(),b=(0,t.useRef)(new i.Vector2(.5,.5)),A=(0,t.useMemo)(()=>({uTime:{value:0},uRes:{value:new i.Vector2(1,1)},uSpeed:{value:e},uZoom:{value:r},uIter:{value:n},uEps:{value:v},uTangent:{value:c},uGrad:{value:f},uPhase:{value:new i.Vector3(m,p,g)},uRange:{value:h},uBias:{value:d},uBright:{value:x},uBg:{value:new i.Vector3(...y)},uAlpha:{value:R},uPointer:{value:new i.Vector2(.5,.5)},uCursorActive:{value:0},uCursorIntensity:{value:1}}),[]);return(0,a.useFrame)((u,t)=>{if(!T.current)return;let a=T.current.material;a.uniforms.uTime.value=u.clock.elapsedTime,a.uniforms.uRes.value.set(P.width*C.dpr,P.height*C.dpr),a.uniforms.uSpeed.value=e,a.uniforms.uZoom.value=r,a.uniforms.uIter.value=n,a.uniforms.uEps.value=v,a.uniforms.uTangent.value=c,a.uniforms.uGrad.value=f,a.uniforms.uPhase.value.set(m,p,g),a.uniforms.uRange.value=h,a.uniforms.uBias.value=d,a.uniforms.uBright.value=x,a.uniforms.uBg.value.set(...y),a.uniforms.uAlpha.value=R,a.uniforms.uCursorActive.value=+!!B,a.uniforms.uCursorIntensity.value=I;let o=1-Math.exp(-t/.15);b.current.x+=(w[0]-b.current.x)*o,b.current.y+=(w[1]-b.current.y)*o,a.uniforms.uPointer.value.set(b.current.x,b.current.y)}),(0,u.jsxs)("mesh",{ref:T,children:[(0,u.jsx)("planeGeometry",{args:[2,2]}),(0,u.jsx)("shaderMaterial",{vertexShader:l,fragmentShader:s,uniforms:A,transparent:!0})]})},c=({width:e="100%",height:a="100%",className:o,children:i,speed:l=1,zoom:s=6,iterations:c=12,sampleGap:f=.095,tangentForce:m=.75,gradientForce:p=.15,colorPhaseR:g=3.11,colorPhaseG:h=3.11,colorPhaseB:d=3.11,colorRange:x=.75,colorBias:y=.5,brightness:R=1,backgroundColor:w="#000000",opacity:B=1,cursorInteraction:I=!1,cursorIntensity:T=1})=>{let P=(0,t.useMemo)(()=>{let e;return(e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(w))?[parseInt(e[1],16)/255,parseInt(e[2],16)/255,parseInt(e[3],16)/255]:[0,0,0]},[w]),C=(0,t.useRef)(null),[b,A]=(0,t.useState)([.5,.5]),G=(0,t.useCallback)(e=>{if(!I)return;let u=C.current?.getBoundingClientRect();u&&A([(e.clientX-u.left)/u.width,1-(e.clientY-u.top)/u.height])},[I]);return(0,u.jsxs)("div",{ref:C,className:(0,n.cn)("relative overflow-hidden",o),style:{width:e,height:a,backgroundColor:w},onPointerMove:G,children:[(0,u.jsx)(r.Canvas,{className:"absolute inset-0 h-full w-full",orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},gl:{antialias:!0,alpha:!0},children:(0,u.jsx)(v,{speed:l,zoom:s,iterations:c,sampleGap:f,tangentForce:m,gradientForce:p,colorPhaseR:g,colorPhaseG:h,colorPhaseB:d,colorRange:x,colorBias:y,brightness:R,bgRgb:P,opacity:B,pointer:b,cursorInteraction:I,cursorIntensity:T})}),i&&(0,u.jsx)("div",{className:"pointer-events-none relative z-10",children:i})]})};c.displayName="MetallicSwirl",e.s(["default",0,c])}]);