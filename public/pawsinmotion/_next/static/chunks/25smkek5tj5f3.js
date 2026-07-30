(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,92668,e=>{"use strict";var o=e.i(41929),t=e.i(49456),r=e.i(99057),a=e.i(46308),i=e.i(63617);let l=({width:e="100%",height:l="100%",speed:n=.7,color1:s="#ffffff",color2:f="#000000",color3:c="#000000",backgroundColor:u="#ffffff",iterations:d=4,position:v="bottom",overallOpacity:g=1,waveSize:m=5,edgeSoftness:h=0,scale:x=1.1,quality:p="high",distortionType:C="plasma",distortionScale:w=.2,chromaShift:y=0,enableCursorInteraction:R=!0,refractionStrength:O=25,refractionEdgeWidth:S=.5,refractionWaveSpeed:I=1.5,refractionWaveFrequency:E=10,fresnelIntensity:W=.5,edgeHighlight:M=.5,className:b,children:P})=>{let L=(0,t.useRef)(null),D=(0,t.useRef)(null),F=(0,t.useRef)({x:.5,y:.5,targetX:.5,targetY:.5}),z=(0,t.useRef)({speed:n,color1:s,color2:f,color3:c,backgroundColor:u,iterations:d,position:v,overallOpacity:g,waveSize:m,edgeSoftness:h,scale:x,quality:p,distortionType:C,distortionScale:w,chromaShift:y,enableCursorInteraction:R,refractionStrength:O,refractionEdgeWidth:S,refractionWaveSpeed:I,refractionWaveFrequency:E,fresnelIntensity:W,edgeHighlight:M});return(0,t.useEffect)(()=>{z.current={speed:n,color1:s,color2:f,color3:c,backgroundColor:u,iterations:d,position:v,overallOpacity:g,waveSize:m,edgeSoftness:h,scale:x,quality:p,distortionType:C,distortionScale:w,chromaShift:y,enableCursorInteraction:R,refractionStrength:O,refractionEdgeWidth:S,refractionWaveSpeed:I,refractionWaveFrequency:E,fresnelIntensity:W,edgeHighlight:M}},[n,s,f,c,u,d,v,g,m,h,x,p,C,w,y,R,O,S,I,E,W,M]),(0,t.useEffect)(()=>{let e;if(!L.current||!D.current)return;let o=L.current,t=D.current,i=e=>{if(!z.current.enableCursorInteraction)return;let t=o.getBoundingClientRect();F.current.targetX=(e.clientX-t.left)/t.width,F.current.targetY=1-(e.clientY-t.top)/t.height},l=()=>{F.current.targetX=.5,F.current.targetY=.5};o.addEventListener("mousemove",i),o.addEventListener("mouseleave",l);let n=new r.WebGLRenderer({canvas:t,antialias:!1,alpha:!0,powerPreference:"high-performance"});n.setClearColor(0,0);let v=new a.Scene,p=new a.OrthographicCamera(-1,1,1,-1,0,1),b={iTime:{value:0},iResolution:{value:new a.Vector3(1,1,1)},uColor1:{value:new a.Color(s)},uColor2:{value:new a.Color(f)},uColor3:{value:new a.Color(c)},uBackgroundColor:{value:new a.Color(u)},uIterations:{value:d},uOffset:{value:new a.Vector2(0,0)},uOverallOpacity:{value:g},uWaveSize:{value:m},uEdgeSoftness:{value:h},uScale:{value:x},uDistortionType:{value:+("plasma"===C)},uDistortionScale:{value:w},uChromaShift:{value:y},uMouse:{value:new a.Vector2(.5,.5)},uEnableCursor:{value:+!!R},uRefractionStrength:{value:O},uRefractionEdgeWidth:{value:S},uRefractionWaveSpeed:{value:I},uRefractionWaveFrequency:{value:E},uFresnelIntensity:{value:W},uEdgeHighlight:{value:M}},P=`
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,k=`
      precision highp float;

      uniform float iTime;
      uniform vec3 iResolution;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform vec3 uBackgroundColor;
      uniform int uIterations;
      uniform vec2 uOffset;
      uniform float uOverallOpacity;
      uniform float uWaveSize;
      uniform float uEdgeSoftness;
      uniform float uScale;
      uniform int uDistortionType;
      uniform float uDistortionScale;
      uniform float uChromaShift;
      uniform vec2 uMouse;
      uniform float uEnableCursor;
      uniform float uRefractionStrength;
      uniform float uRefractionEdgeWidth;
      uniform float uRefractionWaveSpeed;
      uniform float uRefractionWaveFrequency;
      uniform float uFresnelIntensity;
      uniform float uEdgeHighlight;

      #define PI 3.14159265359

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(23.43, 54.12))) * 43758.5453);
      }

      vec3 hash3D(vec3 value) {
        vec3 scaled = value * 34.0 + 1.0;
        return mod(scaled * value, 289.0);
      }

      float simplexNoise(vec2 coord) {
        const vec4 skewConstants = vec4(
          0.211324865405187,
          0.366025403784439,
          -0.577350269189626,
          0.024390243902439
        );

        vec2 skewedCoord = coord + dot(coord, skewConstants.yy);
        vec2 cellOrigin = floor(skewedCoord);
        vec2 offset0 = coord - cellOrigin + dot(cellOrigin, skewConstants.xx);

        vec2 cornerOffset = (offset0.x > offset0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

        vec4 offsets = offset0.xyxy + skewConstants.xxzz;
        offsets.xy -= cornerOffset;

        cellOrigin = mod(cellOrigin, 289.0);

        vec3 gradientIdx = hash3D(
          hash3D(cellOrigin.y + vec3(0.0, cornerOffset.y, 1.0)) +
          cellOrigin.x + vec3(0.0, cornerOffset.x, 1.0)
        );

        vec3 weights = max(
          0.5 - vec3(
            dot(offset0, offset0),
            dot(offsets.xy, offsets.xy),
            dot(offsets.zw, offsets.zw)
          ),
          0.0
        );
        weights = weights * weights;
        weights = weights * weights;

        vec3 gradX = 2.0 * fract(gradientIdx * skewConstants.www) - 1.0;
        vec3 gradY = abs(gradX) - 0.5;
        vec3 roundedX = floor(gradX + 0.5);
        vec3 finalGradX = gradX - roundedX;

        weights *= 1.79284291400159 - 0.85373472095314 * (finalGradX * finalGradX + gradY * gradY);

        vec3 gradients;
        gradients.x = finalGradX.x * offset0.x + gradY.x * offset0.y;
        gradients.yz = finalGradX.yz * offsets.xz + gradY.yz * offsets.yw;

        return 130.0 * dot(weights, gradients);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float satinLiquid(vec2 coord, float direction, float ringIdx) {
        float n = 0.0;
        vec2 p = coord;
        float ringAngle = hash(vec2(ringIdx, 42.0)) * PI * 2.0;
        float t = iTime * 0.3 * direction;

        float cs = cos(ringAngle);
        float sn = sin(ringAngle);
        p = mat2(cs, -sn, sn, cs) * p;

        float n1 = noise(p * 1.5 + t * 0.2);
        p = p * 0.65 + vec2(n1 * 0.5);
        n += noise(p + t * 0.15) * 2.0;

        float n2 = noise(p * 1.2 + t * 0.15);
        p = p * 0.65 + vec2(n2 * 0.3, -n2 * 0.3);
        n += noise(p + t * 0.1) * 1.5;

        return n;
      }

      float plasma(vec2 coord, float direction, float ringIdx) {
        float ringAngle = hash(vec2(ringIdx, 123.0)) * PI * 2.0;
        float cs = cos(ringAngle);
        float sn = sin(ringAngle);
        coord = mat2(cs, -sn, sn, cs) * coord;

        float t = iTime * 0.3 * direction;
        vec2 scaledUV = coord * 0.5;

        float s1 = simplexNoise(scaledUV + t * 0.2);
        float s2 = simplexNoise(scaledUV * 1.5 + t * 0.15 + s1 * 0.15);

        float result = s1 + s2 * 0.7;
        return result * 1.4;
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 coord = 12.0 * (fragCoord.xy - iResolution.xy * 0.5) / min(iResolution.x, iResolution.y);
        coord = coord / uScale - uOffset * 6.0;

        float coordLen = length(coord);
        vec2 radialDir = coord / max(coordLen, 0.001);

        float adjustedFreq = 1.5 / max(0.1, uScale);
        float ringPhase = coordLen * adjustedFreq + PI;
        float circle = sin(ringPhase);

        float ringIdx = floor((ringPhase - PI) / PI);

        vec2 refractionOffset = vec2(0.0);
        float edgeGlow = 0.0;

        if (uRefractionStrength > 0.001) {
          float phaseInRing = mod(ringPhase, PI);

          float innerEdgeDist = phaseInRing / PI;
          float outerEdgeDist = 1.0 - innerEdgeDist;

          float edgeWidth = uRefractionEdgeWidth;

          if (innerEdgeDist < edgeWidth) {
            float t = 1.0 - innerEdgeDist / edgeWidth;
            float curve = t * t * t;
            float waveOffset = sin(coordLen * uRefractionWaveFrequency + iTime * uRefractionWaveSpeed) * 0.3;
            refractionOffset = -radialDir * curve * uRefractionStrength * 0.15 * (1.0 + waveOffset);
            edgeGlow = max(edgeGlow, curve);
          }

          if (outerEdgeDist < edgeWidth) {
            float t = 1.0 - outerEdgeDist / edgeWidth;
            float curve = t * t * t;
            float waveOffset = sin(coordLen * uRefractionWaveFrequency + iTime * uRefractionWaveSpeed + PI) * 0.3;
            refractionOffset = radialDir * curve * uRefractionStrength * 0.15 * (1.0 + waveOffset);
            edgeGlow = max(edgeGlow, curve);
          }
        }

        vec2 refractedCoord = coord + refractionOffset;
        float refractedLen = length(refractedCoord);

        float aaWidth = fwidth(ringPhase) * 0.5;
        float edgeRange = 0.1 + uEdgeSoftness * 0.3 + aaWidth;
        float edgeMin = 0.1 - aaWidth;
        float edgeMax = 0.1 + edgeRange;
        float circleMask = 1.0 - smoothstep(edgeMin, edgeMax, circle);
        float circleMask2 = smoothstep(edgeMin, edgeMax, circle);

        float maxPhase = (float(uIterations) + 1.0) * PI;
        float maxRadius = (maxPhase - PI) / adjustedFreq;
        float radiusAA = fwidth(coordLen) * 0.5;
        float distanceMask = 1.0 - smoothstep(maxRadius - 0.2 - radiusAA, maxRadius + radiusAA, coordLen);

        vec2 scaledCoord = refractedCoord * uDistortionScale;
        vec2 cursorOffset = vec2(0.0);
        if (uEnableCursor > 0.5) {
          cursorOffset = (uMouse - 0.5) * 2.0;
        }

        float dist1, dist2;

        if (uDistortionType == 0) {
          dist1 = satinLiquid(scaledCoord + cursorOffset, -1.0, ringIdx);
          dist2 = satinLiquid(scaledCoord + cursorOffset, 1.0, ringIdx);
        } else {
          dist1 = plasma(scaledCoord + cursorOffset, -1.0, ringIdx);
          dist2 = plasma(scaledCoord + cursorOffset, 1.0, ringIdx);
        }

        float fx = (dist1 * circleMask + dist2 * circleMask2) * uWaveSize;

        float fxX = dFdx(fx);
        float fxY = dFdy(fx);
        vec3 N = normalize(vec3(-fxX * 8.0, -fxY * 8.0, 0.3));
        vec3 L = normalize(vec3(0.4, 0.7, 1.0));
        vec3 V = normalize(vec3(0.6, 0.4, 1.0));
        vec3 H = normalize(L + V);

        float hn = max(dot(H, N), 0.0);
        float sheen = pow(hn, 12.0) * 0.6;
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.5) * 0.3;
        float lighting = sheen + fresnel;

        float colorMix1 = sin(fx * 0.5 + refractedLen * 0.3) * 0.5 + 0.5;
        float colorMix2 = cos(fx * 0.3 - refractedLen * 0.2 + iTime * 0.2) * 0.5 + 0.5;

        vec3 color = mix(uColor1, uColor2, colorMix1);
        color = mix(color, uColor3, colorMix2 * 0.6);

        color = mix(color, vec3(1.0), lighting * 0.4);

        if (uChromaShift > 0.01) {
          float chromaOffset = uChromaShift * 0.3;
          float mixR = sin((fx + chromaOffset) * 0.5 + refractedLen * 0.3) * 0.5 + 0.5;
          float mixB = cos((fx - chromaOffset) * 0.3 - refractedLen * 0.2) * 0.5 + 0.5;

          color.r = mix(color.r, mix(uColor1.r, uColor2.r, mixR), uChromaShift * 0.5);
          color.b = mix(color.b, mix(uColor2.b, uColor3.b, mixB), uChromaShift * 0.5);
        }

        if (uFresnelIntensity > 0.001) {
          float fresnelGlow = edgeGlow * uFresnelIntensity;
          vec3 glowColor = mix(uColor1, uColor2, 0.5);
          color += glowColor * fresnelGlow * 0.5;
        }

        if (uEdgeHighlight > 0.001) {
          color += vec3(1.0) * edgeGlow * uEdgeHighlight;
        }

        float alpha = uOverallOpacity * distanceMask;

        fragColor = vec4(color, alpha);
      }

      void main() {
        vec4 color = vec4(0.0);
        mainImage(color, gl_FragCoord.xy);
        gl_FragColor = color;
      }
    `,A=new a.ShaderMaterial({uniforms:b,vertexShader:P,fragmentShader:k,transparent:!0,blending:a.NormalBlending,depthWrite:!1}),X=new a.PlaneGeometry(2,2),G=new a.Mesh(X,A);v.add(G);let T=()=>{if(!o||!t)return;let{width:e,height:r}=o.getBoundingClientRect(),{quality:a,position:i}=z.current,l=1;"low"===a?l=.5:"medium"===a&&(l=.75);let s=Math.min(window.devicePixelRatio*l,2);n.setSize(e,r,!1),n.setPixelRatio(s),b.iResolution.value.set(e*s,r*s,1);let f=0,c=0;"top"===i?c=Math.max(1,r/e):"bottom"===i?c=-Math.max(1,r/e):"left"===i?f=-Math.max(1,e/r):"right"===i&&(f=Math.max(1,e/r)),b.uOffset.value.set(f,c)},q=new ResizeObserver(T);q.observe(o),T();let Y=performance.now(),B=Y,N=o=>{if(o-B<16){e=requestAnimationFrame(N);return}B=o;let{speed:t,color1:r,color2:a,color3:i,backgroundColor:l,iterations:s,overallOpacity:f,waveSize:c,edgeSoftness:u,scale:d,distortionType:g,distortionScale:m,chromaShift:h,enableCursorInteraction:x,refractionStrength:C,refractionEdgeWidth:w,refractionWaveSpeed:y,refractionWaveFrequency:R,fresnelIntensity:O,edgeHighlight:S}=z.current;F.current.x+=(F.current.targetX-F.current.x)*.05,F.current.y+=(F.current.targetY-F.current.y)*.05,b.iTime.value=(o-Y)*.001*t,b.uColor1.value.set(r),b.uColor2.value.set(a),b.uColor3.value.set(i),b.uBackgroundColor.value.set(l),b.uIterations.value=s,b.uOverallOpacity.value=f,b.uWaveSize.value=c,b.uEdgeSoftness.value=u,b.uScale.value=d,b.uDistortionType.value=+("lava"!==g),b.uDistortionScale.value=m,b.uChromaShift.value=h,b.uMouse.value.set(F.current.x,F.current.y),b.uEnableCursor.value=+!!x,b.uRefractionStrength.value=C,b.uRefractionEdgeWidth.value=w,b.uRefractionWaveSpeed.value=y,b.uRefractionWaveFrequency.value=R,b.uFresnelIntensity.value=O,b.uEdgeHighlight.value=S,n.render(v,p),e=requestAnimationFrame(N)};return e=requestAnimationFrame(N),()=>{cancelAnimationFrame(e),q.disconnect(),o.removeEventListener("mousemove",i),o.removeEventListener("mouseleave",l),v.remove(G),X.dispose(),A.dispose(),n.dispose()}},[p]),(0,o.jsxs)("div",{ref:L,className:(0,i.cn)("relative overflow-hidden",b),style:{width:"number"==typeof e?`${e}px`:e,height:"number"==typeof l?`${l}px`:l,backgroundColor:u},children:[(0,o.jsx)("canvas",{ref:D,className:"absolute inset-0 block w-full h-full"}),P&&(0,o.jsx)("div",{className:"relative z-10 w-full h-full pointer-events-none",children:P})]})};e.s(["RadialLiquid",0,l,"default",0,l])}]);