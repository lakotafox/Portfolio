import{D as z,v as h,w as q,z as U}from"./main-z8ycv9rf.js";import{E as g,J as m,L as b}from"./main-shjzg9mc.js";var J=g(m(),1);if(typeof document<"u"){let K=document.createElement("style");K.dataset.src="mercury-flow/MercuryFlow.css",K.textContent=`.liquidChrome-container {
  width: 100%;
  height: 100%;
}
`,document.head.appendChild(K)}var I=({baseColor:K=[0.1,0.1,0.1],speed:P=0.2,amplitude:F=0.3,frequencyX:H=3,frequencyY:S=3,interactive:Z=!0,paused:O=!1,...M})=>{let _=J.useRef(null),W=J.useRef(O);W.current=O;let $=J.useRef(null);return J.useEffect(()=>{if(!_.current)return;let w=_.current,k=new q({antialias:!0}),A=k.gl;A.clearColor(1,1,1,1);let y=`
      attribute vec2 position;
      attribute vec2 uv;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,R=`
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
    `,v=new z(A),N=new h(A,{vertex:y,fragment:R,uniforms:{uTime:{value:0},uResolution:{value:new Float32Array([A.canvas.width,A.canvas.height,A.canvas.width/A.canvas.height])},uBaseColor:{value:new Float32Array(K)},uAmplitude:{value:F},uFrequencyX:{value:H},uFrequencyY:{value:S},uMouse:{value:new Float32Array([0,0])}}}),f=new U(A,{geometry:v,program:N}),j=-1,T=-1;function Q(){j=w.offsetWidth,T=w.offsetHeight,k.setSize(w.offsetWidth*1,w.offsetHeight*1);let B=N.uniforms.uResolution.value;B[0]=A.canvas.width,B[1]=A.canvas.height,B[2]=A.canvas.width/A.canvas.height}window.addEventListener("resize",Q),Q();function X(G){let B=w.getBoundingClientRect(),L=(G.clientX-B.left)/B.width,E=1-(G.clientY-B.top)/B.height,V=N.uniforms.uMouse.value;V[0]=L,V[1]=E}function Y(G){if(G.touches.length>0){let B=G.touches[0],L=w.getBoundingClientRect(),E=(B.clientX-L.left)/L.width,V=1-(B.clientY-L.top)/L.height,x=N.uniforms.uMouse.value;x[0]=E,x[1]=V}}if(Z)w.addEventListener("mousemove",X),w.addEventListener("touchmove",Y);let D=0;function C(G){D=requestAnimationFrame(C),N.uniforms.uTime.value=G*0.001*P,k.render({scene:f})}if($.current={pause(){cancelAnimationFrame(D),D=0},resume(){if(D)return;if(w.offsetWidth!==j||w.offsetHeight!==T)Q();D=requestAnimationFrame(C)}},!W.current)D=requestAnimationFrame(C);return w.appendChild(A.canvas),()=>{if(cancelAnimationFrame(D),D=0,$.current=null,window.removeEventListener("resize",Q),Z)w.removeEventListener("mousemove",X),w.removeEventListener("touchmove",Y);if(A.canvas.parentElement)A.canvas.parentElement.removeChild(A.canvas);A.getExtension("WEBGL_lose_context")?.loseContext()}},[K,P,F,H,S,Z]),J.useEffect(()=>{let w=$.current;if(w)(O?w.pause:w.resume)()},[O]),b("div",{ref:_,className:"liquidChrome-container",...M})};I.pausable=!0;var u=I;export{u as default,I as MercuryFlow};
