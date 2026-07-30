(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,68903,e=>{"use strict";var u=e.i(41929),r=e.i(49456),o=e.i(26881),t=e.i(36048),a=e.i(81484),i=e.i(63617),n=e.i(46308);let l=`
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
uniform float uIter;
uniform float uStep;
uniform float uSeed;
uniform float uWarpPow;
uniform float uCh1;
uniform float uCh2;
uniform float uCh3;
uniform float uDrift;
uniform float uSpin;
uniform float uCompress;
uniform float uThresh;
uniform float uContrast;
uniform float uPreBright;
uniform float uPreOff;
uniform vec3 uTint;
uniform float uGlow;
uniform vec3 uBg;
uniform float uAlpha;
uniform vec2 uPointer;
uniform float uCursorActive;
uniform float uCursorIntensity;

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, s, -s, c);
}

void main() {
  vec2 st = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  vec2 p = st * uZoom;
  float t = uTime * uSpeed;

  vec2 pointerUv = (uPointer - 0.5) * vec2(uRes.x / uRes.y, 1.0) * uZoom;
  float cursorDist = length(p - pointerUv);
  float cursorInfluence = smoothstep(5.0, 0.0, cursorDist) * uCursorActive * uCursorIntensity;

  float localWarpPow = uWarpPow - cursorInfluence * 0.25;
  float localDrift = uDrift + cursorInfluence * 0.5;
  float localSpin = uSpin + cursorInfluence * 0.3;

  vec3 acc = vec3(length(p) * uGlow);

  for (float i = 0.3; i < 20.0; i += 1.0) {
    if (i >= uIter) break;
    float fi = i * uStep;

    float k = cos(fi * 0.05);
    k = fract(k * tanh(fi) * uSeed);
    p += atan(sin(p.yx * k + t * k)) / pow(k + 0.001, localWarpPow);
    acc += cos(p.x + vec3(uCh1, uCh2, uCh3) + p.y);
    p *= rot(fi * localSpin);
    p += vec2(localDrift);
  }

  acc = tanh(acc * acc * uCompress);
  acc = pow(abs(acc * uPreBright - uPreOff), vec3(uContrast));

  vec3 col = vec3((acc.r + acc.g + acc.b) / 3.0);
  col = pow(max(col * uPreBright - uThresh, 0.0), vec3(uContrast)) * uTint;

  col += cursorInfluence * 0.07 * uTint;

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 out_col = mix(uBg, col, clamp(lum * 8.0, 0.0, 1.0));
  gl_FragColor = vec4(out_col, uAlpha);
}
`,f=({speed:e,zoom:o,iterations:i,iterationStep:f,seedFactor:c,warpPower:v,channelOffset1:m,channelOffset2:p,channelOffset3:h,drift:d,rotationRate:C,compression:g,threshold:w,contrast:P,preBrightness:S,preOffset:x,tintR:y,tintG:I,tintB:T,glowIntensity:R,bgRgb:B,opacity:b,pointer:A,cursorInteraction:O,cursorIntensity:j})=>{let k=(0,r.useRef)(null),{size:D,viewport:U}=(0,a.useThree)(),M=(0,r.useRef)(new n.Vector2(.5,.5)),G=(0,r.useMemo)(()=>({uTime:{value:0},uRes:{value:new n.Vector2(1,1)},uSpeed:{value:e},uZoom:{value:o},uIter:{value:i},uStep:{value:f},uSeed:{value:c},uWarpPow:{value:v},uCh1:{value:m},uCh2:{value:p},uCh3:{value:h},uDrift:{value:d},uSpin:{value:C},uCompress:{value:g},uThresh:{value:w},uContrast:{value:P},uPreBright:{value:S},uPreOff:{value:x},uTint:{value:new n.Vector3(y,I,T)},uGlow:{value:R},uBg:{value:new n.Vector3(...B)},uAlpha:{value:b},uPointer:{value:new n.Vector2(.5,.5)},uCursorActive:{value:0},uCursorIntensity:{value:1}}),[]);return(0,t.useFrame)((u,r)=>{if(!k.current)return;let t=k.current.material;t.uniforms.uTime.value=u.clock.elapsedTime,t.uniforms.uRes.value.set(D.width*U.dpr,D.height*U.dpr),t.uniforms.uSpeed.value=e,t.uniforms.uZoom.value=o,t.uniforms.uIter.value=i,t.uniforms.uStep.value=f,t.uniforms.uSeed.value=c,t.uniforms.uWarpPow.value=v,t.uniforms.uCh1.value=m,t.uniforms.uCh2.value=p,t.uniforms.uCh3.value=h,t.uniforms.uDrift.value=d,t.uniforms.uSpin.value=C,t.uniforms.uCompress.value=g,t.uniforms.uThresh.value=w,t.uniforms.uContrast.value=P,t.uniforms.uPreBright.value=S,t.uniforms.uPreOff.value=x,t.uniforms.uTint.value.set(y,I,T),t.uniforms.uGlow.value=R,t.uniforms.uBg.value.set(...B),t.uniforms.uAlpha.value=b,t.uniforms.uCursorActive.value=+!!O,t.uniforms.uCursorIntensity.value=j;let a=1-Math.exp(-r/.15);M.current.x+=(A[0]-M.current.x)*a,M.current.y+=(A[1]-M.current.y)*a,t.uniforms.uPointer.value.set(M.current.x,M.current.y)}),(0,u.jsxs)("mesh",{ref:k,children:[(0,u.jsx)("planeGeometry",{args:[2,2]}),(0,u.jsx)("shaderMaterial",{vertexShader:l,fragmentShader:s,uniforms:G,transparent:!0})]})},c=({width:e="100%",height:t="100%",className:a,children:n,speed:l=1,zoom:s=7.5,iterations:c=10,iterationStep:v=.77,seedFactor:m=1,warpPower:p=1.5,channelOffset1:h=3,channelOffset2:d=3,channelOffset3:C=2,drift:g=3,rotationRate:w=2,compression:P=.001,threshold:S=.3,contrast:x=5,preBrightness:y=2.1,preOffset:I=.9,tintR:T=1,tintG:R=.07,tintB:B=1,glowIntensity:b=.8,backgroundColor:A="#000000",opacity:O=1,cursorInteraction:j=!1,cursorIntensity:k=1})=>{let D=(0,r.useMemo)(()=>{let e;return(e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(A))?[parseInt(e[1],16)/255,parseInt(e[2],16)/255,parseInt(e[3],16)/255]:[0,0,0]},[A]),U=(0,r.useRef)(null),[M,G]=(0,r.useState)([.5,.5]),V=(0,r.useCallback)(e=>{if(!j)return;let u=U.current?.getBoundingClientRect();u&&G([(e.clientX-u.left)/u.width,1-(e.clientY-u.top)/u.height])},[j]);return(0,u.jsxs)("div",{ref:U,className:(0,i.cn)("relative overflow-hidden",a),style:{width:e,height:t,backgroundColor:A},onPointerMove:V,children:[(0,u.jsx)(o.Canvas,{className:"absolute inset-0 h-full w-full",orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},gl:{antialias:!0,alpha:!0},children:(0,u.jsx)(f,{speed:l,zoom:s,iterations:c,iterationStep:v,seedFactor:m,warpPower:p,channelOffset1:h,channelOffset2:d,channelOffset3:C,drift:g,rotationRate:w,compression:P,threshold:S,contrast:x,preBrightness:y,preOffset:I,tintR:T,tintG:R,tintB:B,glowIntensity:b,bgRgb:D,opacity:O,pointer:M,cursorInteraction:j,cursorIntensity:k})}),n&&(0,u.jsx)("div",{className:"pointer-events-none relative z-10",children:n})]})};c.displayName="RubberFluid",e.s(["default",0,c])}]);