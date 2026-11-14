var Qe={stillDps:90,stillMs:400,swingDps:400,settleDps:120,settleMs:180,swingMaxMs:1500,swingLin:8,dpsLo:400,dpsSpan:1400},J=(t)=>typeof t==="number"&&Number.isFinite(t);function xe(t,e){let a=t&&t.rotationRate||{},o=t&&t.accelerationIncludingGravity||{},n=t&&t.acceleration||{},p=($)=>J($)?$:null,r=($)=>J($)?$:0,d=e?-1:1,u=[n.x,n.y,n.z].some(J),A=[o.x,o.y,o.z].some(J);return{rx:p(a.alpha),ry:p(a.beta),rz:p(a.gamma),gx:J(o.x)?o.x*d:null,gy:J(o.y)?o.y*d:null,gz:J(o.z)?o.z*d:null,lin:u?Math.hypot(r(n.x),r(n.y),r(n.z)):A?Math.abs(Math.hypot(r(o.x),r(o.y),r(o.z))-9.81):null}}var ue=(t)=>!!t&&(/iPhone|iPad|iPod/.test(t.userAgent||"")||t.platform==="MacIntel"&&t.maxTouchPoints>1);function ge(t=Qe){let e="off",a=null,o=null,n=0,p=null,r=null,d="",u=null,A=null,$=null;return{get state(){return e},arm(E){e=E?"loose":"off",a=null,o=null},get debug(){return{state:e,rot:n,g:p,lin:r,still:a==null||A==null?0:A-a,swing:o&&{peak:o.peak,lin:o.lin,ms:(A-o.t0)*1000},lastSwing:$,why:d,whyAt:u,t:A}},feed(E,T,R,h,w,g,C,L){if(e==="off"||e==="done")return null;if(![T,R,h].some(J)&&!J(L))return null;A=E,n=Math.hypot(J(T)?T:0,J(R)?R:0,J(h)?h:0),p=J(g)?[J(w)?w:0,g,J(C)?C:0]:null;let M=J(L);if(r=M?L:null,e==="swing"){if(o.peak=Math.max(o.peak,n),M)o.lin=Math.max(o.lin,L);if(o.linKnown||=M,n<t.settleDps)o.quietSince??=E;else o.quietSince=null;if(o.quietSince!=null&&(E-o.quietSince)*1000>=t.settleMs||(E-o.t0)*1000>=t.swingMaxMs){let W=o;if(o=null,$={peak:Math.round(W.peak),lin:Math.round(W.lin*10)/10},W.linKnown&&W.lin<t.swingLin)return e="ready",d=`wrist flick (shake ${W.lin.toFixed(1)} < ${t.swingLin} m/s2): still ready`,u=E,null;return e="done",{type:"putt",power:Math.min(1,Math.max(0,(W.peak-t.dpsLo)/t.dpsSpan)),peak:W.peak,lin:W.lin}}return null}if(e==="loose"){if(n<t.stillDps){if(a??=E,(E-a)*1000>=t.stillMs)return e="ready",a=null,{type:"steady",on:!0}}else a=null;return null}if(n>t.swingDps)e="swing",o={t0:E,peak:n,lin:M?L:0,linKnown:M,quietSince:null};return null}}}function me(t,e,a){let o=t.document,n=!1,p=null,r=null,d=0,u=0,A=0,$=null,U=null,E=[],T=performance.now(),R=()=>((performance.now()-T)/1000).toFixed(2),h=(m)=>{if(E.unshift(`${R()} ${m}`),E.length>10)E.pop()},w=(m,P=0)=>m==null||!Number.isFinite(m)?"-":(m>=0?" ":"")+m.toFixed(P),g=(m,P=0)=>m?m.map((y)=>w(y,P).padStart(6)).join(""):"  none",C=e.arm.bind(e);e.arm=(m)=>{let P=e.state,y=a();if(C(m),P!==e.state)h(`arm(${m?"on":"off"}) ${P}->${e.state}${y.view?` turn:${!!y.view.yourTurn} stroke:${y.view.stroke??"-"}`:""}${o.hidden?" HIDDEN":""}`)};function L(){if(!p)return;let m=e.debug,P=a();p.textContent=[`MG SWING DEBUG (Tee Time reader)  motion:${P.motion}  ${A}Hz`,`turn:${P.view?P.view.yourTurn?`YES stroke ${P.view.stroke}`:"no":"-"}  phase:${P.view?P.view.phase:"-"}  ready:${P.steady?"YES":"no"}`,`reader: ${String(m.state).toUpperCase()}${m.state==="loose"?`  still ${(m.still*1000).toFixed(0)}/400 ms (<90 deg/s)`:""}`,`rot raw a/b/g ${g($&&$.r)}`,`rot |${w(m.rot)}| deg/s   (swing opens over 400)`,`grav raw      ${g($&&$.g,1)}`,`grav w3c      ${g(m.g,1)}   shake ${w(m.lin,1)} m/s2`,`iOS:${U?U.ios:"-"}  interval:${$&&$.iv!=null?$.iv:"-"}`,m.swing?`SWING now: peak ${w(m.swing.peak)} shake ${w(m.swing.lin,1)} ${w(m.swing.ms)} ms`:`last swing: ${m.lastSwing?`peak ${m.lastSwing.peak} shake ${m.lastSwing.lin}`:"none"}`,m.why?`last note: ${m.why} @${m.whyAt!=null?m.whyAt.toFixed(1):"-"}`:"last note: none","-- log --",...E].join(`
`)}function M(m){n=m;try{t.localStorage.setItem("mg-debug",m?"1":"0")}catch{}if(m&&!p)p=o.createElement("pre"),p.dataset.test="mg-debug",Object.assign(p.style,{position:"fixed",left:"4px",right:"4px",top:"4px",zIndex:"2147483000",margin:"0",padding:"6px",background:"rgba(0,0,0,0.78)",color:"#7fff9f",font:"10px/1.35 ui-monospace, Menlo, monospace",whiteSpace:"pre-wrap",pointerEvents:"none",borderRadius:"4px",textTransform:"none"}),o.body.appendChild(p),r=t.setInterval(L,100),L();else if(!m&&p)p.remove(),p=null,t.clearInterval(r),r=null}let W=[],x=(m)=>{if(m.clientY>90)return;let P=performance.now();if(W=W.filter((y)=>P-y<2500),W.push(P),W.length>=5)W=[],M(!n)};o.addEventListener("pointerdown",x,!0);let v=null;try{let m=new URLSearchParams(t.location.search).get("mgdebug");if(m!=null)v=m!=="0"}catch{}if(v==null)try{v=t.localStorage.getItem("mg-debug")==="1"}catch{v=!1}if(v)if(o.body)M(!0);else o.addEventListener("DOMContentLoaded",()=>M(!0));else try{t.localStorage.setItem("mg-debug","0")}catch{}return{motion(m,P,y){d++;let Y=performance.now();if(Y-u>=1000)A=d,d=0,u=Y;if(!n)return;let H=m.rotationRate||{},j=m.accelerationIncludingGravity||{};$={r:[H.alpha,H.beta,H.gamma],g:j.x==null?null:[j.x,j.y,j.z],iv:m.interval},U={ios:y}},event:h,get on(){return n},release(){if(o.removeEventListener("pointerdown",x,!0),p)p.remove(),p=null,t.clearInterval(r),r=null;n=!1}}}var X=Math.PI*2;function ot(t){let e=t>>>0||1;return()=>{return e=Math.imul(e,1664525)+1013904223>>>0,e/2147483648-1}}var S=(t,e)=>new Float32Array(Math.max(1,Math.ceil(e*t)));function Mt({a:t=0.002,dcy:e=0.1,sus:a=0,d:o=1,rel:n=0.02}={}){t=Math.max(t,0.0001);let p=(d)=>d<t?d/t:a+(1-a)*Math.exp(-(d-t)/e),r=p(o);return(d)=>{if(d<=o)return p(d);let u=1-(d-o)/n;return u>0?r*u*u:0}}function ie(t,e){if(t<e)return t/=e,t+t-t*t-1;if(t>1-e)return t=(t-1)/e,t*t+t+t+1;return 0}function N(t,e,a){let o=a.t||0,n=a.d??0.1,p=a.rel??0.02,r=Math.round(o*e),d=Math.min(t.length-r,Math.ceil((n+p)*e));if(d<=0)return;let u=a.env||Mt({a:a.a,dcy:a.dcy??1e9,sus:a.sus??1,d:n,rel:p}),A=a.f,$=a.f1??a.f,U=a.glide??n,E=a.curve||"exp",T=a.wave||"sin",R=a.duty??0.5,h=a.g??0.5,w=a.vib,g=a.sub||0,C=a.cut||0,L=C?1-Math.exp(-X*C/e):1,M=a.ph||0,W=0,x=0;for(let v=0;v<d;v++){let m=v/e,P=Math.min(1,m/U),y=E==="lin"?A+($-A)*P:A*Math.pow($/A,P);if(w)y*=Math.pow(2,w[1]/12*Math.sin(X*w[0]*m));let Y=Math.min(0.49,y/e),H;if(T==="sin")H=Math.sin(X*M);else if(T==="tri"){let j=M+0.75;H=4*Math.abs(j-Math.floor(j)-0.5)-1}else if(T==="saw")H=2*M-1-ie(M,Y);else{let j=M-R;if(j<0)j+=1;H=(M<R?1:-1)+ie(M,Y)-ie(j,Y)-(2*R-1)}if(g){if(H+=g*Math.sin(X*W),W+=y/2/e,W>=1)W-=1}if(M+=Y,M>=1)M-=1;if(C)x+=L*(H-x),H=x;t[r+v]+=H*u(m)*h}}function k(t,e,a){let o=a.t||0,n=a.d??0.1,p=Math.round(o*e),r=Math.min(t.length-p,Math.ceil(n*e));if(r<=0)return;let d=ot(a.seed||7),u=1/(a.q||0.8),A=a.mode||"bp",$=a.fc||1000,U=a.fc1??$,E=a.g??0.5,T=a.env||((L)=>Math.exp(-L/(n*0.3))),R=0,h=0,w=0,g=0,C=0;for(let L=0;L<r;L++){let M=L/e;if((L&15)===0){let y=$*Math.pow(U/$,M/n),Y=Math.tan(Math.PI*Math.min(y,e*0.45)/e);w=1/(1+Y*(Y+u)),g=Y*w,C=Y*g}let W=d(),x=W-h,v=w*R+g*x,m=h+g*R+C*x;R=2*v-R,h=2*m-h;let P=A==="lp"?m:A==="bp"?v:W-u*v-m;t[p+L]+=P*T(M)*E*Math.min(1,(r-L)/(0.003*e))}}function le(t,e,a){let o=a.t||0,n=a.d??0.6,p=a.rel??0.05,r=Math.round(o*e),d=Math.min(t.length-r,Math.ceil((n+p)*e));if(d<=0)return;let u=e/a.f,A=u-0.5,$=Math.floor(A),U=A-$,E=Math.ceil(u)+4,T=new Float64Array(E),R=ot(a.seed||1+Math.round(a.f*7)),h=a.bright??0.6,w=a.damp??0.996,g=a.soft??0.5,C=0,L=0;for(let v=0;v<E;v++)C+=h*(R()-C),T[v]=C,L+=C;L/=E;for(let v=0;v<E;v++)T[v]-=L;let M=(a.g??0.5)*(0.6/Math.max(0.15,Math.sqrt(h))),W=0,x=0;for(let v=0;v<d;v++){let m=v/e,P=W-$;if(P<0)P+=E;let y=P-1;if(y<0)y+=E;let Y=T[P]*(1-U)+T[y]*U,H=w*((1-g)*Y+g*x);if(x=Y,T[W]=H,++W>=E)W=0;let j=m<0.0015?m/0.0015:1;if(m>n){let q=1-(m-n)/p;j*=q>0?q*q:0}t[r+v]+=H*j*M}}function yt(t,e,a){let o=a.t||0,n=a.d??0.2,p=a.rel??0.03,r=Math.round(o*e),d=Math.min(t.length-r,Math.ceil((n+p)*e));if(d<=0)return;let u=a.env||Mt({a:a.a??0.001,dcy:a.dcy??0.15,sus:a.sus??0,d:n,rel:p}),A=a.ratio??1,$=a.idx??2,U=a.idxDcy??0.05,E=a.idxSus??0,T=a.g??0.5,R=a.f,h=a.f1??a.f,w=0,g=0;for(let C=0;C<d;C++){let L=C/e,M=R*Math.pow(h/R,Math.min(1,L/n)),W=$*(E+(1-E)*Math.exp(-L/U)),x=Math.sin(X*w+W*Math.sin(X*g));if(w+=M/e,w>=1)w-=1;if(g+=M*A/e,g>=1)g-=Math.floor(g);t[r+C]+=x*u(L)*T}}function D(t,e,a){let o=1-Math.exp(-X*a/e),n=0;for(let p=0;p<t.length;p++)n+=o*(t[p]-n),t[p]-=n;return t}function we(t,e,a){let o=1-Math.exp(-X*a/e),n=0;for(let p=0;p<t.length;p++)n+=o*(t[p]-n),t[p]=n;return t}function pe(t,e=1.5){let a=Math.tanh(e);for(let o=0;o<t.length;o++)t[o]=Math.tanh(t[o]*e)/a;return t}function Ae(t,e,a=0.6,o=6){let n=Math.max(1,Math.round(a/1000*e)),p=Math.max(1,Math.round(o/1000*e));for(let r=0;r<n&&r<t.length;r++)t[r]*=r/n;for(let r=0;r<p&&r<t.length;r++)t[t.length-1-r]*=r/p;return t}function Oe(t,e){let a=re(t),o=a*0.001,n=t.length;while(n>1&&Math.abs(t[n-1])<o)n--;return t.slice(0,Math.min(t.length,n+Math.round(0.004*e)))}function re(t){let e=0;for(let a=0;a<t.length;a++){let o=Math.abs(t[a]);if(o>e)e=o}return e}function Ze(t){let e=(a,o,n,p)=>{let r=X*o/t,d=Math.cos(r),u=Math.sin(r)/(2*n),A,$,U,E,T,R;if(a==="hs"){let h=Math.pow(10,p/40),w=2*Math.sqrt(h)*u;A=h*(h+1+(h-1)*d+w),$=-2*h*(h-1+(h+1)*d),U=h*(h+1+(h-1)*d-w),E=h+1-(h-1)*d+w,T=2*(h-1-(h+1)*d),R=h+1-(h-1)*d-w}else A=(1+d)/2,$=-(1+d),U=(1+d)/2,E=1+u,T=-2*d,R=1-u;return[A/E,$/E,U/E,T/E,R/E]};return[e("hs",1681.97,0.7071752,3.99984),e("hp",38.13547,0.500327,0)]}function ye(t,e){let[a,o]=Ze(e),n=new Float64Array(t.length),p=0,r=0,d=0,u=0,A=0,$=0,U=0,E=0;for(let T=0;T<t.length;T++){let R=t[T],h=a[0]*R+a[1]*p+a[2]*r-a[3]*d-a[4]*u;r=p,p=R,u=d,d=h;let w=o[0]*h+o[1]*A+o[2]*$-o[3]*U-o[4]*E;$=A,A=h,E=U,U=w,n[T]=w}return n}function be(t,e){let a=ye(t,e),o=Math.max(1,Math.round(0.1*e)),n=Math.max(1,Math.round(0.02*e)),p=0,r=new Float64Array(a.length+1);for(let d=0;d<a.length;d++)r[d+1]=r[d]+a[d]*a[d];if(a.length<=o)p=r[a.length]/o;else for(let d=0;d+o<=a.length;d+=n)p=Math.max(p,(r[d+o]-r[d])/o);return p>0.00000000000001?-0.691+10*Math.log10(p):-140}function Te(t,e){let a=ye(t,e),o=0;for(let n=0;n<a.length;n++)o+=a[n]*a[n];return o/=Math.max(1,a.length),o>0.00000000000001?-0.691+10*Math.log10(o):-140}var Je={ball:-19,set:-18,swish:-25,tick:-25,jingle:-17.5,ui:-21,loop:-24,phone:-14},$e=0.84,Xe=(t)=>440*Math.pow(2,(t-69)/12),t0={C:0,D:2,E:4,F:5,G:7,A:9,B:11},I=(t)=>{let e=/^([A-G])(#|b)?(\d)$/.exec(t);return Xe(t0[e[1]]+(e[2]==="#"?1:e[2]==="b"?-1:0)+(Number(e[3])+1)*12)},B=(t,e)=>(a)=>a<t?a/t:Math.exp(-(a-t)/e),tt=(t,e,a=0.18)=>(o)=>o<t?a+(1-a)*Math.sin(Math.PI/2*(o/t))**2:Math.max(0,1-(o-t)/Math.max(0.001,e-t))**2;function xt(t,e,a,o,n,p={}){if(yt(t,e,{t:a,d:(p.dcy||0.045)*6,f:o,ratio:p.ratio||2.43,idx:p.idx??3.2,idxDcy:p.idxDcy||0.008,env:B(0.0008,p.dcy||0.045),g:n}),p.body)N(t,e,{t:a,d:0.2,f:o*0.5,f1:o*0.42,glide:0.08,env:B(0.001,p.body),g:n*0.6})}function pt(t,e,a,o,n=4200,p=3,r=0.0015){k(t,e,{t:a,d:r*7,mode:"hp",fc:n,q:0.7,env:B(0.0002,r),g:o,seed:p})}function st(t,e,a,o,n,p=[[1,1,0.12],[2.76,0.5,0.06],[5.4,0.25,0.03]]){for(let[r,d,u]of p)N(t,e,{t:a,d:u*6,f:o*r,env:B(0.0005,u),g:n*d,ph:0.25})}function Bt(t,e,a,o,n,p,r){N(t,e,{t:a,d:p*6,f:o,f1:n,glide:p*1.5,env:B(0.001,p),g:r})}function K(t,e,a,o,n,p,r={}){N(t,e,{t:a,d:n,f:o,wave:"pulse",duty:r.duty??0.25,env:Mt({a:0.002,dcy:r.dcy??0.12,sus:r.sus??0.5,d:n,rel:r.rel??0.04}),rel:r.rel??0.04,g:p,vib:r.vib,cut:r.cut??6500})}function Wt(t,e,a,o,n,p){let r=Mt({a:0.025,dcy:0.2,sus:0.85,d:n,rel:0.06});N(t,e,{t:a,d:n,f:o,env:r,rel:0.06,g:p,vib:[5.2,0.12]}),N(t,e,{t:a,d:n,f:o*2,env:r,rel:0.06,g:p*0.12}),N(t,e,{t:a,d:n,f:o*3,env:r,rel:0.06,g:p*0.05}),k(t,e,{t:a,d:0.09,mode:"bp",fc:o*2,q:2,env:B(0.01,0.025),g:p*0.25,seed:Math.round(o)})}function Rt(t,e,a,o,n,p,r=1){le(t,e,{t:a,f:o,d:n,bright:0.7,damp:0.997,soft:0.42,g:p,seed:r}),le(t,e,{t:a+0.004,f:o*2.002,d:n*0.6,bright:0.5,damp:0.995,soft:0.5,g:p*0.25,seed:r+9})}function bt(t,e,a,o,n,p,r,d=1){o.forEach((u,A)=>Rt(t,e,a+A*n,I(u),p,r,d+A*5))}function Yt(t,e,a,o,n,p){yt(t,e,{t:a,d:n,f:o,ratio:3.5,idx:1.6,idxDcy:0.12,idxSus:0.15,env:B(0.001,n*0.35),g:p})}function Xt(t,e,a,o,n,p=5){let r=ot(p),d=Array.from({length:64},()=>0.75+0.25*r()),u=($)=>tt(0.18,o)($)*d[Math.min(63,Math.floor($/o*64))];k(t,e,{t:a,d:o,mode:"bp",fc:750,fc1:900,q:3,env:u,g:n,seed:p}),k(t,e,{t:a,d:o,mode:"bp",fc:1500,fc1:1800,q:3.5,env:u,g:n*0.8,seed:p+1}),k(t,e,{t:a,d:o,mode:"bp",fc:2800,q:2.5,env:u,g:n*0.35,seed:p+2});let A=ot(p+7);for(let $=0;$<6;$++){let U=a+0.04+$*0.05+0.03*A(),E=420+120*A();N(t,e,{t:U,d:o*0.55,f:E,f1:E*1.18,glide:o*0.25,wave:"saw",env:tt(0.12,o*0.6),g:n*0.07,cut:2400,vib:[6+A(),0.3]})}}function ce(t,e,a){let o=Math.round(a*e),n=t.length-o,p=new Float32Array(n);for(let r=0;r<n;r++)p[r]=t[r];for(let r=0;r<o;r++){let d=r/o;p[r]=t[r]*Math.sin(Math.PI/2*d)+t[n+r]*Math.cos(Math.PI/2*d)}return p}function te(t,e,a){let o=ot(t),n=Math.ceil(a*e)+3,p=Array.from({length:n},()=>0.5+0.5*o());return(r)=>{let d=r*e,u=Math.floor(d),A=d-u,$=A*A*(3-2*A);return p[u]+(p[u+1]-p[u])*$}}var vt={putt:{cat:"ball",n:6,gv:[-2,-2,-2,1,1,1],render(t,e){let a=e>=3,o=e%3,n=S(t,0.45),p=1+(o-1)*0.035;if(pt(n,t,0,a?0.9:0.55,3800,11+o),yt(n,t,{t:0,d:0.2,f:1250*p,ratio:1.52,idx:a?3.5:2.2,idxDcy:0.006,env:B(0.0006,a?0.03:0.022),g:0.7}),Bt(n,t,0,520*p,300*p,a?0.035:0.025,a?0.55:0.4),a)k(n,t,{t:0,d:0.06,mode:"bp",fc:1900,q:1.2,env:B(0.0005,0.012),g:0.5,seed:21+o}),st(n,t,0.001,2350*p,0.12,[[1,1,0.09],[2.71,0.4,0.05]]);return D(n,t,180)}},roll:{cat:"loop",loop:!0,g:0,render(t){let a=S(t,2.6),o=te(5,9,2.6),n=te(6,23,2.6);k(a,t,{t:0,d:2.6,mode:"lp",fc:380,q:0.9,env:(r)=>0.55+0.45*o(r),g:1.4,seed:31}),k(a,t,{t:0,d:2.6,mode:"bp",fc:1400,q:1.3,env:(r)=>0.35+0.65*n(r)**3,g:0.4,seed:32});let p=ot(33);for(let r=0.01;r<2.58;r+=0.012+0.03*Math.abs(p()))pt(a,t,r,0.04+0.05*Math.abs(p()),2200,40+Math.round(r*1000),0.0012);return ce(we(D(a,t,70),t,4500),t,0.4)}},rail:{cat:"loop",loop:!0,g:1,render(t){let a=S(t,1.6),o=(n)=>0.7+0.3*Math.sin(X*31*n);for(let[n,p]of[[310,0.25],[620,0.12],[1240,0.05]])N(a,t,{t:0,d:1.6,f:n,env:o,g:p,rel:0});return k(a,t,{t:0,d:1.6,mode:"bp",fc:2200,q:1.6,env:o,g:0.4,seed:51}),k(a,t,{t:0,d:1.6,mode:"lp",fc:500,q:0.8,env:()=>1,g:0.6,seed:52}),ce(D(a,t,90),t,0.3)}},wall:{cat:"ball",n:4,render(t,e){let a=S(t,0.3),o=[1,1.06,0.94,1.12][e];return xt(a,t,0,640*o,0.8,{dcy:0.04,body:0.03}),pt(a,t,0,0.35,3000,60+e),D(a,t,150)}},post:{cat:"ball",g:-1,render(t){let e=S(t,0.4);return N(e,t,{t:0,d:0.35,f:330,f1:290,vib:[17,1.2],env:B(0.002,0.08),g:0.5,wave:"saw",cut:3000}),N(e,t,{t:0,d:0.3,f:1320,f1:1160,vib:[17,1.2],env:B(0.002,0.05),g:0.25}),pt(e,t,0,0.4,2500,70),D(e,t,150)}},bank:{cat:"set",g:-2,render(t){let e=S(t,0.6);Bt(e,t,0,210,110,0.06,0.45);for(let[a,o,n]of[[240,0.35,0.09],[415,0.35,0.07],[690,0.35,0.05],[1130,0.3,0.04],[1720,0.22,0.03],[2650,0.12,0.02]])N(e,t,{t:0,d:n*6,f:a,env:B(0.0008,n),g:o,ph:0.25});return k(e,t,{t:0,d:0.06,mode:"bp",fc:1800,q:0.9,env:B(0.0004,0.014),g:0.9,seed:81}),D(e,t,100)}},knock:{cat:"ball",n:3,g:-2,render(t,e){let a=S(t,0.15),o=[1,1.08,0.93][e];return yt(a,t,{t:0,d:0.1,f:2500*o,ratio:1.47,idx:2.4,idxDcy:0.004,env:B(0.0003,0.018),g:0.7}),pt(a,t,0,0.5,5000,90+e),D(a,t,400)}},land:{cat:"ball",g:-4,render(t){let e=S(t,0.2);return Bt(e,t,0,380,200,0.03,0.5),k(e,t,{t:0,d:0.05,mode:"bp",fc:1900,q:0.9,env:B(0.0005,0.012),g:0.8,seed:95}),xt(e,t,0,980,0.3,{dcy:0.02}),D(e,t,150)}},lip:{cat:"ball",g:-2,render(t){let e=S(t,0.5);return[0,0.07,0.12,0.16].forEach((a,o)=>st(e,t,a,1850*(1-o*0.03),0.4*(1-o*0.2),[[1,1,0.05],[2.76,0.5,0.03],[5.1,0.2,0.015]])),k(e,t,{t:0.16,d:0.18,mode:"bp",fc:2400,q:2,env:(a)=>(1-a/0.18)*(0.5+0.5*Math.sin(X*38*a)),g:0.15,seed:99}),D(e,t,300)}},cup:{cat:"ball",g:1,render(t){let e=S(t,0.6);return st(e,t,0,1980,0.5,[[1,1,0.06],[2.76,0.5,0.035],[5.3,0.2,0.02]]),st(e,t,0.065,2150,0.3,[[1,1,0.04],[2.8,0.4,0.02]]),st(e,t,0.105,2300,0.18,[[1,1,0.03]]),Bt(e,t,0.13,520,330,0.05,0.7),N(e,t,{t:0.13,d:0.3,f:660,env:B(0.001,0.06),g:0.3}),N(e,t,{t:0.13,d:0.3,f:1010,env:B(0.001,0.04),g:0.15}),D(e,t,200)}},out:{cat:"ball",g:-4,render(t){let e=S(t,0.5);return N(e,t,{t:0,d:0.42,f:1100,f1:330,wave:"tri",env:Mt({a:0.01,dcy:0.3,sus:0.6,d:0.38,rel:0.04}),g:0.5,vib:[7,0.4]}),D(e,t,200)}},back:{cat:"ui",g:-3,render(t){let e=S(t,0.2);return N(e,t,{t:0,d:0.08,f:700,f1:1300,wave:"tri",env:B(0.002,0.03),g:0.7}),N(e,t,{t:0,d:0.08,f:1400,f1:2600,env:B(0.002,0.02),g:0.2}),pt(e,t,0,0.3,2500,101),D(e,t,200)}},fanfareSmall:{cat:"jingle",g:-3,render(t){let e=S(t,0.9);return K(e,t,0,I("D5"),0.09,0.3),K(e,t,0.1,I("G5"),0.35,0.3,{vib:[6,0.15]}),Rt(e,t,0,I("D4"),0.5,0.35),Rt(e,t,0.1,I("G4"),0.6,0.4,3),D(e,t,150)}},fanfare:{cat:"jingle",render(t){let e=S(t,1.6);return["G5","B5","D6"].forEach((o,n)=>{K(e,t,n*0.075,I(o),0.07,0.28),Rt(e,t,n*0.075,I(o)/2,0.3,0.25,n+2)}),K(e,t,0.23,I("G6"),0.55,0.28,{vib:[6,0.18],sus:0.6}),Wt(e,t,0.23,I("B5"),0.55,0.22),Wt(e,t,0.23,I("D5"),0.55,0.16),bt(e,t,0.23,["G3","D4","G4","B4"],0.018,0.9,0.3,7),k(e,t,{t:0.23,d:0.7,mode:"hp",fc:7000,env:B(0.003,0.18),g:0.12,seed:111}),D(e,t,150)}},ace:{cat:"jingle",g:1.5,render(t){let e=S(t,2.9);for(let a=0;a<12;a++)k(e,t,{t:a*0.033,d:0.05,mode:"hp",fc:1500,env:B(0.001,0.02),g:0.16+a*0.02,seed:120+a});return["G4","B4","D5","G5","B5","D6","G6"].forEach((a,o)=>{K(e,t,0.5+o*0.06,I(a),0.055,0.24)}),K(e,t,0.92,I("B6"),0.9,0.24,{vib:[6,0.2],sus:0.6}),K(e,t,0.92,I("G6"),0.9,0.18,{duty:0.5,sus:0.6}),Wt(e,t,0.92,I("D6"),0.9,0.2),Wt(e,t,0.92,I("G5"),0.9,0.16),bt(e,t,0.92,["G2","D3","G3","B3","D4","G4"],0.016,1.4,0.32,13),Bt(e,t,0.92,160,90,0.12,0.5),k(e,t,{t:0.92,d:1.6,mode:"hp",fc:4500,env:B(0.002,0.45),g:0.22,seed:140}),Xt(e,t,0.95,1.9,0.5,150),D(e,t,120)}},sail:{cat:"swish",render(t){let e=S(t,0.9),a=tt(0.38,0.85);return k(e,t,{t:0,d:0.85,mode:"bp",fc:500,fc1:1500,q:1.3,env:(o)=>a(o)*(o<0.4?1:1),g:0.9,seed:161}),k(e,t,{t:0,d:0.85,mode:"bp",fc:2400,fc1:1300,q:2,env:a,g:0.25,seed:162}),N(e,t,{t:0,d:0.85,f:180,f1:150,env:a,g:0.12}),D(e,t,120)}},sailHit:{cat:"set",g:-2,render(t){let e=S(t,0.4);return xt(e,t,0,420,0.8,{dcy:0.06,ratio:2.1,idx:4,body:0.05}),k(e,t,{t:0,d:0.08,mode:"bp",fc:1300,q:1,env:B(0.0005,0.015),g:0.45,seed:171}),st(e,t,0.004,2600,0.08,[[1,1,0.05]]),D(e,t,120)}},loopIn:{cat:"swish",g:3,render(t){let e=S(t,1.3);return k(e,t,{t:0,d:1.2,mode:"bp",fc:450,fc1:3200,q:1.5,env:tt(0.8,1.2),g:0.9,seed:181}),N(e,t,{t:0.05,d:0.9,f:520,f1:1300,wave:"pulse",duty:0.5,env:tt(0.6,0.95),g:0.06,vib:[9,0.3],cut:3500}),D(e,t,150)}},light:{cat:"tick",render(t){let e=S(t,0.12);return K(e,t,0,I("D6"),0.04,0.5,{duty:0.5,dcy:0.03,sus:0,rel:0.02}),D(e,t,300)}},looped:{cat:"jingle",g:-2,render(t){let e=S(t,1.2);return["D6","F#6","A6","D7","F#7"].forEach((a,o)=>{K(e,t,o*0.05,I(a),0.05,0.25),Yt(e,t,o*0.05,I(a),0.4,0.12)}),K(e,t,0.26,I("A6"),0.5,0.2,{vib:[7,0.25]}),k(e,t,{t:0.2,d:0.8,mode:"hp",fc:8000,env:(a)=>B(0.01,0.25)(a)*(0.6+0.4*Math.sin(X*18*a)),g:0.16,seed:191}),D(e,t,300)}},smoke:{cat:"swish",g:2,render(t){let e=S(t,0.9);k(e,t,{t:0,d:0.8,mode:"lp",fc:2200,fc1:500,q:0.9,env:(o)=>o<0.04?o/0.04:Math.exp(-(o-0.04)/0.22),g:1,seed:201});let a=te(202,26,0.9);return N(e,t,{t:0,d:0.6,f:82,f1:70,wave:"saw",env:(o)=>tt(0.08,0.6)(o)*(0.5+0.5*a(o)),g:0.3,cut:1100}),D(e,t,90)}},jawOpen:{cat:"swish",g:-1,render(t){let a=S(t,0.85),o=ot(211);for(let n=0,p=0;n<0.7999999999999999;p++)pt(a,t,n,0.25+0.1*o(),900,220+p,0.004),N(a,t,{t:n,d:0.03,f:260+30*o(),env:B(0.001,0.008),g:0.25,wave:"saw",cut:1800}),n+=0.028+0.03*(n/0.85);return k(a,t,{t:0,d:0.85,mode:"bp",fc:350,q:1.5,env:tt(0.3,0.85),g:0.4,seed:212}),D(a,t,120)}},snap:{cat:"set",g:1,render(t){let e=S(t,0.7);return yt(e,t,{t:0,d:0.3,f:300,ratio:1.73,idx:5,idxDcy:0.01,env:B(0.0005,0.05),g:0.6}),yt(e,t,{t:0,d:0.12,f:2100,ratio:1.41,idx:3,idxDcy:0.004,env:B(0.0003,0.018),g:0.45}),k(e,t,{t:0,d:0.12,mode:"bp",fc:1500,q:0.9,env:B(0.0004,0.022),g:0.8,seed:231}),Bt(e,t,0,170,70,0.07,0.8),k(e,t,{t:0.01,d:0.5,mode:"lp",fc:900,env:B(0.005,0.12),g:0.25,seed:232}),pe(D(e,t,80),1.3)}},gulp:{cat:"set",g:-1,render(t){let e=S(t,0.6);return N(e,t,{t:0,d:0.2,f:480,f1:130,wave:"saw",cut:3200,env:Mt({a:0.006,dcy:0.2,sus:0.7,d:0.17,rel:0.05}),g:0.6}),k(e,t,{t:0,d:0.2,mode:"bp",fc:2400,fc1:800,q:3,env:tt(0.03,0.2),g:0.6,seed:241}),N(e,t,{t:0.24,d:0.07,f:600,f1:1500,wave:"tri",env:B(0.004,0.03),g:0.5}),N(e,t,{t:0.33,d:0.06,f:800,f1:1900,wave:"tri",env:B(0.004,0.025),g:0.3}),D(e,t,110)}},drain:{cat:"set",g:-2,render(t){let e=S(t,0.9),a=ot(251);k(e,t,{t:0,d:0.5,mode:"bp",fc:2600,fc1:700,q:0.8,env:B(0.004,0.11),g:0.9,seed:252}),k(e,t,{t:0,d:0.3,mode:"hp",fc:5000,env:B(0.002,0.05),g:0.25,seed:253});for(let o=0;o<9;o++){let n=0.05+o*0.06+0.03*a(),p=500+500*Math.abs(a());N(e,t,{t:n,d:0.05,f:p,f1:p*1.7,env:B(0.003,0.018),g:0.28*(1-o/10)})}return D(e,t,150)}},water:{cat:"loop",loop:!0,g:0,render(t){let a=S(t,4.6),o=ot(261),n=te(262,1.5,4.6);k(a,t,{t:0,d:4.6,mode:"lp",fc:900,q:0.7,env:(p)=>0.6+0.4*n(p),g:0.7,seed:263}),k(a,t,{t:0,d:4.6,mode:"hp",fc:4500,q:0.7,env:()=>1,g:0.06,seed:264});for(let p=0.01;p<4.5;p+=0.03+0.07*Math.abs(o())){let r=450+900*Math.abs(o());N(a,t,{t:p,d:0.05,f:r,f1:r*(1.4+0.4*Math.abs(o())),env:B(0.004,0.012),g:0.12+0.12*Math.abs(o())})}return ce(D(a,t,220),t,0.6)}},signCrash:{cat:"set",g:2,hit:0.2,render(t){let e=S(t,1.4),o=ot(271);k(e,t,{t:0,d:0.21000000000000002,mode:"bp",fc:600,fc1:2200,q:1.2,env:(n)=>0.2+0.8*(n/0.2)**2,g:0.35,seed:272}),Bt(e,t,0.2,150,60,0.09,1);for(let[n,p,r]of[[180,0.6,0.12],[330,0.5,0.09],[560,0.4,0.06],[910,0.25,0.04]])N(e,t,{t:0.2,d:r*6,f:n,env:B(0.001,r),g:p,ph:0.25});for(let n=0;n<5;n++)xt(e,t,0.20400000000000001+n*0.014+0.006*o(),380+200*Math.abs(o()),0.35,{dcy:0.05});k(e,t,{t:0.2,d:0.1,mode:"bp",fc:1400,q:0.8,env:B(0.0005,0.025),g:0.9,seed:273});for(let n=0;n<6;n++)st(e,t,0.22+n*0.035+0.01*o(),2600+700*Math.abs(o()),0.1,[[1,1,0.05],[2.4,0.4,0.03]]);return xt(e,t,0.36,300,0.4,{dcy:0.05,body:0.04}),k(e,t,{t:0.2,d:1.1,mode:"lp",fc:1200,env:B(0.01,0.3),g:0.25,seed:274}),pe(D(e,t,70),1.2)}},pop:{cat:"ui",g:-2,render(t){let e=S(t,0.25);return xt(e,t,0,880,0.6,{dcy:0.03}),K(e,t,0.01,I("A6"),0.05,0.2,{sus:0,dcy:0.04}),D(e,t,200)}},flag:{cat:"swish",g:-1,render(t){let e=S(t,0.5);return k(e,t,{t:0,d:0.45,mode:"bp",fc:1300,fc1:2200,q:1.3,env:(a)=>tt(0.08,0.45)(a)*(0.55+0.45*Math.sin(X*21*a)),g:1,seed:281}),D(e,t,300)}},ballPop:{cat:"tick",g:2,render(t){let e=S(t,0.15);return N(e,t,{t:0,d:0.07,f:I("D5"),f1:I("A5"),wave:"tri",env:B(0.002,0.035),g:0.6}),N(e,t,{t:0,d:0.07,f:I("D6"),f1:I("A6"),env:B(0.002,0.025),g:0.3}),D(e,t,200)}},signSwing:{cat:"swish",g:2,render(t){let e=S(t,1.3),a=ot(291);k(e,t,{t:0,d:0.75,mode:"bp",fc:500,fc1:1100,q:1.2,env:tt(0.4,0.75),g:0.6,seed:292});for(let o=0.05,n=0;o<0.9;n++)pt(e,t,o,0.18,1500,300+n,0.003),N(e,t,{t:o,d:0.025,f:520+40*a(),wave:"saw",env:B(0.001,0.007),g:0.15,cut:2500}),o+=0.045+0.02*Math.abs(a());return xt(e,t,0.8,520,0.5,{dcy:0.04,body:0.03}),D(e,t,150)}},start:{cat:"jingle",g:-2,render(t){let e=S(t,1);return bt(e,t,0,["D3","A3","D4","F#4","A4"],0.016,0.7,0.35,21),K(e,t,0.02,I("D6"),0.08,0.25),K(e,t,0.1,I("A6"),0.3,0.25,{vib:[6,0.15]}),D(e,t,150)}},pick:{cat:"tick",g:1,render(t){let e=S(t,0.12);return N(e,t,{t:0,d:0.05,f:700,f1:1150,env:B(0.002,0.022),g:0.6}),pt(e,t,0,0.2,3000,311),D(e,t,300)}},ready:{cat:"ui",render(t){let e=S(t,0.6);return K(e,t,0,I("A5"),0.07,0.28),K(e,t,0.08,I("D6"),0.25,0.28),Rt(e,t,0.08,I("D5"),0.4,0.3,31),D(e,t,200)}},unready:{cat:"ui",g:-4,render(t){let e=S(t,0.4);return K(e,t,0,I("D6"),0.07,0.25),K(e,t,0.08,I("A5"),0.18,0.25),D(e,t,200)}},allReady:{cat:"jingle",render(t){let e=S(t,1.5);return["D5","F#5","A5","D6"].forEach((a,o)=>{K(e,t,o*0.08,I(a),0.075,0.26)}),K(e,t,0.32,I("F#6"),0.5,0.22,{vib:[6,0.18],sus:0.6}),Wt(e,t,0.32,I("A5"),0.5,0.2),bt(e,t,0.32,["D3","A3","D4","F#4"],0.018,0.9,0.32,41),k(e,t,{t:0.32,d:0.8,mode:"hp",fc:6000,env:B(0.002,0.2),g:0.14,seed:321}),D(e,t,150)}},boardUp:{cat:"swish",g:1,render(t){let e=S(t,0.55);return k(e,t,{t:0,d:0.5,mode:"bp",fc:400,fc1:2600,q:1.4,env:tt(0.3,0.5),g:1,seed:331}),D(e,t,200)}},banner:{cat:"ui",g:1,render(t){let e=S(t,1);return xt(e,t,0,400,0.6,{dcy:0.05,body:0.05}),bt(e,t,0.03,["G3","D4","G4","B4","D5"],0.02,0.7,0.3,51),Wt(e,t,0.12,I("D6"),0.35,0.14),D(e,t,150)}},up:{cat:"ui",g:-5,render(t){let e=S(t,0.45);return xt(e,t,0,760,0.4,{dcy:0.03}),Rt(e,t,0.01,I("D5"),0.3,0.35,61),D(e,t,200)}},card:{cat:"ui",render(t){let e=S(t,0.8);return k(e,t,{t:0,d:0.28,mode:"bp",fc:1800,fc1:3500,q:1.2,env:tt(0.12,0.28),g:0.5,seed:341}),Rt(e,t,0.18,I("B4"),0.4,0.35,71),Rt(e,t,0.3,I("D5"),0.45,0.35,72),Yt(e,t,0.3,I("G6"),0.5,0.1),D(e,t,200)}},final:{cat:"jingle",g:1.5,render(t){let e=S(t,3.6);for(let o=0;o<20;o++)k(e,t,{t:o*0.03,d:0.05,mode:"hp",fc:1400,env:B(0.001,0.02),g:0.08+o*0.012,seed:350+o});let a=[["G5",0.62,0.11],["G5",0.75,0.11],["G5",0.88,0.11],["B5",1.01,0.3],["A5",1.33,0.11],["B5",1.46,0.11],["D6",1.59,1.3]];for(let[o,n,p]of a)K(e,t,n,I(o),p,0.24,{vib:p>0.5?[6,0.2]:null,sus:0.6}),Wt(e,t,n,I(o)/2,p,0.14);return bt(e,t,0.62,["G2","D3","G3","B3"],0.015,0.35,0.3,81),bt(e,t,1.01,["E2","B2","E3","G3"],0.015,0.3,0.26,82),bt(e,t,1.33,["D2","A2","D3","F#3"],0.015,0.25,0.26,83),bt(e,t,1.59,["G2","D3","G3","B3","D4","G4"],0.016,1.6,0.34,84),Bt(e,t,1.59,150,80,0.15,0.5),k(e,t,{t:1.59,d:1.9,mode:"hp",fc:4500,env:B(0.002,0.5),g:0.2,seed:390}),Xt(e,t,1.62,1.9,0.45,391),D(e,t,120)}},idleTick:{cat:"tick",g:-2,render(t){let e=S(t,0.08);return xt(e,t,0,1800,0.6,{dcy:0.012}),D(e,t,400)}},pTick:{cat:"phone",phone:!0,n:3,g:-8,render(t,e){let a=S(t,0.06),o=[1,1.05,0.96][e];return yt(a,t,{t:0,d:0.04,f:2900*o,ratio:1.41,idx:1.8,idxDcy:0.003,env:B(0.0003,0.008),g:0.7}),pt(a,t,0,0.3,4000,400+e,0.001),D(a,t,600)}},pSteady:{cat:"phone",phone:!0,g:-7,render(t){let e=S(t,0.15);return N(e,t,{t:0,d:0.09,f:I("G5"),env:B(0.003,0.04),g:0.5}),N(e,t,{t:0,d:0.09,f:I("G6"),env:B(0.003,0.02),g:0.12}),D(e,t,300)}},pWhoosh:{cat:"phone",phone:!0,n:3,g:-2,render(t,e){let a=[0.3,0.34,0.38][e],o=[1600,2500,3600][e],n=S(t,a+0.05);return k(n,t,{t:0,d:a,mode:"bp",fc:450,fc1:o,q:1.6,env:tt(a*0.62,a),g:1,seed:410+e}),k(n,t,{t:0,d:a,mode:"hp",fc:3000,env:tt(a*0.65,a),g:0.15+e*0.08,seed:413+e}),D(n,t,250)}},pStrike:{cat:"phone",phone:!0,g:-3,render(t){let e=S(t,0.2);return yt(e,t,{t:0,d:0.15,f:1350,ratio:1.52,idx:2.6,idxDcy:0.005,env:B(0.0005,0.025),g:0.7}),pt(e,t,0,0.5,3500,420),N(e,t,{t:0,d:0.1,f:600,f1:380,env:B(0.001,0.025),g:0.4}),D(e,t,300)}},pTurn:{cat:"phone",phone:!0,g:-3,render(t){let e=S(t,1);return Yt(e,t,0,I("G5"),0.8,0.45),Yt(e,t,0.14,I("D6"),0.9,0.45),N(e,t,{t:0.14,d:0.6,f:I("D6"),env:B(0.004,0.25),g:0.12}),D(e,t,300)}},pCup:{cat:"phone",phone:!0,render(t){let e=S(t,1.5);return st(e,t,0,1980,0.5,[[1,1,0.06],[2.76,0.5,0.035],[5.3,0.2,0.02]]),st(e,t,0.065,2150,0.3,[[1,1,0.04],[2.8,0.4,0.02]]),st(e,t,0.105,2300,0.18,[[1,1,0.03]]),N(e,t,{t:0.13,d:0.25,f:660,env:B(0.001,0.05),g:0.3}),["G5","B5","D6"].forEach((a,o)=>K(e,t,0.24+o*0.07,I(a),o===2?0.35:0.06,0.18)),Xt(e,t,0.3,1.1,0.4,430),D(e,t,300)}},pAce:{cat:"phone",phone:!0,g:1,render(t){let e=S(t,2.2);return st(e,t,0,1980,0.5,[[1,1,0.06],[2.76,0.5,0.035],[5.3,0.2,0.02]]),st(e,t,0.065,2150,0.3,[[1,1,0.04],[2.8,0.4,0.02]]),["G5","B5","D6","G6","B6"].forEach((a,o)=>K(e,t,0.2+o*0.06,I(a),o===4?0.6:0.05,0.18,{vib:o===4?[6,0.2]:null})),Yt(e,t,0.44,I("G6"),1,0.2),Xt(e,t,0.3,1.8,0.5,440),D(e,t,300)}}},Ee=Object.keys(vt),Be=Ee.filter((t)=>vt[t].phone),$0=Ee.filter((t)=>!vt[t].phone);function Re(t,e,a=0){let o=vt[t];if(!o)throw Error(`no sound called ${t}`);let n=o.render(e,Math.max(0,Math.min((o.n||1)-1,a)));if(!o.loop)n=Ae(Oe(n,e),e,0.4,5);let p=o.loop?Te(n,e):be(n,e),r=Je[o.cat]+(o.g||0)+(o.gv&&o.gv[a]||0),d=p>-120?Math.pow(10,(r-p)/20):1,u=re(n)*d;if(u>$e)d*=$e/u;for(let A=0;A<n.length;A++)n[A]*=d;return n}var e0=0.65;function ve(t=globalThis){let e=t.document,a=t.AudioContext||t.webkitAudioContext,o=null,n=null,p=new Map,r=[...Be],d=new Map,u=(T)=>{try{return T()}catch{return}};function A(){if(!a||e&&e.hidden)return;u(()=>{if(!o)o=new a,n=o.createGain(),n.gain.value=e0,n.connect(o.destination);if(o.state==="suspended"||o.state==="interrupted")o.resume().catch(()=>{});U()})}function $(T,R){let h=`${T}:${R}`;if(p.has(h))return p.get(h);let w=Re(T,o.sampleRate,R),g=o.createBuffer(1,w.length,o.sampleRate);return g.getChannelData(0).set(w),p.set(h,g),g}function U(){let T=()=>{let R=performance.now();while(r.length&&performance.now()-R<8){let h=r.shift();for(let w=0;w<(vt[h].n||1);w++)u(()=>$(h,w))}if(r.length)t.setTimeout(T,30)};t.setTimeout(T,0)}for(let T of["pointerdown","pointerup","touchend","click","keydown"])u(()=>e.addEventListener(T,A,!0));let E=()=>!!o&&o.state==="running"&&!(e&&e.hidden);return{get ready(){return E()},unlock:A,play(T,R={}){if(!E()||!vt[T])return;let h=R.gap??30,w=performance.now();if(w-(d.get(T)??-1e9)<h)return;d.set(T,w),u(()=>{let g=$(T,Math.max(0,Math.min((vt[T].n||1)-1,R.v|0))),C=o.createBufferSource(),L=o.createGain();C.buffer=g,C.playbackRate.value=R.rate||1,L.gain.value=R.vol??1,C.connect(L),L.connect(n),C.start(o.currentTime+(R.delay||0)),C.onended=()=>u(()=>{C.disconnect(),L.disconnect()})})},buzz(T){u(()=>t.navigator.vibrate&&t.navigator.vibrate(T))}}}var Se=`// Shared sample content and small drawing helpers for the style stills.
// Every style draws the same screens from this same data, so they compare like for like.
"use strict";

const INK = "#1a1c2c";
const PAR = [2, 2, 3];
const HOLES = ["WINDMILL", "BANK SHOT", "LOOP THE LOOP"];

// Join order, the game's own player colours, strokes on holes 1-3.
const PLAYERS = [
  { n: "LAKOTA", c: "#ff5a3c", s: [2, 2, 3] },
  { n: "MAYA", c: "#3c8cff", s: [2, 3, 3] },
  { n: "DESHAWN", c: "#ffd23f", s: [3, 2, 4] },
  { n: "AUNT ROSIE", c: "#4ad66d", s: [2, 2, 4] },
  { n: "PRIYA", c: "#c86bff", s: [2, 1, 3] },
  { n: "KIT", c: "#ff8ad0", s: [3, 2, 2] },
  { n: "BIG TOM", c: "#45e0e0", s: [4, 3, 5] },
  { n: "JUNEBUG", c: "#ff9a2e", s: [2, 4, 4] },
];
const byName = (n) => PLAYERS.find((p) => p.n === n);

// The score table as it stands after \`done\` holes. \`tie\` gives LAKOTA a 2 on the last hole (6 = PRIYA).
function table(done, tie) {
  const rows = PLAYERS.map((p, i) => {
    const s = p.s.slice();
    if (tie && p.n === "LAKOTA") s[2] = 2;
    const shown = s.map((v, h) => (h < done ? v : null));
    const total = shown.reduce((a, v) => a + (v || 0), 0);
    return { n: p.n, c: p.c, i, s: shown, total };
  });
  const best = Math.min(...rows.map((r) => r.total));
  rows.forEach((r) => {
    r.lead = r.total === best;
    r.rank = 1 + rows.filter((o) => o.total < r.total).length;
  });
  return rows;
}
const ranked = (rows) => rows.slice().sort((a, b) => a.total - b.total || a.i - b.i);

// What the phones show. "You" are MAYA, on hole 2, about to play your second putt.
const PHONE = {
  you: byName("MAYA"),
  holeN: 2,
  holeOf: 3,
  holeName: "BANK SHOT",
  par: 2,
  stroke: 2,
  dist: "3.4",
  step1: ["HOLD STILL", "Like a putter at the ball."],
  step2: ["PUTT!", "Swing back, then through."],
  putting: byName("DESHAWN"),
  before: 2,
  // name, strokes on this hole, in the cup?, total so far (holes done + this hole)
  rows: [
    ["LAKOTA", 2, true, 4],
    ["MAYA", 1, false, 3],
    ["DESHAWN", 1, false, 4],
    ["AUNT ROSIE", 1, false, 3],
    ["PRIYA", 1, true, 3],
    ["KIT", 1, false, 4],
    ["BIG TOM", 2, false, 6],
    ["JUNEBUG", 1, false, 3],
  ].map(([n, here, sunk, total]) => ({ n, c: byName(n).c, here, sunk, total })),
};

// Where the two balls met in the knock frame (screen pixels at 1080p), from frames.json.
const KNOCK = { x: 981, y: 700 };

// Which clean game frame sits behind each TV screen.
const BACK = {
  banner: "bg-banner",
  ballin: "bg-ballin",
  ace: "bg-ace",
  knock: "bg-knock-b",
  scorecard: "bg-card",
  final: "bg-final",
  tie: "bg-final",
};

// ---- helpers ----
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

// Pixel sprite from rows of characters. "." is empty; other characters look up a colour.
function pix(rows, scale, colors, cls) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  let r = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === "." || ch === " ") { x++; continue; }
      let e = x;
      while (e < row.length && row[e] === ch) e++;
      r += \`<rect x="\${x}" y="\${y}" width="\${e - x}" height="1" fill="\${colors[ch]}"/>\`;
      x = e;
    }
  });
  return \`<svg class="pix \${cls || ""}" width="\${w * scale}" height="\${h * scale}" viewBox="0 0 \${w} \${h}" shape-rendering="crispEdges">\${r}</svg>\`;
}

const SPR = {
  crown: ["#...#...#", "#...#...#", "##.###.##", "#########", "#########", "ooooooooo"],
  plus5: ["..#..", "..#..", "#####", "..#..", "..#.."],
  plus7: ["...#...", "...#...", "..###..", "#######", "..###..", "...#...", "...#..."],
  plus3: [".#.", "###", ".#."],
  star: [
    ".....#.....",
    ".....#.....",
    "....###....",
    "....###....",
    "###########",
    ".#########.",
    "..#######..",
    "...#####...",
    "..#######..",
    "..###.###..",
    ".##.....##.",
  ],
  cup: [
    "#.#######.#",
    "###########",
    "#.#######.#",
    "..#######..",
    "...#####...",
    "....###....",
    ".....#.....",
    ".....#.....",
    "...#####...",
    "..#######..",
  ],
  flag: ["#####..", "#######", "#####..", "#......", "#......", "#......", "#......"],
};
// A pixel arrow pointing left (mirror it for right). n = half height.
function arrowRows(n) {
  const rows = [];
  for (let y = 0; y <= 2 * n; y++) {
    const w = n - Math.abs(y - n) + 1;
    rows.push(".".repeat(n + 1 - w) + "#".repeat(w));
  }
  return rows;
}
// A chunky pixel arrow with a shaft, pointing left.
function arrowShaft(n, shaft) {
  return arrowRows(n).map((r, y) => r + (Math.abs(y - n) <= Math.floor(n / 2) ? "#".repeat(shaft) : ".".repeat(shaft)));
}

// The soft pixel font draws 2 and 5 badly (they read as 8 and S), so numbers inside soft-font
// text are set in the pixel capitals font instead.
const dg = (s) => String(s).replace(/\\d+(\\.\\d+)?/g, (m) => \`<span class="dg">\${m}</span>\`);

const STYLES = {};
`;var De=`// Style B, rounds 2 to 4. Every setting and every word lives here, so each can be changed in one place.
"use strict";

const SETTINGS = {
  ballInPlace: "top", // where the ball-in sign sits: "top" | "cup" | "bottom"
  knockFlash: true, // false = a knock only makes its sound, nothing is drawn
  winnerSign: "normal", // the winner sign on the final scores: "normal" | "big"
  step2: "SWING", // the one word the phone shows when the phone is pointing down. Nothing goes under it.
  startHide: 6.6, // seconds the title screen plays before START shows on the host's phone (round 5, Lakota: "for dramatic effect")
};

// What the ball-in sign says. The player's name goes on its own plank under it.
function scoreName(strokes, par) {
  if (strokes === 1) return "HOLE IN ONE";
  const d = strokes - par;
  if (d <= -2) return "EAGLE";
  if (d === -1) return "BIRDIE";
  if (d === 0) return "PAR";
  if (d === 1) return "BOGEY";
  return \`\${d}X BOGEY\`; // round 4, Lakota: "Just do 2x bogey ect". 2X BOGEY, 3X BOGEY, 4X BOGEY and so on
}

// The score name in the small lists: the waiting list on the phone and the corner list on the TV. A finished
// player's row shows this beside their strokes. Never the word IN. It is the same name as on the big sign,
// except a hole in one, which the lists write as ACE.
const SHORT_ACE = "ACE"; // a hole in one, in the lists. The big TV sign still says HOLE IN ONE!
function shortName(strokes, par) {
  return strokes === 1 ? SHORT_ACE : scoreName(strokes, par);
}

// Every word the TV signs use.
const TV_WORDS = {
  hole: (n) => \`HOLE \${n}\`,
  par: (p) => \`PAR \${p}\`,
  aceTop: (n, name) => \`HOLE \${n} - \${name}\`,
  ace: "HOLE IN ONE!",
  cardTitle: "MINI GOLF SCORE CARD",
  afterHole: (n) => \`AFTER HOLE \${n}\`,
  finalScores: "FINAL SCORES",
  cardHole: "HOLE",
  cardPar: "Par",
  cardTotal: "TOTAL",
  winner: "WINNER",
  tie: "A TIE AT THE TOP!",
  strokes: (n) => \`\${n} strokes\`,
  strokesEach: (n) => \`\${n} strokes each\`,
};

// Every word the phone shows. No line here may be filler (nothing like "look at the TV" or "get ready").
const PHONE_WORDS = {
  holeOf: (n, of) => \`HOLE \${n} OF \${of}\`,
  par: (p) => \`PAR \${p}\`,
  stroke: (n) => \`STROKE \${n}\`,
  toCup: (m) => \`\${m} m to the cup\`,
  // While aiming the phone shows the two big arrows, OK and the small view button. Nothing else.
  aim: "AIM",
  ok: "OK", // the aim is set
  aimAgain: "AIM AGAIN", // the small button after OK: back to the arrows (round 5)
  birdsEye: "BIRD'S EYE VIEW", // the small button: the TV shows the hole from above while it is on
  // After OK: plain words only (round 4, Lakota: "the simple words aim your phone down").
  step1: ["AIM YOUR", "PHONE DOWN"], // one entry per line
  step2: [SETTINGS.step2], // the phone is pointing down: the one word, on gold
  putting: (name) => \`\${name} is putting\`,
  before: (n) => (n === 0 ? "You are next" : n === 1 ? "1 putt before yours" : \`\${n} putts before yours\`),
  thisHole: "THIS HOLE",
  all: "ALL",
  // Not drawn this round, kept here so they change in the same place:
  askMotion: "TAP TO START", // iPhones need one tap before they can feel the swing
  touch1: ["PULL", "BACK"], // phones with no motion sensor: drag instead of swing
  touch2: ["LET GO"],
};

// Every word of the title screen and the setup screens (round 4, first draft).
const SETUP_WORDS = {
  name: "MINI GOLF", // the game has no final name yet. This is the working title.
  pressStart: "PRESS START", // TV title screen
  start: "START", // the host's phone, on the title screen
  makeBall: "MAKE YOUR BALL", // TV, over the players
  count: (n, of) => \`READY \${n}/\${of}\`,
  picking: "PICKING",
  ready: "READY",
  allReady: "EVERYONE'S READY!",
  hint: "MAKE YOUR BALL ON YOUR PHONE, THEN TAP DONE", // TV only
  drawingTag: "DRAWING", // TV, under a player who is drawing their own outfit
  back: "BACK",
  done: "DONE",
  // (Round 6: mini golf has no join screen of its own. Players join in FoxBox.)
  // the ball picker on the phone (round 5: laid out like bowling's ball picker, "wheels")
  wOutfit: "OUTFIT",
  wPattern: "PATTERN", // round 6 (Lakota: "Yes call it pattern"): what is painted on the ball. Never "style".
  wMain: "MAIN COLOR",
  wSecond: "SECOND COLOR",
  surprise: "SURPRISE ME",
  // The button beside your ball, always there: opens the drawing pad. Round 7 (Lakota: "Maybe let's say draw
  // an outfit"): DRAW AN OUTFIT, in two lines, and no wood grain on it (".ownb" in pick.js).
  makeOwn: ["DRAW AN", "OUTFIT"],
  patterns: "BALL PATTERNS",
  paper: "DRAWING PAPER",
  // the drawing pad (round 5: the same buttons as Sky Scramble's)
  drawTitle: ["DRAW YOUR", "OUTFIT"],
  undo: "UNDO",
  clear: "CLEAR",
  clearAsk: "CLEAR IT ALL?",
  yes: "YES",
  no: "NO",
  pen: "PEN",
  fill: "FILL",
  eraser: "ERASER",
  sizes: ["S", "M", "L"],
  onCourse: ["ON THE", "COURSE"],
  yourBall: "YOUR BALL",
  readyOn: "READY!", // the READY button after it is tapped
  change: "CHANGE",
  waiting: (n) => (n === 1 ? "WAITING FOR 1 PLAYER" : \`WAITING FOR \${n} PLAYERS\`),
  sheet: "GOLF BALL OUTFITS",
  colors: (n) => \`\${n} COLORS\`,
  closeUp: "CLOSE UP",
};
`;var Ie=`// The golf balls players make: an outfit, a pattern and two colours (round 5: the same things bowling's ball
// picker offers, plus the outfit). A plain script (no page needed), so the stage, the tests and the frame maker
// can all use it. A player's ball is { outfit, pattern, colors: [main, second] }
// (round 6: "pattern", the same word and the same twelve as bowling's ball).
//
// ALL OUTFITS LIVE IN ONE LIST, \`OUTFITS\`. The first ten are below. More are added with addOutfits(theme, list):
// each theme has its own file in look/b/outfits/ and look/b/outfits/index.js adds whichever are there.
//
// A ball is drawn square by square at any size. An outfit is a short list of flat shapes, measured in ball
// radii from the middle of the ball (x to the right, y down, so the top of the ball is y = -1). The same list
// makes the big ball on the phone and the tiny one on the course: each is drawn fresh at its own size, so the
// squares stay crisp and nothing is a shrunk picture.
//   ["e", cx, cy, rx, ry, colour]            a filled oval
//   ["r", x0, y0, x1, y1, colour]            a box
//   ["p", [[x, y], ...], colour]             a shape with straight sides
//   ... and an optional last entry [x0, y0, x1, y1]: only the part inside this box is drawn
"use strict";

const BALL_INK = "#1a1c2c";

// The colours a player can pick. The first eight are the game's own player colours.
const BALL_COLORS = [
  ["RED", "#ff5a3c"], ["BLUE", "#3c8cff"], ["GOLD", "#ffd23f"], ["GREEN", "#4ad66d"],
  ["PURPLE", "#c86bff"], ["PINK", "#ff8ad0"], ["AQUA", "#45e0e0"], ["ORANGE", "#ff9a2e"],
  ["WHITE", "#f4f4f0"], ["BLACK", "#4a4a5c"], ["LIME", "#b6f03c"], ["SILVER", "#b4bcc8"],
];

const X = (list) => list.map((s) => { const m = s.slice(); if (m[0] === "p") m[1] = m[1].map(([x, y]) => [-x, y]); else if (m[0] === "e") m[1] = -m[1]; else { const a = -m[3], b = -m[1]; m[1] = a; m[3] = b; } return m; }); // the same shapes, mirrored

const OUTFITS = [
  { id: "none", name: "NO OUTFIT", colors: {}, front: [] },
  {
    id: "cowboy", name: "COWBOY", colors: { A: "#a8642e", B: "#5e3216", C: "#ffd23f", D: "#c98444" },
    front: [
      ["e", 0, -0.76, 1.5, 0.27, "A"], ["e", -1.32, -0.93, 0.3, 0.2, "A"], ["e", 1.32, -0.93, 0.3, 0.2, "A"],
      ["p", [[-0.64, -0.8], [-0.56, -1.6], [-0.2, -1.78], [0, -1.6], [0.2, -1.78], [0.56, -1.6], [0.64, -0.8]], "A"],
      ["p", [[-0.5, -1.56], [-0.2, -1.7], [-0.08, -1.58], [-0.36, -1.1], [-0.5, -1.1]], "D"],
      ["r", -0.64, -1.06, 0.64, -0.86, "B"], ["r", -0.12, -1.08, 0.12, -0.84, "C"],
    ],
  },
  {
    id: "tophat", name: "TOP HAT", colors: { A: "#2a2134", B: "#b8323a", C: "#514868" },
    front: [
      ["r", -1.05, -0.88, 1.05, -0.66, "A"], ["r", -0.68, -1.95, 0.68, -0.86, "A"],
      ["r", -0.68, -1.16, 0.68, -0.9, "B"], ["r", -0.52, -1.84, -0.36, -1.26, "C"],
    ],
  },
  {
    id: "crown", name: "CROWN", colors: { A: "#ffd23f", B: "#e0403a", C: "#3c8cff", D: "#d9a520", E: "#fff0a0" },
    front: [
      ["r", -0.84, -1.06, 0.84, -0.64, "A"],
      ["p", [[-0.84, -1.04], [-0.84, -1.62], [-0.42, -1.04]], "A"], ["p", [[-0.4, -1.04], [0, -1.78], [0.4, -1.04]], "A"], ["p", [[0.42, -1.04], [0.84, -1.62], [0.84, -1.04]], "A"],
      ["e", -0.84, -1.64, 0.13, 0.13, "E"], ["e", 0, -1.8, 0.13, 0.13, "E"], ["e", 0.84, -1.64, 0.13, 0.13, "E"],
      ["r", -0.84, -0.74, 0.84, -0.64, "D"],
      ["e", 0, -0.9, 0.15, 0.13, "B"], ["e", -0.52, -0.9, 0.11, 0.1, "C"], ["e", 0.52, -0.9, 0.11, 0.1, "C"],
    ],
  },
  {
    id: "pirate", name: "PIRATE", colors: { A: "#2a2134", B: "#f4f4f0", C: "#ffd23f" },
    front: [
      ["p", [[-0.98, -0.3], [0.98, -0.52], [0.98, -0.4], [-0.98, -0.18]], "A"], ["e", 0.4, -0.2, 0.32, 0.28, "A"],
      ["p", [[-1.36, -0.68], [-1.12, -1.2], [-0.56, -1.46], [0, -1.8], [0.56, -1.46], [1.12, -1.2], [1.36, -0.68]], "A"],
      ["p", [[-1.36, -0.68], [-1.3, -0.82], [1.3, -0.82], [1.36, -0.68]], "C"],
      ["e", 0, -1.2, 0.22, 0.2, "B"], ["r", -0.12, -1.06, 0.12, -0.96, "B"],
    ],
  },
  {
    id: "wizard", name: "WIZARD", colors: { A: "#33409c", B: "#ffd23f", C: "#4a5bc4" },
    front: [
      ["e", 0, -0.74, 1.34, 0.22, "A"],
      ["p", [[-0.86, -0.76], [-0.2, -1.86], [0.5, -2.26], [0.34, -1.74], [0.86, -0.76]], "A"],
      ["p", [[-0.6, -0.9], [-0.14, -1.74], [0.02, -1.76], [-0.34, -0.9]], "C"],
      ["r", -0.8, -0.98, 0.8, -0.84, "B"],
      ["r", 0.12, -1.34, 0.3, -1.18, "B"], ["r", -0.3, -1.6, -0.16, -1.46, "B"], ["r", 0.3, -1.98, 0.42, -1.86, "B"],
    ],
  },
  {
    id: "party", name: "PARTY HAT", colors: { A: "#ff5a8a", B: "#ffd23f", C: "#f4f4f0", D: "#45e0e0" },
    front: [
      ["p", [[-0.66, -0.7], [0, -2.02], [0.66, -0.7]], "A"],
      ["p", [[-0.66, -0.7], [0, -2.02], [0.66, -0.7]], "B", [-1, -1.22, 1, -0.98]],
      ["p", [[-0.66, -0.7], [0, -2.02], [0.66, -0.7]], "D", [-1, -1.72, 1, -1.48]],
      ["r", -0.72, -0.84, 0.72, -0.68, "C"], ["e", 0, -2.06, 0.22, 0.22, "C"],
    ],
  },
  {
    id: "chef", name: "CHEF", colors: { A: "#f4f4f0", B: "#c4c6d2" },
    front: [
      ["e", -0.52, -1.5, 0.48, 0.42, "A"], ["e", 0.52, -1.5, 0.48, 0.42, "A"], ["e", 0, -1.7, 0.52, 0.42, "A"],
      ["r", -0.64, -1.3, 0.64, -0.68, "A"], ["r", -0.64, -0.82, 0.64, -0.68, "B"],
      ["r", -0.26, -1.26, -0.16, -0.86, "B"], ["r", 0.16, -1.26, 0.26, -0.86, "B"],
    ],
  },
  {
    id: "viking", name: "VIKING", colors: { A: "#aab2c0", B: "#767f92", C: "#ffd23f", D: "#fff1c9", E: "#d3d9e2" },
    back: [
      ["p", [[-0.7, -1.02], [-1.2, -1.06], [-1.56, -1.46], [-1.5, -2.0], [-1.22, -1.5], [-0.8, -1.36]], "D"],
      ["p", [[0.7, -1.02], [1.2, -1.06], [1.56, -1.46], [1.5, -2.0], [1.22, -1.5], [0.8, -1.36]], "D"],
    ],
    front: [
      ["e", 0, -0.66, 0.94, 0.82, "A", [-2, -3, 2, -0.62]], ["e", -0.34, -1.06, 0.2, 0.26, "E"],
      ["r", -0.98, -0.8, 0.98, -0.6, "B"], ["r", -0.11, -0.6, 0.11, -0.2, "B"],
      ["e", -0.6, -0.7, 0.08, 0.08, "C"], ["e", 0.6, -0.7, 0.08, 0.08, "C"], ["e", 0, -0.7, 0.08, 0.08, "C"],
    ],
  },
  {
    id: "propeller", name: "PROPELLER", colors: { A: "#e0403a", B: "#3c8cff", C: "#ffd23f", D: "#2a2134", E: "#f4f4f0" },
    front: [
      ["e", 0, -0.66, 0.86, 0.66, "A", [-2, -3, 2, -0.64]],
      ["e", 0, -0.66, 0.86, 0.66, "B", [-2, -3, -0.28, -0.64]], ["e", 0, -0.66, 0.86, 0.66, "C", [0.28, -3, 2, -0.64]],
      ["r", -0.9, -0.76, 0.9, -0.62, "D"],
      ["r", -0.06, -1.62, 0.06, -1.28, "D"],
      ["e", -0.46, -1.66, 0.42, 0.13, "E"], ["e", 0.46, -1.66, 0.42, 0.13, "E"], ["e", 0, -1.66, 0.12, 0.12, "A"],
    ],
  },
  {
    id: "shades", name: "SHADES", colors: { A: "#2a2134", B: "#9fe8ff" },
    front: [
      ["r", -1.0, -0.4, 1.0, -0.28, "A"],
      ["p", [[-0.82, -0.44], [-0.08, -0.44], [-0.14, 0.0], [-0.7, 0.0]], "A"], ["p", [[0.08, -0.44], [0.82, -0.44], [0.7, 0.0], [0.14, 0.0]], "A"],
      ["r", -0.7, -0.36, -0.52, -0.24, "B"], ["r", 0.2, -0.36, 0.38, -0.24, "B"],
    ],
  },
];
// Where each outfit came from: the ten classics and the five theme files. Round 6 (Lakota: "don't do outfit
// theme ... just one long strip"): the player never sees a theme. This only keeps the list in a steady order.
const OUTFIT_THEMES = [["classic", "CLASSIC"], ["fantasy", "FANTASY"], ["spooky", "SPOOKY"], ["space", "SPACE"], ["sports", "SPORTS"], ["animals", "ANIMALS"]];
OUTFITS.forEach((o) => { o.theme = o.id === "none" ? "" : "classic"; });
/** add a theme's outfits to the one list (an id that is already there is left alone) */
function addOutfits(theme, list) { for (const o of list || []) if (o && o.id && !OUTFITS.some((x) => x.id === o.id)) OUTFITS.push({ ...o, theme }); }
/** the outfits of one theme, in order */
const outfitsIn = (theme) => OUTFITS.filter((o) => o.theme === theme);
// An outfit is named by its id. A player's own drawing (draw.js) is handed over as the outfit itself:
// { id: "drawn", name, colors, art: { R, rows } }, squares drawn on the ball's own box at size R.
const outfitOf = (id) => (id && typeof id === "object" ? id : OUTFITS.find((o) => o.id === id) || OUTFITS[0]);

// The patterns: what is painted on the ball in the second colour. The same twelve as bowling's ball patterns,
// redrawn flat for a golf ball. Each is a rule: is this spot (in ball radii from the middle) the second colour?
const _stars = [[-0.5, -0.32], [0.22, -0.62], [0.58, 0.08], [-0.2, 0.36], [0.32, 0.56], [-0.68, 0.18], [0.02, -0.12], [0.62, -0.44], [-0.36, 0.72]];
const BALL_PATTERNS = [
  ["plain", "PLAIN", null],
  ["stripe", "STRIPE", (u, v) => Math.abs(v + u * 0.3 - 0.12) < 0.3],
  ["halves", "HALVES", (u, v) => v + u * 0.45 > 0.05],
  ["dots", "DOTS", (u, v) => { const s = 0.62, a = (u * 0.94 + v * 0.34) / s, b = (v * 0.94 - u * 0.34) / s, x = a - Math.round(a), y = b - Math.round(b); return x * x + y * y < 0.1; }],
  ["rings", "RINGS", (u, v) => { const d = Math.hypot(u + 0.15, v + 0.1); return d < 0.22 || (d > 0.48 && d < 0.76); }],
  ["checker", "CHECKER", (u, v) => (Math.floor((u + 4) / 0.5) + Math.floor((v + 4) / 0.5)) % 2 === 0],
  ["zigzag", "ZIGZAG", (u, v) => Math.abs(v - 0.12 + Math.abs((((u * 1.6 + 8) % 1) + 1) % 1 - 0.5) * 0.7) < 0.2],
  ["swirl", "SWIRL", (u, v) => Math.sin(Math.atan2(v, u) * 2 + Math.hypot(u, v) * 5) > 0.15],
  ["panels", "BEACH BALL", (u, v) => Math.floor((Math.atan2(v + 0.2, u + 0.15) + Math.PI) / (Math.PI / 3) + 0.5) % 2 === 0],
  ["tiger", "TIGER", (u, v) => Math.sin((v + 0.28 * Math.sin(u * 4.2)) * 8.5) > 0.45],
  ["marble", "MARBLE", (u, v) => Math.sin(u * 4.4 + Math.sin(v * 3.7) * 1.6) + Math.sin(v * 5.2 + Math.sin(u * 2.9) * 1.9) > 0.75],
  ["galaxy", "GALAXY", (u, v) => Math.abs(v - u * 0.5 - 0.12) < 0.07 || _stars.some(([a, b]) => (u - a) * (u - a) + (v - b) * (v - b) < 0.013)],
];
const patternOf = (id) => BALL_PATTERNS.find((s) => s[0] === id) || BALL_PATTERNS[0];

const _hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const _mix = (c, to, k) => "#" + _hex(c).map((v, i) => Math.round(v + (to[i] - v) * k).toString(16).padStart(2, "0")).join("");

function _inside(s, u, v) {
  const clip = s[s.length - 1];
  if (Array.isArray(clip) && typeof clip[0] === "number" && (u < clip[0] || u > clip[2] || v < clip[1] || v > clip[3])) return false;
  if (s[0] === "e") { const a = (u - s[1]) / s[3], b = (v - s[2]) / s[4]; return a * a + b * b <= 1; }
  if (s[0] === "r") return u >= s[1] && u <= s[3] && v >= s[2] && v <= s[4];
  const p = s[1]; let inn = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > v) !== (p[j][1] > v) && u < ((p[j][0] - p[i][0]) * (v - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) inn = !inn;
  return inn;
}
const _col = (s) => (s[0] === "p" ? s[2] : s[5]);

// The ball as rows of letters, R squares from the middle to the edge. Every ball of one size has the same
// box, with the middle of the ball at (cx, cy), so balls with different outfits line up.
//   . empty   o outline   b d l the ball's colour, its shade and its light   w the white glint   m a dimple
//   s t u v the second colour, its shade, its light and its dimple (where the pattern paints it)
//   A B C ... the outfit's own colours
// Rounding that is the same on both sides of the middle: Math.round sends -0.5 and 0.5 the same way (both up),
// which pulls one half of a drawing a square across the other. Here -d always lands on -(d rounded).
const _rnd = (d) => (d < 0 ? -Math.round(-d) : Math.round(d));
// a player's own drawing, laid on the ball's box at any size: bigger = each square repeated, smaller = the
// most common colour of the squares a spot covers (so a thin line does not vanish on the course).
// Both ways look at the drawing AROUND the spot the ball square sits on, never at a box with its corner there:
// a box like that is not the same to the left and to the right of the middle, so one of a pair of eyes could sit
// wholly inside one ball square and the other straddle two - and the straddling one, half in each, was then too
// faint to keep and vanished. The ball came out with one eye.
function _layArt(g, art, R, cx, cy) {
  const k = art.R / R, sx = Math.ceil(1.75 * art.R) + 1, sy = Math.ceil(2.4 * art.R) + 1, rows = art.rows;
  const at = (x, y) => (rows[y] && rows[y][x] && rows[y][x] !== "." ? rows[y][x] : null);
  const half = k / 2; // how far, in drawing squares, one ball square reaches either side of its middle
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
    if (k <= 1) { const c = at(_rnd((x - cx) * k) + sx, _rnd((y - cy) * k) + sy); if (c) g[y][x] = c; continue; }
    const ax = (x - cx) * k + sx, ay = (y - cy) * k + sy; // where this ball square's middle sits on the drawing
    const n = {}; let cells = 0, full = 0, best = null;
    for (let j = Math.ceil(ay - half); j <= Math.floor(ay + half); j++) for (let i = Math.ceil(ax - half); i <= Math.floor(ax + half); i++) {
      cells++; const c = at(i, j); if (!c) continue;
      full++; n[c] = (n[c] || 0) + 1; if (!best || n[c] > n[best]) best = c;
    }
    if (best && full * 10 >= cells * 3) g[y][x] = best;
  }
}
function ballGrid(R, outfitId, patternId) {
  const of = outfitOf(outfitId), cx = Math.ceil(1.75 * R) + 1, cy = Math.ceil(2.4 * R) + 1, W = cx * 2 + 1, H = cy + R + 3;
  const mk = () => Array.from({ length: H }, () => Array(W).fill("."));
  const back = mk(), ball = mk(), front = mk();
  const lay = (g, shapes) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const u = (x - cx) / R, v = (y - cy) / R; for (const s of shapes) if (_inside(s, u, v)) g[y][x] = _col(s); } };
  lay(back, of.back || []);
  const paint = patternOf(patternId)[2], SECOND = { b: "s", d: "t", l: "u", m: "v", n: "t" };
  const rr = (R + 0.35) * (R + 0.35);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy > rr) continue;
    const q = (dx * 0.55 + dy * 0.85) / R;
    let c = q > 0.5 ? "d" : q < -0.52 && R >= 4 ? "l" : "b";
    // dimples: a loose grid of small dents, only when the ball is big enough to show them
    if (R >= 8 && c !== "l") { const sp = Math.max(3, Math.round(R * 0.36)), row = Math.round(dy / sp), ox = row & 1 ? sp / 2 : 0; if (Math.abs(dy - row * sp) < 0.5 && Math.abs(((dx - ox) / sp) - Math.round((dx - ox) / sp)) * sp < 0.5 && dx * dx + dy * dy < R * R * 0.72) c = c === "d" ? "n" : "m"; }
    if (paint && paint(dx / R, dy / R)) c = SECOND[c] || c;
    ball[y][x] = c;
  }
  const gl = Math.max(1, Math.round(R / 5)), gx = Math.round(cx - R * 0.42), gy = Math.round(cy - R * 0.46);
  if (R >= 3) for (let j = 0; j < gl; j++) for (let i = 0; i < gl; i++) ball[gy + j][gx + i] = "w";
  if (of.art) _layArt(front, of.art, R, cx, cy); else lay(front, of.front || []);
  const out = mk(), filled = (g, x, y) => y >= 0 && y < H && x >= 0 && x < W && g[y][x] !== ".";
  const put = (g) => g.forEach((row, y) => row.forEach((c, x) => { if (c !== ".") out[y][x] = c; }));
  put(back); put(ball);
  // where the outfit lies on the ball it gets a thin dark edge of its own (big balls only)
  if (R >= 7) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (front[y][x] === "." && ball[y][x] !== "." && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => filled(front, x + a, y + b))) out[y][x] = "o";
  put(front);
  const fin = out.map((row) => row.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (out[y][x] === "." && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => filled(out, x + a, y + b))) fin[y][x] = "o";
  return { rows: fin.map((r) => r.join("")), w: W, h: H, cx, cy, R };
}
function ballColors(color, outfitId, second) {
  const c2 = second || color;
  return { o: BALL_INK, s: c2, t: _mix(c2, [26, 28, 44], 0.3), u: _mix(c2, [255, 255, 255], 0.5), v: _mix(c2, [26, 28, 44], 0.16), b: color, d: _mix(color, [26, 28, 44], 0.3), l: _mix(color, [255, 255, 255], 0.5), w: "#ffffff", m: _mix(color, [26, 28, 44], 0.16), n: _mix(color, [26, 28, 44], 0.42), ...outfitOf(outfitId).colors };
}
`;var Ce=`"use strict";
const OUTFITS_FANTASY = [
  {
    id: "fa_knight", name: "KNIGHT", colors: { A: "#aab2c0", B: "#767f92", C: "#2a2134", D: "#e0403a", E: "#d3d9e2" },
    back: [
      ["e", 0.1, -1.66, 0.44, 0.36, "D"], ["e", 0.64, -1.8, 0.46, 0.32, "D"], ["e", 1.12, -1.56, 0.38, 0.32, "D"], ["e", 1.38, -1.2, 0.28, 0.28, "D"],
    ],
    front: [
      ["e", 0, -0.5, 1.06, 0.9, "A", [-2, -3, 2, -0.3]], ["e", -0.44, -1.08, 0.2, 0.14, "E"],
      ["r", -0.1, -1.44, 0.1, -0.8, "B"],
      ["r", -0.82, -0.8, 0.82, -0.54, "C"], ["r", -0.1, -0.8, 0.1, -0.54, "B"],
      ["r", -1.08, -0.42, 1.08, -0.26, "B"],
    ],
  },
  {
    id: "fa_jester", name: "JESTER", colors: { A: "#e0403a", B: "#8a45d8", C: "#ffd23f", D: "#2a2134" },
    front: [
      ["p", [[0, -0.76], [-0.84, -0.76], [-1.06, -1.14], [-1.56, -1.1], [-1.46, -1.56], [-1.0, -1.86], [-0.4, -1.68], [0, -1.2]], "A"],
      ["p", [[0, -0.76], [0.84, -0.76], [1.06, -1.14], [1.56, -1.1], [1.46, -1.56], [1.0, -1.86], [0.4, -1.68], [0, -1.2]], "B"],
      ["r", -0.9, -0.92, 0, -0.68, "B"], ["r", 0, -0.92, 0.9, -0.68, "A"],
      ["e", -1.54, -0.96, 0.18, 0.18, "C"], ["e", 1.54, -0.96, 0.18, 0.18, "C"], ["e", 0, -0.8, 0.17, 0.17, "C"],
      ["r", -1.6, -0.94, -1.48, -0.84, "D"], ["r", 1.48, -0.94, 1.6, -0.84, "D"],
    ],
  },
  {
    id: "fa_princess", name: "PRINCESS", colors: { A: "#ff7ab8", B: "#ffd23f", C: "#d9c2ff", D: "#d94f95" },
    back: [
      ["p", [[0.42, -2.24], [1.0, -2.14], [1.5, -1.66], [1.72, -0.7], [1.36, -0.46], [1.26, -1.2], [0.96, -1.6], [0.5, -1.86]], "C"],
    ],
    front: [
      ["p", [[-0.66, -0.72], [0.42, -2.24], [0.66, -0.72]], "A"],
      ["p", [[-0.4, -0.9], [0.3, -1.96], [0.42, -1.96], [-0.1, -0.9]], "D"],
      ["r", -0.72, -0.9, 0.72, -0.7, "B"], ["e", 0, -0.8, 0.13, 0.11, "D"],
      ["e", 0.42, -2.22, 0.14, 0.14, "B"],
    ],
  },
  {
    id: "fa_dragon", name: "DRAGON", colors: { A: "#2f8a48", B: "#fff1c9", C: "#ff9a2e", D: "#1f6436" },
    back: [
      ["p", [[-0.8, -0.3], [-1.3, -1.0], [-1.72, -0.9], [-1.58, -0.5], [-1.72, -0.2], [-1.44, -0.08], [-1.5, 0.24], [-1.1, 0.12], [-0.8, 0.2]], "A"],
      ["p", [[0.8, -0.3], [1.3, -1.0], [1.72, -0.9], [1.58, -0.5], [1.72, -0.2], [1.44, -0.08], [1.5, 0.24], [1.1, 0.12], [0.8, 0.2]], "A"],
      ["p", [[-1.1, -0.36], [-1.32, -0.8], [-1.52, -0.76], [-1.4, -0.44], [-1.48, -0.24]], "C"],
      ["p", [[1.1, -0.36], [1.32, -0.8], [1.52, -0.76], [1.4, -0.44], [1.48, -0.24]], "C"],
    ],
    front: [
      ["e", 0, -0.62, 0.96, 0.62, "A", [-2, -3, 2, -0.6]],
      ["p", [[-0.24, -1.14], [0, -1.84], [0.24, -1.14]], "C"],
      ["p", [[-0.62, -1.02], [-0.44, -1.5], [-0.22, -1.14]], "C"], ["p", [[0.62, -1.02], [0.44, -1.5], [0.22, -1.14]], "C"],
      ["p", [[-0.98, -0.72], [-1.3, -1.5], [-0.62, -1.02]], "B"], ["p", [[0.98, -0.72], [1.3, -1.5], [0.62, -1.02]], "B"],
      ["r", -0.98, -0.76, 0.98, -0.6, "D"],
    ],
  },
  {
    id: "fa_elf", name: "ELF", colors: { A: "#ffc9a0", B: "#e89a78", C: "#5fbf3a", D: "#2f7a3a", E: "#e0403a" },
    back: [
      ["p", [[-0.8, -0.5], [-1.72, -1.0], [-1.3, -0.26], [-0.9, 0.04]], "A"], ["p", [[0.8, -0.5], [1.72, -1.0], [1.3, -0.26], [0.9, 0.04]], "A"],
      ["p", [[-1.0, -0.42], [-1.5, -0.8], [-1.24, -0.32]], "B"], ["p", [[1.0, -0.42], [1.5, -0.8], [1.24, -0.32]], "B"],
    ],
    front: [
      ["p", [[-0.4, -0.8], [-0.94, -1.02], [-1.1, -1.56], [-0.5, -1.34]], "C"], ["p", [[0.4, -0.8], [0.94, -1.02], [1.1, -1.56], [0.5, -1.34]], "C"],
      ["p", [[0, -0.78], [-0.32, -1.2], [0, -1.86], [0.32, -1.2]], "C"],
      ["r", -0.05, -1.6, 0.05, -0.84, "D"],
      ["r", -0.86, -0.84, 0.86, -0.66, "D"],
      ["e", 0, -0.76, 0.17, 0.16, "E"],
    ],
  },
  {
    id: "fa_archer", name: "ARCHER", colors: { A: "#2f8a4f", B: "#1f6038", C: "#e0403a", D: "#8a5230", E: "#fff1c9" },
    back: [
      ["p", [[0.6, 0.2], [1.1, -0.5], [1.42, -0.26], [0.9, 0.4]], "D"],
      ["p", [[0.7, -0.3], [1.3, -1.1], [1.42, -1.02], [0.82, -0.22]], "E"], ["p", [[0.9, -0.1], [1.52, -0.86], [1.64, -0.78], [1.02, -0.02]], "E"],
      ["p", [[1.2, -1.06], [1.4, -1.34], [1.56, -1.1], [1.34, -0.86]], "C"], ["p", [[1.42, -0.82], [1.62, -1.08], [1.74, -0.84], [1.56, -0.6]], "C"],
    ],
    front: [
      ["p", [[0.2, -1.1], [0.5, -1.9], [0.92, -2.3], [0.98, -1.7], [0.6, -1.0]], "C"],
      ["p", [[-1.5, -0.7], [-0.5, -1.0], [-0.1, -1.6], [0.5, -1.5], [0.9, -0.9], [0.96, -0.66], [-0.6, -0.62]], "A"],
      ["p", [[-1.5, -0.7], [-0.6, -0.9], [0.96, -0.86], [1.02, -0.62], [-0.6, -0.6]], "B"],
    ],
  },
  {
    id: "fa_fairy", name: "FAIRY", colors: { A: "#bdf3ff", B: "#ff9ad8", C: "#ff6fae", D: "#ffd23f", E: "#4ab85a" },
    back: [
      ["p", [[-0.6, -0.2], [-1.1, -1.2], [-1.6, -1.3], [-1.74, -0.8], [-1.5, -0.3]], "A"], ["p", [[0.6, -0.2], [1.1, -1.2], [1.6, -1.3], [1.74, -0.8], [1.5, -0.3]], "A"],
      ["p", [[-0.6, 0.0], [-1.5, -0.1], [-1.62, 0.4], [-1.2, 0.7], [-0.7, 0.5]], "A"], ["p", [[0.6, 0.0], [1.5, -0.1], [1.62, 0.4], [1.2, 0.7], [0.7, 0.5]], "A"],
      ["p", [[-1.1, -0.5], [-1.3, -1.0], [-1.56, -0.9], [-1.44, -0.5]], "B"], ["p", [[1.1, -0.5], [1.3, -1.0], [1.56, -0.9], [1.44, -0.5]], "B"],
      ["e", -1.28, 0.3, 0.16, 0.16, "B"], ["e", 1.28, 0.3, 0.16, 0.16, "B"],
    ],
    front: [
      ["e", -0.34, -0.96, 0.2, 0.13, "E"], ["e", 0.34, -0.96, 0.2, 0.13, "E"], ["e", -0.96, -0.6, 0.16, 0.12, "E"], ["e", 0.96, -0.6, 0.16, 0.12, "E"],
      ["e", -0.66, -0.8, 0.3, 0.3, "C"], ["e", 0.66, -0.8, 0.3, 0.3, "C"], ["e", 0, -1.04, 0.32, 0.32, "C"],
      ["e", -0.66, -0.8, 0.12, 0.12, "D"], ["e", 0.66, -0.8, 0.12, 0.12, "D"], ["e", 0, -1.04, 0.13, 0.13, "D"],
    ],
  },
  {
    id: "fa_hero", name: "HERO", colors: { A: "#d3d9e2", B: "#767f92", C: "#ffd23f", D: "#3c6fd8" },
    back: [
      ["p", [[0.58, -1.06], [1.18, -1.98], [1.44, -2.12], [1.42, -1.82], [0.82, -0.9]], "A"],
      ["p", [[0.7, -0.98], [1.3, -1.9], [1.44, -2.12], [1.42, -1.82], [0.82, -0.9]], "B"],
      ["p", [[1.09, -0.84], [0.98, -0.68], [0.31, -1.12], [0.42, -1.28]], "C"],
    ],
    front: [
      ["p", [[-1.2, -0.2], [-0.2, -0.2], [-0.2, 0.35], [-0.7, 0.95], [-1.2, 0.35]], "B"],
      ["p", [[-1.08, -0.08], [-0.32, -0.08], [-0.32, 0.3], [-0.7, 0.76], [-1.08, 0.3]], "D"],
      ["r", -0.78, -0.02, -0.62, 0.56, "C"], ["r", -1.0, 0.1, -0.4, 0.26, "C"],
    ],
  },
  // round 6: takes the place DRAGON left (Lakota: USE, liked)
  {
    id: "fa_mushroom", name: "MUSHROOM", colors: { A: "#e0403a", B: "#f4f4f0", C: "#fff1c9" },
    front: [
      ["e", 0, -0.8, 1.3, 0.28, "C", [-2, -0.8, 2, 0]],
      ["e", 0, -0.8, 1.3, 0.9, "A", [-2, -3, 2, -0.8]],
      ["e", 0, -1.34, 0.3, 0.24, "B"], ["e", -0.72, -1.08, 0.22, 0.18, "B"], ["e", 0.74, -1.1, 0.2, 0.17, "B"],
      ["e", 0.36, -0.98, 0.12, 0.1, "B"], ["e", -0.28, -0.96, 0.1, 0.09, "B"],
    ],
  },
];
if (typeof module !== "undefined") module.exports = OUTFITS_FANTASY;
`;var ke=`"use strict";
// Mini golf ball outfits, theme SPOOKY (friendly Halloween). Same format as OUTFITS in balls.js.
const OUTFITS_SPOOKY = [
  {
    id: "sp_pumpkin", name: "PUMPKIN", colors: { A: "#f07a1c", B: "#b9500c", C: "#6cc644", D: "#8a6a2c" },
    front: [
      ["e", -0.5, -0.72, 0.5, 0.5, "A", [-2, -3, 2, -0.6]], ["e", 0.5, -0.72, 0.5, 0.5, "A", [-2, -3, 2, -0.6]], ["e", 0, -0.78, 0.5, 0.56, "A", [-2, -3, 2, -0.6]],
      ["e", -0.5, -0.72, 0.5, 0.5, "B", [-2, -0.72, 2, -0.6]], ["e", 0.5, -0.72, 0.5, 0.5, "B", [-2, -0.72, 2, -0.6]],
      ["r", -0.31, -1.16, -0.21, -0.6, "B"], ["r", 0.21, -1.16, 0.31, -0.6, "B"],
      ["p", [[-0.17, -1.24], [-0.2, -1.62], [-0.44, -1.86], [-0.14, -1.98], [0.12, -1.66], [0.17, -1.24]], "D"],
      ["p", [[0.12, -1.36], [0.4, -1.66], [0.86, -1.64], [1.0, -1.38], [0.6, -1.24]], "C"],
    ],
  },
  {
    id: "sp_ghost", name: "GHOST", colors: { A: "#f8f8ff", B: "#aab0d4", C: "#2a2134" },
    front: [
      ["e", -0.85, -0.24, 0.29, 0.3, "B"], ["e", -0.28, -0.24, 0.29, 0.3, "B"], ["e", 0.28, -0.24, 0.29, 0.3, "B"], ["e", 0.85, -0.24, 0.29, 0.3, "B"],
      ["e", 0, -0.42, 1.14, 0.84, "A", [-2, -3, 2, -0.3]],
      ["e", -0.85, -0.3, 0.29, 0.24, "A"], ["e", -0.28, -0.3, 0.29, 0.24, "A"], ["e", 0.28, -0.3, 0.29, 0.24, "A"], ["e", 0.85, -0.3, 0.29, 0.24, "A"],
      ["e", -0.36, -0.62, 0.17, 0.22, "C"], ["e", 0.36, -0.62, 0.17, 0.22, "C"],
    ],
  },
  {
    id: "sp_vampire", name: "VAMPIRE", colors: { A: "#2a2134", B: "#c8283c", C: "#514868", D: "#ffd23f" },
    back: [
      ["p", [[-0.3, 1.0], [-1.1, 0.8], [-1.72, -1.0], [-1.0, -0.55], [-0.5, 0.0]], "A"], ["p", [[0.3, 1.0], [1.1, 0.8], [1.72, -1.0], [1.0, -0.55], [0.5, 0.0]], "A"],
      ["p", [[-0.5, 0.8], [-1.02, 0.62], [-1.5, -0.66], [-1.0, -0.36], [-0.6, 0.1]], "B"], ["p", [[0.5, 0.8], [1.02, 0.62], [1.5, -0.66], [1.0, -0.36], [0.6, 0.1]], "B"],
    ],
    front: [
      ["e", 0, 0, 1.04, 1.04, "A", [-2, -3, 2, -0.62]],
      ["p", [[-0.44, -0.64], [0, -0.2], [0.44, -0.64]], "A"],
      ["p", [[-0.56, -0.8], [-0.2, -0.96], [-0.08, -0.88], [-0.48, -0.7]], "C"],
      ["e", 0, 0.84, 0.16, 0.14, "D"],
    ],
  },
  {
    id: "sp_mummy", name: "MUMMY", colors: { A: "#e9dcb4", B: "#a8946a" },
    back: [
      ["p", [[0.7, -0.02], [1.4, 0.16], [1.64, 0.78], [1.32, 0.68], [1.2, 0.46], [0.7, 0.4]], "A"],
      ["p", [[1.32, 0.68], [1.64, 0.78], [1.56, 0.56], [1.26, 0.5]], "B"],
      ["p", [[-0.5, -0.9], [-0.84, -1.46], [-0.46, -1.36], [-0.14, -1.0]], "A"],
    ],
    front: [
      ["p", [[-0.15, -1.04], [0.34, -0.99], [0.53, -0.91], [0.66, -0.81], [0.77, -0.71], [-0.94, -0.47], [-0.86, -0.6], [-0.76, -0.73], [-0.6, -0.86]], "A"],
      ["p", [[0.66, -0.82], [0.77, -0.71], [-0.94, -0.47], [-0.86, -0.61]], "B"],
      ["p", [[1.05, 0.01], [1.04, 0.12], [1.03, 0.22], [1.0, 0.33], [0.96, 0.42], [-1.05, -0.08], [-1.03, -0.18], [-1.01, -0.28], [-0.98, -0.38], [-0.93, -0.48]], "A"],
      ["p", [[1.0, 0.32], [0.96, 0.42], [-1.05, -0.08], [-1.03, -0.19]], "B"],
      ["p", [[1.0, 0.33], [0.96, 0.43], [0.91, 0.53], [0.84, 0.63], [0.74, 0.74], [-0.44, 0.95], [-0.57, 0.88], [-0.67, 0.81], [-0.75, 0.73], [-0.82, 0.65]], "A"],
      ["p", [[0.85, 0.61], [0.74, 0.74], [-0.44, 0.95], [-0.59, 0.87]], "B"],
    ],
  },
  {
    id: "sp_devil", name: "LITTLE DEVIL", colors: { A: "#d4203a", B: "#8e1230", C: "#ff8a78" },
    back: [
      ["p", [[0.6, 0.9], [1.2, 0.96], [1.62, 0.6], [1.62, -0.1], [1.38, -0.1], [1.38, 0.5], [1.12, 0.72], [0.6, 0.62]], "A"],
      ["p", [[1.2, -0.08], [1.5, -0.72], [1.72, -0.08]], "A"],
    ],
    front: [
      ["p", [[-0.9, -0.56], [-0.3, -0.92], [-0.42, -1.32], [-0.9, -1.72], [-0.98, -1.2]], "A"], ["p", [[0.9, -0.56], [0.3, -0.92], [0.42, -1.32], [0.9, -1.72], [0.98, -1.2]], "A"],
      ["p", [[-0.9, -0.56], [-0.3, -0.92], [-0.34, -1.06], [-0.94, -0.74]], "B"], ["p", [[0.9, -0.56], [0.3, -0.92], [0.34, -1.06], [0.94, -0.74]], "B"],
      ["p", [[-0.88, -0.86], [-0.9, -1.2], [-0.86, -1.52], [-0.74, -1.2], [-0.74, -0.94]], "C"], ["p", [[0.5, -1.06], [0.52, -1.3], [0.74, -1.5], [0.62, -1.24], [0.62, -1.02]], "C"],
    ],
  },
  {
    id: "sp_monster", name: "MONSTER", colors: { A: "#2a2134", B: "#514868", C: "#aab2c0", D: "#767f92" },
    back: [
      ["r", -1.4, 0.0, -0.8, 0.3, "C"], ["r", 0.8, 0.0, 1.4, 0.3, "C"],
      ["r", -1.64, -0.3, -1.36, 0.56, "D"], ["r", 1.36, -0.3, 1.64, 0.56, "D"],
    ],
    front: [
      ["r", -0.92, -1.3, 0.92, -0.7, "A"],
      ["p", [[-0.92, -0.72], [-0.7, -0.4], [-0.46, -0.72]], "A"], ["p", [[-0.46, -0.72], [-0.23, -0.44], [0, -0.72]], "A"],
      ["p", [[0, -0.72], [0.23, -0.44], [0.46, -0.72]], "A"], ["p", [[0.46, -0.72], [0.7, -0.4], [0.92, -0.72]], "A"],
      ["r", -0.74, -1.2, -0.36, -1.08, "B"],
      ["r", 0.14, 0.24, 0.8, 0.33, "A"], ["r", 0.24, 0.1, 0.33, 0.47, "A"], ["r", 0.43, 0.1, 0.52, 0.47, "A"], ["r", 0.62, 0.1, 0.71, 0.47, "A"],
    ],
  },
  {
    id: "sp_bat", name: "BAT", colors: { A: "#7448b8", B: "#46286e" },
    back: [
      ["p", [[-0.6, -0.6], [-1.15, -1.25], [-1.72, -1.0], [-1.72, -0.05], [-1.5, -0.32], [-1.34, 0.2], [-1.12, -0.12], [-0.9, 0.4], [-0.6, 0.3]], "A"],
      ["p", [[0.6, -0.6], [1.15, -1.25], [1.72, -1.0], [1.72, -0.05], [1.5, -0.32], [1.34, 0.2], [1.12, -0.12], [0.9, 0.4], [0.6, 0.3]], "A"],
      ["p", [[-0.7, -0.76], [-1.15, -1.25], [-1.72, -1.0], [-1.68, -0.88], [-1.15, -1.1], [-0.76, -0.64]], "B"],
      ["p", [[0.7, -0.76], [1.15, -1.25], [1.72, -1.0], [1.68, -0.88], [1.15, -1.1], [0.76, -0.64]], "B"],
      ["p", [[-1.2, -1.2], [-1.38, 0.2], [-1.28, 0.1], [-1.08, -1.14]], "B"], ["p", [[1.2, -1.2], [1.38, 0.2], [1.28, 0.1], [1.08, -1.14]], "B"],
    ],
    front: [
      ["p", [[-0.74, -0.7], [-0.6, -1.52], [-0.16, -0.98]], "A"], ["p", [[0.74, -0.7], [0.6, -1.52], [0.16, -0.98]], "A"],
      ["p", [[-0.6, -0.9], [-0.56, -1.28], [-0.34, -0.98]], "B"], ["p", [[0.6, -0.9], [0.56, -1.28], [0.34, -0.98]], "B"],
    ],
  },
  {
    id: "sp_witch", name: "WITCH", colors: { A: "#2a2134", B: "#9a4fe0", C: "#514868", D: "#ffd23f" },
    front: [
      ["e", 0, -0.72, 1.62, 0.24, "A"],
      ["p", [[-0.8, -0.74], [-0.34, -1.6], [-0.5, -1.92], [-0.98, -1.9], [-0.5, -2.24], [0, -2.14], [0.26, -1.6], [0.8, -0.74]], "A"],
      ["p", [[-0.56, -1.14], [-0.28, -1.56], [-0.12, -1.56], [-0.34, -1.14]], "C"],
      ["p", [[-0.8, -0.74], [-0.34, -1.6], [-0.5, -1.92], [-0.98, -1.9], [-0.5, -2.24], [0, -2.14], [0.26, -1.6], [0.8, -0.74]], "B", [-2, -1.1, 2, -0.86]],
      ["r", -0.2, -1.16, 0.2, -0.8, "D"], ["r", -0.1, -1.06, 0.1, -0.9, "A"],
    ],
  },
];
if (typeof module !== "undefined") module.exports = OUTFITS_SPOOKY;
`;var Le=`"use strict";
// Mini golf ball outfits, theme: SPACE AND ROBOTS (8). Same format as the outfits in balls.js. Mirrored pairs are
// written out in full, so this list needs no helper.
const OUTFITS_SPACE = [
  {
    // a round white helmet behind the ball, a dark seal round the face, orange ear caps and a collar
    id: "sc_astronaut", name: "ASTRONAUT", colors: { A: "#f4f4f0", B: "#2a2134", C: "#c4c6d2", D: "#ff8a2e" },
    back: [
      ["e", -1.36, -0.12, 0.24, 0.36, "D"], ["e", 1.36, -0.12, 0.24, 0.36, "D"],
      ["e", 0, -0.16, 1.38, 1.24, "A", [-2, -3, 2, 1.0]],
      ["e", 0.5, 0.2, 0.86, 0.84, "C", [0.9, 0.3, 2, 1.0]],
      ["e", 0, 0, 1.2, 1.2, "B", [-2, -3, 2, 0.8]],
    ],
    front: [
      ["r", -0.92, 0.66, 0.92, 1.0, "C"], ["r", -0.92, 0.76, 0.92, 0.9, "D"],
    ],
  },
  {
    // a green band with two eye stalks
    id: "sc_alien", name: "ALIEN", colors: { A: "#3fbf5f", B: "#f4f4f0", C: "#2a2134", D: "#2a8f48" },
    front: [
      ["p", [[-0.52, -0.84], [-0.2, -0.94], [-0.6, -1.7], [-0.92, -1.6]], "A"], ["p", [[0.52, -0.84], [0.2, -0.94], [0.6, -1.7], [0.92, -1.6]], "A"],
      ["e", 0, -0.86, 0.74, 0.2, "A"], ["e", 0, -0.8, 0.74, 0.2, "D", [-2, -0.78, 2, 0]],
      ["e", -0.8, -1.8, 0.4, 0.4, "B"], ["e", 0.8, -1.8, 0.4, 0.4, "B"],
      ["e", -0.72, -1.76, 0.19, 0.19, "C"], ["e", 0.72, -1.76, 0.19, 0.19, "C"],
    ],
  },
  {
    // a square steel head top with two lamp eyes, an aerial and a bolt on each side
    id: "sc_robot", name: "ROBOT", colors: { A: "#8c9bb4", B: "#56627e", C: "#ffe14a", D: "#e0403a", E: "#2a2134" },
    back: [
      ["r", -1.34, -0.3, -0.9, 0.3, "B"], ["r", 0.9, -0.3, 1.34, 0.3, "B"],
      ["r", -1.5, -0.17, -1.3, 0.17, "A"], ["r", 1.3, -0.17, 1.5, 0.17, "A"],
    ],
    front: [
      ["r", -0.92, -1.36, 0.92, -0.58, "A"], ["r", -0.92, -0.74, 0.92, -0.58, "B"],
      ["r", -0.62, -1.18, -0.2, -0.88, "C"], ["r", 0.2, -1.18, 0.62, -0.88, "C"],
      ["r", -0.12, -1.86, 0.12, -1.36, "E"], ["e", 0, -1.96, 0.23, 0.23, "D"],
    ],
  },
  {
    // a flying saucer disc round the lower ball, with lights: the ball is the dome
    id: "sc_saucer", name: "SAUCER", colors: { A: "#9aa6ba", B: "#5d6880", C: "#ffe14a", D: "#d6dde8" },
    back: [
      ["e", 0, 0.5, 1.7, 0.46, "A"], ["e", 0, 0.44, 1.5, 0.3, "D", [-2, -1, 2, 0.4]],
    ],
    front: [
      ["e", 0, 0.5, 1.7, 0.46, "A", [-2, 0.46, 2, 2]], ["e", 0, 0.56, 1.5, 0.4, "B", [-2, 0.78, 2, 2]],
      ["e", 0, 0.64, 0.17, 0.13, "C"], ["e", -0.62, 0.61, 0.17, 0.13, "C"], ["e", 0.62, 0.61, 0.17, 0.13, "C"],
      ["e", -1.2, 0.54, 0.16, 0.12, "C"], ["e", 1.2, 0.54, 0.16, 0.12, "C"],
    ],
  },
  {
    // a tilted two-band ring that passes behind the ball and across its front
    id: "sc_planet", name: "PLANET", colors: { A: "#f2d9a0", B: "#c9824a" },
    back: [
      ["p", [[1.6, -0.41], [1.57, -0.19], [1.4, 0.05], [1.09, 0.29], [0.67, 0.51], [0.18, 0.68], [-0.32, 0.79], [-0.79, 0.83], [-1.18, 0.79], [-1.46, 0.68], [-1.6, 0.51], [-1.57, 0.29], [-1.4, 0.05], [-1.09, -0.19], [-0.67, -0.41], [-0.18, -0.58], [0.32, -0.69], [0.79, -0.73], [1.18, -0.69], [1.46, -0.58]], "A"],
      ["p", [[1.28, -0.32], [1.26, -0.14], [1.12, 0.05], [0.87, 0.25], [0.53, 0.42], [0.15, 0.56], [-0.26, 0.65], [-0.63, 0.68], [-0.95, 0.64], [-1.17, 0.55], [-1.28, 0.42], [-1.26, 0.24], [-1.12, 0.05], [-0.87, -0.15], [-0.53, -0.32], [-0.15, -0.46], [0.26, -0.55], [0.63, -0.58], [0.95, -0.54], [1.17, -0.45]], "B"],
    ],
    front: [
      ["p", [[1.6, -0.41], [1.57, -0.19], [1.4, 0.05], [1.09, 0.29], [0.67, 0.51], [0.18, 0.68], [-0.32, 0.79], [-0.79, 0.83], [-1.18, 0.79], [-1.46, 0.68], [-1.6, 0.51], [-0.99, 0.33], [-0.91, 0.44], [-0.73, 0.51], [-0.49, 0.53], [-0.2, 0.51], [0.11, 0.44], [0.41, 0.34], [0.67, 0.2], [0.87, 0.05], [0.98, -0.1], [0.99, -0.23]], "A"],
      ["p", [[1.28, -0.32], [1.26, -0.14], [1.12, 0.05], [0.87, 0.25], [0.53, 0.42], [0.15, 0.56], [-0.26, 0.65], [-0.63, 0.68], [-0.95, 0.64], [-1.17, 0.55], [-1.28, 0.42], [-0.99, 0.33], [-0.91, 0.44], [-0.73, 0.51], [-0.49, 0.53], [-0.2, 0.51], [0.11, 0.44], [0.41, 0.34], [0.67, 0.2], [0.87, 0.05], [0.98, -0.1], [0.99, -0.23]], "B"],
    ],
  },
  {
    // a rounded red nose cone on top, swept fins behind and one fin in front
    id: "sc_rocket", name: "ROCKET", colors: { A: "#e0403a", B: "#f4f4f0", C: "#a82a30" },
    back: [
      ["p", [[-0.7, -0.2], [-1.6, 0.55], [-1.6, 1.0], [-0.5, 0.9]], "A"], ["p", [[0.7, -0.2], [1.6, 0.55], [1.6, 1.0], [0.5, 0.9]], "A"],
      ["p", [[-1.6, 0.55], [-1.6, 1.0], [-1.3, 0.98], [-1.3, 0.3]], "C"], ["p", [[1.6, 0.55], [1.6, 1.0], [1.3, 0.98], [1.3, 0.3]], "C"],
    ],
    front: [
      ["e", 0, -0.7, 0.78, 1.4, "A", [-2, -3, 2, -0.7]], ["e", 0, -0.7, 0.78, 1.4, "C", [0.32, -3, 2, -0.7]],
      ["r", -0.84, -0.88, 0.84, -0.66, "B"],
      ["p", [[-0.14, 0.42], [0.14, 0.42], [0.22, 1.0], [-0.22, 1.0]], "A"],
    ],
  },
  {
    // two tanks with red caps and flames, one each side, held on by a strap with a buckle
    id: "sc_jetpack", name: "JETPACK", colors: { A: "#dfe5ee", B: "#7f8ca6", C: "#e0403a", D: "#ff8a2e", E: "#ffe14a" },
    back: [
      ["e", -1.26, -0.5, 0.3, 0.36, "C"], ["e", 1.26, -0.5, 0.3, 0.36, "C"],
      ["r", -1.56, -0.5, -0.96, 0.42, "A"], ["r", 0.96, -0.5, 1.56, 0.42, "A"],
      ["r", -1.56, -0.5, -1.4, 0.42, "B"], ["r", 1.4, -0.5, 1.56, 0.42, "B"],
      ["r", -1.46, 0.42, -1.06, 0.56, "B"], ["r", 1.06, 0.42, 1.46, 0.56, "B"],
      ["p", [[-1.52, 0.56], [-1.0, 0.56], [-1.26, 1.02]], "D"], ["p", [[1.52, 0.56], [1.0, 0.56], [1.26, 1.02]], "D"],
      ["p", [[-1.4, 0.56], [-1.12, 0.56], [-1.26, 0.84]], "E"], ["p", [[1.4, 0.56], [1.12, 0.56], [1.26, 0.84]], "E"],
    ],
    front: [
      ["r", -1.0, 0.08, 1.0, 0.3, "B"], ["r", -0.18, 0.02, 0.18, 0.36, "E"],
    ],
  },
  {
    // a blue solar panel on each side and a dish on top
    id: "sc_satellite", name: "SATELLITE", colors: { A: "#3c6fd8", B: "#9cc8ff", C: "#c9d0dc", D: "#2a2134", E: "#7f8ca6" },
    back: [
      ["r", -1.2, -0.1, -0.9, 0.1, "E"], ["r", 0.9, -0.1, 1.2, 0.1, "E"],
      ["r", -1.74, -0.44, -1.14, 0.44, "A"], ["r", 1.14, -0.44, 1.74, 0.44, "A"],
      ["r", -1.74, -0.06, -1.14, 0.06, "B"], ["r", 1.14, -0.06, 1.74, 0.06, "B"],
      ["r", -1.5, -0.44, -1.38, 0.44, "B"], ["r", 1.38, -0.44, 1.5, 0.44, "B"],
    ],
    front: [
      ["r", -0.02, -1.74, 0.22, -1.3, "D"], ["e", 0.1, -1.8, 0.18, 0.18, "B"],
      ["e", 0.1, -1.32, 0.66, 0.52, "C", [-2, -1.32, 2, 0]], ["e", 0.1, -1.2, 0.66, 0.42, "E", [-2, -0.96, 2, 0]],
    ],
  },
  // round 6: takes the place ASTRONAUT left (Lakota: USE)
  {
    // a one-piece space visor across the face: silver frame, bright blue glass with a glint, a grey side piece each side
    id: "sc_visor", name: "VISOR", colors: { A: "#c9d0dc", B: "#6ef0ff", C: "#2a9fe0", D: "#ffffff", E: "#56627e" },
    back: [
      ["r", -1.34, -0.46, -0.9, 0.0, "E"], ["r", 0.9, -0.46, 1.34, 0.0, "E"],
    ],
    front: [
      ["p", [[-1.04, -0.52], [1.04, -0.52], [1.04, -0.1], [0.7, 0.1], [0.16, 0.1], [0, -0.04], [-0.16, 0.1], [-0.7, 0.1], [-1.04, -0.1]], "A"],
      ["p", [[-0.9, -0.4], [0.9, -0.4], [0.9, -0.16], [0.64, -0.02], [0.2, -0.02], [0, -0.16], [-0.2, -0.02], [-0.64, -0.02], [-0.9, -0.16]], "B"],
      ["p", [[-0.9, -0.4], [0.9, -0.4], [0.9, -0.16], [0.64, -0.02], [0.2, -0.02], [0, -0.16], [-0.2, -0.02], [-0.64, -0.02], [-0.9, -0.16]], "C", [-2, -0.18, 2, 1]],
      ["r", -0.7, -0.34, -0.36, -0.24, "D"], ["r", -0.28, -0.34, -0.16, -0.24, "D"],
    ],
  },
];
if (typeof module !== "undefined") module.exports = OUTFITS_SPACE;
`;var Ne=`"use strict";
// Mini golf ball outfits, theme: SPORTS AND 80s ARCADE. Same format as look/b/balls.js (shapes in ball radii).
const OUTFITS_SPORTS = [
  {
    id: "st_sweatband", name: "SWEATBAND", colors: { A: "#6b3a1c", B: "#e0403a", C: "#f4f4f0", D: "#3c8cff", E: "#9a5a2c" },
    back: [
      ["e", -0.98, 0.3, 0.5, 0.72, "A"], ["e", 0.98, 0.3, 0.5, 0.72, "A"],
      ["p", [[-1.3, 0.5], [-1.62, 1.0], [-0.9, 0.98]], "A"], ["p", [[1.3, 0.5], [1.62, 1.0], [0.9, 0.98]], "A"],
    ],
    front: [
      ["e", -0.42, -1.02, 0.46, 0.36, "A", [-2, -3, 2, -0.78]], ["e", 0.42, -1.02, 0.46, 0.36, "A", [-2, -3, 2, -0.78]],
      ["e", 0, -1.14, 0.5, 0.36, "A", [-2, -3, 2, -0.78]], ["e", -0.24, -1.2, 0.22, 0.1, "E"],
      ["e", 0, 0, 1.08, 1.08, "B", [-2, -0.8, 2, -0.62]], ["e", 0, 0, 1.08, 1.08, "C", [-2, -0.62, 2, -0.44]],
      ["e", 0, 0, 1.08, 1.08, "D", [-2, -0.44, 2, -0.24]],
    ],
  },
  {
    id: "st_visor", name: "VISOR", colors: { A: "#f4f4f0", B: "#ff4f9a", C: "#ff9cc6", D: "#2a2134" },
    front: [
      ["e", 0, 0, 1.08, 1.08, "A", [-2, -0.76, 2, -0.42]],
      ["e", 0, 0, 1.08, 1.08, "D", [-2, -0.5, 2, -0.42]],
      ["e", 0, -0.42, 1.3, 0.38, "B", [-2, -0.42, 2, 1]],
      ["e", -0.45, -0.28, 0.4, 0.09, "C"],
    ],
  },
  {
    id: "st_backcap", name: "BACK CAP", colors: { A: "#16a8a0", B: "#ffd23f", C: "#2a2134", D: "#5fd6cc" },
    back: [
      ["p", [[0.6, -0.9], [1.5, -0.72], [1.64, -0.46], [0.8, -0.44]], "B"],
    ],
    front: [
      ["e", 0, -0.62, 0.94, 0.78, "A", [-2, -3, 2, -0.6]],
      ["e", -0.5, -1.0, 0.16, 0.2, "D"],
      ["e", 0, -0.6, 0.4, 0.36, "C", [-2, -3, 2, -0.6]],
      ["r", -0.46, -0.74, 0.46, -0.58, "B"],
      ["e", 0, -1.4, 0.17, 0.1, "B"],
    ],
  },
  {
    id: "st_helmet", name: "HELMET", colors: { A: "#2f5fd0", B: "#ffd23f", C: "#767f92", D: "#6e94f2" },
    front: [
      ["e", 0, -0.15, 1.14, 1.14, "A", [-2, -3, 2, -0.45]],
      ["e", 0, -0.15, 1.14, 1.14, "A", [-2, -0.45, -0.86, 0.36]], ["e", 0, -0.15, 1.14, 1.14, "A", [0.86, -0.45, 2, 0.36]],
      ["e", 0, -0.15, 1.14, 1.14, "B", [-0.17, -3, 0.17, -0.45]],
      ["e", -0.6, -0.86, 0.15, 0.22, "D"],
      ["e", 0, 0, 1.12, 1.12, "C", [-0.9, 0.12, 0.9, 0.36]],
    ],
  },
  // round 6: drawn again without the goggles (Lakota: GOOD)
  {
    id: "st_skihat", name: "SKI HAT", colors: { A: "#7b3fe4", B: "#f4f4f0", C: "#ffd23f" },
    front: [
      ["e", 0, -0.78, 0.9, 0.86, "A", [-2, -3, 2, -0.78]],
      ["p", [[-0.72, -1.2], [-0.48, -1.42], [-0.24, -1.2], [0, -1.42], [0.24, -1.2], [0.48, -1.42], [0.72, -1.2], [0.72, -1.02], [0.48, -1.24], [0.24, -1.02], [0, -1.24], [-0.24, -1.02], [-0.48, -1.24], [-0.72, -1.02]], "C"],
      ["r", -0.98, -1.0, 0.98, -0.62, "B"], ["e", 0, -1.8, 0.3, 0.3, "B"],
    ],
  },
  {
    id: "st_headphones", name: "HEADPHONES", colors: { A: "#2a2134", B: "#ffd23f", C: "#ff8a2e" },
    front: [
      ["p", [[-1.36, 0], [-1.31, -0.35], [-1.18, -0.68], [-0.96, -0.96], [-0.68, -1.18], [-0.35, -1.31], [0, -1.36], [0.35, -1.31], [0.68, -1.18], [0.96, -0.96], [1.18, -0.68], [1.31, -0.35], [1.36, 0],
        [1.0, 0], [0.97, -0.26], [0.87, -0.5], [0.71, -0.71], [0.5, -0.87], [0.26, -0.97], [0, -1.0], [-0.26, -0.97], [-0.5, -0.87], [-0.71, -0.71], [-0.87, -0.5], [-0.97, -0.26], [-1.0, 0]], "A"],
      ["e", -1.0, 0.04, 0.2, 0.44, "C"], ["e", 1.0, 0.04, 0.2, 0.44, "C"],
      ["e", -1.24, 0.04, 0.36, 0.54, "A"], ["e", 1.24, 0.04, 0.36, 0.54, "A"],
      ["e", -1.3, 0.04, 0.17, 0.26, "B"], ["e", 1.3, 0.04, 0.17, 0.26, "B"],
    ],
  },
  {
    id: "st_mohawk", name: "MOHAWK", colors: { A: "#ff2f92", B: "#ffa3d0", C: "#a81e6a" },
    front: [
      ["p", [[-0.7, -0.72], [-0.92, -1.5], [-0.62, -1.22], [-0.47, -1.86], [-0.24, -1.38], [0, -2.08], [0.24, -1.38], [0.47, -1.86], [0.62, -1.22], [0.92, -1.5], [0.7, -0.72]], "A"],
      ["p", [[-0.7, -0.72], [-0.92, -1.5], [-0.62, -1.22], [-0.47, -1.86], [-0.24, -1.38], [0, -2.08], [0.24, -1.38], [0.47, -1.86], [0.62, -1.22], [0.92, -1.5], [0.7, -0.72]], "B", [-2, -3, 2, -1.62]],
      ["p", [[-0.7, -0.72], [-0.92, -1.5], [-0.62, -1.22], [-0.47, -1.86], [-0.24, -1.38], [0, -2.08], [0.24, -1.38], [0.47, -1.86], [0.62, -1.22], [0.92, -1.5], [0.7, -0.72]], "C", [-2, -1.0, 2, 0]],
    ],
  },
  {
    id: "st_3dglasses", name: "3D GLASSES", colors: { A: "#f4f4f0", B: "#e0403a", C: "#2fc8e8" },
    front: [
      ["r", -1.1, -0.46, 1.1, -0.28, "A"],
      ["r", -0.96, -0.52, -0.08, 0.06, "A"], ["r", 0.08, -0.52, 0.96, 0.06, "A"],
      ["r", -0.84, -0.4, -0.2, -0.06, "B"], ["r", 0.2, -0.4, 0.84, -0.06, "C"],
    ],
  },
  // round 6: takes one of the two places VISOR and MOHAWK left (Lakota: USE)
  {
    id: "st_boombox", name: "BOOM BOX", colors: { A: "#c4c6d2", B: "#2a2134", C: "#ff4f9a", D: "#45e0e0", E: "#767f92" },
    front: [
      ["r", -0.72, -2.08, 0.72, -1.92, "E"], ["r", -0.72, -2.08, -0.56, -1.76, "E"], ["r", 0.56, -2.08, 0.72, -1.76, "E"],
      ["r", -1.22, -1.8, 1.22, -0.76, "A"], ["r", -1.22, -0.9, 1.22, -0.76, "E"],
      ["e", -0.76, -1.28, 0.36, 0.36, "B"], ["e", 0.76, -1.28, 0.36, 0.36, "B"],
      ["e", -0.76, -1.28, 0.17, 0.17, "C"], ["e", 0.76, -1.28, 0.17, 0.17, "C"],
      ["r", -0.28, -1.44, 0.28, -1.06, "B"], ["r", -0.2, -1.36, 0.2, -1.2, "D"],
      ["r", -0.28, -1.7, -0.1, -1.56, "C"], ["r", 0.1, -1.7, 0.28, -1.56, "D"],
    ],
  },
  // Round 7 (Lakota: USE IT): the three that came out of outfits/candidates.js. EXTRA LIFE was left out.
  { // a golfer's flat cap in green tartan, a short peak to one side, a red bobble on top
    id: "st_golfcap", name: "GOLF CAP", colors: { A: "#2f9e5a", B: "#f4f4f0", C: "#e0403a", D: "#1d6f3d" },
    front: [
      ["p", [[0.5, -0.86], [1.5, -0.8], [1.6, -0.56], [0.6, -0.6]], "D"],
      ["e", 0, -0.7, 1.14, 0.64, "A", [-2, -3, 2, -0.66]],
      ["e", 0, -0.7, 1.14, 0.64, "B", [-0.62, -3, -0.42, -0.66]], ["e", 0, -0.7, 1.14, 0.64, "B", [0.42, -3, 0.62, -0.66]],
      ["e", 0, -0.7, 1.14, 0.64, "B", [-2, -1.08, 2, -0.94]],
      ["r", -1.12, -0.78, 1.12, -0.62, "D"],
      ["e", 0, -1.46, 0.27, 0.25, "C"],
    ],
  },
  { // a soft bucket hat: a low crown with a band and a wide brim that slopes down
    id: "st_buckethat", name: "BUCKET HAT", colors: { A: "#e06a2c", B: "#fff1c9", C: "#a84a1c" },
    front: [
      ["e", 0, -1.48, 0.62, 0.16, "A"],
      ["p", [[-0.62, -1.5], [0.62, -1.5], [0.8, -0.86], [-0.8, -0.86]], "A"],
      ["r", -0.76, -1.06, 0.76, -0.86, "B"],
      ["p", [[-0.82, -0.9], [0.82, -0.9], [1.52, -0.44], [-1.52, -0.44]], "A"],
      ["p", [[-1.34, -0.56], [1.34, -0.56], [1.52, -0.44], [-1.52, -0.44]], "C"],
    ],
  },
  { // a diving mask over the eyes and a snorkel standing up at one side
    id: "st_snorkel", name: "SNORKEL", colors: { A: "#2a2134", B: "#9fe8ff", C: "#ffd23f", D: "#ff8a2e", E: "#f4f4f0" },
    front: [
      ["r", -1.0, -0.38, 1.0, -0.2, "A"],
      ["p", [[-0.76, -0.6], [0.76, -0.6], [0.76, -0.06], [0.32, 0.12], [-0.32, 0.12], [-0.76, -0.06]], "C"],
      ["p", [[-0.6, -0.46], [0.6, -0.46], [0.6, -0.14], [0.26, -0.02], [-0.26, -0.02], [-0.6, -0.14]], "B"],
      ["r", -0.48, -0.4, -0.22, -0.28, "E"],
      ["r", 0.94, -1.7, 1.28, 0.3, "D"], ["r", 0.6, 0.1, 1.28, 0.34, "D"],
      ["r", 0.9, -1.9, 1.32, -1.62, "E"],
    ],
  },
];
if (typeof module !== "undefined") module.exports = OUTFITS_SPORTS;
`;var Ue=`// Mini golf ball outfits, theme: ANIMALS. Same format as OUTFITS in balls.js (every shape written out, no helpers needed).
"use strict";

const OUTFITS_ANIMALS = [
  {
    id: "an_fox", name: "FOX", colors: { A: "#f2802a", B: "#fff4e0", C: "#2a2134" },
    back: [
      ["p", [[-1, -0.35], [-0.94, -1.72], [-0.14, -0.9]], "A"],
      ["p", [[-0.86, -0.72], [-0.84, -1.3], [-0.46, -0.94]], "B"],
      ["p", [[-1, -0.35], [-0.94, -1.72], [-0.14, -0.9]], "C", [-2, -3, 2, -1.4]],
      ["p", [[1, -0.35], [0.94, -1.72], [0.14, -0.9]], "A"],
      ["p", [[0.86, -0.72], [0.84, -1.3], [0.46, -0.94]], "B"],
      ["p", [[1, -0.35], [0.94, -1.72], [0.14, -0.9]], "C", [-2, -3, 2, -1.4]],
      ["p", [[0.75, 0.8], [1.2, 0.98], [1.62, 0.7], [1.74, 0.1], [1.6, -0.55], [1.32, -0.1], [1.3, 0.4]], "A"],
      ["p", [[0.75, 0.8], [1.2, 0.98], [1.62, 0.7], [1.74, 0.1], [1.6, -0.55], [1.32, -0.1], [1.3, 0.4]], "B", [-2, -3, 2, -0.12]],
    ],
    front: [
      ["p", [[0, 0.56], [-0.45, 0.22], [-1.2, 0.14], [-1, 0.4], [-1.15, 0.66], [-0.84, 0.62], [-0.6, 0.78], [0, 0.95]], "B"],
      ["p", [[0, 0.56], [0.45, 0.22], [1.2, 0.14], [1, 0.4], [1.15, 0.66], [0.84, 0.62], [0.6, 0.78], [0, 0.95]], "B"],
      ["e", 0, 0.56, 0.17, 0.13, "C"],
      ["e", -0.4, -0.05, 0.15, 0.18, "C"],
      ["e", 0.4, -0.05, 0.15, 0.18, "C"],
    ],
  },
  {
    id: "an_cat", name: "CAT", colors: { A: "#2a2134", B: "#ff7a9c", C: "#f4f4f0" },
    back: [
      ["p", [[-0.96, -0.3], [-0.92, -1.66], [-0.12, -0.9]], "A"],
      ["p", [[-0.88, -0.72], [-0.86, -1.32], [-0.44, -0.94]], "B"],
      ["p", [[0.96, -0.3], [0.92, -1.66], [0.12, -0.9]], "A"],
      ["p", [[0.88, -0.72], [0.86, -1.32], [0.44, -0.94]], "B"],
    ],
    front: [
      ["p", [[0.5, 0.14], [1.62, -0.1], [1.62, 0.08], [0.5, 0.32]], "C"],
      ["p", [[0.5, 0.42], [1.62, 0.6], [1.62, 0.8], [0.5, 0.6]], "C"],
      ["p", [[-0.5, 0.14], [-1.62, -0.1], [-1.62, 0.08], [-0.5, 0.32]], "C"],
      ["p", [[-0.5, 0.42], [-1.62, 0.6], [-1.62, 0.8], [-0.5, 0.6]], "C"],
      ["e", 0, 0.3, 0.16, 0.12, "B"],
      ["e", -0.4, -0.05, 0.15, 0.18, "A"],
      ["e", 0.4, -0.05, 0.15, 0.18, "A"],
    ],
  },
  {
    id: "an_bunny", name: "BUNNY", colors: { A: "#f4f4f0", B: "#ff7a9c", C: "#2a2134" },
    back: [
      ["e", -0.45, -1.5, 0.3, 0.85, "A"],
      ["e", -0.45, -1.45, 0.13, 0.6, "B"],
      ["e", 0.45, -1.5, 0.3, 0.85, "A"],
      ["e", 0.45, -1.45, 0.13, 0.6, "B"],
    ],
    front: [
      ["e", 0, 0.24, 0.15, 0.11, "B"],
      ["r", -0.34, 0.42, -0.02, 0.74, "A"],
      ["r", 0.02, 0.42, 0.34, 0.74, "A"],
      ["e", -0.4, -0.05, 0.15, 0.18, "C"],
      ["e", 0.4, -0.05, 0.15, 0.18, "C"],
    ],
  },
  {
    id: "an_bear", name: "BEAR", colors: { A: "#8a5630", B: "#e8c08c", C: "#2a2134" },
    back: [
      ["e", -0.86, -0.86, 0.42, 0.42, "A"],
      ["e", -0.86, -0.86, 0.2, 0.2, "B"],
      ["e", 0.86, -0.86, 0.42, 0.42, "A"],
      ["e", 0.86, -0.86, 0.2, 0.2, "B"],
    ],
    front: [
      ["e", 0, 0.48, 0.5, 0.36, "B"],
      ["e", 0, 0.3, 0.2, 0.14, "C"],
      ["r", -0.04, 0.42, 0.04, 0.66, "C"],
      ["e", -0.4, -0.05, 0.15, 0.18, "C"],
      ["e", 0.4, -0.05, 0.15, 0.18, "C"],
    ],
  },
  {
    id: "an_shark", name: "SHARK", colors: { A: "#5d7f9c", B: "#3f5a74", C: "#f4f4f0", D: "#2a2134" },
    back: [
      ["p", [[-0.5, -0.8], [0, -1.6], [0.42, -2.05], [0.38, -1.4], [0.62, -0.75]], "A"],
      ["p", [[0.2, -1.82], [0.42, -2.05], [0.38, -1.4], [0.62, -0.75], [0.32, -0.85]], "B"],
      ["p", [[-0.8, 0.2], [-1.62, 0.78], [-0.72, 0.72]], "A"],
      ["p", [[0.8, 0.2], [1.62, 0.78], [0.72, 0.72]], "A"],
    ],
    front: [
      ["p", [[-0.8, 0.2], [0.8, 0.2], [0.62, 0.62], [0, 0.8], [-0.62, 0.62]], "D"],
      ["p", [[-0.72, 0.2], [-0.44, 0.2], [-0.58, 0.5]], "C"],
      ["p", [[-0.43, 0.2], [-0.15, 0.2], [-0.29, 0.5]], "C"],
      ["p", [[-0.14, 0.2], [0.14, 0.2], [0, 0.5]], "C"],
      ["p", [[0.15, 0.2], [0.43, 0.2], [0.29, 0.5]], "C"],
      ["p", [[0.44, 0.2], [0.72, 0.2], [0.58, 0.5]], "C"],
      ["e", -0.4, -0.05, 0.15, 0.18, "D"],
      ["e", 0.4, -0.05, 0.15, 0.18, "D"],
    ],
  },
  {
    id: "an_unicorn", name: "UNICORN", colors: { A: "#ffd23f", B: "#d9a520", C: "#ff7ab8", D: "#a86bff", E: "#2a2134" },
    back: [
      ["e", -0.72, -0.95, 0.42, 0.36, "C"],
      ["e", -1.08, -0.42, 0.4, 0.42, "D"],
      ["e", -1.18, 0.22, 0.36, 0.42, "C"],
    ],
    front: [
      ["e", -0.42, -0.84, 0.32, 0.2, "C"],
      ["p", [[-0.24, -0.8], [0.04, -2.25], [0.26, -0.8]], "A"],
      ["p", [[-0.24, -0.8], [0.04, -2.25], [0.26, -0.8]], "B", [-2, -1.28, 2, -1.1]],
      ["p", [[-0.24, -0.8], [0.04, -2.25], [0.26, -0.8]], "B", [-2, -1.7, 2, -1.54]],
      ["p", [[-0.24, -0.8], [0.04, -2.25], [0.26, -0.8]], "B", [-2, -2.06, 2, -1.94]],
      ["e", -0.4, -0.05, 0.15, 0.18, "E"],
      ["e", 0.4, -0.05, 0.15, 0.18, "E"],
    ],
  },
  {
    id: "an_frog", name: "FROG", colors: { A: "#4cc24a", B: "#f4f4f0", C: "#2a2134" },
    front: [
      ["e", -0.5, -1, 0.48, 0.48, "A"],
      ["e", -0.5, -1, 0.37, 0.37, "B"],
      ["e", -0.46, -0.98, 0.16, 0.17, "C"],
      ["e", 0.5, -1, 0.48, 0.48, "A"],
      ["e", 0.5, -1, 0.37, 0.37, "B"],
      ["e", 0.46, -0.98, 0.16, 0.17, "C"],
      ["p", [[-0.78, 0.14], [-0.62, 0.14], [-0.5, 0.32], [0.5, 0.32], [0.62, 0.14], [0.78, 0.14], [0.62, 0.52], [-0.62, 0.52]], "C"],
    ],
  },
  {
    id: "an_bee", name: "BEE", colors: { A: "#2a2134", B: "#d8f4ff", C: "#9fd8f0" },
    back: [
      ["e", -1.2, -0.5, 0.5, 0.34, "B"],
      ["e", -1.14, 0.08, 0.38, 0.26, "C"],
      ["p", [[-0.36, -0.84], [-0.2, -0.9], [-0.5, -1.6], [-0.66, -1.54]], "A"],
      ["e", -0.6, -1.66, 0.18, 0.18, "A"],
      ["e", 1.2, -0.5, 0.5, 0.34, "B"],
      ["e", 1.14, 0.08, 0.38, 0.26, "C"],
      ["p", [[0.36, -0.84], [0.2, -0.9], [0.5, -1.6], [0.66, -1.54]], "A"],
      ["e", 0.6, -1.66, 0.18, 0.18, "A"],
    ],
    front: [
      ["e", 0, 0, 1.07, 1.07, "A", [-2, 0.2, 2, 0.44]],
      ["e", 0, 0, 1.07, 1.07, "A", [-2, 0.66, 2, 0.88]],
      ["e", -0.4, -0.05, 0.15, 0.18, "A"],
      ["e", 0.4, -0.05, 0.15, 0.18, "A"],
    ],
  },
];
if (typeof module !== "undefined") module.exports = OUTFITS_ANIMALS;
`;var Me=`// The one place the outfit files join the list in balls.js. (Round 6: the player never sees a theme; the files
// only keep the artists' work apart and the list in a steady order.)
// Each theme is its own file in this folder (fantasy.js, spooky.js, space.js, sports.js, animals.js), loaded just
// before this one. Each makes one list (OUTFITS_FANTASY ...), written by that theme's artist and copied here as it
// came. Whichever lists are there are added, in the order of OUTFIT_THEMES. The list has no fixed length.
// To add a theme: put its file here, load it in stage.html above this file, and add its line below.
"use strict";
// Drawn but not in the game: Lakota did not approve these four as drawn (round 5). Their places went to MUSHROOM,
// the space VISOR and BOOM BOX (round 6). Take an id out of this list to let it in. (The strip has no fixed
// length: round 7 added GOLF CAP, BUCKET HAT and SNORKEL on top, so 52 are in.)
const OUTFITS_NOT_YET = ["fa_dragon", "sc_astronaut", "st_visor", "st_mohawk"];
(function () {
  const have = {
    fantasy: typeof OUTFITS_FANTASY !== "undefined" ? OUTFITS_FANTASY : null,
    spooky: typeof OUTFITS_SPOOKY !== "undefined" ? OUTFITS_SPOOKY : null,
    space: typeof OUTFITS_SPACE !== "undefined" ? OUTFITS_SPACE : null,
    sports: typeof OUTFITS_SPORTS !== "undefined" ? OUTFITS_SPORTS : null,
    animals: typeof OUTFITS_ANIMALS !== "undefined" ? OUTFITS_ANIMALS : null,
  };
  for (const [theme] of OUTFIT_THEMES) if (have[theme]) addOutfits(theme, have[theme].filter((o) => !OUTFITS_NOT_YET.includes(o.id)));
})();
`;var We=`// DRAW YOUR OWN outfit (round 5, Lakota: "a draw your own outfit option inspired by sky scramble").
// This file is the drawing itself, with no page: the squares, the tools, undo, and what is sent to the TV.
// A plain script, so the stage, the tests and PLAY's phone page can all use the same rules.
//
// What it keeps from Sky Scramble's drawing pad (foxbox dev/party/draw.js, read only):
//   the same fourteen colours in the same order, PEN / FILL / ERASER, three sizes, UNDO (40 steps),
//   CLEAR with a "CLEAR IT ALL?" question, only the first finger draws, and DONE.
// What is different, because this is an outfit on a golf ball and not a whole character:
//   the paper is a grid of squares the shape of the ball's own box (balls.js), not a free 768 x 768 canvas,
//   so the drawing is chunky pixels like every other outfit and is sent as letters, not as a picture.
"use strict";

const DRAW = {
  R: 8, // the size of the paper: the ball's box at 8 squares from the middle to the edge = 31 x 32 squares
  // Sky Scramble's colours, two rows of seven. Each has a letter: the drawing is rows of these letters.
  colors: [
    ["A", "#1d1b2e", "BLACK"], ["B", "#ffffff", "WHITE"], ["C", "#f33f5e", "RED"], ["D", "#ff8a3d", "ORANGE"], ["E", "#fabe24", "YELLOW"], ["F", "#4b8216", "GREEN"], ["G", "#2dd3be", "CYAN"],
    ["H", "#074eea", "BLUE"], ["I", "#8a5cf5", "PURPLE"], ["J", "#fba4a4", "PINK"], ["K", "#9e4823", "BROWN"], ["L", "#ffdbc0", "LIGHT SKIN"], ["M", "#d9a074", "SKIN"], ["N", "#8d5a3c", "DARK SKIN"],
  ],
  sizes: [1, 2, 3], // S, M, L: how many squares wide the pen and the eraser are
  undoSteps: 40,
  name: "MY DRAWING",
};

/** a blank paper */
function padNew(R) {
  R = R || DRAW.R;
  const cx = Math.ceil(1.75 * R) + 1, cy = Math.ceil(2.4 * R) + 1, w = cx * 2 + 1, h = cy + R + 3;
  return { R, w, h, cx, cy, cells: Array.from({ length: h }, () => Array(w).fill(".")), undo: [] };
}
const padRows = (p) => p.cells.map((r) => r.join(""));
const padBlank = (p) => p.cells.every((r) => r.every((c) => c === "."));
/** remember the paper as it is now, so UNDO can come back to it. Call once before each stroke, fill or clear. */
function padSnap(p) { p.undo.push(padRows(p)); if (p.undo.length > DRAW.undoSteps) p.undo.shift(); }
function padUndo(p) { const rows = p.undo.pop(); if (!rows) return false; p.cells = rows.map((r) => r.split("")); return true; }
function padClear(p) { padSnap(p); p.cells.forEach((r) => r.fill(".")); }
/** one dab of the pen: a square \`size\` squares wide round (x, y). ch = a colour letter, or "." to rub out. */
function padStamp(p, x, y, size, ch) {
  const a = Math.floor((size - 1) / 2);
  for (let j = y - a; j < y - a + size; j++) for (let i = x - a; i < x - a + size; i++) if (j >= 0 && j < p.h && i >= 0 && i < p.w) p.cells[j][i] = ch;
}
/** every square on the straight way from one square to another */
function padWay(x0, y0, x1, y1) {
  const out = [], dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx - dy, x = x0, y = y0;
  for (;;) { out.push([x, y]); if (x === x1 && y === y1) return out; const e2 = e * 2; if (e2 > -dy) { e -= dy; x += sx; } if (e2 < dx) { e += dx; y += sy; } }
}
function padLine(p, x0, y0, x1, y1, size, ch) { for (const [x, y] of padWay(x0, y0, x1, y1)) padStamp(p, x, y, size, ch); }
/** the bucket: every square joined to (x, y) that has the same colour as it turns into ch */
function padFill(p, x, y, ch) {
  if (x < 0 || y < 0 || x >= p.w || y >= p.h) return;
  const from = p.cells[y][x];
  if (from === ch) return;
  const todo = [[x, y]];
  while (todo.length) {
    const [i, j] = todo.pop();
    if (i < 0 || j < 0 || i >= p.w || j >= p.h || p.cells[j][i] !== from) continue;
    p.cells[j][i] = ch;
    todo.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]);
  }
}
/** What the phone sends after every stroke, and what the TV keeps: { R, rows }. 32 short rows of letters. */
const padArt = (p) => ({ R: p.R, rows: padRows(p) });
/** a paper from what was sent (anything that is not a known letter is read as empty) */
function padFrom(art) {
  const p = padNew(art && art.R), ok = new Set(DRAW.colors.map((c) => c[0]));
  ((art && art.rows) || []).slice(0, p.h).forEach((row, j) => { for (let i = 0; i < Math.min(p.w, row.length); i++) if (ok.has(row[i])) p.cells[j][i] = row[i]; });
  return p;
}
/** The drawing as an outfit, ready for ballGrid() in balls.js. A blank paper is no outfit at all. */
function drawnOutfit(art) {
  if (!art || !art.rows || art.rows.every((r) => !/[A-N]/.test(r))) return "none";
  return { id: "drawn", name: DRAW.name, theme: "", colors: Object.fromEntries(DRAW.colors.map(([k, hex]) => [k, hex])), art: { R: art.R, rows: art.rows } };
}
`;var Pe='// Style B: the wooden course signs, every screen, with its movement (rounds 2 to 4).\n// The title screen, the setup screens and the dressed golf balls (round 4) are in setup.js, built from these pieces.\n// Each screen is { seq, frame(t), html, tracks, dur, still }. The stage plays `tracks` against one clock,\n// so a still is just the clip stopped at one moment. Sizes sit on the game\'s 4px grid.\n"use strict";\n(function () {\n  const OUT = "#3a2114", WOOD = "#b87440", WOOD_HI = "#d39a5e", WOOD_LO = "#8a5230", CREAM = "#fff1c9",\n    RED = "#b8323a", GOLD = "#ffd23f", GREEN = "#17694f", PAPER = "#f6ecd0", LINE = "#c9b78f", PEN = "#2a2134";\n  const step = (s) => `polygon(${s}px 0, calc(100% - ${s}px) 0, calc(100% - ${s}px) ${s}px, 100% ${s}px, 100% calc(100% - ${s}px), calc(100% - ${s}px) calc(100% - ${s}px), calc(100% - ${s}px) 100%, ${s}px 100%, ${s}px calc(100% - ${s}px), 0 calc(100% - ${s}px), 0 ${s}px, ${s}px ${s}px)`;\n  const grain = (c) => [\n    `linear-gradient(${c},${c}) 12% 30%/64px 4px no-repeat`, `linear-gradient(${c},${c}) 70% 22%/96px 4px no-repeat`,\n    `linear-gradient(${c},${c}) 38% 72%/120px 4px no-repeat`, `linear-gradient(${c},${c}) 86% 64%/48px 4px no-repeat`,\n    `linear-gradient(${c},${c}) 6% 84%/40px 4px no-repeat`, `linear-gradient(${c},${c}) 54% 44%/56px 4px no-repeat`,\n  ].join(",");\n\n  const css = `\n.sB { font-family: "FoxBox Soft"; font-weight: 700; color: ${CREAM}; line-height: 1; }\n.sB .px { font-family: "FoxBox Pixel"; font-weight: 400; }\n.sB .dg { font-family: "FoxBox Pixel"; font-weight: 400; font-size: 0.74em; }\n.sB .grp { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }\n.sB .pl { position: absolute; border: 8px solid ${OUT}; clip-path: ${step(8)}; background: ${grain("rgba(58,33,20,0.3)")}, var(--w, ${WOOD});\n  box-shadow: inset 0 8px 0 var(--hi, ${WOOD_HI}), inset 0 -8px 0 var(--lo, ${WOOD_LO});\n  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; white-space: nowrap; }\n.sB .pl.red { --w: ${RED}; --hi: #e04a40; --lo: #8a2430; }\n.sB .pl.gold { --w: ${GOLD}; --hi: #fff0a0; --lo: #d9a520; color: ${OUT}; }\n.sB .pl.col { --w: var(--pc); --hi: rgba(255,255,255,0.45); --lo: rgba(58,33,20,0.3); color: ${OUT}; }\n.sB .pl .nail { position: absolute; width: 8px; height: 8px; background: ${OUT}; }\n.sB .paint { text-shadow: 4px 4px 0 ${OUT}; }\n.sB .post { position: absolute; width: 48px; background: ${WOOD_LO}; border: 8px solid ${OUT}; border-bottom: 0; box-shadow: inset 8px 0 0 ${WOOD}; }\n.sB .rope { position: absolute; width: 16px; background: #e9d8a6; border-left: 4px solid ${OUT}; border-right: 4px solid ${OUT}; }\n.sB .ol { filter: drop-shadow(4px 0 0 ${OUT}) drop-shadow(-4px 0 0 ${OUT}) drop-shadow(0 4px 0 ${OUT}) drop-shadow(0 -4px 0 ${OUT}); }\n.sB .ol8 { filter: drop-shadow(8px 0 0 ${OUT}) drop-shadow(-8px 0 0 ${OUT}) drop-shadow(0 8px 0 ${OUT}) drop-shadow(0 -8px 0 ${OUT}); }\n.sB .bunt { position: absolute; left: 0; right: 0; top: 0; height: 110px; }\n.sB .bunt::before { content: ""; position: absolute; left: 0; right: 0; top: 16px; height: 8px; background: ${OUT}; }\n.sB .bunt .f { position: absolute; top: 20px; }\n.sB .hio.hot { color: ${CREAM} !important; }\n.sB .sign { display: block; }\n/* clipboard and paper card */\n.sB .board { position: absolute; padding: 52px 40px 40px; isolation: isolate; }\n.sB .board::before { content: ""; position: absolute; inset: 0; z-index: -1; border: 8px solid ${OUT}; clip-path: ${step(8)}; background: ${grain("rgba(58,33,20,0.3)")}, ${WOOD};\n  box-shadow: inset 0 8px 0 ${WOOD_HI}, inset 0 -8px 0 ${WOOD_LO}; } /* the wood is a layer of its own, so a row can fall off the card without being cut at the edge */\n.sB .clip { position: absolute; height: 72px; width: 280px; background: #bcc5d3; border: 8px solid ${OUT}; box-shadow: inset 0 8px 0 #e8edf4, inset 0 -8px 0 #8d97a8; }\n.sB .paper { background: ${PAPER}; border: 4px solid ${OUT}; height: 100%; color: ${PEN}; padding: 22px 28px; box-shadow: 8px 8px 0 rgba(58,33,20,0.45); }\n.sB .ptop { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }\n.sB .ptop { white-space: nowrap; }\n.sB .ptop .a { font-size: var(--ta, 30px); color: ${GREEN}; } .sB .ptop .b { font-size: var(--tb, 24px); color: ${RED}; }\n.sB .g.hd > span.th { font-size: var(--th, 24px); }\n.sB .g { position: relative; display: grid; grid-template-columns: var(--cols); align-items: center; height: 64px; border-bottom: 4px solid ${LINE}; background: ${PAPER}; }\n.sB .g > * { text-align: center; height: 100%; display: flex; align-items: center; justify-content: center; border-left: 4px solid ${LINE}; font-size: var(--nm, 44px); }\n.sB .g > *:first-child { border-left: 0; }\n.sB .g > span:not(.nm) { font-family: "FoxBox Pixel"; font-weight: 400; font-size: 34px; }\n.sB .g b { font-weight: 400; display: inline-block; }\n.sB .g .nm { justify-content: flex-start; padding-left: 14px; gap: 16px; white-space: nowrap; }\n.sB .g .chip { width: 28px; height: 28px; border: 4px solid ${OUT}; flex: none; }\n.sB .g.hd { height: 50px; background: #dfe8c0; border-top: 4px solid ${LINE}; }\n.sB .g.hd > * { font-family: "FoxBox Pixel"; font-weight: 400; font-size: 20px; color: ${GREEN}; }\n.sB .g.par > * { color: #8a7a5c; } .sB .g.par > span:not(.nm) { font-size: 28px; } .sB .g.par .nm { font-size: 36px; }\n.sB .g.lead { background: #ffe9a0; z-index: 2; }\n.sB .g .ace { background: ${GOLD}; border: 4px solid ${OUT}; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; font-style: normal; }\n.sB .g > span.tt { font-size: 38px; }\n.sB .g.lead .tt b { background: ${RED}; color: ${CREAM}; padding: 8px 12px 6px 14px; }\n.sB .g > span.rk { font-size: 22px; color: #8a7a5c; }\n.sB .g .wcup { margin-left: 6px; display: none; } .sB .g.lead .wcup { display: block; }\n.sB .g.loose { outline: 4px solid ${OUT}; }\n.sB .herow { position: absolute; z-index: 5; color: ${PEN}; outline: 4px solid ${OUT}; box-shadow: 8px 8px 0 rgba(58,33,20,0.45); }\n.sB .herow .g { border-bottom: 0; }\n.sB .lab { position: absolute; }\n.sB .zoom { position: absolute; border: 8px solid ${OUT}; image-rendering: pixelated; background-repeat: no-repeat; box-shadow: 12px 12px 0 rgba(26,28,44,0.5); }\n.sB .dim { position: absolute; inset: 0; background: rgba(26,28,44,0.86); }\n/* phone */\n#ph.sB { background: repeating-conic-gradient(#17694f 0 25%, #1b7558 0 50%) 0 0/120px 120px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }\n.sB .pp { position: relative; border: 4px solid ${OUT}; clip-path: ${step(4)}; background: ${grain("rgba(58,33,20,0.3)")}, var(--w, ${WOOD});\n  box-shadow: inset 0 4px 0 var(--hi, ${WOOD_HI}), inset 0 -4px 0 var(--lo, ${WOOD_LO}); }\n.sB .pp.gold { --w: ${GOLD}; --hi: #fff0a0; --lo: #d9a520; color: ${OUT}; }\n.sB .pp.col { --w: var(--pc); --hi: rgba(255,255,255,0.45); --lo: rgba(58,33,20,0.3); color: ${OUT}; }\n.sB .phead { display: flex; align-items: center; justify-content: space-between; padding: 14px 14px; }\n.sB .phead .t { font-size: 13px; } .sB .phead .n { font-size: 30px; margin-top: 8px; }\n.sB .phead .par { padding: 10px 10px; font-size: 13px; }\n.sB .info { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 2px 4px; min-height: 26px; justify-content: center; }\n.sB .info .s { font-size: 20px; text-shadow: 2px 2px 0 ${OUT}; } .sB .info .d { font-size: 25px; text-shadow: 2px 2px 0 ${OUT}; }\n.sB .mat { flex: 1; min-height: 300px; display: flex; padding: 16px; border: 4px solid ${OUT};\n  background: repeating-linear-gradient(90deg, #e04a40 0 32px, #f4f4f0 32px 64px); }\n.sB .mat > div { flex: 1; border: 4px solid ${OUT}; background: repeating-conic-gradient(#1e8562 0 25%, #27a074 0 50%) 0 0/96px 96px;\n  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; padding: 18px 10px; }\n.sB .mat .w { text-shadow: 4px 4px 0 ${OUT}; line-height: 1.04; }\n.sB .mat .ic { margin-bottom: 14px; display: flex; flex-direction: column; align-items: center; gap: 6px; }\n.sB .mat.go > div { background: ${GOLD}; color: ${OUT}; }\n.sB .mat.go .w { text-shadow: 4px 4px 0 #fff0a0; }\n/* the aiming screen: two big arrow pads are the main thing. The view button is small, OK is at the bottom. */\n.sB .vcol { flex: 1; display: flex; flex-direction: column; gap: 12px; min-height: 0; }\n.sB .birdb { align-self: center; display: flex; align-items: center; gap: 10px; padding: 9px 14px 8px; font-size: 11px; }\n.sB .birdb { background: var(--w, ${WOOD}); } /* no wood grain: the letters are small */\n.sB .birdb.on { --w: ${GOLD}; --hi: #fff0a0; --lo: #d9a520; color: ${OUT}; }\n.sB .aimt { text-align: center; font-size: 24px; text-shadow: 2px 2px 0 ${OUT}; margin-top: 2px; }\n.sB .pads { flex: 1; display: flex; gap: 12px; min-height: 0; }\n.sB .pad { flex: 1; display: flex; align-items: center; justify-content: center; }\n.sB .againb { align-self: center; display: flex; align-items: center; gap: 10px; padding: 14px 18px 13px; font-size: 13px; background: var(--w, ${WOOD}); }\n.sB .okb { height: 112px; display: flex; align-items: center; justify-content: center; font-size: 52px; }\n.sB .down { filter: brightness(0.8); }\n.sB .now { padding: 14px; text-align: center; font-size: 30px; white-space: nowrap; }\n.sB .ppr { background: ${PAPER}; border: 4px solid ${OUT}; color: ${PEN}; padding: 8px 10px; flex: 1; box-shadow: 4px 4px 0 rgba(58,33,20,0.5); }\n.sB .pr { display: grid; grid-template-columns: 26px 1fr auto 44px; align-items: center; height: 50px; border-bottom: 2px solid ${LINE}; padding: 0 4px; }\n.sB .pr.h { height: 26px; font-family: "FoxBox Pixel"; font-weight: 400; font-size: 9px; color: ${GREEN}; text-align: right; }\n.sB .pr .c { width: 16px; height: 16px; border: 2px solid ${OUT}; }\n.sB .pr .n { font-size: 26px; white-space: nowrap; }\n.sB .pr .hr, .sB .pr .t { font-family: "FoxBox Pixel"; font-weight: 400; font-size: 18px; text-align: right; }\n.sB .pr .hr { color: #8a7a5c; }\n.sB .pr b { font-weight: 400; display: inline-flex; align-items: center; gap: 8px; }\n.sB .pr b.in { color: ${GREEN}; }\n.sB .pr .tag { font-family: "FoxBox Pixel"; font-weight: 400; font-style: normal; font-size: 10px; line-height: 1; background: ${GREEN}; color: ${CREAM}; border: 2px solid ${OUT}; padding: 5px 4px 4px 5px; white-space: nowrap; }\n.sB .pr .tag .dg { font-size: 1em; }\n.sB .pr.you { background: #ffe9a0; outline: 3px solid ${OUT}; }\n`;\n\n  // ---- pieces ----\n  const nails = `<i class="nail" style="left:12px;top:12px"></i><i class="nail" style="right:12px;top:12px"></i><i class="nail" style="left:12px;bottom:12px"></i><i class="nail" style="right:12px;bottom:12px"></i>`;\n  const pl = (x, y, w, h, cls, inner, extra, id) => `<div class="pl ${cls || ""}"${id ? ` id="${id}"` : ""} style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${extra || ""}">${nails}${inner}</div>`;\n  const post = (x, y) => `<div class="post" style="left:${x}px;top:${y}px;height:${1400 - y}px"></div>`;\n  const rope = (x, y0, y1) => `<div class="rope" style="left:${x}px;top:${y0}px;height:${y1 - y0}px"></div>`;\n  const grp = (id, inner, ox, oy) => `<div class="grp" id="${id}"${ox != null ? ` style="transform-origin:${ox}px ${oy}px"` : ""}>${inner}</div>`;\n  const PENNANT = ["#########", "#########", "#########", ".#######.", ".#######.", "..#####..", "..#####..", "...###...", "...###...", "....#...."];\n  const BURST = ["....#....", ".#..#..#.", "..#...#..", ".........", "##.....##", ".........", "..#...#..", ".#..#..#.", "....#...."];\n  const BURST2 = [".....#.....", "...........", "..#.....#..", "...........", "...........", "#.........#", "...........", "...........", "..#.....#..", "...........", ".....#....."];\n  const bunting = () => {\n    let h = `<div class="bunt">`;\n    for (let i = 0; i < 16; i++) h += `<div class="f ol" style="left:${28 + i * 120}px">${pix(PENNANT, 8, { "#": PLAYERS[i % 8].c })}</div>`;\n    return h + `</div>`;\n  };\n  const star = (x, y, s, cls) => `<div class="abs ol8 ${cls || "star"}" style="left:${x}px;top:${y}px">${pix(SPR.star, s, { "#": GOLD })}</div>`;\n\n  // ---- lettering that fits its plank ----\n  const cv = document.createElement("canvas").getContext("2d");\n  function fit(text, maxW, max, unit) {\n    cv.font = `700 100px "FoxBox Soft"`;\n    const u = unit || 4;\n    return Math.max(u, Math.min(max, Math.floor(((maxW / cv.measureText(text).width) * 100) / u) * u));\n  }\n  // one line, or two if the words are long\n  function lines(text, maxW, maxH, max) {\n    const one = fit(text, maxW, Math.min(max, maxH));\n    const sp = text.split(" ");\n    if (sp.length > 1) {\n      let best = null;\n      for (let k = 1; k < sp.length; k++) {\n        const a = sp.slice(0, k).join(" "), b = sp.slice(k).join(" ");\n        const s = Math.min(fit(a, maxW, max), fit(b, maxW, max), Math.floor(maxH / 2 / 4) * 4);\n        if (!best || s > best.s) best = { s, t: [a, b] };\n      }\n      if (best.s > one * 1.1) return { size: best.s, list: best.t };\n    }\n    return { size: one, list: [text] };\n  }\n  function scoreSign(x, y, w, h, text, id) {\n    const st = lines(text, w - 80, h - 48, 190);\n    return pl(x, y, w, h, "", `<div class="paint" style="font-size:${st.size}px;line-height:0.94;text-shadow:8px 8px 0 ${OUT};margin-top:-${Math.round(st.size * 0.08)}px">${st.list.map((l) => dg(esc(l))).join("<br>")}</div>`, "", id);\n  }\n  function namePl(x, y, w, h, p, id) {\n    const s = fit(p.n, w - 72, Math.floor((h * 0.78) / 4) * 4);\n    return pl(x, y, w, h, "col", `<div style="font-size:${s}px;margin-top:-${Math.round(s * 0.1)}px">${esc(p.n)}</div>`, `--pc:${p.c}`, id);\n  }\n\n  // ---- the paper score card ----\n  // rows: [{ r (a table row), id, rank0, rank1, total0, total1 }], in the order they sit on the paper\n  // o.par: the par of each hole (the game passes its own; the sample is PAR). Four holes or more get narrower columns.\n  const cardCols = (n, big) => (big ? `56px 1fr ${"92px ".repeat(n)}132px` : `64px 1fr ${`${n > 3 ? 96 : 110}px `.repeat(n)}160px`);\n  function card(rows, o) {\n    const par = o.par || PAR, cols = o.cols || cardCols(par.length);\n    let h = `<div style="${o.vars || ""}"><div class="ptop"><span class="a px">${TV_WORDS.cardTitle}</span><span class="b px">${o.title}</span></div><div style="--cols:${cols};${o.nm ? `--nm:${o.nm}px` : ""}">`;\n    h += `<div class="g hd"><span class="rk"></span><span class="nm" style="padding-left:14px">${TV_WORDS.cardHole}</span>${par.map((_, k) => `<span>${k + 1}</span>`).join("")}<span class="th">${TV_WORDS.cardTotal}</span></div>`;\n    h += `<div class="g par"><span class="rk"></span><span class="nm">${TV_WORDS.cardPar}</span>${par.map((p) => `<span>${p}</span>`).join("")}<span>${par.reduce((a, b) => a + b, 0)}</span></div>`;\n    for (const w of rows) {\n      const r = w.r;\n      h += `<div class="g${w.lead ? " lead" : ""}" id="row-${r.i}"><span class="rk">${w.rank0 != null ? `<b class="k0">${w.rank0}</b>` : ""}<b class="k1">${w.rank1}</b></span>` +\n        `<span class="nm">${o.chip ? o.chip(r) : `<i class="chip" style="background:${r.c}"></i>`}${esc(r.n)}<span class="ol wcup">${pix(SPR.cup, 4, { "#": GOLD })}</span></span>` +\n        r.s.map((v, k) => `<span class="h h${k + 1}"><b>${v === null ? "" : v === 1 ? `<i class="ace">1</i>` : v}</b></span>`).join("") +\n        `<span class="tt">${w.total0 != null ? `<b class="v0">${w.total0}</b>` : ""}<b class="v1">${w.total1}</b></span></div>`;\n    }\n    return h + `</div></div>`;\n  }\n  const board = (id, x, y, w, h, inner) =>\n    grp(id, `<div class="board" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><div class="paper">${inner}</div></div><div class="clip" style="left:${x + w / 2 - 140}px;top:${y - 36}px"></div>`, x + w / 2, y);\n\n  const seqOf = (name) => (window.SEQ && window.SEQ[name]) || { fps: 30, files: [], cup: [], bump: [], mark: 0 };\n\n\n  // ---- the TV screens from real data. The sample screens below are these with the sample players; the live game\n  // (src/signs-tv.js) calls them with its own players, holes and scores, on its own clock. ----\n  // The hole sign. Stands for about 3 seconds while the camera waits, fades, then the tour starts.\n  const bannerOf = (n, name, par) => {\n    const s = fit(name, 940, 168);\n    return {\n      html: grp("sign",\n        post(600, 760) + post(1272, 760) +\n        pl(770, 640, 380, 96, "red", `<div class="px paint" style="font-size:40px">${TV_WORDS.hole(n)}</div>`) +\n        pl(440, 724, 1040, 216, "", `<div class="paint" style="font-size:${s}px;text-shadow:8px 8px 0 ${OUT};margin-top:-${Math.round(s * 0.08)}px">${esc(name)}</div>`) +\n        pl(810, 928, 300, 100, "gold", `<div class="px" style="font-size:40px">${TV_WORDS.par(par)}</div>`)),\n      tracks: [["#sign", "rise", 0.4, { from: 520 }], ["#sign", "fadeOut", 3.6, { dur: 0.4 }]],\n    };\n  };\n  // A ball drops in: the score name and the player\'s name (p = { n, c }). SETTINGS.ballInPlace says where.\n  // m = the moment the ball drops; cup = where the cup is on the picture (only the "cup" place uses it).\n  function ballinOf(text, p, m, cup) {\n    let html, tracks;\n    if (SETTINGS.ballInPlace === "cup") {\n      // nailed to the flag pole, a little above the cup\n      const c = cup || [960, 893], cx = Math.round(c[0] / 4) * 4, top = Math.round((c[1] - 424) / 4) * 4;\n      html = grp("bi", scoreSign(cx - 220, top, 440, 150, text) + namePl(cx - 200, top + 158, 400, 92, p));\n      tracks = [["#bi", "drop", m + 0.1, { from: -760, b: 28 }], ["#bi", "upOut", m + 2.35, { to: -760 }]];\n    } else if (SETTINGS.ballInPlace === "bottom") {\n      html = grp("bi", post(520, 980) + post(1352, 980) + scoreSign(420, 948, 480, 112, text) + namePl(908, 948, 592, 112, p));\n      tracks = [["#bi", "rise", m + 0.1, { from: 200, b: 12 }], ["#bi", "upOut", m + 2.35, { to: 200, dur: 0.25 }]];\n    } else {\n      html = grp("bi", rope(700, -900, 96) + rope(1204, -900, 96) + scoreSign(600, 88, 720, 232, text) +\n        rope(760, 316, 352) + rope(1144, 316, 352) + namePl(680, 348, 560, 116, p));\n      tracks = [["#bi", "drop", m + 0.1, { from: -520 }], ["#bi", "upOut", m + 2.35, { to: -520 }]];\n    }\n    return { html, tracks };\n  }\n  // Hole in one: the big sign. The name hangs under it, well clear of the cup. m = the moment the ball drops.\n  const aceOf = (p, holeN, holeName, m) => ({\n    html:\n      grp("nm", rope(720, 400, 590) + rope(1184, 400, 590) + namePl(620, 582, 680, 150, p)) +\n      grp("big", rope(560, -900, 150) + rope(1344, -900, 150) +\n        pl(330, 130, 1260, 420, "", `<div style="position:absolute;inset:16px;border:8px solid ${GOLD}"></div>\n          <div class="px" style="font-size:30px;color:${CREAM};margin-bottom:26px;text-shadow:4px 4px 0 ${OUT}">${TV_WORDS.aceTop(holeN, holeName)}</div>\n          <div class="hio" style="font-size:182px;color:${GOLD};text-shadow:8px 8px 0 ${OUT};margin-top:-10px">${TV_WORDS.ace}</div>`)) +\n      star(252, 88, 14) + star(1436, 88, 14) + star(190, 470, 10) + star(1620, 470, 10) + star(120, 290, 8) + star(1712, 340, 8),\n    tracks: [\n      ["#big", "drop", m + 0.1, { from: -640, dur: 0.6, b: 56 }], ["#big", "shake", m + 0.43, { amp: 12, dur: 0.35 }],\n      ["#nm", "drop", m + 0.75, { from: -190, dur: 0.4, b: 20 }],\n      [".star", "pop", m + 0.6, { stagger: 0.08, big: 1.3 }], [".star", "twinkle", m + 1.2, { period: 0.3 }],\n      [".hio", "blink", m + 0.7, { name: "hot", period: 0.14, until: 1.4 }],\n      ["#big", "upOut", m + 3.7, { to: -760 }], ["#nm", "upOut", m + 3.7, { to: -760 }], [".star", "hide", m + 3.7],\n    ],\n  });\n  // Score card after hole n. The new scores get written in, then the rows move so the best score is on top.\n  // before / after: table rows ({ n, c, i, s (per hole), total, rank, lead }) before and after hole n.\n  // Round 3: the whole card is slower (Lakota: "slow it down a bit"). It was 6.8 s, it is 9.4 s.\n  function scorecardOf(before0, after, n, par) {\n    const before = ranked(before0), order1 = ranked(after), byI = new Map(after.map((a) => [a.i, a]));\n    const rows = before.map((b) => { const a = byI.get(b.i); return { r: a, rank0: b.rank, rank1: a.rank, total0: b.total, total1: a.total }; });\n    const tracks = [["#bd", "rise", 0.3, { from: 1040, dur: 0.7 }]];\n    const W0 = 1.7, GAP = 0.26, MOVE = W0 + 8 * GAP + 0.7, SET = MOVE + 1.35;\n    rows.forEach((w, k) => {\n      const id = `#row-${w.r.i}`, tw = W0 + k * GAP, to = order1.findIndex((x) => x.i === w.r.i);\n      tracks.push([`${id} .h${n} b`, "pop", tw, { big: 1.35, dur: 0.3 }], [`${id} .v0`, "swapOut", tw], [`${id} .v1`, "swapIn", tw], [`${id} .v1`, "pop", tw, { big: 1.25, dur: 0.3 }]);\n      tracks.push([id, "move", MOVE, { dy: (to - k) * 64, dur: 1.15 }], [`${id} .k0`, "swapOut", SET], [`${id} .k1`, "swapIn", SET]);\n      if (w.r.lead) tracks.push([id, "blink", SET, { name: "lead", period: 0.2, until: 0.8 }], [id, "cls", SET + 0.8, { name: "lead" }]);\n    });\n    tracks.push(["#bd", "upOut", 8.85, { to: 1040, dur: 0.45 }]);\n    return { html: board("bd", 420, 118, 1080, 840, card(rows, { title: TV_WORDS.afterHole(n), par })), tracks };\n  }\n\n  // ---- TV screens ----\n  const tv = {\n    // The hole sign. Stands for about 3 seconds while the camera waits, fades, then the tour starts.\n    banner: (o) => {\n      const long = o.screen === "banner3";\n      const n = long ? 3 : 1;\n      return { seq: long ? "banner3" : "banner", frame: (t) => (long || t < 4.0 ? 0 : 41 + (t - 4.0) * 30), ...bannerOf(n, HOLES[n - 1], PAR[n - 1]), dur: 5.2, still: 2 };\n    },\n\n    // A ball drops in: the score name and the player\'s name. SETTINGS.ballInPlace says where.\n    ballin: (o) => {\n      const p = byName("AUNT ROSIE"), q = seqOf("ballin"), text = scoreName(2, PAR[0]);\n      const m = q.mark, last = Math.round((135.0 - 130.9) * 30) - 2;\n      const cup = q.cup[Math.min(q.cup.length - 1, Math.round(m * 30) + 30)] || [960, 893];\n      return { seq: "ballin", frame: (t) => Math.min(last, t * 30), ...ballinOf(text, p, m, cup), dur: m + 2.75, still: m + 1.4 };\n    },\n\n    // What the ball-in sign says for each score. A reference picture, not a game moment.\n    names: () => {\n      const list = [["BIRDIE", "KIT", 2, 3], ["PAR", "AUNT ROSIE", 2, 2], ["BOGEY", "DESHAWN", 3, 2], ["2X BOGEY", "BIG TOM", 4, 2], ["3X BOGEY", "JUNEBUG", 5, 2], ["4X BOGEY", "MAYA", 6, 2]];\n      let h = "";\n      list.forEach(([, who, strokes, par], k) => {\n        const x = 100 + (k % 3) * 600, y = 130 + Math.floor(k / 3) * 460, text = scoreName(strokes, par);\n        h += rope(x + 100, y - 70, y + 8) + rope(x + 404, y - 70, y + 8) + scoreSign(x, y, 520, 200, text) +\n          rope(x + 140, y + 196, y + 228) + rope(x + 364, y + 196, y + 228) + namePl(x + 40, y + 224, 440, 104, byName(who));\n        if (strokes < par) h += star(x - 48, y - 52, 10, "s0") + star(x + 458, y - 52, 10, "s0");\n      });\n      return { seq: "card", frame: () => 0, html: h, tracks: [], dur: 1, still: 0 };\n    },\n\n    // Hole in one: the big sign. The name hangs under it, well clear of the cup.\n    ace: () => {\n      const q = seqOf("ace"), m = q.mark, last = Math.round((241.7 - 236.9) * 30) - 8;\n      return { seq: "ace", frame: (t) => Math.min(last, t * 30), ...aceOf(byName("PRIYA"), 2, HOLES[1], m), dur: m + 4.1, still: m + 2.4 };\n    },\n\n    // A plain knock: only the flash, drawn by the stage where the balls met. Nothing else on screen.\n    knock: () => {\n      const q = seqOf("knock");\n      return { seq: "knock", frame: (t) => t * 30, html: "", tracks: [], dur: q.files.length / 30 || 2.4, still: (q.mark || 1) + 0.13 };\n    },\n\n    // Score card after a hole. The new scores get written in, then the rows move so the best score is on top.\n    scorecard: () => ({ seq: "card", frame: (t) => t * 30, ...scorecardOf(table(1), table(2), 2, PAR), dur: 9.4, still: 7.2 }),\n\n    final: () => finals(false),\n    tie: () => finals(true),\n\n    // The TV corner list with the score name (round 3). The list is the game\'s own drawing, so the picture\n    // is made by seq.mjs in the game\'s own pixels and letters. Here it is only shown: whole, and close up.\n    corner: () => ({ seq: "corner", frame: () => 0, html: "", tracks: [], dur: 1, still: 0 }),\n    "corner-close": () => {\n      const Z = 8, x0 = 362, y0 = 2, w = 118, h = 78; // the piece of the 480 x 270 picture that is shown, 8 times bigger\n      return {\n        seq: "corner", frame: () => 0,\n        html: `<div class="dim"></div>` + pl(700, 96, 520, 104, "", `<div class="px paint" style="font-size:36px">CORNER LIST</div>`) +\n          `<div class="zoom" style="left:${960 - (w * Z + 16) / 2}px;top:228px;width:${w * Z + 16}px;height:${h * Z + 16}px;background-image:url(seq/corner/0000.png);background-size:${480 * Z}px ${270 * Z}px;background-position:${-x0 * Z}px ${-y0 * Z}px"></div>`,\n        tracks: [], dur: 1, still: 0,\n      };\n    },\n\n    // The bird\'s eye view (round 4). A player presses the small view button on the phone: the TV camera rises\n    // slowly until it looks down on the whole hole, and stays there until the button is pressed again or OK.\n    // The game has no view from above yet. This is the intended one, drawn by the game\'s own painter.\n    bird: () => {\n      const q = seqOf("bird"), N = q.files.length - 1, R = q.rise || 3, UP = 1.0, STAY = 3.2, DOWN = UP + R + STAY;\n      const last = (q.balls && q.balls[N]) || [], me = last.find((b) => b[1]) || [0, 1, 240, 135, 3], p = PLAYERS[me[0]] || PHONE.you;\n      const x = Math.round(me[2]) * 4, y = Math.round(me[3]) * 4;\n      return {\n        seq: "bird",\n        frame: (t) => (t < UP ? 0 : t < UP + R ? (t - UP) * 30 : t < DOWN ? N : t < DOWN + R ? N - (t - DOWN) * 30 : 0),\n        // from above a ball is only 2 squares wide, so here every ball is drawn at least 7 squares wide\n        paint: (g, k) => { for (const [id, , bx, by, r] of (q.balls && q.balls[k]) || []) if (r < 3) drawBall(g, bx, by, 3, q.colors[id], "none"); },\n        html: grp("tag", namePl(x - 110, y - 124, 220, 72, p) + `<div class="abs" style="left:${x - 4}px;top:${y - 56}px;width:8px;height:32px;background:${OUT}"></div>`),\n        tracks: [["#tag", "pop", UP + R + 0.1, { dur: 0.25 }], ["#tag", "hide", DOWN]],\n        dur: DOWN + R + 0.8, still: UP + R + 1.6, stills: { low: 0, top: UP + R + 1.6 },\n      };\n    },\n  };\n\n  // Final scores (round 3). The rows are read out from last place up, then the winner. Then every other row\n  // falls off the card, one after another, the card itself falls away, and only the winner\'s row is left.\n  // That row goes to the middle and the winner sign comes up over it. With a tie two rows are left.\n  const finals = (tie) => finalsOf(ranked(table(3, tie)), PAR);\n  // r: the table rows best first ({ n, c, i, s, total, rank, lead }); a tie is two rows with lead set\n  function finalsOf(r, par) {\n    const tie = r.filter((x) => x.lead).length > 1, big = SETTINGS.winnerSign === "big" && !tie;\n    const tops = tie ? r.slice(0, 2) : r.slice(0, 1), w = tops[0];\n    const rest = r.filter((x) => !tops.includes(x)).reverse(); // last place first\n    const rows = r.map((x) => ({ r: x, rank1: x.rank, total1: x.total, lead: tops.includes(x) }));\n    const cols = cardCols(par.length, big);\n    const tracks = [["#bunt", "drop", 0.3, { from: -140, dur: 0.35, b: 12 }], ["#bunt .f", "wave", 0, { period: 0.45 }], ["#bd", "rise", 0.6, { from: 1040, dur: 0.6 }]];\n    // 1. the rows are read out\n    const R0 = 1.7, GAP = 0.36;\n    rest.forEach((x, k) => tracks.push([`#row-${x.i}`, "slideIn", R0 + k * GAP, { dx: 48, dur: 0.24 }]));\n    const tWin = R0 + (rest.length - 1) * GAP + 1.0;\n    tops.forEach((x) => tracks.push([`#row-${x.i}`, "slideIn", tWin, { dx: 48, dur: 0.24 }], [`#row-${x.i}`, "blink", tWin, { name: "lead", period: 0.16, until: 0.8, inv: true }]));\n    // 2. the other rows fall away, last place first\n    const F0 = tWin + 1.5, FG = 0.45, FALL = 2.35;\n    rest.forEach((x, k) => tracks.push([`#row-${x.i}`, "fall", F0 + k * FG, { dir: k % 2 ? -1 : 1, half: big ? 398 : 448 }]));\n    // 3. the winner\'s row comes loose (a copy of it that is not on the card), and the card falls away from under it\n    const TH = F0 + (rest.length - 1) * FG + FALL + 0.3, TB = TH + 0.6;\n    tracks.push(["#bd", "boardFall", TB, { rock: 1.0, drop: 1.3 }]);\n    // 4. the row hops, goes to the middle, and the winner sign comes up over it\n    const TM = TB + 2.3 + 0.2, TS = TM + 1.2;\n    const signX = big ? 490 : 556, rowY = tie ? [924, 1008] : [big ? 1000 : 836], rowS = tie ? 1.25 : big ? 1.25 : 1.5;\n    const goes = tops.map((x, k) => {\n      const go = { dur: 1.2, scale: rowS };\n      tracks.push([`#row-${x.i}`, "hide", TH], [`#hero-${x.i}`, "pop", TH, { big: 1.06, small: 1, dur: 0.3 }],\n        [`#hero-${x.i}`, "hop", TM + k * 0.12, { amp: 28, dur: 0.45 }], [`#hero-${x.i}`, "to", TM + 0.5, go]);\n      return go;\n    });\n    const setup = (root) => {\n      // (the page may be drawn scaled, as on a TV: measure in the page\'s own 1920 x 1080 pixels)\n      const ov = root.querySelector(".ov"), base = root.getBoundingClientRect(), u = base.width / (root.offsetWidth || base.width) || 1;\n      tops.forEach((x, k) => {\n        const row = root.querySelector(`#row-${x.i}`), b0 = row.getBoundingClientRect();\n        const b = { left: (b0.left - base.left) / u, top: (b0.top - base.top) / u, width: b0.width / u, height: b0.height / u };\n        const h = document.createElement("div"), c = row.cloneNode(true);\n        h.className = "herow"; h.id = `hero-${x.i}`;\n        h.style.cssText = `left:${b.left}px;top:${b.top}px;width:${b.width}px;height:${b.height}px;--cols:${cols};${big ? "--nm:40px" : ""}`;\n        c.removeAttribute("id"); c.classList.add("lead");\n        h.appendChild(c); ov.appendChild(h);\n        goes[k].dx = 960 - (b.left + b.width / 2);\n        goes[k].dy = rowY[k] - (b.top + b.height / 2);\n      });\n    };\n    let sign;\n    if (tie) {\n      const [a, b] = tops;\n      sign = grp("posts", post(200, 330) + post(560, 330)) +\n        `<div class="abs ol8" id="cup" style="left:${404 - 99}px;top:150px">${pix(SPR.cup, 18, { "#": GOLD })}</div>` +\n        pl(54, 340, 700, 104, "red", `<div class="px paint" style="font-size:34px">${TV_WORDS.tie}</div>`, "", "wn") +\n        namePl(64, 452, 680, 150, a, "n1") + namePl(64, 610, 680, 150, b, "n2") +\n        pl(164, 768, 480, 100, "", `<div class="paint" style="font-size:56px;margin-top:-6px">${dg(TV_WORDS.strokesEach(a.total))}</div>`, "", "st");\n    } else if (big) {\n      sign = grp("posts", post(180, 440) + post(712, 440)) +\n        `<div class="abs ol8" id="cup" style="left:${470 - 154}px;top:118px">${pix(SPR.cup, 28, { "#": GOLD })}</div>` +\n        star(140, 150, 10) + star(690, 150, 10) + star(84, 320, 8) + star(768, 320, 8) +\n        pl(190, 410, 560, 124, "red", `<div class="px paint" style="font-size:60px">${TV_WORDS.winner}</div>`, "", "wn") +\n        namePl(40, 542, 860, 264, w, "n1") +\n        pl(230, 814, 480, 112, "", `<div class="paint" style="font-size:68px;margin-top:-6px">${dg(TV_WORDS.strokes(w.total))}</div>`, "", "st");\n    } else {\n      sign = grp("posts", post(200, 330) + post(560, 330)) +\n        `<div class="abs ol8" id="cup" style="left:${404 - 99}px;top:150px">${pix(SPR.cup, 18, { "#": GOLD })}</div>` +\n        pl(184, 340, 440, 104, "red", `<div class="px paint" style="font-size:44px">${TV_WORDS.winner}</div>`, "", "wn") +\n        namePl(64, 452, 680, 200, w, "n1") +\n        pl(204, 660, 400, 100, "", `<div class="paint" style="font-size:60px;margin-top:-6px">${dg(TV_WORDS.strokes(w.total))}</div>`, "", "st");\n    }\n    tracks.push(["#posts", "rise", TS, { from: 800, dur: 0.55 }], ["#wn", "pop", TS + 0.5, { dur: 0.3 }], ["#n1", "pop", TS + 0.85, { big: 1.15, dur: 0.3 }]);\n    if (tie) tracks.push(["#n2", "pop", TS + 1.15, { big: 1.15, dur: 0.3 }]);\n    const tc = TS + (tie ? 1.6 : 1.3);\n    tracks.push(["#cup", "pop", tc, { big: 1.3, dur: 0.3 }], ["#cup", "bob", tc + 0.8, { amp: -8, period: 0.5 }], ["#st", "pop", tc + 0.45, { dur: 0.3 }]);\n    if (big) tracks.push([".star", "pop", tc + 0.2, { stagger: 0.1, big: 1.3 }], [".star", "twinkle", tc + 1.0, { period: 0.35 }]);\n    // the card stands in the middle now: the winner sign only comes once the card is gone\n    const cardAt = big ? [490, 170, 940, 840] : [440, 170, 1040, 840];\n    const dur = Math.round((tc + 0.45 + 1.9) * 10) / 10;\n    return {\n      seq: "final", frame: (t) => t * 30, setup,\n      html: grp("bunt", bunting()) + `<div class="grp" style="left:${signX}px">${sign}</div>` +\n        board("bd", ...cardAt, card(rows, { title: TV_WORDS.finalScores, cols, par, ...(big ? { nm: 40, vars: "--ta:24px;--tb:20px;--th:20px" } : { vars: "--ta:26px;--tb:22px" }) })),\n      tracks, dur, still: dur - 1.2, falls: [F0, TH, TB, TM, TS],\n    };\n  }\n\n  // ---- phone screens ----\n  const head = (n = PHONE.holeN, name = PHONE.holeName, par = PHONE.par, of = PHONE.holeOf) =>\n    `<div class="pp phead"><div><div class="px t">${PHONE_WORDS.holeOf(n, of)}</div><div class="n" style="text-shadow:2px 2px 0 ${OUT}">${esc(name.toLowerCase().replace(/(^|\\s)\\S/g, (m) => m.toUpperCase()))}</div></div><div class="pp gold par px">${PHONE_WORDS.par(par)}</div></div>`;\n\n  // Round 4: no person is drawn on the phone, ever. Words and arrows only.\n  const big = (list, max) => { const s = Math.min(...list.map((l) => fit(l, 290, max, 2))); return `<div class="w" style="font-size:${s}px">${list.join("<br>")}</div>`; };\n  // After OK the phone shows one square with plain words: green first, then gold when it is time to swing.\n  const mat1 = () => `<div class="mat" id="m1"><div>${big(PHONE_WORDS.step1, 72)}</div></div>`;\n  const mat2 = () => `<div class="mat go" id="m2"><div>${big(PHONE_WORDS.step2, 120)}</div></div>`;\n  // a big arrow on its own wooden pad. The whole pad is the button.\n  const pad = (id, flip) => `<div class="pp pad" id="${id}"><span class="ol" style="display:block;${flip ? "transform:scaleX(-1)" : ""}">${pix(arrowShaft(6, 6), 11, { "#": CREAM })}</span></div>`;\n  const BACKARROW = pix(["..#...", ".##...", "######", ".##...", "..#..."], 2, { "#": CREAM });\n  // after OK: a small button under the words takes you back to the arrows (round 5, Lakota: "Yes, a small AIM AGAIN button")\n  const again = () => `<div class="pp againb px" id="ag">${BACKARROW}<span>${PHONE_WORDS.aimAgain}</span></div>`;\n  const turnHtml = () => head() + `<div class="info"><span class="px s" style="color:${PHONE.you.c}">${PHONE_WORDS.stroke(PHONE.stroke)}</span><span class="d">${dg(PHONE_WORDS.toCup(PHONE.dist))}</span></div>` +\n    `<div class="vcol" id="aimv"><div class="pp birdb px" id="bv">${EYE}<span>${PHONE_WORDS.birdsEye}</span></div>` +\n    `<div class="px aimt">${PHONE_WORDS.aim}</div><div class="pads">${pad("al", false)}${pad("ar", true)}</div>` +\n    `<div class="pp gold okb px" id="ok">${PHONE_WORDS.ok}</div></div>` + mat1() + mat2() + again();\n  const EYE = pix(["..#####..", ".#wwwww#.", "#ww###ww#", "#ww###ww#", ".#wwwww#.", "..#####.."], 2, { "#": OUT, w: "#ffffff" });\n  const FLAG = pix(["####.", "#####", "####.", "#....", "#....", "#...."], 2, { "#": GREEN });\n  // strokes on this hole. A finished player gets the score name on a small green tag, then the flag, then the strokes.\n  const here = (n, sunk, cls, par) => `<b class="${cls || ""}${sunk ? " in" : ""}">${sunk ? `<i class="tag">${dg(shortName(n, par))}</i>${FLAG}` : ""}${n}</b>`;\n  // names get a little smaller, all by the same amount, so the longest name still fits beside the longest tag\n  const nameSize = (names = PLAYERS.map((p) => p.n)) => {\n    cv.font = `400 10px "FoxBox Pixel"`;\n    const tag = Math.max(...[SHORT_ACE, "BIRDIE", "9X BOGEY"].map((s) => cv.measureText(s).width)) + 13;\n    const room = 322 - 26 - 44 - (tag + 8 + 10 + 8 + 18) - 10;\n    return Math.min(26, ...names.map((n) => fit(n, room, 26, 1)));\n  };\n\n  const phone = {\n    // The player\'s turn (round 4). While aiming: the two big arrows, the small view button and OK. After OK:\n    // plain words only, AIM YOUR PHONE DOWN, and once the phone points down the one word SWING.\n    turn: () => ({\n      html: turnHtml(),\n      tracks: [\n        ["#al", "press", 0.5], ["#al", "press", 0.9], ["#ar", "press", 1.5],\n        // the view button: on for a while (the TV looks down on the hole), the arrows still work, then off again\n        ["#bv", "press", 2.3], ["#bv", "during", 2.3, { name: "on", dur: 2.0 }], ["#ar", "press", 3.0], ["#bv", "press", 4.3],\n        // OK: the aim is set. The arrows go away and the words come: first aim your phone down, then swing.\n        ["#ok", "press", 5.0, { dur: 0.14 }],\n        ["#aimv", "swapOut", 5.14], ["#ag", "swapIn", 5.14], ["#m1", "swapIn", 5.14], ["#m1", "pop", 5.14, { big: 1.04, dur: 0.16, small: 0.97 }],\n        ["#m1", "swapOut", 7.3], ["#m2", "swapIn", 7.3], ["#m2", "pop", 7.3, { big: 1.04, dur: 0.16, small: 0.97 }],\n      ],\n      dur: 9.5, still: 1.2, stills: { aim: 1.2, bird: 3.5, down: 6.2, swing: 8.5 },\n    }),\n    // AIM AGAIN (round 5): the aim was set, the player changes their mind. One tap on the small button and the\n    // arrows are back. Then OK again, and on to the swing.\n    again: () => {\n      const A = 1.6, OK = 4.0, SW = 6.0, on = (sel, ...at) => [sel, "at", 0, { at }];\n      return {\n        html: turnHtml(),\n        tracks: [\n          on("#m1", [0, A + 0.14], [OK + 0.14, SW]), on("#ag", [0, A + 0.14], [OK + 0.14, 1e9]), on("#aimv", [A + 0.14, OK + 0.14]), on("#m2", [SW, 1e9]),\n          ["#ag", "press", A, { dur: 0.14 }], ["#ar", "press", 2.4], ["#ar", "press", 2.8], ["#al", "press", 3.3], ["#ok", "press", OK, { dur: 0.14 }],\n          ["#m2", "pop", SW, { big: 1.04, dur: 0.16, small: 0.97 }],\n        ],\n        dur: 7.6, still: 0.8, stills: { button: 0.8, back: 2.0 },\n      };\n    },\n    wait: () => {\n      const A = PHONE.putting, B = byName("AUNT ROSIE"), C = byName("KIT");\n      const now = (p, id) => `<div class="pp col now" id="${id}" style="--pc:${p.c}">${esc(PHONE_WORDS.putting(p.n))}</div>`;\n      const ns = nameSize();\n      const row = (r) => {\n        const ch = r.n === A.n ? [r.here + 1, false, r.total + 1] : r.n === B.n ? [r.here + 1, true, r.total + 1] : null;\n        const id = r.n === A.n ? "ra" : r.n === B.n ? "rb" : "";\n        return `<div class="pr${r.n === PHONE.you.n ? " you" : ""}"${id ? ` id="${id}"` : ""}><span class="c" style="background:${r.c}"></span><span class="n" style="font-size:${ns}px">${esc(r.n)}</span>` +\n          `<span class="hr">${here(r.here, r.sunk, ch ? "x0" : "", PHONE.par)}${ch ? here(ch[0], ch[1], "x1", PHONE.par) : ""}</span><span class="t">${ch ? `<b class="x0">${r.total}</b><b class="x1">${ch[2]}</b>` : r.total}</span></div>`;\n      };\n      const sw = (a, b, t) => [[a, "swapOut", t], [b, "swapIn", t], [b, "pop", t, { big: 1.06, dur: 0.16, small: 0.96 }]];\n      return {\n        html: head() + now(A, "p0") + now(B, "p1") + now(C, "p2") +\n          `<div class="info">${[2, 1, 0].map((n, k) => `<span class="d" id="b${k}">${dg(PHONE_WORDS.before(n))}</span>`).join("")}</div>` +\n          `<div class="ppr"><div class="pr h"><span></span><span></span><span>${PHONE_WORDS.thisHole}</span><span>${PHONE_WORDS.all}</span></div>` + PHONE.rows.map(row).join("") + `</div>`,\n        tracks: [\n          ["#ra .x0", "swapOut", 1.2], ["#ra .x1", "swapIn", 1.2], ["#ra .x1", "pop", 1.2, { big: 1.4 }],\n          ...sw("#p0", "#p1", 2.0), ["#p2", "swapIn", 4.2], ["#b0", "swapOut", 2.0], ["#b1", "swapIn", 2.0], ["#b1", "swapOut", 4.2], ["#b2", "swapIn", 4.2],\n          ["#rb .x0", "swapOut", 3.5], ["#rb .x1", "swapIn", 3.5], ["#rb .x1", "pop", 3.5, { big: 1.4 }],\n          ["#p1", "swapOut", 4.2], ["#p2", "pop", 4.2, { big: 1.06, dur: 0.16, small: 0.96 }],\n        ],\n        dur: 5.6, still: 0.6,\n      };\n    },\n    // Every short score name in the list, on a par 3. A reference picture, not a game moment.\n    "wait-names": () => {\n      const ns = nameSize(), par = PAR[2];\n      const row = (p, k) => `<div class="pr"><span class="c" style="background:${p.c}"></span><span class="n" style="font-size:${ns}px">${esc(p.n)}</span>` +\n        `<span class="hr">${here(k + 1, true, "", par)}</span><span class="t">${p.s[0] + p.s[1] + k + 1}</span></div>`;\n      return {\n        auto: true,\n        html: head(3, HOLES[2], par) + `<div class="ppr"><div class="pr h"><span></span><span></span><span>${PHONE_WORDS.thisHole}</span><span>${PHONE_WORDS.all}</span></div>` + PLAYERS.map(row).join("") + `</div>`,\n        tracks: [], dur: 1, still: 0,\n      };\n    },\n  };\n\n  // ---- the knock flash: three quick pictures where the balls met ----\n  const flash = `<div id="fl" class="grp">` +\n    `<div class="abs ol f0" style="left:-42px;top:-42px">${pix(SPR.plus7, 12, { "#": "#ffffff" })}</div>` +\n    `<div class="abs ol f1" style="left:-72px;top:-72px">${pix(BURST, 16, { "#": "#ffffff" })}</div>` +\n    `<div class="abs ol f2" style="left:-88px;top:-88px">${pix(BURST2, 16, { "#": GOLD })}</div></div>`;\n\n  // ---- movement: every track adds to an element\'s state for the moment t ----\n  const FX = {\n    drop(s, t, o) { // falls in from above and bounces twice\n      if (t < 0) { s.vis = false; return; }\n      const p = Math.min(1, t / (o.dur || 0.5)), b = o.b || 36;\n      if (p < 0.55) s.y += (o.from || -700) * (1 - (p / 0.55) ** 2);\n      else if (p < 0.82) s.y -= b * Math.sin((Math.PI * (p - 0.55)) / 0.27);\n      else if (p < 1) s.y -= b * 0.3 * Math.sin((Math.PI * (p - 0.82)) / 0.18);\n    },\n    swingDown(s, t, o) { // a sign on its ropes is let down from behind the sign above it, swinging, and comes to rest\n      if (t < 0) { s.vis = false; return; }\n      const p = Math.min(1, t / (o.dur || 0.8)), sw = o.swing || 2.6;\n      s.y += (o.from || -180) * (1 - p) ** 2;\n      if (t < sw) s.r += (o.deg || 8) * (1 - t / sw) ** 2 * Math.sin((2 * Math.PI * t) / (o.period || 0.9));\n    },\n    rise(s, t, o) { // comes up from below, a little too far, and settles\n      if (t < 0) { s.vis = false; return; }\n      const p = Math.min(1, t / (o.dur || 0.45));\n      if (p < 0.6) s.y += (o.from || 500) * (1 - p / 0.6) ** 2;\n      else if (p < 1) s.y -= (o.b || 20) * Math.sin((Math.PI * (p - 0.6)) / 0.4);\n    },\n    upOut(s, t, o) { if (t < 0) return; const p = t / (o.dur || 0.3); if (p >= 1) { s.vis = false; return; } s.y += (o.to || -700) * p * p; },\n    fadeOut(s, t, o) { if (t < 0) return; const p = t / (o.dur || 0.4); if (p >= 1) { s.vis = false; return; } s.op *= 1 - Math.floor(p * 4) / 4; },\n    pop(s, t, o) { if (t < 0) { s.vis = false; return; } const p = t / (o.dur || 0.2); if (p < 0.35) s.s *= o.small || 0.6; else if (p < 1) s.s *= o.big || 1.2; },\n    slideIn(s, t, o) { if (t < 0) { s.vis = false; return; } const p = Math.min(1, t / (o.dur || 0.16)); s.x += (o.dx || 40) * (1 - p) ** 2; },\n    fall(s, t, o) { // a row comes loose: it rocks, one end drops, it hangs a moment, then it falls off the card\n      if (t < 0) return;\n      const R = o.rock || 0.6, T = o.tip || 0.45, G = o.hang || 0.2, D = o.drop || 1.1, d = o.dir || 1, half = o.half || 448, A = o.deg || 8;\n      s.cls.loose = true; s.z = 4;\n      if (t < R) { s.r += 1.5 * Math.sin((t / 0.4) * Math.PI * 2); return; }\n      const p = Math.min(1, (t - R) / T), a = A * p * p * (3 - 2 * p), rad = (a * Math.PI) / 180;\n      s.x -= d * half * (1 - Math.cos(rad)); s.y += half * Math.sin(rad); // the other end stays where it was\n      const q = (t - R - T - G) / D;\n      if (q >= 1) { s.vis = false; return; }\n      s.r += d * (a + (q > 0 ? 22 * q : 0));\n      if (q > 0) s.y += 1150 * q * q;\n    },\n    boardFall(s, t, o) { // the card swings once on its clip, then lets go and drops out of the picture\n      if (t < 0) return;\n      const R = o.rock || 1.0, D = o.drop || 1.3;\n      if (t < R) { s.r += 3 * Math.sin((t / R) * Math.PI * 2) * (0.4 + (0.6 * t) / R); return; }\n      const p = (t - R) / D;\n      if (p >= 1) { s.vis = false; return; }\n      s.r -= 10 * p; s.y += 1200 * p * p;\n    },\n    hop(s, t, o) { const d = o.dur || 0.4; if (t < 0 || t > d) return; s.y -= (o.amp || 24) * Math.sin((Math.PI * t) / d); },\n    to(s, t, o) { // glides to a new place and size, and stays there\n      if (t < 0) return;\n      const p = Math.min(1, t / (o.dur || 1.2)), e = p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) ** 2;\n      s.x += (o.dx || 0) * e; s.y += (o.dy || 0) * e; s.s *= 1 + ((o.scale || 1) - 1) * e;\n    },\n    during(s, t, o) { s.cls[o.name] = s.cls[o.name] || (t >= 0 && t < o.dur); }, // a class that is on for a while\n    show(s, t) { if (t < 0) s.vis = false; },\n    hide(s, t) { if (t >= 0) s.vis = false; },\n    swapIn(s, t) { if (t < 0) s.gone = true; },\n    swapOut(s, t) { if (t >= 0) s.gone = true; },\n    move(s, t, o) { // slides to a new place; a row going up passes over the others\n      if (t < 0) return; const p = Math.min(1, t / (o.dur || 0.6)); if (o.dy < 0 && p < 1) s.z = 3; s.y += o.dy * (p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) ** 2); },\n    twinkle(s, t, o, i) { if (t >= 0 && Math.floor((t + i * 0.17) / (o.period || 0.4)) % 2) s.s *= 0.75; },\n    wave(s, t, o, i) { if (Math.floor(t / (o.period || 0.4) + i * 0.5) % 2) s.y += 4; },\n    shake(s, t, o) { const d = o.dur || 0.3; if (t < 0 || t > d) return; s.x += (Math.floor(t * 30) % 2 ? 1 : -1) * (o.amp || 12) * (1 - t / d); },\n    bob(s, t, o) { if (t >= 0 && Math.floor(t / (o.period || 0.5)) % 2) s.y += o.amp || 4; },\n    press(s, t, o) { const on = t >= 0 && t < (o.dur || 0.18); if (on) s.y += 2; s.cls.down = s.cls.down || on; },\n    cls(s, t, o) { s.cls[o.name] = s.cls[o.name] || t >= 0; },\n    at(s, t, o) { if (!o.at.some(([a, b]) => t >= a && t < b)) s.gone = true; }, // there only between these moments (t0 = 0)\n    pulse(s, t, o) { if (t < 0) { if (!o.keep) s.vis = false; } else if (Math.floor(t / (o.period || 0.5)) % 2) s.op *= 0.35; }, // comes on, then dims and brightens (keep: it was there already)\n    blink(s, t, o) { // flickers a class for a moment; with inv the class is on before and after\n      const live = t >= 0 && t < o.until, flick = live && Math.floor(t / o.period) % 2 === 0;\n      const v = o.inv ? !flick : flick;\n      s.cls[o.name] = o.inv ? v : s.cls[o.name] || v;\n    },\n  };\n\n  function timeline(root, tracks, unit) {\n    const items = tracks.map(([sel, fx, t0, o]) => ({ els: [...root.querySelectorAll(sel)], fx, t0, o: o || {} }));\n    for (const it of items) if (!it.els.length) console.warn("no element for", it);\n    const all = [...new Set(items.flatMap((i) => i.els))];\n    const snap = (v) => Math.round(v / unit) * unit;\n    return (t) => {\n      const st = new Map(all.map((e) => [e, { x: 0, y: 0, s: 1, r: 0, op: 1, vis: true, gone: false, z: 0, cls: {} }]));\n      for (const it of items) it.els.forEach((el, i) => FX[it.fx](st.get(el), t - it.t0 - (it.o.stagger || 0) * i, it.o, i));\n      for (const [el, s] of st) {\n        const r = Math.round(s.r * 2) / 2; // turning goes in half degrees\n        el.style.transform = s.x || s.y || s.s !== 1 || r ? `translate(${snap(s.x)}px,${snap(s.y)}px)${r ? ` rotate(${r}deg)` : ""} scale(${s.s})` : "";\n        el.style.opacity = s.op === 1 ? "" : s.op;\n        el.style.visibility = s.vis ? "" : "hidden";\n        el.style.display = s.gone ? "none" : "";\n        el.style.zIndex = s.z || "";\n        for (const k in s.cls) el.classList.toggle(k, s.cls[k]);\n      }\n    };\n  }\n\n  // one golf ball (balls.js) as a picture for the page, and painted straight into a game picture\n  // (round 5: a ball may also have a pattern and a second colour. Left out, the ball is plain.)\n  const ballSvg = (R, scale, color, outfit, cls, pattern, second) => pix(ballGrid(R, outfit, pattern).rows, scale, ballColors(color, outfit, second), cls);\n  function drawBall(g, x, y, R, color, outfit, pattern, second) {\n    const b = ballGrid(R, outfit, pattern), col = ballColors(color, outfit, second), x0 = Math.round(x) - b.cx, y0 = Math.round(y) - b.cy;\n    b.rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== ".") { g.fillStyle = col[row[i]]; g.fillRect(x0 + i, y0 + j, 1, 1); } });\n  }\n\n  window.KIT_B = { css, tv, phone, flash, timeline, FX,\n    h: { OUT, WOOD, WOOD_HI, WOOD_LO, CREAM, RED, GOLD, GREEN, PAPER, LINE, PEN, step, grain, pl, post, rope, grp, bunting, star, fit, lines, scoreSign, namePl, card, cardCols, board, seqOf, head, big, here, nameSize, FLAG, ballSvg, drawBall,\n      bannerOf, ballinOf, aceOf, scorecardOf, finalsOf, mat1, mat2, pad, again, EYE, BACKARROW } };\n})();\n';var _e=`// Rounds 4 and 5: the title screen, the setup screens and the dressed golf balls, in the wooden-sign look.
// Built from the pieces in kit.js and the balls in balls.js. Every word is in settings.js (SETUP_WORDS).
// The order of play (round 6, Lakota: "the join is in foxbox"): players join in FoxBox, mini golf has no join
// screen of its own -> title screen (the START sign swings down on its ropes after 6.6 s, when START shows on
// the host's phone) -> everyone makes a ball on their phone (pick.js), the TV shows every ball changing as it is
// made -> when everyone has tapped DONE the first hole sign comes up. No fly-in.
// The phone's ball picker and the drawing pad are in pick.js.
"use strict";
(function () {
  const K = window.KIT_B, { OUT, WOOD, WOOD_LO, RED, CREAM, GOLD, pl, rope, grp, bunting, fit, namePl, card, board, seqOf, head, here, nameSize, ballSvg, drawBall } = K.h;
  const W = SETUP_WORDS, INF = 1e9;

  // the outfit each sample player wears, on their own player colour
  const LOOKS = { LAKOTA: "cowboy", MAYA: "crown", DESHAWN: "shades", "AUNT ROSIE": "chef", PRIYA: "wizard", KIT: "party", "BIG TOM": "viking", JUNEBUG: "propeller" };
  const colorOf = (name) => BALL_COLORS.find((c) => c[0] === name)[1];
  // a ball with no outfit and no empty room over it (for the colour buttons)
  const plain = (R, scale, color) => { const b = ballGrid(R, "none"); return pix(b.rows.slice(b.cy - R - 1, b.cy + R + 2).map((r) => r.slice(b.cx - R - 1, b.cx + R + 2)), scale, ballColors(color, "none")); };
  // a ball standing with the middle of its underside at (x, y)
  const stand = (x, y, R, scale, color, outfit, cls, id) => { const b = ballGrid(R, outfit); return \`<div class="abs \${cls || ""}"\${id ? \` id="\${id}"\` : ""} style="left:\${x - Math.round((b.cx + 0.5) * scale)}px;top:\${y - (b.cy + R + 2) * scale}px">\${ballSvg(R, scale, color, outfit)}</div>\`; };
  const win = (sel, ...at) => [sel, "at", 0, { at }]; // shown only between these moments
  const Q = new URLSearchParams(location.search);

  // A whole ball: { outfit, pattern, colors: [main, second] }. Colours by name here, for short.
  const ball = (outfit, pattern, main, second) => ({ outfit, pattern: pattern || "plain", colors: [colorOf(main), colorOf(second || "WHITE")] });
  const bsvg = (R, scale, b, cls) => ballSvg(R, scale, b.colors[0], b.outfit, cls, b.pattern, b.colors[1]);
  // a ball with no outfit, cut close, in any pattern (for the strips and the pattern sheet)
  const bare = (R, scale, b) => { const g = ballGrid(R, "none", b.pattern); return pix(g.rows.slice(g.cy - R - 1, g.cy + R + 2).map((r) => r.slice(g.cx - R - 1, g.cx + R + 2)), scale, ballColors(b.colors[0], "none", b.colors[1])); };

  // ---- the sample drawing (MAKE YOUR OWN): what MAYA draws, stroke by stroke, with the moment of each tap ----
  // The phone's drawing pad (pick.js) and the TV board play the same list, so the two clips line up.
  const DRAW_STEPS = [
    ["color", 0.6, "C"], ["size", 1.0, 1],
    ["line", 1.4, 3.0, [[8, 13], [9, 9], [12, 6], [15, 5], [18, 6], [21, 9], [22, 13]]], // the hat's edge
    ["line", 3.2, 3.8, [[8, 13], [22, 13]]],
    ["tool", 4.1, "fill"], ["fill", 4.5, 15, 9], // ...filled in
    ["tool", 5.0, "pen"], ["color", 5.3, "B"], ["size", 5.6, 2],
    ["line", 5.9, 6.7, [[8, 13], [22, 13]]], // the white brim
    ["dot", 7.0, 15, 3], // the bobble
    ["color", 7.5, "A"], ["size", 7.6, 1], ["line", 7.8, 8.3, [[2, 17], [5, 24]]], // a slip of the finger...
    ["undo", 8.8], // ...taken back
    ["dot", 9.6, 12, 19], ["dot", 9.9, 17, 19], // two eyes, on the ball itself
    ["size", 10.3, 0], ["line", 10.6, 11.3, [[12, 24], [13, 25], [17, 25], [18, 24]]], // a smile
  ];
  const DRAW_DONE = 12.0, DRAW_DUR = 13.6;
  // R (only for the paper-size sheet): the same strokes drawn on a paper with bigger or smaller squares.
  // A brush an even number of squares wide sits to the RIGHT of and BELOW the square you tap (padStamp), so it
  // is the middle of the brush, not the square tapped, that has to be scaled. Scaling the tapped square pulls
  // the left half of a drawing one square nearer the middle than the right half: that is what made one eye
  // fatter than the other on the 25 x 25 and 39 x 38 papers.
  function drawAt(t, R) {
    const p = padNew(R), ui = { color: "A", tool: "pen", size: 1, undo: -9 };
    const p8 = padNew(), k = p.R / p8.R;
    const off = (s) => (s - 1) / 2 - Math.floor((s - 1) / 2); // the brush's middle, from the square tapped
    // _rnd (balls.js), not Math.round: rounding how far a square is FROM THE MIDDLE, the same way on both sides
    const at = (v, c8, c, s8, s) => c + _rnd((v + off(s8) - c8) * k - off(s));
    const sq = (o, s8, s) => (k === 1 ? o : [at(o[0], p8.cx, p.cx, s8, s), at(o[1], p8.cy, p.cy, s8, s)]);
    for (const op0 of DRAW_STEPS) {
      if (op0[1] > t) break;
      const s8 = DRAW.sizes[ui.size], sz = Math.max(1, Math.round(s8 * k));
      const op = op0[0] === "line" ? [op0[0], op0[1], op0[2], op0[3].map((o) => sq(o, s8, sz))]
        : op0[0] === "dot" ? [op0[0], op0[1], ...sq([op0[2], op0[3]], s8, sz)]
        : op0[0] === "fill" ? [op0[0], op0[1], ...sq([op0[2], op0[3]], 1, 1)] : op0;
      const ch = ui.tool === "eraser" ? "." : ui.color;
      if (op[0] === "color") ui.color = op[2]; else if (op[0] === "tool") ui.tool = op[2]; else if (op[0] === "size") ui.size = op[2];
      else if (op[0] === "undo") { padUndo(p); ui.undo = op[1]; }
      else if (op[0] === "fill") { padSnap(p); padFill(p, op[2], op[3], ch); }
      else if (op[0] === "dot") { padSnap(p); padStamp(p, op[2], op[3], sz, ch); }
      else if (op[0] === "line") {
        padSnap(p);
        const way = op[3].slice(1).flatMap((b, k) => padWay(...op[3][k], ...b)), n = Math.ceil(way.length * Math.min(1, (t - op[1]) / (op[2] - op[1])));
        way.slice(0, Math.max(1, n)).forEach(([x, y]) => padStamp(p, x, y, sz, ch));
      }
    }
    return { pad: p, ui };
  }
  const DRAWN = drawnOutfit(padArt(drawAt(DRAW_DONE).pad)); // the finished drawing, as an outfit
  // ?drawn=1: MAYA wears her own drawing wherever her ball is shown
  if (Q.get("drawn")) LOOKS.MAYA = DRAWN;


  K.css += \`
.sB .cover { position: absolute; inset: 0; background: repeating-conic-gradient(#17694f 0 25%, #1b7558 0 50%) 0 0/240px 240px; }
.sB .shade { position: absolute; inset: 0; background: rgba(26,28,44,0.4); }
.sB .full { position: absolute; inset: 0; display: flex; justify-content: center; align-items: flex-end; }
.sB .pl.green { --w: #2f9e5a; --hi: #5fd08a; --lo: #1d6f3d; }
.sB .pl.dull { --w: #7a5a44; --hi: #94705a; --lo: #5c4030; color: #e8d8b8; }
.sB .gshadow { position: absolute; height: 16px; background: rgba(26,28,44,0.35); }
.sB .cb { position: relative; width: 52px; height: 52px; flex: none; }
.sB .cb > svg { position: absolute; left: -16px; top: -30px; z-index: 3; }
.sB .cbp { position: relative; width: 22px; height: 22px; margin-left: 6px; }
.sB .pr.wb { grid-template-columns: 40px 1fr auto 44px; }
.sB .cbp > svg { position: absolute; left: -10px; top: -16px; }
/* phone: the title and the ball maker */
.sB .tlogo { padding: 22px 12px 26px; text-align: center; color: \${GOLD}; text-shadow: 4px 4px 0 \${OUT}; line-height: 0.92; }
.sB .tlogo::after { content: ""; position: absolute; inset: 8px; border: 4px solid \${GOLD}; pointer-events: none; }
.sB .tballs { position: relative; flex: 1; }
.sB .plogo { align-self: center; margin-top: 6px; }
.sB .plogo #tfb { display: none; } /* the flag's second picture is for the TV's waving flag */
.sB .shead { display: flex; align-items: center; justify-content: space-between; padding: 13px 12px 12px; font-size: 15px; white-space: nowrap; text-shadow: 2px 2px 0 \${OUT}; }
.sB .shead .ch { padding: 8px 9px 7px; font-size: 12px; text-shadow: none; }
.sB .prev { position: relative; height: 288px; flex: none; }
.sB .blab { text-align: center; font-size: 18px; text-shadow: 2px 2px 0 \${OUT}; min-height: 18px; }
.sB .tray { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 8px; border: 4px solid \${OUT}; background: rgba(26,28,44,0.4); }
.sB .cell { display: flex; align-items: center; justify-content: center; background: rgba(255,241,201,0.12); height: 78px; overflow: hidden; }
.sB .tray.sw .cell { height: 58px; }
.sB .cell.sel { background: \${CREAM}; outline: 4px solid \${GOLD}; }
.sB .cell.tk { opacity: 0.3; background: repeating-linear-gradient(45deg, rgba(26,28,44,0.6) 0 6px, transparent 6px 12px); }
.sB .brow { display: flex; gap: 12px; }
.sB .btn { height: 96px; display: flex; align-items: center; justify-content: center; font-size: 36px; flex: 1; }
.sB .btn.sm { flex: none; width: 124px; font-size: 18px; text-shadow: 2px 2px 0 \${OUT}; }
.sB .btn.low { height: 60px; flex: none; font-size: 20px; text-shadow: 2px 2px 0 \${OUT}; }
.sB .pp.rdy { --w: #2f9e5a; --hi: #5fd08a; --lo: #1d6f3d; color: \${CREAM}; text-shadow: 4px 4px 0 \${OUT}; }
.sB .who { padding: 12px; text-align: center; font-size: 34px; }
.sB .spacer { flex: 1; }
\`;


  // ---- TV ----
  // Title screen (Nov 11, Lakota: "lets do the title screen pls lets make a good one"). Behind it the game draws the
  // real course with a slow film camera (src/title.js): it opens on the dragon with its mouth wide open, the jaw SNAPS
  // shut at o.snap (3.0 s) and on that beat the name sign crashes down on its ropes; the MINI plank is knocked on, the
  // flag goes up, the eight balls drop in along the bottom in their outfits. After 6.6 seconds (SETTINGS.startHide), at
  // the moment START shows on the host's phone, the PRESS START sign is let down on its two ropes from behind the name
  // sign, swings and comes to rest (round 6, Lakota: "Make it swing down from the ropes not ropes hanging nothing").
  // Before that nothing hangs under the name: no empty ropes. The words are SETUP_WORDS.name: the first word on the
  // red plank, the rest on the big sign, its O drawn as a golf ball.
  K.css += \`
.sB .tlg { position: absolute; display: flex; align-items: center; justify-content: center; gap: 4px; color: \${GOLD}; white-space: nowrap;
  text-shadow: 4px 4px 0 #d9a520, 8px 8px 0 \${WOOD_LO}, 12px 12px 0 \${WOOD_LO}, 16px 16px 0 \${OUT}, 20px 20px 0 \${OUT}, -4px 0 0 \${OUT}, 0 -4px 0 \${OUT}, 4px -4px 0 \${OUT}, -4px 4px 0 \${OUT}; }
.sB .tlg .bo { position: relative; display: flex; filter: drop-shadow(16px 16px 0 \${OUT}); }
.sB .mini { color: \${CREAM}; text-shadow: 4px 4px 0 #8a2430, 8px 8px 0 \${OUT}; }
.sB .tflag { position: absolute; }
.sB .tflag .pole { position: absolute; left: 0; bottom: 0; width: 16px; background: \${CREAM}; border: 4px solid \${OUT}; box-shadow: inset -4px 0 0 #c9b78f; }
\`;
  const FLAG_ROWS = ["##########......", "#############...", "################", "#############...", "##########......"];
  const FLAG_ROWS2 = ["##########......", "############....", "###############.", "################", "##########......"];
  // the name of the game: a big wooden sign (the last words, the O a golf ball), the first word on a red plank nailed
  // across its top left corner, and a flag on a pole at its top right
  const logo = (x, y, w, h) => {
    const words = W.name.split(" "), top = words.length > 1 ? words[0] : "", main = words.length > 1 ? words.slice(1).join(" ") : words[0];
    const s = fit(main, w - 260, 308), oAt = main.indexOf("O");
    const R = Math.max(8, Math.round(s * 0.066)), ball = \`<span class="bo" style="margin:0 -\${Math.round(s * 0.02)}px 0 \${Math.round(s * 0.04)}px;top:\${Math.round(s * 0.01)}px">\${plain(R, 4, "#f4f4f0")}</span>\`;
    const word = oAt < 0 ? esc(main) : \`<span>\${esc(main.slice(0, oAt))}</span>\${ball}<span>\${esc(main.slice(oAt + 1))}</span>\`;
    const ms = top ? fit(top, 300, 104) : 0;
    return pl(x, y, w, h, "", \`<div style="position:absolute;inset:16px;border:8px solid \${GOLD}"></div>\`) +
      \`<div class="tlg" style="left:\${x}px;top:\${y - Math.round(s * 0.04)}px;width:\${w}px;height:\${h}px;font-size:\${s}px">\${word}</div>\` +
      \`<div class="abs tflag" id="tfl" style="left:\${x + w - 170}px;top:\${y - 132}px;width:160px;height:136px"><div class="pole" style="height:136px"></div>\` +
        \`<div class="abs ol" id="tfa" style="left:16px;top:4px">\${pix(FLAG_ROWS, 8, { "#": GOLD })}</div><div class="abs ol" id="tfb" style="left:16px;top:4px">\${pix(FLAG_ROWS2, 8, { "#": GOLD })}</div></div>\` +
      (top ? pl(x - 44, y - 86, 400, 136, "red", \`<div class="mini" style="font-size:\${ms}px;margin-top:-8px">\${esc(top)}</div>\`, "transform:rotate(-4deg)", "tmini") : "");
  };

  K.tv.title = (o = {}) => {
    const T = o.snap != null ? o.snap : 3.0; // the beat the name sign lands on (the dragon's jaw snapping shut, src/title.js)
    let balls = "", shadows = "";
    // the eight balls stand in two groups in the bottom corners, so the middle is the course's
    PLAYERS.forEach((p, k) => { const x = k < 4 ? 130 + 150 * k : 1340 + 150 * (k - 4); shadows += \`<div class="gshadow" style="left:\${x - 56}px;top:1040px;width:112px"></div>\`; balls += stand(x, 1052, 20, 3, p.c, LOOKS[p.n], "tball"); });
    return {
      seq: "title", frame: () => 0,
      // the START sign and its ropes come before the name sign, so they are behind it until they are let down
      html: grp("sg", rope(800, 440, 568) + rope(1104, 440, 568) + pl(680, 560, 560, 108, "gold", \`<div class="px" style="font-size:44px">\${W.pressStart}</div>\`, "", "ps"), 960, 500) +
        grp("lg", rope(620, -900, 170) + rope(1300, -900, 170) + logo(460, 170, 1000, 290)) + grp("tb", shadows + balls),
      tracks: [
        ["#lg", "drop", T, { from: -900, dur: 0.5, b: 36 }],
        ["#lg", "shake", T + 0.3, { dur: 0.35, amp: 12 }],
        ["#tmini", "pop", T + 0.55, { small: 0.5, big: 1.15, dur: 0.3 }],
        ["#tfl", "rise", T + 0.75, { from: 260, dur: 0.5, b: 16 }],
        ["#tfa", "at", 0, { at: [[0, T + 1.3], ...Array.from({ length: 1200 }, (_, i) => [T + 1.6 + i * 0.6, T + 1.9 + i * 0.6])] }],
        ["#tfb", "at", 0, { at: Array.from({ length: 1201 }, (_, i) => [T + 1.3 + i * 0.6, T + 1.6 + i * 0.6]) }],
        [".gshadow", "show", T + 1.0, { stagger: 0.1 }], [".tball", "rise", T + 1.0, { from: 360, dur: 0.45, b: 20, stagger: 0.1 }],
        [".tball", "bob", T + 2.8, { amp: -8, period: 0.5, stagger: 0.25 }],
        ["#sg", "swingDown", SETTINGS.startHide, { from: -190, dur: 0.8, deg: 8, period: 0.9, swing: 2.6 }],
        ["#ps", "pulse", SETTINGS.startHide + 2.8, { period: 0.5, keep: true }],
      ],
      dur: SETTINGS.startHide + 5.6, still: SETTINGS.startHide + 3.1, stills: { before: 5.0, swing: SETTINGS.startHide + 0.5, start: SETTINGS.startHide + 3.1 },
    };
  };

  // Make your ball: every player with their ball as it is right now, their name, and PICKING or READY.
  // Round 5 (Lakota: "show ball changing while we pick ... the standard"): everything a player changes on their
  // phone (outfit, pattern, either colour) shows here at once. Two players may end with the very same ball, as in
  // bowling: JUNEBUG ends with LAKOTA's. When all are ready the first hole sign comes. No fly-in.
  const PICKING = [ // who, the balls they try and when, when they tap DONE
    ["LAKOTA", [[ball("cowboy", "plain", "RED"), 1.2]], 1.9],
    ["PRIYA", [[ball("none", "galaxy", "PURPLE", "GOLD"), 1.4], [ball("wizard", "galaxy", "PURPLE", "GOLD"), 2.0]], 2.7],
    ["KIT", [[ball("tophat", "plain", "PINK"), 2.2], [ball("party", "plain", "PINK"), 2.8], [ball("party", "checker", "PINK", "AQUA"), 3.3]], 3.9],
    ["DESHAWN", [[ball("shades", "plain", "GOLD"), 3.0], [ball("shades", "halves", "GOLD", "BLACK"), 3.9]], 4.5],
    ["MAYA", [[ball("cowboy", "plain", "BLUE"), 3.6], [ball("crown", "plain", "BLUE"), 4.2], [ball("crown", "stripe", "BLUE", "WHITE"), 4.8]], 5.4],
    ["BIG TOM", [[ball("pirate", "plain", "AQUA"), 5.2], [ball("viking", "plain", "AQUA"), 5.6], [ball("viking", "plain", "SILVER"), 6.0]], 6.6],
    ["AUNT ROSIE", [[ball("chef", "plain", "GREEN"), 5.8], [ball("chef", "dots", "GREEN", "WHITE"), 6.6]], 7.3],
    ["JUNEBUG", [[ball("propeller", "plain", "ORANGE"), 6.4], [ball("cowboy", "plain", "ORANGE"), 7.0], [ball("cowboy", "plain", "RED"), 7.6]], 8.2],
  ];
  const PICKED = Object.fromEntries(PICKING.map(([n, tries]) => [n, tries[tries.length - 1][0]])); // each player's finished ball
  // o.draw = one player is drawing their own outfit: everyone else is done, their ball is drawn live (tick)
  function boardScreen(o) {
    const D = o.draw, ALL = D ? D.done : 8.2, SAY = ALL + 0.3, AWAY = SAY + 2.2, HOLE = AWAY + 0.5;
    let h = "", tracks = [];
    const readyAt = [];
    PLAYERS.forEach((p, k) => {
      const cx = 240 + 480 * (k % 4), top = 176 + Math.floor(k / 4) * 412, [, tries, ready0] = PICKING.find((x) => x[0] === p.n);
      const me = D && D.who === p.n, ready = D ? (me ? D.done : -1) : ready0;
      const states = D ? (me ? [] : [[PICKED[p.n], 0]]) : [[ball("none", "plain", "WHITE"), 0], ...tries];
      if (!D) states[0][0].colors = [p.c, p.c];
      readyAt.push(ready);
      h += \`<div class="abs" style="left:\${cx - 134}px;top:\${top}px;width:268px;height:264px">\` + states.map(([b], j) => \`<div class="full" id="b\${k}s\${j}">\${bsvg(18, 4, b)}</div>\`).join("") + (me ? \`<div class="full" id="blive"></div>\` : "") + \`</div>\` +
        namePl(cx - 180, top + 266, 360, 76, p) +
        pl(cx - 110, top + 346, 220, 52, "dull", \`<div class="px" style="font-size:18px">\${me ? W.drawingTag : W.picking}</div>\`, "", \`k\${k}p\`) +
        pl(cx - 110, top + 346, 220, 52, "green", \`<div class="px paint" style="font-size:20px">\${W.ready}</div>\`, "", \`k\${k}r\`);
      states.forEach(([, t], j) => { tracks.push(win(\`#b\${k}s\${j}\`, [t, j + 1 < states.length ? states[j + 1][1] : INF])); if (j) tracks.push([\`#b\${k}s\${j}\`, "pop", t, { big: 1.12, small: 0.9, dur: 0.2 }]); });
      tracks.push(win(\`#k\${k}p\`, [0, ready]), win(\`#k\${k}r\`, [ready, INF]));
      if (ready > 0) tracks.push([\`#k\${k}r\`, "pop", ready, { big: 1.2, dur: 0.2 }]);
    });
    const times = readyAt.slice().sort((a, b) => a - b);
    let count = "";
    for (let n = 0; n <= 8; n++) {
      const a = n ? times[n - 1] : -INF, b = n < 8 ? times[n] : INF;
      if (b <= 0 && n < 8) continue; // a count that is already past when the clip starts
      count += \`<div class="px" id="c\${n}" style="font-size:30px">\${W.count(n, 8)}</div>\`; tracks.push(win(\`#c\${n}\`, [a, b])); if (a > 0) tracks.push([\`#c\${n}\`, "pop", a, { big: 1.15, dur: 0.2 }]);
    }
    const sign = K.tv.banner({ screen: "banner" });
    let last = "";
    return {
      seq: "title", frame: () => 0,
      html: grp("all", \`<div class="shade"></div>\` +
        pl(420, 36, 760, 116, "", \`<div class="paint" style="font-size:76px;margin-top:-8px">\${W.makeBall}</div>\`, "", "t0") +
        pl(420, 36, 760, 116, "gold", \`<div style="font-size:68px;margin-top:-8px">\${esc(W.allReady)}</div>\`, "", "t1") +
        pl(1200, 46, 320, 96, "gold", count) + h +
        pl(330, 1004, 1260, 60, "", \`<div class="px" style="font-size:18px">\${W.hint}</div>\`, "", "hint")) + sign.html,
      tracks: [...tracks, win("#t0", [0, SAY]), win("#t1", [SAY, INF]), ["#t1", "pop", SAY, { big: 1.1, dur: 0.25 }], win("#hint", [0, SAY]),
        ["#all", "upOut", AWAY, { to: -1200, dur: 0.45 }], ["#sign", "rise", HOLE, { from: 520 }]],
      // the ball being drawn: made again whenever the drawing has changed
      tick: D ? (t, root) => {
        const art = padArt(drawAt(t).pad), key = art.rows.join("");
        if (key === last) return;
        last = key;
        root.querySelector("#blive").innerHTML = bsvg(18, 4, { ...D.ball, outfit: drawnOutfit(art) });
      } : null,
      dur: HOLE + 2.6, still: 5.0, stills: D ? { early: 3.0, hat: 7.2, done: ALL + 0.2 } : { start: 0.6, some: 5.0, all: SAY + 1.2 },
    };
  }
  K.tv.board = () => boardScreen({});
  K.tv["board-draw"] = () => boardScreen({ draw: { who: "MAYA", done: DRAW_DONE + 0.14, ball: ball("none", "plain", "BLUE") } });

  // Every outfit in the one list, in the order of the strip, ten to a row, each on a different colour. No themes
  // (round 6). Any number: ten to a row.
  K.tv.outfits = () => {
    const list = OUTFITS.slice(1), R = +Q.get("r") || 9, rows = Math.ceil(list.length / 10), rowH = Math.floor(940 / rows);
    let h = \`<div class="cover"></div>\` + pl(520, 16, 880, 92, "", \`<div class="paint" style="font-size:56px;margin-top:-6px">\${W.sheet}</div>\`) + pl(1420, 26, 300, 72, "gold", \`<div class="px" style="font-size:40px">\${dg(String(list.length))}</div>\`);
    list.forEach((o, k) => { const r = Math.floor(k / 10); h += stand(60 + 180 * (k % 10) + 90, 124 + r * rowH + rowH - 8, R, 4, BALL_COLORS[(k * 5 + r * 3) % 12][1], o.id); });
    return { seq: "title", frame: () => 0, html: h, tracks: [], dur: 1, still: 0 };
  };

  // The paper for MAKE YOUR OWN in three sizes of square, with the same drawing on each, and under each paper
  // the ball as it then looks on the TV board and on the course. For the question on the page.
  K.tv["draw-sizes"] = () => {
    let h = \`<div class="cover"></div>\` + pl(520, 16, 880, 92, "", \`<div class="paint" style="font-size:56px;margin-top:-6px">\${W.paper}</div>\`);
    const b = ball("none", "plain", "BLUE"), cols = Object.fromEntries(DRAW.colors.map(([k, hex]) => [k, hex]));
    [6, 8, 10].forEach((R, i) => {
      const pad = drawAt(DRAW_DONE, R).pad, sq = Math.floor(600 / pad.h), w = pad.w * sq, hh = pad.h * sq, cx = 320 + 640 * i, top = 128 + Math.round((600 - hh) / 2), worn = { ...b, outfit: drawnOutfit(padArt(pad)) };
      h += \`<div class="abs" style="left:\${cx - w / 2 - 4}px;top:\${top - 4}px;width:\${w}px;height:\${hh}px;box-sizing:content-box;border:4px solid #1a1c2c;background:repeating-conic-gradient(#1e8562 0 25%, #27a074 0 50%) 0 0/\${sq * 2}px \${sq * 2}px">\` +
        \`<div class="abs" style="left:0;top:0">\${pix(ballGrid(R, "none", "plain").rows, sq, ballColors(b.colors[0], "none"))}</div><div class="abs" style="left:0;top:0">\${pix(padRows(pad), sq, cols)}</div></div>\` +
        pl(cx - 170, 740, 340, 64, R === DRAW.R ? "gold" : "", \`<div class="px" style="font-size:30px">\${dg(\`\${pad.w} X \${pad.h}\`)}</div>\`) +
        \`<div class="abs" style="left:\${cx - 190}px;top:\${820}px">\${bsvg(14, 4, worn)}</div><div class="abs" style="left:\${cx + 100}px;top:\${900}px">\${bsvg(4, 4, worn)}</div>\`;
    });
    return { seq: "title", frame: () => 0, html: h, tracks: [], dur: 1, still: 0 };
  };

  // Every pattern (the same twelve as bowling's), big on two pairs of colours, and at the size it has on the course.
  K.tv.patterns = () => {
    let h = \`<div class="cover"></div>\` + pl(520, 16, 880, 92, "", \`<div class="paint" style="font-size:56px;margin-top:-6px">\${W.patterns}</div>\`);
    BALL_PATTERNS.forEach(([id, name], k) => {
      const cx = 240 + 480 * (k % 4), top = 128 + Math.floor(k / 4) * 312, A = BALL_COLORS[k % 12], B = BALL_COLORS[(k + 8) % 12], C = BALL_COLORS[(k + 4) % 12], D = BALL_COLORS[(k + 9) % 12];
      const one = { outfit: "none", pattern: id, colors: [A[1], B[1]] }, two = { outfit: "none", pattern: id, colors: [C[1], D[1]] };
      h += \`<div class="abs" style="left:\${cx - 196}px;top:\${top + 40}px">\${bare(18, 4, one)}</div><div class="abs" style="left:\${cx - 36}px;top:\${top + 40}px">\${bare(18, 4, two)}</div>\` +
        \`<div class="abs" style="left:\${cx + 136}px;top:\${top + 60}px">\${bare(4, 4, one)}</div><div class="abs" style="left:\${cx + 136}px;top:\${top + 120}px">\${bare(4, 4, two)}</div>\` +
        pl(cx - 170, top + 208, 340, 58, "", \`<div class="px paint" style="font-size:22px">\${name}</div>\`);
    });
    return { seq: "title", frame: () => 0, html: h, tracks: [], dur: 1, still: 0 };
  };

  // The dressed balls on the course, at the size the game draws them, and the same spot close up.
  // course-patterns: the same picture with the finished balls of the board (patterns and second colours too).
  const courseScreen = (styled) => () => {
    const q = seqOf("dressed"), Z = 5, zx = 172, zy = 140, zw = 152, zh = 84;
    return {
      seq: "dressed", frame: () => 0,
      paint: (g) => {
        for (const b of q.balls || []) {
          const p = PLAYERS[b.id], f = PICKED[p.n];
          if (styled) drawBall(g, b.at[0], b.at[1], Math.round(b.at[2]), f.colors[0], f.outfit, f.pattern, f.colors[1]);
          else drawBall(g, b.at[0], b.at[1], Math.round(b.at[2]), p.c, LOOKS[p.n]);
        }
        const z = document.getElementById("zc");
        if (z) z.getContext("2d").drawImage(g.canvas, zx, zy, zw, zh, 0, 0, zw, zh);
      },
      html: pl(48, 96, 360, 76, "", \`<div class="px paint" style="font-size:26px">\${W.closeUp}</div>\`) +
        \`<canvas id="zc" class="zoom" width="\${zw}" height="\${zh}" style="left:48px;top:180px;width:\${zw * Z + 16}px;height:\${zh * Z + 16}px"></canvas>\`,
      tracks: [], dur: 1, still: 0,
    };
  };
  K.tv.course = courseScreen(false);
  K.tv["course-patterns"] = courseScreen(true);

  // The score card with each player's own ball in front of their name.
  K.tv["card-balls"] = () => {
    const rows = ranked(table(2)).map((r) => ({ r, rank1: r.rank, total1: r.total, lead: r.lead }));
    const chip = (r) => \`<span class="cb">\${ballSvg(5, 4, r.c, LOOKS[r.n])}</span>\`;
    return { seq: "card", frame: () => 0, html: board("bd", 420, 118, 1080, 840, card(rows, { title: TV_WORDS.afterHole(2), chip })), tracks: [], dur: 1, still: 0 };
  };

  // ---- phone ----
  // Title screen on the phones: the name and the balls, no other words. The host also gets START.
  // Nov 11 (Lakota: "the phone still shows the old logo"): the phones show the TV's name sign, the same pieces
  // (logo(): the MINI plank, the sign with the golf-ball O, the flag), drawn at TV size and scaled to the phone.
  const LOGO_W = 1080, LOGO_H = 446;
  const phoneLogo = (w) => {
    const k = w / LOGO_W;
    return \`<div class="plogo" style="position:relative;flex:none;width:\${w}px;height:\${Math.round(LOGO_H * k)}px"><div style="position:absolute;left:0;top:0;width:\${LOGO_W}px;height:\${LOGO_H}px;transform:scale(\${k});transform-origin:0 0">\${logo(56, 150, 1000, 290)}</div></div>\`;
  };
  const phoneTitle = (host) => () => {
    let balls = "";
    PLAYERS.forEach((p, k) => { balls += stand(46 + 90 * (k % 4) + (k > 3 ? 0 : 6), 150 + Math.floor(k / 4) * 150, 8, 4, p.c, LOOKS[p.n]); });
    return {
      // the host's START stays away for the first 6.6 seconds (Lakota: "hide it for host to dramatic effect"), then pops in.
      // Its room is kept, so nothing on the screen moves when it comes.
      html: \`\${phoneLogo(358)}<div class="tballs">\${balls}</div>\` + (host ? \`<div class="pp gold btn px" id="st" style="flex:none;height:112px;font-size:48px">\${W.start}</div>\` : ""),
      tracks: host ? [["#st", "show", SETTINGS.startHide], ["#st", "pop", SETTINGS.startHide, { big: 1.1, small: 0.8, dur: 0.22 }], ["#st", "press", SETTINGS.startHide + 2.6, { dur: 0.14 }]] : [],
      dur: host ? SETTINGS.startHide + 3.4 : 1, still: host ? SETTINGS.startHide + 1.2 : 0, stills: host ? { hidden: 3.0, shown: SETTINGS.startHide + 1.2 } : null,
    };
  };
  K.phone.title = phoneTitle(true);
  K.phone["title-guest"] = phoneTitle(false);

  // The waiting list with each player's own ball in front of their name.
  K.phone["wait-balls"] = () => {
    const A = PHONE.putting, ns = nameSize();
    const row = (r) => \`<div class="pr wb\${r.n === PHONE.you.n ? " you" : ""}"><span class="cbp">\${ballSvg(5, 2, r.c, LOOKS[r.n])}</span><span class="n" style="font-size:\${ns - 2}px">\${esc(r.n)}</span>\` +
      \`<span class="hr">\${here(r.here, r.sunk, "", PHONE.par)}</span><span class="t">\${r.total}</span></div>\`;
    return {
      html: head() + \`<div class="pp col now" style="--pc:\${A.c}">\${esc(PHONE_WORDS.putting(A.n))}</div><div class="info"><span class="d">\${dg(PHONE_WORDS.before(2))}</span></div>\` +
        \`<div class="ppr"><div class="pr h"><span></span><span></span><span>\${PHONE_WORDS.thisHole}</span><span>\${PHONE_WORDS.all}</span></div>\` + PHONE.rows.map(row).join("") + \`</div>\`,
      tracks: [], dur: 1, still: 0,
    };
  };

  // pieces pick.js builds with
  K.h.setup = { LOOKS, colorOf, plain, stand, win, logo, phoneLogo, ball, bsvg, bare, drawAt, DRAW_STEPS, DRAW_DONE, DRAW_DUR, DRAWN, PICKED, Q, INF };
})();
`;var He=`// The phone's ball picker and the drawing pad, in the wooden-sign look.
// Built from the pieces in kit.js and setup.js. Every word is in settings.js (SETUP_WORDS).
// (Round 6: mini golf has no join screen. Players join in FoxBox; mini golf starts at its title.)
//
// THE BALL PICKER follows bowling's ball picker (fox-bowling-look CONTRACT.md 7.1 and 8.2, layout C "wheels"):
// one page, a big ball at the top, a strip for each thing you can pick with the one in the middle big,
// SURPRISE ME and one big DONE. Any two of the twelve colours. Nothing is ever "taken": two players may make the
// very same ball. Everyone must make one. DONE is ready.
// Mini golf adds one strip on top of bowling's three: the OUTFIT. Round 6 (Lakota's words in quotes):
//   - "don't do outfit theme ... just one long strip": every outfit is in the one strip, which runs off both
//     edges of the screen. No themes, no theme buttons, no page of all outfits.
//   - "center outfit title under ball": the outfit's name is centred under the big ball, in the number letters
//     (Press Start 2P). The soft letters must not be used small here: at 17 px with a shadow their C closes up
//     and reads as an O ("CLASSIC" read as "OLASSIO").
//   - "Yes call it pattern": what is painted on the ball is the PATTERN, the same twelve as bowling.
//   - "a make your own button always near the ball ... no outfit in the strip unless you have made one":
//     MAKE YOUR OWN is always beside the ball. Your drawing joins the strip, right after NO OUTFIT, once you
//     have made one, and stays until the party ends.
//
// THE DRAWING PAD follows Sky Scramble's (foxbox dev/party/draw.js): the same buttons in the same places, the
// same fourteen colours. The rules of the drawing itself are in draw.js.
"use strict";
(function () {
  const K = window.KIT_B, { OUT, WOOD, CREAM, GOLD, PAPER, LINE, PEN, pl, rope, grp, bunting, fit, namePl, ballSvg } = K.h;
  const { colorOf, win, ball, bsvg, bare, drawAt, DRAW_STEPS, DRAW_DONE, DRAW_DUR, DRAWN, Q, INF } = K.h.setup;
  const W = SETUP_WORDS;

  K.css += \`
/* the ball picker */
#ph.pk { gap: 8px; }
.sB .pg { flex: 1; display: flex; flex-direction: column; gap: 8px; min-height: 0; }
.sB .pv2 { position: relative; flex: 1; min-height: 208px; }
/* Round 7 (Lakota: "why is there grey lines on the button make it normal pls"): a plain gold button, no wood
   grain. The grain of .pp is dark brown bars; on gold, behind small letters and the pencil, they read as grey
   scratches. Same as .birdb in kit.js, which drops the grain for the same reason. */
.sB .ownb { position: absolute; right: 0; bottom: 6px; width: 92px; display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 10px 4px 8px; font-size: 10px; line-height: 1.5; text-align: center; background: var(--w, \${WOOD}); }
.sB .onm { height: 20px; line-height: 20px; text-align: center; white-space: nowrap; color: \${GOLD}; text-shadow: 2px 2px 0 \${OUT}; }
.sB .wg { display: flex; flex-direction: column; gap: 4px; }
.sB .wl { display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; padding: 0 4px; text-shadow: 2px 2px 0 \${OUT}; white-space: nowrap; }
.sB .wl .nm { color: \${GOLD}; font-size: 13px; }
.sB .wh { display: flex; align-items: center; justify-content: center; gap: 6px; }
.sB .wh.long { margin: 0 -16px; overflow: hidden; }
.sB .wh.long .wc { width: 54px; }
.sB .wh.long .wc.mid { width: 78px; }
.sB .wc { position: relative; flex: none; width: 58px; height: var(--sh, 46px); display: flex; align-items: center; justify-content: center; overflow: hidden; background: rgba(26,28,44,0.45); border: 2px solid \${OUT}; }
.sB .wc.far { opacity: 0.6; }
.sB .wc.mid { width: 78px; height: var(--mh, 64px); background: \${CREAM}; border: 4px solid \${GOLD}; box-shadow: 0 0 0 2px \${OUT}; }
.sB .wh.col .wc { background: var(--c); }
.sB .wh.col .wc.far { opacity: 1; width: 44px; height: 34px; }
.sB .pen { position: absolute; right: 2px; bottom: 2px; }
.sB .btn.sp { flex: none; width: 124px; font-size: 11px; line-height: 1.5; text-align: center; text-shadow: 2px 2px 0 \${OUT}; }
.sB .brow .btn { height: 84px; }
/* one new outfit to judge (round 6) */
.sB .crow { display: flex; justify-content: space-around; align-items: flex-end; }
.sB .ccourse { display: flex; align-items: center; justify-content: center; gap: 14px; height: 96px; font-size: 10px; line-height: 1.5; background: repeating-conic-gradient(#1e8562 0 25%, #27a074 0 50%) 0 0/48px 48px; text-shadow: 2px 2px 0 \${OUT}; }
/* the drawing pad */
.sB .drow { display: flex; align-items: stretch; gap: 8px; }
.sB .dbt { display: flex; align-items: center; justify-content: center; padding: 0 9px; height: 46px; font-size: 10px; background: var(--w, \${WOOD}); text-shadow: 2px 2px 0 \${OUT}; }
.sB .dtt { flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 11px; line-height: 1.5; text-shadow: 2px 2px 0 \${OUT}; }
.sB .dboard { position: relative; align-self: center; flex: none; border: 4px solid \${OUT}; background: repeating-conic-gradient(#1e8562 0 25%, #27a074 0 50%) 0 0/22px 22px; touch-action: none; box-sizing: content-box; }
.sB .dboard > * { position: absolute; left: 0; top: 0; }
.sB .dfg { width: 22px; height: 22px; margin: -11px 0 0 -11px; border: 4px solid \${CREAM}; box-shadow: 0 0 0 2px \${OUT}; }
.sB .dtool { flex: 1; height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; font-size: 9px; background: var(--w, \${WOOD}); text-shadow: 2px 2px 0 \${OUT}; }
.sB .dsz { width: 44px; height: 64px; display: flex; align-items: center; justify-content: center; background: var(--w, \${WOOD}); }
.sB .dsz i { background: \${CREAM}; box-shadow: 0 0 0 2px \${OUT}; }
.sB .dtool.sel, .sB .dsz.sel { --w: \${GOLD}; --hi: #fff0a0; --lo: #d9a520; color: \${OUT}; text-shadow: none; }
.sB .dpal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.sB .dsw { height: 54px; border: 4px solid \${OUT}; background: var(--c); }
.sB .dsw.sel { outline: 4px solid \${CREAM}; outline-offset: -8px; box-shadow: 0 0 0 3px \${GOLD}; }
.sB .dprev { flex: none; width: 176px; height: 84px; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 9px; line-height: 1.5; background: repeating-conic-gradient(#1e8562 0 25%, #27a074 0 50%) 0 0/48px 48px; text-shadow: 2px 2px 0 \${OUT}; }
.sB .dask { position: absolute; inset: 0; background: rgba(26,28,44,0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; z-index: 5; }
.sB .dask .q { padding: 18px 20px; font-size: 30px; text-shadow: 2px 2px 0 \${OUT}; }
.sB .dask .brow { width: 300px; }
\`;

  const PENCIL = pix(["......##", ".....#gg", "....#gg#", "...#gg#.", "..#gg#..", ".#cg#...", "#cc#....", "###....."], 2, { "#": OUT, g: GOLD, c: CREAM });

  // ---- phone: MAKE YOUR BALL ----
  // The outfit strip is one long strip: NO OUTFIT, then the player's own drawing if they have made one, then every
  // outfit in the list. It goes round: after the last comes NO OUTFIT again. The list may be any length.
  const outfitList = (own) => [OUTFITS[0], ...(own ? [own] : []), ...OUTFITS.slice(1)];
  const around = (list, i, n) => Array.from({ length: n }, (_, j) => list[(((i + j - (n >> 1)) % list.length) + list.length) % list.length]);
  const strip = (cls, cells, vars) => \`<div class="wh \${cls}" style="\${vars || ""}">\${cells.map((c, j) => \`<div class="wc\${j === cells.length >> 1 ? " mid" : j === 0 || j === cells.length - 1 ? " far" : ""}"\${c[1] ? \` style="--c:\${c[1]}"\` : ""}>\${c[0]}</div>\`).join("")}</div>\`;
  const label = (word, name) => \`<div class="wl px"><span>\${word}</span><span class="nm">\${esc(name || "")}</span></div>\`;
  // One whole picker page for one moment: st = { o: outfit id ("drawn" = your own), s: pattern, m: main colour, c: second colour }.
  // art = the player's own drawing as an outfit, if they have made one.
  function pickPage(me, st, art) {
    const own = art && art !== "none" ? art : null, list = outfitList(own), oi = Math.max(0, list.findIndex((o) => o.id === st.o)), cur = list[oi];
    const wear = (o) => (o.art ? o : o.id), main = colorOf(st.m), second = colorOf(st.c);
    const b = { outfit: wear(cur), pattern: st.s, colors: [main, second] };
    const ocell = (o, R) => [ballSvg(R, 2, main, wear(o)) + (o.art ? \`<span class="pen">\${PENCIL}</span>\` : "")];
    const si = BALL_PATTERNS.findIndex((s) => s[0] === st.s), mi = BALL_COLORS.findIndex((c) => c[0] === st.m), ci = BALL_COLORS.findIndex((c) => c[0] === st.c);
    return \`<div class="pp shead px"><span class="pp col ch" style="--pc:\${me.c}">\${esc(me.n)}</span><span>\${W.yourBall}</span></div>\` +
      \`<div class="pv2"><div class="full pvb">\${bsvg(16, 4, b)}</div><div class="pp gold ownb px">\${PENCIL}<span>\${W.makeOwn.join("<br>")}</span></div></div>\` +
      \`<div class="px onm" style="font-size:\${Math.min(16, Math.floor(340 / cur.name.length))}px">\${esc(cur.name)}</div>\` +
      \`<div class="wg">\${label(W.wOutfit)}\` + strip("w-o long", around(list, oi, 7).map((o, j) => ocell(o, j === 3 ? 8 : 5)), "--mh:74px;--sh:50px") + \`</div>\` +
      \`<div class="wg">\${label(W.wPattern, BALL_PATTERNS[si][1])}\` + strip("w-s", around(BALL_PATTERNS, si, 5).map((s, j) => [bare(j === 2 ? 12 : 8, 2, { pattern: s[0], colors: [main, second] })]), "--mh:66px;--sh:46px") + \`</div>\` +
      \`<div class="wg">\${label(W.wMain, st.m)}\` + strip("w-m col", around(BALL_COLORS, mi, 5).map((c) => ["", c[1]]), "--mh:48px;--sh:36px") + \`</div>\` +
      \`<div class="wg">\${label(W.wSecond, st.c)}\` + strip("w-c col", around(BALL_COLORS, ci, 5).map((c) => ["", c[1]]), "--mh:48px;--sh:36px") + \`</div>\` +
      \`<div class="brow"><div class="pp btn sp px">\${W.surprise.replace(" ", "<br>")}</div><div class="pp gold btn px dn">\${W.done}</div></div>\`;
  }
  // after DONE: your ball, your name, READY, and CHANGE to go back. Then the wait for the others.
  const readyPage = (me, b) => \`<div class="pp shead px"><span>\${W.yourBall}</span></div><div class="prev"><div class="full">\${bsvg(20, 4, b)}</div></div>\` +
    \`<div class="pp col who" style="--pc:\${me.c}">\${esc(me.n)}</div>\` +
    \`<div class="pp rdy btn px" style="flex:none;height:96px;font-size:40px">\${W.readyOn}</div>\` +
    \`<div class="pp btn low px">\${W.change}</div>\` +
    \`<div class="px blab" style="margin-top:6px;font-size:15px;white-space:nowrap"><span id="w1">\${W.waiting(3)}</span><span id="w2">\${esc(W.allReady)}</span></div>\`;

  // You are MAYA. SURPRISE ME twice, then she picks for herself: five steps along the long outfit strip, a
  // pattern, her two colours, DONE.
  K.phone.pick = () => {
    const me = PHONE.you;
    const steps = [ // when, what changes, what was tapped
      [0, { o: "none", s: "plain", m: "BLUE", c: "WHITE" }],
      [1.0, { o: "wizard", s: "checker", m: "LIME", c: "RED" }, ".sp"],
      [2.0, { o: "viking", s: "dots", m: "GOLD", c: "BLACK" }, ".sp"],
      [3.2, { o: "chef" }, ".w-o .wc:nth-child(3)"], [3.5, { o: "party" }, ".w-o .wc:nth-child(3)"], [3.8, { o: "wizard" }, ".w-o .wc:nth-child(3)"],
      [4.1, { o: "pirate" }, ".w-o .wc:nth-child(3)"], [4.4, { o: "crown" }, ".w-o .wc:nth-child(3)"],
      [5.5, { s: "halves" }, ".w-s .wc:nth-child(2)"], [6.0, { s: "stripe" }, ".w-s .wc:nth-child(2)"],
      [6.9, { m: "BLUE" }, ".w-m .wc:nth-child(2)"],
      [7.7, { c: "WHITE" }, ".w-c .wc:nth-child(2)"],
    ];
    const DONE = 8.7, C = DONE + 0.14, ALL = 11.0;
    let st = {}, h = "";
    const tracks = [];
    steps.forEach(([t, ch, tap], j) => {
      st = { ...st, ...ch };
      h += \`<div class="pg" id="ps\${j}">\${pickPage(me, st)}</div>\`;
      tracks.push(win(\`#ps\${j}\`, [j ? t : -INF, j + 1 < steps.length ? steps[j + 1][0] : C]));
      if (j) tracks.push([\`#ps\${j - 1} \${tap}\`, "press", t - 0.14, { dur: 0.14 }], [\`#ps\${j} .pvb\`, "pop", t, { big: 1.06, small: 0.94, dur: 0.18 }]);
    });
    h += \`<div class="pg" id="pgC">\${readyPage(me, { outfit: st.o, pattern: st.s, colors: [colorOf(st.m), colorOf(st.c)] })}</div>\`;
    tracks.push([\`#ps\${steps.length - 1} .dn\`, "press", DONE, { dur: 0.14 }], win("#pgC", [C, INF]), win("#w1", [C, ALL]), win("#w2", [ALL, INF]), ["#w2", "pop", ALL, { big: 1.1, dur: 0.2 }]);
    return { cls: "pk", html: h, tracks, dur: 12.6, still: 0.5, stills: { start: 0.5, surprise: 2.6, strip: 3.95, made: 8.3, waiting: 9.8, all: 11.8 } };
  };
  // DRAW AN OUTFIT is always beside the ball. Before the player has drawn anything their strip has no drawing in
  // it. With drawn=1 they have made one: it sits in the strip right after NO OUTFIT, and here they are wearing it.
  // ?o=<outfit id>: the strip stopped on that outfit, for showing one outfit where a player really meets it.
  K.phone["pick-own"] = () => {
    const made = Q.get("drawn"), o = Q.get("o") || (made ? "drawn" : "none");
    return { cls: "pk", html: \`<div class="pg">\${pickPage(PHONE.you, { o, s: "plain", m: "BLUE", c: "WHITE" }, made ? DRAWN : null)}</div>\`, tracks: [], dur: 1, still: 0 };
  };

  // One new outfit to judge (round 6: four fresh ones for the last open place; outfits/candidates.js). ?id=<id>.
  // Big on one colour, smaller on two more, and at the size it has on the course on three more.
  K.phone.cand = () => {
    const list = typeof OUTFITS_CANDIDATES !== "undefined" ? OUTFITS_CANDIDATES : [], o = list.find((x) => x.id === Q.get("id")) || list[0];
    const on = (c) => ({ outfit: o, pattern: "plain", colors: [colorOf(c), colorOf("WHITE")] });
    return {
      cls: "pk", html: \`<div class="pp shead px" style="justify-content:center;font-size:18px"><span>\${esc(o.name)}</span></div>\` +
        \`<div class="pv2"><div class="full">\${bsvg(24, 4, on("BLUE"))}</div></div>\` +
        \`<div class="crow">\${bsvg(10, 4, on("GOLD"))}\${bsvg(10, 4, on("WHITE"))}</div>\` +
        \`<div class="pp ccourse px">\${bsvg(4, 4, on("RED"))}\${bsvg(4, 4, on("BLACK"))}\${bsvg(4, 4, on("LIME"))}<span>\${W.onCourse.join("<br>")}</span></div>\`,
      tracks: [], dur: 1, still: 0,
    };
  };

  // ---- phone: MAKE YOUR OWN (the drawing pad) ----
  // Sky Scramble's drawing screen, fitted to a golf ball. Top: BACK, the title, UNDO, CLEAR. The paper is a grid of
  // squares the shape of the ball's box, with the player's own ball on it: draw over it and above it. Under the
  // paper: PEN, FILL, ERASER and three sizes; Sky Scramble's fourteen colours; the ball as it looks on the course;
  // DONE. The TV shows the ball changing after every stroke (TV board-draw plays the same strokes).
  const SQ = 11; // one square of the paper on the phone
  const TOOLS = [["pen", W.pen, ["....##", "...###", "..###.", ".###..", "###...", "##...."]], ["fill", W.fill, ["..##..", ".#..#.", "######", "######", ".####.", "..##.."]], ["eraser", W.eraser, ["..####", ".#####", "######", "#####.", "####..", "......"]]];
  const artColors = Object.fromEntries(DRAW.colors.map(([k, hex]) => [k, hex]));
  function drawHtml(me, b) {
    const p = padNew();
    return \`<div class="drow"><div class="pp dbt px" id="dbk">\${W.back}</div><div class="px dtt">\${W.drawTitle.join("<br>")}</div><div class="pp dbt px" id="dun">\${W.undo}</div><div class="pp dbt px" id="dcl">\${W.clear}</div></div>\` +
      \`<div class="dboard" id="dbd" style="width:\${p.w * SQ}px;height:\${p.h * SQ}px"><div>\${pix(ballGrid(p.R, "none", b.pattern).rows, SQ, ballColors(b.colors[0], "none", b.colors[1]))}</div><div id="dart"></div><div class="dfg" id="dfg"></div></div>\` +
      \`<div class="drow">\${TOOLS.map(([id, word, rows]) => \`<div class="pp dtool px" id="dt-\${id}">\${pix(rows, 3, { "#": CREAM })}<span>\${word}</span></div>\`).join("")}\` +
      DRAW.sizes.map((n, k) => \`<div class="pp dsz" id="ds\${k}"><i style="width:\${n * 8}px;height:\${n * 8}px"></i></div>\`).join("") + \`</div>\` +
      \`<div class="dpal">\${DRAW.colors.map(([k, hex]) => \`<div class="dsw" id="dc-\${k}" style="--c:\${hex}"></div>\`).join("")}</div>\` +
      \`<div class="spacer"></div><div class="drow"><div class="pp dprev px"><span id="dpv"></span><span>\${W.onCourse.join("<br>")}</span></div><div class="pp gold btn px" id="ddn" style="height:84px">\${W.done}</div></div>\`;
  }
  // put the paper and the buttons as they are for this drawing
  function drawShow(root, pad, ui, b) {
    const art = padArt(pad), key = art.rows.join("");
    if (root.__art !== key) {
      root.__art = key;
      root.querySelector("#dart").innerHTML = pix(art.rows, SQ, artColors);
      root.querySelector("#dpv").innerHTML = \`\${bsvg(4, 4, { ...b, outfit: drawnOutfit(art) })}\`;
    }
    TOOLS.forEach(([id]) => root.querySelector(\`#dt-\${id}\`).classList.toggle("sel", ui.tool === id));
    DRAW.sizes.forEach((n, k) => root.querySelector(\`#ds\${k}\`).classList.toggle("sel", ui.size === k));
    DRAW.colors.forEach(([k]) => root.querySelector(\`#dc-\${k}\`).classList.toggle("sel", ui.color === k));
  }
  // where the finger is at the moment t of the sample drawing (null = lifted)
  function fingerAt(t) {
    for (const op of DRAW_STEPS) {
      if (op[0] === "line" && t >= op[1] && t <= op[2]) { const way = op[3].slice(1).flatMap((b, k) => padWay(...op[3][k], ...b)); return way[Math.min(way.length - 1, Math.floor(way.length * (t - op[1]) / (op[2] - op[1])))]; }
      if ((op[0] === "dot" || op[0] === "fill") && t >= op[1] && t < op[1] + 0.25) return [op[2], op[3]];
    }
    return null;
  }
  K.phone.draw = () => {
    const me = PHONE.you, b = ball("none", "plain", "BLUE"), live = Q.get("live");
    const after = \`<div class="pg" id="dpg2">\${pickPage(me, { o: "drawn", s: "plain", m: "BLUE", c: "WHITE" }, DRAWN)}</div>\`;
    return {
      cls: "pk", html: \`<div class="pg" id="dpg1">\${drawHtml(me, b)}</div>\` + (live ? "" : after),
      tracks: live ? [] : [win("#dpg1", [-INF, DRAW_DONE + 0.14]), win("#dpg2", [DRAW_DONE + 0.14, INF]), ["#ddn", "press", DRAW_DONE, { dur: 0.14 }], ["#dpg2 .pvb", "pop", DRAW_DONE + 0.14, { big: 1.06, small: 0.94, dur: 0.18 }]],
      tick: live ? null : (t, root) => {
        const { pad, ui } = drawAt(Math.min(t, DRAW_DONE));
        drawShow(root, pad, ui, b);
        const f = fingerAt(t), fg = root.querySelector("#dfg");
        fg.style.display = f ? "" : "none";
        if (f) fg.style.transform = \`translate(\${f[0] * SQ + 5}px,\${f[1] * SQ + 5}px)\`;
        root.querySelector("#dun").classList.toggle("down", t >= ui.undo && t < ui.undo + 0.2);
      },
      // live=1: the pad really draws (one finger, as in Sky Scramble). For trying it by hand; the game sends padArt() to the TV after every stroke.
      setup: live ? (root) => {
        const pad = padNew(), ui = { color: "C", tool: "pen", size: 1 }, bd = root.querySelector("#dbd"), show = () => drawShow(root, pad, ui, b);
        root.querySelector("#dfg").style.display = "none";
        let finger = null, last = null;
        const at = (e) => { const r = bd.getBoundingClientRect(); return [Math.floor((e.clientX - r.left - 4) / SQ), Math.floor((e.clientY - r.top - 4) / SQ)]; };
        const ink = () => (ui.tool === "eraser" ? "." : ui.color);
        bd.addEventListener("pointerdown", (e) => {
          if (finger != null) return; // only the first finger draws
          finger = e.pointerId; bd.setPointerCapture(finger); padSnap(pad); last = at(e);
          if (ui.tool === "fill") padFill(pad, last[0], last[1], ink()); else padStamp(pad, last[0], last[1], DRAW.sizes[ui.size], ink());
          show();
        });
        bd.addEventListener("pointermove", (e) => { if (e.pointerId !== finger || ui.tool === "fill") return; const p = at(e); padLine(pad, last[0], last[1], p[0], p[1], DRAW.sizes[ui.size], ink()); last = p; show(); });
        const up = (e) => { if (e.pointerId === finger) finger = null; };
        bd.addEventListener("pointerup", up); bd.addEventListener("pointercancel", up);
        TOOLS.forEach(([id]) => root.querySelector(\`#dt-\${id}\`).addEventListener("click", () => { ui.tool = id; show(); }));
        DRAW.sizes.forEach((n, k) => root.querySelector(\`#ds\${k}\`).addEventListener("click", () => { ui.size = k; show(); }));
        DRAW.colors.forEach(([k]) => root.querySelector(\`#dc-\${k}\`).addEventListener("click", () => { ui.color = k; if (ui.tool === "eraser") ui.tool = "pen"; show(); }));
        root.querySelector("#dun").addEventListener("click", () => { padUndo(pad); show(); });
        root.querySelector("#dcl").addEventListener("click", () => { if (!padBlank(pad)) { padClear(pad); show(); } });
        show();
      } : null,
      dur: DRAW_DUR, still: 9.4, stills: { blank: 0.3, hat: 4.8, slip: 8.4, face: 11.6, back: 13.0 },
    };
  };
  // CLEAR asks first, as in Sky Scramble.
  K.phone["draw-clear"] = () => {
    const me = PHONE.you, b = ball("none", "plain", "BLUE"), d = drawAt(DRAW_DONE);
    return {
      cls: "pk", html: \`<div class="pg">\${drawHtml(me, b)}</div><div class="dask"><div class="pp q">\${esc(W.clearAsk)}</div><div class="brow"><div class="pp gold btn px" style="font-size:26px">\${W.yes}</div><div class="pp btn px" style="font-size:26px;text-shadow:2px 2px 0 \${OUT}">\${W.no}</div></div></div>\`,
      tracks: [], setup: (root) => { drawShow(root, d.pad, d.ui, b); root.querySelector("#dfg").style.display = "none"; }, dur: 1, still: 0,
    };
  };
})();
`;var Ge=[Ie,Ce,ke,Le,Ne,Ue,Me,We],ze="OUTFITS, BALL_COLORS, BALL_PATTERNS, BALL_INK, ballGrid, ballColors, outfitOf, patternOf, DRAW, padNew, padRows, padBlank, padSnap, padUndo, padClear, padStamp, padWay, padLine, padFill, padArt, padFrom, drawnOutfit",de=null,ee=null;function he(){if(!de)de=Function(`"use strict";
${Ge.join(`
;
`)}
;return { ${ze} };`)();return de}function ae(){if(ee)return ee;let t=Object.create(globalThis);return ee=Function("window",`"use strict";
${[Se,De,...Ge,Pe,_e,He].join(`
;
`)}
;return { K: window.KIT_B, SETUP_WORDS, SETTINGS, PHONE_WORDS, TV_WORDS, scoreName, shortName, SPR, arrowShaft, pix, esc, dg, ${ze} };`)(t),ee}var u0=(t)=>{let e=parseInt(String(t).slice(1),16);return(0.299*(e>>16&255)+0.587*(e>>8&255)+0.114*(e&255))/255};function g0(t){let e=he(),a=(p)=>e.BALL_COLORS.find((r)=>r[0]===p)[1],o=String(t).toLowerCase(),n=u0(o)>0.62?a("BLACK"):a("WHITE");return n.toLowerCase()===o?n===a("WHITE")?a("BLACK"):a("WHITE"):n}function oe(t){let e=he(),a=e.BALL_COLORS.find((n)=>n[0]===t)||e.BALL_COLORS[0],o=g0(a[1]);return e.BALL_COLORS.find((n)=>n[1]===o)[0]}function je(t,e,a){if(e==="c")return a===t.m?t:{...t,c:a,own:!0};let o=t.own&&t.c!==a;return{...t,m:a,c:o?t.c:oe(a),own:o}}function Fe(t){if(!t)return"none";return t.outfit==="drawn"&&t.art?he().drawnOutfit(t.art):t.outfit||"none"}var fe=(t)=>Math.min(1,Math.max(0,((Number(t)||0)-400)/1400));function Ye(t){let e=t.ownerDocument;if(getComputedStyle(t).position==="static")t.style.position="relative";let a=e.createElement("div"),o=e.createElement("i");a.dataset.test="mg-power-bar",a.style.cssText="position:absolute;left:12%;right:12%;bottom:14px;height:18px;border:4px solid #3a2114;background:rgba(26,28,44,0.35);display:none;pointer-events:none;z-index:2",o.style.cssText="position:absolute;left:0;top:0;bottom:0;width:0;background:#fff;box-shadow:inset 0 -4px 0 rgba(58,33,20,0.25)",a.appendChild(o),t.appendChild(a);let n=!1,p=-1;return{set(r,d){let u=Math.round(Math.min(1,Math.max(0,r))*1000);if(u!==p)p=u,o.style.width=`${u/10}%`;a.style.borderColor=d?"#ffd23f":"#3a2114"},show(r){if(r===n)return;if(n=r,a.style.display=r?"block":"none",!r)this.set(0,!1)},remove(){a.remove()}}}var m0=`
.mg-play { background: repeating-conic-gradient(#17694f 0 25%, #1b7558 0 50%) 0 0/120px 120px; padding: 16px; display: flex; flex-direction: column; gap: 12px; touch-action: none; user-select: none; -webkit-user-select: none; }
.mg-play [hidden] { display: none !important; }
.mg-play svg.pix { display: block; }
.mg-play .abs { position: absolute; }
.mg-play .mat { position: relative; }
.mg-play .mat .bar { position: absolute; left: 20px; right: 20px; top: 20px; height: 0; background: rgba(58,33,20,0.28); pointer-events: none; }
.mg-play .pad.is-down { filter: brightness(0.8); transform: translateY(2px); }
.mg-play .birdb.is-down, .mg-play .okb.is-down, .mg-play .againb.is-down { filter: brightness(0.8); }
.mg-play .pickv { justify-content: flex-end; }
.mg-play .pracb { height: 112px; font-size: 56px; color: #fff6dc; text-shadow: 4px 4px 0 #3a2114; }
.mg-play .puttbig { flex: 1; min-height: 200px; height: auto; font-size: 120px; text-shadow: 4px 4px 0 #fff0a0; }
.mg-play .prach { padding: 14px; text-align: center; font-size: 34px; color: #fff6dc; text-shadow: 3px 3px 0 #3a2114; --w: #2f8f5b; --hi: #4fb47a; --lo: #1f6a42; }
.mg-play .now.gold { --w: #ffd23f; --hi: #fff0a0; --lo: #d9a520; color: #3a2114; }
.mg-play .pop { animation: mgpop 0.16s steps(1, end); }
@keyframes mgpop { 0% { transform: scale(0.97); } 35% { transform: scale(1.04); } 100% { transform: none; } }
`,qe="PRACTICE",Ke="PUTT",w0=(t)=>`${t}${t%10===1&&t%100!==11?"ST":t%10===2&&t%100!==12?"ND":t%10===3&&t%100!==13?"RD":"TH"}`;function Ve(t,{send:e,me:a}){let o=t.ownerDocument,n=o.defaultView,p=ae(),r=p.K,d=r.h,u=p.PHONE_WORDS,{esc:A,dg:$}=p;if(!o.getElementById("mg-kit-css")){let s=o.createElement("style");s.id="mg-kit-css",s.textContent=r.css,o.head.appendChild(s)}if(!o.getElementById("mg-pad-css")){let s=o.createElement("style");s.id="mg-pad-css",s.textContent=m0,o.head.appendChild(s)}t.classList.add("sB","mg-play");let U=(s,l,c)=>s.replace(/^<div /,`<div data-k="${l}" data-native${c?` data-test="${c}"`:""} `),E=(s)=>{let l=s.split(" ");return l.length>1?[l.slice(0,-1).join(" "),l[l.length-1]]:l},T=(s,l,c)=>d.pad(s,c).replace(/^<div /,`<div data-dir="${l}" data-native data-test="mg-${l<0?"left":"right"}" `);t.innerHTML=`<div class="vcol" data-k="turn" hidden><div data-k="thead"></div><div class="info"><span class="px s" data-k="stroke"></span><span class="d" data-k="cup"></span></div><div class="vcol" id="aimv" data-k="aimv">${U(`<div class="pp birdb px" id="bv">${d.EYE}<span>${A(u.birdsEye)}</span></div>`,"bird","mg-bird")}<div class="px aimt">${A(u.aim)}</div><div class="pads">${T("al",-1,!1)}${T("ar",1,!0)}</div>${U(`<div class="pp gold okb px" id="ok">${A(u.ok)}</div>`,"ok","mg-ok")}</div><div class="vcol pickv" data-k="pick" hidden>${U(`<div class="pp okb pracb">${qe}</div>`,"prac","mg-practice")}${U(`<div class="pp gold okb puttbig">${Ke}</div>`,"putt","mg-putt")}</div><div class="pp prach px" data-k="prach" data-test="mg-practice-tag" hidden>${qe}</div>`+d.mat1().replace(/^<div /,'<div data-k="m1" data-test="mg-mat" data-word="AIM YOUR PHONE DOWN" ')+d.mat2().replace(/^<div /,'<div data-k="m2" data-test="mg-mat" data-word="SWING" ')+`<div class="mat" data-k="ask" data-native data-test="mg-mat" data-word="TAP TO START"><div>${d.big(E(u.askMotion),72)}</div></div><div class="mat" data-k="swing" data-test="mg-mat" data-word="PULL BACK"><i class="bar"></i><div data-k="pullw">${d.big(u.touch1,72)}</div></div>${U(`<div class="pp gold okb px" hidden>${Ke}</div>`,"putt2","mg-putt2")}${U(d.again(),"again","mg-again")}</div><div class="vcol" data-k="rest"></div>`;let R=t,h=(s)=>R.querySelector(`[data-k="${s}"]`),w=ge(),g=ve(n),C=me(n,w,()=>({motion:v,steady:m,view:x})),L=ue(n.navigator),M=()=>x&&x.you&&x.you.id!=null?x.you.id:a&&a()?a().id:null,W=-1e9,x=null,v="unknown",m=!1,P=null,y=0,Y=0,H=null,j=!1,q=null,qt=Math.floor(performance.now()).toString(36),St=[],V=(s,l,c,f)=>{s.addEventListener(l,c,f),St.push(()=>s.removeEventListener(l,c,f))},Dt=(s)=>{if(s===v)return;v=s,e({type:"mg-motion",state:s}),i()},ut=(s)=>{if(s===m)return;if(m=s,e({type:"mg-steady",on:s}),s&&x&&x.yourTurn)g.play("pSteady",{vol:0.8}),g.buzz(10);i()};function Tt(s,l,c,f,O,b,z,Z){if(!j){if(j=!0,H)n.clearTimeout(H);Dt("on")}let ft=w.state,G=w.feed(s,l,c,f,O,b,z,Z);if(ft==="ready"&&w.state==="swing"&&x&&x.yourTurn){let Ht=w.debug.rot||0;g.play("pWhoosh",{v:Ht>1100?2:Ht>700?1:0,vol:0.85,gap:250}),W=performance.now()}if(se(s,G),!G)return;if(C.event(G.type==="putt"?`PUTT power ${G.power.toFixed(2)} peak ${G.peak.toFixed(0)} deg/s shake ${G.lin.toFixed(1)}`:G.type==="steady"?`READY ${G.on?"on":"off"}`:G.type),G.type==="steady")ut(G.on);else if(G.type==="cancel")ut(!1);else if(G.type==="putt")if(_==="practice")et(G.power);else It(G.power,"swing")}let Pt=0;function et(s){if(!x||!x.yourTurn||_!=="practice")return;e({type:"mg-practice",id:`${qt}-t${++Pt}`,power:Math.round(Math.max(0,Math.min(1,s))*1000)/1000}),g.buzz(15),w.arm(!0),i()}function It(s,l){if(!x||!x.yourTurn){C.event(`putt not sent: not your turn (${l})`);return}if(_!=="set"){C.event(`putt not sent: PUTT not tapped (${l})`);return}e({type:"mg-putt",id:`${qt}-${++y}`,power:Math.round(s*1000)/1000,via:l}),Y=performance.now(),m=!1,w.arm(!1);let c=Math.max(0,Math.min(1,s)),f=l==="swing"&&performance.now()-W<2000;if(!f)g.play("pWhoosh",{v:c<0.35?0:c<0.7?1:2,vol:0.6+0.4*c,gap:0});if(g.play("pStrike",{vol:0.55+0.45*c,delay:f?0:0.1,gap:0}),g.buzz(30),q)n.clearTimeout(q);q=n.setTimeout(()=>{if(x&&x.yourTurn)C.event("the TV did not take the putt: swing again"),w.arm(!0),i()},1500),i()}let gt=Ye(h("m2")||h("swing")),rt=-1,Ct=!1;function se(s,l){if(gt.show(v==="on"&&(!!(x&&x.yourTurn)||l&&l.type==="putt")),l&&l.type==="steady")gt.set(0,!1),Ct=!1;if(l&&l.type==="putt"){gt.set(l.power,!0);return}let c=w.state==="swing"?w.debug:null;if(c&&c.swing){let f=fe(c.rot),O=fe(c.swing.peak);if(gt.set(O,!1),!Ct||s-rt>=0.05)Ct=!0,rt=s,e({type:"mg-power",now:Math.round(f*1000)/1000,peak:Math.round(O*1000)/1000,..._==="practice"?{practice:!0}:{}})}else if(Ct&&w.state==="ready")Ct=!1,gt.set(0,!1),e({type:"mg-power",now:0,peak:0,..._==="practice"?{practice:!0}:{}})}let Kt=(s)=>{let l=xe(s,L);if(C.motion(s,l,L),l.rx==null&&l.ry==null&&l.rz==null&&l.lin==null)return;Tt(performance.now()/1000,l.rx,l.ry,l.rz,l.gx,l.gy,l.gz,l.lin)};function kt(){V(n,"devicemotion",Kt),H=n.setTimeout(()=>{if(!j)Dt("none")},1500)}let $t=n.DeviceMotionEvent;if(!$t)v="none";else if(typeof $t.requestPermission==="function")v="ask";else kt();V(h("ask"),"click",()=>{$t.requestPermission().then((s)=>{if(s==="granted")Dt("unknown"),kt();else Dt("blocked")},()=>Dt("blocked"))});let Lt=0,mt=null,wt=null,ct=0,Nt=()=>{if(!Lt)return;let s=(performance.now()-ct)/1000,l=Math.max(0,Math.min(1,(s-0.25)/1.2)),c=20+50*l;if(s>0.25)g.play("pTick",{v:Math.floor(s*7)%3,vol:0.7,rate:1+0.08*l,gap:0}),g.buzz(4);wt=n.setTimeout(Nt,s<0.25?(0.25-s)*1000+1:2.5/c*1000)},dt=(s)=>{if(Lt=s,e({type:"mg-aim",dir:s}),mt)n.clearInterval(mt),mt=null;if(s)mt=n.setInterval(()=>e({type:"mg-aim",dir:Lt}),250);for(let l of R.querySelectorAll("[data-dir]"))l.classList.toggle("is-down",Number(l.dataset.dir)===s);if(wt)n.clearTimeout(wt),wt=null;if(s)ct=performance.now(),g.play("pTick",{v:0,vol:0.85,gap:0}),g.buzz(8),wt=n.setTimeout(Nt,250)};for(let s of R.querySelectorAll("[data-dir]")){V(s,"pointerdown",(l)=>{l.preventDefault();try{s.setPointerCapture(l.pointerId)}catch{}dt(Number(s.dataset.dir))});for(let l of["pointerup","pointercancel","lostpointercapture"])V(s,l,()=>{if(Lt===Number(s.dataset.dir))dt(0)});V(s,"contextmenu",(l)=>l.preventDefault())}let _="aim",_t=!1,Gt=0,nt=(s)=>{_t=s,Gt=performance.now(),e({type:"mg-birdseye",on:s}),i()},ht=(s,l)=>{let c=h(s);V(c,"pointerdown",(f)=>{f.preventDefault(),c.classList.add("is-down")}),V(c,"pointercancel",()=>c.classList.remove("is-down")),V(c,"pointerup",()=>{if(!c.classList.contains("is-down"))return;if(c.classList.remove("is-down"),x&&x.yourTurn)l()})};ht("bird",()=>{if(_==="aim")nt(!Ut())}),ht("ok",()=>{if(_!=="aim")return;if(dt(0),Ut())nt(!1);_="pick",w.arm(!1),Ot=!0,i()}),ht("prac",()=>{if(_!=="pick")return;_="practice",ut(!1),w.arm(!0),Ot=!0,i()});let zt=()=>{if(_!=="pick"&&_!=="practice")return;if(_==="practice")e({type:"mg-power",now:0,peak:0});_="set",ut(!1),w.arm(!0),Ot=!0,i()};ht("putt",zt),ht("putt2",zt),ht("again",()=>{if(_==="aim")return;_="aim",ut(!1),w.arm(!1),Ot=!0,i()});let Ut=()=>performance.now()-Gt<1500?_t:!!(x&&x.birdseye),At=h("swing"),Vt=At.querySelector("i"),at=null,jt=()=>v==="none"||v==="blocked";V(At,"pointerdown",(s)=>{if(!jt()||!x||!x.yourTurn||s.target===h("ask"))return;at={y:s.clientY,p:0};try{At.setPointerCapture(s.pointerId)}catch{}}),V(At,"pointermove",(s)=>{if(!at)return;at.p=Math.min(1,Math.max(0,(s.clientY-at.y)/(At.clientHeight*0.75))),Vt.style.height=`${at.p*100}%`});for(let s of["pointerup","pointercancel"])V(At,s,()=>{if(!at)return;let l=at.p;if(at=null,Vt.style.height="0",i(),s==="pointerup"&&l>0.04)if(_==="practice")et(l);else It(l,"touch")});V(At,"pointermove",()=>{if(at)Jt()}),V(o,"visibilitychange",()=>{if(e({type:"mg-hidden",on:o.hidden}),o.hidden){if(dt(0),ut(!1),w.state!=="off")w.arm(!0)}});let Ot=!1,Qt="",it="",Zt="",lt=!1,Q=(s,l)=>{let c=h(s);if(c.hidden===!l)return!1;return c.hidden=!l,l},F=(s)=>{s.classList.remove("pop"),s.offsetWidth,s.classList.add("pop")},Ft=(s)=>d.head(s.hole.n,s.hole.name,s.hole.par,s.hole.of);function Jt(){let s=!!at;if(s===lt)return;lt=s,h("swing").classList.toggle("go",s),h("pullw").innerHTML=d.big(s?u.touch2:u.touch1,s?120:72)}function ne(s,l){let c=d.nameSize(s.rows.map((b)=>String(b.name).toUpperCase())),f=s.hole.par,O=(b)=>`<div class="pr${b.id===M()?" you":""}"><span class="c" style="background:${A(b.color)}"></span><span class="n" style="font-size:${c}px">${A(String(b.name).toUpperCase())}</span><span class="hr">${l&&(b.hole||b.sunk)?d.here(b.hole,b.sunk,"",f):""}</span><span class="t">${b.total}</span></div>`;return`<div class="ppr"><div class="pr h"><span></span><span></span><span>${l?u.thisHole:""}</span><span>${u.all}</span></div>${s.rows.map(O).join("")}</div>`}let Et=(s,l,c)=>`<div class="pp ${l?"col":"gold"} now" data-k="${c}"${l?` style="--pc:${A(l)}"`:""}>${A(s)}</div>`;function i(){let s=x;if(!s)return;let l=!!s.yourTurn;if(Q("turn",l),Q("rest",!l),l){let b=`${s.hole.n}|${s.hole.name}|${s.hole.par}|${s.hole.of}`;if(b!==it)it=b,h("thead").outerHTML=Ft(s).replace(/^<div /,'<div data-k="thead" ');h("stroke").textContent=u.stroke(s.stroke),h("stroke").style.color=s.you.color||"",h("cup").innerHTML=s.you.toGo!=null?$(A(u.toCup(s.you.toGo.toFixed(1)))):"";let Z=!(_==="set"||_==="practice")?"":v==="ask"?"ask":jt()?"swing":m?"m2":"m1";if(Q("aimv",_==="aim"),Q("again",_!=="aim"),Q("pick",_==="pick"),Q("prach",_==="practice"),Q("putt2",_==="practice"),_==="pick"&&Ot)F(h("putt"));for(let ft of["m1","m2","ask","swing"])Q(ft,Z===ft);if(Z!==Zt||Ot){if(Zt=Z,Z)F(h(Z))}if(Ot=!1,h("bird").classList.toggle("on",Ut()),Z==="swing")Jt();return}it="";let c="",f="";if(s.final){let b=s.rows.findIndex((z)=>z.id===M());c=Et(p.TV_WORDS.finalScores,null,"p0")+(b>=0?Et(`${w0(b+1)} PLACE  ${s.you.total}`,s.you.color,"p1"):"")}else if(s.phase==="card")c=Et(p.TV_WORDS.afterHole(s.hole.n),null,"p0");else{if(s.up)c=Et(u.putting(s.up.name),s.up.color,"p0");let b=s.waitingFor;if(b!=null&&!s.you.sunk)f=u.before(b);else if(s.you.toGo!=null&&s.up)f=u.toCup(s.you.toGo.toFixed(1))}let O=Ft(s)+c+(f?`<div class="info"><span class="d">${$(A(f))}</span></div>`:"")+ne(s,!s.final&&s.phase!=="card");if(O!==Qt){let b=h("p0")&&h("p0").textContent;if(Qt=O,h("rest").innerHTML=O,h("p0")&&h("p0").textContent!==b)F(h("p0"))}}return{onMessage(s){if(!s||s.type!=="mg-view")return;let l=x&&x.yourTurn?x.stroke:null,c=x;if(x=s,c&&s.yourTurn&&!c.yourTurn)g.play("pTurn"),g.buzz([30,70,30]);if(c&&s.you.sunk&&!c.you.sunk&&c.hole.n===s.hole.n){let O=s.you.strokes===1;g.play(O?"pAce":"pCup"),g.buzz(O?[60,60,60,60,120]:[40,50,80])}let f=s.yourTurn?s.stroke:null;if(f!==l||f!=null&&P!==f){if(P=f,m=!1,q)n.clearTimeout(q),q=null;if(_="aim",w.arm(!1),f==null)dt(0)}i()},show(){if(e({type:"mg-hello"}),v!=="unknown")e({type:"mg-motion",state:v})},letGo(){dt(0)},release(){C.release(),gt.remove();for(let s of St)s();if(mt)n.clearInterval(mt);if(wt)n.clearTimeout(wt);if(H)n.clearTimeout(H);if(q)n.clearTimeout(q);t.innerHTML=""},feedMotion:Tt,get state(){return{motion:v,steady:m,detector:w.state,view:x,step:_,birdseye:Ut(),sound:g.ready}}}}var A0=`
:where(.mg-set, .mg-set *) { box-sizing: border-box; margin: 0; padding: 0; }
.mg-set { position: fixed; inset: 0; z-index: 60; overflow: hidden; touch-action: none; user-select: none; -webkit-user-select: none; background: repeating-conic-gradient(#17694f 0 25%, #1b7558 0 50%) 0 0/120px 120px; }
.mg-set[hidden] { display: none; }
/* LOOK's phone screens are drawn for a 390 x 844 phone: the page keeps that shape and is scaled to fit this one */
.mg-set-in { position: absolute; left: 50%; top: 0; width: 390px; height: 844px; transform-origin: 50% 0; }
.mg-set-in[hidden] { display: none; }
#ph.mg-set-in .abs { position: absolute; }
#ph.mg-set-in svg.pix { display: block; }
#ph.mg-set-in .tap { cursor: pointer; }
#ph.mg-set-in .tap.down, #ph.mg-set-in .wc.down { filter: brightness(0.8); }
#ph.mg-set-in .mg-wait { margin-top: 6px; font-size: 15px; white-space: nowrap; }
#ph.mg-set-in .ttl { flex: 1; display: flex; flex-direction: column; gap: 12px; }
/* MAKE YOUR BALL rows (hotfix Nov 11, Lakota: "let users swipe to move the bars... or maybe arrows"): every choice is
   in its row; the row slides under a finger (with a flick it glides on) and the small arrows at its ends move it too.
   Picking marks the choice where it is: the row never jumps. */
#ph.mg-set-in .wh.mgr { display: block; position: relative; overflow: hidden; }
#ph.mg-set-in .mgt { position: relative; display: flex; align-items: center; gap: 6px; width: max-content; padding: 0 38px; will-change: transform; }
#ph.mg-set-in .mga { position: absolute; top: 50%; width: 32px; height: 46px; margin-top: -23px; display: flex; align-items: center; justify-content: center; z-index: 2; border-width: 3px; }
#ph.mg-set-in .mga.l { left: 0; }
#ph.mg-set-in .mga.r { right: 0; }
#ph.mg-set-in .mga.r svg { transform: scaleX(-1); }
#ph.mg-set-in .mga.off { opacity: 0.35; }
/* SECOND COLOR: the main colour's cell is dimmed and can't be picked (the two colours are never the same) */
#ph.mg-set-in .w-c .wc.same { opacity: 0.35; }
`;function ca(t,{send:e,me:a}){let o=t.ownerDocument,n=o.defaultView,p=ae(),r=p.K,d=p.SETUP_WORDS,u=r.h,A=u.setup,{OUT:$,CREAM:U,ballSvg:E}=u,{pix:T,esc:R}=p,h=p;if(!o.getElementById("mg-kit-css")){let i=o.createElement("style");i.id="mg-kit-css",i.textContent=r.css,o.head.appendChild(i)}if(!o.getElementById("mg-set-css")){let i=o.createElement("style");i.id="mg-set-css",i.textContent=A0,o.head.appendChild(i)}t.innerHTML="";let w=o.createElement("div"),g=o.createElement("div"),C=o.createElement("div");w.className="mg-set",w.hidden=!0,w.dataset.test="minigolf-setup",g.id="ph",g.className="sB pk mg-set-in",C.className="mg-set-in",C.dataset.test="minigolf-play",C.hidden=!0,w.append(g,C),t.appendChild(w);let L=Ve(C,{send:e,me:a}),M=()=>{let i=Math.min(n.innerWidth/390,n.innerHeight/844,1.15);for(let s of[g,C])s.style.transform=`translateX(-50%) scale(${i})`,s.style.top=`${Math.max(0,Math.round((n.innerHeight-844*i)/2))}px`};n.addEventListener("resize",M),M();let W=(i)=>(h.BALL_COLORS.find((s)=>s[1].toLowerCase()===String(i).toLowerCase())||h.BALL_COLORS[0])[0],x=null,v=null,m=null,P="",y=null,Y=!1,H=!1,j="",q=()=>({outfit:x.o,pattern:x.s,colors:[A.colorOf(x.m),A.colorOf(x.c)],...x.o==="drawn"&&v?{art:v}:{}}),qt=()=>v?h.drawnOutfit(v):null,St=(i,s,l)=>E(i,s,l.colors[0],Fe(l),"",l.pattern,l.colors[1]);function V(){let i=q(),s=JSON.stringify(i);if(s!==j)j=s,e({type:"mg-ball",ball:i})}function Dt(i){return`<div class="ttl">${r.phone[i.host?"title":"title-guest"]().html}</div>`}let ut=T(["......##",".....#gg","....#gg#","...#gg#.","..#gg#..",".#cg#...","#cc#....","###....."],2,{"#":$,g:u.GOLD,c:U}),Tt=()=>{let i=qt();return[h.OUTFITS[0],...i&&i!=="none"?[i]:[],...h.OUTFITS.slice(1)]},Pt={"w-o":["w-o long","--mh:74px;--sh:50px"],"w-s":["w-s","--mh:66px;--sh:46px"],"w-m":["w-m col","--mh:48px;--sh:36px"],"w-c":["w-c col","--mh:48px;--sh:36px"]},et={},It=new Set,gt=T(["..#",".##","###",".##","..#"],3,{"#":U}),rt=(i)=>Math.max(0,i==="w-o"?Tt().findIndex((s)=>s.id===x.o):i==="w-s"?h.BALL_PATTERNS.findIndex((s)=>s[0]===x.s):h.BALL_COLORS.findIndex((s)=>s[0]===x[i==="w-m"?"m":"c"]));function Ct(i){let s=A.colorOf(x.m),l=A.colorOf(x.c),c=rt(i);if(i==="w-o")return Tt().map((f,O)=>[E(O===c?8:5,2,s,f.art?f:f.id)+(f.art?`<span class="pen">${ut}</span>`:"")]);if(i==="w-s")return h.BALL_PATTERNS.map((f,O)=>[A.bare(O===c?12:8,2,{pattern:f[0],colors:[s,l]})]);return h.BALL_COLORS.map((f)=>["",f[1]])}let se=(i,s)=>i==="w-c"&&h.BALL_COLORS[s]&&h.BALL_COLORS[s][0]===x.m,Kt=(i)=>{let s=rt(i);return Ct(i).map((l,c)=>`<div class="wc tap${c===s?" mid":""}${se(i,c)?" same":""}" data-k="${i}" data-i="${c}"${l[1]?` style="--c:${l[1]}"`:""}>${l[0]}</div>`).join("")},kt=(i)=>`<div class="wh mgr ${Pt[i][0]}" style="${Pt[i][1]}"><div class="mgt" data-row="${i}" style="transform:translate3d(${Math.round(et[i]||0)}px,0,0)">${Kt(i)}</div><div class="pp mga l tap" data-act="rowl" data-row="${i}" data-test="mg-${i}-l">${gt}</div><div class="pp mga r tap" data-act="rowr" data-row="${i}" data-test="mg-${i}-r">${gt}</div></div>`,$t=(i,s)=>`<div class="wl px"><span>${i}</span><span class="nm" data-nm="${s||""}">${R(Lt(s))}</span></div>`,Lt=(i)=>i==="w-s"?h.BALL_PATTERNS[rt("w-s")][1]:i==="w-m"?x.m:i==="w-c"?x.c:"",mt=(i)=>`${Math.min(16,Math.floor(340/i.length))}px`;function wt(i){let s=Tt()[rt("w-o")];return`<div class="pg"><div class="pp shead px"><span class="pp col ch" style="--pc:${R(i.me.color)}">${R(String(i.me.name).toUpperCase())}</span><span>${d.yourBall}</span></div><div class="pv2"><div class="full pvb">${St(16,4,q())}</div><div class="pp gold ownb px tap" data-act="draw" data-test="mg-draw">${ut}<span>${d.makeOwn.join("<br>")}</span></div></div><div class="px onm" style="font-size:${mt(s.name)}">${R(s.name)}</div><div class="wg">${$t(d.wOutfit)}${kt("w-o")}</div><div class="wg">${$t(d.wPattern,"w-s")}${kt("w-s")}</div><div class="wg">${$t(d.wMain,"w-m")}${kt("w-m")}</div><div class="wg">${$t(d.wSecond,"w-c")}${kt("w-c")}</div><div class="brow"><div class="pp btn sp px tap" data-act="surprise">${d.surprise.replace(" ","<br>")}</div><div class="pp gold btn px dn tap" data-act="done" data-test="mg-done">${d.done}</div></div></div>`}let ct=(i)=>g.querySelector(`.mgt[data-row="${i}"]`),Nt=(i)=>[Math.min(0,i.parentElement.clientWidth-i.offsetWidth),0],dt=(i,s)=>{let l=i.children[s];return l?l.offsetLeft+l.offsetWidth/2:0};function _(i,s){et[i]=s;let l=ct(i);if(!l)return;l.style.transform=`translate3d(${s.toFixed(1)}px,0,0)`;let[c,f]=Nt(l),O=l.parentElement;O.querySelector(".mga.l").classList.toggle("off",s>=f-1),O.querySelector(".mga.r").classList.toggle("off",s<=c+1)}let _t=(i,s)=>{let l=ct(i);if(!l)return s;let[c,f]=Nt(l);return Math.min(f,Math.max(c,s))},Gt=(i)=>{let s=ct(i);if(s)_(i,_t(i,s.parentElement.clientWidth/2-dt(s,rt(i))))},nt={},ht=(i)=>{if(nt[i])n.cancelAnimationFrame(nt[i]),delete nt[i]};function zt(i,s,l){ht(i);let c=performance.now(),f=(O)=>{let b=Math.min(32,Math.max(1,O-c)),z=ct(i);if(c=O,!z){delete nt[i];return}let[Z,ft]=Nt(z),G=et[i]||0;if(l==null){if(G+=s*b,s*=Math.pow(G>ft||G<Z?0.9:0.996,b),Math.abs(s)<0.02)if(G>ft||G<Z)l=G>ft?ft:Z;else{_(i,G),delete nt[i];return}}else{let Ht=Math.min(ft,Math.max(Z,l));if(G+=(Ht-G)*(1-Math.exp(-b/70)),Math.abs(Ht-G)<0.5){_(i,Ht),delete nt[i];return}}_(i,G),nt[i]=n.requestAnimationFrame(f)};nt[i]=n.requestAnimationFrame(f)}function Ut(i,s){let l=g.querySelector(".pvb");if(l)l.innerHTML=St(16,4,q());let c=g.querySelector(".onm"),f=Tt()[rt("w-o")];if(c)c.textContent=f.name,c.style.fontSize=mt(f.name);for(let O of g.querySelectorAll("[data-nm]"))if(O.dataset.nm)O.textContent=Lt(O.dataset.nm);for(let O of i){let b=ct(O);if(!b)continue;let z=s&&s.key===O?dt(b,s.i):null;b.innerHTML=Kt(O),ht(O),_(O,z!=null?(et[O]||0)+z-dt(b,s.i):_t(O,et[O]||0))}}function At(){for(let i of Object.keys(Pt))if(et[i]==null||It.has(i))Gt(i);else _(i,_t(i,et[i]));It.clear()}function Vt(i){let s=i.me.ball||q(),l=i.phase!=="pick";return`<div class="pg"><div class="pp shead px"><span>${d.yourBall}</span></div><div class="prev"><div class="full">${St(20,4,s)}</div></div><div class="pp col who" style="--pc:${R(i.me.color)}">${R(String(i.me.name).toUpperCase())}</div><div class="pp rdy btn px" style="flex:none;height:96px;font-size:40px">${d.readyOn}</div>`+(l?"":`<div class="pp btn low px tap" data-act="change">${d.change}</div>`)+`<div class="px blab mg-wait">${R(l||!i.waiting?d.allReady:d.waiting(i.waiting))}</div></div>`}let at=11,jt=[["pen",d.pen,["....##","...###","..###.",".###..","###...","##...."]],["fill",d.fill,["..##..",".#..#.","######","######",".####.","..##.."]],["eraser",d.eraser,["..####",".#####","######","#####.","####..","......"]]],Ot=Object.fromEntries(h.DRAW.colors.map(([i,s])=>[i,s]));function Qt(){let i=y.pad,s=q(),l=at;return y.sq=l,`<div class="pg"><div class="drow"><div class="pp dbt px tap" data-act="dback">${d.back}</div><div class="px dtt">${d.drawTitle.join("<br>")}</div><div class="pp dbt px tap" data-act="dundo">${d.undo}</div><div class="pp dbt px tap" data-act="dclear">${d.clear}</div></div><div class="dboard" id="mg-dbd" style="width:${i.w*l}px;height:${i.h*l}px;background-size:${l*2}px ${l*2}px"><div>${T(h.ballGrid(i.R,"none",s.pattern).rows,l,h.ballColors(s.colors[0],"none",s.colors[1]))}</div><div id="mg-dart"></div></div><div class="drow">${jt.map(([c,f,O])=>`<div class="pp dtool px tap" data-act="tool" data-v="${c}" id="mg-dt-${c}">${T(O,3,{"#":U})}<span>${f}</span></div>`).join("")}`+h.DRAW.sizes.map((c,f)=>`<div class="pp dsz tap" data-act="size" data-v="${f}" id="mg-ds${f}"><i style="width:${c*8}px;height:${c*8}px"></i></div>`).join("")+`</div><div class="dpal">${h.DRAW.colors.map(([c,f])=>`<div class="dsw tap" data-act="color" data-v="${c}" id="mg-dc-${c}" style="--c:${f}"></div>`).join("")}</div><div class="spacer"></div><div class="drow"><div class="pp dprev px"><span id="mg-dpv"></span><span>${d.onCourse.join("<br>")}</span></div><div class="pp gold btn px tap" data-act="ddone" style="height:84px">${d.done}</div></div>`+(y.ask?`<div class="dask"><div class="pp q">${R(d.clearAsk)}</div><div class="brow"><div class="pp gold btn px tap" data-act="dyes" style="font-size:26px">${d.yes}</div><div class="pp btn px tap" data-act="dno" style="font-size:26px;text-shadow:2px 2px 0 ${$}">${d.no}</div></div></div>`:"")+"</div>"}function it(){let i=h.padArt(y.pad),s=i.rows.join(""),l=y.ui;if(y.key!==s){y.key=s,g.querySelector("#mg-dart").innerHTML=T(i.rows,y.sq,Ot);let c=h.drawnOutfit(i);if(g.querySelector("#mg-dpv").innerHTML=St(4,4,{...q(),outfit:"drawn",art:c==="none"?null:i}),c!=="none")e({type:"mg-ball",ball:{...q(),outfit:"drawn",art:i}})}jt.forEach(([c])=>g.querySelector(`#mg-dt-${c}`).classList.toggle("sel",l.tool===c)),h.DRAW.sizes.forEach((c,f)=>g.querySelector(`#mg-ds${f}`).classList.toggle("sel",l.size===f)),h.DRAW.colors.forEach(([c])=>g.querySelector(`#mg-dc-${c}`).classList.toggle("sel",l.color===c))}function Zt(){let i=g.querySelector("#mg-dbd");if(!i)return;let s=null,l=null,c=(b)=>{let z=i.getBoundingClientRect(),Z=z.width/i.offsetWidth;return[Math.floor((b.clientX-z.left-4*Z)/(y.sq*Z)),Math.floor((b.clientY-z.top-4*Z)/(y.sq*Z))]},f=()=>y.ui.tool==="eraser"?".":y.ui.color;i.addEventListener("pointerdown",(b)=>{if(s!=null||y.ask)return;b.preventDefault(),s=b.pointerId;try{i.setPointerCapture(s)}catch{}if(h.padSnap(y.pad),l=c(b),y.ui.tool==="fill")h.padFill(y.pad,l[0],l[1],f());else h.padStamp(y.pad,l[0],l[1],h.DRAW.sizes[y.ui.size],f());it()}),i.addEventListener("pointermove",(b)=>{if(b.pointerId!==s||y.ui.tool==="fill")return;let z=c(b);h.padLine(y.pad,l[0],l[1],z[0],z[1],h.DRAW.sizes[y.ui.size],f()),l=z,it()});let O=(b)=>{if(b.pointerId===s)s=null};i.addEventListener("pointerup",O),i.addEventListener("pointercancel",O)}function lt(){let i=m;if(!i)return;let s=i.phase==="title"?"title":i.phase==="pick"&&!i.me.ready?y?"draw":"pick":"ready";if(P=s,s==="title"){g.innerHTML=Dt(i);let l=g.querySelector("#st");if(l)l.classList.add("tap"),l.dataset.act="start",l.dataset.test="mg-start",l.style.visibility=i.start?"":"hidden"}else if(s==="pick")g.innerHTML=wt(i),At();else if(s==="draw")g.innerHTML=Qt(),Zt(),y.key="",it();else g.innerHTML=Vt(i)}let Q=null;g.addEventListener("pointerdown",(i)=>{let s=i.target.closest(".tap");if(Q=s,s)s.classList.add("down")}),g.addEventListener("pointercancel",()=>{if(Q)Q.classList.remove("down");Q=null}),g.addEventListener("pointerup",(i)=>{let s=i.target.closest(".tap"),l=Q;if(l)l.classList.remove("down");if(Q=null,!s||s!==l)return;Jt(s)});let F=null;g.addEventListener("pointerdown",(i)=>{let s=i.target.closest&&i.target.closest(".mgt");if(!s||F)return;let l=s.dataset.row;ht(l),F={key:l,id:i.pointerId,x0:i.clientX,from:et[l]||0,moved:!1,k:g.getBoundingClientRect().width/390||1,hist:[[performance.now(),i.clientX]]}}),g.addEventListener("pointermove",(i)=>{if(!F||i.pointerId!==F.id)return;let s=(i.clientX-F.x0)/F.k,l=performance.now();if(!F.moved&&Math.abs(s)>8){if(F.moved=!0,Q)Q.classList.remove("down"),Q=null}F.hist.push([l,i.clientX]);while(F.hist.length>2&&l-F.hist[0][0]>100)F.hist.shift();if(!F.moved)return;let c=ct(F.key);if(!c)return;let[f,O]=Nt(c),b=F.from+s;if(b>O)b=O+(b-O)*0.35;else if(b<f)b=f+(b-f)*0.35;_(F.key,b)});let Ft=(i)=>{if(!F||i.pointerId!==F.id)return;let s=F,l=performance.now(),c=s.hist,f=c[0],O=c[c.length-1];if(F=null,!s.moved)return;let b=l-O[0]>60||O[0]-f[0]<10?0:(O[1]-f[1])/(O[0]-f[0])/s.k;zt(s.key,Math.max(-4,Math.min(4,b)))};g.addEventListener("pointerup",Ft),g.addEventListener("pointercancel",Ft);function Jt(i){let s=i.dataset.act,l=i.dataset.k;if(l){let c=Number(i.dataset.i);if(!(c>=0)||c===rt(l))return;let f;if(l==="w-o"){let O=Tt()[c];if(!O)return;x.o=O.id,f=["w-o"]}else if(l==="w-s"){if(!h.BALL_PATTERNS[c])return;x.s=h.BALL_PATTERNS[c][0],f=["w-s"]}else if(l==="w-m"||l==="w-c"){if(!h.BALL_COLORS[c])return;let O=x;if(x={...x,...je(x,l==="w-m"?"m":"c",h.BALL_COLORS[c][0])},x.m===O.m&&x.c===O.c)return;if(f=l==="w-m"?["w-m","w-c","w-o","w-s"]:["w-c","w-s"],l==="w-m"&&x.c!==O.c){V(),Ut(f,{key:l,i:c}),Gt("w-c");return}}V(),Ut(f,{key:l,i:c});return}switch(s){case"rowl":case"rowr":{let c=i.dataset.row,f=ct(c);if(f)zt(c,0,(et[c]||0)+(s==="rowl"?1:-1)*f.parentElement.clientWidth*0.6);break}case"start":if(m&&m.start)e({type:"mg-start"});break;case"surprise":{let c=()=>Math.random(),f=(z)=>z[Math.floor(c()*z.length)],O=f(h.BALL_COLORS)[0],b=f(h.BALL_COLORS.filter((z)=>z[0]!==O))[0];x={o:f(h.OUTFITS.slice(1)).id,s:c()<0.4?"plain":f(h.BALL_PATTERNS)[0],m:O,c:b,own:!0};for(let z of Object.keys(Pt))It.add(z);V(),lt();break}case"done":V(),e({type:"mg-done"});break;case"change":e({type:"mg-change"});break;case"draw":{y={pad:v?h.padFrom(v):h.padNew(),ui:{color:"C",tool:"pen",size:1},ask:!1,key:""},e({type:"mg-drawing",on:!0}),lt();break}case"dback":y=null,e({type:"mg-drawing",on:!1}),j="",V(),lt();break;case"ddone":{let c=h.padArt(y.pad);if(h.drawnOutfit(c)!=="none")v=c,x.o="drawn";else if(x.o==="drawn")v=null,x.o="none";It.add("w-o"),y=null,e({type:"mg-drawing",on:!1}),j="",V(),lt();break}case"dundo":h.padUndo(y.pad),it();break;case"dclear":if(!h.padBlank(y.pad))y.ask=!0,lt();break;case"dyes":h.padClear(y.pad),y.ask=!1,lt();break;case"dno":y.ask=!1,lt();break;case"tool":y.ui.tool=i.dataset.v,it();break;case"size":y.ui.size=Number(i.dataset.v),it();break;case"color":if(y.ui.color=i.dataset.v,y.ui.tool==="eraser")y.ui.tool="pen";it();break}}function ne(i){let s=!m;if(m=i,!x){let c=i.me.ball||{outfit:"none",pattern:"plain",colors:[i.me.color,null]},f=W(c.colors[0]),O=c.colors[1]?W(c.colors[1]):null,b=!O||O===f?oe(f):O;if(x={o:c.outfit||"none",s:c.pattern||"plain",m:f,c:b,own:b!==oe(f)},c.outfit==="drawn"&&c.art)v=c.art;j=JSON.stringify(q())}if(i.phase!=="pick")y=null;let l=i.phase==="title"?"title":i.phase==="pick"&&!i.me.ready?y?"draw":"pick":"ready";if(s||l!==P||l==="ready"||l==="title")lt()}function Et(){if(w.hidden=!H,g.hidden=!Y,C.hidden=Y,H)M()}return{onMessage(i){if(!i||typeof i!=="object")return;if(i.type==="mg-setup"){Y=!0,Et(),ne(i);return}if(i.type==="mg-view")Y=!1,y=null,Et();L.onMessage(i)},show(i){let s=H;if(H=!!i,Et(),H&&!s)L.show()},release(){L.letGo()},get state(){return{screen:P,view:m,ball:x&&q(),putt:L.state}}}}export{ca as createMinigolfPad};
