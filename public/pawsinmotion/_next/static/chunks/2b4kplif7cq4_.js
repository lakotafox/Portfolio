(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,31750,e=>{"use strict";var r=e.i(41929),u=e.i(49456),t=e.i(26881),a=e.i(36048),o=e.i(81484),l=e.i(46308),i=e.i(63617);let s=`
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
uniform float uRotSpeed;
uniform float uSteps;
uniform float uTurbN;
uniform float uTurbAmp;
uniform float uTurbFreq;
uniform float uTurbExp;

uniform float uRadius;
uniform float uPassthrough;
uniform float uBrightness;

uniform vec3  uCore;
uniform vec3  uGlow;
uniform float uColorMix;

uniform vec3  uBg;
uniform float uInvert;
uniform float uAlpha;

const int MAX_STEPS = 32;
const int MAX_TURB  = 10;

mat2 rot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

vec3 warpField(vec3 p, float t) {
  float freq  = uTurbFreq;
  float amp   = uTurbAmp;
  float phase = uSpeed * t;

  for (int i = 0; i < MAX_TURB; i++) {
    if (float(i) >= uTurbN) break;

    if (i >= 2 && i <= 4) {
      freq *= uTurbExp;
      continue;
    }

    float a = freq * p.y + phase;
    float s = sin(a) * amp / freq;

    vec3 dir;
    int m = i - (i / 3) * 3;
    if (m == 0)      dir = vec3(0.8, 0.0, 0.6);
    else if (m == 1) dir = vec3(0.0, 0.6, 0.8);
    else             dir = vec3(0.6, 0.8, 0.0);

    p += dir * s;
    p.xz = rot2(0.6) * p.xz;
    p.xy = rot2(0.4) * p.xy;

    freq *= uTurbExp;
  }

  return p;
}

float densityShell(vec3 p) {
  float d = length(p) - uRadius;
  if (d < 0.0) return -d * 0.7 + uPassthrough;
  return d * 0.7 + uPassthrough * 2.0;
}

void main() {
  vec2 uv = (vUv - 0.5);
  uv.x *= uRes.x / uRes.y;

  vec3 dir = normalize(vec3(uv * 2.0, 1.0));
  vec3 pos = vec3(0.0, 0.0, -5.0);

  float jitter = hash(gl_FragCoord.xy) - 0.5;
  pos += dir * jitter * 0.4;

  float orbit = uTime * uRotSpeed * uSpeed;
  pos.xz = rot2(orbit) * pos.xz;
  dir.xz = rot2(orbit) * dir.xz;

  vec3 accum = vec3(0.0);
  vec3 tint  = mix(uCore, uGlow, clamp(uColorMix, 0.0, 1.0));

  for (int i = 0; i < MAX_STEPS; i++) {
    if (float(i) >= uSteps) break;
    float vol = densityShell(warpField(pos, uTime));
    pos += dir * (vol / 2.5);
    accum += tint / vol;
  }

  vec3 col = tanh(uBrightness * sqrt(accum * accum * accum));

  if (uInvert > 0.5) {
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(uBg, tint * 0.85, lum);
  } else {
    col = mix(uBg, col + uBg * (1.0 - clamp(dot(col, vec3(1.0)), 0.0, 1.0)), 1.0);
  }

  gl_FragColor = vec4(col, uAlpha);
}
`,c=`
precision highp float;

varying vec2 vUv;

uniform sampler2D uTex;
uniform vec2  uDir;
uniform float uRadiusPx;

void main() {
  const float w0 = 0.2270270270;
  const float w1 = 0.1945945946;
  const float w2 = 0.1216216216;
  const float w3 = 0.0540540541;
  const float w4 = 0.0162162162;

  vec2 o1 = uDir * uRadiusPx * 1.0;
  vec2 o2 = uDir * uRadiusPx * 2.0;
  vec2 o3 = uDir * uRadiusPx * 3.0;
  vec2 o4 = uDir * uRadiusPx * 4.0;

  vec4 c = texture2D(uTex, vUv) * w0;
  c += texture2D(uTex, vUv + o1) * w1;
  c += texture2D(uTex, vUv - o1) * w1;
  c += texture2D(uTex, vUv + o2) * w2;
  c += texture2D(uTex, vUv - o2) * w2;
  c += texture2D(uTex, vUv + o3) * w3;
  c += texture2D(uTex, vUv - o3) * w3;
  c += texture2D(uTex, vUv + o4) * w4;
  c += texture2D(uTex, vUv - o4) * w4;

  gl_FragColor = c;
}
`,v=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
void main() { gl_FragColor = texture2D(uTex, vUv); }
`,p=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;function f(e){let r=p.exec(e);return r?[parseInt(r[1],16)/255,parseInt(r[2],16)/255,parseInt(r[3],16)/255]:[0,0,0]}let d=e=>{let r,t,i,p,d,m,h,{gl:g,size:x}=(0,o.useThree)(),T=(0,u.useRef)(null);return null===T.current&&(r=new l.PlaneGeometry(2,2),t=new l.ShaderMaterial({vertexShader:s,fragmentShader:n,transparent:!0,uniforms:{uTime:{value:0},uRes:{value:new l.Vector2(1,1)},uSpeed:{value:1},uRotSpeed:{value:.1},uSteps:{value:22},uTurbN:{value:8},uTurbAmp:{value:1.4},uTurbFreq:{value:4},uTurbExp:{value:2},uRadius:{value:3},uPassthrough:{value:.11},uBrightness:{value:5e-4},uCore:{value:new l.Vector3(.85,.32,1)},uGlow:{value:new l.Vector3(1,.45,.85)},uColorMix:{value:.5},uBg:{value:new l.Vector3(0,0,0)},uInvert:{value:0},uAlpha:{value:1}}}),i=new l.ShaderMaterial({vertexShader:s,fragmentShader:c,uniforms:{uTex:{value:null},uDir:{value:new l.Vector2(1,0)},uRadiusPx:{value:1}}}),p=new l.ShaderMaterial({vertexShader:s,fragmentShader:v,transparent:!0,uniforms:{uTex:{value:null}}}),d=new l.Scene,m=new l.Mesh(r,t),d.add(m),(h=new l.OrthographicCamera(-1,1,1,-1,0,1)).position.z=1,T.current={fogMat:t,blurMat:i,copyMat:p,screenGeom:r,passScene:d,passMesh:m,passCam:h,drawSize:new l.Vector2,targets:null}),(0,u.useEffect)(()=>()=>{let e=T.current;e&&(e.fogMat.dispose(),e.blurMat.dispose(),e.copyMat.dispose(),e.screenGeom.dispose(),e.targets&&(e.targets.a.dispose(),e.targets.b.dispose(),e.targets=null))},[]),(0,a.useFrame)(r=>{let u=T.current;if(!u)return;let t=u.fogMat.uniforms;t.uTime.value=r.clock.elapsedTime,g.getDrawingBufferSize(u.drawSize);let a=Math.max(1,Math.floor(u.drawSize.x)),o=Math.max(1,Math.floor(u.drawSize.y));t.uRes.value.set(x.width,x.height),t.uSpeed.value=e.speed,t.uRotSpeed.value=e.rotationSpeed,t.uSteps.value=e.rayMarchSteps,t.uTurbN.value=e.turbulenceIters,t.uTurbAmp.value=e.turbulenceAmplitude,t.uTurbFreq.value=e.turbulenceFrequency,t.uTurbExp.value=e.turbulenceExponent,t.uRadius.value=e.sphereRadius,t.uPassthrough.value=e.passthrough,t.uBrightness.value=e.brightness,t.uColorMix.value=e.colorMix,t.uAlpha.value=e.opacity,t.uInvert.value=+!!e.invertForLight;let i=f(e.coreColor);t.uCore.value.set(i[0],i[1],i[2]);let s=f(e.glowColor);t.uGlow.value.set(s[0],s[1],s[2]);let n=f(e.backgroundColor);if(t.uBg.value.set(n[0],n[1],n[2]),e.blur<=0){u.passMesh.material=u.fogMat,g.setRenderTarget(null),g.render(u.passScene,u.passCam);return}let c=Math.min(1,Math.max(.25,e.blurResolution)),v=Math.max(1,Math.floor(a*c)),p=Math.max(1,Math.floor(o*c)),d=function(e,r,u){let t=e.targets;if(t&&t.width===r&&t.height===u)return t;t&&(t.a.dispose(),t.b.dispose());let a={minFilter:l.LinearFilter,magFilter:l.LinearFilter,wrapS:l.ClampToEdgeWrapping,wrapT:l.ClampToEdgeWrapping,type:l.UnsignedByteType,depthBuffer:!1,stencilBuffer:!1},o={a:new l.WebGLRenderTarget(r,u,a),b:new l.WebGLRenderTarget(r,u,a),width:r,height:u};return e.targets=o,o}(u,v,p);u.passMesh.material=u.fogMat,g.setRenderTarget(d.a),g.render(u.passScene,u.passCam),u.passMesh.material=u.blurMat,u.blurMat.uniforms.uTex.value=d.a.texture,u.blurMat.uniforms.uDir.value.set(1/v,0),u.blurMat.uniforms.uRadiusPx.value=e.blur,g.setRenderTarget(d.b),g.render(u.passScene,u.passCam),u.blurMat.uniforms.uTex.value=d.b.texture,u.blurMat.uniforms.uDir.value.set(0,1/p),g.setRenderTarget(d.a),g.render(u.passScene,u.passCam),u.passMesh.material=u.copyMat,u.copyMat.uniforms.uTex.value=d.a.texture,g.setRenderTarget(null),g.render(u.passScene,u.passCam)},1),null},m=({width:e="100%",height:u="100%",className:a,children:o,speed:l=1,rotationSpeed:s=.1,rayMarchSteps:n=20,turbulenceIters:c=10,turbulenceAmplitude:v=2.5,turbulenceFrequency:p=7.5,turbulenceExponent:f=2.1,sphereRadius:m=2.9,passthrough:h=.05,brightness:g=5e-4,coreColor:x="#D946EF",glowColor:T="#F472B6",backgroundColor:b="#0A0A0A",colorMix:w=.5,invertForLight:S=!1,opacity:M=1,dpr:R=1.5,blur:y=1,blurResolution:C=1})=>(0,r.jsxs)("div",{className:(0,i.cn)("relative overflow-hidden",a),style:{width:e,height:u},children:[(0,r.jsx)(t.Canvas,{className:"absolute inset-0",dpr:[1,R],gl:{antialias:!1,alpha:!0,powerPreference:"high-performance"},orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},children:(0,r.jsx)(d,{speed:l,rotationSpeed:s,rayMarchSteps:n,turbulenceIters:c,turbulenceAmplitude:v,turbulenceFrequency:p,turbulenceExponent:f,sphereRadius:m,passthrough:h,brightness:g,coreColor:x,glowColor:T,backgroundColor:b,colorMix:w,invertForLight:S,opacity:M,blur:y,blurResolution:C})}),o&&(0,r.jsx)("div",{className:"relative z-10",children:o})]});m.displayName="FogSphere",e.s(["default",0,m])}]);