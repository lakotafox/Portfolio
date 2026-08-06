const M=`#version 300 es
precision highp float;
in vec2 a_position;
out vec2 vP;
void main(){vP=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`,w=`#version 300 es
precision highp float;
in vec2 vP;
out vec4 oC;
uniform sampler2D u_tex;
uniform float u_time,u_ratio,u_imgRatio,u_seed,u_scale,u_refract,u_blur,u_liquid;
uniform float u_bright,u_contrast,u_angle,u_fresnel,u_sharp,u_wave,u_noise,u_chroma;
uniform float u_distort,u_contour;
uniform vec3 u_lightColor,u_darkColor,u_tint;

vec3 sC,sM;

vec3 pW(vec3 v){
  vec3 i=floor(v),f=fract(v),s=sign(fract(v*.5)-.5),h=fract(sM*i+i.yzx),c=f*(f-1.);
  return s*c*((h*16.-4.)*c-1.);
}

vec3 aF(vec3 b,vec3 c){return pW(b+c.zxy-pW(b.zxy+c.yzx)+pW(b.yzx+c.xyz));}
vec3 lM(vec3 s,vec3 p){return(p+aF(s,p))*.5;}

vec2 fA(){
  vec2 c=vP-.5;
  c.x*=u_ratio>u_imgRatio?u_ratio/u_imgRatio:1.;
  c.y*=u_ratio>u_imgRatio?1.:u_imgRatio/u_ratio;
  return vec2(c.x+.5,.5-c.y);
}

vec2 rot(vec2 p,float r){float c=cos(r),s=sin(r);return vec2(p.x*c+p.y*s,p.y*c-p.x*s);}

float bM(vec2 c,float t){
  vec2 l=smoothstep(vec2(0.),vec2(t),c),u=smoothstep(vec2(0.),vec2(t),1.-c);
  return l.x*l.y*u.x*u.y;
}

float mG(float hi,float lo,float t,float sh,float cv){
  sh*=(2.-u_sharp);
  float ci=smoothstep(.15,.85,cv),r=lo;
  float e1=.08/u_scale;
  r=mix(r,hi,smoothstep(0.,sh*1.5,t));
  r=mix(r,lo,smoothstep(e1-sh,e1+sh,t));
  float e2=e1+.05/u_scale*(1.-ci*.35);
  r=mix(r,hi,smoothstep(e2-sh,e2+sh,t));
  float e3=e2+.025/u_scale*(1.-ci*.45);
  r=mix(r,lo,smoothstep(e3-sh,e3+sh,t));
  float e4=e1+.1/u_scale;
  r=mix(r,hi,smoothstep(e4-sh,e4+sh,t));
  float rm=1.-e4,gT=clamp((t-e4)/rm,0.,1.);
  r=mix(r,mix(hi,lo,smoothstep(0.,1.,gT)),smoothstep(e4-sh*.5,e4+sh*.5,t));
  return r;
}

void main(){
  sC=fract(vec3(.7548,.5698,.4154)*(u_seed+17.31))+.5;
  sM=fract(sC.zxy-sC.yzx*1.618);
  vec2 sc=vec2(vP.x*u_ratio,1.-vP.y);
  float angleRad=u_angle*3.14159/180.;
  sc=rot(sc-.5,angleRad)+.5;
  sc=clamp(sc,0.,1.);
  float sl=sc.x-sc.y,an=u_time*.001;
  vec2 iC=fA();
  vec4 texSample=texture(u_tex,iC);
  float dp=texSample.r;
  float shapeMask=texSample.a;
  vec3 hi=u_lightColor*u_bright;
  vec3 lo=u_darkColor*(2.-u_bright);
  lo.b+=smoothstep(.6,1.4,sc.x+sc.y)*.08;
  vec2 fC=sc-.5;
  float rd=length(fC+vec2(0.,sl*.15));
  vec2 ag=rot(fC,(.22-sl*.18)*3.14159);
  float cv=1.-pow(rd*1.65,1.15);
  cv*=pow(sc.y,.35);
  float vs=shapeMask;
  vs*=bM(iC,.01);
  float fr=pow(1.-cv,u_fresnel)*.3;
  vs=min(vs+fr*vs,1.);
  float mT=an*.0625;
  vec3 wO=vec3(-1.05,1.35,1.55);
  vec3 wA=aF(vec3(31.,73.,56.),mT+wO)*.22*u_wave;
  vec3 wB=aF(vec3(24.,64.,42.),mT-wO.yzx)*.22*u_wave;
  vec2 nC=sc*45.*u_noise;
  nC+=aF(sC.zxy,an*.17*sC.yzx-sc.yxy*.35).xy*18.*u_wave;
  vec3 tC=vec3(.00041,.00053,.00076)*mT+wB*nC.x+wA*nC.y;
  tC=lM(sC,tC);
  tC=lM(sC+1.618,tC);
  float tb=sin(tC.x*3.14159)*.5+.5;
  tb=tb*2.-1.;
  float noiseVal=pW(vec3(sc*8.+an,an*.5)).x;
  float edgeFactor=smoothstep(0.,.5,dp)*smoothstep(1.,.5,dp);
  float lD=dp+(1.-dp)*u_liquid*tb;
  lD+=noiseVal*u_distort*.15*edgeFactor;
  float rB=clamp(1.-cv,0.,1.);
  float fl=ag.x+sl;
  fl+=noiseVal*sl*u_distort*edgeFactor;
  fl*=mix(1.,1.-dp*.5,u_contour);
  fl-=dp*u_contour*.8;
  float eI=smoothstep(0.,1.,lD)*smoothstep(1.,0.,lD);
  fl-=tb*sl*1.8*eI;
  float cA=cv*clamp(pow(sc.y,.12),.25,1.);
  fl*=.12+(1.05-lD)*cA;
  fl*=smoothstep(1.,.65,lD);
  float vA1=smoothstep(.08,.18,sc.y)*smoothstep(.38,.18,sc.y);
  float vA2=smoothstep(.08,.18,1.-sc.y)*smoothstep(.38,.18,1.-sc.y);
  fl+=vA1*.16+vA2*.025;
  fl*=.45+pow(sc.y,2.)*.55;
  fl*=u_scale;
  fl-=an;
  float rO=rB+cv*tb*.025;
  float vM1=smoothstep(-.12,.18,sc.y)*smoothstep(.48,.08,sc.y);
  float cM1=smoothstep(.35,.55,cv)*smoothstep(.95,.35,cv);
  rO+=vM1*cM1*4.5;
  rO-=sl;
  float bO=rB*1.25;
  float vM2=smoothstep(-.02,.35,sc.y)*smoothstep(.75,.08,sc.y);
  float cM2=smoothstep(.35,.55,cv)*smoothstep(.75,.35,cv);
  bO+=vM2*cM2*.9;
  bO-=lD*.18;
  rO*=u_refract*u_chroma;
  bO*=u_refract*u_chroma;
  float sf=u_blur;
  float rP=fract(fl+rO);
  float rC=mG(hi.r,lo.r,rP,sf+.018+u_refract*cv*.025,cv);
  float gP=fract(fl);
  float gC=mG(hi.g,lo.g,gP,sf+.008/max(.01,1.-sl),cv);
  float bP=fract(fl-bO);
  float bC=mG(hi.b,lo.b,bP,sf+.008,cv);
  vec3 col=vec3(rC,gC,bC);
  col=(col-.5)*u_contrast+.5;
  col=clamp(col,0.,1.);
  col=mix(col,1.-min(vec3(1.),(1.-col)/max(u_tint,vec3(.001))),length(u_tint-1.)*.5);
  col=clamp(col,0.,1.);
  oC=vec4(col*vs,vs);
}`;function R(i){let e=i.naturalWidth||i.width,t=i.naturalHeight||i.height;if(e>1e3||t>1e3||e<500||t<500){const o=e>t?e>1e3?1e3/e:e<500?500/e:1:t>1e3?1e3/t:t<500?500/t:1;e=Math.round(e*o),t=Math.round(t*o)}const v=document.createElement("canvas");v.width=e,v.height=t;const p=v.getContext("2d");p.drawImage(i,0,0,e,t);const n=p.getImageData(0,0,e,t).data,a=e*t,A=new Float32Array(a),l=new Uint8Array(a),T=new Uint8Array(a);for(let o=0;o<a;o++){const r=o*4,s=n[r],c=n[r+1],x=n[r+2],h=n[r+3],y=s>250&&c>250&&x>250&&h===255||h<5;A[o]=y?0:h/255,l[o]=A[o]>.1?1:0}for(let o=0;o<t;o++)for(let r=0;r<e;r++){const s=o*e+r;l[s]&&(r===0||r===e-1||o===0||o===t-1||!l[s-1]||!l[s+1]||!l[s-e]||!l[s+e])&&(T[s]=1)}const f=new Float32Array(a),d=200,E=.01,g=1.85;for(let o=0;o<d;o++)for(let r=1;r<t-1;r++)for(let s=1;s<e-1;s++){const c=r*e+s;if(!l[c]||T[c])continue;const x=(l[c+1]?f[c+1]:0)+(l[c-1]?f[c-1]:0)+(l[c+e]?f[c+e]:0)+(l[c-e]?f[c-e]:0),h=(E+x)/4;f[c]=g*h+(1-g)*f[c]}let _=0;for(let o=0;o<a;o++)f[o]>_&&(_=f[o]);_===0&&(_=1);const u=p.createImageData(e,t);for(let o=0;o<a;o++){const r=o*4,s=f[o]/_,c=Math.round(255*(1-s*s));u.data[r]=u.data[r+1]=u.data[r+2]=c,u.data[r+3]=Math.round(A[o]*255)}return u}function b(i){const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(i);return m?[parseInt(m[1],16)/255,parseInt(m[2],16)/255,parseInt(m[3],16)/255]:[1,1,1]}function S(i,m,C={}){const e={seed:42,scale:4,refraction:.01,blur:.015,liquid:.75,speed:.3,brightness:2,contrast:.5,angle:0,fresnel:1,lightColor:"#ffffff",darkColor:"#000000",patternSharpness:1,waveAmplitude:1,noiseScale:.5,chromaticSpread:2,distortion:1,contour:.2,tintColor:"#feb3ff",...C},t=i.getContext("webgl2",{antialias:!0,alpha:!0});if(!t)return!1;const v=(o,r)=>{const s=t.createShader(r);return t.shaderSource(s,o),t.compileShader(s),t.getShaderParameter(s,t.COMPILE_STATUS)?s:(console.error(t.getShaderInfoLog(s)),null)},p=v(M,t.VERTEX_SHADER),I=v(w,t.FRAGMENT_SHADER);if(!p||!I)return!1;const n=t.createProgram();if(t.attachShader(n,p),t.attachShader(n,I),t.linkProgram(n),!t.getProgramParameter(n,t.LINK_STATUS))return console.error(t.getProgramInfoLog(n)),!1;const a={},A=t.getProgramParameter(n,t.ACTIVE_UNIFORMS);for(let o=0;o<A;o++){const r=t.getActiveUniform(n,o);r&&(a[r.name]=t.getUniformLocation(n,r.name))}const l=new Float32Array([-1,-1,1,-1,-1,1,1,1]),T=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,T),t.bufferData(t.ARRAY_BUFFER,l,t.STATIC_DRAW),t.useProgram(n);const f=t.getAttribLocation(n,"a_position");t.enableVertexAttribArray(f),t.vertexAttribPointer(f,2,t.FLOAT,!1,0,0);const d=1e3*Math.min(window.devicePixelRatio||1,2);i.width=d,i.height=d,t.viewport(0,0,d,d),t.uniform1f(a.u_seed,e.seed),t.uniform1f(a.u_scale,e.scale),t.uniform1f(a.u_refract,e.refraction),t.uniform1f(a.u_blur,e.blur),t.uniform1f(a.u_liquid,e.liquid),t.uniform1f(a.u_bright,e.brightness),t.uniform1f(a.u_contrast,e.contrast),t.uniform1f(a.u_angle,e.angle),t.uniform1f(a.u_fresnel,e.fresnel),t.uniform1f(a.u_sharp,e.patternSharpness),t.uniform1f(a.u_wave,e.waveAmplitude),t.uniform1f(a.u_noise,e.noiseScale),t.uniform1f(a.u_chroma,e.chromaticSpread),t.uniform1f(a.u_distort,e.distortion),t.uniform1f(a.u_contour,e.contour);const E=b(e.lightColor),g=b(e.darkColor),_=b(e.tintColor);t.uniform3f(a.u_lightColor,E[0],E[1],E[2]),t.uniform3f(a.u_darkColor,g[0],g[1],g[2]),t.uniform3f(a.u_tint,_[0],_[1],_[2]);const u=new Image;return u.crossOrigin="anonymous",u.onload=()=>{const o=R(u),r=t.createTexture();t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,r),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,o.width,o.height,0,t.RGBA,t.UNSIGNED_BYTE,o.data),t.uniform1i(a.u_tex,0),t.uniform1f(a.u_imgRatio,o.width/o.height),t.uniform1f(a.u_ratio,1);let s=0,c=performance.now();const x=h=>{s+=(h-c)*e.speed,c=h,t.uniform1f(a.u_time,s),t.drawArrays(t.TRIANGLE_STRIP,0,4),requestAnimationFrame(x)};requestAnimationFrame(x)},u.src=m,!0}function P(i,{width:m=900,height:C=320,fontSize:e=150}={}){const t=`<svg xmlns="http://www.w3.org/2000/svg" width="${m}" height="${C}"><text x="50%" y="54%" font-family="Arial Black, Arial, sans-serif" font-size="${e}" font-weight="900" font-style="italic" text-anchor="middle" dominant-baseline="middle" fill="black">${i}</text></svg>`;return"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(t)}export{S as mountMetallicPaint,P as textImage};
