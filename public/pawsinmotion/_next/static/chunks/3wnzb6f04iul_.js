(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,79360,e=>{"use strict";var r=e.i(41929),u=e.i(49456),o=e.i(26881),i=e.i(36048),t=e.i(81484),l=e.i(46308),a=e.i(63617);let n=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,s=`
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uSpeed;
  uniform float uScale;
  uniform vec3 uColor;
  uniform float uSize;
  uniform float uBlur;

  varying vec2 vUv;

  float hash13(vec3 p3) {
    p3  = fract(p3 * .1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec3 getPattern(vec3 dir, float time) {
    dir += time * vec3(0.03, 0.01, 0.0);
    vec3 v = abs(mod(dir * 50.0, 2.0) - 1.0);
    vec3 pat = 3.0 * v * cos(hash13(floor(dir * 800.0)));
    return pat;
  }

  void main() {
    vec2 uv = (vUv * uResolution - 0.5 * uResolution) / uResolution.y;
    vec3 dir = normalize(vec3(uv * uScale, 1.0));
    float time = uTime * uSpeed;

    vec3 pat = getPattern(dir, time);
    float density = max(0.0, (1.5 * uSize) - dot(pat, vec3(1.0, 1.0, 0.5)));

    vec3 col = uColor * density * 3.0;

    float alpha = smoothstep(0.0, uBlur, density);

    gl_FragColor = vec4(col, alpha);
  }
`,c=({speed:e,scale:o,color:a,size:c,blur:v})=>{let m=(0,u.useRef)(null),f=(0,u.useRef)(null),{size:d,viewport:p}=(0,t.useThree)(),h=(0,u.useMemo)(()=>({uTime:{value:0},uResolution:{value:new l.Vector2(d.width,d.height)},uSpeed:{value:e},uScale:{value:o},uColor:{value:new l.Color(a)},uSize:{value:c},uBlur:{value:v}}),[]);return(0,i.useFrame)(r=>{f.current&&(f.current.uniforms.uTime.value=r.clock.elapsedTime,f.current.uniforms.uResolution.value.set(d.width,d.height),f.current.uniforms.uSpeed.value=e,f.current.uniforms.uScale.value=o,f.current.uniforms.uColor.value.set(a),f.current.uniforms.uSize.value=c,f.current.uniforms.uBlur.value=v)}),(0,r.jsxs)("mesh",{ref:m,children:[(0,r.jsx)("planeGeometry",{args:[p.width,p.height]}),(0,r.jsx)("shaderMaterial",{ref:f,vertexShader:n,fragmentShader:s,uniforms:h,transparent:!0})]})};e.s(["default",0,({speed:e=.5,scale:u=.6,color:i="#FF9FFC",size:t=.6,blur:l=.5,className:n=""})=>(0,r.jsx)("div",{className:(0,a.cn)("relative h-full w-full overflow-hidden",n),children:(0,r.jsx)(o.Canvas,{orthographic:!0,camera:{position:[0,0,1],zoom:1},dpr:[1,2],gl:{alpha:!0,antialias:!0,powerPreference:"high-performance"},children:(0,r.jsx)(c,{speed:e,scale:u,color:i,size:t,blur:l})})})])}]);