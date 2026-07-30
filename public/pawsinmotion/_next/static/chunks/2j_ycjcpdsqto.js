(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,67929,e=>{"use strict";var a=e.i(41929),o=e.i(49456),t=e.i(26881),l=e.i(36048),u=e.i(81484),r=e.i(71884),i=e.i(46308);let c=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,s=`
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_radius;
uniform float u_narrow;
uniform float u_length;
uniform float u_hazeSpeed;
uniform float u_dustSpeed;
uniform float u_hazeStrength;
uniform float u_hazeFrequency;
uniform float u_dustDensity;
uniform float u_dustSize;
uniform float u_dustOpacity;
uniform float u_edgeFade;
uniform float u_spiralTight;
uniform float u_rotSpeed;
uniform vec3 u_baseColor;
uniform float u_cameraDistance;
uniform bool u_lightMode;

varying vec2 vUv;

bool clipped(in vec3 pos, float clipY, float clipZ) {
  return abs(pos.y) < clipY && abs(pos.z) < clipZ;
}

float iQuadricTypeA(in vec3 ro, in vec3 rd, in vec4 abcd, in float clipY, in float clipZ, out vec3 oNor) {
  vec3 r2 = abcd.xyz * abs(abcd.xyz);
  float k2 = dot(rd, rd * r2);
  float k1 = dot(rd, ro * r2);
  float k0 = dot(ro, ro * r2) - abcd.w;

  float h = k1 * k1 - k2 * k0;
  float nh = step(0.0, h);
  h = sqrt(max(h, 0.0)) * sign(k2);

  float t1 = (-k1 - h) / k2;
  float t2 = (-k1 + h) / k2;

  vec3 pos1 = ro + t1 * rd;
  vec3 pos2 = ro + t2 * rd;

  float v1 = float(clipped(pos1, clipY, clipZ)) * step(0.0, t1);
  float v2 = float(clipped(pos2, clipY, clipZ)) * step(0.0, t2);
  float s = step(0.0, v1);

  float t = mix(t2, t1, s) * nh;

  vec3 nor1 = normalize(pos1 * r2);
  vec3 nor2 = normalize(pos2 * r2);
  oNor = mix(nor2, nor1, s);

  return mix(-1.0, t, step(0.0, v1 + v2));
}

float hash21(vec2 p) {
  p = fract(p * vec2(345.42, 137.25));
  p += dot(p, p + 34.19);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash21(i);
  float b = hash21(i + vec2(1, 0));
  float c = hash21(i + vec2(0, 1));
  float d = hash21(i + vec2(1, 1));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.4;
  for (int i = 0; i < 3; i++) {
    s += noise(p) * a;
    p *= 1.28;
    a *= 0.512;
  }
  return s;
}

void main() {
  vec4 kShape = vec4(1.0 / u_radius, -1.0 / u_narrow, 1.0 / u_radius, 1.0);

  vec2 ndc = (vUv - 0.5) * 2.0;
  ndc.x *= u_resolution.x / u_resolution.y;

  vec3 ro = vec3(0.0, 0.0, u_cameraDistance);
  vec3 ta = vec3(0.0, 0.0, 0.0);

  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(ww, vec3(0, 1, 0)));
  vec3 vv = cross(uu, ww);

  vec3 rd = normalize(ndc.x * uu + ndc.y * vv + 3.0 * ww);

  float ang = 1.5707963;
  float c = cos(ang), s = sin(ang);
  ro = vec3(c * ro.x - s * ro.y, s * ro.x + c * ro.y, ro.z);
  rd = vec3(c * rd.x - s * rd.y, s * rd.x + c * rd.y, rd.z);

  vec3 nor;
  float t = iQuadricTypeA(ro, rd, kShape, u_length, u_length, nor);
  float valid = step(0.0, t);

  vec3 pos = ro + t * rd;

  float angle = atan(pos.z, pos.x);
  float cy = pos.y;
  float angle01 = angle * 0.15915494 + 0.5;
  float flow = cy - u_time * u_hazeSpeed;

  float swirl = angle + cy * u_spiralTight + u_time * u_rotSpeed;
  vec2 cyc = vec2(cos(swirl), sin(swirl));

  vec2 h1 = vec2(cyc.x * u_hazeFrequency, flow * 2.0 + cyc.y * 0.75);
  vec2 h2 = vec2(cyc.y * (u_hazeFrequency * 0.7), flow * 1.37 - cyc.x * 0.5);
  float haze = pow(mix(fbm(h1), fbm(h2), 0.5), 2.0) * u_hazeStrength;

  float u = cyc.x * 0.5 + 0.5;
  float v = cyc.y * 0.5 + 0.5;

  vec2 uid = vec2(
    floor(u * u_dustDensity),
    floor(v * u_dustDensity + flow * 0.1)
  );

  float r1 = hash21(uid * 1.373 + 1.7);
  float r2 = hash21(uid * 2.911 + 3.1);
  float r3 = hash21(uid * 4.277 + 5.9);

  float local = cy + (r1 - 0.5) - u_time * u_dustSpeed * 0.5;
  float d = abs(fract(local) - 0.5);

  float size = mix(u_dustSize * 0.6, u_dustSize * 1.4, r2);
  float opacity = mix(u_dustOpacity * 0.4, u_dustOpacity * 0.8, r3);

  float core = exp(-d * size);
  float halo = exp(-d * size * 0.35);
  float dust = (core * 0.1 + halo * 0.8) * opacity;

  float seamFade = smoothstep(0.0, 0.2, min(angle01, 1.0 - angle01));
  dust *= seamFade;

  float fres = pow(1.0 - abs(dot(nor, -rd)), 1.35);
  float edgeFadeVal = smoothstep(0.0, 0.9, fres);
  float fadeLen = smoothstep(u_length * 0.55, 0.25, length(pos));

  vec3 col = (vec3(haze) + vec3(dust)) * fadeLen * valid;
  col *= 1.0 - edgeFadeVal * u_edgeFade;
  col *= u_baseColor;
  col = sqrt(col);

  float alpha = max(max(col.r, col.g), col.b);
  alpha = clamp(alpha * 2.0, 0.0, 1.0);

  if (u_lightMode) {
    float luminance = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luminance), col, 2.5);
    col = pow(col, vec3(0.7));
    col = clamp(col * 2.0, 0.0, 1.0);
    alpha = clamp(luminance * 6.0, 0.0, 1.0);
  }

  gl_FragColor = vec4(col, alpha);
}
`,n=({radius:e,narrow:t,length:r,hazeSpeed:n,dustSpeed:d,hazeStrength:f,hazeFrequency:v,dustDensity:p,dustSize:h,dustOpacity:_,edgeFade:m,spiralTight:g,rotSpeed:y,baseColor:x,cameraDistance:z,lightMode:w})=>{let S=(0,o.useRef)(null),b=(0,o.useRef)(null),{viewport:F,size:k}=(0,u.useThree)(),T=(0,o.useMemo)(()=>({u_time:{value:0},u_resolution:{value:new i.Vector2},u_radius:{value:.5},u_narrow:{value:2},u_length:{value:8},u_hazeSpeed:{value:3},u_dustSpeed:{value:2},u_hazeStrength:{value:.1},u_hazeFrequency:{value:32},u_dustDensity:{value:128},u_dustSize:{value:64},u_dustOpacity:{value:.1},u_edgeFade:{value:1.28},u_spiralTight:{value:.32},u_rotSpeed:{value:.32},u_baseColor:{value:new i.Vector3},u_cameraDistance:{value:8},u_lightMode:{value:!1}}),[]);return(0,l.useFrame)(a=>{if(!b.current)return;let o=b.current.uniforms;o.u_time.value=a.clock.elapsedTime,o.u_resolution.value.set(k.width,k.height),o.u_radius.value=e,o.u_narrow.value=t,o.u_length.value=r,o.u_hazeSpeed.value=n,o.u_dustSpeed.value=d,o.u_hazeStrength.value=f,o.u_hazeFrequency.value=v,o.u_dustDensity.value=p,o.u_dustSize.value=h,o.u_dustOpacity.value=_,o.u_edgeFade.value=m,o.u_spiralTight.value=g,o.u_rotSpeed.value=y,o.u_baseColor.value.set(...x),o.u_cameraDistance.value=z,o.u_lightMode.value=w}),(0,a.jsxs)("mesh",{ref:S,children:[(0,a.jsx)("planeGeometry",{args:[F.width,F.height]}),(0,a.jsx)("shaderMaterial",{ref:b,vertexShader:c,fragmentShader:s,uniforms:T,transparent:!0})]})},d=({radius:e=1.5,narrow:o=1.8,length:l=10,hazeSpeed:u=.5,dustSpeed:i=1,hazeStrength:c=.25,hazeFrequency:s=100,dustDensity:d=300,dustSize:f=100,dustOpacity:v=.1,edgeFade:p=2,spiralTight:h=.5,rotSpeed:_=0,baseColor:m=[.753,.518,.988],baseColorLight:g=[.267,0,.667],cameraDistance:y=8.5,className:x})=>{let{resolvedTheme:z}=(0,r.useTheme)(),w="light"===z;return(0,a.jsx)("div",{className:x,style:{width:"100%",height:"100%",background:w?"#fff":"#0b0b0b"},children:(0,a.jsx)(t.Canvas,{className:"w-full h-full",gl:{antialias:!0,alpha:!0},children:(0,a.jsx)(n,{radius:e,narrow:o,length:l,hazeSpeed:u,dustSpeed:i,hazeStrength:c,hazeFrequency:s,dustDensity:d,dustSize:f,dustOpacity:v,edgeFade:p,spiralTight:h,rotSpeed:_,baseColor:w?g:m,cameraDistance:y,lightMode:w})})})};d.displayName="WarpTwister",e.s(["default",0,d])}]);