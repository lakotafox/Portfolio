(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,11124,e=>{"use strict";var o=e.i(41929),r=e.i(49456),a=e.i(26881),u=e.i(36048),l=e.i(81484),t=e.i(46308),n=e.i(71884),i=e.i(63617);let s=`
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
uniform float u_waveCount;
uniform float u_waveAmplitude;
uniform float u_waveFrequency;
uniform float u_lineThickness;
uniform float u_grainIntensity;
uniform vec3 u_startColor;
uniform vec3 u_endColor;
uniform vec3 u_backgroundColor;
uniform float u_brightness;
uniform float u_speedVariation;
uniform float u_waveWidth;
uniform float u_scale;

varying vec2 vUv;

float generateNoise(vec2 position) {
  vec2 seed = vec2(12.9898, 78.233);
  float dotProduct = dot(position, seed);
  return fract(sin(dotProduct) * 43758.5453);
}

float applyGrain(vec2 position) {
  return (generateNoise(position) * 2.0 - 1.0) / 256.0;
}

vec4 calculateWaveLine(vec2 coord, float animSpeed, float horizontalScale, vec3 color) {
  float waveOffset = sin(u_time * animSpeed + coord.x * horizontalScale * u_waveFrequency) * u_waveAmplitude;
  float edgeFalloff = smoothstep(1.0, 0.0, abs(coord.x));
  coord.y += waveOffset * edgeFalloff;

  float lineIntensity = smoothstep(u_lineThickness, 0.0, abs(coord.y));

  float yFade = smoothstep(1.0, 0.2, abs(coord.y));
  float xFade = smoothstep(1.0, 0.3, abs(coord.x));
  float combinedFade = yFade * xFade;

  return vec4(color * lineIntensity * combinedFade, 1.0);
}

void main() {
  vec2 coord = vUv * 2.0 - 1.0;
  coord.x *= u_resolution.x / u_resolution.y;

  coord /= u_scale;

  coord.x /= u_waveWidth;

  vec4 colorAccumulator = vec4(0.0);

  for (float i = 0.0; i <= 50.0; i += 1.0) {
    if (i >= u_waveCount) break;

    float progress = i / u_waveCount * 2.0;

    float lineSpeed = u_speed + progress * u_speedVariation;

    float colorMix = i / u_waveCount;
    vec3 waveColor = mix(u_startColor, u_endColor, colorMix);

    colorAccumulator += calculateWaveLine(coord, lineSpeed, progress, waveColor);
  }

  vec3 waveColor = colorAccumulator.rgb * u_brightness;

  float waveIntensity = clamp(length(waveColor), 0.0, 1.0);
  float grain = applyGrain(coord) * u_grainIntensity * waveIntensity;
  waveColor += vec3(grain);

  float bgLuminance = dot(u_backgroundColor, vec3(0.299, 0.587, 0.114));
  vec3 finalColor;
  if (bgLuminance > 0.5) {
    float waveAlpha = clamp(length(waveColor), 0.0, 1.0);
    finalColor = mix(u_backgroundColor, waveColor, waveAlpha);
  } else {
    finalColor = u_backgroundColor + waveColor;
  }

  gl_FragColor = vec4(finalColor, 1.0);
}
`,v=({speed:e,waveCount:a,waveAmplitude:n,waveFrequency:i,lineThickness:v,grainIntensity:f,startColor:d,endColor:m,backgroundColor:_,brightness:h,speedVariation:p,waveWidth:w,scale:g})=>{let C=(0,r.useRef)(null),y=(0,r.useRef)(null),{viewport:b}=(0,l.useThree)(),x=(0,r.useMemo)(()=>({u_time:{value:0},u_resolution:{value:new t.Vector2(100*b.width,100*b.height)},u_speed:{value:e},u_waveCount:{value:a},u_waveAmplitude:{value:n},u_waveFrequency:{value:i},u_lineThickness:{value:v},u_grainIntensity:{value:f},u_startColor:{value:new t.Color(d)},u_endColor:{value:new t.Color(m)},u_backgroundColor:{value:new t.Color(_)},u_brightness:{value:h},u_speedVariation:{value:p},u_waveWidth:{value:w},u_scale:{value:g}}),[]);return(0,u.useFrame)(o=>{y.current&&(y.current.uniforms.u_time.value=o.clock.elapsedTime,y.current.uniforms.u_resolution.value.set(100*b.width,100*b.height),y.current.uniforms.u_speed.value=e,y.current.uniforms.u_waveCount.value=a,y.current.uniforms.u_waveAmplitude.value=n,y.current.uniforms.u_waveFrequency.value=i,y.current.uniforms.u_lineThickness.value=v,y.current.uniforms.u_grainIntensity.value=f,y.current.uniforms.u_startColor.value.set(d),y.current.uniforms.u_endColor.value.set(m),y.current.uniforms.u_backgroundColor.value.set(_),y.current.uniforms.u_brightness.value=h,y.current.uniforms.u_speedVariation.value=p,y.current.uniforms.u_waveWidth.value=w,y.current.uniforms.u_scale.value=g)}),(0,o.jsxs)("mesh",{ref:C,scale:[b.width,b.height,1],children:[(0,o.jsx)("planeGeometry",{args:[1,1]}),(0,o.jsx)("shaderMaterial",{ref:y,vertexShader:s,fragmentShader:c,uniforms:x})]})},f=({width:e="100%",height:r="100%",className:u="",speed:l=.5,waveCount:t=25,waveAmplitude:s=.85,waveFrequency:c=4,lineThickness:f=.2,grainIntensity:d=50,startColor:m="#ff6666",endColor:_="#6666ff",lightBackground:h="#ffffff",darkBackground:p="#000000",brightness:w=1,speedVariation:g=.006,waveWidth:C=3.5,scale:y=.6})=>{let{resolvedTheme:b}=(0,n.useTheme)(),x="number"==typeof e?`${e}px`:e,k="number"==typeof r?`${r}px`:r;return(0,o.jsx)("div",{className:(0,i.cn)("relative overflow-hidden",u),style:{width:x,height:k},children:(0,o.jsx)(a.Canvas,{className:"absolute inset-0 h-full w-full",gl:{antialias:!0,alpha:!1},camera:{position:[0,0,1],fov:75},children:(0,o.jsx)(v,{speed:l,waveCount:t,waveAmplitude:s,waveFrequency:c,lineThickness:f,grainIntensity:d,startColor:m,endColor:_,backgroundColor:"dark"===b?p:h,brightness:w,speedVariation:g,waveWidth:C,scale:y})})})};f.displayName="GrainWave",e.s(["default",0,f])}]);