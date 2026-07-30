(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,69583,e=>{"use strict";var t=e.i(41929),r=e.i(49456),a=e.i(26881),u=e.i(36048),o=e.i(81484),n=e.i(46308),i=e.i(63617);let l=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,s=`
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_viewport;
uniform vec2 u_textureSize;
uniform float u_time;
uniform float u_stripeCount;
uniform float u_angle;
uniform float u_lensCurvature;
uniform float u_refraction;
uniform float u_edgeWidth;
uniform float u_edgeBrightness;
uniform float u_edgeSharpness;
uniform float u_speed;
uniform float u_waveSpeed;
uniform float u_waveAmount;
uniform float u_chromaticAberration;
uniform float u_frostAmount;

varying vec2 vUv;

float randomNoise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

mat2 createRotation(float theta) {
  float c = cos(theta);
  float s = sin(theta);
  return mat2(c, -s, s, c);
}

vec2 computeCoverUV(vec2 uv, vec2 containerSize, vec2 mediaSize) {
  float containerRatio = containerSize.x / containerSize.y;
  float mediaRatio = mediaSize.x / mediaSize.y;
  vec2 scaledSize = containerRatio < mediaRatio
    ? vec2(mediaSize.x * containerSize.y / mediaSize.y, containerSize.y)
    : vec2(containerSize.x, mediaSize.y * containerSize.x / mediaSize.x);
  vec2 offsetAmount = containerRatio < mediaRatio
    ? vec2((scaledSize.x - containerSize.x) * 0.5, 0.0)
    : vec2(0.0, (scaledSize.y - containerSize.y) * 0.5);
  return uv * containerSize / scaledSize + offsetAmount / scaledSize;
}

vec3 sampleWithBlur(sampler2D tex, vec2 uv, float blurAmount) {
  vec3 color = vec3(0.0);
  float total = 0.0;
  float blurSize = blurAmount * 0.01;
  for (float x = -2.0; x <= 2.0; x += 1.0) {
    for (float y = -2.0; y <= 2.0; y += 1.0) {
      vec2 offset = vec2(x, y) * blurSize;
      color += texture2D(tex, uv + offset).rgb;
      total += 1.0;
    }
  }
  return color / total;
}

void main() {
  vec2 sampleUV = computeCoverUV(vUv, u_viewport, u_textureSize);
  vec2 centeredCoord = sampleUV - 0.5;
  vec2 rotatedCoord = createRotation(u_angle) * centeredCoord;

  float waveOffset = sin(u_time * u_waveSpeed + rotatedCoord.y * 10.0) * u_waveAmount * 0.02;
  float stripePhase = (rotatedCoord.x + waveOffset) * u_stripeCount + (u_time * u_speed);
  float stripePattern = fract(stripePhase);
  float curvedPattern = pow(stripePattern, u_lensCurvature);
  float displacementAmount = (curvedPattern - 0.5) * u_refraction;
  vec2 displacementVector = createRotation(-u_angle) * vec2(displacementAmount, 0.0);

  float totalBlur = u_frostAmount * 0.5;
  float aberrationScale = u_chromaticAberration * 0.01;
  vec3 outputColor;

  if (totalBlur > 0.01) {
    float redChannel = sampleWithBlur(u_texture, sampleUV + displacementVector, totalBlur).r;
    float greenChannel = sampleWithBlur(u_texture, sampleUV + displacementVector * 1.01 + vec2(aberrationScale, 0.0), totalBlur).g;
    float blueChannel = sampleWithBlur(u_texture, sampleUV + displacementVector * 1.02 + vec2(aberrationScale * 2.0, 0.0), totalBlur).b;
    outputColor = vec3(redChannel, greenChannel, blueChannel);
  } else {
    float redChannel = texture2D(u_texture, sampleUV + displacementVector).r;
    float greenChannel = texture2D(u_texture, sampleUV + displacementVector * 1.01 + vec2(aberrationScale, 0.0)).g;
    float blueChannel = texture2D(u_texture, sampleUV + displacementVector * 1.02 + vec2(aberrationScale * 2.0, 0.0)).b;
    outputColor = vec3(redChannel, greenChannel, blueChannel);
  }

  if (u_frostAmount > 0.0) {
    float grain = (randomNoise(vUv * 500.0 + u_time) - 0.5) * u_frostAmount * 0.15;
    outputColor += vec3(grain);
  }

  float edgeSoftness = mix(0.3, 0.01, u_edgeSharpness);
  float edgeHighlight = smoothstep(1.0 - u_edgeWidth - edgeSoftness, 1.0 - edgeSoftness * 0.5, stripePattern);
  outputColor += vec3(edgeHighlight * u_edgeBrightness);

  gl_FragColor = vec4(outputColor, 1.0);
}
`,c=({texture:e,stripeCount:a,angle:i,lensCurvature:c,refraction:m,edgeWidth:f,edgeBrightness:v,speed:d,chromaticAberration:p,edgeSharpness:h,waveSpeed:_,waveAmount:g,frostAmount:S})=>{let x=(0,r.useRef)(null),C=(0,r.useRef)(null),{viewport:w,size:b}=(0,o.useThree)(),z=(0,r.useMemo)(()=>{if(e?.image){let t=e.image,r=t.width||t.videoWidth||1920,a=t.height||t.videoHeight||1080;return new n.Vector2(r,a)}return new n.Vector2(1920,1080)},[e]),y=(0,r.useMemo)(()=>({u_texture:{value:e},u_viewport:{value:new n.Vector2(b.width,b.height)},u_textureSize:{value:z},u_time:{value:0},u_stripeCount:{value:a},u_angle:{value:i*Math.PI/180},u_lensCurvature:{value:c},u_refraction:{value:m},u_edgeWidth:{value:f},u_edgeBrightness:{value:v},u_edgeSharpness:{value:h},u_speed:{value:d},u_chromaticAberration:{value:p},u_waveSpeed:{value:_},u_waveAmount:{value:g},u_frostAmount:{value:S}}),[]);return((0,u.useFrame)(t=>{C.current&&(C.current.uniforms.u_time.value=t.clock.elapsedTime,C.current.uniforms.u_viewport.value.set(b.width,b.height),C.current.uniforms.u_texture.value=e,C.current.uniforms.u_textureSize.value=z,C.current.uniforms.u_stripeCount.value=a,C.current.uniforms.u_angle.value=i*Math.PI/180,C.current.uniforms.u_lensCurvature.value=c,C.current.uniforms.u_refraction.value=m,C.current.uniforms.u_edgeWidth.value=f,C.current.uniforms.u_edgeBrightness.value=v,C.current.uniforms.u_edgeSharpness.value=h,C.current.uniforms.u_speed.value=d,C.current.uniforms.u_chromaticAberration.value=p,C.current.uniforms.u_waveSpeed.value=_,C.current.uniforms.u_waveAmount.value=g,C.current.uniforms.u_frostAmount.value=S)}),e)?(0,t.jsxs)("mesh",{ref:x,scale:[w.width,w.height,1],children:[(0,t.jsx)("planeGeometry",{args:[1,1]}),(0,t.jsx)("shaderMaterial",{ref:C,vertexShader:l,fragmentShader:s,uniforms:y})]}):null},m=({width:e="100%",height:u="100%",className:o="",imageSrc:l="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200",videoSrc:s,stripeCount:m=6,angle:f=-13,lensCurvature:v=.49,refraction:d=.07,edgeWidth:p=.02,edgeBrightness:h=.05,speed:_=.1,chromaticAberration:g=.5,edgeSharpness:S=.5,waveSpeed:x=1,waveAmount:C=0,frostAmount:w=0})=>{let[b,z]=(0,r.useState)(null),y=(0,r.useRef)(null);(0,r.useEffect)(()=>{if(!s)return new n.TextureLoader().load(l,e=>{e.wrapS=n.ClampToEdgeWrapping,e.wrapT=n.ClampToEdgeWrapping,e.minFilter=n.LinearFilter,e.magFilter=n.LinearFilter,z(e)}),()=>{}},[l,s]),(0,r.useEffect)(()=>{if(!s)return;let e=document.createElement("video");return e.src=s,e.crossOrigin="anonymous",e.loop=!0,e.muted=!0,e.playsInline=!0,e.autoplay=!0,y.current=e,e.addEventListener("loadeddata",()=>{let t=new n.VideoTexture(e);t.wrapS=n.ClampToEdgeWrapping,t.wrapT=n.ClampToEdgeWrapping,t.minFilter=n.LinearFilter,t.magFilter=n.LinearFilter,z(t),e.play()}),()=>{e.pause(),e.src=""}},[s]);let A="number"==typeof e?`${e}px`:e,V="number"==typeof u?`${u}px`:u;return(0,t.jsx)("div",{className:(0,i.cn)("relative overflow-hidden",o),style:{width:A,height:V},children:(0,t.jsx)(a.Canvas,{className:"absolute inset-0 h-full w-full",gl:{antialias:!0,alpha:!1},camera:{position:[0,0,1],fov:75},children:(0,t.jsx)(c,{texture:b,stripeCount:m,angle:f,lensCurvature:v,refraction:d,edgeWidth:p,edgeBrightness:h,speed:_,chromaticAberration:g,edgeSharpness:S,waveSpeed:x,waveAmount:C,frostAmount:w})})})};m.displayName="GlassFlow",e.s(["default",0,m])}]);