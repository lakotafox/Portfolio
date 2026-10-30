import{D as n,v as l,w as c,z as i}from"./main-ghsx4cn4.js";import{E as C0,J as k0,L as s}from"./main-jpng9c0t.js";var O=C0(k0(),1);if(typeof document<"u"){let D=document.createElement("style");D.dataset.src="speckle-wash/SpeckleWash.css",D.textContent=`.speckle-wash-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
`,document.head.appendChild(D)}var j=(D)=>{let J=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(D);if(!J)return[1,1,1];return[parseInt(J[1],16)/255,parseInt(J[2],16)/255,parseInt(J[3],16)/255]},D0=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,H0=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uTimeSpeed;
uniform float uColorBalance;
uniform float uWarpStrength;
uniform float uWarpFrequency;
uniform float uWarpSpeed;
uniform float uWarpAmplitude;
uniform float uBlendAngle;
uniform float uBlendSoftness;
uniform float uRotationAmount;
uniform float uNoiseScale;
uniform float uGrainAmount;
uniform float uGrainScale;
uniform float uGrainAnimated;
uniform float uContrast;
uniform float uGamma;
uniform float uSaturation;
uniform vec2 uCenterOffset;
uniform float uZoom;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;
#define S(a,b,t) smoothstep(a,b,t)
mat2 Rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);} 
vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);} 
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),dot(-1.0+2.0*hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(-1.0+2.0*hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);return 0.5+0.5*n;}
void mainImage(out vec4 o, vec2 C){
  float t=iTime*uTimeSpeed;
  vec2 uv=C/iResolution.xy;
  float ratio=iResolution.x/iResolution.y;
  vec2 tuv=uv-0.5+uCenterOffset;
  tuv/=max(uZoom,0.001);

  float degree=noise(vec2(t*0.1,tuv.x*tuv.y)*uNoiseScale);
  tuv.y*=1.0/ratio;
  tuv*=Rot(radians((degree-0.5)*uRotationAmount+180.0));
  tuv.y*=ratio;

  float frequency=uWarpFrequency;
  float ws=max(uWarpStrength,0.001);
  float amplitude=uWarpAmplitude/ws;
  float warpTime=t*uWarpSpeed;
  tuv.x+=sin(tuv.y*frequency+warpTime)/amplitude;
  tuv.y+=sin(tuv.x*(frequency*1.5)+warpTime)/(amplitude*0.5);

  vec3 colLav=uColor1;
  vec3 colOrg=uColor2;
  vec3 colDark=uColor3;
  float b=uColorBalance;
  float s=max(uBlendSoftness,0.0);
  mat2 blendRot=Rot(radians(uBlendAngle));
  float blendX=(tuv*blendRot).x;
  float edge0=-0.3-b-s;
  float edge1=0.2-b+s;
  float v0=0.5-b+s;
  float v1=-0.3-b-s;
  vec3 layer1=mix(colDark,colOrg,S(edge0,edge1,blendX));
  vec3 layer2=mix(colOrg,colLav,S(edge0,edge1,blendX));
  vec3 col=mix(layer1,layer2,S(v0,v1,tuv.y));

  vec2 grainUv=uv*max(uGrainScale,0.001);
  if(uGrainAnimated>0.5){grainUv+=vec2(iTime*0.05);} 
  float grain=fract(sin(dot(grainUv,vec2(12.9898,78.233)))*43758.5453);
  col+=(grain-0.5)*uGrainAmount;

  col=(col-0.5)*uContrast+0.5;
  float luma=dot(col,vec3(0.2126,0.7152,0.0722));
  col=mix(vec3(luma),col,uSaturation);
  col=pow(max(col,0.0),vec3(1.0/max(uGamma,0.001)));
  col=clamp(col,0.0,1.0);

  o=vec4(col,1.0);
}
void main(){
  vec4 o=vec4(0.0);
  mainImage(o,gl_FragCoord.xy);
  fragColor=o;
}
`,E=new WeakMap,I0=({timeSpeed:D=0.25,colorBalance:J=0,warpStrength:N=1,warpFrequency:q=5,warpSpeed:v=2,warpAmplitude:B=50,blendAngle:F=0,blendSoftness:M=0.05,rotationAmount:T=500,noiseScale:X=2,grainAmount:Y=0.1,grainScale:P=2,grainAnimated:h=!1,contrast:z=1.5,gamma:R=1,saturation:V=1,centerX:x=0,centerY:w=0,zoom:y=0.9,color1:f="#FF9FFC",color2:b="#5227FF",color3:d="#B497CF",className:o=""})=>{let Z=O.useRef(null);return O.useEffect(()=>{let k=Z.current;if(!k)return;let H=new c({webgl:2,alpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)}),I=H.gl,C=I.canvas;C.style.width="100%",C.style.height="100%",C.style.display="block",k.appendChild(C);let t=new n(I),Q=new l(I,{vertex:D0,fragment:H0,uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uTimeSpeed:{value:0.25},uColorBalance:{value:0},uWarpStrength:{value:1},uWarpFrequency:{value:5},uWarpSpeed:{value:2},uWarpAmplitude:{value:50},uBlendAngle:{value:0},uBlendSoftness:{value:0.05},uRotationAmount:{value:500},uNoiseScale:{value:2},uGrainAmount:{value:0.1},uGrainScale:{value:2},uGrainAnimated:{value:0},uContrast:{value:1.5},uGamma:{value:1},uSaturation:{value:1},uCenterOffset:{value:new Float32Array([0,0])},uZoom:{value:0.9},uColor1:{value:new Float32Array([1,1,1])},uColor2:{value:new Float32Array([1,1,1])},uColor3:{value:new Float32Array([1,1,1])}}}),_=new i(I,{geometry:t,program:Q});E.set(k,{renderer:H,program:Q,mesh:_});let A=()=>{let L=k.getBoundingClientRect(),r=Math.max(1,Math.floor(L.width)),e=Math.max(1,Math.floor(L.height));H.setSize(r,e);let u=Q.uniforms.iResolution.value;u[0]=I.drawingBufferWidth,u[1]=I.drawingBufferHeight,H.render({scene:_})},S=new ResizeObserver(A);S.observe(k),A();let K=0,$=!0,G=!document.hidden,a=performance.now(),p=(L)=>{Q.uniforms.iTime.value=(L-a)*0.001,H.render({scene:_}),K=requestAnimationFrame(p)},U=()=>{if($&&G&&K===0)K=requestAnimationFrame(p)},W=()=>{if(K!==0)cancelAnimationFrame(K),K=0},m=new IntersectionObserver(([L])=>{$=L.isIntersecting,$?U():W()},{threshold:0});m.observe(k);let g=()=>{G=!document.hidden,G?U():W()};return document.addEventListener("visibilitychange",g),U(),()=>{W(),S.disconnect(),m.disconnect(),document.removeEventListener("visibilitychange",g),E.delete(k);try{k.removeChild(C)}catch{}}},[]),O.useEffect(()=>{let k=Z.current;if(!k)return;let H=E.get(k);if(!H)return;let{program:I}=H,C=I.uniforms;C.uTimeSpeed.value=D,C.uColorBalance.value=J,C.uWarpStrength.value=N,C.uWarpFrequency.value=q,C.uWarpSpeed.value=v,C.uWarpAmplitude.value=B,C.uBlendAngle.value=F,C.uBlendSoftness.value=M,C.uRotationAmount.value=T,C.uNoiseScale.value=X,C.uGrainAmount.value=Y,C.uGrainScale.value=P,C.uGrainAnimated.value=h?1:0,C.uContrast.value=z,C.uGamma.value=R,C.uSaturation.value=V,C.uCenterOffset.value=new Float32Array([x,w]),C.uZoom.value=y,C.uColor1.value=new Float32Array(j(f)),C.uColor2.value=new Float32Array(j(b)),C.uColor3.value=new Float32Array(j(d))},[D,J,N,q,v,B,F,M,T,X,Y,P,h,z,R,V,x,w,y,f,b,d]),s("div",{ref:Z,className:`speckle-wash-container ${o}`.trim()})},O0=I0;export{O0 as default};
