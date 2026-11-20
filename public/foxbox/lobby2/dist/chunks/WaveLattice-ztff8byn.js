import{D as c,v as d,w as l,z as g}from"./main-z8ycv9rf.js";import{E as i,J as r,L as m}from"./main-shjzg9mc.js";var G=i(r(),1);if(typeof document<"u"){let Q=document.createElement("style");Q.dataset.src="wave-lattice/WaveLattice.css",Q.textContent=`.wave-lattice-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
`,document.head.appendChild(Q)}var R=({enableRainbow:Q=!1,gridColor:F="#ffffff",rippleIntensity:H=0.05,gridSize:j=10,gridThickness:C=15,fadeDistance:E=1.5,vignetteStrength:L=2,glowIntensity:W=0.1,opacity:D=1,gridRotation:k=0,mouseInteraction:N=!0,mouseInteractionRadius:P=1,paused:_=!1})=>{let J=G.useRef(null),z=G.useRef(_);z.current=_;let v=G.useRef(null),Y=G.useRef({x:0.5,y:0.5}),x=G.useRef({x:0.5,y:0.5}),T=G.useRef(0),B=G.useRef(null);return G.useEffect(()=>{if(!J.current)return;let U=(K)=>{let A=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(K);return A?[parseInt(A[1],16)/255,parseInt(A[2],16)/255,parseInt(A[3],16)/255]:[1,1,1]},Z=new l({dpr:Math.min(window.devicePixelRatio,2),alpha:!0}),q=Z.gl;q.enable(q.BLEND),q.blendFunc(q.SRC_ALPHA,q.ONE_MINUS_SRC_ALPHA),q.canvas.style.width="100%",q.canvas.style.height="100%",J.current.appendChild(q.canvas);let f=`
attribute vec2 position;
varying vec2 vUv;
void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
}`,u=`precision highp float;
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
}`,V={iTime:{value:0},iResolution:{value:[1,1]},enableRainbow:{value:Q},gridColor:{value:U(F)},rippleIntensity:{value:H},gridSize:{value:j},gridThickness:{value:C},fadeDistance:{value:E},vignetteStrength:{value:L},glowIntensity:{value:W},opacity:{value:D},gridRotation:{value:k},mouseInteraction:{value:N},mousePosition:{value:[0.5,0.5]},mouseInfluence:{value:0},mouseInteractionRadius:{value:P}};B.current=V;let a=new c(q),s=new d(q,{vertex:f,fragment:u,uniforms:V}),t=new g(q,{geometry:a,program:s}),b=-1,y=-1,$=()=>{let{clientWidth:K,clientHeight:A}=J.current;b=K,y=A,Z.setSize(K,A),V.iResolution.value=[K,A]},h=(K)=>{if(!N||!J.current)return;let A=J.current.getBoundingClientRect(),M=(K.clientX-A.left)/A.width,S=1-(K.clientY-A.top)/A.height;x.current={x:M,y:S}},p=()=>{if(!N)return;T.current=1},I=()=>{if(!N)return;T.current=0};if(window.addEventListener("resize",$),N)J.current.addEventListener("mousemove",h),J.current.addEventListener("mouseenter",p),J.current.addEventListener("mouseleave",I);$();let O=0,w=(K)=>{O=requestAnimationFrame(w),V.iTime.value=K*0.001;let A=0.1;Y.current.x+=(x.current.x-Y.current.x)*A,Y.current.y+=(x.current.y-Y.current.y)*A;let M=V.mouseInfluence.value,S=T.current;V.mouseInfluence.value+=(S-M)*0.05,V.mousePosition.value=[Y.current.x,Y.current.y],Z.render({scene:t})},X=J.current;if(v.current={pause(){cancelAnimationFrame(O),O=0},resume(){if(O)return;if(X.clientWidth!==b||X.clientHeight!==y)$();O=requestAnimationFrame(w)}},!z.current)O=requestAnimationFrame(w);return()=>{if(cancelAnimationFrame(O),O=0,v.current=null,window.removeEventListener("resize",$),N&&X)X.removeEventListener("mousemove",h),X.removeEventListener("mouseenter",p),X.removeEventListener("mouseleave",I);Z.gl.getExtension("WEBGL_lose_context")?.loseContext(),X?.removeChild(q.canvas)}},[]),G.useEffect(()=>{let U=v.current;if(U)(_?U.pause:U.resume)()},[_]),G.useEffect(()=>{if(!B.current)return;let U=(Z)=>{let q=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(Z);return q?[parseInt(q[1],16)/255,parseInt(q[2],16)/255,parseInt(q[3],16)/255]:[1,1,1]};B.current.enableRainbow.value=Q,B.current.gridColor.value=U(F),B.current.rippleIntensity.value=H,B.current.gridSize.value=j,B.current.gridThickness.value=C,B.current.fadeDistance.value=E,B.current.vignetteStrength.value=L,B.current.glowIntensity.value=W,B.current.opacity.value=D,B.current.gridRotation.value=k,B.current.mouseInteraction.value=N,B.current.mouseInteractionRadius.value=P},[Q,F,H,j,C,E,L,W,D,k,N,P]),m("div",{ref:J,className:"wave-lattice-container"})};R.pausable=!0;var q0=R;export{q0 as default};
