(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,50231,e=>{"use strict";var l=e.i(41929),t=e.i(49456),r=e.i(26881),a=e.i(36048),u=e.i(81484),o=e.i(46308),i=e.i(63617);let n=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,c=`
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uRes;

uniform float uSpeed;
uniform float uGlyph;
uniform float uTileDensity;
uniform float uTileShear;
uniform float uBevelWidth;
uniform float uBevelSoftness;
uniform float uRefraction;
uniform float uChroma;
uniform float uSpecExp;
uniform float uSpecStrength;
uniform vec3  uGlyphColor;
uniform vec3  uRecessColor;
uniform vec3  uBg;
uniform float uFreqX;
uniform float uFreqY;
uniform float uFreqXY;
uniform float uAlpha;
uniform vec2  uPointer;
uniform float uPointerActive;
uniform float uPointerRadius;
uniform float uPointerStrength;

int glyphForLevel(int level) {
  if (level <= 0) return 0;
  if (level == 1) return 2;
  if (level == 2) return 34;
  if (level == 3) return 328;
  if (level == 4) return 2976;
  if (level == 5) return 28662;
  if (level == 6) return 63903;
  return 65535;
}

float readGlyphPixel(vec2 cellUv, int mask) {
  vec2 p = floor(cellUv * 4.0);
  if (p.x < 0.0 || p.x > 3.0 || p.y < 0.0 || p.y > 3.0) return 0.0;
  int bit = int(p.x) + int(p.y) * 4;
  return float((mask >> bit) & 1);
}

float samplePatternLuma(vec2 fragPx) {
  vec2 cell = floor(fragPx / uGlyph);
  vec2 cellPx = cell * uGlyph + (uGlyph * 0.5);

  vec2 ndc = (cellPx / uRes) * 2.0 - 1.0;
  ndc.x *= uRes.x / uRes.y;

  float t = uTime * uSpeed * 0.8;
  float a = sin(ndc.x * uFreqX + t);
  float b = sin(ndc.y * uFreqY - t);
  float c = sin(ndc.x * ndc.y * uFreqXY + t * 1.5);
  float field = (a + b + c) / 3.0;
  field = field * 0.5 + 0.5;

  if (uPointerActive > 0.5) {
    float d = distance(cellPx, uPointer);
    float radial = smoothstep(0.0, max(uPointerRadius, 1.0), d);
    field *= mix(1.0, radial, clamp(uPointerStrength, 0.0, 1.0));
  }

  vec2 cellUv = fract(fragPx / uGlyph);
  int level = int(clamp(field, 0.0, 1.0) * 7.0);
  int mask = glyphForLevel(level);
  return readGlyphPixel(cellUv, mask) * field;
}

float tileHeight(vec2 surfaceUv) {
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 st = vec2(surfaceUv.x * aspect, surfaceUv.y);

  mat2 shear = mat2(1.0, uTileShear, -uTileShear, 1.0);
  st = shear * st;
  st *= max(uTileDensity, 0.001);

  vec2 p = fract(st) - 0.5;
  float chebyshev = max(abs(p.x), abs(p.y));
  float bevelInner = clamp(0.5 - uBevelWidth, 0.05, 0.5);
  float bevelOuter = clamp(bevelInner - uBevelSoftness, 0.0, bevelInner - 0.001);
  return smoothstep(bevelInner, bevelOuter, chebyshev);
}

vec3 tileNormal(vec2 surfaceUv) {
  vec2 e = vec2(0.002, 0.0);
  float h  = tileHeight(surfaceUv);
  float hx = tileHeight(surfaceUv + e.xy);
  float hy = tileHeight(surfaceUv + e.yx);
  return normalize(vec3(h - hx, h - hy, 0.02));
}

void main() {
  vec2 fragPx = vUv * uRes;

  float h = tileHeight(vUv);
  vec3  n = tileNormal(vUv);

  vec2 refractOffset = n.xy * uRefraction;
  float spread = max(uChroma, 0.0);

  float lumR = samplePatternLuma(fragPx - refractOffset * 1.0);
  float lumG = samplePatternLuma(fragPx - refractOffset * (1.0 + spread * 0.5));
  float lumB = samplePatternLuma(fragPx - refractOffset * (1.0 + spread * 1.5));

  vec3 col;
  col.r = mix(uRecessColor.r, uGlyphColor.r, lumR);
  col.g = mix(uRecessColor.g, uGlyphColor.g, lumG);
  col.b = mix(uRecessColor.b, uGlyphColor.b, lumB);

  vec3 lightDir = normalize(vec3(0.5, 0.8, 1.0));
  vec3 halfVec  = normalize(lightDir + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, halfVec), 0.0), max(uSpecExp, 1.0));
  col += spec * uSpecStrength * smoothstep(0.1, 0.9, h);

  col *= mix(0.1, 1.0, smoothstep(0.0, 0.1, h));

  float fieldMix = clamp(max(max(lumR, lumG), lumB), 0.0, 1.0);
  vec3 final = mix(uBg, col, fieldMix);

  gl_FragColor = vec4(final, uAlpha);
}
`;function s(e){let l=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return l?[parseInt(l[1],16)/255,parseInt(l[2],16)/255,parseInt(l[3],16)/255]:[0,0,0]}let v=e=>{let r=(0,t.useRef)(null),{size:i}=(0,u.useThree)(),v=(0,t.useRef)(new o.Vector2(-1,-1));(0,a.useFrame)((l,t)=>{if(!r.current)return;let a=r.current.material.uniforms;a.uTime.value=l.clock.elapsedTime,a.uRes.value.set(i.width,i.height),a.uSpeed.value=e.speed,a.uGlyph.value=e.glyphSize,a.uTileDensity.value=e.tileDensity,a.uTileShear.value=e.tileShear,a.uBevelWidth.value=e.bevelWidth,a.uBevelSoftness.value=e.bevelSoftness,a.uRefraction.value=e.refractionStrength,a.uChroma.value=e.chromaticSpread,a.uSpecExp.value=e.specularExponent,a.uSpecStrength.value=e.specularStrength,a.uFreqX.value=e.patternFreqX,a.uFreqY.value=e.patternFreqY,a.uFreqXY.value=e.patternFreqXY,a.uAlpha.value=e.opacity;let u=s(e.glyphColor);a.uGlyphColor.value.set(u[0],u[1],u[2]);let o=s(e.recessColor);a.uRecessColor.value.set(o[0],o[1],o[2]);let n=s(e.backgroundColor);if(a.uBg.value.set(n[0],n[1],n[2]),e.cursorInteraction){let l=e.pointer[0]*i.width,r=(1-e.pointer[1])*i.height,u=1-Math.exp(-t/.08);v.current.x+=(l-v.current.x)*u,v.current.y+=(r-v.current.y)*u,a.uPointer.value.copy(v.current),a.uPointerActive.value=1,a.uPointerRadius.value=e.cursorRadius,a.uPointerStrength.value=e.cursorIntensity}else a.uPointerActive.value=0});let f=(0,t.useMemo)(()=>({uTime:{value:0},uRes:{value:new o.Vector2(1,1)},uSpeed:{value:1},uGlyph:{value:8},uTileDensity:{value:4},uTileShear:{value:.15},uBevelWidth:{value:.1},uBevelSoftness:{value:.1},uRefraction:{value:40},uChroma:{value:.15},uSpecExp:{value:64},uSpecStrength:{value:1},uGlyphColor:{value:new o.Vector3(.225,1.275,.6)},uRecessColor:{value:new o.Vector3(.02,.05,.02)},uBg:{value:new o.Vector3(0,0,0)},uFreqX:{value:6},uFreqY:{value:4},uFreqXY:{value:5},uAlpha:{value:1},uPointer:{value:new o.Vector2(-1,-1)},uPointerActive:{value:0},uPointerRadius:{value:100},uPointerStrength:{value:1}}),[]);return(0,l.jsxs)("mesh",{ref:r,children:[(0,l.jsx)("planeGeometry",{args:[2,2]}),(0,l.jsx)("shaderMaterial",{vertexShader:n,fragmentShader:c,uniforms:f,transparent:!0})]})},f=({width:e="100%",height:a="100%",className:u,children:o,speed:n=1,glyphSize:c=8,tileDensity:s=3.3,tileShear:f=-.22,bevelWidth:h=.02,bevelSoftness:p=.1,refractionStrength:m=100,chromaticSpread:d=.2,specularExponent:x=150,specularStrength:g=1,glyphColor:y="#FFFFFF",recessColor:S="#050D08",backgroundColor:P="#000000",patternFreqX:R=6,patternFreqY:b=4,patternFreqXY:C=10,opacity:F=1,dpr:T=1.5,cursorInteraction:G=!1,cursorRadius:U=129,cursorIntensity:q=1})=>{let B=(0,t.useRef)(null),[X,Y]=(0,t.useState)([-1,-1]),w=(0,t.useCallback)(e=>{if(!G)return;let l=B.current?.getBoundingClientRect();l&&Y([(e.clientX-l.left)/l.width,(e.clientY-l.top)/l.height])},[G]),A=(0,t.useCallback)(()=>{Y([-1,-1])},[]);return(0,l.jsxs)("div",{ref:B,className:(0,i.cn)("relative overflow-hidden",u),style:{width:e,height:a},onPointerMove:w,onPointerLeave:A,children:[(0,l.jsx)(r.Canvas,{className:"absolute inset-0",dpr:[1,T],gl:{antialias:!1,alpha:!0,powerPreference:"high-performance"},orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},children:(0,l.jsx)(v,{speed:n,glyphSize:c,tileDensity:s,tileShear:f,bevelWidth:h,bevelSoftness:p,refractionStrength:m,chromaticSpread:d,specularExponent:x,specularStrength:g,glyphColor:y,recessColor:S,backgroundColor:P,patternFreqX:R,patternFreqY:b,patternFreqXY:C,opacity:F,cursorInteraction:G,cursorRadius:U,cursorIntensity:q,pointer:X})}),o&&(0,l.jsx)("div",{className:"relative z-10",children:o})]})};f.displayName="AsciiTiles",e.s(["default",0,f])}]);