(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,21264,e=>{"use strict";var u=e.i(41929),o=e.i(49456),t=e.i(26881),a=e.i(36048),r=e.i(81484),i=e.i(46308),l=e.i(71884),n=e.i(63617);let s=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,c=`
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_speed;
uniform int u_iterations;
uniform float u_waveFrequency;
uniform float u_depthStep;
uniform float u_lineThickness;
uniform float u_waveAmplitude;
uniform vec3 u_lineColor;
uniform vec3 u_backgroundColor;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_offsetX;
uniform float u_offsetY;
uniform float u_scale;
uniform float u_opacity;

varying vec2 vUv;

void main() {
  float time = u_time * u_speed;
  vec2 resolution = u_resolution;

  vec3 accumulator = vec3(0.0);
  float depth = time;
  float magnitude = 0.0;

  vec2 baseCoord = (vUv - 0.5) * 2.0;
  baseCoord.x *= resolution.x / resolution.y;
  baseCoord *= u_scale;
  baseCoord += vec2(u_offsetX, u_offsetY);

  for (int i = 0; i < 100; i++) {
    if (i >= u_iterations) break;

    vec2 coord = baseCoord;
    vec2 waveCoord = coord;

    coord -= waveCoord.x + 0.1;
    coord.x *= resolution.x / resolution.y;

    depth += u_depthStep;
    magnitude = length(coord);

    float phase1 = depth * 0.7;
    float phase2 = depth * 1.3;
    float wave1 = sin(phase1) * 0.5 + cos(phase2) * 0.5 + 1.5;
    float wave2 = sin(magnitude * u_waveFrequency - depth) * 0.7 + cos(magnitude * u_waveFrequency * 0.5 + depth * 0.3) * 0.3;
    waveCoord += coord / max(magnitude, 0.01) * wave1 * wave2 * u_waveAmplitude;

    vec2 gridPos = mod(waveCoord, 1.0) - 0.5;
    float lineIntensity = u_lineThickness / length(gridPos);

    if (i == 0) accumulator.r = lineIntensity;
    else if (i == 1) accumulator.g = lineIntensity;
    else if (i == 2) accumulator.b = lineIntensity;
    else {
      accumulator += vec3(lineIntensity) * 0.01;
    }
  }

  accumulator = accumulator / max(magnitude, 0.001);

  accumulator = (accumulator - 0.5) * u_contrast + 0.5;
  accumulator *= u_brightness;

  vec3 finalColor = accumulator * u_lineColor;

  float alpha = clamp(length(accumulator) * u_opacity, 0.0, 1.0);
  finalColor = mix(u_backgroundColor, finalColor, alpha);

  gl_FragColor = vec4(finalColor, 1.0);
}
`,f=({speed:e,iterations:t,waveFrequency:l,depthStep:n,lineThickness:f,waveAmplitude:v,lineColor:m,backgroundColor:d,brightness:_,contrast:h,offsetX:p,offsetY:g,scale:w,opacity:C})=>{let y=(0,o.useRef)(null),b=(0,o.useRef)(null),{viewport:x}=(0,r.useThree)(),k=(0,o.useMemo)(()=>({u_time:{value:0},u_resolution:{value:new i.Vector2(100*x.width,100*x.height)},u_speed:{value:e},u_iterations:{value:t},u_waveFrequency:{value:l},u_depthStep:{value:n},u_lineThickness:{value:f},u_waveAmplitude:{value:v},u_lineColor:{value:new i.Color(m)},u_backgroundColor:{value:new i.Color(d)},u_brightness:{value:_},u_contrast:{value:h},u_offsetX:{value:p},u_offsetY:{value:g},u_scale:{value:w},u_opacity:{value:C}}),[]);return(0,a.useFrame)(u=>{b.current&&(b.current.uniforms.u_time.value=u.clock.elapsedTime,b.current.uniforms.u_resolution.value.set(100*x.width,100*x.height),b.current.uniforms.u_speed.value=e,b.current.uniforms.u_iterations.value=t,b.current.uniforms.u_waveFrequency.value=l,b.current.uniforms.u_depthStep.value=n,b.current.uniforms.u_lineThickness.value=f,b.current.uniforms.u_waveAmplitude.value=v,b.current.uniforms.u_lineColor.value.set(m),b.current.uniforms.u_backgroundColor.value.set(d),b.current.uniforms.u_brightness.value=_,b.current.uniforms.u_contrast.value=h,b.current.uniforms.u_offsetX.value=p,b.current.uniforms.u_offsetY.value=g,b.current.uniforms.u_scale.value=w,b.current.uniforms.u_opacity.value=C)}),(0,u.jsxs)("mesh",{ref:y,scale:[x.width,x.height,1],children:[(0,u.jsx)("planeGeometry",{args:[1,1]}),(0,u.jsx)("shaderMaterial",{ref:b,vertexShader:s,fragmentShader:c,uniforms:k})]})},v=({width:e="100%",height:o="100%",className:a="",speed:r=.4,iterations:i=3,waveFrequency:s=49,depthStep:c=.05,lineThickness:v=.009,waveAmplitude:m=.6,lineColor:d="#ffffff",lightBackground:_="#ffffff",darkBackground:h="#000000",brightness:p=2.5,contrast:g=1.1,offsetX:w=0,offsetY:C=0,scale:y=.3,opacity:b=1})=>{let{resolvedTheme:x}=(0,l.useTheme)(),k="number"==typeof e?`${e}px`:e,T="number"==typeof o?`${o}px`:o;return(0,u.jsx)("div",{className:(0,n.cn)("relative overflow-hidden",a),style:{width:k,height:T},children:(0,u.jsx)(t.Canvas,{className:"absolute inset-0 h-full w-full",gl:{antialias:!0,alpha:!1},camera:{position:[0,0,1],fov:75},children:(0,u.jsx)(f,{speed:r,iterations:i,waveFrequency:s,depthStep:c,lineThickness:v,waveAmplitude:m,lineColor:d,backgroundColor:"dark"===x?h:_,brightness:p,contrast:g,offsetX:w,offsetY:C,scale:y,opacity:b})})})};v.displayName="LiquidLines",e.s(["default",0,v])}]);