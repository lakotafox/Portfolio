import{B as $,D as T,v as G,w as H,z as P}from"./main-z8ycv9rf.js";import{E as z,J as I,L as E}from"./main-shjzg9mc.js";var N=z(I(),1);if(typeof document<"u"){let K=document.createElement("style");K.dataset.src="polar-glow/PolarGlow.css",K.textContent=`.polar-glow-container {
  width: 100%;
  height: 100%;
}
`,document.head.appendChild(K)}var h=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,u=`#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {                int index = 0;                                              for (int i = 0; i < 2; i++) {                                    ColorStop currentColor = colors[i];                         bool isInBetween = currentColor.position <= factor;         index = int(mix(float(index), float(i), float(isInBetween)));   }                                                           ColorStop currentColor = colors[index];                     ColorStop nextColor = colors[index + 1];                    float range = nextColor.position - currentColor.position;   float lerpFactor = (factor - currentColor.position) / range;   finalColor = mix(currentColor.color, nextColor.color, lerpFactor); }

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);
  
  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);
  
  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;
  
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 auroraColor = intensity * rampColor;
  
  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;function W(K){let{colorStops:k=["#5227FF","#7cff67","#5227FF"],amplitude:w=1,blend:F=0.5,paused:M=!1}=K,O=N.useRef(K);O.current=K;let U=N.useRef(null),V=N.useRef(null);return N.useEffect(()=>{let q=V.current;if(!q)return;let X=new H({alpha:!0,premultipliedAlpha:!0,antialias:!0}),v=X.gl;v.clearColor(0,0,0,0),v.enable(v.BLEND),v.blendFunc(v.ONE,v.ONE_MINUS_SRC_ALPHA),v.canvas.style.backgroundColor="transparent";let C,A=-1,D=-1;function Q(){if(!q)return;let{offsetWidth:L,offsetHeight:B}=q;if(A=L,D=B,X.setSize(L,B),C)C.uniforms.uResolution.value=[L,B]}window.addEventListener("resize",Q);let Y=new T(v);if(Y.attributes.uv)delete Y.attributes.uv;let j=k.map((L)=>{let B=new $(L);return[B.r,B.g,B.b]});C=new G(v,{vertex:h,fragment:u,uniforms:{uTime:{value:0},uAmplitude:{value:w},uColorStops:{value:j},uResolution:{value:[q.offsetWidth,q.offsetHeight]},uBlend:{value:F}}});let y=new P(v,{geometry:Y,program:C});q.appendChild(v.canvas);let J=0,Z=(L)=>{J=requestAnimationFrame(Z);let{time:B=L*0.01,speed:S=1}=O.current;C.uniforms.uTime.value=B*S*0.1,C.uniforms.uAmplitude.value=O.current.amplitude??1,C.uniforms.uBlend.value=O.current.blend??F;let b=O.current.colorStops??k;C.uniforms.uColorStops.value=b.map((x)=>{let _=new $(x);return[_.r,_.g,_.b]}),X.render({scene:y})};if(U.current={pause(){cancelAnimationFrame(J),J=0},resume(){if(J)return;if(q.offsetWidth!==A||q.offsetHeight!==D)Q();J=requestAnimationFrame(Z)}},!O.current.paused)J=requestAnimationFrame(Z);return Q(),()=>{if(cancelAnimationFrame(J),J=0,U.current=null,window.removeEventListener("resize",Q),q&&v.canvas.parentNode===q)q.removeChild(v.canvas);v.getExtension("WEBGL_lose_context")?.loseContext()}},[w]),N.useEffect(()=>{let q=U.current;if(q)(M?q.pause:q.resume)()},[M]),E("div",{ref:V,className:"polar-glow-container"})}W.pausable=!0;export{W as default};
