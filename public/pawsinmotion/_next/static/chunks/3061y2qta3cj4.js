(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,18110,e=>{"use strict";var o=e.i(41929),t=e.i(49456),u=e.i(26881),r=e.i(36048),a=e.i(81484),i=e.i(63617),l=e.i(46308);let s=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,n=`
precision highp float;

uniform float uTime;
uniform vec2  uRes;
uniform float uSpeed;
uniform float uNoiseScale;
uniform int   uOctaves;
uniform float uGridDensity;
uniform float uDotSize;
uniform float uSoftness;
uniform float uContrastMin;
uniform float uContrastMax;
uniform float uScrollX;
uniform float uScrollY;
uniform float uRotation;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform vec3  uBg;
uniform float uAlpha;
uniform vec2  uPointer;
uniform float uCursorActive;

varying vec2 vUv;

float hash(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

float valueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= uOctaves) break;
    value += amplitude * valueNoise(st);
    st *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  float t = uTime * uSpeed;

  vec2 uv = gl_FragCoord.xy / uRes;
  uv.x *= uRes.x / uRes.y;

  vec2 center = vec2((uRes.x / uRes.y) * 0.5, 0.5);
  vec2 rotUv = uv - center;
  float cr = cos(uRotation);
  float sr = sin(uRotation);
  rotUv = mat2(cr, -sr, sr, cr) * rotUv;
  uv = rotUv + center;

  vec2 noiseUV = uv * uNoiseScale + vec2(t * uScrollX, t * uScrollY);
  float n = fbm(noiseUV);

  n = smoothstep(uContrastMin, uContrastMax, n);

  vec2 gridUV = uv * uGridDensity;
  vec2 cellUV = fract(gridUV) - 0.5;
  float dist = length(cellUV);

  vec2 pointerUv = vec2(uPointer.x * (uRes.x / uRes.y), uPointer.y);
  float cursorDist = length(uv - pointerUv);
  float cursorBoost = smoothstep(0.35, 0.0, cursorDist) * 0.3 * uCursorActive;

  float targetRadius = n * uDotSize + cursorBoost;
  float dotMask = smoothstep(targetRadius + uSoftness, targetRadius - uSoftness, dist);

  vec3 dotColor = mix(uColorA, uColorB, n);
  vec3 finalColor = mix(uBg, dotColor, dotMask);

  gl_FragColor = vec4(finalColor, uAlpha);
}
`;function c(e){let o=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return o?[parseInt(o[1],16)/255,parseInt(o[2],16)/255,parseInt(o[3],16)/255]:[0,0,0]}let v=({speed:e,noiseScale:u,octaves:i,gridDensity:c,dotSize:v,softness:f,contrastMin:m,contrastMax:d,scrollX:h,scrollY:p,rotation:g,colorARgb:x,colorBRgb:C,bgRgb:S,opacity:R,pointer:M,cursorInteraction:y})=>{let U=(0,t.useRef)(null),{size:b,viewport:A}=(0,a.useThree)(),F=(0,t.useRef)(new l.Vector2(.5,.5)),B=(0,t.useMemo)(()=>({uTime:{value:0},uRes:{value:new l.Vector2},uSpeed:{value:e},uNoiseScale:{value:u},uOctaves:{value:i},uGridDensity:{value:c},uDotSize:{value:v},uSoftness:{value:f},uContrastMin:{value:m},uContrastMax:{value:d},uScrollX:{value:h},uScrollY:{value:p},uRotation:{value:g*Math.PI/180},uColorA:{value:new l.Vector3(...x)},uColorB:{value:new l.Vector3(...C)},uBg:{value:new l.Vector3(...S)},uAlpha:{value:R},uPointer:{value:new l.Vector2(.5,.5)},uCursorActive:{value:0}}),[]);return(0,r.useFrame)((o,t)=>{if(!U.current)return;let r=U.current.material;r.uniforms.uTime.value=o.clock.elapsedTime,r.uniforms.uRes.value.set(b.width*A.dpr,b.height*A.dpr),r.uniforms.uSpeed.value=e,r.uniforms.uNoiseScale.value=u,r.uniforms.uOctaves.value=i,r.uniforms.uGridDensity.value=c,r.uniforms.uDotSize.value=v,r.uniforms.uSoftness.value=f,r.uniforms.uContrastMin.value=m,r.uniforms.uContrastMax.value=d,r.uniforms.uScrollX.value=h,r.uniforms.uScrollY.value=p,r.uniforms.uRotation.value=g*Math.PI/180,r.uniforms.uColorA.value.set(...x),r.uniforms.uColorB.value.set(...C),r.uniforms.uBg.value.set(...S),r.uniforms.uAlpha.value=R,r.uniforms.uCursorActive.value=+!!y;let a=1-Math.exp(-t/.15);F.current.x+=(M[0]-F.current.x)*a,F.current.y+=(M[1]-F.current.y)*a,r.uniforms.uPointer.value.set(F.current.x,F.current.y)}),(0,o.jsxs)("mesh",{ref:U,children:[(0,o.jsx)("planeGeometry",{args:[2,2]}),(0,o.jsx)("shaderMaterial",{vertexShader:s,fragmentShader:n,uniforms:B,transparent:!0})]})},f=({width:e="100%",height:r="100%",className:a,children:l,speed:s=1,noiseScale:n=3,octaves:f=3,gridDensity:m=40,dotSize:d=.75,softness:h=.35,contrastMin:p=.2,contrastMax:g=.8,scrollX:x=.1,scrollY:C=.1,rotation:S=0,colorA:R="#FFFFFF",colorB:M="#000000",backgroundColor:y="#FFFFFF",opacity:U=1,cursorInteraction:b=!1})=>{let A=(0,t.useMemo)(()=>c(R),[R]),F=(0,t.useMemo)(()=>c(M),[M]),B=(0,t.useMemo)(()=>c(y),[y]),V=(0,t.useRef)(null),[w,D]=(0,t.useState)([.5,.5]),P=(0,t.useCallback)(e=>{if(!b)return;let o=V.current?.getBoundingClientRect();o&&D([(e.clientX-o.left)/o.width,1-(e.clientY-o.top)/o.height])},[b]);return(0,o.jsxs)("div",{ref:V,className:(0,i.cn)("relative overflow-hidden",a),style:{width:e,height:r,backgroundColor:y},onPointerMove:P,children:[(0,o.jsx)(u.Canvas,{className:"absolute inset-0 h-full w-full",orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},gl:{antialias:!0,alpha:!0},children:(0,o.jsx)(v,{speed:s,noiseScale:n,octaves:f,gridDensity:m,dotSize:d,softness:h,contrastMin:p,contrastMax:g,scrollX:x,scrollY:C,rotation:S,colorARgb:A,colorBRgb:F,bgRgb:B,opacity:U,pointer:w,cursorInteraction:b})}),l&&(0,o.jsx)("div",{className:"pointer-events-none relative z-10",children:l})]})};f.displayName="HalftoneWave",e.s(["default",0,f])}]);