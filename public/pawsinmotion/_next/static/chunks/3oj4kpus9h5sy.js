(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,13183,e=>{"use strict";var u=e.i(41929),r=e.i(49456),t=e.i(26881),i=e.i(36048),o=e.i(81484),a=e.i(63617),l=e.i(46308);let s=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,n=`
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uRes;
uniform float uGrid;
uniform float uSpeed;
uniform float uFreq;
uniform float uAmp;
uniform float uRadius;
uniform float uSoft;
uniform float uGap;
uniform float uPeak;
uniform float uBase;
uniform float uDrift;
uniform int uPreset;
uniform vec3 uColor;
uniform vec3 uBg;
uniform float uAlpha;
uniform vec2 uPointer;
uniform float uCursorActive;
uniform float uCursorIntensity;

float sdRounded(vec2 p, float r) {
  float circ = length(p);
  float box = max(abs(p.x), abs(p.y));
  return mix(box, circ, r);
}

float calcPhase(vec2 id, float t, vec2 origin) {
  if (uPreset == 0) {
    return length(id - origin) * uFreq - t * uSpeed;
  } else if (uPreset == 1) {
    vec2 d = id - origin;
    return (d.x + d.y) * uFreq * 0.7 - t * uSpeed;
  } else if (uPreset == 2) {
    return (id.x - origin.x) * uFreq - t * uSpeed;
  } else if (uPreset == 3) {
    return (id.y - origin.y) * uFreq - t * uSpeed;
  } else if (uPreset == 4) {
    vec2 d = id - origin;
    float angle = atan(d.y, d.x);
    float dist = length(d);
    return (angle * 2.0 + dist * 0.8) * uFreq - t * uSpeed;
  } else {
    float checker = mod(id.x + id.y, 2.0);
    return checker * 3.14159 + length(id - origin) * uFreq * 0.4 - t * uSpeed;
  }
}

void main() {
  float ar = uRes.x / uRes.y;
  vec2 coord = (vUv * 2.0 - 1.0) * vec2(ar, 1.0);

  vec2 scaled = coord * uGrid;
  vec2 cellId = floor(scaled);
  vec2 cellUv = fract(scaled) - 0.5;

  vec2 origin = vec2(0.0);
  float phase = calcPhase(cellId, uTime, origin);
  float wave = sin(phase);

  vec2 pointerGrid = (uPointer * 2.0 - 1.0) * vec2(ar, 1.0) * uGrid;
  float pointerDist = length(cellId - pointerGrid);
  float ripple = sin(pointerDist * 1.5 - uTime * 3.0) * smoothstep(8.0, 0.0, pointerDist) * uCursorActive * uCursorIntensity;

  cellUv += uDrift * wave;

  float dist = sdRounded(cellUv, uRadius);
  float sizeBoost = ripple * 0.1;
  float size = uGap + (1.0 - uGap) * (0.55 + 0.45 * wave + sizeBoost) * uAmp;
  dist -= size;
  float mask = smoothstep(uSoft, -uSoft, dist);

  float luma = uBase + (uPeak - uBase) * (0.7 + 0.3 * wave) + ripple * 0.15;
  vec3 fill = uColor * min(luma, 1.0) + max(luma - 1.0, 0.0);
  vec3 result = mix(uBg, fill, mask);

  gl_FragColor = vec4(result, uAlpha);
}
`;function f(e){let u=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return u?[parseInt(u[1],16)/255,parseInt(u[2],16)/255,parseInt(u[3],16)/255]:[0,0,0]}let c=({speed:e,gridSize:t,waveFrequency:a,waveAmplitude:f,cornerRadius:c,edgeSoftness:v,cellGap:d,peakBrightness:m,baseBrightness:p,centerDrift:h,preset:g,colorRgb:x,bgRgb:y,opacity:P,pointer:S,cursorInteraction:R,cursorIntensity:C})=>{let w=(0,r.useRef)(null),{size:B,viewport:A}=(0,o.useThree)(),b=(0,r.useRef)(new l.Vector2(.5,.5)),G=(0,r.useMemo)(()=>({uTime:{value:0},uRes:{value:new l.Vector2(1,1)},uGrid:{value:t},uSpeed:{value:e},uFreq:{value:a},uAmp:{value:f},uRadius:{value:c},uSoft:{value:v},uGap:{value:d},uPeak:{value:m},uBase:{value:p},uDrift:{value:h},uPreset:{value:Math.floor(g)},uColor:{value:new l.Vector3(...x)},uBg:{value:new l.Vector3(...y)},uAlpha:{value:P},uPointer:{value:new l.Vector2(.5,.5)},uCursorActive:{value:0},uCursorIntensity:{value:1}}),[]);return(0,i.useFrame)((u,r)=>{if(!w.current)return;let i=w.current.material;i.uniforms.uTime.value=u.clock.elapsedTime,i.uniforms.uRes.value.set(B.width*A.dpr,B.height*A.dpr),i.uniforms.uGrid.value=t,i.uniforms.uSpeed.value=e,i.uniforms.uFreq.value=a,i.uniforms.uAmp.value=f,i.uniforms.uRadius.value=c,i.uniforms.uSoft.value=v,i.uniforms.uGap.value=d,i.uniforms.uPeak.value=m,i.uniforms.uBase.value=p,i.uniforms.uDrift.value=h,i.uniforms.uPreset.value=Math.floor(g),i.uniforms.uColor.value.set(...x),i.uniforms.uBg.value.set(...y),i.uniforms.uAlpha.value=P,i.uniforms.uCursorActive.value=+!!R,i.uniforms.uCursorIntensity.value=C;let o=1-Math.exp(-r/.15);b.current.x+=(S[0]-b.current.x)*o,b.current.y+=(S[1]-b.current.y)*o,i.uniforms.uPointer.value.set(b.current.x,b.current.y)}),(0,u.jsxs)("mesh",{ref:w,children:[(0,u.jsx)("planeGeometry",{args:[2,2]}),(0,u.jsx)("shaderMaterial",{vertexShader:s,fragmentShader:n,uniforms:G,transparent:!0})]})},v=({width:e="100%",height:i="100%",className:o,children:l,gridSize:s=10,speed:n=1,waveFrequency:v=1,waveAmplitude:d=.2,cornerRadius:m=1,edgeSoftness:p=.6,cellGap:h=0,peakBrightness:g=2,baseBrightness:x=0,centerDrift:y=0,preset:P=0,color:S="#ff00ff",backgroundColor:R="#000000",opacity:C=1,cursorInteraction:w=!1,cursorIntensity:B=1})=>{let A=(0,r.useMemo)(()=>f(S),[S]),b=(0,r.useMemo)(()=>f(R),[R]),G=(0,r.useRef)(null),[F,I]=(0,r.useState)([.5,.5]),k=(0,r.useCallback)(e=>{if(!w)return;let u=G.current?.getBoundingClientRect();u&&I([(e.clientX-u.left)/u.width,1-(e.clientY-u.top)/u.height])},[w]);return(0,u.jsxs)("div",{ref:G,className:(0,a.cn)("relative overflow-hidden",o),style:{width:e,height:i,backgroundColor:R},onPointerMove:k,children:[(0,u.jsx)(t.Canvas,{className:"absolute inset-0 h-full w-full",orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},gl:{antialias:!0,alpha:!0},children:(0,u.jsx)(c,{speed:n,gridSize:s,waveFrequency:v,waveAmplitude:d,cornerRadius:m,edgeSoftness:p,cellGap:h,peakBrightness:g,baseBrightness:x,centerDrift:y,preset:P,colorRgb:A,bgRgb:b,opacity:C,pointer:F,cursorInteraction:w,cursorIntensity:B})}),l&&(0,u.jsx)("div",{className:"pointer-events-none relative z-10",children:l})]})};v.displayName="SquareMatrix",e.s(["default",0,v])}]);