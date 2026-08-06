const B=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`,I=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uFlowDir;
uniform float uPulseSpeed;
uniform float uPulseLength;
uniform float uPulseBlend;
uniform float uPulseWidth;
uniform float uCableCount;
uniform float uThickness;
uniform float uRimWidth;
uniform float uWaviness;
uniform float uSway;
uniform float uSize;
uniform vec2 uCenter;
uniform vec2 uMouseOffset;
uniform float uGlow;
uniform float uFadeNear;
uniform float uFadeFar;
uniform float uBrightness;
uniform float uColorVariance;
uniform float uOpacity;
uniform vec3 uCableColor;
uniform vec3 uPulseColor;
uniform vec3 uTunnelColor;
uniform float uTunnelOpacity;
uniform float uGrain;
uniform float uGrainIntensity;
out vec4 fragColor;

void mainImage(out vec4 o, in vec2 fragCoord) {
  float size = uSize * 2.0;
  float flowDir = uFlowDir;
  float speedBase = uSpeed * 4.0 * flowDir;
  float waviness = uWaviness * 0.15;
  float rotationOsc = uSway * 0.5;
  float baseThick = uThickness * 0.35 + 0.05;
  float borderWeight = uRimWidth * 0.15 + 0.01;
  float cablesCount = floor(uCableCount);

  vec2 res = iResolution.xy;
  vec2 uv = (fragCoord - 0.5 * res) / min(res.y, res.x);
  uv -= (uCenter + uMouseOffset);
  uv /= (size + 0.0001);

  float r = length(uv);
  float angle = atan(uv.y, uv.x);
  float depth = -log(r + 0.0001);

  float swing = sin(iTime * (uSpeed * 0.5 + 0.1)) * rotationOsc;
  float waveOffset = sin(depth * 1.2 + iTime * speedBase * 0.25) * waviness;

  float angleNormalized = (angle / 6.2831853) + 0.5;
  float finalAngle = fract(angleNormalized + waveOffset + swing);

  float cableID = floor(finalAngle * cablesCount);
  float gvX = (fract(finalAngle * cablesCount) - 0.5);

  float rand = fract(sin(cableID * 12.9898) * 43758.5453);
  float randSpeed = (0.4 + rand * 0.6) * speedBase * uPulseSpeed;
  float cableThick = baseThick * (0.6 + rand * 0.4);

  vec3 cableCol = uCableColor;
  cableCol *= 1.0 + (rand - 0.5) * 0.4 * uColorVariance;
  cableCol = mix(cableCol, uPulseColor, rand * 0.25 * uColorVariance);

  float scroll = depth + (iTime * randSpeed);
  float pulseFact = fract(scroll);

  float distToCore = abs(gvX);
  float wireMask = smoothstep(cableThick, cableThick - 0.05, distToCore);
  float rimGlow = smoothstep(borderWeight, 0.0, abs(distToCore - cableThick));

  float pulseThick = cableThick * uPulseWidth;
  float pulseMask = smoothstep(pulseThick, pulseThick - 0.05 * uPulseWidth, distToCore);

  float pulseDist = abs(pulseFact - 0.5);
  float pulseTotal = uPulseLength;
  float pulseCore = pulseTotal * (1.0 - uPulseBlend);
  float pulseLo = min(pulseCore, pulseTotal - max(fwidth(scroll), 1e-4));
  float dataPulse = 1.0 - smoothstep(pulseLo, pulseTotal, pulseDist);

  float aBody = wireMask * uTunnelOpacity;
  float aRim = rimGlow;
  float aPulse = clamp(dataPulse * pulseMask, 0.0, 1.0);

  vec3 fiberCol = uTunnelColor * aBody
    + cableCol * aRim * 1.3 * uGlow
    + uPulseColor * dataPulse * 3.0 * pulseMask;

  float distFade = smoothstep(0.0, uFadeNear, r) * smoothstep(uFadeFar, uFadeFar - 0.9, r);
  float inten = clamp(aBody + aRim + aPulse, 0.0, 1.0) * distFade;

  vec3 finalCol = fiberCol * uBrightness;
  float alpha = clamp(inten, 0.0, 1.0) * uOpacity;
  vec3 outRgb = finalCol * alpha;

  if (uGrain > 0.5) {
    float gv = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453) - 0.5) * uGrainIntensity;
    outRgb = clamp(outRgb + gv, 0.0, 1.0);
    alpha = clamp(alpha + gv, 0.0, 1.0);
  }

  o = vec4(outRgb, alpha);
}

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  fragColor = o;
}`;function p(u){const i=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(u);return i?[parseInt(i[1],16)/255,parseInt(i[2],16)/255,parseInt(i[3],16)/255]:[1,1,1]}function M(u,i={}){const o={cableColor:"#A855F7",pulseColor:"#A855F7",tunnelColor:"#5227FF",tunnelOpacity:0,speed:.1,flowDirection:"outward",pulseSpeed:2,pulseLength:.28,pulseBlend:1,pulseWidth:1,cableCount:20,thickness:.35,rimWidth:.15,waviness:.3,sway:.5,size:1,centerX:0,centerY:0,glow:1,fadeNear:.5,fadeFar:2,brightness:1,colorVariance:!0,grain:!0,grainIntensity:.05,opacity:1,mouseInteraction:!0,mouseStrength:.1,...i},a=document.createElement("canvas");a.style.width="100%",a.style.height="100%",a.style.display="block";const e=a.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1});if(!e)return!1;u.appendChild(a),e.clearColor(0,0,0,0);const h=(r,k)=>{const s=e.createShader(k);return e.shaderSource(s,r),e.compileShader(s),e.getShaderParameter(s,e.COMPILE_STATUS)?s:(console.error(e.getShaderInfoLog(s)),null)},g=h(B,e.VERTEX_SHADER),C=h(I,e.FRAGMENT_SHADER);if(!g||!C)return!1;const n=e.createProgram();if(e.attachShader(n,g),e.attachShader(n,C),e.linkProgram(n),!e.getProgramParameter(n,e.LINK_STATUS))return console.error(e.getProgramInfoLog(n)),!1;e.useProgram(n);const S=new Float32Array([-1,-1,3,-1,-1,3]),F=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,F),e.bufferData(e.ARRAY_BUFFER,S,e.STATIC_DRAW);const v=e.getAttribLocation(n,"position");e.enableVertexAttribArray(v),e.vertexAttribPointer(v,2,e.FLOAT,!1,0,0);const t=r=>e.getUniformLocation(n,r),f=p(o.cableColor),c=p(o.pulseColor),m=p(o.tunnelColor);e.uniform1f(t("uSpeed"),o.speed),e.uniform1f(t("uFlowDir"),o.flowDirection==="outward"?-1:1),e.uniform1f(t("uPulseSpeed"),o.pulseSpeed),e.uniform1f(t("uPulseLength"),o.pulseLength),e.uniform1f(t("uPulseBlend"),o.pulseBlend),e.uniform1f(t("uPulseWidth"),o.pulseWidth),e.uniform1f(t("uCableCount"),o.cableCount),e.uniform1f(t("uThickness"),o.thickness),e.uniform1f(t("uRimWidth"),o.rimWidth),e.uniform1f(t("uWaviness"),o.waviness),e.uniform1f(t("uSway"),o.sway),e.uniform1f(t("uSize"),o.size),e.uniform2f(t("uCenter"),o.centerX,o.centerY),e.uniform2f(t("uMouseOffset"),0,0),e.uniform1f(t("uGlow"),o.glow),e.uniform1f(t("uFadeNear"),o.fadeNear),e.uniform1f(t("uFadeFar"),o.fadeFar),e.uniform1f(t("uBrightness"),o.brightness),e.uniform1f(t("uColorVariance"),o.colorVariance?1:0),e.uniform1f(t("uOpacity"),o.opacity),e.uniform3f(t("uCableColor"),f[0],f[1],f[2]),e.uniform3f(t("uPulseColor"),c[0],c[1],c[2]),e.uniform3f(t("uTunnelColor"),m[0],m[1],m[2]),e.uniform1f(t("uTunnelOpacity"),o.tunnelOpacity),e.uniform1f(t("uGrain"),o.grain?1:0),e.uniform1f(t("uGrainIntensity"),o.grainIntensity);const y=t("iTime"),P=t("iResolution"),R=t("uMouseOffset"),b=Math.min(window.devicePixelRatio||1,2),w=()=>{const r=u.getBoundingClientRect();a.width=Math.max(1,Math.floor(r.width*b)),a.height=Math.max(1,Math.floor(r.height*b)),e.viewport(0,0,a.width,a.height),e.uniform2f(P,a.width,a.height)};w(),new ResizeObserver(w).observe(u);let l=[.5,.5],d=[.5,.5];o.mouseInteraction&&window.addEventListener("mousemove",r=>{d=[r.clientX/window.innerWidth,1-r.clientY/window.innerHeight]},{passive:!0});const A=performance.now(),T=r=>{e.uniform1f(y,(r-A)*.001),l[0]+=.05*(d[0]-l[0]),l[1]+=.05*(d[1]-l[1]),e.uniform2f(R,(l[0]-.5)*o.mouseStrength,(l[1]-.5)*o.mouseStrength),e.clear(e.COLOR_BUFFER_BIT),e.drawArrays(e.TRIANGLES,0,3),requestAnimationFrame(T)};return requestAnimationFrame(T),!0}export{M as mountLightTunnel};
