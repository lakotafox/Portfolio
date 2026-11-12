var D={OPEN_DPS:220,STRONG_DPS:750,FIRE_FRAC:0.7,SETTLE_DPS:100,SETTLE_FRAC:0.35,SETTLE_MS:60,MAX_MS:900,BACK_MS:320,MIN_LIN:3,STILL_DPS:60,STILL_MS:450,POWER_DPS:[250,1000],POWER_LIN:[5,30],TILT_DEG:25,TILT_DEAD:4,TILT_SIGN:1,TILT_AXIS:0,TILT_CALM_DPS:120,TILT_CALM_MS:150,TILT_WAIT_MS:700},jZ=JSON.parse(JSON.stringify(D));function qZ(Q){let $={},B;try{B=new URLSearchParams(Q??(globalThis.location?location.search:""))}catch{return $}for(let[K,F]of B){if(!K.startsWith("swing."))continue;let Z=K.slice(6);if(!(Z in D))continue;let M=F.split(",").map(Number);if(!M.every(Number.isFinite))continue;D[Z]=Array.isArray(jZ[Z])?[M[0],M[1]??jZ[Z][1]]:M[0],$[Z]=D[Z]}return $}var vJ=(Q)=>typeof Q==="number"&&Number.isFinite(Q),h=(Q)=>vJ(Q)?Q:0,EJ=(Q,$,B)=>Math.max($,Math.min(B,Q));function GZ(Q,$){let[B,K]=D.POWER_DPS,[F,Z]=D.POWER_LIN,M=EJ((h(Q)-B)/(K-B),0,1),V=$==null?M:EJ((h($)-F)/(Z-F),0,1);return Math.round((0.6*M+0.4*V)*100)/100}function UZ({ios:Q=!1,onSwing:$=()=>{},onStill:B=()=>{}}={}){let K=Q?-1:1,F=null,Z=null,M=null,V=!1,g=0,q=0,_J=0,C=null,G=!1,N=0,P=0,l=null,L=0,O=null;function E({t:X,gi:T={},rr:a={},acc:I=null}){_J++;let w=q?EJ((X-q)/1000,0.001,0.05):0.016666666666666666;q=X;let b=h(T.x),n=h(T.y),QJ=h(T.z),i=!!I&&[I.x,I.y,I.z].some(vJ);if(i)b-=h(I.x),n-=h(I.y),QJ-=h(I.z);let H=Math.hypot(b,n,QJ);if(H>1){let p={x:K*b/H,y:K*n/H,z:K*QJ/H};if(!F)F=p;else{let x=1-Math.exp(-w/(i?0.05:0.15)),v=F.x+(p.x-F.x)*x,HJ=F.y+(p.y-F.y)*x,YJ=F.z+(p.z-F.z)*x,BJ=Math.hypot(v,HJ,YJ)||1;F={x:v/BJ,y:HJ/BJ,z:YJ/BJ}}}let S=h(a.alpha),A=h(a.beta),jJ=h(a.gamma),c=Math.hypot(S,A,jJ),JJ=i||[T.x,T.y,T.z].some(vJ),ZJ=i?Math.hypot(h(I.x),h(I.y),h(I.z)):Math.abs(Math.hypot(h(T.x),h(T.y),h(T.z))-9.81);if(G)UJ(X,c,w);if(!V)return;if(Z){if(c>Z.peak)Z.peak=c,Z.peakT=X;if(Z.lin=Math.max(Z.lin,ZJ),c>D.OPEN_DPS*0.5){let x=Math.hypot(Z.ax,Z.ay,Z.az),v=x>1?(S*Z.ax+A*Z.ay+jJ*Z.az)/x:c;if(!Z.second&&v<-D.OPEN_DPS&&(!JJ||Z.lin>=D.MIN_LIN||Z.peak>=D.OPEN_DPS)){Z={t0:X,peak:c,peakT:X,lin:ZJ,ax:S,ay:A,az:jJ,quietSince:0,second:!0,fired:!1};return}if(v>=0)Z.ax+=S,Z.ay+=A,Z.az+=jJ}if(!Z.fired&&(Z.second||Z.peak>=D.STRONG_DPS)&&c<=Z.peak*D.FIRE_FRAC)d(Z,JJ,X);if(!V||!Z)return;if(c<Math.max(D.SETTLE_DPS,Z.peak*D.SETTLE_FRAC))Z.quietSince||=X;else Z.quietSince=0;if(Z.quietSince&&X-Z.quietSince>=D.SETTLE_MS||X-Z.t0>=D.MAX_MS){let x=Z;if(Z=null,x.second||x.peak>=D.STRONG_DPS)d(x,JJ,X);else if(!JJ||x.lin>=D.MIN_LIN)M={until:X+D.BACK_MS,first:x,linKnown:JJ}}return}if(c>D.OPEN_DPS){Z={t0:X,peak:c,peakT:X,lin:ZJ,ax:S,ay:A,az:jJ,quietSince:0,second:!!M,fired:!1},M=null,g=0;return}if(M&&X>=M.until){let p=M;M=null,d(p.first,p.linKnown,X);return}if(!M&&c<D.STILL_DPS){if(g||=X,X-g>=D.STILL_MS)g=X+1e9,B()}else if(!M)g=0}function d(X,T,a){if(X.fired)return;if(X.fired=!0,T&&X.lin<D.MIN_LIN){if(Z===X)Z=null;return}V=!1,Z=null,M=null;let I=Math.hypot(X.ax,X.ay,X.az);C=I>1?{x:X.ax/I,y:X.ay/I,z:X.az/I}:null,G=!0,N=a,P=0,l=null,L=0,O={t:X.peakT,power:GZ(X.peak,T?X.lin:null),peakDps:Math.round(X.peak),peakLin:Math.round(X.lin*10)/10,bursts:X.second?2:1},$(O)}function t(){if(!F)return 0;return C&&!D.TILT_AXIS?F.x*C.x+F.y*C.y+F.z*C.z:F.x}function UJ(X,T,a){if(!F)return;if(l==null){if(T<D.TILT_CALM_DPS)P||=X;else P=0;if(P&&X-P>=D.TILT_CALM_MS||X-N>=D.TILT_WAIT_MS)l=t();else return}let I=EJ(t()-l,-1,1),w=-D.TILT_SIGN*Math.asin(I)*57.2958,b=Math.max(1,D.TILT_DEG-D.TILT_DEAD),n=Math.abs(w)-D.TILT_DEAD,QJ=n<=0?0:EJ(n/b,0,1)*Math.sign(w);L+=(QJ-L)*(1-Math.exp(-a/0.06))}return{feed:E,arm(){V=!0,Z=null,M=null,g=0,G=!1,L=0},disarm(){V=!1,Z=null,M=null},stopTilt(){G=!1,L=0},recenter(){if(G&&F)l=t(),L=0},get armed(){return V},get busy(){return!!Z||!!M},get tilt(){return G?Math.round(L*100)/100||0:0},get tiltReady(){return G&&l!=null},get up(){return F&&{...F}},get axis(){return C&&{...C}},get last(){return O},get readings(){return _J}}}var TJ=(Q,$=0)=>{let B=Math.sqrt(1-$*$);return[$,Math.cos(Q)*B,-Math.sin(Q)*B]},TZ=[[TJ(0.2,-0.2),0.125],[TJ(0.2,0.2),0.125],[TJ(0.8200000000000001),0.15]],IZ=TJ(3.2,0.18);function _Z(Q){let $=(0.45-Q)/2;return[Math.sin($),0,0,Math.cos($)]}var KJ=(Q)=>`vec3(${Q.map(($)=>$.toFixed(5)).join(", ")})`,e=["marble","swirl","stripe","halves","dots","galaxy","zigzag","plain","panels","rings","checker","tiger"],IJ={marble:"MARBLE",swirl:"SWIRL",stripe:"STRIPE",halves:"HALVES",dots:"DOTS",galaxy:"GALAXY",zigzag:"ZIGZAG",plain:"PLAIN",panels:"BEACH BALL",rings:"RINGS",checker:"CHECKER",tiger:"TIGER"},YZ=(Q)=>Math.max(0,e.indexOf(Q)),gJ=(Q)=>{let $=Math.hypot(...Q);return Q.map((B)=>B/$)},BZ=(Q,$)=>[Q[1]*$[2]-Q[2]*$[1],Q[2]*$[0]-Q[0]*$[2],Q[0]*$[1]-Q[1]*$[0]],VZ=(Q,$)=>{let B=gJ($),K=gJ(BZ(B,[0.31,-0.2,0.93])),F=BZ(B,K);return`const vec3 ${Q}N = ${KJ(B)}, ${Q}U = ${KJ(K)}, ${Q}W = ${KJ(F)};`},FJ=(1+Math.sqrt(5))/2,LZ=(Q)=>{let[$,B,K]=Q,F=Math.cos(0.5),Z=Math.sin(0.5),M=Math.cos(0.33),V=Math.sin(0.33),g=B*F-K*Z,q=B*Z+K*F;return[$*M+q*V,g,-$*V+q*M]},wJ=[];for(let Q of[-1,1])for(let $ of[-1,1]){for(let B of[-1,1])wJ.push([Q,$,B]);wJ.push([0,Q/FJ,$*FJ],[Q/FJ,$*FJ,0],[Q*FJ,0,$/FJ])}var XZ=`
${VZ("AX",[0.35,0.8,0.49])}
${VZ("BX",[-0.42,0.55,0.72])}
const vec3 BALL_DOTS[20] = vec3[20](${wJ.map((Q)=>KJ(gJ(LZ(Q)))).join(", ")});
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
  float m = dot(d, ${KJ(IZ)});
  if (m > ${Math.cos(0.105).toFixed(5)}) c = vec3(1.0, 0.824, 0.247);
  else if (m < ${Math.cos(0.2).toFixed(5)} && m > ${Math.cos(0.3).toFixed(5)}) c = vec3(1.0, 0.98, 0.9);
  // the holes: dark, no shine
${TZ.map(([Q,$])=>`  if (dot(d, ${KJ(Q)}) > ${Math.cos($).toFixed(5)}) { c = mix(base, ink, 0.9); shine = 0.0; }`).join(`
`)}
  return vec4(c, shine);
}`;var u=[["RED","#ff5a3c"],["BLUE","#2f8fff"],["GREEN","#35d07f"],["GOLD","#ffd23f"],["PURPLE","#6a3fd0"],["PINK","#ff7fd1"],["AQUA","#27d3e6"],["ORANGE","#ff9a2e"],["WHITE","#fdfdf5"],["BLACK","#262c44"],["SILVER","#aab4cc"],["LIME","#b6e23a"]];var zZ=`#version 300 es
void main() { vec2 p = vec2(float(gl_VertexID % 2) * 4.0 - 1.0, float(gl_VertexID / 2) * 4.0 - 1.0); gl_Position = vec4(p, 0.0, 1.0); }`,NZ=`#version 300 es
precision highp float;
uniform vec2 uRes; uniform vec3 uBase; uniform vec4 uTwo, uQ; uniform int uPat;
out vec4 o;
${XZ}
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
}`,FZ=(Q)=>{let $=parseInt(String(Q).replace("#",""),16);return[($>>16&255)/255,($>>8&255)/255,($&255)/255]},fZ=(Q,$)=>[Q[3]*$[0]+Q[0]*$[3]+Q[1]*$[2]-Q[2]*$[1],Q[3]*$[1]-Q[0]*$[2]+Q[1]*$[3]+Q[2]*$[0],Q[3]*$[2]+Q[0]*$[1]-Q[1]*$[0]+Q[2]*$[3],Q[3]*$[3]-Q[0]*$[0]-Q[1]*$[1]-Q[2]*$[2]],bJ=null,pJ=!1;function xZ(){let Q=document.createElement("canvas"),$=Q.getContext("webgl2",{alpha:!0,premultipliedAlpha:!1,antialias:!1,preserveDrawingBuffer:!0});if(!$)throw Error("no webgl2");let B=(Z,M)=>{let V=$.createShader(Z);if($.shaderSource(V,M),$.compileShader(V),!$.getShaderParameter(V,$.COMPILE_STATUS))throw Error($.getShaderInfoLog(V));return V},K=$.createProgram();if($.attachShader(K,B($.VERTEX_SHADER,zZ)),$.attachShader(K,B($.FRAGMENT_SHADER,NZ)),$.linkProgram(K),!$.getProgramParameter(K,$.LINK_STATUS))throw Error($.getProgramInfoLog(K));$.useProgram(K);let F={};for(let Z of["uRes","uBase","uTwo","uQ","uPat"])F[Z]=$.getUniformLocation(K,Z);return{cv:Q,gl:$,u:F}}function hZ(Q,$,B){Q.width=Q.height=$;let K=Q.getContext("2d"),F=$/2-1;K.clearRect(0,0,$,$),K.fillStyle="#0a1428",K.beginPath(),K.arc($/2,$/2,F+1,0,6.2832),K.fill(),K.fillStyle=B[0],K.beginPath(),K.arc($/2,$/2,F,0,6.2832),K.fill(),K.fillStyle=B[1]||B[0],K.fillRect($*0.18,$*0.42,$*0.64,$*0.16)}function LJ(Q,$){let B=$.n||40,K=$.colors||["#6a3fd0"];if(!pJ&&!bJ)try{bJ=xZ()}catch{pJ=!0}if(pJ)return hZ(Q,B,K);let{cv:F,gl:Z,u:M}=bJ;F.width=F.height=B,Z.viewport(0,0,B,B),Z.clearColor(0,0,0,0),Z.clear(Z.COLOR_BUFFER_BIT);let V=$.y||0,g=fZ([0,Math.sin(V/2),0,Math.cos(V/2)],_Z($.a??1.1));Z.uniform2f(M.uRes,B,B),Z.uniform3fv(M.uBase,FZ(K[0])),Z.uniform4f(M.uTwo,...FZ(K[1]||K[0]),1),Z.uniform4fv(M.uQ,g),Z.uniform1i(M.uPat,YZ($.pattern)),Z.drawArrays(Z.TRIANGLES,0,3),Q.width=Q.height=B;let q=Q.getContext("2d");q.clearRect(0,0,B,B),q.drawImage(F,0,0)}var RJ={xMax:16,aimMax:3,xStep:0.5,aimStep:0.1},VJ=20.75,mJ=30,dJ=714,uZ=10.3923,kZ=[[0,0],[-6,1],[6,1],[-12,2],[0,2],[12,2],[-18,3],[-6,3],[6,3],[18,3]].map(([Q,$])=>[Q,720+$*uZ]),SZ=/iPhone|iPad|iPod/.test(navigator.userAgent)||navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1,cJ=(Q)=>typeof Q==="number"&&Number.isFinite(Q),OJ=(Q,$,B)=>Math.max($,Math.min(B,Q)),rJ=(Q)=>String(Q??"").replace(/[&<>"]/g,($)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[$]),vZ=["1ST","2ND","3RD","4TH","5TH","6TH","7TH","8TH"],gZ=`
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
.bp-link { background: none; border-color: transparent; color: var(--dim); font-size: 11px; min-height: 40px; flex: 0 1 auto; padding: 6px 4px; border-width: 0; }
.bp-arrow { flex: none; width: 76px; font-size: 22px; }
.bp-lab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: "FoxBox Pixel", monospace; font-size: 12px; color: var(--dim); gap: 4px; }
.bp-lab b { color: var(--ink); font-size: 14px; font-weight: 400; }
.bp-chipbar { display: flex; gap: 8px; }
.bp-chipbar .bp-btn { min-height: 44px; font-size: 11px; }
.bp-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-family: "FoxBox Pixel", monospace; font-size: 12px; }
.bp-head .bp-turn { color: #fff; background: var(--c); border-radius: 8px; padding: 7px 9px; }
.bp-head .bp-clock { color: #ffd84a; }
.bp-who { display: flex; align-items: center; justify-content: center; gap: 10px; }
.bp-dot { width: 18px; height: 18px; border-radius: 50%; border: 3px solid #fff; flex: none; }
.bp-lane { flex: 1; min-height: 110px; width: 100%; border-radius: 12px; display: block; }
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
.bp-note { color: #ffd84a; text-align: center; font-size: 15px; }
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
`;function rZ(Q,$={}){let B=(J)=>{try{$.send?.(J)}catch{}},K=qZ(),F=!!$.debug||/[?&]debug=1/.test(location.search);if(!document.getElementById("bp-css")){let J=document.createElement("style");J.id="bp-css",J.textContent=gZ,document.head.appendChild(J)}Q.classList.add("bp"),Q.innerHTML=`
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
      <canvas class="bp-lane" data-k="lane"></canvas>
      <div class="bp-row">
        <button type="button" class="bp-btn bp-arrow" data-move="-1" data-native data-test="bowl-move-l">&#9664;</button>
        <div class="bp-lab">MOVE<b data-k="aX"></b></div>
        <button type="button" class="bp-btn bp-arrow" data-move="1" data-native data-test="bowl-move-r">&#9654;</button>
      </div>
      <div class="bp-row">
        <button type="button" class="bp-btn bp-arrow" data-turn="-1" data-native data-test="bowl-aim-l">&#8630;</button>
        <div class="bp-lab">AIM<b data-k="aA"></b></div>
        <button type="button" class="bp-btn bp-arrow" data-turn="1" data-native data-test="bowl-aim-r">&#8631;</button>
      </div>
      <button type="button" class="bp-btn bp-go" data-k="bowl" data-native data-test="bowl-go">BOWL</button>
      <div class="bp-row" style="justify-content:center">
        <button type="button" class="bp-btn bp-link" data-k="mode" data-native data-test="bowl-mode"></button>
        <button type="button" class="bp-btn bp-link" data-k="aBump" data-native data-test="bowl-bump2"></button>
      </div>
      <div class="bp-note" data-k="aNote" hidden></div>
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
    <div class="bp-dbg" data-k="dbg" ${F?"":"hidden"}></div>`;let Z={};Q.querySelectorAll("[data-k]").forEach((J)=>Z[J.dataset.k]=J);let M={};Q.querySelectorAll("[data-s]").forEach((J)=>M[J.dataset.s]=J);let V=(J,j)=>{if(J.textContent!==j)J.textContent=j},g=(J,j)=>{if(J.__h!==j)J.__h=j,J.innerHTML=j},q=null,_J=!1,C=1,G="R",N=!1,P={x:0,aim:0},l=-1,L="off",O="swing",E=null,d=!1,t=0,UJ=0,X=0,T=null,a=null,I="",w="",b=0,n=0,QJ=0,i=(J)=>Math.floor(Math.random()*J),H={pat:i(e.length),c1:i(u.length),c2:0,touched:!1,done:!1,key:""};H.c2=(H.c1+1+i(u.length-1))%u.length;try{if(localStorage.getItem("fox-bowling-hand")==="L")G="L"}catch{}let S=(J)=>{try{navigator.vibrate?.(J)}catch{}},A=UZ({ios:SZ,onSwing:(J)=>MZ(J),onStill:()=>lJ()}),jJ=typeof window.DeviceMotionEvent<"u",JJ=jJ&&typeof DeviceMotionEvent.requestPermission==="function"?"unknown":"granted",ZJ=!1,p=!1,x=0;function v(J){if(L===J)return;if(L=J,J!=="on"&&J!=="asking")O="flick";if(J==="on")O="swing";B({type:"motion",state:J}),f()}function HJ(J){if(document.hidden)return;let j=J.accelerationIncludingGravity||{},Y=J.rotationRate||{},_=J.acceleration;if(![j.x,j.y,j.z,Y.alpha,Y.beta,Y.gamma].some(cJ))return;if(!p){if(p=!0,clearTimeout(x),L!=="on")v("on")}A.feed({t:cJ(J.timeStamp)&&J.timeStamp>0?J.timeStamp:performance.now(),gi:j,rr:Y,acc:_&&[_.x,_.y,_.z].some(cJ)?_:null})}function YJ(J){if(J&&!ZJ)ZJ=!0,window.addEventListener("devicemotion",HJ);else if(!J&&ZJ)ZJ=!1,window.removeEventListener("devicemotion",HJ)}function BJ(){if(L==="on"&&ZJ)return;if(p=!1,clearTimeout(x),!window.isSecureContext&&location.hostname!=="127.0.0.1"&&location.hostname!=="localhost")return v("insecure");if(!jJ)return v("unavailable");let J=()=>{YJ(!0),v("on"),x=setTimeout(()=>{if(!p)v("nodata")},1800)};if(JJ==="granted")return J();v("asking");let j;try{j=DeviceMotionEvent.requestPermission()}catch{return v("denied")}Promise.resolve(j).then((Y)=>{JJ=Y==="granted"?"granted":"denied",JJ==="granted"?J():v("denied")},()=>v("denied"))}let KZ={denied:"Motion is switched off for this page, so this phone bowls by flick.",insecure:"Motion needs the secure (https) link, so this phone bowls by flick.",unavailable:"This phone has no motion sensor, so it bowls by flick.",nodata:"This phone sent no motion, so it bowls by flick."},MJ=()=>!!q&&q.turn&&C===0;function RZ(){if(!MJ()||q.phase!=="aim")return;if(O==="swing")BJ();if(B({type:"line",x:P.x,aim:P.aim}),B({type:"arm"}),d=!1,E={s:"ready",until:performance.now()+900},O==="swing")A.arm();S(20),f()}function HZ(){B({type:"disarm"}),A.disarm(),d=!1,E=null,f()}function lJ(){if(!MJ()||qJ()!=="ready")return;d=!0,B({type:"ready"}),S(40),f()}function zJ(J,j,Y){if(!MJ()||qJ()!=="ready")return;a=Y||{power:J,via:j},B({type:"throw",id:`${q.id}`,speed:J,via:j}),d=!1,t=0,UJ=0,T=null,E={s:"roll",until:performance.now()+1500},S(J>0.7?[60,30,40]:[45]),f()}function MZ(J){zJ(J.power,"swing",J)}let r=null;function DZ(J){if(O!=="flick"||qJ()!=="ready")return;r={id:J.pointerId,pts:[{t:J.timeStamp,y:J.clientY}],y0:J.clientY};try{Z.pad.setPointerCapture(J.pointerId)}catch{}}function CZ(J){if(r&&J.pointerId===r.id){if(r.pts.push({t:J.timeStamp,y:J.clientY}),r.pts.length>12)r.pts.shift()}}function PZ(J){if(!r||J.pointerId!==r.id)return;let j=r;r=null;let Y=j.y0-J.clientY,_=Math.max(320,window.innerHeight||640);if(Y<50)return;let U=j.pts.find((y)=>J.timeStamp-y.t<=120)||j.pts[0],W=Math.max(16,J.timeStamp-U.t),R=(U.y-J.clientY)/_/(W/1000);zJ(Math.round(OJ((R-0.6)/3,0,1)*100)/100,"flick",null)}function WJ(){if(!(MJ()&&(q.phase==="swing"||q.phase==="roll"))&&!(E&&E.s==="roll")){if(UJ!==0)UJ=0,B({type:"steer",v:0});return}let j=T!=null?T:O==="swing"?A.tilt:t,Y=performance.now();if(Math.abs(j-UJ)>=0.02&&Y-X>=50)UJ=j,X=Y,B({type:"steer",v:j})}function aJ(){if(b=0,w!=="roll")return;let J=T!=null?T:O==="swing"?A.tilt:t,j=Z.tDot.parentElement.clientWidth||300;if(Z.tDot.style.transform=`translateX(${(J*(j/2-28)).toFixed(1)}px)`,F)eJ();b=requestAnimationFrame(aJ)}function iJ(J,j){if(!MJ()||q.phase!=="aim")return;P={x:Math.round(OJ(P.x+J,-RJ.xMax,RJ.xMax)*10)/10,aim:Math.round(OJ(P.aim+j,-RJ.aimMax,RJ.aimMax)*10)/10},B({type:"line",x:P.x,aim:P.aim}),NJ()}let m=null;function sJ(J,j){let Y=()=>{if(m&&m.btn===J)clearTimeout(m.t),clearInterval(m.i),m=null;J.classList.remove("held")};J.addEventListener("pointerdown",(_)=>{_.preventDefault(),Y(),j(),J.classList.add("held"),m={btn:J,t:setTimeout(()=>{if(m&&m.btn===J)m.i=setInterval(j,80)},260),i:0}});for(let _ of["pointerup","pointercancel","pointerleave"])J.addEventListener(_,Y);J.addEventListener("contextmenu",(_)=>_.preventDefault())}Q.querySelectorAll("[data-move]").forEach((J)=>sJ(J,()=>iJ(+J.dataset.move*RJ.xStep,0))),Q.querySelectorAll("[data-turn]").forEach((J)=>sJ(J,()=>iJ(0,+J.dataset.turn*RJ.aimStep))),Q.querySelectorAll("[data-steer]").forEach((J)=>{let j=(_)=>{_.preventDefault(),t=+J.dataset.steer,J.classList.add("held"),WJ()},Y=()=>{if(t===+J.dataset.steer)t=0;J.classList.remove("held"),WJ()};J.addEventListener("pointerdown",j);for(let _ of["pointerup","pointercancel","pointerleave"])J.addEventListener(_,Y);J.addEventListener("contextmenu",(_)=>_.preventDefault())});function NJ(){V(Z.aX,P.x===0?"MIDDLE":`${Math.abs(P.x).toFixed(1)} ${P.x<0?"LEFT":"RIGHT"}`),V(Z.aA,P.aim===0?"STRAIGHT":`${Math.abs(P.aim).toFixed(1)}° ${P.aim<0?"LEFT":"RIGHT"}`);let J=Z.lane,j=J.clientWidth,Y=J.clientHeight;if(!j||!Y)return;let _=Math.min(3,window.devicePixelRatio||1);if(J.width!==Math.round(j*_)||J.height!==Math.round(Y*_))J.width=Math.round(j*_),J.height=Math.round(Y*_);let U=J.getContext("2d");U.setTransform(_,0,0,_,0,0);let W=Math.min((j-8)/(2*mJ),7),R=(z)=>j/2+z*W,y=8,k=Y-26,CJ=Math.min(64,(k-y)*0.34),PJ=y+CJ,s=(z)=>z>=700?PJ-(z-700)/62*CJ:k-z/700*(k-PJ);U.clearRect(0,0,j,Y),U.fillStyle="#12171d",U.fillRect(0,0,j,Y),U.fillStyle="#3d4650",U.fillRect(R(-mJ),y,2*mJ*W,k-y),U.fillStyle="#d9b070",U.fillRect(R(-VJ),y,2*VJ*W,k-y),U.fillStyle="#e9c88c",U.fillRect(R(-VJ),y,2*VJ*W,s(dJ)-y),U.fillStyle="rgba(110,70,25,.5)";for(let z=-3;z<=3;z++){let o=R(z*5.32),$J=s(160-Math.abs(z)*12);U.beginPath(),U.moveTo(o-4,$J+5),U.lineTo(o+4,$J+5),U.lineTo(o,$J-6),U.fill()}if(q&&q.bumpers){U.fillStyle="#d7e84a";for(let z of[-1,1])U.fillRect(R(z*(VJ+1.2))-2,s(dJ),4,k-s(dJ))}let XJ=Math.tan(P.aim*Math.PI/180),SJ=q&&q.bumpers?VJ-4.25:VJ+2,yJ=745,AJ=P.x+XJ*yJ;if(Math.abs(AJ)>SJ&&XJ!==0)yJ=(Math.sign(AJ)*SJ-P.x)/XJ,AJ=Math.sign(AJ)*SJ;let GJ=[[P.x,0]];if(yJ>700)GJ.push([P.x+XJ*700,700]);GJ.push([AJ,yJ]),U.lineJoin="round",U.lineCap="butt",U.strokeStyle=fJ(),U.globalAlpha=0.5,U.lineWidth=8.5*W,U.beginPath(),GJ.forEach(([z,o],$J)=>$J?U.lineTo(R(z),s(o)):U.moveTo(R(z),s(o))),U.stroke(),U.globalAlpha=1,U.strokeStyle="rgba(255,255,255,.9)",U.lineWidth=2,U.setLineDash([6,6]),U.beginPath(),GJ.forEach(([z,o],$J)=>$J?U.lineTo(R(z),s(o)):U.moveTo(R(z),s(o))),U.stroke(),U.setLineDash([]);let yZ=q&&q.standing||[];kZ.forEach(([z,o],$J)=>{if(U.beginPath(),U.arc(R(z),s(o),Math.min(7,2.4*W),0,6.2832),yZ[$J])U.fillStyle="#fff",U.fill(),U.strokeStyle="#c8372d",U.lineWidth=2,U.stroke();else U.strokeStyle="rgba(60,40,20,.35)",U.lineWidth=1.5,U.stroke()}),U.fillStyle=fJ(),U.strokeStyle="#fff",U.lineWidth=3,U.beginPath(),U.arc(R(P.x),k+12,9,0,6.2832),U.fill(),U.stroke()}let fJ=()=>q&&q.board&&q.board[q.you]&&q.board[q.you].color||"#6a3fd0";function qJ(){if(!q)return"load";if(q.over)return"over";if(q.phase==="title"||q.phase==="pick")return q.pick&&q.pick.done?"picked":"pick";if(C>0)return"cards";let J=performance.now();if(E&&J>E.until)E=null;if(q.turn){if(q.result)return"result";if(q.phase==="aim")return E?E.s:"aim";if(q.phase==="ready")return E&&E.s==="roll"?"roll":"ready";if(q.phase==="swing"||q.phase==="roll"||q.phase==="pins")return"roll"}return"wait"}function oJ(J,j,Y){let U=`<div class="bp-sheet" style="grid-template-columns:repeat(${j>5?5:j},1fr)">`;for(let W=0;W<j;W++){let R=J.frames&&J.frames[W]||{marks:[],total:null};U+=`<div class="bp-fr${W===Y?" now":""}"><i>${W+1}</i><u>${rJ((R.marks||[]).join(" "))||"&nbsp;"}</u><s>${R.total==null?"&nbsp;":R.total}</s></div>`}return`${U}</div><div class="bp-total">TOTAL <b>${J.total|0}</b></div>`}let tJ=(J)=>`FRAME ${J.frame+1}/${J.frames} · BALL ${J.ball+1}`,nJ=(J)=>J.timer==null?"":`0:${String(J.timer).padStart(2,"0")}`;function f(){if(!_J)return;let J=qJ();if(J!==w){w=J;for(let j in M)M[j].hidden=j!==J;if(J!=="ready")r=null;if(J==="roll"&&!b)b=requestAnimationFrame(aJ)}if(q)Q.style.setProperty("--c",fJ());if(J==="pick"||J==="picked")EZ(J);if(J==="cards"){let j=["","MAKE ROOM","HOLD ON TIGHT","HOW DO YOU BOWL?"],Y=["","Stand where your arm can swing without hitting anyone or anything.","Grip your phone like you mean it. You swing your arm; the phone stays in your hand.",""];V(Z.cardT,j[C]),V(Z.cardB,Y[C]),Z.cardB.hidden=C===3,Z.setup.hidden=C!==3,V(Z.cardGo,C===3?"LET'S BOWL":"OK"),Q.querySelectorAll(".bp-pips i").forEach((_,U)=>_.classList.toggle("on",U===C-1)),Q.querySelectorAll("[data-hand]").forEach((_)=>_.classList.toggle("on",_.dataset.hand===G)),Q.querySelectorAll("[data-bump]").forEach((_)=>_.classList.toggle("on",_.dataset.bump==="1"===N))}else if(J==="wait"){let j=q.bowler,Y=j.i===q.you,_=q.result;Z.wDot.style.background=j.color;let U=q.phase==="intro"||q.phase==="enter";if(V(Z.wWho,Y?U?"YOU BOWL FIRST":"YOU'RE UP":U?`${j.name} BOWLS FIRST`:`${j.name} IS BOWLING`),V(Z.wSub,`FRAME ${q.frame+1} OF ${q.frames}${!Y&&q.next===q.you?" · YOU'RE NEXT":""}`),Z.wRes.hidden=!_,_)V(Z.wRes,_.title);g(Z.wSheet,oJ(q.score,q.frames,-1)),V(Z.wHand,G==="L"?"LEFTY":"RIGHTY"),V(Z.wBump,N?"BUMPERS ON":"BUMPERS OFF"),Z.wBump.hidden=!q.canBumpers,Z.wBump.classList.toggle("on",N)}else if(J==="aim"){V(Z.aFrame,tJ(q)),V(Z.aClock,nJ(q)),V(Z.mode,O==="swing"?"THROW: SWING":"THROW: FLICK"),Z.aBump.hidden=!q.canBumpers,V(Z.aBump,N?"BUMPERS: ON":"BUMPERS: OFF");let j=KZ[L];if(Z.aNote.hidden=!j,j)V(Z.aNote,j);NJ()}else if(J==="ready"){V(Z.rFrame,tJ(q)),V(Z.rClock,nJ(q));let j=O==="flick"||d||q.still;if(Z.pad.classList.toggle("go",j),O==="flick")V(Z.rT,"FLICK UP"),V(Z.rB,"Swipe up to bowl. Faster swipe, faster ball.");else if(j)V(Z.rT,"SWING!"),V(Z.rB,"Arm back, then forward.");else V(Z.rT,"HOLD STILL"),V(Z.rB,L==="asking"?"Allow motion when your phone asks.":"Phone down by your side.")}else if(J==="roll"){let j=q.phase!=="pins";if(Z.curve.hidden=O==="swing"||!j,O==="swing")V(Z.tT,j?"TILT TO CURVE":""),V(Z.tB,j?"Tap to set level.":"");else V(Z.tT,j?"HOLD TO CURVE":""),V(Z.tB,"");Z.tDot.parentElement.style.visibility=j?"":"hidden"}else if(J==="result"){let j=q.result;V(Z.resT,j.title),V(Z.resS,j.sub||""),g(Z.resSheet,oJ(q.score,q.frames,q.frame));let Y=`${q.id}:${j.kind}`;if(I!==Y){if(I=Y,j.kind==="strike")S([80,40,80,40,160]);else if(j.kind==="spare")S([70,40,120])}}else if(J==="over"){let j=q.over.indexOf(q.you);V(Z.oPlace,j===0?"YOU WIN!":vZ[j]||""),V(Z.oScore,`YOUR SCORE: ${q.score.total|0}`),g(Z.oBoard,q.over.map((Y,_)=>{let U=q.board[Y];return`<div class="${Y===q.you?"me":""}"><b>${_+1}</b><i class="bp-dot" style="background:${rJ(U.color)}"></i><span>${rJ(U.name)}</span><b>${U.total|0}</b></div>`}).join(""))}if(F)eJ()}let xJ=()=>({pattern:e[H.pat],colors:[u[H.c1][1],u[H.c2][1]]}),hJ=(J,j)=>(J%j+j)%j,AZ=()=>Math.max(70,Math.min(170,(Z.pBox.clientHeight||150)-8,(Z.pBox.clientWidth||300)-8));function EZ(J){let j=xJ();if(J==="picked"){let R=q.pick&&q.pick.ball||j,y=Math.min(200,Math.round((Q.clientWidth||320)*0.5)),k=Math.max(32,Math.round(y/4)),CJ=`k:${JSON.stringify(R)}:${y}`;if(H.key!==CJ)H.key=CJ,Z.kBig.style.width=Z.kBig.style.height=`${y}px`,LJ(Z.kBig,{pattern:R.pattern,colors:R.colors,n:k});let PJ=(s)=>(u.find((XJ)=>XJ[1]===s)||["",""])[0];V(Z.kName,`${IJ[R.pattern]||""} · ${PJ(R.colors[0])} + ${PJ(R.colors[1])}`);return}let Y=AZ(),_=`p:${H.pat}:${H.c1}:${H.c2}:${Y}`;if(H.key===_)return;H.key=_,V(Z.pPat,IJ[j.pattern]),V(Z.pC1,u[H.c1][0]),V(Z.pC2,u[H.c2][0]),Z.pBig.style.width=Z.pBig.style.height=`${Y}px`,LJ(Z.pBig,{pattern:j.pattern,colors:j.colors,n:Math.max(32,Math.round(Y/3.2)),y:0.4});let U=[-2,-1,0,1,2],W=Q.querySelector('[data-strip="pat"]');if(W.children.length!==5)W.innerHTML=U.map((R)=>`<canvas class="bp-chip${R?" far":""}" data-d="${R}" style="width:${R?44:60}px;height:${R?44:60}px"></canvas>`).join("");[...W.children].forEach((R)=>{let y=+R.dataset.d;LJ(R,{pattern:e[hJ(H.pat+y,e.length)],colors:j.colors,n:y?22:30})});for(let R of["c1","c2"]){let y=Q.querySelector(`[data-strip="${R}"]`);y.innerHTML=U.map((k)=>`<i class="${k?"far":""}" data-d="${k}" style="background:${u[hJ(H[R]+k,u.length)][1]}"></i>`).join("")}}function DJ(J){H.touched=!0,B({type:"ball",...xJ(),...J!=null?{done:J}:{}})}function uJ(J,j){if(qJ()!=="pick")return;H[J]=hJ(H[J]+j,J==="pat"?e.length:u.length),S(8),DJ(),f()}Q.querySelectorAll("[data-strip]").forEach((J)=>{let j=J.dataset.strip,Y=null;J.addEventListener("pointerdown",(_)=>{_.preventDefault(),Y={x:_.clientX,id:_.pointerId};try{J.setPointerCapture(_.pointerId)}catch{}}),J.addEventListener("pointerup",(_)=>{if(!Y||_.pointerId!==Y.id)return;let U=_.clientX-Y.x;if(Y=null,Math.abs(U)>24)return uJ(j,U<0?1:-1);let W=J.getBoundingClientRect(),R=_.clientX-(W.left+W.width/2),k=Math.max(-2,Math.min(2,Math.round(R/(j==="pat"?54:48))));if(k)uJ(j,k)}),J.addEventListener("pointercancel",()=>Y=null)}),Z.pSurprise.addEventListener("click",()=>{if(qJ()!=="pick")return;H.pat=i(e.length),H.c1=i(u.length),H.c2=(H.c1+1+i(u.length-1))%u.length,S(15),DJ(),f()}),Z.pDone.addEventListener("click",()=>{if(qJ()!=="pick")return;S([30,30,60]),DJ(!0)}),Z.pChange.addEventListener("click",()=>{if(qJ()!=="picked")return;DJ(!1)});function eJ(){let J=a;V(Z.dbg,`${L}/${O} ${A.readings} · ${J?J.peakDps!=null?`swing ${J.peakDps}°/s ${J.peakLin}m/s² x${J.bursts} p${J.power}`:`flick p${J.power}`:"no throw yet"} · tilt ${A.tilt.toFixed(2)}${Object.keys(K).length?" · tuned":""}`)}Z.cardGo.addEventListener("click",()=>{if(C===1||C===2){C++,f();return}if(C!==3)return;BJ(),C=0,B({type:"hand",hand:G}),B({type:"bumpers",on:N}),f()}),Q.querySelectorAll("[data-hand]").forEach((J)=>J.addEventListener("click",()=>JZ(J.dataset.hand))),Q.querySelectorAll("[data-bump]").forEach((J)=>J.addEventListener("click",()=>kJ(J.dataset.bump==="1")));function JZ(J){G=J==="L"?"L":"R";try{localStorage.setItem("fox-bowling-hand",G)}catch{}if(C===0)B({type:"hand",hand:G});f()}function kJ(J){if(q&&!q.canBumpers)return;if(N=!!J,C===0)B({type:"bumpers",on:N});f()}Z.wHand.addEventListener("click",()=>JZ(G==="L"?"R":"L")),Z.wBump.addEventListener("click",()=>kJ(!N)),Z.aBump.addEventListener("click",()=>kJ(!N)),Z.bowl.addEventListener("click",RZ),Z.back.addEventListener("click",HZ),Z.mode.addEventListener("click",()=>{if(O==="swing"){O="flick",f();return}if(O="swing",BJ(),L!=="on"&&L!=="asking")O="flick";f()}),Z.pad.addEventListener("pointerdown",DZ),Z.pad.addEventListener("pointermove",CZ),Z.pad.addEventListener("pointerup",PZ),Z.pad.addEventListener("pointercancel",()=>r=null),Z.tiltBox.addEventListener("pointerdown",()=>{if(O==="swing")A.recenter(),S(15)});function OZ(J){if(!J||J.type!=="view")return;let j=!q;if(q&&J.id<q.id)l=-1,I="",E=null;if(q=J,J.pick&&J.pick.ball&&!H.touched){let _=J.pick.ball,U=e.indexOf(_.pattern),W=u.findIndex((y)=>y[1]===_.colors[0]),R=u.findIndex((y)=>y[1]===_.colors[1]);if(U>=0)H.pat=U;if(W>=0)H.c1=W;if(R>=0)H.c2=R;H.touched=!0,H.key=""}if(J.turn&&J.id!==l&&J.line)l=J.id,P={x:J.line.x,aim:J.line.aim},d=!1;if(E&&(E.s==="ready"&&J.phase==="ready"||E.s==="roll"&&(J.phase==="swing"||J.phase==="roll")))E=null;let Y=performance.now();if(A.armed&&!(J.turn&&J.phase==="ready")&&!(E&&E.s==="ready"))A.disarm(),d=!1;if(J.turn&&J.phase==="ready"&&O==="swing"&&!A.armed&&!A.busy&&!(E&&E.s==="roll"))A.arm();if(!(J.turn&&(J.phase==="swing"||J.phase==="roll"||J.phase==="ready"))&&!E)A.stopTilt();if(C===0&&Y-QJ>500&&(J.hand!==G||J.canBumpers&&J.bumpers!==N)){if(QJ=Y,J.hand!==G)B({type:"hand",hand:G});if(J.canBumpers&&J.bumpers!==N)B({type:"bumpers",on:N})}if(!J.canBumpers)N=!!J.bumpers;if(j&&C===0)B({type:"motion",state:L});f()}function ZZ(J,j){if(J=!!J,j&&j.state==="lobby")C=1,q=null,E=null,l=-1,H.touched=!1,H.key="";if(J===_J){if(J)f();return}if(_J=J,J){if(B({type:"hello"}),L==="on")YJ(!0);n=setInterval(WJ,50),f()}else{if(YJ(!1),A.disarm(),A.stopTilt(),clearInterval(n),n=0,b)cancelAnimationFrame(b);b=0,w=""}}let $Z=()=>{if(w==="aim")NJ();if(w==="pick"||w==="picked")H.key="",f()};window.addEventListener("resize",$Z);function WZ(){if(ZZ(!1),window.removeEventListener("resize",$Z),clearTimeout(x),m)clearTimeout(m.t),clearInterval(m.i),m=null;if(Q.classList.remove("bp"),Q.innerHTML="",window.__bowlPad===QZ)delete window.__bowlPad}let QZ={get state(){return{screen:w,card:C,motion:L,mode:O,hand:G,bumpers:N,line:{...P},still:d,armed:A.armed,tilt:A.tilt,lastSwing:a,view:q,ball:xJ()}},pickStep(J,j){uJ(J,j)},pickDone(){DJ(!0)},tune:D,skipCards(){C=0,B({type:"hand",hand:G}),B({type:"bumpers",on:N}),f()},fakeSwing(J=0.5){zJ(OJ(+J||0,0,1),"swing",{power:J,peakDps:0,peakLin:0,bursts:0,fake:!0})},steer(J){T=J==null?null:OJ(+J||0,-1,1),WJ()},still(){lJ()},feed(J){A.feed(J)},det:A};return window.__bowlPad=QZ,{onMessage:OZ,show:ZZ,release:WZ}}export{rZ as createBowlingPad};
