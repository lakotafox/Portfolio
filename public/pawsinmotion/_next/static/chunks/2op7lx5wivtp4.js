(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,58641,t=>{"use strict";var o=t.i(41929),l=t.i(26881),a=t.i(36048),e=t.i(81484),i=t.i(49456),r=t.i(46308),u=t.i(63617);let s=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,n=`
  uniform float uTime;
  uniform vec2 uResolution;

  uniform float uRayCount;
  uniform float uRayWidth;
  uniform float uPulseSpeed;
  uniform float uPulseWidth;
  uniform float uTrailLength;
  uniform float uMotionBlur;
  uniform float uBgGlow;
  uniform vec3 uColor1;
  uniform vec3 uColor2;

  const float topWidth = 0.15;
  const float bottomWidth = 1.0;
  const float verticalLength = 0.45;
  const float controlPoint1Y = 0.35;
  const float controlPoint1X = 0.25;
  const float controlPoint2Y = 0.55;
  const float controlPoint2X = 0.0;
  const float glowSpread = 1.0;
  const float glowCurve = 0.2;
  const float pulseBrightness = 1.0;

  varying vec2 vUv;

  float hash(float n) {
      return fract(sin(n * 127.1) * 43758.5453123);
  }

  vec3 solveCubic(float a, float b, float c, float d) {
      if (abs(a) < 1e-6) {
          if (abs(b) < 1e-6) {
              if (abs(c) < 1e-6) return vec3(-1.0);
              return vec3(-d/c, -1.0, -1.0);
          }
          float delta = c*c - 4.0*b*d;
          if (delta < 0.0) return vec3(-1.0);
          float sqrtDelta = sqrt(delta);
          return vec3((-c - sqrtDelta)/(2.0*b), (-c + sqrtDelta)/(2.0*b), -1.0);
      }

      float p = (3.0*a*c - b*b) / (3.0*a*a);
      float q = (2.0*b*b*b - 9.0*a*b*c + 27.0*a*a*d) / (27.0*a*a*a);

      float offset = b / (3.0*a);
      float discriminant = q*q/4.0 + p*p*p/27.0;

      if (discriminant > 0.0) {
          float r = sqrt(discriminant);
          float u = pow(abs(-q/2.0 + r), 1.0/3.0);
          u = (-q/2.0 + r) < 0.0 ? -u : u;
          float v = pow(abs(-q/2.0 - r), 1.0/3.0);
          v = (-q/2.0 - r) < 0.0 ? -v : v;
          return vec3(u + v - offset, -1.0, -1.0);
      } else if (discriminant == 0.0) {
          float u = pow(abs(q/2.0), 1.0/3.0);
          u = q < 0.0 ? u : -u;
          return vec3(2.0*u - offset, -u - offset, -1.0);
      } else {
          float r = sqrt(-p*p*p/27.0);
          float phi = acos(clamp(-q/(2.0*r), -1.0, 1.0));
          float t1 = 2.0 * pow(r, 1.0/3.0);
          float rho = 2.0 * sqrt(-p/3.0);
          float t0 = rho * cos(phi/3.0) - offset;
          float t1_val = rho * cos((phi + 2.0*3.14159)/3.0) - offset;
          float t2_val = rho * cos((phi + 4.0*3.14159)/3.0) - offset;
          return vec3(t0, t1_val, t2_val);
      }
  }

  void main() {
    float targetY = 1.0 - vUv.y;

    float P0 = 0.0;
    float P1 = verticalLength + controlPoint1Y;
    float P2 = controlPoint2Y;
    float P3 = 1.0;

    float a = -P0 + 3.0*P1 - 3.0*P2 + P3;
    float b = 3.0*P0 - 6.0*P1 + 3.0*P2;
    float c = -3.0*P0 + 3.0*P1;
    float d = P0 - targetY;

    vec3 roots = solveCubic(a, b, c, d);

    vec3 finalColorAccum = vec3(0.0);
    vec3 bgGlowAccum = vec3(0.0);

    float px = 1.0 / uResolution.x;

    for (int r = 0; r < 3; r++) {
        float t = roots[r];
        if (t < 0.0 || t > 1.0) continue;

        float s = 1.0 - t;
        float flowWidthAtT = s*s*s*topWidth +
                             3.0*s*s*t*(bottomWidth * controlPoint1X) +
                             3.0*s*t*t*(bottomWidth * controlPoint2X) +
                             t*t*t*bottomWidth;

        float idealH = (vUv.x - 0.5) / flowWidthAtT;
        float idealRayIndex = idealH + 0.5;
        float idealBin = idealRayIndex * (uRayCount - 1.0);

        for (int offset = 0; offset <= 1; offset++) {
             float bin = floor(idealBin) + float(offset);
             if (bin < 0.0 || bin >= uRayCount) continue;

             float i = bin;
             float rayIndex = i / (uRayCount - 1.0);
             float H = rayIndex - 0.5;
             float centerX = 0.5 + H * flowWidthAtT;
             float dist = abs(vUv.x - centerX);

             float widthAtT = mix(topWidth, bottomWidth, t);
             float widthScale = widthAtT / max(topWidth, bottomWidth);
             float scaledRayWidth = uRayWidth * widthScale;

             float dy_dt = 3.0*a*t*t + 2.0*b*t + c;
             float Wa = -topWidth + 3.0*(bottomWidth*controlPoint1X) - 3.0*(bottomWidth*controlPoint2X) + bottomWidth;
             float Wb = 3.0*topWidth - 6.0*(bottomWidth*controlPoint1X) + 3.0*(bottomWidth*controlPoint2X);
             float Wc = -3.0*topWidth + 3.0*(bottomWidth*controlPoint1X);
             float dFlowWidth_dt = 3.0*Wa*t*t + 2.0*Wb*t + Wc;
             float dx_dt = H * dFlowWidth_dt;

             float geomFactor = abs(dy_dt) / sqrt(dx_dt*dx_dt + dy_dt*dy_dt);
             float trueDist = dist * geomFactor;

             float minWidth = px * 1.5;
             float aaScale = 1.0;
             if (scaledRayWidth < minWidth) {
                 aaScale = scaledRayWidth / minWidth;
                 scaledRayWidth = minWidth;
             }

             float rayGlow = exp(-trueDist / scaledRayWidth);

             rayGlow = pow(rayGlow, 0.8);
             rayGlow *= aaScale;

             float colorHash = hash(i * 3.7);
             vec3 rayColor = mix(uColor1, uColor2, targetY);
             rayColor += (colorHash - 0.5) * 0.1;

             vec3 pulseColor = vec3(0.0);
             for (float p = 0.0; p < 3.0; p += 1.0) {
                 float pulseTime = uTime * uPulseSpeed + i * 0.2 + p * 0.7;
                 float pulsePos = fract(pulseTime);

                 float pulseDist = abs(t - pulsePos);

                 float pulseWidthAtT = mix(topWidth, bottomWidth, pulsePos);
                 float pulseWidthScale = pulseWidthAtT / max(topWidth, bottomWidth);
                 float scaledPulseWidth = uPulseWidth * pulseWidthScale;

                 float pulse = exp(-pulseDist / scaledPulseWidth) * rayGlow;

                 float trailDist = pulsePos - t;
                 if (trailDist > 0.0 && trailDist < uTrailLength) {
                     float trailFade = (1.0 - trailDist / uTrailLength) * 0.3;
                     pulse += trailFade * rayGlow;

                     float blurFactor = exp(-trailDist * 2.0) * uMotionBlur;
                     pulse += blurFactor * rayGlow * 0.5;
                 }

                 pulse *= smoothstep(1.0, 0.8, pulsePos);
                 pulseColor += rayColor * pulse;
             }

             finalColorAccum += pulseColor * pulseBrightness;

             float bgGlowDist = trueDist / (uRayWidth * 10.0);
             float baseGlowIntensity = exp(-bgGlowDist) * uBgGlow * 0.15;
             float spreadWeight = smoothstep(0.3, 1.0, t) * glowSpread;
             float curveWeight = exp(-pow((t - 0.5) * 3.0, 2.0)) * glowCurve;
             float glowWeight = spreadWeight + curveWeight;
             bgGlowAccum += rayColor * baseGlowIntensity * glowWeight;
        }
    }

    float yFade = smoothstep(0.0, 0.15, targetY);
    vec3 finalColor = finalColorAccum * yFade;
    finalColor += bgGlowAccum;

    vec2 centerUV = vUv - vec2(0.5);
    float vignette = 1.0 - smoothstep(0.7, 1.2, length(centerUV));
    finalColor *= vignette * 0.3 + 0.7;

    float alpha = max(max(finalColor.r, finalColor.g), finalColor.b);

    vec3 normalizedColor = finalColor / max(alpha, 0.001);

    alpha = smoothstep(0.0, 1.0, alpha);

    gl_FragColor = vec4(normalizedColor, alpha);
  }
`,f=({rayCount:t,rayWidth:l,pulseSpeed:u,pulseWidth:f,trailLength:c,motionBlur:d,bgGlow:h,color1:p,color2:v})=>{let m=(0,i.useRef)(null),W=(0,i.useRef)(null),{size:b,viewport:g}=(0,e.useThree)(),w=(0,i.useMemo)(()=>({uTime:{value:0},uResolution:{value:new r.Vector2(b.width,b.height)},uRayCount:{value:t},uRayWidth:{value:l},uPulseSpeed:{value:u},uPulseWidth:{value:f},uTrailLength:{value:c},uMotionBlur:{value:d},uBgGlow:{value:h},uColor1:{value:new r.Color(p)},uColor2:{value:new r.Color(v)}}),[]);return(0,a.useFrame)(o=>{W.current&&(W.current.uniforms.uTime.value=o.clock.elapsedTime,W.current.uniforms.uResolution.value.set(b.width,b.height),W.current.uniforms.uRayCount.value=t,W.current.uniforms.uRayWidth.value=l,W.current.uniforms.uPulseSpeed.value=u,W.current.uniforms.uPulseWidth.value=f,W.current.uniforms.uTrailLength.value=c,W.current.uniforms.uMotionBlur.value=d,W.current.uniforms.uBgGlow.value=h,W.current.uniforms.uColor1.value.set(p),W.current.uniforms.uColor2.value.set(v))}),(0,o.jsxs)("mesh",{ref:m,children:[(0,o.jsx)("planeGeometry",{args:[g.width,g.height]}),(0,o.jsx)("shaderMaterial",{ref:W,vertexShader:s,fragmentShader:n,uniforms:w,transparent:!0})]})};t.s(["default",0,({color1:t="#1a00ff",color2:a="#ff0080",rayCount:e=37,rayWidth:i=.005,pulseSpeed:r=.4,pulseWidth:s=.03,trailLength:n=.5,motionBlur:c=.3,bgGlow:d=1.2,className:h="",style:p})=>(0,o.jsx)("div",{className:(0,u.cn)("relative h-full w-full overflow-hidden",h),style:{...p},children:(0,o.jsx)(l.Canvas,{orthographic:!0,camera:{position:[0,0,1],zoom:1},dpr:[1,2],gl:{alpha:!0,antialias:!0,powerPreference:"high-performance"},resize:{scroll:!1,debounce:0},children:(0,o.jsx)(f,{rayCount:e,rayWidth:i,pulseSpeed:r,pulseWidth:s,trailLength:n,motionBlur:c,bgGlow:d,color1:t,color2:a})})})])}]);