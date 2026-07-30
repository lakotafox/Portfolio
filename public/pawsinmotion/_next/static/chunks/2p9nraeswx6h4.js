(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,62227,e=>{"use strict";var u=e.i(41929),n=e.i(49456),r=e.i(46308),l=e.i(99057),t=e.i(63617);let i=({centerX:e=.5,centerY:i=.5,speed:o=1,scale:a=1,intensity:c=.5,symmetric:s=!1,redInfluence:f=1,greenInfluence:v=1,blueInfluence:m=1,baseColor:d=0,opacity:y=1,className:p})=>{let h=(0,n.useRef)(null),C=(0,n.useRef)(null),R=(0,n.useRef)(null),S=(0,n.useRef)(null);return(0,n.useEffect)(()=>{if(!h.current)return;let u=h.current,n=u.clientWidth,t=u.clientHeight,p=new r.Scene,x=new r.OrthographicCamera(-1,1,1,-1,0,1),I=new l.WebGLRenderer({antialias:!1,alpha:!0});I.setClearColor(0,0),I.setSize(n,t),I.setPixelRatio(Math.min(window.devicePixelRatio,2)),u.appendChild(I.domElement),C.current=I;let g=new r.ShaderMaterial({uniforms:{uTime:{value:0},uResolution:{value:new r.Vector2(n,t)},uCenter:{value:new r.Vector2(e,i)},uSpeed:{value:.035*o},uScale:{value:.013/a},uIntensity:{value:c},uSymmetric:{value:+!!s},uRedInfluence:{value:f},uGreenInfluence:{value:v},uBlueInfluence:{value:m},uBaseColor:{value:d},uOpacity:{value:y}},vertexShader:`
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,fragmentShader:`
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uCenter;
        uniform float uSpeed;
        uniform float uScale;
        uniform float uIntensity;
        uniform float uSymmetric;
        uniform float uRedInfluence;
        uniform float uGreenInfluence;
        uniform float uBlueInfluence;
        uniform float uBaseColor;
        uniform float uOpacity;

        varying vec2 vUv;

        void main() {
          float invAr = uResolution.y / uResolution.x;

          vec3 col = vec3(uBaseColor) + vec3(
            vUv.x * uRedInfluence,
            vUv.y * uGreenInfluence,
            (1.0 - length(vUv - 0.5) * 1.4) * uBlueInfluence
          );

          float x = uCenter.x - vUv.x;
          float y = (uCenter.y - vUv.y) * invAr;

          float r;
          if (uSymmetric > 0.5) {
            r = -sqrt(x * x + y * y);
          } else {
            r = -(x * x + y * y);
          }

          float z = 1.0 + uIntensity * sin((r + uTime * uSpeed) / uScale);

          vec3 texcol = vec3(z, z, z);
          vec3 finalColor = col * texcol;

          gl_FragColor = vec4(finalColor, uOpacity);
        }
      `,transparent:!0});R.current=g;let w=new r.PlaneGeometry(2,2),B=new r.Mesh(w,g);p.add(B);let U=new r.Clock,T=()=>{let e=U.getElapsedTime();g.uniforms.uTime.value=e,I.render(p,x),S.current=requestAnimationFrame(T)};T();let O=new ResizeObserver(()=>{let e=u.clientWidth,n=u.clientHeight;I.setSize(e,n),g.uniforms.uResolution.value.set(e,n)});return O.observe(u),()=>{S.current&&cancelAnimationFrame(S.current),O.disconnect(),I.dispose(),w.dispose(),g.dispose(),u.contains(I.domElement)&&u.removeChild(I.domElement)}},[]),(0,n.useEffect)(()=>{R.current&&(R.current.uniforms.uCenter.value.set(e,i),R.current.uniforms.uSpeed.value=.035*o,R.current.uniforms.uScale.value=.013/a,R.current.uniforms.uIntensity.value=c,R.current.uniforms.uSymmetric.value=+!!s,R.current.uniforms.uRedInfluence.value=f,R.current.uniforms.uGreenInfluence.value=v,R.current.uniforms.uBlueInfluence.value=m,R.current.uniforms.uBaseColor.value=d,R.current.uniforms.uOpacity.value=y)},[e,i,o,a,c,s,f,v,m,d,y]),(0,u.jsx)("div",{ref:h,className:(0,t.cn)("w-full h-full",p),style:{minHeight:"inherit"}})};i.displayName="ColorLoops",e.s(["default",0,i])}]);