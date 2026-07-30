(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,87058,e=>{"use strict";var r=e.i(41929),o=e.i(49456),t=e.i(26881),u=e.i(36048),a=e.i(81484),l=e.i(63617),n=e.i(46308);let i=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,s=`
precision highp float;

uniform float uTime;
uniform vec2  uRes;
uniform float uSpeed;
uniform float uScale;
uniform float uWarpStrength;
uniform float uWarpCurvature;
uniform float uWarpFalloff;
uniform float uScrollSpeed;
uniform float uNoiseAmount;
uniform float uColorIntensity;
uniform float uColorSeparation;
uniform float uRotation;
uniform vec3  uTint;
uniform vec3  uBg;
uniform float uAlpha;
uniform vec2  uPointer;
uniform float uCursorActive;
uniform float uCursorIntensity;

varying vec2 vUv;

vec3 safeTanh(vec3 x) {
  vec3 e = exp(-2.0 * x);
  return (1.0 - e) / (1.0 + e);
}

void main() {
  float t = uTime * uSpeed;

  vec2 p = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y * uScale;

  float cr = cos(uRotation);
  float sr = sin(uRotation);
  p = mat2(cr, -sr, sr, cr) * p;

  vec2 pointerPos = (uPointer * 2.0 - 1.0) * vec2(uRes.x / uRes.y, 1.0) * uScale;
  pointerPos = mat2(cr, -sr, sr, cr) * pointerPos;
  float cursorDist = length(p - pointerPos);
  float cursorInfluence = smoothstep(3.0, 0.0, cursorDist) * uCursorActive * uCursorIntensity;

  float localWarpStrength = uWarpStrength + cursorInfluence * 0.35;
  float localFalloff = uWarpFalloff - cursorInfluence * 0.6;

  float a = 9.0 * localWarpStrength;
  float b = 8.0 * localWarpStrength;
  mat2 warpMatrix = mat2(a, -b, -b, a);

  float inversiveScale = uWarpCurvature / (max(localFalloff, 0.5) + dot(p, p));

  float dither = fract(dot(gl_FragCoord, sin(gl_FragCoord.yxyx + t))) * uNoiseAmount;

  float scroll = t * uScrollSpeed;

  p = p * warpMatrix * inversiveScale + dither + scroll;

  float phase = sin(t + p.x + p.y);
  float brightness = exp(phase);

  vec2 freqA = cos(p + p.x / 7.0);
  vec2 freqB = sin(p.yx * 0.61);
  float interference = dot(freqA, freqB);

  float colorMod = cos(p.x * 0.1) + 1.0;
  vec3 channelOffset = colorMod * vec3(0.0, 0.1, 0.2) * uColorSeparation;

  vec3 denom = sin(interference + channelOffset) + 1.0;
  vec3 rawColor = uColorIntensity * brightness / denom;
  vec3 color = safeTanh(rawColor);

  color += cursorInfluence * 0.025;

  color *= uTint;

  float effectAlpha = max(color.r, max(color.g, color.b));
  vec3 composited = color + uBg * (1.0 - effectAlpha);

  gl_FragColor = vec4(composited, uAlpha);
}
`;function c(e){let r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return r?[parseInt(r[1],16)/255,parseInt(r[2],16)/255,parseInt(r[3],16)/255]:[0,0,0]}let f=({speed:e,scale:t,warpStrength:l,warpCurvature:c,warpFalloff:f,scrollSpeed:v,noiseAmount:p,colorIntensity:m,colorSeparation:h,rotation:d,tintRgb:g,bgRgb:S,opacity:C,pointer:x,cursorInteraction:y,cursorIntensity:I})=>{let R=(0,o.useRef)(null),{size:A,viewport:w}=(0,a.useThree)(),F=(0,o.useRef)(new n.Vector2(.5,.5)),T=(0,o.useMemo)(()=>({uTime:{value:0},uRes:{value:new n.Vector2(1,1)},uSpeed:{value:e},uScale:{value:t},uWarpStrength:{value:l},uWarpCurvature:{value:c},uWarpFalloff:{value:f},uScrollSpeed:{value:v},uNoiseAmount:{value:p},uColorIntensity:{value:m},uColorSeparation:{value:h},uRotation:{value:d*Math.PI/180},uTint:{value:new n.Vector3(...g)},uBg:{value:new n.Vector3(...S)},uAlpha:{value:C},uPointer:{value:new n.Vector2(.5,.5)},uCursorActive:{value:0},uCursorIntensity:{value:1}}),[]);return(0,u.useFrame)((r,o)=>{if(!R.current)return;let u=R.current.material;u.uniforms.uTime.value=r.clock.elapsedTime,u.uniforms.uRes.value.set(A.width*w.dpr,A.height*w.dpr),u.uniforms.uSpeed.value=e,u.uniforms.uScale.value=t,u.uniforms.uWarpStrength.value=l,u.uniforms.uWarpCurvature.value=c,u.uniforms.uWarpFalloff.value=f,u.uniforms.uScrollSpeed.value=v,u.uniforms.uNoiseAmount.value=p,u.uniforms.uColorIntensity.value=m,u.uniforms.uColorSeparation.value=h,u.uniforms.uRotation.value=d*Math.PI/180,u.uniforms.uTint.value.set(...g),u.uniforms.uBg.value.set(...S),u.uniforms.uAlpha.value=C,u.uniforms.uCursorActive.value=+!!y,u.uniforms.uCursorIntensity.value=I;let a=1-Math.exp(-o/.15);F.current.x+=(x[0]-F.current.x)*a,F.current.y+=(x[1]-F.current.y)*a,u.uniforms.uPointer.value.set(F.current.x,F.current.y)}),(0,r.jsxs)("mesh",{ref:R,children:[(0,r.jsx)("planeGeometry",{args:[2,2]}),(0,r.jsx)("shaderMaterial",{vertexShader:i,fragmentShader:s,uniforms:T,transparent:!0})]})},v=({width:e="100%",height:u="100%",className:a,children:n,speed:i=.2,scale:s=1.5,warpStrength:v=1.5,warpCurvature:p=6,warpFalloff:m=4,scrollSpeed:h=6,noiseAmount:d=.5,colorIntensity:g=.1,colorSeparation:S=0,rotation:C=-45,color:x="#FF9FFC",backgroundColor:y="#000000",opacity:I=1,cursorInteraction:R=!1,cursorIntensity:A=1})=>{let w=(0,o.useMemo)(()=>c(x),[x]),F=(0,o.useMemo)(()=>c(y),[y]),T=(0,o.useRef)(null),[b,W]=(0,o.useState)([.5,.5]),M=(0,o.useCallback)(e=>{if(!R)return;let r=T.current?.getBoundingClientRect();r&&W([(e.clientX-r.left)/r.width,1-(e.clientY-r.top)/r.height])},[R]);return(0,r.jsxs)("div",{ref:T,className:(0,l.cn)("relative overflow-hidden",a),style:{width:e,height:u,backgroundColor:y},onPointerMove:M,children:[(0,r.jsx)(t.Canvas,{className:"absolute inset-0 h-full w-full",orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},gl:{antialias:!0,alpha:!0},children:(0,r.jsx)(f,{speed:i,scale:s,warpStrength:v,warpCurvature:p,warpFalloff:m,scrollSpeed:h,noiseAmount:d,colorIntensity:g,colorSeparation:S,rotation:C,tintRgb:w,bgRgb:F,opacity:I,pointer:b,cursorInteraction:R,cursorIntensity:A})}),n&&(0,r.jsx)("div",{className:"pointer-events-none relative z-10",children:n})]})};v.displayName="StarSwipe",e.s(["default",0,v])}]);