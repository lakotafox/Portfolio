(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,96427,e=>{"use strict";var a=e.i(41929),l=e.i(49456),r=e.i(26881),o=e.i(36048),t=e.i(81484),u=e.i(46308),i=e.i(63617);let s=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,n=`
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uRes;
uniform float uSpeed;
uniform float uDensity;
uniform float uLayers;
uniform float uWarp;
uniform float uBand;
uniform float uChromatic;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform vec3  uBg;
uniform float uAlpha;

const int   MAX_LAYERS    = 8;
const float GOLDEN_ANGLE  = 2.39996323;

float sampleField(vec2 p, float t) {
  vec2 c = p;
  vec2 s = floor(c);
  vec2 pole = vec2(uWarp) / (s - c + 1e-3);

  for (int j = 1; j <= MAX_LAYERS; j++) {
    if (float(j) > uLayers) break;
    float fi = float(j);
    float ang = GOLDEN_ANGLE * fi;
    vec2 dir = vec2(cos(ang), sin(ang));
    float detune = 1.0 + fi * 0.13;
    float phase = dot(c, dir) * detune + pole.x + pole.y + t;
    c += dir * sin(phase) / fi;
  }

  float band = exp(-max(uBand, 0.0001) * abs(sin(c.y)));
  return band;
}

void main() {
  vec2 fragPx = vUv * uRes;
  vec2 base = fragPx / max(uRes.y, 1.0) * uDensity + uRes / max(uRes.y, 1.0);

  float t = uTime * uSpeed;

  float spread = uChromatic * 0.35;
  float r = sampleField(base + vec2( spread, 0.0), t);
  float g = sampleField(base,                      t);
  float b = sampleField(base + vec2(-spread, 0.0), t);

  vec3 col = vec3(
    mix(uColorA.r, uColorB.r, r),
    mix(uColorA.g, uColorB.g, g),
    mix(uColorA.b, uColorB.b, b)
  );

  float fieldMix = clamp(max(max(r, g), b), 0.0, 1.0);
  vec3 final = mix(uBg, col, fieldMix);

  gl_FragColor = vec4(final, uAlpha);
}
`;function c(e){let a=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return a?[parseInt(a[1],16)/255,parseInt(a[2],16)/255,parseInt(a[3],16)/255]:[0,0,0]}let v=e=>{let r=(0,l.useRef)(null),{size:i}=(0,t.useThree)();(0,o.useFrame)(a=>{if(!r.current)return;let l=r.current.material.uniforms;l.uTime.value=a.clock.elapsedTime,l.uRes.value.set(i.width,i.height),l.uSpeed.value=e.speed,l.uDensity.value=e.tileDensity,l.uLayers.value=Math.max(1,Math.min(8,Math.round(e.rippleLayers))),l.uWarp.value=e.warpStrength,l.uBand.value=e.bandSharpness,l.uChromatic.value=e.chromaticSpread,l.uAlpha.value=e.opacity;let o=c(e.colorA);l.uColorA.value.set(o[0],o[1],o[2]);let t=c(e.colorB);l.uColorB.value.set(t[0],t[1],t[2]);let u=c(e.backgroundColor);l.uBg.value.set(u[0],u[1],u[2])});let v=(0,l.useMemo)(()=>({uTime:{value:0},uRes:{value:new u.Vector2(1,1)},uSpeed:{value:1},uDensity:{value:4},uLayers:{value:5},uWarp:{value:.1},uBand:{value:3},uChromatic:{value:.25},uColorA:{value:new u.Vector3(.05,.02,.1)},uColorB:{value:new u.Vector3(.4,.5,.9)},uBg:{value:new u.Vector3(0,0,0)},uAlpha:{value:1}}),[]);return(0,a.jsxs)("mesh",{ref:r,children:[(0,a.jsx)("planeGeometry",{args:[2,2]}),(0,a.jsx)("shaderMaterial",{vertexShader:s,fragmentShader:n,uniforms:v,transparent:!0})]})},f=({width:e="100%",height:l="100%",className:o,children:t,speed:u=1,tileDensity:s=4,rippleLayers:n=6,warpStrength:c=.33,bandSharpness:f=3,chromaticSpread:p=0,colorA:m="#1E00FF",colorB:d="#D765E6",backgroundColor:h="#FFFFFF",opacity:g=1,dpr:x=1.5})=>(0,a.jsxs)("div",{className:(0,i.cn)("relative overflow-hidden",o),style:{width:e,height:l},children:[(0,a.jsx)(r.Canvas,{className:"absolute inset-0",dpr:[1,x],gl:{antialias:!1,alpha:!0,powerPreference:"high-performance"},orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},children:(0,a.jsx)(v,{speed:u,tileDensity:s,rippleLayers:n,warpStrength:c,bandSharpness:f,chromaticSpread:p,colorA:m,colorB:d,backgroundColor:h,opacity:g})}),t&&(0,a.jsx)("div",{className:"relative z-10",children:t})]});f.displayName="GlassTiles",e.s(["default",0,f])}]);