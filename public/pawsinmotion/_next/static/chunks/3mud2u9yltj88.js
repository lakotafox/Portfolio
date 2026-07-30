(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,74625,e=>{"use strict";var t=e.i(41929),o=e.i(49456),a=e.i(26881),i=e.i(36048),r=e.i(81484),l=e.i(46308),u=e.i(63617);let n=`
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uBarCount;
  uniform float uScale;

  uniform float uWaveComplexity;
  uniform float uWaveAmplitude;
  uniform float uReflectionFrequency;
  uniform float uStreakIntensity;
  uniform float uMetallicContrast;
  uniform float uHighlightWarmth;

  uniform float uRefractionStrength;
  uniform float uEdgeWidth;
  uniform float uEdgeSoftness;
  uniform float uFresnelIntensity;
  uniform float uEdgeHighlight;
  uniform float uGapDarkness;
  uniform float uRefractionWaveSpeed;
  uniform float uRefractionWaveFrequency;

  varying vec2 vUv;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  vec3 getMetallicColor(vec2 uv, vec2 resolution, vec3 color, float time) {
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    p *= uScale;

    float t = time * 0.3;

    float waves = snoise(vec3(p * 1.5, t * 0.5)) * 0.5 * uWaveAmplitude;

    if (uWaveComplexity >= 2.0) {
      waves += snoise(vec3(p * 2.0 + 10.0, t * 0.7)) * 0.35 * uWaveAmplitude;
    }
    if (uWaveComplexity >= 3.0) {
      waves += snoise(vec3(p * 4.0 + 20.0, t * 0.9)) * 0.15 * uWaveAmplitude;
    }
    if (uWaveComplexity >= 4.0) {
      waves += snoise(vec3(p * 6.0 + 30.0, t * 1.1)) * 0.1 * uWaveAmplitude;
    }
    if (uWaveComplexity >= 5.0) {
      waves += snoise(vec3(p * 8.0 + 40.0, t * 1.3)) * 0.05 * uWaveAmplitude;
    }

    float reflection = sin(waves * uReflectionFrequency + p.y * 3.0) * 0.5 + 0.5;
    reflection = pow(reflection, 1.5);

    float streak1 = smoothstep(0.4, 0.5, sin(waves * 12.0 + t)) * uStreakIntensity;
    float streak2 = smoothstep(0.6, 0.7, sin(waves * 8.0 - p.x * 2.0 + t * 1.5)) * uStreakIntensity;

    float darkMult = 0.08 / uMetallicContrast;
    float midMult = 0.5;
    float brightMult = 0.5 + 0.7 * uMetallicContrast;

    vec3 darkColor = color * darkMult;
    vec3 midColor = color * midMult;
    vec3 brightColor = color * brightMult;
    vec3 highlightColor = mix(color, vec3(1.0), 0.7);

    vec3 finalColor = mix(darkColor, midColor, reflection);
    finalColor = mix(finalColor, brightColor, pow(reflection, 2.0));
    finalColor = mix(finalColor, highlightColor, streak1 * 0.6);
    finalColor += highlightColor * streak2 * 0.3;

    finalColor += vec3(0.08, 0.06, 0.03) * pow(reflection, 3.0) * uHighlightWarmth;

    return finalColor;
  }

  void main() {
    vec2 uv = vUv;

    float barWidth = 1.0 / uBarCount;
    float barIndex = floor(uv.x / barWidth);
    float barLocal = mod(uv.x, barWidth) / barWidth;

    float edgeWidth = uEdgeWidth;

    float leftDist = barLocal / edgeWidth;
    float rightDist = (1.0 - barLocal) / edgeWidth;
    float edgeDist = min(leftDist, rightDist);
    float inEdgeZone = 1.0 - clamp(edgeDist, 0.0, 1.0);

    vec2 refractionOffset = vec2(0.0);

    if (barLocal < edgeWidth) {
      float t = 1.0 - barLocal / edgeWidth;
      float curve = t * t * t;
      refractionOffset.x = curve * uRefractionStrength * 0.08;
      refractionOffset.y = sin(uv.y * uRefractionWaveFrequency + uTime * uRefractionWaveSpeed) * curve * uRefractionStrength * 0.015;
    }
    else if (barLocal > 1.0 - edgeWidth) {
      float t = (barLocal - (1.0 - edgeWidth)) / edgeWidth;
      float curve = t * t * t;
      refractionOffset.x = -curve * uRefractionStrength * 0.08;
      refractionOffset.y = sin(uv.y * uRefractionWaveFrequency + uTime * uRefractionWaveSpeed + 3.14159) * curve * uRefractionStrength * 0.015;
    }

    vec2 refractedUV = clamp(uv + refractionOffset, 0.0, 1.0);
    vec3 metallic = getMetallicColor(refractedUV, uResolution, uColor, uTime);

    float barMask = smoothstep(0.0, uEdgeSoftness, barLocal) * smoothstep(1.0, 1.0 - uEdgeSoftness, barLocal);

    float gapDarken = mix(1.0 - uGapDarkness, 1.0, barMask);

    float edgeHighlightVal = inEdgeZone * uEdgeHighlight * barMask;

    float fresnel = pow(inEdgeZone, 2.0) * uFresnelIntensity;

    vec3 finalColor = metallic * gapDarken;
    finalColor += vec3(1.0) * edgeHighlightVal;
    finalColor += uColor * fresnel * 0.3;

    gl_FragColor = vec4(finalColor, uOpacity * barMask);
  }
`,v=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;function c({color:e,opacity:a,speed:u,barCount:s,scale:f,waveComplexity:m,waveAmplitude:d,reflectionFrequency:h,streakIntensity:p,metallicContrast:x,highlightWarmth:g,refractionStrength:y,edgeWidth:C,edgeSoftness:W,fresnelIntensity:b,edgeHighlight:w,gapDarkness:S,refractionWaveSpeed:R,refractionWaveFrequency:z}){let k=(0,o.useRef)(null),{size:M}=(0,r.useThree)(),D=(0,o.useMemo)(()=>({uTime:{value:0},uResolution:{value:new l.Vector2(100,100)},uColor:{value:new l.Color},uOpacity:{value:1},uBarCount:{value:12},uScale:{value:1},uWaveComplexity:{value:3},uWaveAmplitude:{value:1},uReflectionFrequency:{value:8},uStreakIntensity:{value:1},uMetallicContrast:{value:1},uHighlightWarmth:{value:1},uRefractionStrength:{value:1},uEdgeWidth:{value:.12},uEdgeSoftness:{value:.03},uFresnelIntensity:{value:.2},uEdgeHighlight:{value:.12},uGapDarkness:{value:.6},uRefractionWaveSpeed:{value:2},uRefractionWaveFrequency:{value:12.566}}),[]);return(0,i.useFrame)(t=>{if(k.current){let o=k.current.material;o.uniforms.uTime.value=t.clock.elapsedTime*u,o.uniforms.uColor.value=e,o.uniforms.uOpacity.value=a,o.uniforms.uBarCount.value=s,o.uniforms.uScale.value=f,o.uniforms.uWaveComplexity.value=m,o.uniforms.uWaveAmplitude.value=d,o.uniforms.uReflectionFrequency.value=h,o.uniforms.uStreakIntensity.value=p,o.uniforms.uMetallicContrast.value=x,o.uniforms.uHighlightWarmth.value=g,o.uniforms.uRefractionStrength.value=y,o.uniforms.uEdgeWidth.value=C,o.uniforms.uEdgeSoftness.value=W,o.uniforms.uFresnelIntensity.value=b,o.uniforms.uEdgeHighlight.value=w,o.uniforms.uGapDarkness.value=S,o.uniforms.uRefractionWaveSpeed.value=R,o.uniforms.uRefractionWaveFrequency.value=z,o.uniforms.uResolution.value.set(M.width,M.height)}}),(0,t.jsxs)("mesh",{ref:k,children:[(0,t.jsx)("planeGeometry",{args:[2,2]}),(0,t.jsx)("shaderMaterial",{uniforms:D,vertexShader:v,fragmentShader:n,transparent:!0})]})}let s=({width:e="100%",height:i="100%",speed:r=1,color:n="#a855f7",barCount:v=6,scale:s=.4,waveComplexity:f=1,waveAmplitude:m=.6,reflectionFrequency:d=20,streakIntensity:h=.25,metallicContrast:p=2,highlightWarmth:x=.5,refractionStrength:g=5,edgeWidth:y=.3,edgeSoftness:C=.04,fresnelIntensity:W=.2,edgeHighlight:b=.1,gapDarkness:w=.2,refractionWaveSpeed:S=1.4,refractionWaveFrequency:R=20,opacity:z=1,className:k,children:M})=>{let D=(0,o.useMemo)(()=>new l.Color(n),[n]),F="number"==typeof e?`${e}px`:e,E="number"==typeof i?`${i}px`:i;return(0,t.jsxs)("div",{className:(0,u.cn)("relative overflow-hidden",k),style:{width:F,height:E},children:[(0,t.jsx)(a.Canvas,{className:"absolute inset-0",orthographic:!0,camera:{left:-1,right:1,top:1,bottom:-1,near:0,far:10,position:[0,0,5]},gl:{antialias:!0,alpha:!0},style:{width:"100%",height:"100%"},children:(0,t.jsx)(c,{color:D,opacity:z,speed:r,barCount:v,scale:s,waveComplexity:f,waveAmplitude:m,reflectionFrequency:d,streakIntensity:h,metallicContrast:p,highlightWarmth:x,refractionStrength:g,edgeWidth:y,edgeSoftness:C,fresnelIntensity:W,edgeHighlight:b,gapDarkness:w,refractionWaveSpeed:S,refractionWaveFrequency:R})}),M&&(0,t.jsx)("div",{className:"relative z-10 w-full h-full pointer-events-none",children:M})]})};s.displayName="LiquidBars",e.s(["default",0,s])}]);