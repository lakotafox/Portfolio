(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,65109,e=>{"use strict";var u=e.i(41929),r=e.i(49456),o=e.i(26881),i=e.i(36048),t=e.i(81484),l=e.i(46308),n=e.i(63617);let a=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,s=`
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform vec3 uColor;
  uniform float uSpeed;
  uniform float uScale;
  uniform float uIntensity;
  uniform float uFalloff;
  uniform float uComplexity;

  varying vec2 vUv;

  mat2 rotate2D(float r) {
    return mat2(cos(r), sin(r), -sin(r), cos(r));
  }

  void main() {
    vec2 uv = (vUv * uResolution - 0.5 * uResolution) / uResolution.y;
    vec3 col = vec3(0.0);
    float t = uTime * uSpeed;

    vec2 n = vec2(0.0);
    vec2 q = vec2(0.0);
    vec2 N = vec2(0.0);
    vec2 p = uv + sin(t * 0.1) / 10.0;
    float S = 10.0 * uScale;

    mat2 m = rotate2D(1.0 - uPointer.x * 0.0001);

    for (float i = 0.0; i < 50.0; i++) {
      if (i >= uComplexity) break;
      float j = i + 1.0;
      p *= m;
      n *= m;
      q = p * S + j + n + t;
      n += sin(q);
      N += cos(q) / S;
      S *= uFalloff;
    }

    float brightness = pow((N.x + N.y + 0.2) + 0.005 / length(N), uIntensity);
    col = uColor * vec3(1.0, 2.0, 4.0) * brightness;

    float alpha = clamp(brightness, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`,c=({color:e,speed:o,scale:n,intensity:c,falloff:f,complexity:v,breathing:m})=>{let h=(0,r.useRef)(null),p=(0,r.useRef)(null),{size:d,viewport:g,pointer:y}=(0,t.useThree)(),x=(0,r.useMemo)(()=>({uTime:{value:0},uResolution:{value:new l.Vector2(d.width,d.height)},uPointer:{value:new l.Vector2(0,0)},uColor:{value:new l.Color(e)},uSpeed:{value:o},uScale:{value:n},uIntensity:{value:c},uFalloff:{value:f},uComplexity:{value:v}}),[]);return(0,i.useFrame)(u=>{if(p.current){if(p.current.uniforms.uTime.value=u.clock.elapsedTime,p.current.uniforms.uResolution.value.set(d.width,d.height),p.current.uniforms.uColor.value.set(e),p.current.uniforms.uSpeed.value=o,p.current.uniforms.uScale.value=n,p.current.uniforms.uFalloff.value=f,p.current.uniforms.uComplexity.value=v,m){let e=.2*Math.sin(2*u.clock.elapsedTime)+1;p.current.uniforms.uIntensity.value=c*e}else p.current.uniforms.uIntensity.value=c;let r=y.x*d.width,i=y.y*d.height;p.current.uniforms.uPointer.value.x+=(r-p.current.uniforms.uPointer.value.x)*.1,p.current.uniforms.uPointer.value.y+=(i-p.current.uniforms.uPointer.value.y)*.1}}),(0,u.jsxs)("mesh",{ref:h,children:[(0,u.jsx)("planeGeometry",{args:[g.width,g.height]}),(0,u.jsx)("shaderMaterial",{ref:p,vertexShader:a,fragmentShader:s,uniforms:x,transparent:!0})]})};e.s(["default",0,({speed:e=.5,scale:r=.5,intensity:i=2,color:t="#FF9FFC",falloff:l=1.15,complexity:a=10,breathing:s=!1,className:f=""})=>(0,u.jsx)("div",{className:(0,n.cn)("relative h-full w-full overflow-hidden",f),children:(0,u.jsx)(o.Canvas,{orthographic:!0,camera:{position:[0,0,1],zoom:1},dpr:[1,2],gl:{alpha:!0,antialias:!0,powerPreference:"high-performance"},children:(0,u.jsx)(c,{color:t,speed:e,scale:r,intensity:i,falloff:l,complexity:a,breathing:s})})})])}]);