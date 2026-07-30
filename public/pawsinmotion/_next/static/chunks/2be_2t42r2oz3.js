(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,38094,e=>{"use strict";var t=e.i(41929),o=e.i(49456),n=e.i(99057),i=e.i(46308),a=e.i(63617);let r=({width:e="100%",height:r="100%",speed:l=.3,color:s="#5227FF",columnCount:u=64,stretch:c=.25,trailLength:d=50,rotationSpeed:m=1,rotation:f=90,intensity:h=1,thickness:v=.25,enableRotation:p=!1,transparent:g=!0,quality:R="medium",maxFPS:C=120,pauseWhenOffscreen:w=!0,className:x,children:T})=>{let P=(0,o.useRef)(null),b=(0,o.useRef)(0),F=(0,o.useRef)(0),y=(0,o.useRef)(0),A=(0,o.useRef)(!0);(0,o.useEffect)(()=>{let e;if(!P.current)return;let t=P.current,o=(e=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(s))?{r:parseInt(e[1],16)/255,g:parseInt(e[2],16)/255,b:parseInt(e[3],16)/255}:{r:.33,g:.95,b:.43},a=t.getBoundingClientRect(),r=a.width,x=a.height,T={low:{pixelRatio:1,antialias:!1},medium:{pixelRatio:Math.min(window.devicePixelRatio,2),antialias:!0},high:{pixelRatio:Math.min(window.devicePixelRatio,3),antialias:!0}}[R],I=new n.WebGLRenderer({antialias:T.antialias,alpha:!0,powerPreference:"high-performance",stencil:!1,depth:!1});I.setClearColor(0,0);let E=T.pixelRatio;I.setSize(r,x,!1),I.setPixelRatio(E),I.domElement.style.width="100%",I.domElement.style.height="100%",I.domElement.style.display="block",t.appendChild(I.domElement);let z=new i.Scene,L=new i.OrthographicCamera(-1,1,1,-1,0,1),S={iTime:{value:0},iResolution:{value:new i.Vector2(r*E,x*E)},uColor:{value:new i.Vector3(o.r,o.g,o.b)},uColumnCount:{value:u},uStretch:{value:c},uTrailLength:{value:d},uRotationSpeed:{value:m},uRotation:{value:f*Math.PI/180},uIntensity:{value:h},uThickness:{value:v},uEnableRotation:{value:+!!p},uTransparent:{value:+!!g}},M=`
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,O=`
      uniform float iTime;
      uniform vec2 iResolution;
      uniform vec3 uColor;
      uniform float uColumnCount;
      uniform float uStretch;
      uniform float uTrailLength;
      uniform float uRotationSpeed;
      uniform float uRotation;
      uniform float uIntensity;
      uniform float uThickness;
      uniform float uEnableRotation;
      uniform float uTransparent;

      const float TWO_PI = 6.28318530718;
      const float HALF_PI = 1.57079632679;

      mat2 createRotationMatrix(float angle) {
        float cosA = cos(angle);
        float sinA = sin(angle);
        return mat2(cosA, sinA, -sinA, cosA);
      }

      void main() {
        vec2 coord = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;

        float distanceFromCenter = length(coord * 0.2);

        if (uEnableRotation > 0.5) {
          float rotationAngle = distanceFromCenter + fract(iTime * 0.025 * uRotationSpeed) * TWO_PI;
          coord *= createRotationMatrix(rotationAngle);
        } else if (abs(uRotation) > 0.001) {
          float rotationAngle = distanceFromCenter + uRotation;
          coord *= createRotationMatrix(rotationAngle);
        } else {
          coord *= createRotationMatrix(distanceFromCenter);
        }

        coord.x *= uColumnCount;
        float columnFraction = fract(coord.x);
        float columnIndex = floor(coord.x);

        float animTime = iTime * 0.4;

        coord.y *= uStretch;

        float randomOffset = sin(columnIndex * 215.4);

        float speedVariation = cos(columnIndex * 33.1) * 0.3 + 0.7;

        float dynamicTrail = mix(uTrailLength * 1.5, uTrailLength * 0.5, speedVariation);

        float verticalPos = fract(coord.y + animTime * speedVariation + randomOffset) * dynamicTrail;

        verticalPos = 1.0 / verticalPos;

        verticalPos = smoothstep(0.0, 1.0, verticalPos * verticalPos);

        verticalPos = sin(verticalPos * HALF_PI * 2.0) * (speedVariation * 5.0);

        float horizontalFade = sin(columnFraction * HALF_PI * 2.0);
        horizontalFade = pow(horizontalFade, 1.0 / max(uThickness, 0.1));
        verticalPos *= horizontalFade * horizontalFade;

        vec3 finalColor = uColor * verticalPos * uIntensity;

        if (uTransparent > 0.5) {
          float alpha = max(max(finalColor.r, finalColor.g), finalColor.b);
          gl_FragColor = vec4(finalColor, alpha);
        } else {
          gl_FragColor = vec4(finalColor, 1.0);
        }
      }
    `,_=new i.ShaderMaterial({uniforms:S,vertexShader:M,fragmentShader:O,transparent:!0,blending:i.AdditiveBlending,depthTest:!1,depthWrite:!1}),V=new i.PlaneGeometry(2,2),B=new i.Mesh(V,_);z.add(B);let N=null;w&&(N=new IntersectionObserver(e=>{A.current=e[0].isIntersecting},{threshold:0})).observe(t),F.current=performance.now(),y.current=performance.now();let j=()=>{if(b.current=requestAnimationFrame(j),w&&!A.current)return;let e=performance.now(),t=1e3/C;if(e-y.current<t)return;y.current=e;let o=(e-F.current)/1e3;S.iTime.value=o*l,I.render(z,L)};j();let k=()=>{let e=t.getBoundingClientRect(),o=e.width,n=e.height;I.setSize(o,n,!1),S.iResolution.value.set(o*E,n*E)};window.addEventListener("resize",k);let W=new ResizeObserver(()=>k());return W.observe(t),()=>{window.removeEventListener("resize",k),W.disconnect(),N&&N.disconnect(),cancelAnimationFrame(b.current),z.remove(B),V.dispose(),_.dispose(),I.dispose(),I.domElement&&I.domElement.parentNode===t&&t.removeChild(I.domElement)}},[l,s,u,c,d,m,f,h,v,p,g,R,C,w]);let I="number"==typeof e?`${e}px`:e,E="number"==typeof r?`${r}px`:r;return(0,t.jsxs)("div",{className:(0,a.cn)("relative overflow-hidden",x),style:{width:I,height:E},children:[(0,t.jsx)("div",{ref:P,className:"absolute inset-0"}),T&&(0,t.jsx)("div",{className:"relative z-10 w-full h-full pointer-events-none",children:T})]})};r.displayName="LightDroplets",e.s(["default",0,r])}]);