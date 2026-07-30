(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,36831,e=>{"use strict";var t=e.i(41929),a=e.i(49456),i=e.i(99057),o=e.i(46308),r=e.i(63617);let n=({width:e="100%",height:n=400,speed:l=.5,color:u="#FF9FFC",gridScale:s=1,lineThickness:d=1,antialiasQuality:c=64,autoPlay:v=!0,opacity:f=1,fadeSmoothness:m=1,perspective:p=0,gridLength:h=10,curve:g=0,bottomFade:y="#0a0a0a",className:C,children:w})=>{let R=(0,a.useRef)(null),x=(0,a.useRef)(0),b=(0,a.useRef)(0),A=(0,a.useRef)(!v);(0,a.useEffect)(()=>{let e;if(!R.current)return;let t=R.current,a=(e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(u))?{r:parseInt(e[1],16)/255,g:parseInt(e[2],16)/255,b:parseInt(e[3],16)/255}:{r:0,g:1,b:1},r=t.getBoundingClientRect(),n=r.width,v=r.height,y=new i.WebGLRenderer({antialias:!0,alpha:!0,powerPreference:"high-performance"});y.setClearColor(0,0);let C=Math.min(window.devicePixelRatio,2);y.setSize(n,v,!1),y.setPixelRatio(C),y.domElement.style.width="100%",y.domElement.style.height="100%",y.domElement.style.display="block",t.appendChild(y.domElement);let w=new o.Scene,P=new o.OrthographicCamera(-1,1,1,-1,0,1),F={iTime:{value:0},iResolution:{value:new o.Vector3(n*C,v*C,1)},uColor:{value:new o.Vector3(a.r,a.g,a.b)},uGridScale:{value:s},uLineThickness:{value:d},uAntialiasQuality:{value:c},uOpacity:{value:f},uFadeSmoothness:{value:m},uPerspective:{value:p},uGridLength:{value:h},uCurve:{value:g}},S=`
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,E=`
      uniform float iTime;
      uniform vec3 iResolution;
      uniform vec3 uColor;
      uniform float uGridScale;
      uniform float uLineThickness;
      uniform float uAntialiasQuality;
      uniform float uOpacity;
      uniform float uFadeSmoothness;
      uniform float uPerspective;
      uniform float uGridLength;
      uniform float uCurve;

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

        if (uv.y > 0.0) {
          fragColor = vec4(0.0);
          return;
        }

        uv.y = -uv.y;

        float perspectiveRad = radians(uPerspective);
        float cosP = cos(perspectiveRad);
        float sinP = sin(perspectiveRad);

        float uvYRotated = uv.y * cosP;
        float depthAdjust = uv.y * sinP;

        uvYRotated = max(uvYRotated, 0.001);

        float d = 1.0 / abs(uvYRotated);
        d = d * (1.0 + depthAdjust);

        d = min(d, uGridLength);

        vec2 pv = vec2(uv.x * d, d);

        if (uCurve > 0.0) {
          float curveAmount = uCurve * (1.0 - uvYRotated / 1.0);
          pv.x = pv.x + sign(pv.x) * pow(abs(pv.x), 1.0 + curveAmount * 0.3) * curveAmount * 0.2;
        }

        pv.y += iTime;
        pv *= uGridScale;

        vec2 grid = fract(pv);

        vec2 derivative = fwidth(pv);

        vec2 gridDist = min(grid, 1.0 - grid);

        vec2 aa = derivative * (1.0 + uLineThickness * 2.0);
        vec2 gridAA = smoothstep(aa, vec2(0.0), gridDist);

        float gridPattern = max(gridAA.x, gridAA.y);

        float fadeFactor = smoothstep(0.0, 0.4, uv.y) * smoothstep(uGridLength, 2.0, d);

        float alpha = gridPattern * fadeFactor * uOpacity;

        float cutoffMin = 0.15;
        float cutoffMax = 0.15 + (uFadeSmoothness);
        alpha = smoothstep(cutoffMin, cutoffMax, alpha);

        alpha = alpha * alpha;

        vec3 col = uColor * alpha;

        if (alpha < 0.05) {
          fragColor = vec4(0.0, 0.0, 0.0, 0.0);
        } else {
          fragColor = vec4(col, alpha);
        }
      }

      void main() {
        vec4 color = vec4(0.0);
        mainImage(color, gl_FragCoord.xy);
        gl_FragColor = color;
      }
    `,T=new o.ShaderMaterial({uniforms:F,vertexShader:S,fragmentShader:E,transparent:!0,blending:o.CustomBlending,blendEquation:o.AddEquation,blendSrc:o.OneFactor,blendDst:o.OneMinusSrcAlphaFactor,depthTest:!1,depthWrite:!1,premultipliedAlpha:!0}),G=new o.PlaneGeometry(2,2),L=new o.Mesh(G,T);w.add(L),b.current=performance.now();let M=()=>{if(x.current=requestAnimationFrame(M),!A.current){let e=(performance.now()-b.current)/1e3;F.iTime.value=e*l}y.render(w,P)};M();let O=()=>{let e=t.getBoundingClientRect(),a=e.width,i=e.height;y.setSize(a,i,!1),F.iResolution.value.set(a*C,i*C,1)};return window.addEventListener("resize",O),()=>{window.removeEventListener("resize",O),cancelAnimationFrame(x.current),w.remove(L),G.dispose(),T.dispose(),y.dispose(),y.domElement&&y.domElement.parentNode===t&&t.removeChild(y.domElement)}},[l,u,s,d,c,v,f,m,p,h,g]);let P="number"==typeof e?`${e}px`:e,F="number"==typeof n?`${n}px`:n;return(0,t.jsxs)("div",{className:(0,r.cn)("relative overflow-hidden",C),style:{width:P,height:F},children:[(0,t.jsx)("div",{ref:R,className:"absolute inset-0"}),y&&(0,t.jsx)("div",{className:"absolute bottom-0 left-0 right-0 h-[30%] pointer-events-none z-5",style:{background:`linear-gradient(to top, ${y}, transparent)`}}),w&&(0,t.jsx)("div",{className:"relative z-10 w-full h-full pointer-events-none",children:w})]})};n.displayName="PerspectiveGrid",e.s(["default",0,n])}]);