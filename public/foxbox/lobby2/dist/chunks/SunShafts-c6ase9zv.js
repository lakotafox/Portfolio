import{B as V,t as M,u as q,x as H}from"./main-mznb6j68.js";import{C as O,H as Q,J as $}from"./main-csjpdy0q.js";var t=O(Q(),1);if(typeof document<"u"){let c=document.createElement("style");c.dataset.src="sun-shafts/SunShafts.css",c.textContent=`.sun-shafts-container {
  width: 100%;
  height: 100%;
  position: relative;
  pointer-events: none;
  z-index: 3;
  overflow: hidden;
}
`,document.head.appendChild(c)}var Z="#ffffff",B=(c)=>{let n=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c);return n?[parseInt(n[1],16)/255,parseInt(n[2],16)/255,parseInt(n[3],16)/255]:[1,1,1]},U=(c,n,i)=>{switch(c){case"top-left":return{anchor:[0,-0.2*i],dir:[0,1]};case"top-right":return{anchor:[n,-0.2*i],dir:[0,1]};case"left":return{anchor:[-0.2*n,0.5*i],dir:[1,0]};case"right":return{anchor:[1.2*n,0.5*i],dir:[-1,0]};case"bottom-left":return{anchor:[0,1.2*i],dir:[0,-1]};case"bottom-center":return{anchor:[0.5*n,1.2*i],dir:[0,-1]};case"bottom-right":return{anchor:[n,1.2*i],dir:[0,-1]};default:return{anchor:[0.5*n,-0.2*i],dir:[0,1]}}},j=({raysOrigin:c="top-center",raysColor:n=Z,raysSpeed:i=1,lightSpread:g=1,rayLength:R=2,pulsating:S=!1,fadeDistance:b=1,saturation:w=1,followMouse:D=!0,mouseInfluence:h=0.1,noiseAmount:P=0,distortion:A=0,className:X=""})=>{let o=t.useRef(null),y=t.useRef(null),d=t.useRef(null),T=t.useRef({x:0.5,y:0.5}),m=t.useRef({x:0.5,y:0.5}),p=t.useRef(null),F=t.useRef(null),f=t.useRef(null),[z,Y]=t.useState(!1),C=t.useRef(null);return t.useEffect(()=>{if(!o.current)return;return C.current=new IntersectionObserver((e)=>{let r=e[0];Y(r.isIntersecting)},{threshold:0.1}),C.current.observe(o.current),()=>{if(C.current)C.current.disconnect(),C.current=null}},[]),t.useEffect(()=>{if(!z||!o.current)return;if(f.current)f.current(),f.current=null;return(async()=>{if(!o.current)return;if(await new Promise((s)=>setTimeout(s,10)),!o.current)return;let r=new q({dpr:Math.min(window.devicePixelRatio,2),alpha:!0});d.current=r;let a=r.gl;a.canvas.style.width="100%",a.canvas.style.height="100%";while(o.current.firstChild)o.current.removeChild(o.current.firstChild);o.current.appendChild(a.canvas);let x=`
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`,v=`precision highp float;

uniform float iTime;
uniform vec2  iResolution;

uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;

varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);

  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  
  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  
  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;

  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  
  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  vec4 rays1 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349,
                           1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234,
                           1.1 * raysSpeed);

  fragColor = rays1 * 0.5 + rays2 * 0.4;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }

  float brightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x *= 0.1 + brightness * 0.8;
  fragColor.y *= 0.3 + brightness * 0.6;
  fragColor.z *= 0.5 + brightness * 0.5;

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  fragColor.rgb *= raysColor;
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor  = color;
}`,u={iTime:{value:0},iResolution:{value:[1,1]},rayPos:{value:[0,0]},rayDir:{value:[0,1]},raysColor:{value:B(n)},raysSpeed:{value:i},lightSpread:{value:g},rayLength:{value:R},pulsating:{value:S?1:0},fadeDistance:{value:b},saturation:{value:w},mousePos:{value:[0.5,0.5]},mouseInfluence:{value:h},noiseAmount:{value:P},distortion:{value:A}};y.current=u;let L=new V(a),k=new M(a,{vertex:x,fragment:v,uniforms:u}),I=new H(a,{geometry:L,program:k});F.current=I;let E=()=>{if(!o.current||!r)return;r.dpr=Math.min(window.devicePixelRatio,2);let{clientWidth:s,clientHeight:l}=o.current;r.setSize(s,l);let _=r.dpr,G=s*_,N=l*_;u.iResolution.value=[G,N];let{anchor:J,dir:K}=U(c,G,N);u.rayPos.value=J,u.rayDir.value=K},W=(s)=>{if(!d.current||!y.current||!F.current)return;if(u.iTime.value=s*0.001,D&&h>0)m.current.x=m.current.x*0.92+T.current.x*0.07999999999999996,m.current.y=m.current.y*0.92+T.current.y*0.07999999999999996,u.mousePos.value=[m.current.x,m.current.y];try{r.render({scene:I}),p.current=requestAnimationFrame(W)}catch(l){console.warn("WebGL rendering error:",l);return}};window.addEventListener("resize",E),E(),p.current=requestAnimationFrame(W),f.current=()=>{if(p.current)cancelAnimationFrame(p.current),p.current=null;if(window.removeEventListener("resize",E),r)try{let s=r.gl.canvas,l=r.gl.getExtension("WEBGL_lose_context");if(l)l.loseContext();if(s&&s.parentNode)s.parentNode.removeChild(s)}catch(s){console.warn("Error during WebGL cleanup:",s)}d.current=null,y.current=null,F.current=null}})(),()=>{if(f.current)f.current(),f.current=null}},[z,c,n,i,g,R,S,b,w,D,h,P,A]),t.useEffect(()=>{if(!y.current||!o.current||!d.current)return;let e=y.current,r=d.current;e.raysColor.value=B(n),e.raysSpeed.value=i,e.lightSpread.value=g,e.rayLength.value=R,e.pulsating.value=S?1:0,e.fadeDistance.value=b,e.saturation.value=w,e.mouseInfluence.value=h,e.noiseAmount.value=P,e.distortion.value=A;let{clientWidth:a,clientHeight:x}=o.current,v=r.dpr,{anchor:u,dir:L}=U(c,a*v,x*v);e.rayPos.value=u,e.rayDir.value=L},[n,i,g,c,R,S,b,w,h,P,A]),t.useEffect(()=>{let e=(r)=>{if(!o.current||!d.current)return;let a=o.current.getBoundingClientRect(),x=(r.clientX-a.left)/a.width,v=(r.clientY-a.top)/a.height;T.current={x,y:v}};if(D)return window.addEventListener("mousemove",e),()=>window.removeEventListener("mousemove",e)},[D]),$("div",{ref:o,className:`sun-shafts-container ${X}`.trim()})},ne=j;export{ne as default};
