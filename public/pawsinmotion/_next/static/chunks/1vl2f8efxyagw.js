(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,44553,e=>{"use strict";var r=e.i(41929),o=e.i(49456),t=e.i(26881),n=e.i(36048),i=e.i(81484),u=e.i(46308),l=e.i(71884),a=e.i(63617);let s=`
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
uniform int u_colorLayers;
uniform float u_gridFrequency;
uniform float u_gridIntensity;
uniform float u_waveSpeed;
uniform float u_waveIntensity;
uniform float u_spiralIntensity;
uniform float u_lineThickness;
uniform float u_falloff;
uniform float u_centerX;
uniform float u_centerY;
uniform vec3 u_colorTint;
uniform vec3 u_backgroundColor;
uniform float u_brightness;
uniform float u_phaseOffset;

varying vec2 vUv;

void main() {
  float animTime = u_time * u_speed;
  vec2 resolution = u_resolution;

  vec3 colorAccum = vec3(0.0);
  float dist = 0.0;
  float depth = animTime;

  for (int layer = 0; layer < 3; layer++) {
    if (layer >= u_colorLayers) break;

    vec2 normalizedPos = vUv;
    vec2 centeredPos = vUv;
    centeredPos.x *= resolution.x / resolution.y;
    centeredPos -= vec2(u_centerX, u_centerY);

    depth += 0.05;
    dist = length(centeredPos);

    float horizontalWave = sin(centeredPos.x * u_gridFrequency + depth);
    float verticalWave = cos(centeredPos.y * u_gridFrequency + depth + u_phaseOffset);
    float gridPattern = u_gridIntensity * horizontalWave * verticalWave;

    float oscillation = sin(depth) + 1.0;
    float radialPulse = abs(sin(dist * 7.0 - depth * u_waveSpeed));
    float waveDisplacement = oscillation * radialPulse * u_waveIntensity;

    normalizedPos += (centeredPos / max(dist, 0.001)) * waveDisplacement * gridPattern;
    normalizedPos = fract(normalizedPos);

    float polarAngle = atan(centeredPos.y, centeredPos.x);
    float polarRadius = dist * 2.0;
    vec2 spiralOffset = vec2(
      cos(polarAngle * polarRadius - depth),
      sin(polarAngle * polarRadius - depth)
    ) * gridPattern * u_spiralIntensity;
    normalizedPos += spiralOffset;

    vec2 gridCell = fract(normalizedPos) - 0.5;
    float intensity = u_lineThickness / length(gridCell);

    if (layer == 0) colorAccum.r = intensity;
    else if (layer == 1) colorAccum.g = intensity;
    else colorAccum.b = intensity;
  }

  colorAccum = colorAccum / (dist + u_falloff);

  colorAccum *= u_brightness;
  vec3 tintedColor = colorAccum * u_colorTint;

  float alpha = clamp(length(colorAccum) * 0.5, 0.0, 1.0);
  vec3 finalColor = mix(u_backgroundColor, tintedColor, alpha);

  gl_FragColor = vec4(finalColor, 1.0);
}
`,f=({speed:e,colorLayers:t,gridFrequency:l,gridIntensity:a,waveSpeed:f,waveIntensity:v,spiralIntensity:d,lineThickness:m,falloff:_,centerX:h,centerY:p,colorTint:g,backgroundColor:y,brightness:P,phaseOffset:w})=>{let b=(0,o.useRef)(null),T=(0,o.useRef)(null),{viewport:x}=(0,i.useThree)(),C=(0,o.useMemo)(()=>({u_time:{value:0},u_resolution:{value:new u.Vector2(100*x.width,100*x.height)},u_speed:{value:e},u_colorLayers:{value:t},u_gridFrequency:{value:l},u_gridIntensity:{value:a},u_waveSpeed:{value:f},u_waveIntensity:{value:v},u_spiralIntensity:{value:d},u_lineThickness:{value:m},u_falloff:{value:_},u_centerX:{value:h},u_centerY:{value:p},u_colorTint:{value:new u.Color(g)},u_backgroundColor:{value:new u.Color(y)},u_brightness:{value:P},u_phaseOffset:{value:w}}),[]);return(0,n.useFrame)(r=>{T.current&&(T.current.uniforms.u_time.value=r.clock.elapsedTime,T.current.uniforms.u_resolution.value.set(100*x.width,100*x.height),T.current.uniforms.u_speed.value=e,T.current.uniforms.u_colorLayers.value=t,T.current.uniforms.u_gridFrequency.value=l,T.current.uniforms.u_gridIntensity.value=a,T.current.uniforms.u_waveSpeed.value=f,T.current.uniforms.u_waveIntensity.value=v,T.current.uniforms.u_spiralIntensity.value=d,T.current.uniforms.u_lineThickness.value=m,T.current.uniforms.u_falloff.value=_,T.current.uniforms.u_centerX.value=h,T.current.uniforms.u_centerY.value=p,T.current.uniforms.u_colorTint.value.set(g),T.current.uniforms.u_backgroundColor.value.set(y),T.current.uniforms.u_brightness.value=P,T.current.uniforms.u_phaseOffset.value=w)}),(0,r.jsxs)("mesh",{ref:b,scale:[x.width,x.height,1],children:[(0,r.jsx)("planeGeometry",{args:[1,1]}),(0,r.jsx)("shaderMaterial",{ref:T,vertexShader:s,fragmentShader:c,uniforms:C})]})},v=({width:e="100%",height:o="100%",className:n="",speed:i=.3,colorLayers:u=3,gridFrequency:s=25,gridIntensity:c=1,waveSpeed:v=.2,waveIntensity:d=.1,spiralIntensity:m=1,lineThickness:_=.06,falloff:h=1,centerX:p=1,centerY:g=1,colorTint:y="#c084fc",lightBackground:P="#ffffff",darkBackground:w="#000000",brightness:b=1.5,phaseOffset:T=10})=>{let{resolvedTheme:x}=(0,l.useTheme)(),C="number"==typeof e?`${e}px`:e,I="number"==typeof o?`${o}px`:o;return(0,r.jsx)("div",{className:(0,a.cn)("relative overflow-hidden",n),style:{width:C,height:I},children:(0,r.jsx)(t.Canvas,{className:"absolute inset-0 h-full w-full",gl:{antialias:!0,alpha:!1},camera:{position:[0,0,1],fov:75},children:(0,r.jsx)(f,{speed:i,colorLayers:u,gridFrequency:s,gridIntensity:c,waveSpeed:v,waveIntensity:d,spiralIntensity:m,lineThickness:_,falloff:h,centerX:p,centerY:g,colorTint:y,backgroundColor:"dark"===x?w:P,brightness:b,phaseOffset:T})})})};v.displayName="SquircleShift",e.s(["default",0,v])}]);