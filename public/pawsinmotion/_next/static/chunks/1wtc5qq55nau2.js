(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,2117,e=>{"use strict";var l=e.i(41929),u=e.i(49456),t=e.i(26881),a=e.i(36048),o=e.i(81484),i=e.i(46308),n=e.i(63617);let s=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,r=`
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uRes;

uniform float uLineCount;
uniform float uWaveAmp;
uniform float uWaveFreq;
uniform float uLineThickness;
uniform float uLineGlow;
uniform vec3  uLineColor;
uniform float uLineIntensity;

uniform vec3  uPulseColor;
uniform float uPulseSpeed;
uniform float uPulseWidth;
uniform float uPulseIntensity;
uniform float uPulsePhase;
uniform float uPulseWidthScale;
uniform float uPulseBoost;

uniform float uChroma;
uniform vec3  uBg;
uniform float uAlpha;

vec3 sampleField(vec2 fragCoord) {
  vec2 uv = (fragCoord * 2.0 - uRes) / uRes.y;

  float sway = cos(uv.x * uWaveFreq) * uWaveAmp;
  float dist = abs(fract((uv.y + sway) * uLineCount) - 0.5);
  float lineMask = uLineGlow / max(dist, uLineThickness);
  vec3 col = uLineColor * uLineIntensity * lineMask;

  float pulse = abs(fract((uv.x - uPulsePhase) * uPulseSpeed) - 0.5);
  float bell  = exp(-pulse * pulse * uPulseWidth * uPulseWidthScale);
  float hot   = (uLineGlow * 0.5) / max(dist, uLineThickness * 0.1);
  col += uPulseColor * bell * hot * uPulseIntensity * uPulseBoost;

  return col;
}

void main() {
  vec2 fragCoord = vUv * uRes;

  vec2 ndc = vUv - 0.5;
  vec2 offset = ndc * length(ndc) * uChroma * 0.5;

  vec3 r = sampleField(fragCoord + offset * uRes);
  vec3 g = sampleField(fragCoord);
  vec3 b = sampleField(fragCoord - offset * uRes);

  vec3 col = vec3(r.r, g.g, b.b);
  col = clamp(col, 0.0, 1.0);
  col = mix(uBg, col + uBg * (1.0 - clamp(dot(col, vec3(1.0)), 0.0, 1.0)), 1.0);

  gl_FragColor = vec4(col, uAlpha);
}
`,c=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;function v(e){let l=c.exec(e);return l?[parseInt(l[1],16)/255,parseInt(l[2],16)/255,parseInt(l[3],16)/255]:[0,0,0]}let h=e=>{let{gl:l,size:t}=(0,o.useThree)(),n=(0,u.useRef)(null);if(null===n.current){let e=new i.PlaneGeometry(2,2),l=new i.ShaderMaterial({vertexShader:s,fragmentShader:r,transparent:!0,uniforms:{uTime:{value:0},uRes:{value:new i.Vector2(1,1)},uLineCount:{value:1},uWaveAmp:{value:1},uWaveFreq:{value:2},uLineThickness:{value:.05},uLineGlow:{value:.01},uLineColor:{value:new i.Vector3(.3,.2,.8)},uLineIntensity:{value:2},uPulseColor:{value:new i.Vector3(.8,.3,.3)},uPulseSpeed:{value:.5},uPulseWidth:{value:25},uPulseIntensity:{value:10},uPulsePhase:{value:0},uPulseWidthScale:{value:1},uPulseBoost:{value:1},uChroma:{value:.05},uBg:{value:new i.Vector3(0,0,0)},uAlpha:{value:1}}}),u=new i.Mesh(e,l),t=new i.Scene;t.add(u);let a=new i.OrthographicCamera(-1,1,1,-1,0,1);a.position.z=1,n.current={mat:l,geom:e,mesh:u,scene:t,cam:a,pointer:{active:!1,nx:.5,ny:.5,targetPhase:0,smoothedPhase:0,timePhase:0,click:0,wasActive:!1}}}let c=e.onPointerReady;return(0,u.useEffect)(()=>{let e=n.current;e&&c(e.pointer)},[c]),(0,u.useEffect)(()=>()=>{let e=n.current;e&&(e.mat.dispose(),e.geom.dispose())},[]),(0,a.useFrame)((u,a)=>{let o=n.current;if(!o)return;let i=o.mat.uniforms;i.uTime.value=u.clock.elapsedTime,i.uRes.value.set(t.width,t.height),i.uLineCount.value=e.lineCount,i.uWaveAmp.value=e.waveAmplitude,i.uWaveFreq.value=e.waveFrequency,i.uLineThickness.value=e.lineThickness,i.uLineGlow.value=e.lineGlow,i.uLineIntensity.value=e.lineIntensity,i.uPulseSpeed.value=e.pulseSpeed,i.uPulseWidth.value=e.pulseWidth,i.uPulseIntensity.value=e.pulseIntensity,i.uChroma.value=e.chromaticAberration,i.uAlpha.value=e.opacity;let s=v(e.lineColor);i.uLineColor.value.set(s[0],s[1],s[2]);let r=v(e.pulseColor);i.uPulseColor.value.set(r[0],r[1],r[2]);let c=v(e.backgroundColor);i.uBg.value.set(c[0],c[1],c[2]);let h=o.pointer,d=t.width/Math.max(t.height,1);if(e.cursorInteraction&&h.active){h.targetPhase=(2*h.nx-1)*d;let l=Math.min(Math.max(e.cursorLerp,0),1);h.smoothedPhase+=(h.targetPhase-h.smoothedPhase)*l,i.uPulsePhase.value=h.smoothedPhase;let u=1-h.ny;i.uPulseWidthScale.value=.5+1.5*u}else h.wasActive&&(h.timePhase=h.smoothedPhase),h.timePhase+=a,h.smoothedPhase+=(h.timePhase-h.smoothedPhase)*.15,i.uPulsePhase.value=h.smoothedPhase,i.uPulseWidthScale.value+=(1-i.uPulseWidthScale.value)*.1;h.wasActive=h.active,h.click=Math.max(0,h.click-a*e.clickBurstDecay),i.uPulseBoost.value=1+h.click*(e.clickBurstStrength-1),l.setRenderTarget(null),l.render(o.scene,o.cam)},1),null},d=({width:e="100%",height:a="100%",className:o,children:i,lineCount:s=2,waveAmplitude:r=.5,waveFrequency:c=1.8,lineThickness:v=.05,lineGlow:d=.01,lineColor:m="#4D33CC",lineIntensity:f=3,pulseColor:p="#CC4D4D",pulseSpeed:P=.25,pulseWidth:g=35,pulseIntensity:C=5.5,chromaticAberration:y=.05,backgroundColor:w="#000000",opacity:L=1,dpr:k=1.5,cursorInteraction:x=!0,cursorLerp:W=.12,clickBurstStrength:S=2.5,clickBurstDecay:T=2.5})=>{let A=(0,u.useRef)(null),I=(0,u.useRef)(null),R=e=>{let l=A.current,u=I.current;if(!l||!u)return;let t=l.getBoundingClientRect();u.nx=(e.clientX-t.left)/Math.max(t.width,1),u.ny=(e.clientY-t.top)/Math.max(t.height,1),u.active=!0};return(0,l.jsxs)("div",{ref:A,className:(0,n.cn)("relative overflow-hidden",o),style:{width:e,height:a},onPointerMove:x?R:void 0,onPointerEnter:x?R:void 0,onPointerLeave:x?()=>{let e=I.current;e&&(e.active=!1)}:void 0,onPointerDown:x?e=>{R(e);let l=I.current;l&&(l.click=1)}:void 0,children:[(0,l.jsx)(t.Canvas,{className:"absolute inset-0",dpr:[1,k],gl:{antialias:!1,alpha:!0,powerPreference:"high-performance"},orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},children:(0,l.jsx)(h,{lineCount:s,waveAmplitude:r,waveFrequency:c,lineThickness:v,lineGlow:d,lineColor:m,lineIntensity:f,pulseColor:p,pulseSpeed:P,pulseWidth:g,pulseIntensity:C,chromaticAberration:y,backgroundColor:w,opacity:L,cursorInteraction:x,cursorLerp:W,clickBurstStrength:S,clickBurstDecay:T,onPointerReady:e=>{I.current=e}})}),i&&(0,l.jsx)("div",{className:"relative z-10",children:i})]})};d.displayName="TwilightLines",e.s(["default",0,d])}]);