import{D as h,v as b,w as p,z as y}from"./main-ghsx4cn4.js";import{E as c,J as g,L as S}from"./main-jpng9c0t.js";var J=c(g(),1);if(typeof document<"u"){let N=document.createElement("style");N.dataset.src="wave-lattice/WaveLattice.css",N.textContent=`.wave-lattice-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
`,document.head.appendChild(N)}var f=({enableRainbow:N=!1,gridColor:X="#ffffff",rippleIntensity:Y=0.05,gridSize:Z=10,gridThickness:_=15,fadeDistance:$=1.5,vignetteStrength:W=2,glowIntensity:j=0.1,opacity:F=1,gridRotation:E=0,mouseInteraction:K=!0,mouseInteractionRadius:L=1})=>{let G=J.useRef(null),Q=J.useRef({x:0.5,y:0.5}),C=J.useRef({x:0.5,y:0.5}),D=J.useRef(0),B=J.useRef(null);return J.useEffect(()=>{if(!G.current)return;let k=(H)=>{let A=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(H);return A?[parseInt(A[1],16)/255,parseInt(A[2],16)/255,parseInt(A[3],16)/255]:[1,1,1]},U=new p({dpr:Math.min(window.devicePixelRatio,2),alpha:!0}),q=U.gl;q.enable(q.BLEND),q.blendFunc(q.SRC_ALPHA,q.ONE_MINUS_SRC_ALPHA),q.canvas.style.width="100%",q.canvas.style.height="100%",G.current.appendChild(q.canvas);let d=`
attribute vec2 position;
varying vec2 vUv;
void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
}`,I=`precision highp float;
uniform float iTime;
uniform vec2 iResolution;
uniform bool enableRainbow;
uniform vec3 gridColor;
uniform float rippleIntensity;
uniform float gridSize;
uniform float gridThickness;
uniform float fadeDistance;
uniform float vignetteStrength;
uniform float glowIntensity;
uniform float opacity;
uniform float gridRotation;
uniform bool mouseInteraction;
uniform vec2 mousePosition;
uniform float mouseInfluence;
uniform float mouseInteractionRadius;
varying vec2 vUv;

float pi = 3.141592;

mat2 rotate(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    if (gridRotation != 0.0) {
        uv = rotate(gridRotation * pi / 180.0) * uv;
    }

    float dist = length(uv);
    float func = sin(pi * (iTime - dist));
    vec2 rippleUv = uv + uv * func * rippleIntensity;

    if (mouseInteraction && mouseInfluence > 0.0) {
        vec2 mouseUv = (mousePosition * 2.0 - 1.0);
        mouseUv.x *= iResolution.x / iResolution.y;
        float mouseDist = length(uv - mouseUv);
        
        float influence = mouseInfluence * exp(-mouseDist * mouseDist / (mouseInteractionRadius * mouseInteractionRadius));
        
        float mouseWave = sin(pi * (iTime * 2.0 - mouseDist * 3.0)) * influence;
        rippleUv += normalize(uv - mouseUv) * mouseWave * rippleIntensity * 0.3;
    }

    vec2 a = sin(gridSize * 0.5 * pi * rippleUv - pi / 2.0);
    vec2 b = abs(a);

    float aaWidth = 0.5;
    vec2 smoothB = vec2(
        smoothstep(0.0, aaWidth, b.x),
        smoothstep(0.0, aaWidth, b.y)
    );

    vec3 color = vec3(0.0);
    color += exp(-gridThickness * smoothB.x * (0.8 + 0.5 * sin(pi * iTime)));
    color += exp(-gridThickness * smoothB.y);
    color += 0.5 * exp(-(gridThickness / 4.0) * sin(smoothB.x));
    color += 0.5 * exp(-(gridThickness / 3.0) * smoothB.y);

    if (glowIntensity > 0.0) {
        color += glowIntensity * exp(-gridThickness * 0.5 * smoothB.x);
        color += glowIntensity * exp(-gridThickness * 0.5 * smoothB.y);
    }

    float ddd = exp(-2.0 * clamp(pow(dist, fadeDistance), 0.0, 1.0));
    
    vec2 vignetteCoords = vUv - 0.5;
    float vignetteDistance = length(vignetteCoords);
    float vignette = 1.0 - pow(vignetteDistance * 2.0, vignetteStrength);
    vignette = clamp(vignette, 0.0, 1.0);
    
    vec3 t;
    if (enableRainbow) {
        t = vec3(
            uv.x * 0.5 + 0.5 * sin(iTime),
            uv.y * 0.5 + 0.5 * cos(iTime),
            pow(cos(iTime), 4.0)
        ) + 0.5;
    } else {
        t = gridColor;
    }

    float finalFade = ddd * vignette;
    float alpha = length(color) * finalFade * opacity;
    gl_FragColor = vec4(color * t * finalFade * opacity, alpha);
}`,O={iTime:{value:0},iResolution:{value:[1,1]},enableRainbow:{value:N},gridColor:{value:k(X)},rippleIntensity:{value:Y},gridSize:{value:Z},gridThickness:{value:_},fadeDistance:{value:$},vignetteStrength:{value:W},glowIntensity:{value:j},opacity:{value:F},gridRotation:{value:E},mouseInteraction:{value:K},mousePosition:{value:[0.5,0.5]},mouseInfluence:{value:0},mouseInteractionRadius:{value:L}};B.current=O;let m=new h(q),l=new b(q,{vertex:d,fragment:I,uniforms:O}),R=new y(q,{geometry:m,program:l}),P=()=>{let{clientWidth:H,clientHeight:A}=G.current;U.setSize(H,A),O.iResolution.value=[H,A]},T=(H)=>{if(!K||!G.current)return;let A=G.current.getBoundingClientRect(),v=(H.clientX-A.left)/A.width,z=1-(H.clientY-A.top)/A.height;C.current={x:v,y:z}},w=()=>{if(!K)return;D.current=1},x=()=>{if(!K)return;D.current=0};if(window.addEventListener("resize",P),K)G.current.addEventListener("mousemove",T),G.current.addEventListener("mouseenter",w),G.current.addEventListener("mouseleave",x);P();let M=(H)=>{O.iTime.value=H*0.001;let A=0.1;Q.current.x+=(C.current.x-Q.current.x)*A,Q.current.y+=(C.current.y-Q.current.y)*A;let v=O.mouseInfluence.value,z=D.current;O.mouseInfluence.value+=(z-v)*0.05,O.mousePosition.value=[Q.current.x,Q.current.y],U.render({scene:R}),requestAnimationFrame(M)};requestAnimationFrame(M);let V=G.current;return()=>{if(window.removeEventListener("resize",P),K&&V)V.removeEventListener("mousemove",T),V.removeEventListener("mouseenter",w),V.removeEventListener("mouseleave",x);U.gl.getExtension("WEBGL_lose_context")?.loseContext(),V?.removeChild(q.canvas)}},[]),J.useEffect(()=>{if(!B.current)return;let k=(U)=>{let q=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(U);return q?[parseInt(q[1],16)/255,parseInt(q[2],16)/255,parseInt(q[3],16)/255]:[1,1,1]};B.current.enableRainbow.value=N,B.current.gridColor.value=k(X),B.current.rippleIntensity.value=Y,B.current.gridSize.value=Z,B.current.gridThickness.value=_,B.current.fadeDistance.value=$,B.current.vignetteStrength.value=W,B.current.glowIntensity.value=j,B.current.opacity.value=F,B.current.gridRotation.value=E,B.current.mouseInteraction.value=K,B.current.mouseInteractionRadius.value=L},[N,X,Y,Z,_,$,W,j,F,E,K,L]),S("div",{ref:G,className:"wave-lattice-container"})},r=f;export{r as default};
