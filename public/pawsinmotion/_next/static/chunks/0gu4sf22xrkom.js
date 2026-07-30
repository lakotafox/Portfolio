(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,5091,e=>{"use strict";var o=e.i(41929),i=e.i(49456),l=e.i(26881),t=e.i(36048),n=e.i(81484),r=e.i(71884),a=e.i(46308);let u=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,s=`
uniform float u_time;
uniform vec2 u_resolution;
uniform int u_columns;
uniform bool u_invertColumns;
uniform bool u_fuzzNoise;
uniform bool u_gridProximityColor;
uniform vec3 u_baseColor;
uniform vec3 u_proximityColor;
uniform float u_speed;
uniform float u_noiseScale;
uniform float u_fuzzIntensity;
uniform float u_edgeSharpness;
uniform float u_noisePower;
uniform float u_colorBleed;
uniform bool u_lightMode;

varying vec2 vUv;

float mapRange(float minIn, float maxIn, float val, float minOut, float maxOut) {
  float rangeIn = maxIn - minIn;
  float rangeOut = maxOut - minOut;
  return ((val - minIn) * rangeOut / rangeIn) + minOut;
}

float mapSin(float val, float minOut, float maxOut) {
  return mapRange(-1.0, 1.0, sin(val), minOut, maxOut);
}

float snapFloor(float val, float snapSize) {
  return floor(val / snapSize) * snapSize;
}

vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  float aspectRatio = u_resolution.x / u_resolution.y;
  vec2 coord = vUv - 0.5;
  coord.x *= aspectRatio;

  float time = u_time * u_speed;
  float columnWidth = 1.0 / float(u_columns);
  vec3 finalColor = vec3(1.0);

  vec2 noiseScaleVec = vec2(
    5.5 + mapSin(time / 5.0, -0.4, 0.3),
    2.2 + mapSin(time / 5.0, -0.05, 0.05)
  ) * u_noiseScale;
  float noiseTimeScale = 0.2;
  vec2 noiseOffset = vec2(
    mapSin(sin(time / 3.5), -0.2, 0.1),
    time / 90.0
  );

  vec3 noiseInputVec = vec3(coord + noiseOffset, time * noiseTimeScale);
  float sphereStrength = snoise(noiseInputVec * vec3(noiseScaleVec, 1.0));
  sphereStrength = pow(max(sphereStrength, 0.0), u_noisePower);
  sphereStrength *= 2.1;

  vec2 fuzzNoiseScale = vec2(750.0 * u_fuzzIntensity);
  vec2 fuzzNoiseOffset = vec2(time / 500.0);
  vec3 fuzzNoiseInputVec = vec3(coord + fuzzNoiseOffset, time * noiseTimeScale);
  float fuzzNoiseValue = snoise(fuzzNoiseInputVec * vec3(fuzzNoiseScale, 1.0));

  float column = snapFloor(coord.x, columnWidth);
  float rawDist = abs(coord.x - column - columnWidth / 2.0) * u_edgeSharpness;
  float distFromColCenter = exp(-pow(rawDist, 0.85));
  distFromColCenter = pow(distFromColCenter, 1.0 / max(u_colorBleed, 0.1));

  vec3 colorOffset = vec3(
    0.55 * snoise(noiseInputVec * vec3(noiseScaleVec * 0.8, 1.0)),
    0.02 * snoise(noiseInputVec * vec3(noiseScaleVec, 1.0)),
    0.02 * snoise(noiseInputVec * vec3(noiseScaleVec, 1.0))
  );

  float gridProximityStrength = 0.0;
  if (u_gridProximityColor) {
    gridProximityStrength = distFromColCenter;
    colorOffset += u_proximityColor * gridProximityStrength;
  }

  finalColor *= sphereStrength * (u_baseColor + colorOffset);

  float colDist = distFromColCenter;

  if (u_invertColumns) {
    colDist = 1.0 - colDist;
  }

  finalColor *= vec3(colDist);

  if (u_fuzzNoise) {
    float fuzz = 1.0 - fuzzNoiseValue;
    fuzz = mix(1.0, fuzz, exp(-gridProximityStrength * 3.0));
    finalColor *= vec3(fuzz);
  }

  if (u_lightMode) {
    float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
    float satBoost = 3.0;
    finalColor = mix(vec3(luminance), finalColor, satBoost);
    finalColor = pow(finalColor, vec3(0.6));
    finalColor = clamp(finalColor * 1.8, 0.0, 1.0);
    float alpha = clamp(luminance * 4.0, 0.0, 1.0);
    gl_FragColor = vec4(finalColor, alpha);
  } else {
    gl_FragColor = vec4(finalColor, 1.0);
  }
}
`,c=({columns:e,invertColumns:l,fuzzNoise:r,gridProximityColor:c,baseColor:v,proximityColor:f,speed:m,noiseScale:x,fuzzIntensity:p,edgeSharpness:d,noisePower:z,colorBleed:_,lightMode:y})=>{let h=(0,i.useRef)(null),g=(0,i.useRef)(null),{viewport:C,size:S}=(0,n.useThree)(),w=(0,i.useMemo)(()=>({u_time:{value:0},u_resolution:{value:new a.Vector2},u_columns:{value:6},u_invertColumns:{value:!1},u_fuzzNoise:{value:!0},u_gridProximityColor:{value:!0},u_baseColor:{value:new a.Vector3},u_proximityColor:{value:new a.Vector3},u_speed:{value:1},u_noiseScale:{value:1},u_fuzzIntensity:{value:1},u_edgeSharpness:{value:40},u_noisePower:{value:1.5},u_colorBleed:{value:1},u_lightMode:{value:!1}}),[]);return(0,t.useFrame)(o=>{if(!g.current)return;let i=g.current.uniforms;i.u_time.value=o.clock.elapsedTime,i.u_resolution.value.set(S.width,S.height),i.u_columns.value=e,i.u_invertColumns.value=l,i.u_fuzzNoise.value=r,i.u_gridProximityColor.value=c,i.u_baseColor.value.set(...v),i.u_proximityColor.value.set(...f),i.u_speed.value=m,i.u_noiseScale.value=x,i.u_fuzzIntensity.value=p,i.u_edgeSharpness.value=d,i.u_noisePower.value=z,i.u_colorBleed.value=_,i.u_lightMode.value=y}),(0,o.jsxs)("mesh",{ref:h,children:[(0,o.jsx)("planeGeometry",{args:[C.width,C.height]}),(0,o.jsx)("shaderMaterial",{ref:g,vertexShader:u,fragmentShader:s,uniforms:w,transparent:!0})]})},v=({columns:e=3,invertColumns:i=!1,fuzzNoise:t=!0,gridProximityColor:n=!1,baseColor:a=[.7882,.2,1],baseColorLight:u=[.6824,0,1],proximityColor:s=[1,0,0],proximityColorLight:v=[.8,.3,.3],speed:f=.5,noiseScale:m=.4,fuzzIntensity:x=.5,edgeSharpness:p=50,noisePower:d=1.5,colorBleed:z=1,className:_})=>{let{resolvedTheme:y}=(0,r.useTheme)(),h="light"===y;return(0,o.jsx)("div",{className:_,style:{width:"100%",height:"100%",background:h?"#fff":"#0b0b0b"},children:(0,o.jsx)(l.Canvas,{className:"w-full h-full",gl:{antialias:!0,alpha:!0},children:(0,o.jsx)(c,{columns:e,invertColumns:i,fuzzNoise:t,gridProximityColor:n,baseColor:h?u:a,proximityColor:h?v:s,speed:f,noiseScale:m,fuzzIntensity:x,edgeSharpness:p,noisePower:d,colorBleed:z,lightMode:h})})})};v.displayName="ShadowBars",e.s(["default",0,v])}]);