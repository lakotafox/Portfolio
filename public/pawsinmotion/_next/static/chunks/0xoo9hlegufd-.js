(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,98771,e=>{"use strict";var t=e.i(41929),i=e.i(49456),n=e.i(99057),o=e.i(46308),r=e.i(63617);let l=({width:e="100%",height:l="100%",speed:s=1,color:a="#ffffff",density:u=15,brightness:c=1,starSize:d=.1,focalDepth:f=.05,turbulence:m=0,autoPlay:v=!0,className:p,children:h})=>{let g=(0,i.useRef)(null),y=(0,i.useRef)(0),w=(0,i.useRef)(0),C=(0,i.useRef)(!v);(0,i.useEffect)(()=>{let e;if(!g.current)return;let t=g.current,i=(e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(a))?{r:parseInt(e[1],16)/255,g:parseInt(e[2],16)/255,b:parseInt(e[3],16)/255}:{r:1,g:1,b:1},r=t.getBoundingClientRect(),l=r.width,v=r.height,p=new n.WebGLRenderer({antialias:!0,alpha:!0,powerPreference:"high-performance"});p.setClearColor(0,0);let h=Math.min(window.devicePixelRatio,2);p.setSize(l,v,!1),p.setPixelRatio(h),p.domElement.style.width="100%",p.domElement.style.height="100%",p.domElement.style.display="block",t.appendChild(p.domElement);let b=new o.Scene,P=new o.OrthographicCamera(-1,1,1,-1,0,1),T={iTime:{value:0},iResolution:{value:new o.Vector3(l*h,v*h,1)},uColor:{value:new o.Vector3(i.r,i.g,i.b)},uDensity:{value:u},uBrightness:{value:c},uStarSize:{value:d},uFocalDepth:{value:f},uTurbulence:{value:m}},R=`
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,S=`
      uniform float iTime;
      uniform vec3 iResolution;
      uniform vec3 uColor;
      uniform float uDensity;
      uniform float uBrightness;
      uniform float uStarSize;
      uniform float uFocalDepth;
      uniform float uTurbulence;

      void main() {
        vec2 screenPos = gl_FragCoord.xy;
        vec2 centerOffset = screenPos - (iResolution.xy * 0.5);
        vec2 normalizedCoords = centerOffset / iResolution.y;

        vec3 viewDirection = normalize(vec3(normalizedCoords, uFocalDepth));

        vec3 travelOffset = vec3(0.0, 0.0, iTime);
        vec3 spacePosition = (viewDirection * uDensity) + travelOffset;

        if (uTurbulence > 0.0) {
          spacePosition.x += sin(spacePosition.z * 0.5 + iTime) * uTurbulence;
          spacePosition.y += cos(spacePosition.z * 0.3 + iTime * 0.7) * uTurbulence;
        }

        vec3 gridCell = floor(spacePosition);
        vec3 cellOffset = fract(spacePosition);

        vec3 hashVector = vec3(2.154, -6.21, 0.42);
        vec3 starPosition = fract(cross(gridCell, hashVector));
        starPosition = (starPosition * 0.5) + 0.25;

        float distToStar = distance(cellOffset, starPosition);

        float intensityFalloff = uStarSize - distToStar;
        float starIntensity = max(0.0, intensityFalloff * 10.0 * uBrightness);

        starIntensity = starIntensity * starIntensity;

        if (starIntensity < 0.01) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          return;
        }

        vec3 finalColor = uColor * starIntensity;

        gl_FragColor = vec4(finalColor, starIntensity);
      }
    `,z=new o.ShaderMaterial({uniforms:T,vertexShader:R,fragmentShader:S,transparent:!0,blending:o.CustomBlending,blendEquation:o.AddEquation,blendSrc:o.OneFactor,blendDst:o.OneMinusSrcAlphaFactor,depthTest:!1,depthWrite:!1,premultipliedAlpha:!0}),x=new o.PlaneGeometry(2,2),E=new o.Mesh(x,z);b.add(E),w.current=performance.now();let F=()=>{if(y.current=requestAnimationFrame(F),!C.current){let e=(performance.now()-w.current)/1e3;T.iTime.value=e*s}p.render(b,P)};F();let O=()=>{let e=t.getBoundingClientRect(),i=e.width,n=e.height;p.setSize(i,n,!1),T.iResolution.value.set(i*h,n*h,1)};return window.addEventListener("resize",O),()=>{window.removeEventListener("resize",O),cancelAnimationFrame(y.current),b.remove(E),x.dispose(),z.dispose(),p.dispose(),p.domElement&&p.domElement.parentNode===t&&t.removeChild(p.domElement)}},[s,a,u,c,d,f,m,v]);let b="number"==typeof e?`${e}px`:e,P="number"==typeof l?`${l}px`:l;return(0,t.jsxs)("div",{className:(0,r.cn)("relative overflow-hidden",p),style:{width:b,height:P},children:[(0,t.jsx)("div",{ref:g,className:"absolute inset-0"}),h&&(0,t.jsx)("div",{className:"relative z-10 w-full h-full pointer-events-none",children:h})]})};l.displayName="GlitterWarp",e.s(["default",0,l])}]);