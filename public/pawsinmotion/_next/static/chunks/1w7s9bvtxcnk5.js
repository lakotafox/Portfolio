(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,425,e=>{"use strict";var o=e.i(41929),r=e.i(49456),t=e.i(99057),s=e.i(46308),i=e.i(63617);let u=`
void main() {
  gl_Position = vec4(position, 1.0);
}
`,l=`
uniform vec2 iResolution;
uniform float iTime;
uniform float uProgress;
uniform float uVerticalOffset;
uniform float uDirection;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uBarWidth;
uniform float uBarHeight;
uniform float uMirrored;
uniform float uExpandFrom;
uniform float uIntensity;
uniform float uGlowSpread;
uniform vec2 uMousePos;
uniform float uMouseAlpha;

#define N_DIRECTION 16
#define fN_DIRECTION 16.0

#define PI 3.1415926535
#define TAU 6.2831853
#define INF 2.0

#define COLOR1 vec3(0.615686274509804, 0.9607843137254902, 1.0)
#define COLOR2 vec3(0.10980392156862745, 0.4588235294117647, 0.9215686274509803)
#define COLOR3 vec3(0.4666666666666667, 0.6392156862745098, 0.8745098039215686)

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

float disSeg(vec2 o,vec2 d, vec2 a, vec2 b){
    vec2 e=a-b;
    vec2 f=a-o;
    if(f.y*e.x<f.x*e.y)return INF;
    float det=d.x*e.y-d.y*e.x;
    if(det==0.)return INF;
    float s=(f.x*e.y-f.y*e.x)/det;
    float t=(d.x*f.y-d.y*f.x)/det;
    if(t>=0.&&t<=1.&&s>0.)return s;
    return INF;
}

vec3 sampling(vec2 o, vec2 d){
    vec3 col=vec3(0.0);
    float t,s;

    float barPos = uVerticalOffset;
    float mirrorPos = 1.0 - uVerticalOffset;
    float center = 0.5;

    if(uDirection < 0.5){
        float leftEdge, rightEdge;

        if(uExpandFrom < 0.5){
            leftEdge = center - (uProgress * uBarWidth * 0.5);
            rightEdge = center + (uProgress * uBarWidth * 0.5);
        } else if(uExpandFrom < 1.5){
            leftEdge = 0.0;
            rightEdge = uProgress * uBarWidth;
        } else if(uExpandFrom < 2.5){
            leftEdge = 1.0 - (uProgress * uBarWidth);
            rightEdge = 1.0;
        } else if(uExpandFrom < 3.5){
            leftEdge = center - (uProgress * uBarWidth * 0.5);
            rightEdge = center + (uProgress * uBarWidth * 0.5);
        } else {
            leftEdge = center - (uProgress * uBarWidth * 0.5);
            rightEdge = center + (uProgress * uBarWidth * 0.5);
        }

        if(o.y <= barPos){
            float cursorDist = 1.0;
            if(uMouseAlpha > 0.01){
                float distToMouse = distance(o, uMousePos);
                cursorDist = 1.0 + (1.0 - smoothstep(0.0, 0.5, distToMouse)) * 0.5 * uMouseAlpha;
            }

            float spread = uGlowSpread * 3.0;

            if((t = disSeg(o, d, vec2(leftEdge, barPos), vec2(rightEdge, barPos))) < INF){
                col = (uColor1 * exp(-spread * t) + uColor2 * 1.3 * exp(-0.01 * t)) * 1.1 * uIntensity * cursorDist;
            } else if((t = disSeg(o, d, vec2(rightEdge, barPos), vec2(leftEdge, barPos))) < INF){
                col = uColor3 * 2.7 * exp(-spread * t) * uIntensity * cursorDist;
            }
        }

        if(uMirrored > 0.5 && o.y >= mirrorPos){
            float cursorDist = 1.0;
            if(uMouseAlpha > 0.01){
                float distToMouse = distance(o, uMousePos);
                cursorDist = 1.0 + (1.0 - smoothstep(0.0, 0.5, distToMouse)) * 0.5 * uMouseAlpha;
            }

            float spread = uGlowSpread * 3.0;

            if((t = disSeg(o, d, vec2(leftEdge, mirrorPos), vec2(rightEdge, mirrorPos))) < INF){
                col += (uColor1 * exp(-spread * t) + uColor2 * 1.3 * exp(-0.01 * t)) * 1.1 * uIntensity * cursorDist;
            } else if((t = disSeg(o, d, vec2(rightEdge, mirrorPos), vec2(leftEdge, mirrorPos))) < INF){
                col += uColor3 * 2.7 * exp(-spread * t) * uIntensity * cursorDist;
            }
        }
    } else {
        float topEdge, bottomEdge;

        topEdge = center + (uProgress * uBarWidth * 0.5);
        bottomEdge = center - (uProgress * uBarWidth * 0.5);

        if(o.x >= barPos){
            float cursorDist = 1.0;
            if(uMouseAlpha > 0.01){
                float distToMouse = distance(o, uMousePos);
                cursorDist = 1.0 + (1.0 - smoothstep(0.0, 0.5, distToMouse)) * 0.5 * uMouseAlpha;
            }

            float spread = uGlowSpread * 3.0;

            if((t = disSeg(o, d, vec2(barPos, bottomEdge), vec2(barPos, topEdge))) < INF){
                col = (uColor1 * exp(-spread * t) + uColor2 * 1.3 * exp(-0.01 * t)) * 1.1 * uIntensity * cursorDist;
            } else if((t = disSeg(o, d, vec2(barPos, topEdge), vec2(barPos, bottomEdge))) < INF){
                col = uColor3 * 2.7 * exp(-spread * t) * uIntensity * cursorDist;
            }
        }

        if(uMirrored > 0.5 && o.x <= mirrorPos){
            float cursorDist = 1.0;
            if(uMouseAlpha > 0.01){
                float distToMouse = distance(o, uMousePos);
                cursorDist = 1.0 + (1.0 - smoothstep(0.0, 0.5, distToMouse)) * 0.5 * uMouseAlpha;
            }

            float spread = uGlowSpread * 3.0;

            if((t = disSeg(o, d, vec2(mirrorPos, bottomEdge), vec2(mirrorPos, topEdge))) < INF){
                col += (uColor1 * exp(-spread * t) + uColor2 * 1.3 * exp(-0.01 * t)) * 1.1 * uIntensity * cursorDist;
            } else if((t = disSeg(o, d, vec2(mirrorPos, topEdge), vec2(mirrorPos, bottomEdge))) < INF){
                col += uColor3 * 2.7 * exp(-spread * t) * uIntensity * cursorDist;
            }
        }
    }

    s = t;
    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec3 s = vec3(0.);
    vec2 uv = fragCoord / iResolution.xy;

    float n = rand(uv + iTime) * 3.;
    for(int i = 0; i < N_DIRECTION; ++i){
        s += sampling(uv, vec2(sin(n + float(i) * TAU / fN_DIRECTION),
                               cos(n + float(i) * TAU / fN_DIRECTION)));
    }
    s = s / fN_DIRECTION;
    fragColor = vec4(s, 1.);
}

void main() {
    vec4 color;
    mainImage(color, gl_FragCoord.xy);
    float alpha = length(color.rgb);
    gl_FragColor = vec4(color.rgb, alpha);
}
`,a=({revealDelay:e=0,revealDuration:a=2e3,verticalOffset:n=.7,direction:d="horizontal",color:f=200,barWidth:c=1,barHeight:v=.02,mirrored:g=!1,expandFrom:m="center",animateOnScroll:p=!1,scrollThreshold:h=.3,intensity:E=1,glowSpread:P=1,followCursor:x=!1,onStart:C,onComplete:I,className:w="",children:M})=>{let y=(0,r.useRef)(null),b=(0,r.useRef)(null),N=(0,r.useRef)(!1),D=(0,r.useRef)(!1),R=(0,r.useRef)({x:0,y:0}),T=(0,r.useRef)(0),[F,A]=(0,r.useState)(!p),O=(e,o,r)=>{let t,s,i;if(e/=360,r/=100,0==(o/=100))t=s=i=r;else{let u=(e,o,r)=>(r<0&&(r+=1),r>1&&(r-=1),r<1/6)?e+(o-e)*6*r:r<.5?o:r<2/3?e+(o-e)*(2/3-r)*6:e,l=r<.5?r*(1+o):r+o-r*o,a=2*r-l;t=u(a,l,e+1/3),s=u(a,l,e),i=u(a,l,e-1/3)}return{r:t,g:s,b:i}};return(0,r.useEffect)(()=>{let o,r=y.current;if(!r)return;let i=new t.WebGLRenderer({canvas:r,antialias:!1,alpha:!0,powerPreference:"high-performance"});i.setClearColor(0,0),i.setPixelRatio(1);let p=new s.Scene,h=new s.OrthographicCamera(-1,1,1,-1,0,1),w=new s.PlaneGeometry(2,2),M=O(f,80,60),b=O((f+30)%360,70,50),A=O((f+15)%360,75,65),S={iTime:{value:0},iResolution:{value:new s.Vector2},uProgress:{value:0},uVerticalOffset:{value:n},uDirection:{value:+("horizontal"!==d)},uColor1:{value:new s.Vector3(M.r,M.g,M.b)},uColor2:{value:new s.Vector3(b.r,b.g,b.b)},uColor3:{value:new s.Vector3(A.r,A.g,A.b)},uBarWidth:{value:c},uBarHeight:{value:v},uMirrored:{value:+!!g},uExpandFrom:{value:"center"===m?0:"left"===m?1:2},uIntensity:{value:E},uGlowSpread:{value:P},uMousePos:{value:new s.Vector2(0,0)},uMouseAlpha:{value:0}},B=new s.ShaderMaterial({vertexShader:u,fragmentShader:l,uniforms:S,transparent:!0}),W=new s.Mesh(w,B);p.add(W);let L=()=>{let e=r.clientWidth||window.innerWidth,o=r.clientHeight||window.innerHeight;i.setSize(e,o,!1),S.iResolution.value.set(r.width,r.height)};L(),window.addEventListener("resize",L);let V=performance.now(),_=a/1e3,G=0,j=r=>{o=requestAnimationFrame(j);let t=r-G;if(!(t<16.666666666666668)){if(G=r-t%16.666666666666668,(()=>{if(!x)return;let e=S.uMousePos.value,o=R.current,r=S.uMouseAlpha.value,t=T.current;e.x+=(o.x-e.x)*.1,e.y+=(o.y-e.y)*.1,S.uMouseAlpha.value+=(t-r)*.08})(),S.iTime.value=(r-V)/1e3,F){let o=r-V;if(o<e)S.uProgress.value=0,N.current||(N.current=!0,C?.());else{let r=Math.min((o-e)/1e3/_,1),t=1-Math.pow(1-r,3);S.uProgress.value=t,r>=1&&!D.current&&(D.current=!0,I?.())}}i.render(p,h)}};j(performance.now());let z=e=>{if(!x||!r)return;let o=r.getBoundingClientRect();R.current={x:(e.clientX-o.left)/o.width,y:1-(e.clientY-o.top)/o.height},T.current=1},U=()=>{x&&(T.current=0)};return x&&(r.addEventListener("mousemove",z),r.addEventListener("mouseleave",U)),o=requestAnimationFrame(j),()=>{cancelAnimationFrame(o),window.removeEventListener("resize",L),x&&r&&(r.removeEventListener("mousemove",z),r.removeEventListener("mouseleave",U)),w.dispose(),B.dispose(),i.dispose()}},[e,a,n,d,f,c,v,g,m,F,E,P,x,C,I]),(0,r.useEffect)(()=>{if(!p||!b.current)return;let e=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&A(!0)})},{threshold:h});return e.observe(b.current),()=>{e.disconnect()}},[p,h]),(0,o.jsxs)("div",{ref:b,className:(0,i.cn)("relative overflow-hidden w-full h-full",w),children:[(0,o.jsx)("canvas",{ref:y,style:{width:"100%",height:"100%",display:"block",willChange:"transform"}}),M&&(0,o.jsx)("div",{className:"absolute inset-0 flex items-center justify-center pointer-events-none",children:M})]})};a.displayName="NeonReveal",e.s(["default",0,a])}]);