var R={OPEN_DPS:220,STRONG_DPS:750,FIRE_FRAC:0.7,SETTLE_DPS:100,SETTLE_FRAC:0.35,SETTLE_MS:60,MAX_MS:900,BACK_MS:320,MIN_LIN:3,STILL_DPS:60,STILL_MS:450,POWER_DPS:[250,1000],POWER_LIN:[5,30],TILT_DEG:25,TILT_DEAD:4,TILT_SIGN:1,TILT_AXIS:0,TILT_CALM_DPS:120,TILT_CALM_MS:150,TILT_WAIT_MS:700},lJ=JSON.parse(JSON.stringify(R));function rJ(Z){let Y={},j;try{j=new URLSearchParams(Z??(globalThis.location?location.search:""))}catch{return Y}for(let[F,_]of j){if(!F.startsWith("swing."))continue;let X=F.slice(6);if(!(X in R))continue;let K=_.split(",").map(Number);if(!K.every(Number.isFinite))continue;R[X]=Array.isArray(lJ[X])?[K[0],K[1]??lJ[X][1]]:K[0],Y[X]=R[X]}return Y}var yJ=(Z)=>typeof Z==="number"&&Number.isFinite(Z),I=(Z)=>yJ(Z)?Z:0,FJ=(Z,Y,j)=>Math.max(Y,Math.min(j,Z));function HX(Z,Y){let[j,F]=R.POWER_DPS,[_,X]=R.POWER_LIN,K=FJ((I(Z)-j)/(F-j),0,1),q=Y==null?K:FJ((I(Y)-_)/(X-_),0,1);return Math.round((0.6*K+0.4*q)*100)/100}function aJ({ios:Z=!1,onSwing:Y=()=>{},onStill:j=()=>{}}={}){let F=Z?-1:1,_=null,X=null,K=null,q=!1,S=0,Q=0,ZJ=0,D=null,A=!1,f=0,O=0,c=null,G=0,z=null;function P({t:V,gi:y={},rr:l={},acc:W=null}){ZJ++;let g=Q?FJ((V-Q)/1000,0.001,0.05):0.016666666666666666;Q=V;let v=I(y.x),i=I(y.y),n=I(y.z),r=!!W&&[W.x,W.y,W.z].some(yJ);if(r)v-=I(W.x),i-=I(W.y),n-=I(W.z);let H=Math.hypot(v,i,n);if(H>1){let w={x:F*v/H,y:F*i/H,z:F*n/H};if(!_)_=w;else{let L=1-Math.exp(-g/(r?0.05:0.15)),k=_.x+(w.x-_.x)*L,UJ=_.y+(w.y-_.y)*L,$J=_.z+(w.z-_.z)*L,QJ=Math.hypot(k,UJ,$J)||1;_={x:k/QJ,y:UJ/QJ,z:$J/QJ}}}let h=I(l.alpha),C=I(l.beta),e=I(l.gamma),d=Math.hypot(h,C,e),o=r||[y.x,y.y,y.z].some(yJ),t=r?Math.hypot(I(W.x),I(W.y),I(W.z)):Math.abs(Math.hypot(I(y.x),I(y.y),I(y.z))-9.81);if(A)YJ(V,d,g);if(!q)return;if(X){if(d>X.peak)X.peak=d,X.peakT=V;if(X.lin=Math.max(X.lin,t),d>R.OPEN_DPS*0.5){let L=Math.hypot(X.ax,X.ay,X.az),k=L>1?(h*X.ax+C*X.ay+e*X.az)/L:d;if(!X.second&&k<-R.OPEN_DPS&&(!o||X.lin>=R.MIN_LIN||X.peak>=R.OPEN_DPS)){X={t0:V,peak:d,peakT:V,lin:t,ax:h,ay:C,az:e,quietSince:0,second:!0,fired:!1};return}if(k>=0)X.ax+=h,X.ay+=C,X.az+=e}if(!X.fired&&(X.second||X.peak>=R.STRONG_DPS)&&d<=X.peak*R.FIRE_FRAC)b(X,o,V);if(!q||!X)return;if(d<Math.max(R.SETTLE_DPS,X.peak*R.SETTLE_FRAC))X.quietSince||=V;else X.quietSince=0;if(X.quietSince&&V-X.quietSince>=R.SETTLE_MS||V-X.t0>=R.MAX_MS){let L=X;if(X=null,L.second||L.peak>=R.STRONG_DPS)b(L,o,V);else if(!o||L.lin>=R.MIN_LIN)K={until:V+R.BACK_MS,first:L,linKnown:o}}return}if(d>R.OPEN_DPS){X={t0:V,peak:d,peakT:V,lin:t,ax:h,ay:C,az:e,quietSince:0,second:!!K,fired:!1},K=null,S=0;return}if(K&&V>=K.until){let w=K;K=null,b(w.first,w.linKnown,V);return}if(!K&&d<R.STILL_DPS){if(S||=V,V-S>=R.STILL_MS)S=V+1e9,j()}else if(!K)S=0}function b(V,y,l){if(V.fired)return;if(V.fired=!0,y&&V.lin<R.MIN_LIN){if(X===V)X=null;return}q=!1,X=null,K=null;let W=Math.hypot(V.ax,V.ay,V.az);D=W>1?{x:V.ax/W,y:V.ay/W,z:V.az/W}:null,A=!0,f=l,O=0,c=null,G=0,z={t:V.peakT,power:HX(V.peak,y?V.lin:null),peakDps:Math.round(V.peak),peakLin:Math.round(V.lin*10)/10,bursts:V.second?2:1},Y(z)}function a(){if(!_)return 0;return D&&!R.TILT_AXIS?_.x*D.x+_.y*D.y+_.z*D.z:_.x}function YJ(V,y,l){if(!_)return;if(c==null){if(y<R.TILT_CALM_DPS)O||=V;else O=0;if(O&&V-O>=R.TILT_CALM_MS||V-f>=R.TILT_WAIT_MS)c=a();else return}let W=FJ(a()-c,-1,1),g=-R.TILT_SIGN*Math.asin(W)*57.2958,v=Math.max(1,R.TILT_DEG-R.TILT_DEAD),i=Math.abs(g)-R.TILT_DEAD,n=i<=0?0:FJ(i/v,0,1)*Math.sign(g);G+=(n-G)*(1-Math.exp(-l/0.06))}return{feed:P,arm(){q=!0,X=null,K=null,S=0,A=!1,G=0},disarm(){q=!1,X=null,K=null},stopTilt(){A=!1,G=0},recenter(){if(A&&_)c=a(),G=0},get armed(){return q},get busy(){return!!X||!!K},get tilt(){return A?Math.round(G*100)/100||0:0},get tiltReady(){return A&&c!=null},get up(){return _&&{..._}},get axis(){return D&&{...D}},get last(){return z},get readings(){return ZJ}}}var RJ=(Z,Y=0)=>{let j=Math.sqrt(1-Y*Y);return[Y,Math.cos(Z)*j,-Math.sin(Z)*j]},KX=[[RJ(0.2,-0.2),0.125],[RJ(0.2,0.2),0.125],[RJ(0.8200000000000001),0.15]],RX=RJ(3.2,0.18);function oJ(Z){let Y=(0.45-Z)/2;return[Math.sin(Y),0,0,Math.cos(Y)]}var qJ=(Z)=>`vec3(${Z.map((Y)=>Y.toFixed(5)).join(", ")})`,s=["marble","swirl","stripe","halves","dots","galaxy","zigzag","plain","panels","rings","checker","tiger"],DJ={marble:"MARBLE",swirl:"SWIRL",stripe:"STRIPE",halves:"HALVES",dots:"DOTS",galaxy:"GALAXY",zigzag:"ZIGZAG",plain:"PLAIN",panels:"BEACH BALL",rings:"RINGS",checker:"CHECKER",tiger:"TIGER"},tJ=(Z)=>Math.max(0,s.indexOf(Z)),WJ=(Z)=>{let Y=Math.hypot(...Z);return Z.map((j)=>j/Y)},iJ=(Z,Y)=>[Z[1]*Y[2]-Z[2]*Y[1],Z[2]*Y[0]-Z[0]*Y[2],Z[0]*Y[1]-Z[1]*Y[0]],sJ=(Z,Y)=>{let j=WJ(Y),F=WJ(iJ(j,[0.31,-0.2,0.93])),_=iJ(j,F);return`const vec3 ${Z}N = ${qJ(j)}, ${Z}U = ${qJ(F)}, ${Z}W = ${qJ(_)};`},jJ=(1+Math.sqrt(5))/2,DX=(Z)=>{let[Y,j,F]=Z,_=Math.cos(0.5),X=Math.sin(0.5),K=Math.cos(0.33),q=Math.sin(0.33),S=j*_-F*X,Q=j*X+F*_;return[Y*K+Q*q,S,-Y*q+Q*K]},zJ=[];for(let Z of[-1,1])for(let Y of[-1,1]){for(let j of[-1,1])zJ.push([Z,Y,j]);zJ.push([0,Z/jJ,Y*jJ],[Z/jJ,Y*jJ,0],[Z*jJ,0,Y/jJ])}var nJ=`
${sJ("AX",[0.35,0.8,0.49])}
${sJ("BX",[-0.42,0.55,0.72])}
const vec3 BALL_DOTS[20] = vec3[20](${zJ.map((Z)=>qJ(WJ(DX(Z)))).join(", ")});
float ballHash(vec3 c) {   // whole-number hash: the same speckles on every screen
  ivec3 i = ivec3(floor(c)) + 64;
  uint n = uint(i.x) * 73856093u ^ uint(i.y) * 19349663u ^ uint(i.z) * 83492791u;
  n = (n ^ (n >> 13u)) * 1274126177u;
  return float((n ^ (n >> 16u)) & 1023u) / 1023.0;
}
vec4 ballSkin(vec3 d, vec3 base, vec4 two, int pat) {
  vec3 ink = vec3(0.039, 0.078, 0.157), dark = mix(base, ink, 0.36);
  vec3 c2 = two.a > 0.5 ? two.rgb : mix(base, vec3(1.0), 0.36);
  vec3 c = base;
  float ha = dot(d, AXN), aa = atan(dot(d, AXW), dot(d, AXU)), hb = dot(d, BXN), ab = atan(dot(d, BXW), dot(d, BXU));
  if (pat == 0) {
    // marble: wide wavy bands, one in the second colour and one darker than the ball's colour. Nothing in it is even
    // around any axis, so whichever way the ball turns, the bands are seen to travel.
    float f = sin(d.x * 3.3 + 2.1 * sin(d.y * 2.7 + 1.3) + 1.9 * sin(d.z * 3.1 + d.x * 1.7));
    float g = sin(d.y * 4.1 - 1.7 * sin(d.z * 2.9 + 0.6) + 2.3 * sin(d.x * 2.2 - d.y * 1.4) + 2.0);
    if (f > 0.5) c = c2;
    else if (g > 0.62) c = dark;
  } else if (pat == 1) {          // swirl: two arms winding from one end of the ball to the other
    if (sin(aa * 2.0 + ha * 4.6) > 0.0) c = c2;
  } else if (pat == 2) {          // stripe: one wide belt with a thin line each side
    float h = abs(hb);
    if (h < 0.2 || (h > 0.28 && h < 0.34)) c = c2;
  } else if (pat == 3) {          // half and half, with a dark seam
    if (abs(ha) < 0.035) c = dark; else if (ha > 0.0) c = c2;
  } else if (pat == 4) {          // dots
    float m = -1.0;
    for (int i = 0; i < 20; i++) m = max(m, dot(d, BALL_DOTS[i]));
    if (m > 0.9689) c = c2;       // 0.25 radians across
  } else if (pat == 5) {          // galaxy: a dark cloud band and a scatter of stars of mixed sizes
    float g = sin(d.y * 4.1 - 1.7 * sin(d.z * 2.9 + 0.6) + 2.3 * sin(d.x * 2.2 - d.y * 1.4) + 2.0);
    if (g > 0.45) c = dark;
    vec3 p = d * 4.6 + 0.37, q = fract(p) - 0.5;
    float k = ballHash(p);
    if (k > 0.55 && length(q) < 0.12 + 0.22 * (k - 0.55)) c = c2;
  } else if (pat == 6) {          // zigzag: a toothed belt
    float t = abs(fract(ab / 6.28319 * 6.0) - 0.5) * 2.0;
    if (abs(hb - (t - 0.5) * 0.46) < 0.17) c = c2;
  } else if (pat == 8) {          // beach ball: six wedges, a dark button at each end
    if (abs(ha) > 0.95) c = dark; else if (mod(floor(aa / 6.28319 * 6.0 + 6.0), 2.0) < 0.5) c = c2;
  } else if (pat == 9) {          // rings: a target at each end
    if (mod(floor(acos(clamp(hb, -1.0, 1.0)) / 0.3927), 2.0) < 0.5) c = c2;
  } else if (pat == 10) {         // checker
    if (mod(floor(aa / 6.28319 * 8.0 + 8.0) + floor(acos(clamp(ha, -1.0, 1.0)) / 0.5236), 2.0) < 0.5) c = c2;
  } else if (pat == 11) {         // tiger: thin wavy stripes
    if (sin(hb * 9.0 + 1.6 * sin(ab * 3.0) + 0.8 * sin(ab * 5.0 + 1.0)) > 0.4) c = c2;
  }                               // 7 = plain: the main colour only
  float shine = 1.0;
  // the mark: a pale ring with a gold dot
  float m = dot(d, ${qJ(RX)});
  if (m > ${Math.cos(0.105).toFixed(5)}) c = vec3(1.0, 0.824, 0.247);
  else if (m < ${Math.cos(0.2).toFixed(5)} && m > ${Math.cos(0.3).toFixed(5)}) c = vec3(1.0, 0.98, 0.9);
  // the holes: dark, no shine
${KX.map(([Z,Y])=>`  if (dot(d, ${qJ(Z)}) > ${Math.cos(Y).toFixed(5)}) { c = mix(base, ink, 0.9); shine = 0.0; }`).join(`
`)}
  return vec4(c, shine);
}`;var N=[["RED","#ff5a3c"],["BLUE","#2f8fff"],["GREEN","#35d07f"],["GOLD","#ffd23f"],["PURPLE","#6a3fd0"],["PINK","#ff7fd1"],["AQUA","#27d3e6"],["ORANGE","#ff9a2e"],["WHITE","#fdfdf5"],["BLACK","#262c44"],["SILVER","#aab4cc"],["LIME","#b6e23a"]];var MX=`#version 300 es
void main() { vec2 p = vec2(float(gl_VertexID % 2) * 4.0 - 1.0, float(gl_VertexID / 2) * 4.0 - 1.0); gl_Position = vec4(p, 0.0, 1.0); }`,CX=`#version 300 es
precision highp float;
uniform vec2 uRes; uniform vec3 uBase; uniform vec4 uTwo, uQ; uniform int uPat;
out vec4 o;
${nJ}
const vec3 L = vec3(-0.2803, 0.7809, -0.5583), INK = vec3(0.039, 0.078, 0.157);
vec3 rot(vec4 q, vec3 v) { vec3 t = 2.0 * cross(q.xyz, v); return v + q.w * t + cross(q.xyz, t); }
void main() {
  float R = uRes.x * 0.5 - 1.0;
  vec2 p = (floor(gl_FragCoord.xy) + 0.5 - uRes * 0.5) / R;
  float r = length(p);
  if (r > (R + 1.0) / R) { o = vec4(0.0); return; }
  if (r > 1.0) { o = vec4(INK, 1.0); return; }
  vec3 N = vec3(p, -sqrt(1.0 - r * r)), V = vec3(0.0, 0.0, -1.0), H = normalize(L + V);
  vec4 s = ballSkin(rot(vec4(-uQ.xyz, uQ.w), N), uBase, uTwo, uPat);
  float ndl = dot(N, L), ndh = max(dot(N, H), 0.0);
  vec3 col = mix(INK, s.rgb, ndl > 0.42 ? 1.0 : (ndl > -0.12 ? 0.84 : 0.68));
  if (s.a > 0.6 && ndh > 0.975 && uPat == 7) col = vec3(1.0);
  o = vec4(col, 1.0);
}`,eJ=(Z)=>{let Y=parseInt(String(Z).replace("#",""),16);return[(Y>>16&255)/255,(Y>>8&255)/255,(Y&255)/255]},PX=(Z,Y)=>[Z[3]*Y[0]+Z[0]*Y[3]+Z[1]*Y[2]-Z[2]*Y[1],Z[3]*Y[1]-Z[0]*Y[2]+Z[1]*Y[3]+Z[2]*Y[0],Z[3]*Y[2]+Z[0]*Y[1]-Z[1]*Y[0]+Z[2]*Y[3],Z[3]*Y[3]-Z[0]*Y[0]-Z[1]*Y[1]-Z[2]*Y[2]],GJ=null,LJ=!1;function EX(){let Z=document.createElement("canvas"),Y=Z.getContext("webgl2",{alpha:!0,premultipliedAlpha:!1,antialias:!1,preserveDrawingBuffer:!0});if(!Y)throw Error("no webgl2");let j=(X,K)=>{let q=Y.createShader(X);if(Y.shaderSource(q,K),Y.compileShader(q),!Y.getShaderParameter(q,Y.COMPILE_STATUS))throw Error(Y.getShaderInfoLog(q));return q},F=Y.createProgram();if(Y.attachShader(F,j(Y.VERTEX_SHADER,MX)),Y.attachShader(F,j(Y.FRAGMENT_SHADER,CX)),Y.linkProgram(F),!Y.getProgramParameter(F,Y.LINK_STATUS))throw Error(Y.getProgramInfoLog(F));Y.useProgram(F);let _={};for(let X of["uRes","uBase","uTwo","uQ","uPat"])_[X]=Y.getUniformLocation(F,X);return{cv:Z,gl:Y,u:_}}function AX(Z,Y,j){Z.width=Z.height=Y;let F=Z.getContext("2d"),_=Y/2-1;F.clearRect(0,0,Y,Y),F.fillStyle="#0a1428",F.beginPath(),F.arc(Y/2,Y/2,_+1,0,6.2832),F.fill(),F.fillStyle=j[0],F.beginPath(),F.arc(Y/2,Y/2,_,0,6.2832),F.fill(),F.fillStyle=j[1]||j[0],F.fillRect(Y*0.18,Y*0.42,Y*0.64,Y*0.16)}function MJ(Z,Y){let j=Y.n||40,F=Y.colors||["#6a3fd0"];if(!LJ&&!GJ)try{GJ=EX()}catch{LJ=!0}if(LJ)return AX(Z,j,F);let{cv:_,gl:X,u:K}=GJ;_.width=_.height=j,X.viewport(0,0,j,j),X.clearColor(0,0,0,0),X.clear(X.COLOR_BUFFER_BIT);let q=Y.y||0,S=PX([0,Math.sin(q/2),0,Math.cos(q/2)],oJ(Y.a??1.1));X.uniform2f(K.uRes,j,j),X.uniform3fv(K.uBase,eJ(F[0])),X.uniform4f(K.uTwo,...eJ(F[1]||F[0]),1),X.uniform4fv(K.uQ,S),X.uniform1i(K.uPat,tJ(Y.pattern)),X.drawArrays(X.TRIANGLES,0,3),Z.width=Z.height=j;let Q=Z.getContext("2d");Q.clearRect(0,0,j,j),Q.drawImage(_,0,0)}var BJ={xMax:16,aimMax:3,xStep:0.5,aimStep:0.1},OX=/iPhone|iPad|iPod/.test(navigator.userAgent)||navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1,xJ=(Z)=>typeof Z==="number"&&Number.isFinite(Z),HJ=(Z,Y,j)=>Math.max(Y,Math.min(j,Z)),TJ=(Z)=>String(Z??"").replace(/[&<>"]/g,(Y)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[Y]),yX=["1ST","2ND","3RD","4TH","5TH","6TH","7TH","8TH"],WX=`
.bp { --c: #6a3fd0; --ink: #fff; --dim: rgba(255,255,255,.62); --panel: rgba(255,255,255,.09); --edge: rgba(255,255,255,.2);
  position: relative; flex: 1; min-height: 0; min-width: 0; height: 100%; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box;
  color: var(--ink); font-family: "FoxBox Soft", system-ui, sans-serif; font-size: 18px; line-height: 1.25;
  -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; touch-action: none; overflow: hidden; }
.bp * { box-sizing: border-box; }
.bp [hidden] { display: none !important; }
.bp-scr { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 10px; }
.bp-px { font-family: "FoxBox Pixel", "FoxBox Soft", monospace; letter-spacing: .02em; }
.bp-h { font-family: "FoxBox Pixel", "FoxBox Soft", monospace; font-size: clamp(15px, 5.2vw, 22px); line-height: 1.35; text-align: center; }
.bp-big { font-family: "FoxBox Pixel", "FoxBox Soft", monospace; font-size: clamp(24px, 9.5vw, 44px); line-height: 1.2; text-align: center; }
.bp-sub { color: var(--dim); text-align: center; font-size: 17px; }
.bp-row { display: flex; gap: 8px; align-items: stretch; }
.bp-grow { flex: 1; min-height: 0; }
.bp-mid { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; }
.bp-btn { appearance: none; -webkit-appearance: none; border: 3px solid var(--edge); border-radius: 14px; background: var(--panel); color: var(--ink);
  font-family: "FoxBox Pixel", "FoxBox Soft", monospace; font-size: 14px; line-height: 1.2; min-height: 52px; padding: 6px 10px; flex: 1; min-width: 0;
  touch-action: none; -webkit-tap-highlight-color: transparent; }
.bp-btn:active, .bp-btn.held { background: rgba(255,255,255,.26); transform: translateY(1px); }
.bp-btn.on { background: var(--c); border-color: #fff; }
.bp-go { background: var(--c); border-color: #fff; font-size: clamp(20px, 7.5vw, 30px); min-height: 76px; flex: none; width: 100%; box-shadow: 0 5px 0 rgba(0,0,0,.35); }
.bp-go:active { box-shadow: 0 2px 0 rgba(0,0,0,.35); transform: translateY(3px); }
.bp-chipbar { display: flex; gap: 8px; }
.bp-chipbar .bp-btn { min-height: 44px; font-size: 11px; }
.bp-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-family: "FoxBox Pixel", monospace; font-size: clamp(9px, 3vw, 12px); flex: none; }
.bp-head span { white-space: nowrap; }
.bp-head .bp-turn { color: #fff; background: var(--c); border-radius: 8px; padding: 7px 9px; }
.bp-head .bp-clock { color: #ffd84a; }
.bp-who { display: flex; align-items: center; justify-content: center; gap: 10px; }
.bp-dot { width: 18px; height: 18px; border-radius: 50%; border: 3px solid #fff; flex: none; }
/* the line-up (bowling test fixes, Nov 12; Lakota: "we don't need any of this on the phone, just controls; we see it on the
   TV"): no lane picture, no settings; MOVE, AIM and BOWL fill the screen, big enough for a thumb */
.bp-ctl { flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; gap: 8px; padding: 10px; border: 3px solid var(--edge); border-radius: 18px; background: rgba(0,0,0,.22); }
.bp-ctl-h { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-family: "FoxBox Pixel", monospace; font-size: 13px; color: var(--dim); padding: 0 4px; }
.bp-ctl-h b { color: var(--ink); font-size: clamp(15px, 5vw, 21px); font-weight: 400; white-space: nowrap; }
.bp-ctl-r { flex: 1; min-height: 0; display: flex; gap: 10px; }
.bp-ctl-r .bp-btn { min-height: 64px; height: 100%; border-radius: 16px; display: flex; align-items: center; justify-content: center; padding: 6px; }
.bp-ctl-r svg { width: clamp(40px, 15vw, 64px); height: clamp(40px, 15vw, 64px); fill: none; stroke: #fff; stroke-width: 7; stroke-linecap: square; stroke-linejoin: miter; pointer-events: none; }
.bp-ctl-r svg .f { fill: #fff; stroke: none; }
.bp-bowl.bp-go { flex: 1 1 0; min-height: 88px; max-height: 190px; font-size: clamp(30px, 11vw, 48px); border-radius: 20px; }
.bp-sheet { display: grid; gap: 4px; width: 100%; }
.bp-fr { border: 2px solid var(--edge); border-radius: 8px; background: rgba(0,0,0,.28); min-width: 0; text-align: center; padding: 3px 1px 4px; font-family: "FoxBox Pixel", monospace; }
.bp-fr.now { border-color: #fff; background: color-mix(in srgb, var(--c) 45%, rgba(0,0,0,.3)); }
.bp-fr i { display: block; font-style: normal; font-size: 8px; color: var(--dim); }
.bp-fr u { display: block; text-decoration: none; font-size: 11px; min-height: 15px; margin: 3px 0 2px; letter-spacing: .12em; }
.bp-fr s { display: block; text-decoration: none; font-size: 12px; min-height: 15px; }
.bp-total { text-align: center; font-family: "FoxBox Pixel", monospace; font-size: 13px; color: var(--dim); }
.bp-total b { color: var(--ink); font-size: 20px; font-weight: 400; }
.bp-card { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 12px; }
.bp-pips { display: flex; gap: 8px; justify-content: center; }
.bp-pips i { width: 10px; height: 10px; border-radius: 50%; background: var(--edge); }
.bp-pips i.on { background: #fff; }
.bp-swing { flex: 1; min-height: 0; border-radius: 18px; border: 4px dashed var(--edge); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; padding: 12px; }
.bp-swing.go { border-style: solid; border-color: #fff; background: var(--c); animation: bp-pulse .7s ease-in-out infinite alternate; }
@keyframes bp-pulse { from { filter: brightness(1); } to { filter: brightness(1.25); } }
@media (prefers-reduced-motion: reduce) { .bp-swing.go { animation: none; } }
.bp-meter { position: relative; width: 100%; height: 56px; border-radius: 28px; border: 3px solid var(--edge); background: rgba(0,0,0,.3); overflow: hidden; }
.bp-meter::before { content: ""; position: absolute; left: 50%; top: 6px; bottom: 6px; width: 3px; margin-left: -1.5px; background: var(--edge); }
.bp-meter i { position: absolute; top: 5px; left: 50%; width: 40px; height: 40px; margin-left: -20px; border-radius: 50%; background: var(--c); border: 3px solid #fff; will-change: transform; }
.bp-board { width: 100%; display: flex; flex-direction: column; gap: 6px; }
.bp-board div { display: flex; align-items: center; gap: 10px; border: 2px solid var(--edge); border-radius: 10px; padding: 8px 10px; font-family: "FoxBox Pixel", monospace; font-size: 12px; background: rgba(0,0,0,.25); }
.bp-board div.me { border-color: #fff; }
.bp-board span { flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bp-ballbox { flex: 1; min-height: 70px; display: flex; align-items: center; justify-content: center; }
.bp-chip { image-rendering: pixelated; display: block; flex: none; }
.bp-lab2 { display: flex; justify-content: space-between; align-items: baseline; font-family: "FoxBox Pixel", monospace; font-size: 10px; color: var(--dim); padding: 0 4px; }
.bp-lab2 b { color: var(--ink); font-size: 13px; font-weight: 400; }
.bp-strip { position: relative; display: flex; align-items: center; justify-content: center; gap: 10px; height: 76px; flex: none; border-radius: 14px; background: rgba(0,0,0,.3); border: 3px solid var(--edge); overflow: hidden; touch-action: none; }
.bp-strip.thin { height: 58px; }
.bp-strip > * { flex: none; }
.bp-strip .far { opacity: .45; }
.bp-strip::after { content: ""; position: absolute; left: 50%; top: 3px; bottom: 3px; width: 76px; margin-left: -38px; border: 4px solid #fff; border-radius: 12px; pointer-events: none; }
.bp-strip.thin::after { width: 56px; margin-left: -28px; }
.bp-strip i { width: 38px; height: 38px; border-radius: 50%; border: 3px solid rgba(10,20,40,.9); }
.bp-dbg { font: 11px/1.3 ui-monospace, monospace; color: #9fe; text-align: center; min-height: 14px; }
`;function NX(Z,Y={}){let j=(J)=>{try{Y.send?.(J)}catch{}},F=rJ(),_=!!Y.debug||/[?&]debug=1/.test(location.search);if(!document.getElementById("bp-css")){let J=document.createElement("style");J.id="bp-css",J.textContent=WX,document.head.appendChild(J)}Z.classList.add("bp"),Z.innerHTML=`
    <div class="bp-scr" data-s="load"><div class="bp-mid"><div class="bp-h">FOX BOWLING</div></div></div>

    <div class="bp-scr" data-s="pick" hidden>
      <div class="bp-h">YOUR BALL</div>
      <div class="bp-ballbox" data-k="pBox"><canvas class="bp-chip" data-k="pBig"></canvas></div>
      <div class="bp-lab2"><span>PATTERN</span><b data-k="pPat"></b></div>
      <div class="bp-strip" data-strip="pat" data-test="bowl-pick-pattern"></div>
      <div class="bp-lab2"><span>MAIN COLOUR</span><b data-k="pC1"></b></div>
      <div class="bp-strip thin" data-strip="c1" data-test="bowl-pick-c1"></div>
      <div class="bp-lab2"><span>SECOND COLOUR</span><b data-k="pC2"></b></div>
      <div class="bp-strip thin" data-strip="c2" data-test="bowl-pick-c2"></div>
      <button type="button" class="bp-btn" style="flex:none" data-k="pSurprise" data-native data-test="bowl-pick-surprise">SURPRISE ME</button>
      <button type="button" class="bp-btn bp-go" data-k="pDone" data-native data-test="bowl-pick-done">DONE</button>
    </div>

    <div class="bp-scr" data-s="picked" hidden>
      <div class="bp-mid">
        <div class="bp-h">YOUR BALL</div>
        <canvas class="bp-chip" data-k="kBig"></canvas>
        <div class="bp-sub" data-k="kName"></div>
      </div>
      <button type="button" class="bp-btn" style="flex:none" data-k="pChange" data-native data-test="bowl-pick-change">CHANGE</button>
    </div>

    <div class="bp-scr" data-s="cards" hidden>
      <div class="bp-card">
        <div class="bp-mid">
          <div class="bp-big" data-k="cardT"></div>
          <div class="bp-sub" data-k="cardB"></div>
          <div data-k="setup" hidden style="width:100%;display:flex;flex-direction:column;gap:10px">
            <div class="bp-row"><button type="button" class="bp-btn" data-hand="L" data-native data-test="bowl-lefty">LEFTY</button><button type="button" class="bp-btn" data-hand="R" data-native data-test="bowl-righty">RIGHTY</button></div>
            <div class="bp-row"><button type="button" class="bp-btn" data-bump="0" data-native data-test="bowl-bump-off">NO BUMPERS</button><button type="button" class="bp-btn" data-bump="1" data-native data-test="bowl-bump-on">BUMPERS</button></div>
          </div>
        </div>
        <div class="bp-pips"><i></i><i></i><i></i></div>
        <button type="button" class="bp-btn bp-go" data-k="cardGo" data-native data-test="bowl-card-ok">OK</button>
      </div>
    </div>

    <div class="bp-scr" data-s="wait" hidden>
      <div class="bp-mid">
        <div class="bp-who"><i class="bp-dot" data-k="wDot"></i><div class="bp-h" data-k="wWho"></div></div>
        <div class="bp-sub" data-k="wSub"></div>
        <div class="bp-big" data-k="wRes" hidden></div>
      </div>
      <div data-k="wSheet"></div>
      <div class="bp-chipbar" data-k="wChips">
        <button type="button" class="bp-btn" data-k="wHand" data-native data-test="bowl-hand"></button>
        <button type="button" class="bp-btn" data-k="wBump" data-native data-test="bowl-bump"></button>
      </div>
    </div>

    <div class="bp-scr" data-s="aim" hidden>
      <div class="bp-head"><span class="bp-turn">YOUR TURN</span><span data-k="aFrame"></span><span class="bp-clock" data-k="aClock"></span></div>
      <div class="bp-ctl">
        <div class="bp-ctl-h"><span>MOVE</span><b data-k="aX"></b></div>
        <div class="bp-ctl-r">
          <button type="button" class="bp-btn" data-move="-1" data-native data-test="bowl-move-l" aria-label="move left"><svg viewBox="0 0 64 64" aria-hidden="true"><path class="f" d="M12 32 L44 10 L44 54 Z"/></svg></button>
          <button type="button" class="bp-btn" data-move="1" data-native data-test="bowl-move-r" aria-label="move right"><svg viewBox="0 0 64 64" aria-hidden="true"><path class="f" d="M52 32 L20 10 L20 54 Z"/></svg></button>
        </div>
      </div>
      <div class="bp-ctl">
        <div class="bp-ctl-h"><span>AIM</span><b data-k="aA"></b></div>
        <div class="bp-ctl-r">
          <button type="button" class="bp-btn" data-turn="-1" data-native data-test="bowl-aim-l" aria-label="aim left"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M50 50 V36 A14 14 0 0 0 36 22 H22"/><path class="f" d="M8 22 L26 8 L26 36 Z"/></svg></button>
          <button type="button" class="bp-btn" data-turn="1" data-native data-test="bowl-aim-r" aria-label="aim right"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 50 V36 A14 14 0 0 1 28 22 H42"/><path class="f" d="M56 22 L38 8 L38 36 Z"/></svg></button>
        </div>
      </div>
      <button type="button" class="bp-btn bp-go bp-bowl" data-k="bowl" data-native data-test="bowl-go">BOWL</button>
    </div>

    <div class="bp-scr" data-s="ready" hidden>
      <div class="bp-head"><span class="bp-turn">YOUR TURN</span><span data-k="rFrame"></span><span class="bp-clock" data-k="rClock"></span></div>
      <div class="bp-swing" data-k="pad" data-native data-test="bowl-pad">
        <div class="bp-big" data-k="rT"></div>
        <div class="bp-sub" data-k="rB"></div>
      </div>
      <button type="button" class="bp-btn" style="flex:none" data-k="back" data-native data-test="bowl-back">BACK</button>
    </div>

    <div class="bp-scr" data-s="roll" hidden>
      <div class="bp-mid" data-k="tiltBox" data-native data-test="bowl-tilt">
        <div class="bp-big" data-k="tT"></div>
        <div class="bp-meter"><i data-k="tDot"></i></div>
        <div class="bp-sub" data-k="tB"></div>
      </div>
      <div class="bp-row" data-k="curve" hidden>
        <button type="button" class="bp-btn bp-go" style="flex:1;width:auto;min-height:120px" data-steer="-1" data-native data-test="bowl-curve-l">&#9664;</button>
        <button type="button" class="bp-btn bp-go" style="flex:1;width:auto;min-height:120px" data-steer="1" data-native data-test="bowl-curve-r">&#9654;</button>
      </div>
    </div>

    <div class="bp-scr" data-s="result" hidden>
      <div class="bp-mid"><div class="bp-big" data-k="resT"></div><div class="bp-h" data-k="resS"></div></div>
      <div data-k="resSheet"></div>
    </div>

    <div class="bp-scr" data-s="over" hidden>
      <div class="bp-mid"><div class="bp-big" data-k="oPlace"></div><div class="bp-sub" data-k="oScore"></div><div class="bp-board" data-k="oBoard"></div></div>
    </div>
    <div class="bp-dbg" data-k="dbg" ${_?"":"hidden"}></div>`;let X={};Z.querySelectorAll("[data-k]").forEach((J)=>X[J.dataset.k]=J);let K={};Z.querySelectorAll("[data-s]").forEach((J)=>K[J.dataset.s]=J);let q=(J,$)=>{if(J.textContent!==$)J.textContent=$},S=(J,$)=>{if(J.__h!==$)J.__h=$,J.innerHTML=$},Q=null,ZJ=!1,D=1,A="R",f=!1,O={x:0,aim:0},c=-1,G="off",z="swing",P=null,b=!1,a=0,YJ=0,V=0,y=null,l=null,W="",g="",v=0,i=0,n=0,r=(J)=>Math.floor(Math.random()*J),H={pat:r(s.length),c1:r(N.length),c2:0,touched:!1,done:!1,key:""};H.c2=(H.c1+1+r(N.length-1))%N.length;try{if(localStorage.getItem("fox-bowling-hand")==="L")A="L"}catch{}let h=(J)=>{try{navigator.vibrate?.(J)}catch{}},C=aJ({ios:OX,onSwing:(J)=>YX(J),onStill:()=>IJ()}),e=typeof window.DeviceMotionEvent<"u",o=e&&typeof DeviceMotionEvent.requestPermission==="function"?"unknown":"granted",t=!1,w=!1,L=0;function k(J){if(G===J)return;if(G=J,J!=="on"&&J!=="asking")z="flick";if(J==="on")z="swing";j({type:"motion",state:J}),x()}function UJ(J){if(document.hidden)return;let $=J.accelerationIncludingGravity||{},U=J.rotationRate||{},B=J.acceleration;if(![$.x,$.y,$.z,U.alpha,U.beta,U.gamma].some(xJ))return;if(!w){if(w=!0,clearTimeout(L),G!=="on")k("on")}C.feed({t:xJ(J.timeStamp)&&J.timeStamp>0?J.timeStamp:performance.now(),gi:$,rr:U,acc:B&&[B.x,B.y,B.z].some(xJ)?B:null})}function $J(J){if(J&&!t)t=!0,window.addEventListener("devicemotion",UJ);else if(!J&&t)t=!1,window.removeEventListener("devicemotion",UJ)}function QJ(){if(G==="on"&&t)return;if(w=!1,clearTimeout(L),!window.isSecureContext&&location.hostname!=="127.0.0.1"&&location.hostname!=="localhost")return k("insecure");if(!e)return k("unavailable");let J=()=>{$J(!0),k("on"),L=setTimeout(()=>{if(!w)k("nodata")},1800)};if(o==="granted")return J();k("asking");let $;try{$=DeviceMotionEvent.requestPermission()}catch{return k("denied")}Promise.resolve($).then((U)=>{o=U==="granted"?"granted":"denied",o==="granted"?J():k("denied")},()=>k("denied"))}let VJ=()=>!!Q&&Q.turn&&D===0;function JX(){if(!VJ()||Q.phase!=="aim")return;if(z==="swing"||G==="nodata")QJ();if(j({type:"line",x:O.x,aim:O.aim}),j({type:"arm"}),b=!1,P={s:"ready",until:performance.now()+900},z==="swing")C.arm();h(20),x()}function XX(){j({type:"disarm"}),C.disarm(),b=!1,P=null,x()}function IJ(){if(!VJ()||JJ()!=="ready")return;b=!0,j({type:"ready"}),h(40),x()}function CJ(J,$,U){if(!VJ()||JJ()!=="ready")return;l=U||{power:J,via:$},j({type:"throw",id:`${Q.id}`,speed:J,via:$}),b=!1,a=0,YJ=0,y=null,P={s:"roll",until:performance.now()+1500},h(J>0.7?[60,30,40]:[45]),x()}function YX(J){CJ(J.power,"swing",J)}let m=null;function ZX(J){if(z!=="flick"||JJ()!=="ready")return;m={id:J.pointerId,pts:[{t:J.timeStamp,y:J.clientY}],y0:J.clientY};try{X.pad.setPointerCapture(J.pointerId)}catch{}}function $X(J){if(m&&J.pointerId===m.id){if(m.pts.push({t:J.timeStamp,y:J.clientY}),m.pts.length>12)m.pts.shift()}}function QX(J){if(!m||J.pointerId!==m.id)return;let $=m;m=null;let U=$.y0-J.clientY,B=Math.max(320,window.innerHeight||640);if(U<50)return;let E=$.pts.find((u)=>J.timeStamp-u.t<=120)||$.pts[0],T=Math.max(16,J.timeStamp-E.t),M=(E.y-J.clientY)/B/(T/1000);CJ(Math.round(HJ((M-0.6)/3,0,1)*100)/100,"flick",null)}function KJ(){if(!(VJ()&&(Q.phase==="swing"||Q.phase==="roll"))&&!(P&&P.s==="roll")){if(YJ!==0)YJ=0,j({type:"steer",v:0});return}let $=y!=null?y:z==="swing"?C.tilt:a,U=performance.now();if(Math.abs($-YJ)>=0.02&&U-V>=50)YJ=$,V=U,j({type:"steer",v:$})}function NJ(){if(v=0,g!=="roll")return;let J=y!=null?y:z==="swing"?C.tilt:a,$=X.tDot.parentElement.clientWidth||300;if(X.tDot.style.transform=`translateX(${(J*($/2-28)).toFixed(1)}px)`,_)gJ();v=requestAnimationFrame(NJ)}function fJ(J,$){if(!VJ()||Q.phase!=="aim")return;O={x:Math.round(HJ(O.x+J,-BJ.xMax,BJ.xMax)*10)/10,aim:Math.round(HJ(O.aim+$,-BJ.aimMax,BJ.aimMax)*10)/10},j({type:"line",x:O.x,aim:O.aim}),PJ()}let p=null;function hJ(J,$){let U=()=>{if(p&&p.btn===J)clearTimeout(p.t),clearInterval(p.i),p=null;J.classList.remove("held")};J.addEventListener("pointerdown",(B)=>{B.preventDefault(),U(),$(),J.classList.add("held"),p={btn:J,t:setTimeout(()=>{if(p&&p.btn===J)p.i=setInterval($,80)},260),i:0}});for(let B of["pointerup","pointercancel","pointerleave"])J.addEventListener(B,U);J.addEventListener("contextmenu",(B)=>B.preventDefault())}Z.querySelectorAll("[data-move]").forEach((J)=>hJ(J,()=>fJ(+J.dataset.move*BJ.xStep,0))),Z.querySelectorAll("[data-turn]").forEach((J)=>hJ(J,()=>fJ(0,+J.dataset.turn*BJ.aimStep))),Z.querySelectorAll("[data-steer]").forEach((J)=>{let $=(B)=>{B.preventDefault(),a=+J.dataset.steer,J.classList.add("held"),KJ()},U=()=>{if(a===+J.dataset.steer)a=0;J.classList.remove("held"),KJ()};J.addEventListener("pointerdown",$);for(let B of["pointerup","pointercancel","pointerleave"])J.addEventListener(B,U);J.addEventListener("contextmenu",(B)=>B.preventDefault())});function PJ(){q(X.aX,O.x===0?"MIDDLE":`${Math.abs(O.x).toFixed(1)} ${O.x<0?"LEFT":"RIGHT"}`),q(X.aA,O.aim===0?"STRAIGHT":`${Math.abs(O.aim).toFixed(1)}° ${O.aim<0?"LEFT":"RIGHT"}`)}let jX=()=>Q&&Q.board&&Q.board[Q.you]&&Q.board[Q.you].color||"#6a3fd0";function JJ(){if(!Q)return"load";if(Q.over)return"over";if(Q.phase==="title"||Q.phase==="pick")return Q.pick&&Q.pick.done?"picked":"pick";if(D>0)return"cards";let J=performance.now();if(P&&J>P.until)P=null;if(Q.turn){if(Q.result)return"result";if(Q.phase==="aim")return P?P.s:"aim";if(Q.phase==="ready")return P&&P.s==="roll"?"roll":"ready";if(Q.phase==="swing"||Q.phase==="roll"||Q.phase==="pins")return"roll"}return"wait"}function kJ(J,$,U){let E=`<div class="bp-sheet" style="grid-template-columns:repeat(${$>5?5:$},1fr)">`;for(let T=0;T<$;T++){let M=J.frames&&J.frames[T]||{marks:[],total:null};E+=`<div class="bp-fr${T===U?" now":""}"><i>${T+1}</i><u>${TJ((M.marks||[]).join(" "))||"&nbsp;"}</u><s>${M.total==null?"&nbsp;":M.total}</s></div>`}return`${E}</div><div class="bp-total">TOTAL <b>${J.total|0}</b></div>`}let uJ=(J)=>`FRAME ${J.frame+1}/${J.frames} · ROLL ${J.ball+1}`,SJ=(J)=>J.timer==null?"":`0:${String(J.timer).padStart(2,"0")}`;function x(){if(!ZJ)return;let J=JJ();if(J!==g){g=J;for(let $ in K)K[$].hidden=$!==J;if(J!=="ready")m=null;if(J==="roll"&&!v)v=requestAnimationFrame(NJ)}if(Q)Z.style.setProperty("--c",jX());if(J==="pick"||J==="picked")BX(J);if(J==="cards"){let $=["","MAKE ROOM","HOLD ON TIGHT","HOW DO YOU BOWL?"],U=["","Stand where your arm can swing without hitting anyone or anything.","Grip your phone like you mean it. You swing your arm; the phone stays in your hand.",""];q(X.cardT,$[D]),q(X.cardB,U[D]),X.cardB.hidden=D===3,X.setup.hidden=D!==3,q(X.cardGo,D===3?"LET'S BOWL":"OK"),Z.querySelectorAll(".bp-pips i").forEach((B,E)=>B.classList.toggle("on",E===D-1)),Z.querySelectorAll("[data-hand]").forEach((B)=>B.classList.toggle("on",B.dataset.hand===A)),Z.querySelectorAll("[data-bump]").forEach((B)=>B.classList.toggle("on",B.dataset.bump==="1"===f))}else if(J==="wait"){let $=Q.bowler,U=$.i===Q.you,B=Q.result;X.wDot.style.background=$.color;let E=Q.phase==="intro"||Q.phase==="enter";if(q(X.wWho,U?E?"YOU BOWL FIRST":"YOU'RE UP":E?`${$.name} BOWLS FIRST`:`${$.name} IS BOWLING`),q(X.wSub,`FRAME ${Q.frame+1} OF ${Q.frames}${!U&&Q.next===Q.you?" · YOU'RE NEXT":""}`),X.wRes.hidden=!B,B)q(X.wRes,B.title);S(X.wSheet,kJ(Q.score,Q.frames,-1)),q(X.wHand,A==="L"?"LEFTY":"RIGHTY"),q(X.wBump,f?"BUMPERS ON":"BUMPERS OFF"),X.wBump.hidden=!Q.canBumpers,X.wBump.classList.toggle("on",f)}else if(J==="aim")q(X.aFrame,uJ(Q)),q(X.aClock,SJ(Q)),PJ();else if(J==="ready"){q(X.rFrame,uJ(Q)),q(X.rClock,SJ(Q));let $=z==="flick"||b||Q.still;if(X.pad.classList.toggle("go",$),z==="flick")q(X.rT,"FLICK UP"),q(X.rB,"Swipe up to bowl. Faster swipe, faster ball.");else if($)q(X.rT,"SWING!"),q(X.rB,"Arm back, then forward.");else q(X.rT,"HOLD STILL"),q(X.rB,G==="asking"?"Allow motion when your phone asks.":"Phone down by your side.")}else if(J==="roll"){let $=Q.phase!=="pins";if(X.curve.hidden=z==="swing"||!$,z==="swing")q(X.tT,$?"TILT TO CURVE":""),q(X.tB,$?"Tap to set level.":"");else q(X.tT,$?"HOLD TO CURVE":""),q(X.tB,"");X.tDot.parentElement.style.visibility=$?"":"hidden"}else if(J==="result"){let $=Q.result;q(X.resT,$.title),q(X.resS,$.sub||""),S(X.resSheet,kJ(Q.score,Q.frames,Q.frame));let U=`${Q.id}:${$.kind}`;if(W!==U){if(W=U,$.kind==="strike")h([80,40,80,40,160]);else if($.kind==="spare")h([70,40,120])}}else if(J==="over"){let $=Q.over.indexOf(Q.you);q(X.oPlace,$===0?"YOU WIN!":yX[$]||""),q(X.oScore,`YOUR SCORE: ${Q.score.total|0}`),S(X.oBoard,Q.over.map((U,B)=>{let E=Q.board[U];return`<div class="${U===Q.you?"me":""}"><b>${B+1}</b><i class="bp-dot" style="background:${TJ(E.color)}"></i><span>${TJ(E.name)}</span><b>${E.total|0}</b></div>`}).join(""))}if(_)gJ()}let EJ=()=>({pattern:s[H.pat],colors:[N[H.c1][1],N[H.c2][1]]}),AJ=(J,$)=>(J%$+$)%$,qX=()=>Math.max(70,Math.min(170,(X.pBox.clientHeight||150)-8,(X.pBox.clientWidth||300)-8));function BX(J){let $=EJ();if(J==="picked"){let M=Q.pick&&Q.pick.ball||$,u=Math.min(200,Math.round((Z.clientWidth||320)*0.5)),XJ=Math.max(32,Math.round(u/4)),mJ=`k:${JSON.stringify(M)}:${u}`;if(H.key!==mJ)H.key=mJ,X.kBig.style.width=X.kBig.style.height=`${u}px`,MJ(X.kBig,{pattern:M.pattern,colors:M.colors,n:XJ});let cJ=(_X)=>(N.find((FX)=>FX[1]===_X)||["",""])[0];q(X.kName,`${DJ[M.pattern]||""} · ${cJ(M.colors[0])} + ${cJ(M.colors[1])}`);return}let U=qX(),B=`p:${H.pat}:${H.c1}:${H.c2}:${U}`;if(H.key===B)return;H.key=B,q(X.pPat,DJ[$.pattern]),q(X.pC1,N[H.c1][0]),q(X.pC2,N[H.c2][0]),X.pBig.style.width=X.pBig.style.height=`${U}px`,MJ(X.pBig,{pattern:$.pattern,colors:$.colors,n:Math.max(32,Math.round(U/3.2)),y:0.4});let E=[-2,-1,0,1,2],T=Z.querySelector('[data-strip="pat"]');if(T.children.length!==5)T.innerHTML=E.map((M)=>`<canvas class="bp-chip${M?" far":""}" data-d="${M}" style="width:${M?44:60}px;height:${M?44:60}px"></canvas>`).join("");[...T.children].forEach((M)=>{let u=+M.dataset.d;MJ(M,{pattern:s[AJ(H.pat+u,s.length)],colors:$.colors,n:u?22:30})});for(let M of["c1","c2"]){let u=Z.querySelector(`[data-strip="${M}"]`);u.innerHTML=E.map((XJ)=>`<i class="${XJ?"far":""}" data-d="${XJ}" style="background:${N[AJ(H[M]+XJ,N.length)][1]}"></i>`).join("")}}function _J(J){H.touched=!0,j({type:"ball",...EJ(),...J!=null?{done:J}:{}})}function OJ(J,$){if(JJ()!=="pick")return;H[J]=AJ(H[J]+$,J==="pat"?s.length:N.length),h(8),_J(),x()}Z.querySelectorAll("[data-strip]").forEach((J)=>{let $=J.dataset.strip,U=null;J.addEventListener("pointerdown",(B)=>{B.preventDefault(),U={x:B.clientX,id:B.pointerId};try{J.setPointerCapture(B.pointerId)}catch{}}),J.addEventListener("pointerup",(B)=>{if(!U||B.pointerId!==U.id)return;let E=B.clientX-U.x;if(U=null,Math.abs(E)>24)return OJ($,E<0?1:-1);let T=J.getBoundingClientRect(),M=B.clientX-(T.left+T.width/2),XJ=Math.max(-2,Math.min(2,Math.round(M/($==="pat"?54:48))));if(XJ)OJ($,XJ)}),J.addEventListener("pointercancel",()=>U=null)}),X.pSurprise.addEventListener("click",()=>{if(JJ()!=="pick")return;H.pat=r(s.length),H.c1=r(N.length),H.c2=(H.c1+1+r(N.length-1))%N.length,h(15),_J(),x()}),X.pDone.addEventListener("click",()=>{if(JJ()!=="pick")return;h([30,30,60]),_J(!0)}),X.pChange.addEventListener("click",()=>{if(JJ()!=="picked")return;_J(!1)});function gJ(){let J=l;q(X.dbg,`${G}/${z} ${C.readings} · ${J?J.peakDps!=null?`swing ${J.peakDps}°/s ${J.peakLin}m/s² x${J.bursts} p${J.power}`:`flick p${J.power}`:"no throw yet"} · tilt ${C.tilt.toFixed(2)}${Object.keys(F).length?" · tuned":""}`)}X.cardGo.addEventListener("click",()=>{if(D===1||D===2){D++,x();return}if(D!==3)return;QJ(),D=0,j({type:"hand",hand:A}),j({type:"bumpers",on:f}),x()}),Z.querySelectorAll("[data-hand]").forEach((J)=>J.addEventListener("click",()=>vJ(J.dataset.hand))),Z.querySelectorAll("[data-bump]").forEach((J)=>J.addEventListener("click",()=>wJ(J.dataset.bump==="1")));function vJ(J){A=J==="L"?"L":"R";try{localStorage.setItem("fox-bowling-hand",A)}catch{}if(D===0)j({type:"hand",hand:A});x()}function wJ(J){if(Q&&!Q.canBumpers)return;if(f=!!J,D===0)j({type:"bumpers",on:f});x()}X.wHand.addEventListener("click",()=>vJ(A==="L"?"R":"L")),X.wBump.addEventListener("click",()=>wJ(!f)),X.bowl.addEventListener("click",JX),X.back.addEventListener("click",XX),X.pad.addEventListener("pointerdown",ZX),X.pad.addEventListener("pointermove",$X),X.pad.addEventListener("pointerup",QX),X.pad.addEventListener("pointercancel",()=>m=null),X.tiltBox.addEventListener("pointerdown",()=>{if(z==="swing")C.recenter(),h(15)});function UX(J){if(!J||J.type!=="view")return;let $=!Q;if(Q&&J.id<Q.id)c=-1,W="",P=null;if(Q=J,J.pick&&J.pick.ball&&!H.touched){let B=J.pick.ball,E=s.indexOf(B.pattern),T=N.findIndex((u)=>u[1]===B.colors[0]),M=N.findIndex((u)=>u[1]===B.colors[1]);if(E>=0)H.pat=E;if(T>=0)H.c1=T;if(M>=0)H.c2=M;H.touched=!0,H.key=""}if(J.turn&&J.id!==c&&J.line)c=J.id,O={x:J.line.x,aim:J.line.aim},b=!1;if(P&&(P.s==="ready"&&J.phase==="ready"||P.s==="roll"&&(J.phase==="swing"||J.phase==="roll")))P=null;let U=performance.now();if(C.armed&&!(J.turn&&J.phase==="ready")&&!(P&&P.s==="ready"))C.disarm(),b=!1;if(J.turn&&J.phase==="ready"&&z==="swing"&&!C.armed&&!C.busy&&!(P&&P.s==="roll"))C.arm();if(!(J.turn&&(J.phase==="swing"||J.phase==="roll"||J.phase==="ready"))&&!P)C.stopTilt();if(D===0&&U-n>500&&(J.hand!==A||J.canBumpers&&J.bumpers!==f)){if(n=U,J.hand!==A)j({type:"hand",hand:A});if(J.canBumpers&&J.bumpers!==f)j({type:"bumpers",on:f})}if(!J.canBumpers)f=!!J.bumpers;if($&&D===0)j({type:"motion",state:G});x()}function pJ(J,$){if(J=!!J,$&&$.state==="lobby")D=1,Q=null,P=null,c=-1,H.touched=!1,H.key="";if(J===ZJ){if(J)x();return}if(ZJ=J,J){if(j({type:"hello"}),G==="on")$J(!0);i=setInterval(KJ,50),x()}else{if($J(!1),C.disarm(),C.stopTilt(),clearInterval(i),i=0,v)cancelAnimationFrame(v);v=0,g=""}}let bJ=()=>{if(g==="aim")PJ();if(g==="pick"||g==="picked")H.key="",x()};window.addEventListener("resize",bJ);function VX(){if(pJ(!1),window.removeEventListener("resize",bJ),clearTimeout(L),p)clearTimeout(p.t),clearInterval(p.i),p=null;if(Z.classList.remove("bp"),Z.innerHTML="",window.__bowlPad===dJ)delete window.__bowlPad}let dJ={get state(){return{screen:g,card:D,motion:G,mode:z,hand:A,bumpers:f,line:{...O},still:b,armed:C.armed,tilt:C.tilt,lastSwing:l,view:Q,ball:EJ()}},pickStep(J,$){OJ(J,$)},pickDone(){_J(!0)},tune:R,skipCards(){D=0,j({type:"hand",hand:A}),j({type:"bumpers",on:f}),x()},useFlick(){z="flick",x()},fakeSwing(J=0.5){CJ(HJ(+J||0,0,1),"swing",{power:J,peakDps:0,peakLin:0,bursts:0,fake:!0})},steer(J){y=J==null?null:HJ(+J||0,-1,1),KJ()},still(){IJ()},feed(J){C.feed(J)},det:C};return window.__bowlPad=dJ,{onMessage:UX,show:pJ,release:VX}}export{NX as createBowlingPad};
