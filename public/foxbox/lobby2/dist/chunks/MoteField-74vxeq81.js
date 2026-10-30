import{s as R,t as v,u as x,w as d,x as m}from"./main-mznb6j68.js";import{C as l,H as i,J as p}from"./main-csjpdy0q.js";var Z=l(i(),1);if(typeof document<"u"){let q=document.createElement("style");q.dataset.src="mote-field/MoteField.css",q.textContent=`.mote-field-container {
  position: relative;
  width: 100%;
  height: 100%;
}
`,document.head.appendChild(q)}var o=["#ffffff","#ffffff","#ffffff"],t=(q)=>{if(q=q.replace(/^#/,""),q.length===3)q=q.split("").map((U)=>U+U).join("");let L=parseInt(q.slice(0,6),16),X=(L>>16&255)/255,Y=(L>>8&255)/255,Q=(L&255)/255;return[X,Y,Q]},r=`
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;
  
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;
  
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vRandom = random;
    vColor = color;
    
    vec3 pos = position * uSpread;
    pos.z *= 10.0;
    
    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime;
    mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
    mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
    mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);
    
    vec4 mvPos = viewMatrix * mPos;

    if (uSizeRandomness == 0.0) {
      gl_PointSize = uBaseSize;
    } else {
      gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
    }

    gl_Position = projectionMatrix * mvPos;
  }
`,a=`
  precision highp float;
  
  uniform float uTime;
  uniform float uAlphaParticles;
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));
    
    if(uAlphaParticles < 0.5) {
      if(d > 0.5) {
        discard;
      }
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
    } else {
      float circle = smoothstep(0.5, 0.4, d) * 0.8;
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
    }
  }
`,e=({particleCount:q=200,particleSpread:L=10,speed:X=0.1,particleColors:Y,moveParticlesOnHover:Q=!1,particleHoverFactor:U=1,alphaParticles:y=!1,particleBaseSize:f=100,sizeRandomness:M=1,cameraDistance:b=20,disableRotation:O=!1,pixelRatio:k=1,className:n})=>{let S=Z.useRef(null),G=Z.useRef({x:0,y:0});return Z.useEffect(()=>{let J=S.current;if(!J)return;let j=new x({dpr:k,depth:!1,alpha:!0}),E=j.gl;J.appendChild(E.canvas),E.clearColor(0,0,0,0);let N=new d(E,{fov:15});N.position.set(0,0,b);let I=()=>{let{clientWidth:w,clientHeight:A}=J;j.setSize(w,A),N.perspective({aspect:E.canvas.width/E.canvas.height})};window.addEventListener("resize",I,!1),I();let C=(w)=>{let A=J.getBoundingClientRect(),V=(w.clientX-A.left)/A.width*2-1,W=-((w.clientY-A.top)/A.height*2-1);G.current={x:V,y:W}};if(Q)J.addEventListener("mousemove",C);let _=q,P=new Float32Array(_*3),H=new Float32Array(_*4),z=new Float32Array(_*3),u=Y&&Y.length>0?Y:o;for(let w=0;w<_;w++){let A,V,W,B;do A=Math.random()*2-1,V=Math.random()*2-1,W=Math.random()*2-1,B=A*A+V*V+W*W;while(B>1||B===0);let D=Math.cbrt(Math.random());P.set([A*D,V*D,W*D],w*3),H.set([Math.random(),Math.random(),Math.random(),Math.random()],w*4);let s=t(u[Math.floor(Math.random()*u.length)]);z.set(s,w*3)}let c=new R(E,{position:{size:3,data:P},random:{size:4,data:H},color:{size:3,data:z}}),F=new v(E,{vertex:r,fragment:a,uniforms:{uTime:{value:0},uSpread:{value:L},uBaseSize:{value:f*k},uSizeRandomness:{value:M},uAlphaParticles:{value:y?1:0}},transparent:!0,depthTest:!1}),K=new m(E,{mode:E.POINTS,geometry:c,program:F}),T,g=performance.now(),$=0,h=(w)=>{T=requestAnimationFrame(h);let A=w-g;if(g=w,$+=A*X,F.uniforms.uTime.value=$*0.001,Q)K.position.x=-G.current.x*U,K.position.y=-G.current.y*U;else K.position.x=0,K.position.y=0;if(!O)K.rotation.x=Math.sin($*0.0002)*0.1,K.rotation.y=Math.cos($*0.0005)*0.15,K.rotation.z+=0.01*X;j.render({scene:K,camera:N})};return T=requestAnimationFrame(h),()=>{if(window.removeEventListener("resize",I),Q)J.removeEventListener("mousemove",C);if(cancelAnimationFrame(T),J.contains(E.canvas))J.removeChild(E.canvas)}},[q,L,X,Q,U,y,f,M,b,O,k]),p("div",{ref:S,className:`mote-field-container ${n}`})},E0=e;export{E0 as default};
