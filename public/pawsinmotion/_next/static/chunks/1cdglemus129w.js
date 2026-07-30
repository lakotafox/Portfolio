(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,59194,e=>{"use strict";var r=e.i(41929),u=e.i(49456),a=e.i(26881),o=e.i(36048),t=e.i(81484),l=e.i(46308),i=e.i(63617);let n=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,s=`
precision highp float;

uniform float uTime;
uniform vec2 uRes;
uniform float uSpeed;
uniform float uScale;
uniform int uOctaves;
uniform float uPersist;
uniform float uLacun;
uniform float uDrift;
uniform float uWarp;
uniform vec3 uCol1;
uniform vec3 uCol2;
uniform float uGain;
uniform float uSat;
uniform float uBright;
uniform float uAlpha;
uniform vec2 uPointer;
uniform float uCursorActive;
uniform float uCursorIntensity;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(41.713, 83.457))) * 35718.549);
}

float vnoise(vec2 p) {
  vec2 g = floor(p);
  vec2 f = fract(p);
  vec2 w = f * f * (3.0 - 2.0 * f);

  float tl = hash(g);
  float tr = hash(g + vec2(1.0, 0.0));
  float bl = hash(g + vec2(0.0, 1.0));
  float br = hash(g + vec2(1.0, 1.0));

  return mix(mix(tl, tr, w.x), mix(bl, br, w.x), w.y);
}

float layers(vec2 p) {
  float total = 0.0;
  float amp = 0.5;
  float angle = 0.47;
  float ca = cos(angle), sa = sin(angle);
  mat2 bend = mat2(ca, -sa, sa, ca);

  for (int k = 0; k < 8; k++) {
    if (k >= uOctaves) break;
    total += amp * vnoise(p);
    p = bend * p * uLacun + 193.7;
    amp *= uPersist;
  }

  return total;
}

void main() {
  vec2 coord = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
  coord *= uScale;

  float t = uTime * uSpeed;

  vec2 pointerCoord = (uPointer * 2.0 - 1.0) * vec2(uRes.x / uRes.y, 1.0) * uScale;
  float cursorDist = length(coord - pointerCoord);
  float cursorInfluence = smoothstep(0.8, 0.0, cursorDist) * uCursorActive * uCursorIntensity;

  vec2 cursorDir = normalize(coord - pointerCoord + 0.001);
  vec2 warpedCoord = coord + cursorDir * cursorInfluence * 0.12;

  float q = layers(warpedCoord + t * uDrift);
  float r = layers(warpedCoord + q * (1.0 + cursorInfluence * 0.08) + t * uWarp);

  float blend = r * uGain;
  vec3 raw = mix(uCol1, uCol2, smoothstep(0.3, 0.7, blend));

  float luma = dot(raw, vec3(0.299, 0.587, 0.114));
  vec3 col = mix(vec3(luma), raw, uSat) + uBright;
  col = clamp(col, 0.0, 1.0);

  gl_FragColor = vec4(col, uAlpha);
}
`;function c(e){let r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return r?[parseInt(r[1],16)/255,parseInt(r[2],16)/255,parseInt(r[3],16)/255]:[0,0,0]}let f=({speed:e,scale:a,octaves:i,persistence:c,lacunarity:f,driftSpeed:v,warpSpeed:m,col1Rgb:p,col2Rgb:d,colorGain:h,saturation:g,brightness:C,opacity:x,pointer:y,cursorInteraction:w,cursorIntensity:S})=>{let b=(0,u.useRef)(null),{size:R,viewport:I}=(0,t.useThree)(),P=(0,u.useRef)(new l.Vector2(.5,.5)),A=(0,u.useMemo)(()=>({uTime:{value:0},uRes:{value:new l.Vector2(1,1)},uSpeed:{value:1},uScale:{value:1},uOctaves:{value:6},uPersist:{value:.6},uLacun:{value:2},uDrift:{value:.1},uWarp:{value:.3},uCol1:{value:new l.Vector3(.1,.1,.1)},uCol2:{value:new l.Vector3(.9,.9,.9)},uGain:{value:.95},uSat:{value:.7},uBright:{value:.1},uAlpha:{value:1},uPointer:{value:new l.Vector2(.5,.5)},uCursorActive:{value:0},uCursorIntensity:{value:1}}),[]);return(0,o.useFrame)((r,u)=>{if(!b.current)return;let o=b.current.material;o.uniforms.uTime.value=r.clock.elapsedTime,o.uniforms.uRes.value.set(R.width*I.dpr,R.height*I.dpr),o.uniforms.uSpeed.value=e,o.uniforms.uScale.value=a,o.uniforms.uOctaves.value=i,o.uniforms.uPersist.value=c,o.uniforms.uLacun.value=f,o.uniforms.uDrift.value=v,o.uniforms.uWarp.value=m,o.uniforms.uCol1.value.set(...p),o.uniforms.uCol2.value.set(...d),o.uniforms.uGain.value=h,o.uniforms.uSat.value=g,o.uniforms.uBright.value=C,o.uniforms.uAlpha.value=x,o.uniforms.uCursorActive.value=+!!w,o.uniforms.uCursorIntensity.value=S;let t=1-Math.exp(-u/.15);P.current.x+=(y[0]-P.current.x)*t,P.current.y+=(y[1]-P.current.y)*t,o.uniforms.uPointer.value.set(P.current.x,P.current.y)}),(0,r.jsxs)("mesh",{ref:b,children:[(0,r.jsx)("planeGeometry",{args:[2,2]}),(0,r.jsx)("shaderMaterial",{vertexShader:n,fragmentShader:s,uniforms:A,transparent:!0})]})},v=({width:e="100%",height:o="100%",className:t,children:l,speed:n=.6,scale:s=.6,octaves:v=6,persistence:m=.6,lacunarity:p=2.4,driftSpeed:d=.04,warpSpeed:h=.08,color1:g="#0a0a0a",color2:C="#e0e0e0",colorGain:x=1,saturation:y=0,brightness:w=.15,opacity:S=1,cursorInteraction:b=!1,cursorIntensity:R=1})=>{let I=(0,u.useMemo)(()=>c(g),[g]),P=(0,u.useMemo)(()=>c(C),[C]),A=(0,u.useRef)(null),[T,j]=(0,u.useState)([.5,.5]),D=(0,u.useCallback)(e=>{if(!b)return;let r=A.current?.getBoundingClientRect();r&&j([(e.clientX-r.left)/r.width,1-(e.clientY-r.top)/r.height])},[b]);return(0,r.jsxs)("div",{ref:A,className:(0,i.cn)("relative overflow-hidden",t),style:{width:e,height:o},onPointerMove:D,children:[(0,r.jsx)(a.Canvas,{className:"absolute inset-0 h-full w-full",orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},gl:{antialias:!0,alpha:!0},children:(0,r.jsx)(f,{speed:n,scale:s,octaves:v,persistence:m,lacunarity:p,driftSpeed:d,warpSpeed:h,col1Rgb:I,col2Rgb:P,colorGain:x,saturation:y,brightness:w,opacity:S,pointer:T,cursorInteraction:b,cursorIntensity:R})}),l&&(0,r.jsx)("div",{className:"pointer-events-none relative z-10",children:l})]})};v.displayName="Watercolor",e.s(["default",0,v])}]);