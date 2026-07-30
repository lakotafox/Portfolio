(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,71553,e=>{"use strict";var o=e.i(41929),t=e.i(49456),r=e.i(99057),a=e.i(46308),i=e.i(63617);let n=({width:e="100%",height:n="100%",speed:l=1,color1:s="#00ff88",color2:d="#0088ff",frequency:c=1,intensity:f=1,complexity:u=1,opacity:m=1,transparent:v=!0,backgroundColor:g="#000000",className:h,children:p})=>{let w=(0,t.useRef)(null),x=(0,t.useRef)(0),C=(0,t.useRef)(0);(0,t.useEffect)(()=>{if(!w.current)return;let e=w.current,o=e=>{let o=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return o?{r:parseInt(o[1],16)/255,g:parseInt(o[2],16)/255,b:parseInt(o[3],16)/255}:{r:0,g:1,b:1}},t=o(s),i=o(d),n=o(g),h=e.getBoundingClientRect(),p=h.width,y=h.height,b=new r.WebGLRenderer({antialias:!0,alpha:!0,powerPreference:"high-performance",stencil:!1,depth:!1});b.setClearColor(0,0);let O=Math.min(window.devicePixelRatio,2);b.setSize(p,y,!1),b.setPixelRatio(O),b.domElement.style.width="100%",b.domElement.style.height="100%",b.domElement.style.display="block",e.appendChild(b.domElement);let N=new a.Scene,R=new a.OrthographicCamera(-1,1,1,-1,0,1),S={iTime:{value:0},iResolution:{value:new a.Vector3(p*O,y*O,1)},uColor1:{value:new a.Vector3(t.r,t.g,t.b)},uColor2:{value:new a.Vector3(i.r,i.g,i.b)},uBackgroundColor:{value:new a.Vector3(n.r,n.g,n.b)},uTransparent:{value:+!!v},uFrequency:{value:c},uIntensity:{value:f},uComplexity:{value:u},uOpacity:{value:m}},z=`
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,E=`
      uniform float iTime;
      uniform vec3 iResolution;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uBackgroundColor;
      uniform float uTransparent;
      uniform float uFrequency;
      uniform float uIntensity;
      uniform float uComplexity;
      uniform float uOpacity;

      vec3 hash3D(vec3 value) {
        vec3 scaled = value * 34.0 + 1.0;
        return mod(scaled * value, 289.0);
      }

      float generateNoise(vec2 coord) {
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

      void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;

        vec2 scaledUV = uv * uFrequency;
        float t = iTime;

        float innerNoise = generateNoise(scaledUV + t * 0.25);

        float middleNoise = generateNoise(scaledUV + innerNoise * 0.1 * uComplexity);

        float s1 = generateNoise(scaledUV + t * 0.5 + middleNoise);

        float s2 = generateNoise(scaledUV + s1);

        s1 *= uIntensity;
        s2 *= uIntensity;

        float sharpS1 = sign(s1) * pow(abs(s1), 0.8);
        float sharpS2 = sign(s2) * pow(abs(s2), 0.8);

        vec3 mixedColor = mix(uColor1, uColor2, (sharpS2 + 1.0) * 0.5);
        mixedColor = mix(mixedColor, uColor1, (sharpS1 + 1.0) * 0.3);

        mixedColor = pow(mixedColor, vec3(0.9));

        float alpha = (abs(sharpS1) + abs(sharpS2)) * 0.5 * uOpacity;
        alpha = pow(alpha, 0.85);
        alpha = clamp(alpha, 0.0, 1.0);

        if (uTransparent > 0.5) {
          if (alpha < 0.05) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            return;
          }
          gl_FragColor = vec4(mixedColor * alpha, alpha);
        } else {
          vec3 finalColor = mix(uBackgroundColor, mixedColor, alpha);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      }
    `,T=new a.ShaderMaterial({uniforms:S,vertexShader:z,fragmentShader:E,transparent:!0,blending:a.CustomBlending,blendEquation:a.AddEquation,blendSrc:a.OneFactor,blendDst:a.OneMinusSrcAlphaFactor,depthTest:!1,depthWrite:!1,premultipliedAlpha:!0}),k=new a.PlaneGeometry(2,2),F=new a.Mesh(k,T);N.add(F),C.current=performance.now();let X=()=>{x.current=requestAnimationFrame(X);let e=(performance.now()-C.current)/1e3;S.iTime.value=e*l,b.render(N,R)};X();let I=()=>{let o=e.getBoundingClientRect(),t=o.width,r=o.height;b.setSize(t,r,!1),S.iResolution.value.set(t*O,r*O,1)};return window.addEventListener("resize",I),()=>{window.removeEventListener("resize",I),cancelAnimationFrame(x.current),N.remove(F),k.dispose(),T.dispose(),b.dispose(),b.domElement&&b.domElement.parentNode===e&&e.removeChild(b.domElement)}},[l,s,d,c,f,u,m,v,g]);let y="number"==typeof e?`${e}px`:e,b="number"==typeof n?`${n}px`:n;return(0,o.jsxs)("div",{className:(0,i.cn)("relative overflow-hidden",h),style:{width:y,height:b},children:[(0,o.jsx)("div",{ref:w,className:"absolute inset-0"}),p&&(0,o.jsx)("div",{className:"relative z-10 w-full h-full pointer-events-none",children:p})]})};n.displayName="ShaderWaves",e.s(["default",0,n])}]);