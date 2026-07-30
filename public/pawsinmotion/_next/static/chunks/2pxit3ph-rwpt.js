(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,92525,e=>{"use strict";var u=e.i(41929),o=e.i(49456),l=e.i(26881),a=e.i(36048),r=e.i(81484),t=e.i(46308);let n=[{color:"#00ff4d",speed:.37,intensity:.5},{color:"#66b3ff",speed:.15,intensity:.35},{color:"#d438ff",speed:.2,intensity:.1},{color:"#1acbae",speed:.07,intensity:.15}],i=[{color:"#5f2762",blend:.5},{color:"#263031",blend:.5}],s=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,v=`
precision highp float;
varying vec2 vUv;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_speed;
uniform vec3 u_layer1Color;
uniform float u_layer1Speed;
uniform float u_layer1Intensity;
uniform vec3 u_layer2Color;
uniform float u_layer2Speed;
uniform float u_layer2Intensity;
uniform vec3 u_layer3Color;
uniform float u_layer3Speed;
uniform float u_layer3Intensity;
uniform vec3 u_layer4Color;
uniform float u_layer4Speed;
uniform float u_layer4Intensity;
uniform float u_noiseScale;
uniform float u_movementX;
uniform float u_movementY;
uniform float u_verticalFade;
uniform float u_bloomIntensity;
uniform vec3 u_skyColor1;
uniform vec3 u_skyColor2;
uniform float u_skyBlend1;
uniform float u_skyBlend2;
uniform float u_brightness;
uniform float u_saturation;
uniform float u_opacity;

float h(float n){return fract(sin(n)*43758.5453);}

float n2d(vec2 p){
  vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  return mix(mix(h(i.x+h(i.y)),h(i.x+1.+h(i.y)),u.x),
             mix(h(i.x+h(i.y+1.)),h(i.x+1.+h(i.y+1.)),u.x),u.y);
}

vec3 aurora(vec2 uv,float spd,float intensity,vec3 col,float aspect){
  float t=u_time*u_speed*spd;
  vec2 scaled=vec2(uv.x*aspect,uv.y)*u_noiseScale;
  vec2 p=scaled+t*vec2(u_movementX,u_movementY);
  float n=n2d(p+n2d(col.xy+p+t));
  float a=n-uv.y*u_verticalFade;
  return col*a*intensity*u_bloomIntensity;
}

vec3 sat(vec3 c,float s){
  float g=dot(c,vec3(0.299,0.587,0.114));
  return mix(vec3(g),c,s);
}

void main(){
  vec2 uv=vUv;
  float aspect=u_resolution.x/u_resolution.y;

  vec3 c=vec3(0.);
  c+=aurora(uv,u_layer1Speed,u_layer1Intensity,u_layer1Color,aspect);
  c+=aurora(uv,u_layer2Speed,u_layer2Intensity,u_layer2Color,aspect);
  c+=aurora(uv,u_layer3Speed,u_layer3Intensity,u_layer3Color,aspect);
  c+=aurora(uv,u_layer4Speed,u_layer4Intensity,u_layer4Color,aspect);

  c+=u_skyColor2*(1.-smoothstep(u_skyBlend1,1.,uv.y));
  c+=u_skyColor1*(1.-smoothstep(0.,u_skyBlend2,uv.y));

  c=sat(c,u_saturation)*u_brightness;

  gl_FragColor=vec4(c,u_opacity);
}
`;function y(e){let u=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return u?[parseInt(u[1],16)/255,parseInt(u[2],16)/255,parseInt(u[3],16)/255]:[1,1,1]}let f=({speed:e,layers:l,noiseScale:n,movementX:i,movementY:f,verticalFade:c,bloomIntensity:m,skyLayers:_,brightness:d,saturation:p,opacity:h})=>{let C=(0,o.useRef)(null),{size:x}=(0,r.useThree)(),I=(0,o.useMemo)(()=>({u_time:{value:0},u_resolution:{value:new t.Vector2(1,1)},u_speed:{value:1},u_layer1Color:{value:new t.Vector3(0,1,.3)},u_layer1Speed:{value:.05},u_layer1Intensity:{value:.3},u_layer2Color:{value:new t.Vector3(.1,.5,.9)},u_layer2Speed:{value:.1},u_layer2Intensity:{value:.4},u_layer3Color:{value:new t.Vector3(.4,.1,.8)},u_layer3Speed:{value:.15},u_layer3Intensity:{value:.3},u_layer4Color:{value:new t.Vector3(.8,.1,.6)},u_layer4Speed:{value:.07},u_layer4Intensity:{value:.2},u_noiseScale:{value:2},u_movementX:{value:2},u_movementY:{value:-2},u_verticalFade:{value:.6},u_bloomIntensity:{value:2},u_skyColor1:{value:new t.Vector3(.2,0,.4)},u_skyColor2:{value:new t.Vector3(.15,.2,.35)},u_skyBlend1:{value:.4},u_skyBlend2:{value:.5},u_brightness:{value:1},u_saturation:{value:1},u_opacity:{value:1}}),[]);return(0,a.useFrame)(u=>{if(!C.current)return;let o=C.current.material;o.uniforms.u_time.value=u.clock.elapsedTime,o.uniforms.u_resolution.value.set(x.width,x.height),o.uniforms.u_speed.value=e,o.uniforms.u_layer1Color.value.set(...y(l[0]?.color||"#000")),o.uniforms.u_layer1Speed.value=l[0]?.speed||0,o.uniforms.u_layer1Intensity.value=l[0]?.intensity||0,o.uniforms.u_layer2Color.value.set(...y(l[1]?.color||"#000")),o.uniforms.u_layer2Speed.value=l[1]?.speed||0,o.uniforms.u_layer2Intensity.value=l[1]?.intensity||0,o.uniforms.u_layer3Color.value.set(...y(l[2]?.color||"#000")),o.uniforms.u_layer3Speed.value=l[2]?.speed||0,o.uniforms.u_layer3Intensity.value=l[2]?.intensity||0,o.uniforms.u_layer4Color.value.set(...y(l[3]?.color||"#000")),o.uniforms.u_layer4Speed.value=l[3]?.speed||0,o.uniforms.u_layer4Intensity.value=l[3]?.intensity||0,o.uniforms.u_noiseScale.value=n,o.uniforms.u_movementX.value=i,o.uniforms.u_movementY.value=f,o.uniforms.u_verticalFade.value=c,o.uniforms.u_bloomIntensity.value=m,o.uniforms.u_skyColor1.value.set(...y(_[0]?.color||"#000")),o.uniforms.u_skyColor2.value.set(...y(_[1]?.color||"#000")),o.uniforms.u_skyBlend1.value=_[1]?.blend||0,o.uniforms.u_skyBlend2.value=_[0]?.blend||0,o.uniforms.u_brightness.value=d,o.uniforms.u_saturation.value=p,o.uniforms.u_opacity.value=h}),(0,u.jsxs)("mesh",{ref:C,children:[(0,u.jsx)("planeGeometry",{args:[2,2]}),(0,u.jsx)("shaderMaterial",{vertexShader:s,fragmentShader:v,uniforms:I,transparent:!0})]})},c=({width:e="100%",height:o="100%",className:a,children:r,speed:t=1.5,layers:s=n,noiseScale:v=3.5,movementX:y=-2,movementY:c=-3,verticalFade:m=.75,bloomIntensity:_=2,skyLayers:d=i,brightness:p=.8,saturation:h=1,opacity:C=1})=>{let x="number"==typeof e?`${e}px`:e,I="number"==typeof o?`${o}px`:o;return(0,u.jsxs)("div",{className:`relative overflow-hidden ${a||""}`,style:{width:x,height:I},children:[(0,u.jsx)(l.Canvas,{className:"absolute inset-0 w-full h-full",gl:{antialias:!0,alpha:!0},orthographic:!0,camera:{position:[0,0,1],zoom:1,left:-1,right:1,top:1,bottom:-1},children:(0,u.jsx)(f,{speed:t,layers:s,noiseScale:v,movementX:y,movementY:c,verticalFade:m,bloomIntensity:_,skyLayers:d,brightness:p,saturation:h,opacity:C})}),r&&(0,u.jsx)("div",{className:"relative z-10",children:r})]})};c.displayName="AuroraBlur",e.s(["default",0,c])}]);