(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,79753,e=>{"use strict";var u=e.i(41929),o=e.i(49456),a=e.i(26881),t=e.i(36048),r=e.i(81484),i=e.i(63617),l=e.i(46308);let s=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,n=`
precision highp float;

varying vec2 vUv;

uniform float uElapsed;
uniform vec2 uViewport;
uniform float uTempo;
uniform float uFlicker;
uniform float uBeamTotal;
uniform float uBeamGap;
uniform float uBeamWidth;
uniform float uSoftness;
uniform float uWidthPulse;
uniform float uWidthFloor;
uniform float uScaleX;
uniform float uShiftY;
uniform float uOriginX;
uniform float uChromaR;
uniform float uChromaG;
uniform float uChromaB;
uniform float uMaskTop;
uniform float uMaskBottom;
uniform float uMaskLeft;
uniform float uMaskRight;
uniform float uBloom;
uniform float uLuminance;
uniform vec3 uBgColor;
uniform float uAlpha;
uniform vec2 uPointer;
uniform float uCursorActive;

float prng(vec2 s) {
  s = fract(s * vec2(198.75, 743.26));
  s += dot(s, s + 67.41);
  return fract(s.x * s.y);
}

float pulse(float id, float t, float rate) {
  float e = prng(vec2(id * 341.7, id * 527.3));
  return clamp(sin(t * id * rate * e) * 0.5 + 0.5, 0.0, 1.0);
}

void main() {
  float ar = uViewport.x / uViewport.y;
  vec2 p = (vUv - 0.5) * vec2(ar, 1.0);

  p.x *= uScaleX;
  p.y += uShiftY;

  float t = uElapsed * uTempo;
  vec3 rays = vec3(0.0);

  for (float n = 0.0; n < 128.0; n += 1.0) {
    if (n >= uBeamTotal) break;

    float idx = n * 2.0;
    float rng = prng(vec2(idx, 382.91));
    float thickness = uBeamWidth * (sin(t * rng) * uWidthPulse + uWidthFloor);
    float blur = uSoftness * (sin(t * rng) * uWidthPulse + uWidthFloor);

    float midPoint = uBeamTotal * 0.5;
    float pointerShift = (uPointer.x - 0.5) * 4.0 * uCursorActive;
    float xPos = (n - midPoint) * uBeamGap + uOriginX + pointerShift;
    float beam = smoothstep(thickness + blur, thickness, abs(p.x - xPos));

    rays += beam * pulse(2.0 + idx * 0.02, t, uFlicker);
  }

  rays.r -= pulse(4.0, t, uFlicker) * uChromaR;
  rays.g -= pulse(5.0, t, uFlicker) * uChromaG;
  rays.b -= pulse(6.0, t, uFlicker) * uChromaB;

  rays *= smoothstep(-uMaskBottom, 0.0, p.y);
  rays *= smoothstep(0.0, -uMaskTop, p.y);
  rays *= smoothstep(-uMaskLeft, 1.0, p.x);
  rays *= smoothstep(uMaskRight, -1.0, p.x);

  rays += rays * uBloom;
  rays *= uLuminance;

  vec3 result = uBgColor + rays;
  gl_FragColor = vec4(result, uAlpha);
}
`,f=({speed:e,flickerRate:a,rayCount:i,raySpacing:f,rayThickness:m,edgeSoftness:v,widthPulse:c,widthBase:h,horizontalScale:p,verticalOffset:d,originX:g,colorShiftR:B,colorShiftG:k,colorShiftB:y,vignetteTop:C,vignetteBottom:x,vignetteLeft:S,vignetteRight:M,bloom:T,brightness:P,backgroundColor:R,opacity:b,pointer:w,cursorInteraction:F})=>{let W=(0,o.useRef)(null),{size:A}=(0,r.useThree)(),G=(0,o.useRef)(new l.Vector2(.5,.5)),V=(0,o.useMemo)(()=>({uElapsed:{value:0},uViewport:{value:new l.Vector2(1,1)},uTempo:{value:1},uFlicker:{value:1.4},uBeamTotal:{value:32},uBeamGap:{value:.2},uBeamWidth:{value:.1},uSoftness:{value:.3},uWidthPulse:{value:.5},uWidthFloor:{value:.6},uScaleX:{value:4.5},uShiftY:{value:-.5},uOriginX:{value:3.2},uChromaR:{value:1},uChromaG:{value:1},uChromaB:{value:1},uMaskTop:{value:.95},uMaskBottom:{value:.95},uMaskLeft:{value:5},uMaskRight:{value:5},uBloom:{value:2},uLuminance:{value:1},uBgColor:{value:new l.Vector3(0,0,0)},uAlpha:{value:1},uPointer:{value:new l.Vector2(.5,.5)},uCursorActive:{value:0}}),[]);return(0,t.useFrame)((u,o)=>{let t;if(!W.current)return;let r=W.current.material;r.uniforms.uElapsed.value=u.clock.elapsedTime,r.uniforms.uViewport.value.set(A.width,A.height),r.uniforms.uTempo.value=e,r.uniforms.uFlicker.value=a,r.uniforms.uBeamTotal.value=i,r.uniforms.uBeamGap.value=f,r.uniforms.uBeamWidth.value=m,r.uniforms.uSoftness.value=v,r.uniforms.uWidthPulse.value=c,r.uniforms.uWidthFloor.value=h,r.uniforms.uScaleX.value=p,r.uniforms.uShiftY.value=d,r.uniforms.uOriginX.value=g,r.uniforms.uChromaR.value=B,r.uniforms.uChromaG.value=k,r.uniforms.uChromaB.value=y,r.uniforms.uMaskTop.value=C,r.uniforms.uMaskBottom.value=x,r.uniforms.uMaskLeft.value=S,r.uniforms.uMaskRight.value=M,r.uniforms.uBloom.value=T,r.uniforms.uLuminance.value=P,r.uniforms.uBgColor.value.set(...(t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(R))?[parseInt(t[1],16)/255,parseInt(t[2],16)/255,parseInt(t[3],16)/255]:[0,0,0]),r.uniforms.uAlpha.value=b,r.uniforms.uCursorActive.value=+!!F;let l=1-Math.exp(-o/.15);G.current.x+=(w[0]-G.current.x)*l,G.current.y+=(w[1]-G.current.y)*l,r.uniforms.uPointer.value.set(G.current.x,G.current.y)}),(0,u.jsxs)("mesh",{ref:W,children:[(0,u.jsx)("planeGeometry",{args:[2,2]}),(0,u.jsx)("shaderMaterial",{vertexShader:s,fragmentShader:n,uniforms:V,transparent:!0})]})},m=({width:e="100%",height:t="100%",className:r,children:l,speed:s=.5,flickerRate:n=1,rayCount:m=25,raySpacing:v=.27,rayThickness:c=.35,edgeSoftness:h=.65,widthPulse:p=.1,widthBase:d=.3,horizontalScale:g=4.6,verticalOffset:B=-.5,originX:k=0,colorShiftR:y=1,colorShiftG:C=1,colorShiftB:x=1,vignetteTop:S=1.3,vignetteBottom:M=.95,vignetteLeft:T=3,vignetteRight:P=3,bloom:R=4,brightness:b=2,backgroundColor:w="#000000",opacity:F=1,cursorInteraction:W=!1})=>{let A=(0,o.useRef)(null),[G,V]=(0,o.useState)([.5,.5]),X=(0,o.useCallback)(e=>{if(!W)return;let u=A.current?.getBoundingClientRect();u&&V([(e.clientX-u.left)/u.width,1-(e.clientY-u.top)/u.height])},[W]);return(0,u.jsxs)("div",{ref:A,className:(0,i.cn)("relative overflow-hidden",r),style:{width:e,height:t},onPointerMove:X,children:[(0,u.jsx)(a.Canvas,{className:"absolute inset-0",gl:{antialias:!0,alpha:!0},orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},children:(0,u.jsx)(f,{speed:s,flickerRate:n,rayCount:m,raySpacing:v,rayThickness:c,edgeSoftness:h,widthPulse:p,widthBase:d,horizontalScale:g,verticalOffset:B,originX:k,colorShiftR:y,colorShiftG:C,colorShiftB:x,vignetteTop:S,vignetteBottom:M,vignetteLeft:T,vignetteRight:P,bloom:R,brightness:b,backgroundColor:w,opacity:F,pointer:G,cursorInteraction:W})}),l&&(0,u.jsx)("div",{className:"relative z-10",children:l})]})};m.displayName="BlurredRays",e.s(["default",0,m])}]);