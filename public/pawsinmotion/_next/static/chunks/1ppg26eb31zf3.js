(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,55556,e=>{"use strict";var o=e.i(41929),t=e.i(49456),a=e.i(63617),l=e.i(46308),r=e.i(99057);let n=e=>{let o=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return o?new l.Vector3(parseInt(o[1],16)/255,parseInt(o[2],16)/255,parseInt(o[3],16)/255):new l.Vector3(.2,.5,1)},i=({className:e,color:i="#33AAFF",horizonColor:s="#33AAFF",haloColor:u="#33FFFF",riseSpeed:c=.1,riseScale:d=11.5,riseIntensity:f=1,flowSpeed:v=.2,flowDensity:m=4,flowIntensity:p=.6,horizonIntensity:h=.85,haloIntensity:w=7.5,horizonHeight:C=-.65,circleScale:y=.2,scale:g=3.5,brightness:R=1})=>{let x=(0,t.useRef)(null),S=(0,t.useRef)(null),V=(0,t.useRef)(null),z=(0,t.useRef)(null),I=(0,t.useRef)(null);return(0,t.useEffect)(()=>{let e,o=x.current;if(!o)return;let t=new l.Scene;V.current=t;let a=new l.OrthographicCamera(-1,1,1,-1,0,1);z.current=a;let n=new r.WebGLRenderer({antialias:!0,alpha:!0,premultipliedAlpha:!1});n.setPixelRatio(Math.min(window.devicePixelRatio,2)),S.current=n,o.appendChild(n.domElement);let i=`
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,s=`
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec3 uColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uHaloColor;
      uniform float uRiseSpeed;
      uniform float uRiseScale;
      uniform float uRiseIntensity;
      uniform float uFlowSpeed;
      uniform float uFlowDensity;
      uniform float uFlowIntensity;
      uniform float uHorizonIntensity;
      uniform float uHaloIntensity;
      uniform float uHorizonHeight;
      uniform float uCircleScale;
      uniform float uScale;
      uniform float uBrightness;

      varying vec2 vUv;

      float normalizeRange(float minVal, float maxVal, float value) {
        return clamp((value - minVal) / (maxVal - minVal), 0.0, 1.0);
      }

      float mapRange(float inMin, float inMax, float outMin, float outMax, float value) {
        float normalized = normalizeRange(inMin, inMax, value);
        return mix(outMin, outMax, normalized);
      }

      float hash2D(vec2 coord) {
        vec2 k = fract(coord * vec2(127.82, 311.45));
        k += dot(k, k + 71.83);
        return fract(k.x * k.y);
      }

      vec2 hash2D_vec2(vec2 coord) {
        float h1 = hash2D(coord);
        float h2 = hash2D(coord + h1);
        return vec2(h1, h2);
      }

      vec2 computeParticleOffset(vec2 cellIndex, float timeScale) {
        vec2 randVec = hash2D_vec2(cellIndex);
        vec2 animated = randVec * uTime * timeScale;
        return sin(animated) * 0.4;
      }

      float generateAscendingGlow(vec2 coordinates, float gridDensity) {
        vec2 scaledCoords = coordinates * gridDensity;
        vec2 cellIndex = floor(scaledCoords);
        vec2 localPos = fract(scaledCoords);
        localPos -= 0.5;

        vec2 particlePos = computeParticleOffset(cellIndex, 0.7);
        vec2 deltaPos = (particlePos - localPos) * 70.0;

        float distSq = dot(deltaPos, deltaPos);
        float intensity = 1.0 / distSq;

        float phase = particlePos.x * 10.0;
        float oscillation = sin(uTime * 10.0 + phase) * 0.5 + 0.9;

        return intensity * oscillation;
      }

      float computeLaserStreaks(vec2 coords, vec2 pixelPos) {
        vec2 workCoords = coords;

        workCoords.x = (workCoords.x - 0.5) * 2.0;
        workCoords.x = abs(workCoords.x);
        float edgeFactor = 1.0 - workCoords.x;
        workCoords.x *= uFlowDensity;

        workCoords.y = 1.0 - workCoords.y;
        workCoords.y += workCoords.x;

        float seed = fract(tan(pixelPos.x) * 7.0);
        float animOffset = uResolution.y * (uTime + 60.0) * uFlowSpeed;
        float denominator = mod(seed * animOffset, uResolution.x) - pixelPos.y;

        float streakValue = seed * 10.0 * workCoords.y / denominator * workCoords.y;

        return streakValue;
      }

      float computeRadialGlow(vec2 position, vec2 center, vec2 scale, float power, float strength) {
        vec2 offset = position * scale - center;
        float distSq = dot(offset, offset);
        return strength / pow(distSq, power);
      }

      float computeHorizonLaser(vec2 position, float horizonY, float intensity) {
        float curveAmount = 0.08;
        float curvedY = horizonY + curveAmount * position.x * position.x;

        float dist = abs(position.y - curvedY) * 50.0;

        float distSq = dist * dist + 0.1;
        float core = intensity / distSq;

        float horizExtent = 1.0 - smoothstep(1.0, 2.5, abs(position.x));

        return core * horizExtent;
      }

      void main() {
        vec2 screenUV = vUv;
        vec2 centeredUV = (screenUV - 0.5) * 2.0;

        float aspectRatio = uResolution.x / uResolution.y;
        centeredUV.x *= aspectRatio;

        vec2 transformedUV = centeredUV / uScale;
        transformedUV.y -= uHorizonHeight / uScale;

        float lowerFade = clamp(mapRange(0.0, 0.5, 0.0, 0.8, -transformedUV.y - 0.12), 0.0, 1.0);
        float upperFade = clamp(mapRange(0.0, 0.3, 0.0, 0.5, transformedUV.y + 0.10), 0.0, 1.0);

        vec2 vignetteCoords = (screenUV - 0.5) * 2.0;
        float vignetteRadius = length(vignetteCoords);
        float vignetteMask = smoothstep(-0.6 + uCircleScale, 0.2 + uCircleScale, 1.0 - vignetteRadius);

        vec2 particleCoords = vec2(transformedUV.x, transformedUV.y - uTime * uRiseSpeed);
        float ascendingEffect = generateAscendingGlow(particleCoords, uRiseScale);

        vec2 scaledScreenUV = (screenUV - 0.5) / uScale + 0.5;
        vec2 pixelCoords = scaledScreenUV * uResolution;
        float laserStreaks = computeLaserStreaks(scaledScreenUV, pixelCoords);

        float particleLayer = clamp(ascendingEffect * uRiseIntensity, 0.0, 1.0);
        float laserLayer = clamp(laserStreaks * uFlowIntensity, 0.0, 1.0);
        float combinedEffect = (particleLayer + laserLayer) * upperFade;

        vec3 horizonGlow = uHorizonColor;
        float horizonIntensity = computeRadialGlow(
          transformedUV,
          vec2(0.0, -5.0),
          vec2(1.0, 50.0),
          0.5,
          uHorizonIntensity
        );
        horizonGlow *= horizonIntensity;

        vec3 haloGlow = uHaloColor;
        float haloGlowIntensity = computeRadialGlow(
          transformedUV,
          vec2(0.0, -1.0),
          vec2(1.0, 10.0),
          1.2,
          uHaloIntensity * 2.0
        );
        haloGlow *= haloGlowIntensity;

        float laserLineIntensity = computeHorizonLaser(
          transformedUV,
          -0.92,
          uHaloIntensity * 0.8
        );
        vec3 laserLine = uHaloColor * clamp(laserLineIntensity, 0.0, 1.0);

        vec3 effectColor = uColor * combinedEffect * haloGlow;
        vec3 composedColor = (effectColor + horizonGlow + laserLine) * vignetteMask * uBrightness;

        float alpha = max(max(composedColor.r, composedColor.g), composedColor.b);

        vec3 normalizedColor = composedColor / max(alpha, 0.001);

        alpha = smoothstep(0.0, 1.0, alpha);

        gl_FragColor = vec4(normalizedColor, alpha);
      }
    `,u=new l.ShaderMaterial({vertexShader:i,fragmentShader:s,uniforms:{uTime:{value:0},uResolution:{value:new l.Vector2(1,1)},uColor:{value:new l.Vector3(0,0,0)},uHorizonColor:{value:new l.Vector3(0,0,0)},uHaloColor:{value:new l.Vector3(0,0,0)},uRiseSpeed:{value:0},uRiseScale:{value:0},uRiseIntensity:{value:0},uFlowSpeed:{value:0},uFlowDensity:{value:0},uFlowIntensity:{value:0},uHorizonIntensity:{value:0},uHaloIntensity:{value:0},uHorizonHeight:{value:0},uCircleScale:{value:0},uScale:{value:0},uBrightness:{value:0}},transparent:!0});I.current=u;let c=new l.PlaneGeometry(2,2),d=new l.Mesh(c,u);t.add(d);let f=()=>{if(!o||!n||!u)return;let e=o.getBoundingClientRect(),t=e.width,a=e.height;n.setSize(t,a),u.uniforms.uResolution.value.set(t,a)};f();let v=new ResizeObserver(f);v.observe(o);let m=new l.Clock,p=()=>{let o=m.getElapsedTime();I.current&&(I.current.uniforms.uTime.value=o),n.render(t,a),e=requestAnimationFrame(p)};return p(),()=>{cancelAnimationFrame(e),v.disconnect(),n.dispose(),c.dispose(),u.dispose(),o.contains(n.domElement)&&o.removeChild(n.domElement)}},[]),(0,t.useEffect)(()=>{if(!I.current)return;let e=I.current.uniforms;e.uColor.value=n(i),e.uHorizonColor.value=n(s),e.uHaloColor.value=n(u),e.uRiseSpeed.value=c,e.uRiseScale.value=d,e.uRiseIntensity.value=f,e.uFlowSpeed.value=v,e.uFlowDensity.value=m,e.uFlowIntensity.value=p,e.uHorizonIntensity.value=h,e.uHaloIntensity.value=w,e.uHorizonHeight.value=C,e.uCircleScale.value=y,e.uScale.value=g,e.uBrightness.value=R},[i,s,u,c,d,f,v,m,p,h,w,C,y,g,R]),(0,o.jsx)("div",{ref:x,className:(0,a.cn)("absolute inset-0",e)})};e.s(["RisingLines",0,i,"default",0,i])}]);