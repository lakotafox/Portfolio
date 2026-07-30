(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,22693,e=>{"use strict";var u=e.i(41929),r=e.i(49456),o=e.i(26881),t=e.i(36048),n=e.i(81484),a=e.i(63617),l=e.i(46308);let i=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,s=`
precision highp float;

uniform float uTime;
uniform vec2 uRes;
uniform float uSpeed;
uniform float uDir;
uniform float uZoom;
uniform float uCount;
uniform float uIncr;
uniform float uAngle;
uniform float uWeight;
uniform float uContrast;
uniform vec3 uFg;
uniform vec3 uBg;
uniform float uFadeInner;
uniform float uFadeOuter;
uniform float uCoreGlow;
uniform float uCoreSize;
uniform float uAlpha;
uniform vec2 uPointer;
uniform float uCursorActive;
uniform float uCursorIntensity;

vec2 rotate2d(vec2 v, float a) {
  float c = cos(a), s = sin(a);
  return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

float frame(vec2 p, float ext) {
  vec2 g = abs(p) - ext;
  float e = length(max(g, 0.0));
  return step(e, 0.001 * uWeight);
}

void main() {
  vec2 coord = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 px = vec3(1.06);

  coord *= uZoom;
  coord = rotate2d(coord, uTime * uSpeed * uDir * 0.5);

  vec2 pointerPos = (uPointer - vec2(0.5)) * vec2(uRes.x / uRes.y, 1.0) * uZoom;
  vec2 rawCoord = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y * uZoom;
  float cursorDist = length(rawCoord - pointerPos);
  float cursorInfluence = smoothstep(0.4, 0.0, cursorDist) * uCursorActive * uCursorIntensity;

  float localAngle = uAngle + cursorInfluence * 0.08;
  float localWeight = uWeight + cursorInfluence * 1.5;

  float step_size = uIncr;
  for (float n = 0.0; n < 30.0; n += step_size) {
    if (n >= uCount) break;
    coord = rotate2d(coord, localAngle);
    float ext = 0.01 * n;
    px -= frame(coord, ext) * 0.0037 * localWeight;
  }

  px *= px * uContrast;

  float r = length(coord);
  px += smoothstep(uFadeInner, uFadeOuter, r);
  px += smoothstep(uCoreSize, 0.0, r) * uCoreGlow;

  px -= cursorInfluence * 0.06;

  px = clamp(px, 0.0, 1.0);

  float brightness = dot(px, vec3(0.299, 0.587, 0.114));
  vec3 tinted = mix(uFg, uBg, brightness);

  gl_FragColor = vec4(tinted, uAlpha);
}
`;function f(e){let u=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return u?[parseInt(u[1],16)/255,parseInt(u[2],16)/255,parseInt(u[3],16)/255]:[0,0,0]}let c=({speed:e,direction:o,zoom:a,layers:f,layerStep:c,twist:v,lineWeight:m,gamma:d,swirlRgb:g,bgRgb:p,vignetteStart:h,vignetteEnd:x,glowStrength:C,glowRadius:y,opacity:w,pointer:I,cursorInteraction:F,cursorIntensity:R})=>{let S=(0,r.useRef)(null),{size:A,viewport:b}=(0,n.useThree)(),P=(0,r.useRef)(new l.Vector2(.5,.5)),T=(0,r.useMemo)(()=>({uTime:{value:0},uRes:{value:new l.Vector2(1,1)},uSpeed:{value:e},uDir:{value:o},uZoom:{value:a},uCount:{value:f},uIncr:{value:c},uAngle:{value:v},uWeight:{value:m},uContrast:{value:d},uFg:{value:new l.Vector3(...g)},uBg:{value:new l.Vector3(...p)},uFadeInner:{value:h},uFadeOuter:{value:x},uCoreGlow:{value:C},uCoreSize:{value:y},uAlpha:{value:w},uPointer:{value:new l.Vector2(.5,.5)},uCursorActive:{value:0},uCursorIntensity:{value:1}}),[]);return(0,t.useFrame)((u,r)=>{if(!S.current)return;let t=S.current.material;t.uniforms.uTime.value=u.clock.elapsedTime,t.uniforms.uRes.value.set(A.width*b.dpr,A.height*b.dpr),t.uniforms.uSpeed.value=e,t.uniforms.uDir.value=o,t.uniforms.uZoom.value=a,t.uniforms.uCount.value=f,t.uniforms.uIncr.value=c,t.uniforms.uAngle.value=v,t.uniforms.uWeight.value=m,t.uniforms.uContrast.value=d,t.uniforms.uFg.value.set(...g),t.uniforms.uBg.value.set(...p),t.uniforms.uFadeInner.value=h,t.uniforms.uFadeOuter.value=x,t.uniforms.uCoreGlow.value=C,t.uniforms.uCoreSize.value=y,t.uniforms.uAlpha.value=w,t.uniforms.uCursorActive.value=+!!F,t.uniforms.uCursorIntensity.value=R;let n=1-Math.exp(-r/.15);P.current.x+=(I[0]-P.current.x)*n,P.current.y+=(I[1]-P.current.y)*n,t.uniforms.uPointer.value.set(P.current.x,P.current.y)}),(0,u.jsxs)("mesh",{ref:S,children:[(0,u.jsx)("planeGeometry",{args:[2,2]}),(0,u.jsx)("shaderMaterial",{vertexShader:i,fragmentShader:s,uniforms:T,transparent:!0})]})},v=({width:e="100%",height:t="100%",className:n,children:l,speed:i=1,direction:s=1,zoom:v=.32,layers:m=20,layerStep:d=.13,twist:g=.05,lineWeight:p=1,gamma:h=1,swirlColor:x="#5227FF",backgroundColor:C="#ffffff",vignetteStart:y=0,vignetteEnd:w=.47,glowStrength:I=.05,glowRadius:F=.05,opacity:R=1,cursorInteraction:S=!1,cursorIntensity:A=1})=>{let b=(0,r.useMemo)(()=>f(x),[x]),P=(0,r.useMemo)(()=>f(C),[C]),T=(0,r.useRef)(null),[j,z]=(0,r.useState)([.5,.5]),M=(0,r.useCallback)(e=>{if(!S)return;let u=T.current?.getBoundingClientRect();u&&z([(e.clientX-u.left)/u.width,1-(e.clientY-u.top)/u.height])},[S]);return(0,u.jsxs)("div",{ref:T,className:(0,a.cn)("relative overflow-hidden",n),style:{width:e,height:t,backgroundColor:C},onPointerMove:M,children:[(0,u.jsx)(o.Canvas,{className:"absolute inset-0 h-full w-full",orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},gl:{antialias:!0,alpha:!0},children:(0,u.jsx)(c,{speed:i,direction:s,zoom:v,layers:m,layerStep:d,twist:g,lineWeight:p,gamma:h,swirlRgb:b,bgRgb:P,vignetteStart:y,vignetteEnd:w,glowStrength:I,glowRadius:F,opacity:R,pointer:j,cursorInteraction:S,cursorIntensity:A})}),l&&(0,u.jsx)("div",{className:"pointer-events-none relative z-10",children:l})]})};v.displayName="SimpleSwirl",e.s(["default",0,v])}]);