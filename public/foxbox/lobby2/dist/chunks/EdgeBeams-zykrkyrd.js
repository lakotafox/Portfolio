import{D as X,v as E,w as L,z as D}from"./main-ghsx4cn4.js";import{E as V,J as $,L as A}from"./main-jpng9c0t.js";var t=V($(),1);if(typeof document<"u"){let o=document.createElement("style");o.dataset.src="edge-beams/EdgeBeams.css",o.textContent=`.edge-beams-container {
  width: 100%;
  height: 100%;
  position: relative;
  pointer-events: none;
  z-index: 3;
  overflow: hidden;
}
`,document.head.appendChild(o)}var w=(o)=>{let l=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(o);return l?[parseInt(l[1],16)/255,parseInt(l[2],16)/255,parseInt(l[3],16)/255]:[1,1,1]},z=(o)=>{switch(o){case"top-left":return[1,0];case"bottom-right":return[0,1];case"bottom-left":return[1,1];default:return[0,0]}},H=({speed:o=2.5,rayColor1:l="#EAB308",rayColor2:v="#96c8ff",intensity:m=2,spread:p=2,origin:g="top-right",tilt:y=0,saturation:h=1.5,blend:R=0.75,falloff:C=1.6,opacity:x=1,className:Y=""})=>{let i=t.useRef(null),u=t.useRef(null),F=t.useRef(null),f=t.useRef(null),b=t.useRef(null),s=t.useRef(null),[P,O]=t.useState(!1),d=t.useRef(null);return t.useEffect(()=>{if(!i.current)return;return d.current=new IntersectionObserver((e)=>{let r=e[0];O(r.isIntersecting)},{threshold:0.1}),d.current.observe(i.current),()=>{if(d.current)d.current.disconnect(),d.current=null}},[]),t.useEffect(()=>{if(!P||!i.current)return;if(s.current)s.current(),s.current=null;return(async()=>{if(!i.current)return;if(await new Promise((n)=>setTimeout(n,10)),!i.current)return;let r=new L({dpr:Math.min(window.devicePixelRatio,2),alpha:!0});F.current=r;let a=r.gl;a.canvas.style.width="100%",a.canvas.style.height="100%";while(i.current.firstChild)i.current.removeChild(i.current.firstChild);i.current.appendChild(a.canvas);let _=`
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`,W=`precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform vec3 iRayColor1;
uniform vec3 iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iFlipX;
uniform float iFlipY;
uniform float iTilt;
uniform float iSaturation;
uniform float iBlend;
uniform float iFalloff;
uniform float iOpacity;

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
  return clamp(
    (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),
    0.0, 1.0) *
    clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
  if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);

  float tiltRad = iTilt * 3.14159265 / 180.0;
  float cs = cos(tiltRad);
  float sn = sin(tiltRad);
  vec2 rel = coord - rayPos;
  vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;

  float halfSpread = iSpread * 0.275;
  vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
  vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

  vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
  vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);

  vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

  float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;
  float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
  color.rgb *= brightness;

  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, iSaturation);

  color.a = max(color.r, max(color.g, color.b)) * iOpacity;
  gl_FragColor = color;
}`,[G,M]=z(g),S={iTime:{value:0},iResolution:{value:[1,1]},iSpeed:{value:o},iRayColor1:{value:w(l)},iRayColor2:{value:w(v)},iIntensity:{value:m},iSpread:{value:p},iFlipX:{value:G},iFlipY:{value:M},iTilt:{value:y},iSaturation:{value:h},iBlend:{value:R},iFalloff:{value:C},iOpacity:{value:x}};u.current=S;let N=new X(a),q=new E(a,{vertex:_,fragment:W,uniforms:S}),B=new D(a,{geometry:N,program:q});b.current=B;let T=()=>{if(!i.current||!r)return;r.dpr=Math.min(window.devicePixelRatio,2);let{clientWidth:n,clientHeight:c}=i.current;r.setSize(n,c),S.iResolution.value=[n*r.dpr,c*r.dpr]},I=(n)=>{if(!F.current||!u.current||!b.current)return;S.iTime.value=n*0.001;try{r.render({scene:B}),f.current=requestAnimationFrame(I)}catch(c){return}};window.addEventListener("resize",T),T(),f.current=requestAnimationFrame(I),s.current=()=>{if(f.current)cancelAnimationFrame(f.current),f.current=null;if(window.removeEventListener("resize",T),r)try{let n=r.gl.getExtension("WEBGL_lose_context");if(n)n.loseContext();let c=r.gl.canvas;if(c&&c.parentNode)c.parentNode.removeChild(c)}catch(n){}F.current=null,u.current=null,b.current=null}})(),()=>{if(s.current)s.current(),s.current=null}},[P,o,l,v,m,p,g,y,h,R,C,x]),t.useEffect(()=>{if(!u.current)return;let e=u.current;e.iSpeed.value=o,e.iRayColor1.value=w(l),e.iRayColor2.value=w(v),e.iIntensity.value=m,e.iSpread.value=p;let[r,a]=z(g);e.iFlipX.value=r,e.iFlipY.value=a,e.iTilt.value=y,e.iSaturation.value=h,e.iBlend.value=R,e.iFalloff.value=C,e.iOpacity.value=x},[o,l,v,m,p,g,y,h,R,C,x]),A("div",{ref:i,className:`edge-beams-container ${Y}`.trim()})},Q=H;export{Q as default};
