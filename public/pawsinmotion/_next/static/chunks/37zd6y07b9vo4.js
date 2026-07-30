(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,71704,e=>{"use strict";var o=e.i(41929),r=e.i(49456),i=e.i(99057),t=e.i(46308),l=e.i(63617);let a=({width:e="100%",height:a="100%",speed:n=1,variant:u="shader",videoSrc:c,color1:s="#FF0033",color2:d="#00FF66",color3:v="#0066FF",pixelSize:m=10,borderIntensity:f=.8,opacity:g=1,waveIntensity:p=1,waveWidth:x=1,quality:h="high",className:w,children:C})=>{let y=(0,r.useRef)(null),V=(0,r.useRef)(0),b=(0,r.useRef)(0),M=(0,r.useRef)(null),T=(0,r.useRef)(null),P=(0,r.useCallback)(e=>{let o=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return o?{r:parseInt(o[1],16)/255,g:parseInt(o[2],16)/255,b:parseInt(o[3],16)/255}:{r:1,g:0,b:.2}},[]),R=(0,r.useMemo)(()=>P(s),[s,P]),k=(0,r.useMemo)(()=>P(d),[d,P]),B=(0,r.useMemo)(()=>P(v),[v,P]);(0,r.useEffect)(()=>{if(!y.current)return;let e=y.current,o=e.getBoundingClientRect(),r=o.width,l=o.height,a=new i.WebGLRenderer({antialias:!1,alpha:!0,powerPreference:"high-performance"});a.setClearColor(0,0);let s=1;"low"===h?s=.5:"medium"===h?s=.75:"high"===h&&(s=1);let d=Math.min(window.devicePixelRatio*s,2);a.setSize(r,l,!1),a.setPixelRatio(d),a.domElement.style.width="100%",a.domElement.style.height="100%",a.domElement.style.display="block",e.appendChild(a.domElement);let v=new t.Scene,w=new t.OrthographicCamera(-1,1,1,-1,0,1),C=null;if("video"===u&&c){let e=document.createElement("video");e.src=c,e.crossOrigin="anonymous",e.loop=!0,e.muted=!0,e.playsInline=!0,e.play(),M.current=e,(C=new t.VideoTexture(e)).minFilter=t.LinearFilter,C.magFilter=t.LinearFilter,T.current=C}let P={iTime:{value:0},iResolution:{value:new t.Vector3(r*d,l*d,1)},uColor1:{value:new t.Vector3(R.r,R.g,R.b)},uColor2:{value:new t.Vector3(k.r,k.g,k.b)},uColor3:{value:new t.Vector3(B.r,B.g,B.b)},uPixelSize:{value:Math.max(1,Math.min(50,m))},uBorderIntensity:{value:Math.max(0,Math.min(1,f))},uOpacity:{value:Math.max(0,Math.min(1,g))},uWaveIntensity:{value:Math.max(0,Math.min(2,p))},uWaveWidth:{value:Math.max(.1,Math.min(5,x))},uVariant:{value:+("video"===u)},uVideoTexture:{value:C}},U=`
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,I=`
      precision mediump float;

      uniform float iTime;
      uniform vec3 iResolution;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform float uPixelSize;
      uniform float uBorderIntensity;
      uniform float uOpacity;
      uniform float uWaveIntensity;
      uniform float uWaveWidth;
      uniform int uVariant;
      uniform sampler2D uVideoTexture;

      float waveValue(in vec2 uv, float d, float offset) {
        return 1.0 - smoothstep(0.0, d, distance(uv.x, 0.5 + sin(offset + uv.y * 3.0) * 0.3));
      }

      vec4 waveBackground(vec2 uv, float offset) {
        vec2 centeredUV = uv;

        float aspect = iResolution.x / iResolution.y;
        if (aspect > 1.0) {
          centeredUV.x = (centeredUV.x - 0.5) * aspect + 0.5;
        } else {
          centeredUV.y = (centeredUV.y - 0.5) / aspect + 0.5;
        }

        float d = (0.05 + abs(sin(offset * 0.2)) * 0.25 * distance(centeredUV.y, 0.5)) * uWaveWidth;

        float r = waveValue(centeredUV + vec2(d * 0.25, 0.0), d, offset);
        float g = waveValue(centeredUV - vec2(0.015, 0.005), d, offset);
        float b = waveValue(centeredUV - vec2(d * 0.5, 0.015), d, offset);

        return vec4(r, g, b, 1.0);
      }

      vec4 pixelate(vec2 fragCoord, vec4 backgroundColor) {
        float pixelPrecision = 3.0;
        vec2 pixel = fragCoord - vec2(ivec2(fragCoord.xy) % int(uPixelSize));
        float precisePixel = floor(uPixelSize / pixelPrecision);

        vec4 color = vec4(0.0);

        for(float i = 0.0; i < pixelPrecision; i++) {
          vec2 sampleCoord = pixel + precisePixel * i;
          vec2 sampleUV = sampleCoord / iResolution.xy;

          vec4 sourceColor;

          if (uVariant == 1) {
            sourceColor = texture2D(uVideoTexture, sampleUV);
          } else {
            sourceColor = waveBackground(sampleUV, iTime) * 0.3 +
                         waveBackground(sampleUV + vec2(0.15, 0.0), -iTime * 2.0) * 0.3 +
                         waveBackground(sampleUV + vec2(0.3, 0.0), iTime * 3.3) * 0.3 +
                         waveBackground(sampleUV - vec2(0.2, 0.0), -iTime * 1.7) * 0.3 +
                         waveBackground(sampleUV - vec2(0.4, 0.0), iTime * 2.5) * 0.3;
          }

          color += sourceColor;
        }

        color = color / pixelPrecision;

        vec3 colorMix;
        float colorIntensity;

        if (uVariant == 1) {
          colorMix = color.rgb;
          colorIntensity = (color.r + color.g + color.b) / 3.0;
        } else {
          colorMix = color.r * uColor1 + color.g * uColor2 + color.b * uColor3;
          colorIntensity = (color.r + color.g + color.b) / 3.0;
          colorMix *= uWaveIntensity;
        }

        color = vec4(colorMix, colorIntensity);

        vec4 border = vec4(0.0);
        if ((int(fragCoord.y) % int(uPixelSize) == int(0)) ||
            (int(fragCoord.x) % int(uPixelSize) == int(0))) {
          color.rgb -= vec3(uBorderIntensity * 0.3);
        }

        return color;
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = fragCoord / iResolution.xy;

        vec4 background;

        if (uVariant == 1) {
          background = texture2D(uVideoTexture, uv);
        } else {
          background = waveBackground(uv, iTime) * 0.3 +
                      waveBackground(uv + vec2(0.15, 0.0), -iTime * 2.0) * 0.3 +
                      waveBackground(uv + vec2(0.3, 0.0), iTime * 3.3) * 0.3 +
                      waveBackground(uv - vec2(0.2, 0.0), -iTime * 1.7) * 0.3 +
                      waveBackground(uv - vec2(0.4, 0.0), iTime * 2.5) * 0.3;
        }

        vec4 mosaicColor = pixelate(fragCoord, background);

        fragColor = vec4(mosaicColor.rgb, mosaicColor.a * uOpacity);
      }

      void main() {
        vec4 color = vec4(0.0);
        mainImage(color, gl_FragCoord.xy);
        gl_FragColor = color;
      }
    `,F=new t.ShaderMaterial({uniforms:P,vertexShader:U,fragmentShader:I,transparent:!0}),z=new t.PlaneGeometry(2,2),E=new t.Mesh(z,F);v.add(E),b.current=performance.now();let S=b.current,W=e=>{if(V.current=requestAnimationFrame(W),e-S<16)return;S=e;let o=(e-b.current)*.001*n;P.iTime.value=o,a.render(v,w)};V.current=requestAnimationFrame(W);let O=()=>{let o=e.getBoundingClientRect(),r=o.width,i=o.height;a.setSize(r,i,!1),P.iResolution.value.set(r*d,i*d,1)};return window.addEventListener("resize",O),()=>{window.removeEventListener("resize",O),cancelAnimationFrame(V.current),v.remove(E),z.dispose(),F.dispose(),a.dispose(),a.domElement&&a.domElement.parentNode===e&&e.removeChild(a.domElement),M.current&&(M.current.pause(),M.current=null),T.current&&(T.current.dispose(),T.current=null)}},[n,u,c,m,f,g,p,x,h,R,k,B]);let U="number"==typeof e?`${e}px`:e,I="number"==typeof a?`${a}px`:a;return(0,o.jsxs)("div",{className:(0,l.cn)("relative overflow-hidden",w),style:{width:U,height:I},children:[(0,o.jsx)("div",{ref:y,className:"absolute inset-0"}),C&&(0,o.jsx)("div",{className:"relative z-10 w-full h-full pointer-events-none",children:C})]})};a.displayName="Mosaic",e.s(["default",0,a])}]);