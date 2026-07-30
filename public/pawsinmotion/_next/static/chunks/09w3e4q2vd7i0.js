(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,80642,e=>{"use strict";var u=e.i(41929),r=e.i(49456),t=e.i(26881),n=e.i(36048),o=e.i(81484),l=e.i(63617),i=e.i(46308);let a=`
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
uniform float uCenter;
uniform float uAmp;
uniform float uFreq;
uniform float uInnerFreq;
uniform float uPull;
uniform int uDir;
uniform float uPowA;
uniform float uPowB;
uniform float uRedGain;
uniform float uGreenGain;
uniform float uBlueGain;
uniform float uGreenPow;
uniform float uBluePow;
uniform vec3 uBg;
uniform float uAlpha;
uniform vec2 uPointer;
uniform float uCursorActive;
uniform float uCursorIntensity;

const float TAU = 6.2831853;
const float PI = 3.14159265;

void main() {
  float aspect = uRes.x / uRes.y;

  vec2 st = vec2(vUv.x * aspect, vUv.y);
  vec2 nrm = vUv;

  if (uDir == 1) {
    st.x = aspect - st.x;
    nrm.x = 1.0 - nrm.x;
  } else if (uDir == 2) {
    float tmp = st.x;
    st.x = st.y;
    st.y = aspect - tmp;
    float ntmp = nrm.x;
    nrm.x = nrm.y;
    nrm.y = 1.0 - ntmp;
  } else if (uDir == 3) {
    float tmp = st.x;
    st.x = 1.0 - st.y;
    st.y = tmp;
    float ntmp = nrm.x;
    nrm.x = 1.0 - nrm.y;
    nrm.y = ntmp;
  }

  st.y -= uCenter;

  float t = uTime * uSpeed;

  vec2 pointerNrm = uPointer;
  float cursorDist = length(nrm - pointerNrm);
  float cursorInfluence = smoothstep(0.5, 0.0, cursorDist) * uCursorActive * uCursorIntensity;

  float localAmp = uAmp + cursorInfluence * 3.0;
  float localPowA = uPowA - cursorInfluence * 4.0;
  float localPowB = uPowB - cursorInfluence * 1.5;

  st.y *= sin(nrm.x * uFreq * TAU + t) + localAmp;

  st.y = st.x + sin(sin(st.y * uInnerFreq));

  st.x -= abs(sin(nrm.y * PI)) * uPull;
  st.x -= t;

  float combine = st.x + st.y;
  float diff = st.x - st.y;

  float cA = cos(combine);
  float cB = cos(diff);

  float fire = sqrt(pow(abs(cA), max(localPowA, 1.0)) * pow(abs(cB), max(localPowB, 1.0)));

  float intensityBoost = 1.0 + cursorInfluence * 0.5;
  vec3 col = vec3(
    fire * nrm.x * uRedGain * intensityBoost,
    pow(fire, uGreenPow) * nrm.x * uGreenGain * intensityBoost,
    pow(fire, uBluePow) * nrm.x * nrm.y * uBlueGain * intensityBoost
  );

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 result = mix(uBg, col, clamp(lum * 8.0, 0.0, 1.0));

  gl_FragColor = vec4(result, uAlpha);
}
`,f=({speed:e,centerShift:t,waveAmplitude:l,waveFrequency:f,innerFrequency:m,horizontalPull:c,direction:v,plusPower:p,minusPower:d,redGain:x,greenGain:P,blueGain:y,greenPower:w,bluePower:h,backgroundColor:A,opacity:B,pointer:g,cursorInteraction:G,cursorIntensity:I})=>{let C=(0,r.useRef)(null),{size:R}=(0,o.useThree)(),b=(0,r.useRef)(new i.Vector2(.5,.5)),F=(0,r.useMemo)(()=>({uTime:{value:0},uRes:{value:new i.Vector2(1,1)},uSpeed:{value:.5},uCenter:{value:.5},uAmp:{value:15},uFreq:{value:2},uInnerFreq:{value:3},uPull:{value:1},uDir:{value:2},uPowA:{value:30},uPowB:{value:10},uRedGain:{value:2},uGreenGain:{value:0},uBlueGain:{value:5},uGreenPow:{value:1},uBluePow:{value:1.5},uBg:{value:new i.Vector3(0,0,0)},uAlpha:{value:1},uPointer:{value:new i.Vector2(.5,.5)},uCursorActive:{value:0},uCursorIntensity:{value:1}}),[]);return(0,n.useFrame)((u,r)=>{let n;if(!C.current)return;let o=C.current.material;o.uniforms.uTime.value=u.clock.elapsedTime,o.uniforms.uRes.value.set(R.width,R.height),o.uniforms.uSpeed.value=e,o.uniforms.uCenter.value=t,o.uniforms.uAmp.value=l,o.uniforms.uFreq.value=f,o.uniforms.uInnerFreq.value=m,o.uniforms.uPull.value=c,o.uniforms.uDir.value=v,o.uniforms.uPowA.value=p,o.uniforms.uPowB.value=d,o.uniforms.uRedGain.value=x,o.uniforms.uGreenGain.value=P,o.uniforms.uBlueGain.value=y,o.uniforms.uGreenPow.value=w,o.uniforms.uBluePow.value=h;let[i,a,s]=(n=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(A))?[parseInt(n[1],16)/255,parseInt(n[2],16)/255,parseInt(n[3],16)/255]:[0,0,0];o.uniforms.uBg.value.set(i,a,s),o.uniforms.uAlpha.value=B,o.uniforms.uCursorActive.value=+!!G,o.uniforms.uCursorIntensity.value=I;let F=1-Math.exp(-r/.15);b.current.x+=(g[0]-b.current.x)*F,b.current.y+=(g[1]-b.current.y)*F,o.uniforms.uPointer.value.set(b.current.x,b.current.y)}),(0,u.jsxs)("mesh",{ref:C,children:[(0,u.jsx)("planeGeometry",{args:[2,2]}),(0,u.jsx)("shaderMaterial",{vertexShader:a,fragmentShader:s,uniforms:F,transparent:!0})]})},m=({width:e="100%",height:n="100%",className:o,children:i,speed:a=.5,centerShift:s=1,waveAmplitude:m=10,waveFrequency:c=.6,innerFrequency:v=2.5,horizontalPull:p=1,direction:d=2,plusPower:x=30,minusPower:P=10,redGain:y=2,greenGain:w=0,blueGain:h=5,greenPower:A=1,bluePower:B=1.5,backgroundColor:g="#000000",opacity:G=1,cursorInteraction:I=!1,cursorIntensity:C=1})=>{let R=(0,r.useRef)(null),[b,F]=(0,r.useState)([.5,.5]),T=(0,r.useCallback)(e=>{if(!I)return;let u=R.current?.getBoundingClientRect();u&&F([(e.clientX-u.left)/u.width,1-(e.clientY-u.top)/u.height])},[I]);return(0,u.jsxs)("div",{ref:R,className:(0,l.cn)("relative overflow-hidden",o),style:{width:e,height:n},onPointerMove:T,children:[(0,u.jsx)(t.Canvas,{className:"absolute inset-0",gl:{antialias:!0,alpha:!0},orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},children:(0,u.jsx)(f,{speed:a,centerShift:s,waveAmplitude:m,waveFrequency:c,innerFrequency:v,horizontalPull:p,direction:d,plusPower:x,minusPower:P,redGain:y,greenGain:w,blueGain:h,greenPower:A,bluePower:B,backgroundColor:g,opacity:G,pointer:b,cursorInteraction:I,cursorIntensity:C})}),i&&(0,u.jsx)("div",{className:"relative z-1",children:i})]})};m.displayName="FlamePaths",e.s(["default",0,m])}]);