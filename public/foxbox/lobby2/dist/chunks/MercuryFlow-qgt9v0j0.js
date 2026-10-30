import{B as A,t as R,u as M,x as E}from"./main-mznb6j68.js";import{C as X,H as Y,J as T}from"./main-csjpdy0q.js";var a=X(Y(),1);if(typeof document<"u"){let i=document.createElement("style");i.dataset.src="mercury-flow/MercuryFlow.css",i.textContent=`.liquidChrome-container {
  width: 100%;
  height: 100%;
}
`,document.head.appendChild(i)}var _=({baseColor:i=[0.1,0.1,0.1],speed:h=0.2,amplitude:g=0.3,frequencyX:p=3,frequencyY:y=3,interactive:c=!0,...q})=>{let l=a.useRef(null);return a.useEffect(()=>{if(!l.current)return;let t=l.current,v=new M({antialias:!0}),e=v.gl;e.clearColor(1,1,1,1);let L=`
      attribute vec2 position;
      attribute vec2 uv;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,U=`
      precision highp float;
      uniform float uTime;
      uniform vec3 uResolution;
      uniform vec3 uBaseColor;
      uniform float uAmplitude;
      uniform float uFrequencyX;
      uniform float uFrequencyY;
      uniform vec2 uMouse;
      varying vec2 vUv;

      vec4 renderImage(vec2 uvCoord) {
          vec2 fragCoord = uvCoord * uResolution.xy;
          vec2 uv = (2.0 * fragCoord - uResolution.xy) / min(uResolution.x, uResolution.y);

          for (float i = 1.0; i < 10.0; i++){
              uv.x += uAmplitude / i * cos(i * uFrequencyX * uv.y + uTime + uMouse.x * 3.14159);
              uv.y += uAmplitude / i * cos(i * uFrequencyY * uv.x + uTime + uMouse.y * 3.14159);
          }

          vec2 diff = (uvCoord - uMouse);
          float dist = length(diff);
          float falloff = exp(-dist * 20.0);
          float ripple = sin(10.0 * dist - uTime * 2.0) * 0.03;
          uv += (diff / (dist + 0.0001)) * ripple * falloff;

          vec3 color = uBaseColor / abs(sin(uTime - uv.y - uv.x));
          return vec4(color, 1.0);
      }

      void main() {
          vec4 col = vec4(0.0);
          int samples = 0;
          for (int i = -1; i <= 1; i++){
              for (int j = -1; j <= 1; j++){
                  vec2 offset = vec2(float(i), float(j)) * (1.0 / min(uResolution.x, uResolution.y));
                  col += renderImage(vUv + offset);
                  samples++;
              }
          }
          gl_FragColor = col / float(samples);
      }
    `,B=new A(e),r=new R(e,{vertex:L,fragment:U,uniforms:{uTime:{value:0},uResolution:{value:new Float32Array([e.canvas.width,e.canvas.height,e.canvas.width/e.canvas.height])},uBaseColor:{value:new Float32Array(i)},uAmplitude:{value:g},uFrequencyX:{value:p},uFrequencyY:{value:y},uMouse:{value:new Float32Array([0,0])}}}),z=new E(e,{geometry:B,program:r});function f(){v.setSize(t.offsetWidth*1,t.offsetHeight*1);let o=r.uniforms.uResolution.value;o[0]=e.canvas.width,o[1]=e.canvas.height,o[2]=e.canvas.width/e.canvas.height}window.addEventListener("resize",f),f();function w(n){let o=t.getBoundingClientRect(),u=(n.clientX-o.left)/o.width,d=1-(n.clientY-o.top)/o.height,s=r.uniforms.uMouse.value;s[0]=u,s[1]=d}function C(n){if(n.touches.length>0){let o=n.touches[0],u=t.getBoundingClientRect(),d=(o.clientX-u.left)/u.width,s=1-(o.clientY-u.top)/u.height,F=r.uniforms.uMouse.value;F[0]=d,F[1]=s}}if(c)t.addEventListener("mousemove",w),t.addEventListener("touchmove",C);let m;function x(n){m=requestAnimationFrame(x),r.uniforms.uTime.value=n*0.001*h,v.render({scene:z})}return m=requestAnimationFrame(x),t.appendChild(e.canvas),()=>{if(cancelAnimationFrame(m),window.removeEventListener("resize",f),c)t.removeEventListener("mousemove",w),t.removeEventListener("touchmove",C);if(e.canvas.parentElement)e.canvas.parentElement.removeChild(e.canvas);e.getExtension("WEBGL_lose_context")?.loseContext()}},[i,h,g,p,y,c]),T("div",{ref:l,className:"liquidChrome-container",...q})},j=_;export{j as default,_ as MercuryFlow};
