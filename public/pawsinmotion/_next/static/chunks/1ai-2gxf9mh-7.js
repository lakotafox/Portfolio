(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,1578,e=>{"use strict";var t=e.i(41929),u=e.i(49456),r=e.i(26881),n=e.i(36048),i=e.i(81484),o=e.i(46308),l=e.i(63617);let a=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,s=`
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform sampler2D uFontTexture;
  uniform float uCharCount;
  uniform vec3 uColor;
  uniform bool uInvert;
  uniform float uScale;
  uniform float uSize;
  uniform float uSpeed;
  uniform float uHasMouse;
  uniform float uIntensity;
  uniform float uInteractIntensity;
  uniform float uWaveTension;
  uniform float uWaveTwist;
  uniform sampler2D uVideoTexture;
  uniform bool uHasVideo;

  varying vec2 vUv;

  #define PI 3.14159265359
  #define TAU 6.28318530718

  float flowField(vec2 p, float t) {
    return sin(p.x + sin(p.y + t * 0.1)) * sin(p.y * p.x * 0.1 + t * 0.2);
  }

  vec2 computeField(vec2 p, float t) {
    vec2 ep = vec2(0.05, 0.0);
    vec2 result = vec2(0.0);
    float tension = uWaveTension;
    float twist = uWaveTwist;

    for (int i = 0; i < 20; i++) {
      float t0 = flowField(p, t);
      float t1 = flowField(p + ep.xy, t);
      float t2 = flowField(p + ep.yx, t);
      vec2 gradient = vec2((t1 - t0), (t2 - t0)) / ep.xx;
      vec2 tangent = vec2(-gradient.y, gradient.x);

      p += tangent * tension + gradient * 0.005;
      p.x += sin(t * 0.25) * twist;
      p.y += cos(t * 0.25) * twist;
      result = gradient;
    }

    return result;
  }

  vec3 getDistortion(vec2 coord) {
      vec2 aspect;

      if(uResolution.x > uResolution.y) {
          aspect = vec2(uResolution.x / uResolution.y, 1.0);
      } else {
          aspect = vec2(uResolution.y / uResolution.x, 1.0);
      }

      vec2 uv0 = coord.xy / uResolution.xy * aspect;
      vec2 muv = uMouse.xy / uResolution.xy * aspect;

      float speed = uSpeed;
      float noiseTime = uTime * speed;

      vec2 diff = uv0 - muv;
      float distance = length(diff);

      float radius = 0.5;
      float interaction = smoothstep(radius, 0.0, distance);

      vec2 p = uv0 * uScale;
      float interactStrength = uInteractIntensity * uHasMouse;

      vec2 mouseDistort = normalize(diff) * interaction * interactStrength;
      p += mouseDistort;
      p.x += sin(uTime * 3.0) * interaction * interactStrength * 0.5;
      p.y += cos(uTime * 3.0) * interaction * interactStrength * 0.5;

      vec2 field = computeField(p, noiseTime);

      float val = length(field) * uIntensity;
      val = clamp(val, 0.0, 1.0);

      vec2 totalDisplacement = mouseDistort + field * 0.5 * uIntensity;

      return vec3(val, totalDisplacement);
  }

  void main() {
      float gridSize = uSize;

      vec2 pix = vUv * uResolution;
      vec2 snappedMuv = floor(pix / gridSize) * gridSize;

      vec3 distData = getDistortion(snappedMuv);
      float intensity = distData.x;
      vec2 displacement = distData.yz;

      vec3 col;
      if (uHasVideo) {
        vec2 videoUV = snappedMuv / uResolution;
        vec2 distortedVideoUV = videoUV + (displacement * 0.1);

        col = texture2D(uVideoTexture, distortedVideoUV).rgb;
      } else {
        col = vec3(intensity);
      }

      float gray = 0.3 * col.r + 0.59 * col.g + 0.11 * col.b;

      if (uInvert) {
        gray = 1.0 - gray;
      }

      float charIndex = floor(gray * (uCharCount - 1.0));
      charIndex = clamp(charIndex, 0.0, uCharCount - 1.0);

      vec2 cellUV = fract(pix / gridSize);

      float charWidth = 1.0 / uCharCount;
      vec2 atlasUV = vec2((cellUV.x * charWidth) + (charIndex * charWidth), cellUV.y);

      vec4 fontSample = texture2D(uFontTexture, atlasUV);
      float alpha = fontSample.a;

      vec3 targetColor = uHasVideo ? col : uColor * (gray + 0.1);
      vec3 finalColor = targetColor * alpha;

      gl_FragColor = vec4(finalColor, alpha);
  }
`,c=({mouse:e,characters:r,color:l,invert:c,scale:v,size:f,speed:d,hasMouse:m,intensity:p,interactionIntensity:h,waveTension:g,waveTwist:x,videoUrl:y})=>{let T=(0,u.useRef)(null),w=(0,u.useRef)(null),{size:C,viewport:V}=(0,i.useThree)(),S=r.length>0?r:" ",I=(0,u.useRef)(null),R=(0,u.useRef)(null),F=(0,u.useMemo)(()=>({uTime:{value:0},uMouse:{value:new o.Vector2(0,0)},uResolution:{value:new o.Vector2(C.width,C.height)},uFontTexture:{value:null},uCharCount:{value:S.length},uColor:{value:new o.Color(l)},uInvert:{value:c},uScale:{value:v},uSize:{value:f},uSpeed:{value:d},uHasMouse:{value:+!!m},uIntensity:{value:p},uInteractIntensity:{value:h},uWaveTension:{value:g},uWaveTwist:{value:x},uVideoTexture:{value:null},uHasVideo:{value:!1}}),[]);return(0,u.useEffect)(()=>{let e=((e,t=64)=>{let u=document.createElement("canvas"),r=u.getContext("2d");if(!r)return new o.Texture;let n=e.length,i=n*t;u.width=i,u.height=t,r.clearRect(0,0,i,t),r.font=`bold ${t}px monospace`,r.fillStyle="white",r.textAlign="center",r.textBaseline="middle";for(let u=0;u<n;u++){let n=e[u],i=u*t+t/2,o=t/2;r.fillText(n,i,o)}let l=new o.CanvasTexture(u);return l.minFilter=o.LinearFilter,l.magFilter=o.LinearFilter,l.needsUpdate=!0,l})(S);return e.wrapS=e.wrapT=o.ClampToEdgeWrapping,I.current=e,()=>{e.dispose(),I.current=null}},[S]),(0,u.useEffect)(()=>{if(!y){R.current=null;return}let e=document.createElement("video");e.src=y,e.crossOrigin="Anonymous",e.loop=!0,e.muted=!0,e.playsInline=!0,e.play().catch(e=>console.error("Video play failed",e));let t=new o.VideoTexture(e);return t.minFilter=o.LinearFilter,t.magFilter=o.LinearFilter,R.current=t,()=>{e.pause(),e.src="",t.dispose(),R.current=null}},[y]),(0,n.useFrame)(t=>{w.current&&(w.current.uniforms.uTime.value=t.clock.elapsedTime,w.current.uniforms.uResolution.value.set(C.width,C.height),w.current.uniforms.uColor.value.set(l),w.current.uniforms.uInvert.value=c,w.current.uniforms.uScale.value=v,w.current.uniforms.uSize.value=f,w.current.uniforms.uSpeed.value=d,w.current.uniforms.uHasMouse.value=+!!m,w.current.uniforms.uIntensity.value=p,w.current.uniforms.uInteractIntensity.value=h,w.current.uniforms.uWaveTension.value=g,w.current.uniforms.uWaveTwist.value=x,w.current.uniforms.uCharCount.value=S.length,I.current&&(w.current.uniforms.uFontTexture.value=I.current),R.current?(w.current.uniforms.uVideoTexture.value=R.current,w.current.uniforms.uHasVideo.value=!0):(w.current.uniforms.uVideoTexture.value=null,w.current.uniforms.uHasVideo.value=!1),e.current&&w.current.uniforms.uMouse.value.lerp(e.current,.1))}),(0,t.jsxs)("mesh",{ref:T,children:[(0,t.jsx)("planeGeometry",{args:[V.width,V.height]}),(0,t.jsx)("shaderMaterial",{ref:w,vertexShader:a,fragmentShader:s,uniforms:F,transparent:!0})]})};e.s(["default",0,({characters:e=" .:-+*=%@#",color:n="#ffffff",invert:i=!1,noiseScale:a=2,elementSize:s=16,speed:v=1,hasCursorInteraction:f=!0,intensity:d=1,interactionIntensity:m=1,waveTension:p=.5,waveTwist:h=.1,className:g="",videoUrl:x})=>{let y=(0,u.useRef)(new o.Vector2(0,0));return(0,t.jsx)("div",{className:(0,l.cn)("relative h-full w-full cursor-text overflow-hidden",g),onMouseMove:e=>{let t=e.currentTarget.getBoundingClientRect(),u=e.clientX-t.left,r=t.height-(e.clientY-t.top);y.current.set(u,r)},children:(0,t.jsx)(r.Canvas,{orthographic:!0,camera:{position:[0,0,1],zoom:1},gl:{alpha:!0,antialias:!0},children:(0,t.jsx)(c,{mouse:y,characters:e,color:n,invert:i,scale:a,size:s,speed:v,hasMouse:f,intensity:d,interactionIntensity:m,waveTension:p,waveTwist:h,videoUrl:x})})})}])}]);