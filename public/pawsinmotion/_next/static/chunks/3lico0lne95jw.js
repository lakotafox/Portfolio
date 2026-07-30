(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,42869,e=>{"use strict";var t=e.i(41929),o=e.i(49456),r=e.i(99057),n=e.i(46308),a=e.i(63617);e.s(["default",0,({width:e="100%",height:i="100%",speed:l=1,primaryColor:u="#FF5722",secondaryColor:s="#2196F3",tertiaryColor:c="#4CAF50",streakCount:d=128,stretchFactor:m=.05,intensity:f=1,interactionEnabled:v=!0,rotation:p=0,fadePower:h=2,opacity:C=1,quality:g="medium",maxFPS:w=60,pauseWhenOffscreen:R=!0,className:x,children:y})=>{let F=(0,o.useRef)(null),S=(0,o.useRef)(0),b=(0,o.useRef)(0),E=(0,o.useRef)(0),k=(0,o.useRef)(!1),P=(0,o.useRef)(!0),V=(0,o.useRef)(0),I=(0,o.useRef)(0);(0,o.useEffect)(()=>{if(!F.current)return;let e=F.current,t=e=>{let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?{r:parseInt(t[1],16)/255,g:parseInt(t[2],16)/255,b:parseInt(t[3],16)/255}:{r:1,g:.4,b:.13}},o=t(u),a=t(s),i=t(c),x=e.getBoundingClientRect(),y=x.width,z=x.height,M={low:{pixelRatio:1,antialias:!1},medium:{pixelRatio:Math.min(window.devicePixelRatio,2),antialias:!0},high:{pixelRatio:Math.min(window.devicePixelRatio,3),antialias:!0}}[g],T=new r.WebGLRenderer({antialias:M.antialias,alpha:!0,powerPreference:"high-performance",stencil:!1,depth:!1});T.setClearColor(0,0);let L=M.pixelRatio;T.setSize(y,z,!1),T.setPixelRatio(L),T.domElement.style.width="100%",T.domElement.style.height="100%",T.domElement.style.display="block",e.appendChild(T.domElement);let O=new n.Scene,A=new n.OrthographicCamera(-1,1,1,-1,0,1),B={iTime:{value:0},iResolution:{value:new n.Vector2(y*L,z*L)},iMouse:{value:new n.Vector4(0,0,0,0)},uCompression:{value:0},uColor1:{value:new n.Vector3(o.r,o.g,o.b)},uColor2:{value:new n.Vector3(a.r,a.g,a.b)},uColor3:{value:new n.Vector3(i.r,i.g,i.b)},uStreakCount:{value:d},uStretchFactor:{value:m},uIntensity:{value:f},uSpeed:{value:l},uRotation:{value:p},uFadePower:{value:h},uOpacity:{value:C}},j=`
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,Y=`
      #define PI 3.14159265359

      uniform float iTime;
      uniform vec2 iResolution;
      uniform vec4 iMouse;
      uniform float uCompression;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform float uStreakCount;
      uniform float uStretchFactor;
      uniform float uIntensity;
      uniform float uSpeed;
      uniform float uRotation;
      uniform float uFadePower;
      uniform float uOpacity;

      float computeStreak(vec2 coord, float timeOffset) {
        coord.x = coord.x * uStreakCount;
        float horizontalPos = fract(coord.x);
        float columnIndex = floor(coord.x);

        coord.y *= uStretchFactor;

        float randomOffset = sin(columnIndex * 215.4);

        float speedVariation = cos(columnIndex * 33.1) * 0.3 + 0.7;

        float dynamicTrail = mix(95.0, 35.0, speedVariation);

        float animatedY = fract(coord.y + timeOffset * speedVariation + randomOffset);
        float streakValue = animatedY * dynamicTrail;

        streakValue = 1.0 / streakValue;
        streakValue = smoothstep(0.0, 1.0, streakValue * streakValue);
        streakValue = sin(streakValue * PI) * (speedVariation * 5.0);

        float horizontalFalloff = sin(horizontalPos * PI);

        return streakValue * (horizontalFalloff * horizontalFalloff);
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution) / iResolution.y;

        float distFromCenter = length(uv) + 0.1;

        float angle = atan(uv.x, uv.y) / PI + uRotation;
        float radius = 2.5 / distFromCenter;
        vec2 polarCoord = vec2(angle, radius);

        float compressionFactor = mix(1.0, 0.5, uCompression);
        polarCoord.y *= compressionFactor;

        float animTime = iTime * 0.4 * uSpeed;

        vec3 finalColor = vec3(0.0);
        finalColor += uColor1 * computeStreak(polarCoord, animTime);
        finalColor += uColor2 * computeStreak(polarCoord, animTime + 0.33);
        finalColor += uColor3 * computeStreak(polarCoord, animTime + 0.66);

        finalColor *= uIntensity;
        float distanceFade = pow(distFromCenter, uFadePower);
        finalColor *= distanceFade;

        finalColor *= uOpacity;

        float alpha = max(max(finalColor.r, finalColor.g), finalColor.b);
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,$=new n.ShaderMaterial({uniforms:B,vertexShader:j,fragmentShader:Y,transparent:!0,blending:n.AdditiveBlending}),_=new n.PlaneGeometry(2,2),q=new n.Mesh(_,$);O.add(q);let G=t=>{let o=e.getBoundingClientRect();B.iMouse.value.x=t.clientX-o.left,B.iMouse.value.y=z-(t.clientY-o.top)},K=()=>{k.current=!0,V.current=1,B.iMouse.value.z=1},N=()=>{k.current=!1,V.current=0,B.iMouse.value.z=0},U=t=>{if(t.touches.length>0){let o=t.touches[0],r=e.getBoundingClientRect();B.iMouse.value.x=o.clientX-r.left,B.iMouse.value.y=z-(o.clientY-r.top),V.current=1,B.iMouse.value.z=1}},X=()=>{V.current=0,B.iMouse.value.z=0};v&&(e.addEventListener("mousemove",G),e.addEventListener("mousedown",K),e.addEventListener("mouseup",N),e.addEventListener("touchstart",U),e.addEventListener("touchend",X));let W=null;R&&(W=new IntersectionObserver(e=>{P.current=e[0].isIntersecting},{threshold:0})).observe(e);let D=1e3/w,H=e=>{S.current=requestAnimationFrame(H),b.current||(b.current=e,E.current=e);let t=e-E.current;t<D||(E.current=e-t%D,(!R||P.current)&&(B.iTime.value=(e-b.current)*.001,I.current+=(V.current-I.current)*4*(.001*t),B.uCompression.value=I.current,B.uColor1.value.set(o.r,o.g,o.b),B.uColor2.value.set(a.r,a.g,a.b),B.uColor3.value.set(i.r,i.g,i.b),B.uStreakCount.value=d,B.uStretchFactor.value=m,B.uIntensity.value=f,B.uSpeed.value=l,B.uRotation.value=p,B.uFadePower.value=h,B.uOpacity.value=C,T.render(O,A)))};S.current=requestAnimationFrame(H);let J=()=>{let t=e.getBoundingClientRect(),o=t.width,r=t.height;T.setSize(o,r,!1),B.iResolution.value.set(o*L,r*L)};return window.addEventListener("resize",J),()=>{window.removeEventListener("resize",J),S.current&&cancelAnimationFrame(S.current),v&&(e.removeEventListener("mousemove",G),e.removeEventListener("mousedown",K),e.removeEventListener("mouseup",N),e.removeEventListener("touchstart",U),e.removeEventListener("touchend",X)),W&&W.disconnect(),_.dispose(),$.dispose(),T.dispose(),e.contains(T.domElement)&&e.removeChild(T.domElement)}},[u,s,c,d,m,f,l,p,h,C,v,g,w,R]);let z="number"==typeof e?`${e}px`:e,M="number"==typeof i?`${i}px`:i;return(0,t.jsx)("div",{ref:F,className:(0,a.cn)("relative overflow-hidden",x),style:{width:z,height:M},children:y&&(0,t.jsx)("div",{className:"pointer-events-none absolute inset-0 z-10 flex items-center justify-center",children:y})})}])}]);