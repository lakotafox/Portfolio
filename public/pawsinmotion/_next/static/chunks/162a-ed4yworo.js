(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,31,e=>{"use strict";var u=e.i(41929),t=e.i(49456),a=e.i(26881),l=e.i(36048),o=e.i(81484),r=e.i(63617),s=e.i(46308);let n=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,i=`
precision highp float;
varying vec2 vUv;

uniform float uTime;
uniform vec2 uRes;
uniform float uSpeed;
uniform float uScale;
uniform int uIter;
uniform float uCosFreq;
uniform float uCosAmp;
uniform float uSinAmp;
uniform float uModRate;
uniform float uModDepth;
uniform vec3 uPalBase;
uniform vec3 uPalAmp;
uniform vec3 uPalPhase;
uniform float uOutScale;
uniform vec3 uBg;
uniform float uAlpha;
uniform vec2 uPointer;
uniform float uCursorActive;
uniform float uCursorIntensity;

const float TAU = 6.2831853;
const float HALF_PI = 1.5707963;

vec3 palette(float t, vec3 base, vec3 amp, vec3 phase) {
  return base + amp * cos(TAU * (t + phase));
}

void main() {
  vec2 st = vUv * uScale;
  float t = uTime * uSpeed;

  vec2 pointerUv = uPointer * uScale;
  float cursorDist = length(st - pointerUv);
  float cursorInfluence = smoothstep(4.0, 0.0, cursorDist) * uCursorActive * uCursorIntensity;

  float localCosAmp = uCosAmp + cursorInfluence * 0.12;
  float localSinAmp = uSinAmp + cursorInfluence * 0.15;
  float localModDepth = uModDepth + cursorInfluence * 0.8;

  for (int i = 0; i < 10; i++) {
    if (i >= uIter) break;
    st += cos(st.yx * uCosFreq + vec2(t, HALF_PI)) * localCosAmp;
    st += sin(st.yx + t + vec2(HALF_PI, sin(uModRate * t + st.x * localModDepth))) * localSinAmp;
  }

  st /= uOutScale;

  vec3 col = palette(st.x, uPalBase, uPalAmp, uPalPhase);

  col += cursorInfluence * 0.03;

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 result = mix(uBg, col, clamp(lum * 4.0, 0.0, 1.0));

  gl_FragColor = vec4(result, uAlpha);
}
`,c=({speed:e,scale:a,iterations:r,cosFrequency:c,cosAmplitude:m,sinAmplitude:v,modulationRate:f,modulationDepth:p,paletteBaseR:d,paletteBaseG:h,paletteBaseB:A,paletteAmpR:P,paletteAmpG:S,paletteAmpB:g,palettePhaseR:C,palettePhaseG:I,palettePhaseB:x,outputScale:y,bgRgb:B,opacity:R,pointer:M,cursorInteraction:w,cursorIntensity:T})=>{let b=(0,t.useRef)(null),{size:F,viewport:U}=(0,o.useThree)(),j=(0,t.useRef)(new s.Vector2(.5,.5)),D=(0,t.useMemo)(()=>({uTime:{value:0},uRes:{value:new s.Vector2(1,1)},uSpeed:{value:e},uScale:{value:a},uIter:{value:r},uCosFreq:{value:c},uCosAmp:{value:m},uSinAmp:{value:v},uModRate:{value:f},uModDepth:{value:p},uPalBase:{value:new s.Vector3(d,h,A)},uPalAmp:{value:new s.Vector3(P,S,g)},uPalPhase:{value:new s.Vector3(C,I,x)},uOutScale:{value:y},uBg:{value:new s.Vector3(...B)},uAlpha:{value:R},uPointer:{value:new s.Vector2(.5,.5)},uCursorActive:{value:0},uCursorIntensity:{value:1}}),[]);return(0,l.useFrame)((u,t)=>{if(!b.current)return;let l=b.current.material;l.uniforms.uTime.value=u.clock.elapsedTime,l.uniforms.uRes.value.set(F.width*U.dpr,F.height*U.dpr),l.uniforms.uSpeed.value=e,l.uniforms.uScale.value=a,l.uniforms.uIter.value=r,l.uniforms.uCosFreq.value=c,l.uniforms.uCosAmp.value=m,l.uniforms.uSinAmp.value=v,l.uniforms.uModRate.value=f,l.uniforms.uModDepth.value=p,l.uniforms.uPalBase.value.set(d,h,A),l.uniforms.uPalAmp.value.set(P,S,g),l.uniforms.uPalPhase.value.set(C,I,x),l.uniforms.uOutScale.value=y,l.uniforms.uBg.value.set(...B),l.uniforms.uAlpha.value=R,l.uniforms.uCursorActive.value=+!!w,l.uniforms.uCursorIntensity.value=T;let o=1-Math.exp(-t/.15);j.current.x+=(M[0]-j.current.x)*o,j.current.y+=(M[1]-j.current.y)*o,l.uniforms.uPointer.value.set(j.current.x,j.current.y)}),(0,u.jsxs)("mesh",{ref:b,children:[(0,u.jsx)("planeGeometry",{args:[2,2]}),(0,u.jsx)("shaderMaterial",{vertexShader:n,fragmentShader:i,uniforms:D,transparent:!0})]})},m=({width:e="100%",height:l="100%",className:o,children:s,speed:n=.5,scale:i=7,iterations:m=5,cosFrequency:v=3,cosAmplitude:f=.25,sinAmplitude:p=.35,modulationRate:d=.1,modulationDepth:h=2,paletteBaseR:A=.75,paletteBaseG:P=.1,paletteBaseB:S=.55,paletteAmpR:g=.3,paletteAmpG:C=.35,paletteAmpB:I=.1,palettePhaseR:x=.3,palettePhaseG:y=.15,palettePhaseB:B=.2,outputScale:R=10,backgroundColor:M="#000000",opacity:w=1,cursorInteraction:T=!1,cursorIntensity:b=1})=>{let F=(0,t.useMemo)(()=>{let e;return(e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(M))?[parseInt(e[1],16)/255,parseInt(e[2],16)/255,parseInt(e[3],16)/255]:[0,0,0]},[M]),U=(0,t.useRef)(null),[j,D]=(0,t.useState)([.5,.5]),V=(0,t.useCallback)(e=>{if(!T)return;let u=U.current?.getBoundingClientRect();u&&D([(e.clientX-u.left)/u.width,1-(e.clientY-u.top)/u.height])},[T]);return(0,u.jsxs)("div",{ref:U,className:(0,r.cn)("relative overflow-hidden",o),style:{width:e,height:l,backgroundColor:M},onPointerMove:V,children:[(0,u.jsx)(a.Canvas,{className:"absolute inset-0 h-full w-full",orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},gl:{antialias:!0,alpha:!0},children:(0,u.jsx)(c,{speed:n,scale:i,iterations:m,cosFrequency:v,cosAmplitude:f,sinAmplitude:p,modulationRate:d,modulationDepth:h,paletteBaseR:A,paletteBaseG:P,paletteBaseB:S,paletteAmpR:g,paletteAmpG:C,paletteAmpB:I,palettePhaseR:x,palettePhaseG:y,palettePhaseB:B,outputScale:R,bgRgb:F,opacity:w,pointer:j,cursorInteraction:T,cursorIntensity:b})}),s&&(0,u.jsx)("div",{className:"pointer-events-none relative z-10",children:s})]})};m.displayName="SwirlBlend",e.s(["default",0,m])}]);