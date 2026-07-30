(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,97834,e=>{"use strict";var t=e.i(41929),o=e.i(49456),l=e.i(99057),r=e.i(46308),a=e.i(63617);e.s(["default",0,({width:e="100%",height:i="100%",speed:n=1,intensity:u=1,scale:c=6,downScale:s=.5,primaryColor:d="#5227FF",secondaryColor:f="#5227FF",tertiaryColor:p="#0a0a0a",opacity:v=1,quality:m="medium",maxFPS:y=60,pauseWhenOffscreen:h=!0,className:C,children:g})=>{let w=(0,o.useRef)(null),x=(0,o.useRef)(0),R=(0,o.useRef)(0),B=(0,o.useRef)(0),O=(0,o.useRef)(!0);(0,o.useEffect)(()=>{if(!w.current)return;let e=w.current,t=e=>{let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?{r:parseInt(t[1],16)/255,g:parseInt(t[2],16)/255,b:parseInt(t[3],16)/255}:{r:0,g:0,b:0}},o=t(d),a=t(f),i=t(p),C=e.getBoundingClientRect(),g=C.width,b=C.height,S={low:{pixelRatio:1,antialias:!1},medium:{pixelRatio:Math.min(window.devicePixelRatio,2),antialias:!0},high:{pixelRatio:Math.min(window.devicePixelRatio,3),antialias:!0}}[m],F=new l.WebGLRenderer({antialias:S.antialias,alpha:!0,powerPreference:"high-performance",stencil:!1,depth:!1});F.setClearColor(0,0);let T=S.pixelRatio;F.setSize(g,b,!1),F.setPixelRatio(T),F.domElement.style.width="100%",F.domElement.style.height="100%",F.domElement.style.display="block",e.appendChild(F.domElement);let I=new r.Scene,A=new r.OrthographicCamera(-1,1,1,-1,0,1),P={iTime:{value:0},iResolution:{value:new r.Vector2(g*T,b*T)},uSpeed:{value:n},uIntensity:{value:u},uScale:{value:c},uDownScale:{value:s},uOpacity:{value:v},uColor1:{value:new r.Vector3(o.r,o.g,o.b)},uColor2:{value:new r.Vector3(a.r,a.g,a.b)},uColor3:{value:new r.Vector3(i.r,i.g,i.b)}},V=`
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,E=`
      #define COLOR_COUNT 3

      uniform float iTime;
      uniform vec2 iResolution;
      uniform float uSpeed;
      uniform float uIntensity;
      uniform float uScale;
      uniform float uDownScale;
      uniform float uOpacity;

      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;

      vec3 colors[COLOR_COUNT];

      void setupColorPalette() {
        colors[0] = uColor1;
        colors[1] = uColor2;
        colors[2] = uColor3;
      }

      float Bayer2(vec2 a) {
        a = floor(a);
        return fract(a.x / 2.0 + a.y * a.y * 0.75);
      }

      #define Bayer4(a)   (Bayer2(0.5 * (a)) * 0.25 + Bayer2(a))
      #define Bayer8(a)   (Bayer4(0.5 * (a)) * 0.25 + Bayer2(a))
      #define Bayer16(a)  (Bayer8(0.5 * (a)) * 0.25 + Bayer2(a))
      #define Bayer32(a)  (Bayer16(0.5 * (a)) * 0.25 + Bayer2(a))
      #define Bayer64(a)  (Bayer32(0.5 * (a)) * 0.25 + Bayer2(a))

      vec3 applyDitheredColor(float value, vec2 pixelCoord) {
        float paletteIndex = clamp(value, 0.0, 1.0) * float(COLOR_COUNT - 1);

        vec3 colorA = vec3(0.0);
        vec3 colorB = vec3(0.0);

        for (int i = 0; i < COLOR_COUNT; i++) {
          if (float(i) == floor(paletteIndex)) {
            colorA = colors[i];
            if (i < COLOR_COUNT - 1) {
              colorB = colors[i + 1];
            } else {
              colorB = colorA;
            }
            break;
          }
        }

        float ditherValue = Bayer64(pixelCoord * 0.25);

        float blendAmount = float(fract(paletteIndex) > ditherValue);

        return mix(colorA, colorB, blendAmount);
      }

      float flowField(vec2 p, float t) {
        return sin(p.x + sin(p.y + t * 0.1)) * sin(p.y * p.x * 0.1 + t * 0.2);
      }

      vec2 computeField(vec2 p, float t) {
        vec2 ep = vec2(0.05, 0.0);
        vec2 result = vec2(0.0);

        for (int i = 0; i < 20; i++) {
          float t0 = flowField(p, t);
          float t1 = flowField(p + ep.xy, t);
          float t2 = flowField(p + ep.yx, t);
          vec2 gradient = vec2((t1 - t0), (t2 - t0)) / ep.xx;
          vec2 tangent = vec2(-gradient.y, gradient.x);

          p += tangent * 0.5 + gradient * 0.005;
          p.x += sin(t * 0.25) * 0.1;
          p.y += cos(t * 0.25) * 0.1;
          result = gradient;
        }

        return result;
      }

      void main() {
        setupColorPalette();

        vec2 uv = gl_FragCoord.xy / iResolution.xy - 0.5;
        uv.x *= iResolution.x / iResolution.y;
        float animTime = iTime * uSpeed;

        vec2 p = uv * uScale;

        vec2 field = computeField(p, animTime);

        float colorValue = length(field) * uIntensity;
        colorValue = clamp(colorValue, 0.0, 1.0);

        vec3 finalColor = applyDitheredColor(colorValue, gl_FragCoord.xy / uDownScale);

        gl_FragColor = vec4(finalColor, uOpacity);
      }
    `,_=new r.ShaderMaterial({uniforms:P,vertexShader:V,fragmentShader:E,transparent:!0}),L=new r.PlaneGeometry(2,2),N=new r.Mesh(L,_);I.add(N);let U=null;h&&(U=new IntersectionObserver(e=>{O.current=e[0].isIntersecting},{threshold:0})).observe(e);let D=1e3/y,z=e=>{x.current=requestAnimationFrame(z),R.current||(R.current=e,B.current=e);let t=e-B.current;t<D||(B.current=e-t%D,(!h||O.current)&&(P.iTime.value=(e-R.current)*.001,P.uSpeed.value=n,P.uIntensity.value=u,P.uScale.value=c,P.uDownScale.value=s,P.uOpacity.value=v,F.render(I,A)))};x.current=requestAnimationFrame(z);let j=()=>{let t=e.getBoundingClientRect(),o=t.width,l=t.height;F.setSize(o,l,!1),P.iResolution.value.set(o*T,l*T)};return window.addEventListener("resize",j),()=>{window.removeEventListener("resize",j),x.current&&cancelAnimationFrame(x.current),U&&U.disconnect(),L.dispose(),_.dispose(),F.dispose(),e.contains(F.domElement)&&e.removeChild(F.domElement)}},[n,u,c,s,d,f,p,v,m,y,h]);let b="number"==typeof e?`${e}px`:e,S="number"==typeof i?`${i}px`:i;return(0,t.jsx)("div",{ref:w,className:(0,a.cn)("relative overflow-hidden",C),style:{width:b,height:S},children:g&&(0,t.jsx)("div",{className:"pointer-events-none absolute inset-0 z-10 flex items-center justify-center",children:g})})}])}]);