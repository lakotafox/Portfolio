(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,27178,e=>{"use strict";var a=e.i(41929),r=e.i(49456),u=e.i(26881),o=e.i(36048),t=e.i(81484),i=e.i(63617),l=e.i(46308);let n=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,f=`
precision highp float;
varying vec2 vUv;

uniform float uTime;
uniform float uBars;
uniform float uCurve;
uniform float uBalance;
uniform float uSpeed;
uniform float uSpread;
uniform float uMirror;
uniform float uAltDir;
uniform float uFlipRate;
uniform float uRange;
uniform float uPower;
uniform int uMode;
uniform bool uVertical;
uniform vec3 uTint;
uniform vec3 uBg;
uniform float uAlpha;
uniform vec2 uPointer;
uniform float uCursorActive;

const float TAU = 6.2831853;

float ease(float t, float p, int m) {
  if (m == 1) return 1.0 - pow(1.0 - t, p);
  if (m == 2) return t < 0.5
    ? pow(2.0, p - 1.0) * pow(t, p)
    : 1.0 - pow(-2.0 * t + 2.0, p) / 2.0;
  return pow(t, p);
}

float remap(float v, float b) {
  float g = exp(mix(-2.0, 2.0, b));
  return pow(v, g);
}

void main() {
  vec2 coord = vUv;

  float ax1 = uVertical ? coord.x : coord.y;
  float ax2 = uVertical ? coord.y : coord.x;

  float sym = abs(ax1 - 0.5) * uMirror;
  float band = floor(sym * uBars + 0.5);

  float cursorPhase = ((uPointer.x - 0.5) * 2.0 + (uPointer.y - 0.5)) * 0.5 * uCursorActive;
  float pOff = band * (1.0 / (uBars * max(uSpread, 0.001)));
  float phi = fract(uTime * uSpeed + pOff + cursorPhase);
  float wave = ease(phi, uPower, uMode) * uRange - (uRange / 2.0);

  bool even = mod(band, 2.0) < 1.0;
  float flipped = even ? ax2 : 1.0 - ax2;
  ax2 = mix(ax2, flipped, uAltDir);

  float grad = pow(ax2, uCurve);
  grad = mix(grad, 1.0 - grad, 0.5 + sin(uTime * uFlipRate) * 0.5);

  float anim = fract(wave + grad);
  float val = 0.5 + 0.5 * sin(anim * TAU);
  val = remap(val, uBalance);

  vec3 out_col = mix(uTint, uBg, val);
  gl_FragColor = vec4(out_col, uAlpha);
}
`;function s(e){let a=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return a?[parseInt(a[1],16)/255,parseInt(a[2],16)/255,parseInt(a[3],16)/255]:[0,0,0]}let v=({speed:e,barCount:u,gradientPower:i,balance:v,phaseSpread:c,mirrorRepeat:m,alternateDirection:p,invertSpeed:d,phaseRange:g,curvePower:h,easingMode:x,vertical:w,color:R,backgroundColor:b,opacity:B,pointer:P,cursorInteraction:T})=>{let A=(0,r.useRef)(null),{size:C}=(0,t.useThree)(),y=(0,r.useRef)(new l.Vector2(.5,.5)),M=(0,r.useMemo)(()=>({uTime:{value:0},uResolution:{value:new l.Vector2(1,1)},uBars:{value:8},uCurve:{value:.2},uBalance:{value:.15},uSpeed:{value:.1},uSpread:{value:4},uMirror:{value:2},uAltDir:{value:0},uFlipRate:{value:.2},uRange:{value:2},uPower:{value:1},uMode:{value:0},uVertical:{value:!0},uTint:{value:new l.Vector3(1,1,1)},uBg:{value:new l.Vector3(0,0,0)},uAlpha:{value:1},uPointer:{value:new l.Vector2(.5,.5)},uCursorActive:{value:0}}),[]);return(0,o.useFrame)((a,r)=>{if(!A.current)return;let o=A.current.material;o.uniforms.uTime.value=a.clock.elapsedTime,o.uniforms.uResolution.value.set(C.width,C.height),o.uniforms.uBars.value=u,o.uniforms.uCurve.value=i,o.uniforms.uBalance.value=v,o.uniforms.uSpeed.value=e,o.uniforms.uSpread.value=c,o.uniforms.uMirror.value=m,o.uniforms.uAltDir.value=p,o.uniforms.uFlipRate.value=d,o.uniforms.uRange.value=g,o.uniforms.uPower.value=h,o.uniforms.uMode.value=x,o.uniforms.uVertical.value=w,o.uniforms.uAlpha.value=B;let[t,l,n]=s(R);o.uniforms.uTint.value.set(t,l,n);let[f,M,S]=s(b);o.uniforms.uBg.value.set(f,M,S),o.uniforms.uCursorActive.value=+!!T;let V=1-Math.exp(-r/.15);y.current.x+=(P[0]-y.current.x)*V,y.current.y+=(P[1]-y.current.y)*V,o.uniforms.uPointer.value.set(y.current.x,y.current.y)}),(0,a.jsxs)("mesh",{ref:A,children:[(0,a.jsx)("planeGeometry",{args:[2,2]}),(0,a.jsx)("shaderMaterial",{vertexShader:n,fragmentShader:f,uniforms:M,transparent:!0})]})},c=({width:e="100%",height:o="100%",className:t,children:l,barCount:n=8,gradientPower:f=.2,balance:s=.15,speed:c=.1,phaseSpread:m=4,mirrorRepeat:p=2,alternateDirection:d=0,invertSpeed:g=.2,phaseRange:h=2,curvePower:x=1,easingMode:w=0,vertical:R=!0,color:b="#ffffff",backgroundColor:B="#000000",opacity:P=1,cursorInteraction:T=!1})=>{let A=(0,r.useRef)(null),[C,y]=(0,r.useState)([.5,.5]),M=(0,r.useCallback)(e=>{if(!T)return;let a=A.current?.getBoundingClientRect();a&&y([(e.clientX-a.left)/a.width,1-(e.clientY-a.top)/a.height])},[T]);return(0,a.jsxs)("div",{ref:A,className:(0,i.cn)("relative overflow-hidden",t),style:{width:e,height:o},onPointerMove:M,children:[(0,a.jsx)(u.Canvas,{className:"absolute inset-0",gl:{antialias:!0,alpha:!0},orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},children:(0,a.jsx)(v,{speed:c,barCount:n,gradientPower:f,balance:s,phaseSpread:m,mirrorRepeat:p,alternateDirection:d,invertSpeed:g,phaseRange:h,curvePower:x,easingMode:w,vertical:R,color:b,backgroundColor:B,opacity:P,pointer:C,cursorInteraction:T})}),l&&(0,a.jsx)("div",{className:"relative z-1",children:l})]})};c.displayName="GradientBars",e.s(["default",0,c])}]);