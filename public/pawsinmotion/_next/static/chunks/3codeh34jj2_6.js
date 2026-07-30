(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,12553,e=>{"use strict";var t=e.i(41929),o=e.i(49456),i=e.i(99057),a=e.i(46308),n=e.i(63617);let r=({width:e="100%",height:r="100%",speed:l=.5,color:c="#FFFFFF",backgroundColor:v="#8B5CF6",waveFrequency:s=.2,waveAmplitude:u=.3,distortion:f=1.5,chromaShift:g=.25,noiseLevel:d=.1,flatness:m=1,opacity:x=1,quality:y="high",className:z,children:h})=>{let p=(0,o.useRef)(null),P=(0,o.useRef)(0),w=(0,o.useRef)(0),C=(0,o.useCallback)(e=>{let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?{r:parseInt(t[1],16)/255,g:parseInt(t[2],16)/255,b:parseInt(t[3],16)/255}:{r:1,g:1,b:1}},[]),b=(0,o.useMemo)(()=>C(c),[c,C]),F=(0,o.useMemo)(()=>C(v),[v,C]);(0,o.useEffect)(()=>{if(!p.current)return;let e=p.current,t=e.getBoundingClientRect(),o=t.width,n=t.height,r=new i.WebGLRenderer({antialias:!0,alpha:!0,powerPreference:"high-performance"});r.setClearColor(0,0);let c=1;"low"===y?c=.5:"medium"===y?c=.75:"high"===y&&(c=1);let v=Math.min(window.devicePixelRatio*c,2);r.setSize(o,n,!1),r.setPixelRatio(v),r.domElement.style.width="100%",r.domElement.style.height="100%",r.domElement.style.display="block",e.appendChild(r.domElement);let z=new a.Scene,h=new a.OrthographicCamera(-1,1,1,-1,0,1),C={iTime:{value:0},iResolution:{value:new a.Vector3(o*v,n*v,1)},uColor:{value:new a.Vector3(b.r,b.g,b.b)},uBackgroundColor:{value:new a.Vector3(F.r,F.g,F.b)},uWaveFrequency:{value:Math.max(.1,Math.min(10,s))},uWaveAmplitude:{value:Math.max(.1,Math.min(5,u))},uDistortion:{value:Math.max(0,Math.min(2,f))},uChromaShift:{value:Math.max(0,Math.min(.5,g))},uNoiseLevel:{value:Math.max(0,Math.min(1,d))},uFlatness:{value:Math.max(0,Math.min(10,m))},uOpacity:{value:Math.max(0,Math.min(1,x))}},M=`
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,S=`
      precision mediump float;

      #define PI 3.1415926538

      uniform float iTime;
      uniform vec3 iResolution;
      uniform vec3 uColor;
      uniform vec3 uBackgroundColor;
      uniform float uWaveFrequency;
      uniform float uWaveAmplitude;
      uniform float uDistortion;
      uniform float uChromaShift;
      uniform float uNoiseLevel;
      uniform float uFlatness;
      uniform float uOpacity;

      vec4 permute(vec4 x) {
        return mod(((x * 34.0) + 1.0) * x, 289.0);
      }

      vec4 taylorInvSqrt(vec4 r) {
        return 1.79284291400159 - 0.85373472095314 * r;
      }

      vec3 fade(vec3 t) {
        return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
      }

      float cnoise(vec3 P) {
        vec3 Pi0 = floor(P);
        vec3 Pi1 = Pi0 + vec3(1.0);
        Pi0 = mod(Pi0, 289.0);
        Pi1 = mod(Pi1, 289.0);
        vec3 Pf0 = fract(P);
        vec3 Pf1 = Pf0 - vec3(1.0);
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;

        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);

        vec4 gx0 = ixy0 / 7.0;
        vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);

        vec4 gx1 = ixy1 / 7.0;
        vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);

        vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
        vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
        vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
        vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
        vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
        vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
        vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
        vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;

        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);

        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
        return 2.2 * n_xyz;
      }

      float flatSin(float x, float b) {
        float num = 1.0 + b * b;
        float den = 1.0 + b * b * cos(x) * cos(x);
        float y = sqrt(num / den) * cos(x);
        return y * 0.5 + 0.5;
      }

      float rand(vec2 co) {
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = fragCoord / iResolution.xy;
        vec2 center = vec2(0.5);
        vec2 delta = uv - center;
        float dist = length(delta);

        float timeScale = 0.1;
        float timeDelay = uChromaShift * 0.08;
        float baseTime = iTime * timeScale;

        float bSquared = uFlatness * uFlatness;
        float num = 1.0 + bSquared;

        vec3 intensity;

        for (int i = 0; i < 3; i++) {
          float tOffset = float(i) * timeDelay;

          vec2 distortedUV = uv;
          float dx = cnoise(vec3(1.8 * uv, baseTime + tOffset)) * uDistortion;
          distortedUV.x += dx * 0.8;

          vec2 distortedDelta = distortedUV - center;
          float distortedDist = length(distortedDelta);
          float normalizedDist = 1.0 - distortedDist / 0.70710678;

          float x = uWaveFrequency * 100.0 * normalizedDist * uWaveAmplitude;
          float cosX = cos(x);
          float den = 1.0 + bSquared * cosX * cosX;
          float waveValue = sqrt(num / den) * cosX * 0.5 + 0.5;

          if (uNoiseLevel > 0.01) {
            float noise = rand(distortedUV * 1000.0);
            waveValue = waveValue * (1.0 - uNoiseLevel) + noise * uNoiseLevel;
          }

          intensity[i] = waveValue;
        }

        vec3 finalColor = mix(uBackgroundColor, uColor, intensity);

        float alpha = (intensity.r + intensity.g + intensity.b) * 0.333333 * uOpacity;

        fragColor = vec4(finalColor, alpha);
      }

      void main() {
        vec4 color = vec4(0.0);
        mainImage(color, gl_FragCoord.xy);
        gl_FragColor = color;
      }
    `,_=new a.ShaderMaterial({uniforms:C,vertexShader:M,fragmentShader:S,transparent:!0}),R=new a.PlaneGeometry(2,2),q=new a.Mesh(R,_);z.add(q),w.current=performance.now();let D=w.current,V=e=>{if(P.current=requestAnimationFrame(V),e-D<16)return;D=e;let t=(e-w.current)*.001*l;C.iTime.value=t,r.render(z,h)};P.current=requestAnimationFrame(V);let E=()=>{let t=e.getBoundingClientRect(),o=t.width,i=t.height;r.setSize(o,i,!1),C.iResolution.value.set(o*v,i*v,1)};return window.addEventListener("resize",E),()=>{window.removeEventListener("resize",E),cancelAnimationFrame(P.current),z.remove(q),R.dispose(),_.dispose(),r.dispose(),r.domElement&&r.domElement.parentNode===e&&e.removeChild(r.domElement)}},[l,s,u,f,g,d,m,x,y,b,F]);let M="number"==typeof e?`${e}px`:e,S="number"==typeof r?`${r}px`:r;return(0,t.jsxs)("div",{className:(0,n.cn)("relative overflow-hidden",z),style:{width:M,height:S},children:[(0,t.jsx)("div",{ref:p,className:"absolute inset-0"}),h&&(0,t.jsx)("div",{className:"relative z-10 w-full h-full pointer-events-none",children:h})]})};r.displayName="ChromaWaves",e.s(["default",0,r])}]);