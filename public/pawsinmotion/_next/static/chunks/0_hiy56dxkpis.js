(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,40929,e=>{"use strict";var u=e.i(41929),o=e.i(49456),t=e.i(46308),r=e.i(99057),i=e.i(63617);let n=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,a=`
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uSpeed;
  uniform float uScale;
  uniform float uDistortion;
  uniform float uCurve;
  uniform float uContrast;
  uniform float uRotation;
  uniform float uOffsetX;
  uniform float uOffsetY;
  uniform float uBrightness;
  uniform float uOpacity;
  uniform float uComplexity;
  uniform float uFrequency;
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uC3;
  uniform vec3 uC4;
  uniform vec3 uC5;
  uniform vec3 uC6;
  uniform vec3 uC7;
  uniform vec3 uC8;

  varying vec2 vUv;

  vec2 rotate2D(vec2 p, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
  }

  void main() {
    vec2 pos = vUv * uScale;
    float aspect = uResolution.x / uResolution.y;
    pos.x *= aspect;

    pos.x += uOffsetX;
    pos.y += uOffsetY;

    vec2 center = vec2(aspect * 0.5 * uScale, 0.5 * uScale);
    pos = rotate2D(pos - center, uRotation) + center;

    float iterations = 10.0 + uComplexity * 10.0;

    for (float i = 1.0; i < 30.0; i++) {
        if (i > iterations) break;
        float timeOffset = uTime * uSpeed * 0.1 * i;
        float amp = 0.8 * uDistortion;
        float shift = 0.3 * uCurve;

        pos.x += amp / i * sin(i * pos.y + timeOffset + shift * i) + 1.6;
        pos.y += (amp * 2.0) / i * sin(pos.x + timeOffset + shift * i + 1.6) - 0.8;
    }

    float wave = cos((pos.x + pos.y) * uFrequency) * 0.5 + 0.5;

    vec3 finalColor = vec3(0.0);

    if (wave < 0.15) {
        finalColor = mix(uC1, uC2, wave * 6.667);
    } else if (wave < 0.35) {
        finalColor = mix(uC2, uC3, (wave - 0.15) * 5.0);
    } else if (wave < 0.55) {
        finalColor = mix(uC3, uC4, (wave - 0.35) * 5.0);
    } else if (wave < 0.7) {
        finalColor = mix(uC4, uC5, (wave - 0.55) * 6.667);
    } else if (wave < 0.82) {
        finalColor = mix(uC5, uC6, (wave - 0.7) * 8.333);
    } else if (wave < 0.92) {
        finalColor = mix(uC6, uC7, (wave - 0.82) * 10.0);
    } else {
        finalColor = mix(uC7, uC8, (wave - 0.92) * 12.5);
    }

    finalColor *= uBrightness;

    float alpha = smoothstep(0.01, 1.0, pow(wave, 2.5 * uContrast)) * uOpacity;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;e.s(["default",0,({speed:e=1,scale:l=2,distortion:s=1,curve:f=1,contrast:v=1,colors:c=["#0d1326","#162a52","#1e407e","#2657aa","#2e6ed5","#3785ff","#5092ff","#69a0ff"],rotation:m=0,offsetX:C=0,offsetY:p=0,brightness:w=1,opacity:d=1,complexity:h=1,frequency:x=1,className:y,style:g})=>{let O=(0,o.useRef)(null),R=(0,o.useRef)(null),S=(0,o.useRef)(null),P=(0,o.useRef)(null);return(0,o.useEffect)(()=>{if(!O.current)return;let u=O.current,o=u.clientWidth,i=u.clientHeight,y=new t.Scene,g=new t.OrthographicCamera(-1,1,1,-1,0,1),T=new r.WebGLRenderer({antialias:!0,alpha:!0,powerPreference:"high-performance"});T.setClearColor(0,0),T.setSize(o,i),T.setPixelRatio(Math.min(window.devicePixelRatio,2)),u.appendChild(T.domElement),R.current=T;let b=new t.ShaderMaterial({uniforms:{uTime:{value:0},uResolution:{value:new t.Vector2(o,i)},uSpeed:{value:e},uScale:{value:l},uDistortion:{value:s},uCurve:{value:f},uContrast:{value:v},uRotation:{value:m*Math.PI/180},uOffsetX:{value:C},uOffsetY:{value:p},uBrightness:{value:w},uOpacity:{value:d},uComplexity:{value:h},uFrequency:{value:x},uC1:{value:new t.Color(c[0])},uC2:{value:new t.Color(c[1])},uC3:{value:new t.Color(c[2])},uC4:{value:new t.Color(c[3])},uC5:{value:new t.Color(c[4])},uC6:{value:new t.Color(c[5])},uC7:{value:new t.Color(c[6])},uC8:{value:new t.Color(c[7])}},vertexShader:n,fragmentShader:a,transparent:!0});S.current=b;let F=new t.PlaneGeometry(2,2),M=new t.Mesh(F,b);y.add(M);let B=new t.Clock,D=()=>{let e=B.getElapsedTime();b.uniforms.uTime.value=e,T.render(y,g),P.current=requestAnimationFrame(D)};D();let E=new ResizeObserver(()=>{let e=u.clientWidth,o=u.clientHeight;T.setSize(e,o),b.uniforms.uResolution.value.set(e,o)});return E.observe(u),()=>{P.current&&cancelAnimationFrame(P.current),E.disconnect(),T.dispose(),T.forceContextLoss(),F.dispose(),b.dispose(),u.contains(T.domElement)&&u.removeChild(T.domElement)}},[]),(0,o.useEffect)(()=>{S.current&&(S.current.uniforms.uSpeed.value=e,S.current.uniforms.uScale.value=l,S.current.uniforms.uDistortion.value=s,S.current.uniforms.uCurve.value=f,S.current.uniforms.uContrast.value=v,S.current.uniforms.uRotation.value=m*Math.PI/180,S.current.uniforms.uOffsetX.value=C,S.current.uniforms.uOffsetY.value=p,S.current.uniforms.uBrightness.value=w,S.current.uniforms.uOpacity.value=d,S.current.uniforms.uComplexity.value=h,S.current.uniforms.uFrequency.value=x,S.current.uniforms.uC1.value.set(c[0]),S.current.uniforms.uC2.value.set(c[1]),S.current.uniforms.uC3.value.set(c[2]),S.current.uniforms.uC4.value.set(c[3]),S.current.uniforms.uC5.value.set(c[4]),S.current.uniforms.uC6.value.set(c[5]),S.current.uniforms.uC7.value.set(c[6]),S.current.uniforms.uC8.value.set(c[7]))},[e,l,s,f,v,m,C,p,w,d,h,x,c]),(0,u.jsx)("div",{ref:O,className:(0,i.cn)("relative w-full h-full overflow-hidden bg-transparent",y),style:{minHeight:"inherit",...g}})}])}]);