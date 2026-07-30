(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,23934,e=>{"use strict";var u=e.i(41929),o=e.i(49456),t=e.i(26881),r=e.i(36048),a=e.i(81484),n=e.i(46308),s=e.i(63617);let i=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,l=`
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uCenter;
  uniform float uScale;
  uniform float uSpeed;
  uniform vec3 uColor;
  uniform float uThickness;
  uniform float uSoftness;
  uniform float uRoundness;

  varying vec2 vUv;

  #define PI 3.14159265359

  float rand(float t) {
    return fract(sin(dot(vec2(t, t), vec2(12.9898, 78.233))) * 43758.5453);
  }

  float sdRoundedBox(vec2 p, vec2 b, vec4 r) {
    r.xy = (p.x > 0.0) ? r.xy : r.zw;
    r.x  = (p.y > 0.0) ? r.x  : r.y;
    vec2 q = abs(p) - b + r.x;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
  }

  void main() {
    float time = uTime * uSpeed;
    vec2 uv = (vUv * 2.0 - 1.0) * uResolution / uResolution.y;
    vec2 uv1 = uv - uCenter;

    float r = length(uv1) * uScale;
    float t = ceil(r);

    float effectiveTime = time * rand(t) * 0.1 + t * 0.1;
    float angle = atan(uv1.y, uv1.x) / PI;
    float a = fract(angle + effectiveTime);

    float startAng = rand(t);
    float da = fract(a - startAng + 0.5) - 0.5;

    float x = da * 5.0;
    float y = r - t + 0.5;
    vec2 p = vec2(x, y);

    vec2 boxSize = vec2(0.75, uThickness * 0.5);
    float radius = min(boxSize.x, boxSize.y) * uRoundness;
    float d = sdRoundedBox(p, boxSize, vec4(radius));

    float softness = max(uSoftness, 0.001);
    float mask = 1.0 - smoothstep(0.0, softness, d);

    float ringMask = smoothstep(0.1, 0.11, r / uScale);

    vec3 col = uColor * 3.0 * rand(t);

    gl_FragColor = vec4(col, mask * ringMask);
  }
`,c=({center:e,scale:t,speed:s,color:c,thickness:f,softness:v,roundness:d})=>{let m=(0,o.useRef)(null),h=(0,o.useRef)(null),{size:x,viewport:p}=(0,a.useThree)(),g=(0,o.useMemo)(()=>({uTime:{value:0},uResolution:{value:new n.Vector2(x.width,x.height)},uCenter:{value:new n.Vector2(e[0],e[1])},uScale:{value:t},uSpeed:{value:s},uColor:{value:new n.Color(c)},uThickness:{value:f},uSoftness:{value:v},uRoundness:{value:d}}),[]);return(0,r.useFrame)(u=>{h.current&&(h.current.uniforms.uTime.value=u.clock.elapsedTime,h.current.uniforms.uResolution.value.set(x.width,x.height),h.current.uniforms.uCenter.value.set(e[0],e[1]),h.current.uniforms.uScale.value=t,h.current.uniforms.uSpeed.value=s,h.current.uniforms.uColor.value.set(c),h.current.uniforms.uThickness.value=f,h.current.uniforms.uSoftness.value=v,h.current.uniforms.uRoundness.value=d)}),(0,u.jsxs)("mesh",{ref:m,children:[(0,u.jsx)("planeGeometry",{args:[p.width,p.height]}),(0,u.jsx)("shaderMaterial",{ref:h,vertexShader:i,fragmentShader:l,uniforms:g,transparent:!0,depthWrite:!1})]})};e.s(["default",0,({x:e=0,y:o=0,radius:r=15,speed:a=1.5,color:n="#8b5cf6",thickness:i=.01,softness:l=.1,roundness:f=1,className:v=""})=>(0,u.jsx)("div",{className:(0,s.cn)("relative h-full w-full overflow-hidden",v),children:(0,u.jsx)(t.Canvas,{orthographic:!0,camera:{position:[0,0,1],zoom:1},gl:{alpha:!0,antialias:!0},dpr:[1,2],children:(0,u.jsx)(c,{center:[e,o],scale:r,speed:a,color:n,thickness:i,softness:l,roundness:f})})})])}]);