import{D as d,t as X,v as f,w as v,z as i}from"./main-z8ycv9rf.js";import{E as l,J as a,L as b}from"./main-shjzg9mc.js";var W=l(a(),1);if(typeof document<"u"){let F=document.createElement("style");F.dataset.src="aura-sphere/AuraSphere.css",F.textContent=`.aura-sphere-container {
  position: relative;
  z-index: 0;
  width: 100%;
  height: 100%;
}
`,document.head.appendChild(F)}function p({hue:F=0,hoverIntensity:K=0.2,rotateOnHover:J=!0,forceHoverState:U=!1,backgroundColor:Q="#000000",paused:N=!1}){let j=W.useRef(null),P=W.useRef(N);P.current=N;let D=W.useRef(null),L=`
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `,Y=`
    precision highp float;

    uniform float iTime;
    uniform vec3 iResolution;
    uniform float hue;
    uniform float hover;
    uniform float rot;
    uniform float hoverIntensity;
    uniform vec3 backgroundColor;
    varying vec2 vUv;

    vec3 rgb2yiq(vec3 c) {
      float y = dot(c, vec3(0.299, 0.587, 0.114));
      float i = dot(c, vec3(0.596, -0.274, -0.322));
      float q = dot(c, vec3(0.211, -0.523, 0.312));
      return vec3(y, i, q);
    }
    
    vec3 yiq2rgb(vec3 c) {
      float r = c.x + 0.956 * c.y + 0.621 * c.z;
      float g = c.x - 0.272 * c.y - 0.647 * c.z;
      float b = c.x - 1.106 * c.y + 1.703 * c.z;
      return vec3(r, g, b);
    }
    
    vec3 adjustHue(vec3 color, float hueDeg) {
      float hueRad = hueDeg * 3.14159265 / 180.0;
      vec3 yiq = rgb2yiq(color);
      float cosA = cos(hueRad);
      float sinA = sin(hueRad);
      float i = yiq.y * cosA - yiq.z * sinA;
      float q = yiq.y * sinA + yiq.z * cosA;
      yiq.y = i;
      yiq.z = q;
      return yiq2rgb(yiq);
    }

    vec3 hash33(vec3 p3) {
      p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
      p3 += dot(p3, p3.yxz + 19.19);
      return -1.0 + 2.0 * fract(vec3(
        p3.x + p3.y,
        p3.x + p3.z,
        p3.y + p3.z
      ) * p3.zyx);
    }

    float snoise3(vec3 p) {
      const float K1 = 0.333333333;
      const float K2 = 0.166666667;
      vec3 i = floor(p + (p.x + p.y + p.z) * K1);
      vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
      vec3 e = step(vec3(0.0), d0 - d0.yzx);
      vec3 i1 = e * (1.0 - e.zxy);
      vec3 i2 = 1.0 - e.zxy * (1.0 - e);
      vec3 d1 = d0 - (i1 - K2);
      vec3 d2 = d0 - (i2 - K1);
      vec3 d3 = d0 - 0.5;
      vec4 h = max(0.6 - vec4(
        dot(d0, d0),
        dot(d1, d1),
        dot(d2, d2),
        dot(d3, d3)
      ), 0.0);
      vec4 n = h * h * h * h * vec4(
        dot(d0, hash33(i)),
        dot(d1, hash33(i + i1)),
        dot(d2, hash33(i + i2)),
        dot(d3, hash33(i + 1.0))
      );
      return dot(vec4(31.316), n);
    }

    vec4 extractAlpha(vec3 colorIn) {
      float a = max(max(colorIn.r, colorIn.g), colorIn.b);
      return vec4(colorIn.rgb / (a + 1e-5), a);
    }

    const vec3 baseColor1 = vec3(0.611765, 0.262745, 0.996078);
    const vec3 baseColor2 = vec3(0.298039, 0.760784, 0.913725);
    const vec3 baseColor3 = vec3(0.062745, 0.078431, 0.600000);
    const float innerRadius = 0.6;
    const float noiseScale = 0.65;

    float light1(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * attenuation);
    }
    float light2(float intensity, float attenuation, float dist) {
      return intensity / (1.0 + dist * dist * attenuation);
    }

    vec4 draw(vec2 uv) {
      vec3 color1 = adjustHue(baseColor1, hue);
      vec3 color2 = adjustHue(baseColor2, hue);
      vec3 color3 = adjustHue(baseColor3, hue);
      
      float ang = atan(uv.y, uv.x);
      float len = length(uv);
      float invLen = len > 0.0 ? 1.0 / len : 0.0;

      float bgLuminance = dot(backgroundColor, vec3(0.299, 0.587, 0.114));
      
      float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
      float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
      float d0 = distance(uv, (r0 * invLen) * uv);
      float v0 = light1(1.0, 10.0, d0);

      v0 *= smoothstep(r0 * 1.05, r0, len);
      float innerFade = smoothstep(r0 * 0.8, r0 * 0.95, len);
      v0 *= mix(innerFade, 1.0, bgLuminance * 0.7);
      float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;
      
      float a = iTime * -1.0;
      vec2 pos = vec2(cos(a), sin(a)) * r0;
      float d = distance(uv, pos);
      float v1 = light2(1.5, 5.0, d);
      v1 *= light1(1.0, 50.0, d0);
      
      float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
      float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);
      
      vec3 colBase = mix(color1, color2, cl);
      float fadeAmount = mix(1.0, 0.1, bgLuminance);
      
      vec3 darkCol = mix(color3, colBase, v0);
      darkCol = (darkCol + v1) * v2 * v3;
      darkCol = clamp(darkCol, 0.0, 1.0);
      
      vec3 lightCol = (colBase + v1) * mix(1.0, v2 * v3, fadeAmount);
      lightCol = mix(backgroundColor, lightCol, v0);
      lightCol = clamp(lightCol, 0.0, 1.0);
      
      vec3 finalCol = mix(darkCol, lightCol, bgLuminance);
      
      return extractAlpha(finalCol);
    }

    vec4 mainImage(vec2 fragCoord) {
      vec2 center = iResolution.xy * 0.5;
      float size = min(iResolution.x, iResolution.y);
      vec2 uv = (fragCoord - center) / size * 2.0;
      
      float angle = rot;
      float s = sin(angle);
      float c = cos(angle);
      uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
      
      uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
      uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);
      
      return draw(uv);
    }

    void main() {
      vec2 fragCoord = vUv * iResolution.xy;
      vec4 col = mainImage(fragCoord);
      gl_FragColor = vec4(col.rgb * col.a, col.a);
    }
  `;return W.useEffect(()=>{let B=j.current;if(!B)return;let C=new v({alpha:!0,premultipliedAlpha:!1}),G=C.gl;G.clearColor(0,0,0,0),B.appendChild(G.canvas);let u=new d(G),_=new f(G,{vertex:L,fragment:Y,uniforms:{iTime:{value:0},iResolution:{value:new X(G.canvas.width,G.canvas.height,G.canvas.width/G.canvas.height)},hue:{value:F},hover:{value:0},rot:{value:0},hoverIntensity:{value:K},backgroundColor:{value:H(Q)}}}),n=new i(G,{geometry:u,program:_}),S=-1,T=-1;function w(){if(!B)return;let $=window.devicePixelRatio||1,Z=B.clientWidth,E=B.clientHeight;S=Z,T=E,C.setSize(Z*$,E*$),G.canvas.style.width=Z+"px",G.canvas.style.height=E+"px",_.uniforms.iResolution.value.set(G.canvas.width,G.canvas.height,G.canvas.width/G.canvas.height)}window.addEventListener("resize",w),w();let x=0,k=0,y=0,s=0.3,V=($)=>{let Z=B.getBoundingClientRect(),E=$.clientX-Z.left,h=$.clientY-Z.top,q=Z.width,R=Z.height,m=Math.min(q,R),g=q/2,c=R/2,I=(E-g)/m*2,M=(h-c)/m*2;if(Math.sqrt(I*I+M*M)<0.8)x=1;else x=0},z=()=>{x=0};B.addEventListener("mousemove",V),B.addEventListener("mouseleave",z);let A=0,O=($)=>{A=requestAnimationFrame(O);let Z=($-k)*0.001;k=$,_.uniforms.iTime.value=$*0.001,_.uniforms.hue.value=F,_.uniforms.hoverIntensity.value=K,_.uniforms.backgroundColor.value=H(Q);let E=U?1:x;if(_.uniforms.hover.value+=(E-_.uniforms.hover.value)*0.1,J&&E>0.5)y+=Z*s;_.uniforms.rot.value=y,C.render({scene:n})};if(D.current={pause(){cancelAnimationFrame(A),A=0},resume(){if(A)return;if(B.clientWidth!==S||B.clientHeight!==T)w();A=requestAnimationFrame(O)}},!P.current)A=requestAnimationFrame(O);return()=>{cancelAnimationFrame(A),A=0,D.current=null,window.removeEventListener("resize",w),B.removeEventListener("mousemove",V),B.removeEventListener("mouseleave",z),B.removeChild(G.canvas),G.getExtension("WEBGL_lose_context")?.loseContext()}},[F,K,J,U,Q]),W.useEffect(()=>{let B=D.current;if(B)(N?B.pause:B.resume)()},[N]),b("div",{ref:j,className:"aura-sphere-container"})}p.pausable=!0;function t(F,K,J){let U,Q,N;if(K===0)U=Q=N=J;else{let j=(L,Y,B)=>{if(B<0)B+=1;if(B>1)B-=1;if(B<0.16666666666666666)return L+(Y-L)*6*B;if(B<0.5)return Y;if(B<0.6666666666666666)return L+(Y-L)*(0.6666666666666666-B)*6;return L},P=J<0.5?J*(1+K):J+K-J*K,D=2*J-P;U=j(D,P,F+0.3333333333333333),Q=j(D,P,F),N=j(D,P,F-0.3333333333333333)}return new X(U,Q,N)}function H(F){if(F.startsWith("#")){let U=parseInt(F.slice(1,3),16)/255,Q=parseInt(F.slice(3,5),16)/255,N=parseInt(F.slice(5,7),16)/255;return new X(U,Q,N)}let K=F.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(K)return new X(parseInt(K[1])/255,parseInt(K[2])/255,parseInt(K[3])/255);let J=F.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);if(J){let U=parseInt(J[1])/360,Q=parseInt(J[2])/100,N=parseInt(J[3])/100;return t(U,Q,N)}return new X(0,0,0)}export{p as default};
