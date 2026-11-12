var Le={smooth:0.035,stillDps:14,stillFor:0.5,startDeg:2.5,leak:1.2,turnDps:22,minBack:4,minPeak:25,fullPeak:240,curve:1.25,stab:0.5,wild:400,maxStroke:3,offAxis:2.2};function re(a=Le){let h="off",H=null,g=0,f=0,$=0,x=0,l=0,B=0,u=0,m=0,P=0,q=0,j=0,b=0,s=0,k=0,T=0;return{get state(){return h},arm(W){h=W?"loose":"off",x=0,H=null,g=f=$=0},feed(W,I,p,R){if(h==="off"||h==="done")return null;if(!(I===I&&p===p&&R===R))return null;let y=H==null?0:Math.min(0.1,Math.max(0,W-H));H=W;let z=y<=0?1:1-Math.exp(-y/a.smooth);g+=(I-g)*z,f+=(p-f)*z,$+=(R-$)*z;let i=Math.hypot(g,f,$);if(h==="loose"){if(x=i<a.stillDps?x+y:0,x>=a.stillFor)return h="ready",B=u=m=0,{type:"steady",on:!0};return null}if(h==="ready"){if(i>a.wild)return h="loose",x=0,{type:"steady",on:!1};let E=Math.exp(-y/a.leak);if(B=B*E+g*y,u=u*E+f*y,m=m*E+$*y,Math.hypot(B,u,m)>a.startDeg)h="back",l=W,b=0,s=0,k=0,T=0,x=0;return null}let M=(E)=>{return h="loose",x=0,{type:"cancel",why:E}};if(i>a.wild)return M("wild");if(W-l>a.maxStroke)return M("slow");if(h==="back"){if(B+=g*y,u+=f*y,m+=$*y,b=Math.hypot(B,u,m),b>0.5)if((g*B+f*u+$*m)/b<-a.turnDps&&b>=a.minBack)h="fwd",P=B/b,q=u/b,j=m/b,s=0,k=0,T=0;else if(i<a.stillDps*0.5&&b<a.minBack){if(x+=y,x>0.25)h="ready",x=0,B=u=m=0}else x=0;return null}let S=-(g*P+f*q+$*j),U=Math.sqrt(Math.max(0,i*i-S*S));if(s+=S*y,T+=U*y,S>k)k=S;if(T>a.offAxis*Math.max(b,s)+6)return M("twist");let D=s>=b,F=S<a.stillDps&&s>=b*a.stab;if((D||F)&&k>=a.minPeak){h="done";let E=Math.min(1,Math.max(0,(k-a.minPeak)/(a.fullPeak-a.minPeak)));return{type:"putt",power:Math.pow(E,a.curve),peak:k,back:b,fwd:s}}if(S<-a.turnDps&&s<b*a.stab)return M("back again");if(S<a.stillDps&&k<a.minPeak&&s>1)return M("soft");return null}}}var Pe=`
.mg { --c: #ffd23f; position: relative; flex: 1; display: flex; flex-direction: column; gap: 10px; min-height: 0; color: #fff; font-family: "FoxBox Pixel", "Press Start 2P", ui-monospace, monospace; text-transform: uppercase; user-select: none; -webkit-user-select: none; touch-action: none; }
.mg * { box-sizing: border-box; }
.mg-head { display: flex; justify-content: space-between; gap: 8px; font-size: 10px; line-height: 1.5; color: #bff3d8; }
.mg-big { font-size: 22px; line-height: 1.25; color: var(--c); text-shadow: 3px 3px 0 #1a1c2c; min-height: 28px; }
.mg-sub { font-size: 11px; line-height: 1.6; color: #e6ebf2; min-height: 18px; white-space: pre-line; }
.mg-turn { flex: 1; display: none; flex-direction: column; gap: 10px; min-height: 0; }
.mg.is-turn .mg-turn { display: flex; }
.mg.is-turn .mg-rows { display: none; }
.mg-swing { flex: 1; min-height: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; border: 4px solid #1a1c2c; background: #17694f; box-shadow: inset 0 0 0 4px #1e8562; position: relative; overflow: hidden; }
.mg-swing b { font-size: 24px; font-weight: 400; text-shadow: 3px 3px 0 #1a1c2c; position: relative; }
.mg-swing small { font-size: 9px; line-height: 1.5; color: #bff3d8; text-align: center; padding: 0 8px; position: relative; }
.mg-swing.is-steady { background: var(--c); box-shadow: inset 0 0 0 4px #fff; }
.mg-swing.is-steady b { color: #1a1c2c; text-shadow: none; }
.mg-swing.is-steady small { color: #1a1c2c; }
.mg-swing i { position: absolute; left: 0; right: 0; bottom: 0; height: 0; background: var(--c); opacity: 0.85; }
.mg-swing button { font: inherit; font-size: 13px; color: #1a1c2c; background: var(--c); border: 4px solid #1a1c2c; padding: 14px 12px; box-shadow: 0 4px 0 #1a1c2c; }
.mg-aim { display: flex; gap: 10px; height: 34%; min-height: 84px; }
.mg-aim button { flex: 1; font: inherit; font-size: 30px; color: #fff; background: #262b44; border: 4px solid #1a1c2c; box-shadow: inset 0 0 0 4px #333c57, 0 4px 0 #1a1c2c; touch-action: none; }
.mg-aim button.is-down { background: var(--c); color: #1a1c2c; box-shadow: inset 0 0 0 4px #fff; transform: translateY(4px); }
.mg-aim span { align-self: center; font-size: 9px; color: #bff3d8; }
.mg-rows { flex: 1; display: flex; flex-direction: column; gap: 6px; min-height: 0; overflow: hidden; }
.mg-row { display: flex; align-items: center; gap: 8px; font-size: 11px; padding: 7px 8px; background: #262b44; border: 3px solid #1a1c2c; }
.mg-row.is-me { box-shadow: inset 0 0 0 3px var(--c); }
.mg-row.is-up { background: #333c57; }
.mg-row em { width: 12px; height: 12px; border: 2px solid #1a1c2c; flex: none; }
.mg-row span { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.mg-row u { text-decoration: none; color: #bff3d8; font-size: 9px; }
.mg-row b { font-weight: 400; min-width: 28px; text-align: right; }
`,le=(a)=>String(a).replace(/[&<>"]/g,(h)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[h]),We=(a)=>`${a}${a%10===1&&a%100!==11?"ST":a%10===2&&a%100!==12?"ND":a%10===3&&a%100!==13?"RD":"TH"}`,pe=(a)=>`${a} STROKE${a===1?"":"S"}`;function de(a,{send:h,me:H}){let g=a.ownerDocument,f=g.defaultView;if(!g.getElementById("mg-pad-css")){let t=g.createElement("style");t.id="mg-pad-css",t.textContent=Pe,g.head.appendChild(t)}a.innerHTML=`<div class="mg"><div class="mg-head"><span data-k="hole"></span><span data-k="par"></span></div><div class="mg-big" data-k="big"></div><div class="mg-sub" data-k="sub"></div>
    <div class="mg-turn"><div class="mg-swing" data-k="swing"><i></i><b data-k="word"></b><small data-k="hint"></small><button data-native data-k="ask" hidden>TURN ON SWING</button></div>
    <div class="mg-aim"><button data-native data-dir="-1" aria-label="aim left">&#9664;</button><span>AIM</span><button data-native data-dir="1" aria-label="aim right">&#9654;</button></div></div>
    <div class="mg-rows" data-k="rows"></div></div>`;let $=a.firstElementChild,x=(t)=>$.querySelector(`[data-k="${t}"]`),l=re(),B=()=>H&&H()?H().id:null,u=null,m="unknown",P=!1,q=null,j=0,b=0,s=null,k=!1,T=null,A=Math.floor(performance.now()).toString(36),W=[],I=(t,d,w,C)=>{t.addEventListener(d,w,C),W.push(()=>t.removeEventListener(d,w,C))},p=(t)=>{if(t===m)return;m=t,h({type:"mg-motion",state:t}),Q()},R=(t)=>{if(t===P)return;P=t,h({type:"mg-steady",on:t}),Q()};function y(t,d,w,C){if(!k){if(k=!0,s)f.clearTimeout(s);p("on")}let _=l.feed(t,d,w,C);if(!_)return;if(_.type==="steady")R(_.on);else if(_.type==="cancel")R(!1);else if(_.type==="putt")z(_.power,"swing")}function z(t,d){if(!u||!u.yourTurn)return;h({type:"mg-putt",id:`${A}-${++j}`,power:Math.round(t*1000)/1000,via:d}),b=performance.now(),P=!1,l.arm(!1);try{f.navigator.vibrate&&f.navigator.vibrate(30)}catch{}if(T)f.clearTimeout(T);T=f.setTimeout(()=>{if(u&&u.yourTurn)l.arm(!0),Q()},1500),Q()}let i=(t)=>{let d=t.rotationRate;if(!d||d.alpha==null)return;y(performance.now()/1000,d.alpha||0,d.beta||0,d.gamma||0)};function M(){I(f,"devicemotion",i),s=f.setTimeout(()=>{if(!k)p("none")},1500)}let S=f.DeviceMotionEvent;if(!S)m="none";else if(typeof S.requestPermission==="function")m="ask";else M();I(x("ask"),"click",()=>{S.requestPermission().then((t)=>{if(t==="granted")p("unknown"),M();else p("blocked")},()=>p("blocked"))});let U=0,D=null,F=(t)=>{if(U=t,h({type:"mg-aim",dir:t}),D)f.clearInterval(D),D=null;if(t)D=f.setInterval(()=>h({type:"mg-aim",dir:U}),250);for(let d of $.querySelectorAll("[data-dir]"))d.classList.toggle("is-down",Number(d.dataset.dir)===t)};for(let t of $.querySelectorAll("[data-dir]")){I(t,"pointerdown",(d)=>{d.preventDefault();try{t.setPointerCapture(d.pointerId)}catch{}F(Number(t.dataset.dir))});for(let d of["pointerup","pointercancel","lostpointercapture"])I(t,d,()=>{if(U===Number(t.dataset.dir))F(0)});I(t,"contextmenu",(d)=>d.preventDefault())}let E=x("swing"),V=E.querySelector("i"),G=null,X=()=>m==="none"||m==="blocked";I(E,"pointerdown",(t)=>{if(!X()||!u||!u.yourTurn||t.target===x("ask"))return;G={y:t.clientY,p:0};try{E.setPointerCapture(t.pointerId)}catch{}}),I(E,"pointermove",(t)=>{if(!G)return;G.p=Math.min(1,Math.max(0,(t.clientY-G.y)/(E.clientHeight*0.75))),V.style.height=`${G.p*100}%`});for(let t of["pointerup","pointercancel"])I(E,t,()=>{if(!G)return;let d=G.p;if(G=null,V.style.height="0",t==="pointerup"&&d>0.04)z(d,"touch")});I(g,"visibilitychange",()=>{if(h({type:"mg-hidden",on:g.hidden}),g.hidden){if(F(0),R(!1),l.state!=="off")l.arm(!0)}});function Q(){let t=u;if(!t)return;$.style.setProperty("--c",t.you.color||"#ffd23f"),x("hole").textContent=`HOLE ${t.hole.n}/${t.hole.of}  ${t.hole.name}`,x("par").textContent=t.hole.par!=null?`PAR ${t.hole.par}`:"";let d=!!t.yourTurn;$.classList.toggle("is-turn",d);let w="",C="",_=t.you.toGo!=null?`${t.you.toGo.toFixed(1)} M TO THE CUP`:"";if(t.final){let O=t.rows.findIndex((te)=>te.id===B());w=O>=0?`${We(O+1)} PLACE`:"FINAL SCORES",C=pe(t.you.total)}else if(t.phase==="card")w=`AFTER HOLE ${t.hole.n}`,C=`YOU: ${pe(t.you.total)}`;else if(d)w=`STROKE ${t.stroke}`,C=_;else if(t.you.sunk)w=t.you.strokes===1?"HOLE IN ONE!":`IN ${t.you.strokes}`,C=t.up?`${t.up.name} IS PUTTING`:"";else{w=t.up?t.up.id===B()?`STROKE ${t.you.strokes}`:`${t.up.name} IS PUTTING`:`PAR ${t.hole.par}`;let O=t.waitingFor;C=[O===0?"YOU ARE NEXT":O>0?`${O} PUTT${O===1?"":"S"} BEFORE YOURS`:"",_].filter(Boolean).join(`
`)}if(x("big").textContent=w,x("sub").textContent=C,w===`PAR ${t.hole.par}`)x("par").textContent="";if(d){let O=performance.now()-b<1500&&l.state==="off",te=O?"":m==="ask"?"":X()?"PULL BACK":P?"PUTT!":"HOLD STILL",oe=O?"":m==="ask"?"YOUR PHONE IS THE PUTTER":X()?"DRAG DOWN, THEN LET GO":P?"SWING BACK, THEN THROUGH":"LIKE A PUTTER AT THE BALL";x("word").textContent=te,x("hint").textContent=oe,x("ask").hidden=m!=="ask",E.classList.toggle("is-steady",P&&!X())}x("rows").innerHTML=t.rows.map((O)=>`<div class="mg-row${O.id===B()?" is-me":""}${t.up&&t.up.id===O.id?" is-up":""}"><em style="background:${le(O.color)}"></em><span>${le(O.name)}</span><u>${O.sunk?`IN ${O.hole}`:t.phase==="card"||t.final?"":O.hole?`${O.hole} HERE`:""}</u><b>${O.total}</b></div>`).join("")}return{onMessage(t){if(!t||t.type!=="mg-view")return;let d=u&&u.yourTurn?u.stroke:null;u=t;let w=t.yourTurn?t.stroke:null;if(w!==d||w!=null&&q!==w){if(q=w,P=!1,T)f.clearTimeout(T),T=null;if(l.arm(w!=null),w==null)F(0)}Q()},show(){if(h({type:"mg-hello"}),m!=="unknown")h({type:"mg-motion",state:m})},letGo(){F(0)},release(){for(let t of W)t();if(D)f.clearInterval(D);if(s)f.clearTimeout(s);if(T)f.clearTimeout(T);a.innerHTML=""},feedMotion:y,get state(){return{motion:m,steady:P,detector:l.state,view:u}}}}var ce=`// Shared sample content and small drawing helpers for the style stills.
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
`;var he=`// Style B, rounds 2 to 4. Every setting and every word lives here, so each can be changed in one place.
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
`;var fe=`// The golf balls players make: an outfit, a pattern and two colours (round 5: the same things bowling's ball
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
`;var xe=`"use strict";
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
`;var ue=`"use strict";
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
`;var ge=`"use strict";
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
`;var be=`"use strict";
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
`;var me=`// Mini golf ball outfits, theme: ANIMALS. Same format as OUTFITS in balls.js (every shape written out, no helpers needed).
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
`;var we=`// The one place the outfit files join the list in balls.js. (Round 6: the player never sees a theme; the files
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
`;var ye=`// DRAW YOUR OWN outfit (round 5, Lakota: "a draw your own outfit option inspired by sky scramble").
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
`;var Ae='// Style B: the wooden course signs, every screen, with its movement (rounds 2 to 4).\n// The title screen, the setup screens and the dressed golf balls (round 4) are in setup.js, built from these pieces.\n// Each screen is { seq, frame(t), html, tracks, dur, still }. The stage plays `tracks` against one clock,\n// so a still is just the clip stopped at one moment. Sizes sit on the game\'s 4px grid.\n"use strict";\n(function () {\n  const OUT = "#3a2114", WOOD = "#b87440", WOOD_HI = "#d39a5e", WOOD_LO = "#8a5230", CREAM = "#fff1c9",\n    RED = "#b8323a", GOLD = "#ffd23f", GREEN = "#17694f", PAPER = "#f6ecd0", LINE = "#c9b78f", PEN = "#2a2134";\n  const step = (s) => `polygon(${s}px 0, calc(100% - ${s}px) 0, calc(100% - ${s}px) ${s}px, 100% ${s}px, 100% calc(100% - ${s}px), calc(100% - ${s}px) calc(100% - ${s}px), calc(100% - ${s}px) 100%, ${s}px 100%, ${s}px calc(100% - ${s}px), 0 calc(100% - ${s}px), 0 ${s}px, ${s}px ${s}px)`;\n  const grain = (c) => [\n    `linear-gradient(${c},${c}) 12% 30%/64px 4px no-repeat`, `linear-gradient(${c},${c}) 70% 22%/96px 4px no-repeat`,\n    `linear-gradient(${c},${c}) 38% 72%/120px 4px no-repeat`, `linear-gradient(${c},${c}) 86% 64%/48px 4px no-repeat`,\n    `linear-gradient(${c},${c}) 6% 84%/40px 4px no-repeat`, `linear-gradient(${c},${c}) 54% 44%/56px 4px no-repeat`,\n  ].join(",");\n\n  const css = `\n.sB { font-family: "FoxBox Soft"; font-weight: 700; color: ${CREAM}; line-height: 1; }\n.sB .px { font-family: "FoxBox Pixel"; font-weight: 400; }\n.sB .dg { font-family: "FoxBox Pixel"; font-weight: 400; font-size: 0.74em; }\n.sB .grp { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }\n.sB .pl { position: absolute; border: 8px solid ${OUT}; clip-path: ${step(8)}; background: ${grain("rgba(58,33,20,0.3)")}, var(--w, ${WOOD});\n  box-shadow: inset 0 8px 0 var(--hi, ${WOOD_HI}), inset 0 -8px 0 var(--lo, ${WOOD_LO});\n  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; white-space: nowrap; }\n.sB .pl.red { --w: ${RED}; --hi: #e04a40; --lo: #8a2430; }\n.sB .pl.gold { --w: ${GOLD}; --hi: #fff0a0; --lo: #d9a520; color: ${OUT}; }\n.sB .pl.col { --w: var(--pc); --hi: rgba(255,255,255,0.45); --lo: rgba(58,33,20,0.3); color: ${OUT}; }\n.sB .pl .nail { position: absolute; width: 8px; height: 8px; background: ${OUT}; }\n.sB .paint { text-shadow: 4px 4px 0 ${OUT}; }\n.sB .post { position: absolute; width: 48px; background: ${WOOD_LO}; border: 8px solid ${OUT}; border-bottom: 0; box-shadow: inset 8px 0 0 ${WOOD}; }\n.sB .rope { position: absolute; width: 16px; background: #e9d8a6; border-left: 4px solid ${OUT}; border-right: 4px solid ${OUT}; }\n.sB .ol { filter: drop-shadow(4px 0 0 ${OUT}) drop-shadow(-4px 0 0 ${OUT}) drop-shadow(0 4px 0 ${OUT}) drop-shadow(0 -4px 0 ${OUT}); }\n.sB .ol8 { filter: drop-shadow(8px 0 0 ${OUT}) drop-shadow(-8px 0 0 ${OUT}) drop-shadow(0 8px 0 ${OUT}) drop-shadow(0 -8px 0 ${OUT}); }\n.sB .bunt { position: absolute; left: 0; right: 0; top: 0; height: 110px; }\n.sB .bunt::before { content: ""; position: absolute; left: 0; right: 0; top: 16px; height: 8px; background: ${OUT}; }\n.sB .bunt .f { position: absolute; top: 20px; }\n.sB .hio.hot { color: ${CREAM} !important; }\n.sB .sign { display: block; }\n/* clipboard and paper card */\n.sB .board { position: absolute; padding: 52px 40px 40px; isolation: isolate; }\n.sB .board::before { content: ""; position: absolute; inset: 0; z-index: -1; border: 8px solid ${OUT}; clip-path: ${step(8)}; background: ${grain("rgba(58,33,20,0.3)")}, ${WOOD};\n  box-shadow: inset 0 8px 0 ${WOOD_HI}, inset 0 -8px 0 ${WOOD_LO}; } /* the wood is a layer of its own, so a row can fall off the card without being cut at the edge */\n.sB .clip { position: absolute; height: 72px; width: 280px; background: #bcc5d3; border: 8px solid ${OUT}; box-shadow: inset 0 8px 0 #e8edf4, inset 0 -8px 0 #8d97a8; }\n.sB .paper { background: ${PAPER}; border: 4px solid ${OUT}; height: 100%; color: ${PEN}; padding: 22px 28px; box-shadow: 8px 8px 0 rgba(58,33,20,0.45); }\n.sB .ptop { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }\n.sB .ptop { white-space: nowrap; }\n.sB .ptop .a { font-size: var(--ta, 30px); color: ${GREEN}; } .sB .ptop .b { font-size: var(--tb, 24px); color: ${RED}; }\n.sB .g.hd > span.th { font-size: var(--th, 24px); }\n.sB .g { position: relative; display: grid; grid-template-columns: var(--cols); align-items: center; height: 64px; border-bottom: 4px solid ${LINE}; background: ${PAPER}; }\n.sB .g > * { text-align: center; height: 100%; display: flex; align-items: center; justify-content: center; border-left: 4px solid ${LINE}; font-size: var(--nm, 44px); }\n.sB .g > *:first-child { border-left: 0; }\n.sB .g > span:not(.nm) { font-family: "FoxBox Pixel"; font-weight: 400; font-size: 34px; }\n.sB .g b { font-weight: 400; display: inline-block; }\n.sB .g .nm { justify-content: flex-start; padding-left: 14px; gap: 16px; white-space: nowrap; }\n.sB .g .chip { width: 28px; height: 28px; border: 4px solid ${OUT}; flex: none; }\n.sB .g.hd { height: 50px; background: #dfe8c0; border-top: 4px solid ${LINE}; }\n.sB .g.hd > * { font-family: "FoxBox Pixel"; font-weight: 400; font-size: 20px; color: ${GREEN}; }\n.sB .g.par > * { color: #8a7a5c; } .sB .g.par > span:not(.nm) { font-size: 28px; } .sB .g.par .nm { font-size: 36px; }\n.sB .g.lead { background: #ffe9a0; z-index: 2; }\n.sB .g .ace { background: ${GOLD}; border: 4px solid ${OUT}; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; font-style: normal; }\n.sB .g > span.tt { font-size: 38px; }\n.sB .g.lead .tt b { background: ${RED}; color: ${CREAM}; padding: 8px 12px 6px 14px; }\n.sB .g > span.rk { font-size: 22px; color: #8a7a5c; }\n.sB .g .wcup { margin-left: 6px; display: none; } .sB .g.lead .wcup { display: block; }\n.sB .g.loose { outline: 4px solid ${OUT}; }\n.sB .herow { position: absolute; z-index: 5; color: ${PEN}; outline: 4px solid ${OUT}; box-shadow: 8px 8px 0 rgba(58,33,20,0.45); }\n.sB .herow .g { border-bottom: 0; }\n.sB .lab { position: absolute; }\n.sB .zoom { position: absolute; border: 8px solid ${OUT}; image-rendering: pixelated; background-repeat: no-repeat; box-shadow: 12px 12px 0 rgba(26,28,44,0.5); }\n.sB .dim { position: absolute; inset: 0; background: rgba(26,28,44,0.86); }\n/* phone */\n#ph.sB { background: repeating-conic-gradient(#17694f 0 25%, #1b7558 0 50%) 0 0/120px 120px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }\n.sB .pp { position: relative; border: 4px solid ${OUT}; clip-path: ${step(4)}; background: ${grain("rgba(58,33,20,0.3)")}, var(--w, ${WOOD});\n  box-shadow: inset 0 4px 0 var(--hi, ${WOOD_HI}), inset 0 -4px 0 var(--lo, ${WOOD_LO}); }\n.sB .pp.gold { --w: ${GOLD}; --hi: #fff0a0; --lo: #d9a520; color: ${OUT}; }\n.sB .pp.col { --w: var(--pc); --hi: rgba(255,255,255,0.45); --lo: rgba(58,33,20,0.3); color: ${OUT}; }\n.sB .phead { display: flex; align-items: center; justify-content: space-between; padding: 14px 14px; }\n.sB .phead .t { font-size: 13px; } .sB .phead .n { font-size: 30px; margin-top: 8px; }\n.sB .phead .par { padding: 10px 10px; font-size: 13px; }\n.sB .info { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 2px 4px; min-height: 26px; justify-content: center; }\n.sB .info .s { font-size: 20px; text-shadow: 2px 2px 0 ${OUT}; } .sB .info .d { font-size: 25px; text-shadow: 2px 2px 0 ${OUT}; }\n.sB .mat { flex: 1; min-height: 300px; display: flex; padding: 16px; border: 4px solid ${OUT};\n  background: repeating-linear-gradient(90deg, #e04a40 0 32px, #f4f4f0 32px 64px); }\n.sB .mat > div { flex: 1; border: 4px solid ${OUT}; background: repeating-conic-gradient(#1e8562 0 25%, #27a074 0 50%) 0 0/96px 96px;\n  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; padding: 18px 10px; }\n.sB .mat .w { text-shadow: 4px 4px 0 ${OUT}; line-height: 1.04; }\n.sB .mat .ic { margin-bottom: 14px; display: flex; flex-direction: column; align-items: center; gap: 6px; }\n.sB .mat.go > div { background: ${GOLD}; color: ${OUT}; }\n.sB .mat.go .w { text-shadow: 4px 4px 0 #fff0a0; }\n/* the aiming screen: two big arrow pads are the main thing. The view button is small, OK is at the bottom. */\n.sB .vcol { flex: 1; display: flex; flex-direction: column; gap: 12px; min-height: 0; }\n.sB .birdb { align-self: center; display: flex; align-items: center; gap: 10px; padding: 9px 14px 8px; font-size: 11px; }\n.sB .birdb { background: var(--w, ${WOOD}); } /* no wood grain: the letters are small */\n.sB .birdb.on { --w: ${GOLD}; --hi: #fff0a0; --lo: #d9a520; color: ${OUT}; }\n.sB .aimt { text-align: center; font-size: 24px; text-shadow: 2px 2px 0 ${OUT}; margin-top: 2px; }\n.sB .pads { flex: 1; display: flex; gap: 12px; min-height: 0; }\n.sB .pad { flex: 1; display: flex; align-items: center; justify-content: center; }\n.sB .againb { align-self: center; display: flex; align-items: center; gap: 10px; padding: 14px 18px 13px; font-size: 13px; background: var(--w, ${WOOD}); }\n.sB .okb { height: 112px; display: flex; align-items: center; justify-content: center; font-size: 52px; }\n.sB .down { filter: brightness(0.8); }\n.sB .now { padding: 14px; text-align: center; font-size: 30px; white-space: nowrap; }\n.sB .ppr { background: ${PAPER}; border: 4px solid ${OUT}; color: ${PEN}; padding: 8px 10px; flex: 1; box-shadow: 4px 4px 0 rgba(58,33,20,0.5); }\n.sB .pr { display: grid; grid-template-columns: 26px 1fr auto 44px; align-items: center; height: 50px; border-bottom: 2px solid ${LINE}; padding: 0 4px; }\n.sB .pr.h { height: 26px; font-family: "FoxBox Pixel"; font-weight: 400; font-size: 9px; color: ${GREEN}; text-align: right; }\n.sB .pr .c { width: 16px; height: 16px; border: 2px solid ${OUT}; }\n.sB .pr .n { font-size: 26px; white-space: nowrap; }\n.sB .pr .hr, .sB .pr .t { font-family: "FoxBox Pixel"; font-weight: 400; font-size: 18px; text-align: right; }\n.sB .pr .hr { color: #8a7a5c; }\n.sB .pr b { font-weight: 400; display: inline-flex; align-items: center; gap: 8px; }\n.sB .pr b.in { color: ${GREEN}; }\n.sB .pr .tag { font-family: "FoxBox Pixel"; font-weight: 400; font-style: normal; font-size: 10px; line-height: 1; background: ${GREEN}; color: ${CREAM}; border: 2px solid ${OUT}; padding: 5px 4px 4px 5px; white-space: nowrap; }\n.sB .pr .tag .dg { font-size: 1em; }\n.sB .pr.you { background: #ffe9a0; outline: 3px solid ${OUT}; }\n`;\n\n  // ---- pieces ----\n  const nails = `<i class="nail" style="left:12px;top:12px"></i><i class="nail" style="right:12px;top:12px"></i><i class="nail" style="left:12px;bottom:12px"></i><i class="nail" style="right:12px;bottom:12px"></i>`;\n  const pl = (x, y, w, h, cls, inner, extra, id) => `<div class="pl ${cls || ""}"${id ? ` id="${id}"` : ""} style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${extra || ""}">${nails}${inner}</div>`;\n  const post = (x, y) => `<div class="post" style="left:${x}px;top:${y}px;height:${1400 - y}px"></div>`;\n  const rope = (x, y0, y1) => `<div class="rope" style="left:${x}px;top:${y0}px;height:${y1 - y0}px"></div>`;\n  const grp = (id, inner, ox, oy) => `<div class="grp" id="${id}"${ox != null ? ` style="transform-origin:${ox}px ${oy}px"` : ""}>${inner}</div>`;\n  const PENNANT = ["#########", "#########", "#########", ".#######.", ".#######.", "..#####..", "..#####..", "...###...", "...###...", "....#...."];\n  const BURST = ["....#....", ".#..#..#.", "..#...#..", ".........", "##.....##", ".........", "..#...#..", ".#..#..#.", "....#...."];\n  const BURST2 = [".....#.....", "...........", "..#.....#..", "...........", "...........", "#.........#", "...........", "...........", "..#.....#..", "...........", ".....#....."];\n  const bunting = () => {\n    let h = `<div class="bunt">`;\n    for (let i = 0; i < 16; i++) h += `<div class="f ol" style="left:${28 + i * 120}px">${pix(PENNANT, 8, { "#": PLAYERS[i % 8].c })}</div>`;\n    return h + `</div>`;\n  };\n  const star = (x, y, s, cls) => `<div class="abs ol8 ${cls || "star"}" style="left:${x}px;top:${y}px">${pix(SPR.star, s, { "#": GOLD })}</div>`;\n\n  // ---- lettering that fits its plank ----\n  const cv = document.createElement("canvas").getContext("2d");\n  function fit(text, maxW, max, unit) {\n    cv.font = `700 100px "FoxBox Soft"`;\n    const u = unit || 4;\n    return Math.max(u, Math.min(max, Math.floor(((maxW / cv.measureText(text).width) * 100) / u) * u));\n  }\n  // one line, or two if the words are long\n  function lines(text, maxW, maxH, max) {\n    const one = fit(text, maxW, Math.min(max, maxH));\n    const sp = text.split(" ");\n    if (sp.length > 1) {\n      let best = null;\n      for (let k = 1; k < sp.length; k++) {\n        const a = sp.slice(0, k).join(" "), b = sp.slice(k).join(" ");\n        const s = Math.min(fit(a, maxW, max), fit(b, maxW, max), Math.floor(maxH / 2 / 4) * 4);\n        if (!best || s > best.s) best = { s, t: [a, b] };\n      }\n      if (best.s > one * 1.1) return { size: best.s, list: best.t };\n    }\n    return { size: one, list: [text] };\n  }\n  function scoreSign(x, y, w, h, text, id) {\n    const st = lines(text, w - 80, h - 48, 190);\n    return pl(x, y, w, h, "", `<div class="paint" style="font-size:${st.size}px;line-height:0.94;text-shadow:8px 8px 0 ${OUT};margin-top:-${Math.round(st.size * 0.08)}px">${st.list.map((l) => dg(esc(l))).join("<br>")}</div>`, "", id);\n  }\n  function namePl(x, y, w, h, p, id) {\n    const s = fit(p.n, w - 72, Math.floor((h * 0.78) / 4) * 4);\n    return pl(x, y, w, h, "col", `<div style="font-size:${s}px;margin-top:-${Math.round(s * 0.1)}px">${esc(p.n)}</div>`, `--pc:${p.c}`, id);\n  }\n\n  // ---- the paper score card ----\n  // rows: [{ r (a table row), id, rank0, rank1, total0, total1 }], in the order they sit on the paper\n  function card(rows, o) {\n    const cols = o.cols || "64px 1fr 110px 110px 110px 160px";\n    let h = `<div style="${o.vars || ""}"><div class="ptop"><span class="a px">${TV_WORDS.cardTitle}</span><span class="b px">${o.title}</span></div><div style="--cols:${cols};${o.nm ? `--nm:${o.nm}px` : ""}">`;\n    h += `<div class="g hd"><span class="rk"></span><span class="nm" style="padding-left:14px">${TV_WORDS.cardHole}</span><span>1</span><span>2</span><span>3</span><span class="th">${TV_WORDS.cardTotal}</span></div>`;\n    h += `<div class="g par"><span class="rk"></span><span class="nm">${TV_WORDS.cardPar}</span>${PAR.map((p) => `<span>${p}</span>`).join("")}<span>${PAR.reduce((a, b) => a + b, 0)}</span></div>`;\n    for (const w of rows) {\n      const r = w.r;\n      h += `<div class="g${w.lead ? " lead" : ""}" id="row-${r.i}"><span class="rk">${w.rank0 != null ? `<b class="k0">${w.rank0}</b>` : ""}<b class="k1">${w.rank1}</b></span>` +\n        `<span class="nm">${o.chip ? o.chip(r) : `<i class="chip" style="background:${r.c}"></i>`}${esc(r.n)}<span class="ol wcup">${pix(SPR.cup, 4, { "#": GOLD })}</span></span>` +\n        r.s.map((v, k) => `<span class="h h${k + 1}"><b>${v === null ? "" : v === 1 ? `<i class="ace">1</i>` : v}</b></span>`).join("") +\n        `<span class="tt">${w.total0 != null ? `<b class="v0">${w.total0}</b>` : ""}<b class="v1">${w.total1}</b></span></div>`;\n    }\n    return h + `</div></div>`;\n  }\n  const board = (id, x, y, w, h, inner) =>\n    grp(id, `<div class="board" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><div class="paper">${inner}</div></div><div class="clip" style="left:${x + w / 2 - 140}px;top:${y - 36}px"></div>`, x + w / 2, y);\n\n  const seqOf = (name) => (window.SEQ && window.SEQ[name]) || { fps: 30, files: [], cup: [], bump: [], mark: 0 };\n\n  // ---- TV screens ----\n  const tv = {\n    // The hole sign. Stands for about 3 seconds while the camera waits, fades, then the tour starts.\n    banner: (o) => {\n      const long = o.screen === "banner3";\n      const n = long ? 3 : 1, name = HOLES[n - 1], par = PAR[n - 1];\n      const s = fit(name, 940, 168);\n      return {\n        seq: long ? "banner3" : "banner",\n        frame: (t) => (long || t < 4.0 ? 0 : 41 + (t - 4.0) * 30),\n        html: grp("sign",\n          post(600, 760) + post(1272, 760) +\n          pl(770, 640, 380, 96, "red", `<div class="px paint" style="font-size:40px">${TV_WORDS.hole(n)}</div>`) +\n          pl(440, 724, 1040, 216, "", `<div class="paint" style="font-size:${s}px;text-shadow:8px 8px 0 ${OUT};margin-top:-${Math.round(s * 0.08)}px">${esc(name)}</div>`) +\n          pl(810, 928, 300, 100, "gold", `<div class="px" style="font-size:40px">${TV_WORDS.par(par)}</div>`)),\n        tracks: [["#sign", "rise", 0.4, { from: 520 }], ["#sign", "fadeOut", 3.6, { dur: 0.4 }]],\n        dur: 5.2, still: 2,\n      };\n    },\n\n    // A ball drops in: the score name and the player\'s name. SETTINGS.ballInPlace says where.\n    ballin: (o) => {\n      const p = byName("AUNT ROSIE"), q = seqOf("ballin"), text = scoreName(2, PAR[0]);\n      const m = q.mark, last = Math.round((135.0 - 130.9) * 30) - 2;\n      const cup = q.cup[Math.min(q.cup.length - 1, Math.round(m * 30) + 30)] || [960, 893];\n      let html, tracks;\n      if (SETTINGS.ballInPlace === "cup") {\n        // nailed to the flag pole, a little above the cup\n        const cx = Math.round(cup[0] / 4) * 4, top = Math.round((cup[1] - 424) / 4) * 4;\n        html = grp("bi", scoreSign(cx - 220, top, 440, 150, text) + namePl(cx - 200, top + 158, 400, 92, p));\n        tracks = [["#bi", "drop", m + 0.1, { from: -760, b: 28 }], ["#bi", "upOut", m + 2.35, { to: -760 }]];\n      } else if (SETTINGS.ballInPlace === "bottom") {\n        html = grp("bi", post(520, 980) + post(1352, 980) + scoreSign(420, 948, 480, 112, text) + namePl(908, 948, 592, 112, p));\n        tracks = [["#bi", "rise", m + 0.1, { from: 200, b: 12 }], ["#bi", "upOut", m + 2.35, { to: 200, dur: 0.25 }]];\n      } else {\n        html = grp("bi", rope(700, -900, 96) + rope(1204, -900, 96) + scoreSign(600, 88, 720, 232, text) +\n          rope(760, 316, 352) + rope(1144, 316, 352) + namePl(680, 348, 560, 116, p));\n        tracks = [["#bi", "drop", m + 0.1, { from: -520 }], ["#bi", "upOut", m + 2.35, { to: -520 }]];\n      }\n      return { seq: "ballin", frame: (t) => Math.min(last, t * 30), html, tracks, dur: m + 2.75, still: m + 1.4 };\n    },\n\n    // What the ball-in sign says for each score. A reference picture, not a game moment.\n    names: () => {\n      const list = [["BIRDIE", "KIT", 2, 3], ["PAR", "AUNT ROSIE", 2, 2], ["BOGEY", "DESHAWN", 3, 2], ["2X BOGEY", "BIG TOM", 4, 2], ["3X BOGEY", "JUNEBUG", 5, 2], ["4X BOGEY", "MAYA", 6, 2]];\n      let h = "";\n      list.forEach(([, who, strokes, par], k) => {\n        const x = 100 + (k % 3) * 600, y = 130 + Math.floor(k / 3) * 460, text = scoreName(strokes, par);\n        h += rope(x + 100, y - 70, y + 8) + rope(x + 404, y - 70, y + 8) + scoreSign(x, y, 520, 200, text) +\n          rope(x + 140, y + 196, y + 228) + rope(x + 364, y + 196, y + 228) + namePl(x + 40, y + 224, 440, 104, byName(who));\n        if (strokes < par) h += star(x - 48, y - 52, 10, "s0") + star(x + 458, y - 52, 10, "s0");\n      });\n      return { seq: "card", frame: () => 0, html: h, tracks: [], dur: 1, still: 0 };\n    },\n\n    // Hole in one: the big sign. The name hangs under it, well clear of the cup.\n    ace: () => {\n      const p = byName("PRIYA"), q = seqOf("ace"), m = q.mark;\n      const last = Math.round((241.7 - 236.9) * 30) - 8;\n      return {\n        seq: "ace", frame: (t) => Math.min(last, t * 30),\n        html:\n          grp("nm", rope(720, 400, 590) + rope(1184, 400, 590) + namePl(620, 582, 680, 150, p)) +\n          grp("big", rope(560, -900, 150) + rope(1344, -900, 150) +\n            pl(330, 130, 1260, 420, "", `<div style="position:absolute;inset:16px;border:8px solid ${GOLD}"></div>\n              <div class="px" style="font-size:30px;color:${CREAM};margin-bottom:26px;text-shadow:4px 4px 0 ${OUT}">${TV_WORDS.aceTop(2, HOLES[1])}</div>\n              <div class="hio" style="font-size:182px;color:${GOLD};text-shadow:8px 8px 0 ${OUT};margin-top:-10px">${TV_WORDS.ace}</div>`)) +\n          star(252, 88, 14) + star(1436, 88, 14) + star(190, 470, 10) + star(1620, 470, 10) + star(120, 290, 8) + star(1712, 340, 8),\n        tracks: [\n          ["#big", "drop", m + 0.1, { from: -640, dur: 0.6, b: 56 }], ["#big", "shake", m + 0.43, { amp: 12, dur: 0.35 }],\n          ["#nm", "drop", m + 0.75, { from: -190, dur: 0.4, b: 20 }],\n          [".star", "pop", m + 0.6, { stagger: 0.08, big: 1.3 }], [".star", "twinkle", m + 1.2, { period: 0.3 }],\n          [".hio", "blink", m + 0.7, { name: "hot", period: 0.14, until: 1.4 }],\n          ["#big", "upOut", m + 3.7, { to: -760 }], ["#nm", "upOut", m + 3.7, { to: -760 }], [".star", "hide", m + 3.7],\n        ],\n        dur: m + 4.1, still: m + 2.4,\n      };\n    },\n\n    // A plain knock: only the flash, drawn by the stage where the balls met. Nothing else on screen.\n    knock: () => {\n      const q = seqOf("knock");\n      return { seq: "knock", frame: (t) => t * 30, html: "", tracks: [], dur: q.files.length / 30 || 2.4, still: (q.mark || 1) + 0.13 };\n    },\n\n    // Score card after a hole. The new scores get written in, then the rows move so the best score is on top.\n    scorecard: () => {\n      const before = ranked(table(1)), after = table(2), order1 = ranked(after);\n      const rows = before.map((b) => { const a = after[b.i]; return { r: a, rank0: b.rank, rank1: a.rank, total0: b.total, total1: a.total }; });\n      // Round 3: the whole card is slower (Lakota: "slow it down a bit"). It was 6.8 s, it is 9.4 s.\n      const tracks = [["#bd", "rise", 0.3, { from: 1040, dur: 0.7 }]];\n      const W0 = 1.7, GAP = 0.26, MOVE = W0 + 8 * GAP + 0.7, SET = MOVE + 1.35;\n      rows.forEach((w, k) => {\n        const id = `#row-${w.r.i}`, tw = W0 + k * GAP, to = order1.findIndex((x) => x.i === w.r.i);\n        tracks.push([`${id} .h2 b`, "pop", tw, { big: 1.35, dur: 0.3 }], [`${id} .v0`, "swapOut", tw], [`${id} .v1`, "swapIn", tw], [`${id} .v1`, "pop", tw, { big: 1.25, dur: 0.3 }]);\n        tracks.push([id, "move", MOVE, { dy: (to - k) * 64, dur: 1.15 }], [`${id} .k0`, "swapOut", SET], [`${id} .k1`, "swapIn", SET]);\n        if (w.r.lead) tracks.push([id, "blink", SET, { name: "lead", period: 0.2, until: 0.8 }], [id, "cls", SET + 0.8, { name: "lead" }]);\n      });\n      tracks.push(["#bd", "upOut", 8.85, { to: 1040, dur: 0.45 }]);\n      return {\n        seq: "card", frame: (t) => t * 30,\n        html: board("bd", 420, 118, 1080, 840, card(rows, { title: TV_WORDS.afterHole(2) })),\n        tracks, dur: 9.4, still: 7.2,\n      };\n    },\n\n    final: () => finals(false),\n    tie: () => finals(true),\n\n    // The TV corner list with the score name (round 3). The list is the game\'s own drawing, so the picture\n    // is made by seq.mjs in the game\'s own pixels and letters. Here it is only shown: whole, and close up.\n    corner: () => ({ seq: "corner", frame: () => 0, html: "", tracks: [], dur: 1, still: 0 }),\n    "corner-close": () => {\n      const Z = 8, x0 = 362, y0 = 2, w = 118, h = 78; // the piece of the 480 x 270 picture that is shown, 8 times bigger\n      return {\n        seq: "corner", frame: () => 0,\n        html: `<div class="dim"></div>` + pl(700, 96, 520, 104, "", `<div class="px paint" style="font-size:36px">CORNER LIST</div>`) +\n          `<div class="zoom" style="left:${960 - (w * Z + 16) / 2}px;top:228px;width:${w * Z + 16}px;height:${h * Z + 16}px;background-image:url(seq/corner/0000.png);background-size:${480 * Z}px ${270 * Z}px;background-position:${-x0 * Z}px ${-y0 * Z}px"></div>`,\n        tracks: [], dur: 1, still: 0,\n      };\n    },\n\n    // The bird\'s eye view (round 4). A player presses the small view button on the phone: the TV camera rises\n    // slowly until it looks down on the whole hole, and stays there until the button is pressed again or OK.\n    // The game has no view from above yet. This is the intended one, drawn by the game\'s own painter.\n    bird: () => {\n      const q = seqOf("bird"), N = q.files.length - 1, R = q.rise || 3, UP = 1.0, STAY = 3.2, DOWN = UP + R + STAY;\n      const last = (q.balls && q.balls[N]) || [], me = last.find((b) => b[1]) || [0, 1, 240, 135, 3], p = PLAYERS[me[0]] || PHONE.you;\n      const x = Math.round(me[2]) * 4, y = Math.round(me[3]) * 4;\n      return {\n        seq: "bird",\n        frame: (t) => (t < UP ? 0 : t < UP + R ? (t - UP) * 30 : t < DOWN ? N : t < DOWN + R ? N - (t - DOWN) * 30 : 0),\n        // from above a ball is only 2 squares wide, so here every ball is drawn at least 7 squares wide\n        paint: (g, k) => { for (const [id, , bx, by, r] of (q.balls && q.balls[k]) || []) if (r < 3) drawBall(g, bx, by, 3, q.colors[id], "none"); },\n        html: grp("tag", namePl(x - 110, y - 124, 220, 72, p) + `<div class="abs" style="left:${x - 4}px;top:${y - 56}px;width:8px;height:32px;background:${OUT}"></div>`),\n        tracks: [["#tag", "pop", UP + R + 0.1, { dur: 0.25 }], ["#tag", "hide", DOWN]],\n        dur: DOWN + R + 0.8, still: UP + R + 1.6, stills: { low: 0, top: UP + R + 1.6 },\n      };\n    },\n  };\n\n  // Final scores (round 3). The rows are read out from last place up, then the winner. Then every other row\n  // falls off the card, one after another, the card itself falls away, and only the winner\'s row is left.\n  // That row goes to the middle and the winner sign comes up over it. With a tie two rows are left.\n  function finals(tie) {\n    const r = ranked(table(3, tie)), big = SETTINGS.winnerSign === "big" && !tie;\n    const tops = tie ? r.slice(0, 2) : r.slice(0, 1), w = tops[0];\n    const rest = r.filter((x) => !x.lead).reverse(); // last place first\n    const rows = r.map((x) => ({ r: x, rank1: x.rank, total1: x.total, lead: x.lead }));\n    const cols = big ? "56px 1fr 92px 92px 92px 132px" : "64px 1fr 110px 110px 110px 160px";\n    const tracks = [["#bunt", "drop", 0.3, { from: -140, dur: 0.35, b: 12 }], ["#bunt .f", "wave", 0, { period: 0.45 }], ["#bd", "rise", 0.6, { from: 1040, dur: 0.6 }]];\n    // 1. the rows are read out\n    const R0 = 1.7, GAP = 0.36;\n    rest.forEach((x, k) => tracks.push([`#row-${x.i}`, "slideIn", R0 + k * GAP, { dx: 48, dur: 0.24 }]));\n    const tWin = R0 + (rest.length - 1) * GAP + 1.0;\n    tops.forEach((x) => tracks.push([`#row-${x.i}`, "slideIn", tWin, { dx: 48, dur: 0.24 }], [`#row-${x.i}`, "blink", tWin, { name: "lead", period: 0.16, until: 0.8, inv: true }]));\n    // 2. the other rows fall away, last place first\n    const F0 = tWin + 1.5, FG = 0.45, FALL = 2.35;\n    rest.forEach((x, k) => tracks.push([`#row-${x.i}`, "fall", F0 + k * FG, { dir: k % 2 ? -1 : 1, half: big ? 398 : 448 }]));\n    // 3. the winner\'s row comes loose (a copy of it that is not on the card), and the card falls away from under it\n    const TH = F0 + (rest.length - 1) * FG + FALL + 0.3, TB = TH + 0.6;\n    tracks.push(["#bd", "boardFall", TB, { rock: 1.0, drop: 1.3 }]);\n    // 4. the row hops, goes to the middle, and the winner sign comes up over it\n    const TM = TB + 2.3 + 0.2, TS = TM + 1.2;\n    const signX = big ? 490 : 556, rowY = tie ? [924, 1008] : [big ? 1000 : 836], rowS = tie ? 1.25 : big ? 1.25 : 1.5;\n    const goes = tops.map((x, k) => {\n      const go = { dur: 1.2, scale: rowS };\n      tracks.push([`#row-${x.i}`, "hide", TH], [`#hero-${x.i}`, "pop", TH, { big: 1.06, small: 1, dur: 0.3 }],\n        [`#hero-${x.i}`, "hop", TM + k * 0.12, { amp: 28, dur: 0.45 }], [`#hero-${x.i}`, "to", TM + 0.5, go]);\n      return go;\n    });\n    const setup = (root) => {\n      const ov = root.querySelector(".ov"), base = root.getBoundingClientRect();\n      tops.forEach((x, k) => {\n        const row = root.querySelector(`#row-${x.i}`), b = row.getBoundingClientRect();\n        const h = document.createElement("div"), c = row.cloneNode(true);\n        h.className = "herow"; h.id = `hero-${x.i}`;\n        h.style.cssText = `left:${b.left - base.left}px;top:${b.top - base.top}px;width:${b.width}px;height:${b.height}px;--cols:${cols};${big ? "--nm:40px" : ""}`;\n        c.removeAttribute("id"); c.classList.add("lead");\n        h.appendChild(c); ov.appendChild(h);\n        goes[k].dx = 960 - (b.left - base.left + b.width / 2);\n        goes[k].dy = rowY[k] - (b.top - base.top + b.height / 2);\n      });\n    };\n    let sign;\n    if (tie) {\n      const [a, b] = tops;\n      sign = grp("posts", post(200, 330) + post(560, 330)) +\n        `<div class="abs ol8" id="cup" style="left:${404 - 99}px;top:150px">${pix(SPR.cup, 18, { "#": GOLD })}</div>` +\n        pl(54, 340, 700, 104, "red", `<div class="px paint" style="font-size:34px">${TV_WORDS.tie}</div>`, "", "wn") +\n        namePl(64, 452, 680, 150, a, "n1") + namePl(64, 610, 680, 150, b, "n2") +\n        pl(164, 768, 480, 100, "", `<div class="paint" style="font-size:56px;margin-top:-6px">${dg(TV_WORDS.strokesEach(a.total))}</div>`, "", "st");\n    } else if (big) {\n      sign = grp("posts", post(180, 440) + post(712, 440)) +\n        `<div class="abs ol8" id="cup" style="left:${470 - 154}px;top:118px">${pix(SPR.cup, 28, { "#": GOLD })}</div>` +\n        star(140, 150, 10) + star(690, 150, 10) + star(84, 320, 8) + star(768, 320, 8) +\n        pl(190, 410, 560, 124, "red", `<div class="px paint" style="font-size:60px">${TV_WORDS.winner}</div>`, "", "wn") +\n        namePl(40, 542, 860, 264, w, "n1") +\n        pl(230, 814, 480, 112, "", `<div class="paint" style="font-size:68px;margin-top:-6px">${dg(TV_WORDS.strokes(w.total))}</div>`, "", "st");\n    } else {\n      sign = grp("posts", post(200, 330) + post(560, 330)) +\n        `<div class="abs ol8" id="cup" style="left:${404 - 99}px;top:150px">${pix(SPR.cup, 18, { "#": GOLD })}</div>` +\n        pl(184, 340, 440, 104, "red", `<div class="px paint" style="font-size:44px">${TV_WORDS.winner}</div>`, "", "wn") +\n        namePl(64, 452, 680, 200, w, "n1") +\n        pl(204, 660, 400, 100, "", `<div class="paint" style="font-size:60px;margin-top:-6px">${dg(TV_WORDS.strokes(w.total))}</div>`, "", "st");\n    }\n    tracks.push(["#posts", "rise", TS, { from: 800, dur: 0.55 }], ["#wn", "pop", TS + 0.5, { dur: 0.3 }], ["#n1", "pop", TS + 0.85, { big: 1.15, dur: 0.3 }]);\n    if (tie) tracks.push(["#n2", "pop", TS + 1.15, { big: 1.15, dur: 0.3 }]);\n    const tc = TS + (tie ? 1.6 : 1.3);\n    tracks.push(["#cup", "pop", tc, { big: 1.3, dur: 0.3 }], ["#cup", "bob", tc + 0.8, { amp: -8, period: 0.5 }], ["#st", "pop", tc + 0.45, { dur: 0.3 }]);\n    if (big) tracks.push([".star", "pop", tc + 0.2, { stagger: 0.1, big: 1.3 }], [".star", "twinkle", tc + 1.0, { period: 0.35 }]);\n    // the card stands in the middle now: the winner sign only comes once the card is gone\n    const cardAt = big ? [490, 170, 940, 840] : [440, 170, 1040, 840];\n    const dur = Math.round((tc + 0.45 + 1.9) * 10) / 10;\n    return {\n      seq: "final", frame: (t) => t * 30, setup,\n      html: grp("bunt", bunting()) + `<div class="grp" style="left:${signX}px">${sign}</div>` +\n        board("bd", ...cardAt, card(rows, { title: TV_WORDS.finalScores, cols, ...(big ? { nm: 40, vars: "--ta:24px;--tb:20px;--th:20px" } : { vars: "--ta:26px;--tb:22px" }) })),\n      tracks, dur, still: dur - 1.2, falls: [F0, TH, TB, TM, TS],\n    };\n  }\n\n  // ---- phone screens ----\n  const head = (n = PHONE.holeN, name = PHONE.holeName, par = PHONE.par) =>\n    `<div class="pp phead"><div><div class="px t">${PHONE_WORDS.holeOf(n, PHONE.holeOf)}</div><div class="n" style="text-shadow:2px 2px 0 ${OUT}">${esc(name.replace(/\\B\\w+/g, (m) => m.toLowerCase()))}</div></div><div class="pp gold par px">${PHONE_WORDS.par(par)}</div></div>`;\n\n  // Round 4: no person is drawn on the phone, ever. Words and arrows only.\n  const big = (list, max) => { const s = Math.min(...list.map((l) => fit(l, 290, max, 2))); return `<div class="w" style="font-size:${s}px">${list.join("<br>")}</div>`; };\n  // After OK the phone shows one square with plain words: green first, then gold when it is time to swing.\n  const mat1 = () => `<div class="mat" id="m1"><div>${big(PHONE_WORDS.step1, 72)}</div></div>`;\n  const mat2 = () => `<div class="mat go" id="m2"><div>${big(PHONE_WORDS.step2, 120)}</div></div>`;\n  // a big arrow on its own wooden pad. The whole pad is the button.\n  const pad = (id, flip) => `<div class="pp pad" id="${id}"><span class="ol" style="display:block;${flip ? "transform:scaleX(-1)" : ""}">${pix(arrowShaft(6, 6), 11, { "#": CREAM })}</span></div>`;\n  const BACKARROW = pix(["..#...", ".##...", "######", ".##...", "..#..."], 2, { "#": CREAM });\n  // after OK: a small button under the words takes you back to the arrows (round 5, Lakota: "Yes, a small AIM AGAIN button")\n  const again = () => `<div class="pp againb px" id="ag">${BACKARROW}<span>${PHONE_WORDS.aimAgain}</span></div>`;\n  const turnHtml = () => head() + `<div class="info"><span class="px s" style="color:${PHONE.you.c}">${PHONE_WORDS.stroke(PHONE.stroke)}</span><span class="d">${dg(PHONE_WORDS.toCup(PHONE.dist))}</span></div>` +\n    `<div class="vcol" id="aimv"><div class="pp birdb px" id="bv">${EYE}<span>${PHONE_WORDS.birdsEye}</span></div>` +\n    `<div class="px aimt">${PHONE_WORDS.aim}</div><div class="pads">${pad("al", false)}${pad("ar", true)}</div>` +\n    `<div class="pp gold okb px" id="ok">${PHONE_WORDS.ok}</div></div>` + mat1() + mat2() + again();\n  const EYE = pix(["..#####..", ".#wwwww#.", "#ww###ww#", "#ww###ww#", ".#wwwww#.", "..#####.."], 2, { "#": OUT, w: "#ffffff" });\n  const FLAG = pix(["####.", "#####", "####.", "#....", "#....", "#...."], 2, { "#": GREEN });\n  // strokes on this hole. A finished player gets the score name on a small green tag, then the flag, then the strokes.\n  const here = (n, sunk, cls, par) => `<b class="${cls || ""}${sunk ? " in" : ""}">${sunk ? `<i class="tag">${dg(shortName(n, par))}</i>${FLAG}` : ""}${n}</b>`;\n  // names get a little smaller, all by the same amount, so the longest name still fits beside the longest tag\n  const nameSize = () => {\n    cv.font = `400 10px "FoxBox Pixel"`;\n    const tag = Math.max(...[SHORT_ACE, "BIRDIE", "9X BOGEY"].map((s) => cv.measureText(s).width)) + 13;\n    const room = 322 - 26 - 44 - (tag + 8 + 10 + 8 + 18) - 10;\n    return Math.min(26, ...PLAYERS.map((p) => fit(p.n, room, 26, 1)));\n  };\n\n  const phone = {\n    // The player\'s turn (round 4). While aiming: the two big arrows, the small view button and OK. After OK:\n    // plain words only, AIM YOUR PHONE DOWN, and once the phone points down the one word SWING.\n    turn: () => ({\n      html: turnHtml(),\n      tracks: [\n        ["#al", "press", 0.5], ["#al", "press", 0.9], ["#ar", "press", 1.5],\n        // the view button: on for a while (the TV looks down on the hole), the arrows still work, then off again\n        ["#bv", "press", 2.3], ["#bv", "during", 2.3, { name: "on", dur: 2.0 }], ["#ar", "press", 3.0], ["#bv", "press", 4.3],\n        // OK: the aim is set. The arrows go away and the words come: first aim your phone down, then swing.\n        ["#ok", "press", 5.0, { dur: 0.14 }],\n        ["#aimv", "swapOut", 5.14], ["#ag", "swapIn", 5.14], ["#m1", "swapIn", 5.14], ["#m1", "pop", 5.14, { big: 1.04, dur: 0.16, small: 0.97 }],\n        ["#m1", "swapOut", 7.3], ["#m2", "swapIn", 7.3], ["#m2", "pop", 7.3, { big: 1.04, dur: 0.16, small: 0.97 }],\n      ],\n      dur: 9.5, still: 1.2, stills: { aim: 1.2, bird: 3.5, down: 6.2, swing: 8.5 },\n    }),\n    // AIM AGAIN (round 5): the aim was set, the player changes their mind. One tap on the small button and the\n    // arrows are back. Then OK again, and on to the swing.\n    again: () => {\n      const A = 1.6, OK = 4.0, SW = 6.0, on = (sel, ...at) => [sel, "at", 0, { at }];\n      return {\n        html: turnHtml(),\n        tracks: [\n          on("#m1", [0, A + 0.14], [OK + 0.14, SW]), on("#ag", [0, A + 0.14], [OK + 0.14, 1e9]), on("#aimv", [A + 0.14, OK + 0.14]), on("#m2", [SW, 1e9]),\n          ["#ag", "press", A, { dur: 0.14 }], ["#ar", "press", 2.4], ["#ar", "press", 2.8], ["#al", "press", 3.3], ["#ok", "press", OK, { dur: 0.14 }],\n          ["#m2", "pop", SW, { big: 1.04, dur: 0.16, small: 0.97 }],\n        ],\n        dur: 7.6, still: 0.8, stills: { button: 0.8, back: 2.0 },\n      };\n    },\n    wait: () => {\n      const A = PHONE.putting, B = byName("AUNT ROSIE"), C = byName("KIT");\n      const now = (p, id) => `<div class="pp col now" id="${id}" style="--pc:${p.c}">${esc(PHONE_WORDS.putting(p.n))}</div>`;\n      const ns = nameSize();\n      const row = (r) => {\n        const ch = r.n === A.n ? [r.here + 1, false, r.total + 1] : r.n === B.n ? [r.here + 1, true, r.total + 1] : null;\n        const id = r.n === A.n ? "ra" : r.n === B.n ? "rb" : "";\n        return `<div class="pr${r.n === PHONE.you.n ? " you" : ""}"${id ? ` id="${id}"` : ""}><span class="c" style="background:${r.c}"></span><span class="n" style="font-size:${ns}px">${esc(r.n)}</span>` +\n          `<span class="hr">${here(r.here, r.sunk, ch ? "x0" : "", PHONE.par)}${ch ? here(ch[0], ch[1], "x1", PHONE.par) : ""}</span><span class="t">${ch ? `<b class="x0">${r.total}</b><b class="x1">${ch[2]}</b>` : r.total}</span></div>`;\n      };\n      const sw = (a, b, t) => [[a, "swapOut", t], [b, "swapIn", t], [b, "pop", t, { big: 1.06, dur: 0.16, small: 0.96 }]];\n      return {\n        html: head() + now(A, "p0") + now(B, "p1") + now(C, "p2") +\n          `<div class="info">${[2, 1, 0].map((n, k) => `<span class="d" id="b${k}">${dg(PHONE_WORDS.before(n))}</span>`).join("")}</div>` +\n          `<div class="ppr"><div class="pr h"><span></span><span></span><span>${PHONE_WORDS.thisHole}</span><span>${PHONE_WORDS.all}</span></div>` + PHONE.rows.map(row).join("") + `</div>`,\n        tracks: [\n          ["#ra .x0", "swapOut", 1.2], ["#ra .x1", "swapIn", 1.2], ["#ra .x1", "pop", 1.2, { big: 1.4 }],\n          ...sw("#p0", "#p1", 2.0), ["#p2", "swapIn", 4.2], ["#b0", "swapOut", 2.0], ["#b1", "swapIn", 2.0], ["#b1", "swapOut", 4.2], ["#b2", "swapIn", 4.2],\n          ["#rb .x0", "swapOut", 3.5], ["#rb .x1", "swapIn", 3.5], ["#rb .x1", "pop", 3.5, { big: 1.4 }],\n          ["#p1", "swapOut", 4.2], ["#p2", "pop", 4.2, { big: 1.06, dur: 0.16, small: 0.96 }],\n        ],\n        dur: 5.6, still: 0.6,\n      };\n    },\n    // Every short score name in the list, on a par 3. A reference picture, not a game moment.\n    "wait-names": () => {\n      const ns = nameSize(), par = PAR[2];\n      const row = (p, k) => `<div class="pr"><span class="c" style="background:${p.c}"></span><span class="n" style="font-size:${ns}px">${esc(p.n)}</span>` +\n        `<span class="hr">${here(k + 1, true, "", par)}</span><span class="t">${p.s[0] + p.s[1] + k + 1}</span></div>`;\n      return {\n        auto: true,\n        html: head(3, HOLES[2], par) + `<div class="ppr"><div class="pr h"><span></span><span></span><span>${PHONE_WORDS.thisHole}</span><span>${PHONE_WORDS.all}</span></div>` + PLAYERS.map(row).join("") + `</div>`,\n        tracks: [], dur: 1, still: 0,\n      };\n    },\n  };\n\n  // ---- the knock flash: three quick pictures where the balls met ----\n  const flash = `<div id="fl" class="grp">` +\n    `<div class="abs ol f0" style="left:-42px;top:-42px">${pix(SPR.plus7, 12, { "#": "#ffffff" })}</div>` +\n    `<div class="abs ol f1" style="left:-72px;top:-72px">${pix(BURST, 16, { "#": "#ffffff" })}</div>` +\n    `<div class="abs ol f2" style="left:-88px;top:-88px">${pix(BURST2, 16, { "#": GOLD })}</div></div>`;\n\n  // ---- movement: every track adds to an element\'s state for the moment t ----\n  const FX = {\n    drop(s, t, o) { // falls in from above and bounces twice\n      if (t < 0) { s.vis = false; return; }\n      const p = Math.min(1, t / (o.dur || 0.5)), b = o.b || 36;\n      if (p < 0.55) s.y += (o.from || -700) * (1 - (p / 0.55) ** 2);\n      else if (p < 0.82) s.y -= b * Math.sin((Math.PI * (p - 0.55)) / 0.27);\n      else if (p < 1) s.y -= b * 0.3 * Math.sin((Math.PI * (p - 0.82)) / 0.18);\n    },\n    swingDown(s, t, o) { // a sign on its ropes is let down from behind the sign above it, swinging, and comes to rest\n      if (t < 0) { s.vis = false; return; }\n      const p = Math.min(1, t / (o.dur || 0.8)), sw = o.swing || 2.6;\n      s.y += (o.from || -180) * (1 - p) ** 2;\n      if (t < sw) s.r += (o.deg || 8) * (1 - t / sw) ** 2 * Math.sin((2 * Math.PI * t) / (o.period || 0.9));\n    },\n    rise(s, t, o) { // comes up from below, a little too far, and settles\n      if (t < 0) { s.vis = false; return; }\n      const p = Math.min(1, t / (o.dur || 0.45));\n      if (p < 0.6) s.y += (o.from || 500) * (1 - p / 0.6) ** 2;\n      else if (p < 1) s.y -= (o.b || 20) * Math.sin((Math.PI * (p - 0.6)) / 0.4);\n    },\n    upOut(s, t, o) { if (t < 0) return; const p = t / (o.dur || 0.3); if (p >= 1) { s.vis = false; return; } s.y += (o.to || -700) * p * p; },\n    fadeOut(s, t, o) { if (t < 0) return; const p = t / (o.dur || 0.4); if (p >= 1) { s.vis = false; return; } s.op *= 1 - Math.floor(p * 4) / 4; },\n    pop(s, t, o) { if (t < 0) { s.vis = false; return; } const p = t / (o.dur || 0.2); if (p < 0.35) s.s *= o.small || 0.6; else if (p < 1) s.s *= o.big || 1.2; },\n    slideIn(s, t, o) { if (t < 0) { s.vis = false; return; } const p = Math.min(1, t / (o.dur || 0.16)); s.x += (o.dx || 40) * (1 - p) ** 2; },\n    fall(s, t, o) { // a row comes loose: it rocks, one end drops, it hangs a moment, then it falls off the card\n      if (t < 0) return;\n      const R = o.rock || 0.6, T = o.tip || 0.45, G = o.hang || 0.2, D = o.drop || 1.1, d = o.dir || 1, half = o.half || 448, A = o.deg || 8;\n      s.cls.loose = true; s.z = 4;\n      if (t < R) { s.r += 1.5 * Math.sin((t / 0.4) * Math.PI * 2); return; }\n      const p = Math.min(1, (t - R) / T), a = A * p * p * (3 - 2 * p), rad = (a * Math.PI) / 180;\n      s.x -= d * half * (1 - Math.cos(rad)); s.y += half * Math.sin(rad); // the other end stays where it was\n      const q = (t - R - T - G) / D;\n      if (q >= 1) { s.vis = false; return; }\n      s.r += d * (a + (q > 0 ? 22 * q : 0));\n      if (q > 0) s.y += 1150 * q * q;\n    },\n    boardFall(s, t, o) { // the card swings once on its clip, then lets go and drops out of the picture\n      if (t < 0) return;\n      const R = o.rock || 1.0, D = o.drop || 1.3;\n      if (t < R) { s.r += 3 * Math.sin((t / R) * Math.PI * 2) * (0.4 + (0.6 * t) / R); return; }\n      const p = (t - R) / D;\n      if (p >= 1) { s.vis = false; return; }\n      s.r -= 10 * p; s.y += 1200 * p * p;\n    },\n    hop(s, t, o) { const d = o.dur || 0.4; if (t < 0 || t > d) return; s.y -= (o.amp || 24) * Math.sin((Math.PI * t) / d); },\n    to(s, t, o) { // glides to a new place and size, and stays there\n      if (t < 0) return;\n      const p = Math.min(1, t / (o.dur || 1.2)), e = p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) ** 2;\n      s.x += (o.dx || 0) * e; s.y += (o.dy || 0) * e; s.s *= 1 + ((o.scale || 1) - 1) * e;\n    },\n    during(s, t, o) { s.cls[o.name] = s.cls[o.name] || (t >= 0 && t < o.dur); }, // a class that is on for a while\n    show(s, t) { if (t < 0) s.vis = false; },\n    hide(s, t) { if (t >= 0) s.vis = false; },\n    swapIn(s, t) { if (t < 0) s.gone = true; },\n    swapOut(s, t) { if (t >= 0) s.gone = true; },\n    move(s, t, o) { // slides to a new place; a row going up passes over the others\n      if (t < 0) return; const p = Math.min(1, t / (o.dur || 0.6)); if (o.dy < 0 && p < 1) s.z = 3; s.y += o.dy * (p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) ** 2); },\n    twinkle(s, t, o, i) { if (t >= 0 && Math.floor((t + i * 0.17) / (o.period || 0.4)) % 2) s.s *= 0.75; },\n    wave(s, t, o, i) { if (Math.floor(t / (o.period || 0.4) + i * 0.5) % 2) s.y += 4; },\n    shake(s, t, o) { const d = o.dur || 0.3; if (t < 0 || t > d) return; s.x += (Math.floor(t * 30) % 2 ? 1 : -1) * (o.amp || 12) * (1 - t / d); },\n    bob(s, t, o) { if (t >= 0 && Math.floor(t / (o.period || 0.5)) % 2) s.y += o.amp || 4; },\n    press(s, t, o) { const on = t >= 0 && t < (o.dur || 0.18); if (on) s.y += 2; s.cls.down = s.cls.down || on; },\n    cls(s, t, o) { s.cls[o.name] = s.cls[o.name] || t >= 0; },\n    at(s, t, o) { if (!o.at.some(([a, b]) => t >= a && t < b)) s.gone = true; }, // there only between these moments (t0 = 0)\n    pulse(s, t, o) { if (t < 0) { if (!o.keep) s.vis = false; } else if (Math.floor(t / (o.period || 0.5)) % 2) s.op *= 0.35; }, // comes on, then dims and brightens (keep: it was there already)\n    blink(s, t, o) { // flickers a class for a moment; with inv the class is on before and after\n      const live = t >= 0 && t < o.until, flick = live && Math.floor(t / o.period) % 2 === 0;\n      const v = o.inv ? !flick : flick;\n      s.cls[o.name] = o.inv ? v : s.cls[o.name] || v;\n    },\n  };\n\n  function timeline(root, tracks, unit) {\n    const items = tracks.map(([sel, fx, t0, o]) => ({ els: [...root.querySelectorAll(sel)], fx, t0, o: o || {} }));\n    for (const it of items) if (!it.els.length) console.warn("no element for", it);\n    const all = [...new Set(items.flatMap((i) => i.els))];\n    const snap = (v) => Math.round(v / unit) * unit;\n    return (t) => {\n      const st = new Map(all.map((e) => [e, { x: 0, y: 0, s: 1, r: 0, op: 1, vis: true, gone: false, z: 0, cls: {} }]));\n      for (const it of items) it.els.forEach((el, i) => FX[it.fx](st.get(el), t - it.t0 - (it.o.stagger || 0) * i, it.o, i));\n      for (const [el, s] of st) {\n        const r = Math.round(s.r * 2) / 2; // turning goes in half degrees\n        el.style.transform = s.x || s.y || s.s !== 1 || r ? `translate(${snap(s.x)}px,${snap(s.y)}px)${r ? ` rotate(${r}deg)` : ""} scale(${s.s})` : "";\n        el.style.opacity = s.op === 1 ? "" : s.op;\n        el.style.visibility = s.vis ? "" : "hidden";\n        el.style.display = s.gone ? "none" : "";\n        el.style.zIndex = s.z || "";\n        for (const k in s.cls) el.classList.toggle(k, s.cls[k]);\n      }\n    };\n  }\n\n  // one golf ball (balls.js) as a picture for the page, and painted straight into a game picture\n  // (round 5: a ball may also have a pattern and a second colour. Left out, the ball is plain.)\n  const ballSvg = (R, scale, color, outfit, cls, pattern, second) => pix(ballGrid(R, outfit, pattern).rows, scale, ballColors(color, outfit, second), cls);\n  function drawBall(g, x, y, R, color, outfit, pattern, second) {\n    const b = ballGrid(R, outfit, pattern), col = ballColors(color, outfit, second), x0 = Math.round(x) - b.cx, y0 = Math.round(y) - b.cy;\n    b.rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== ".") { g.fillStyle = col[row[i]]; g.fillRect(x0 + i, y0 + j, 1, 1); } });\n  }\n\n  window.KIT_B = { css, tv, phone, flash, timeline, FX,\n    h: { OUT, WOOD, WOOD_HI, WOOD_LO, CREAM, RED, GOLD, GREEN, PAPER, LINE, PEN, step, grain, pl, post, rope, grp, bunting, star, fit, lines, scoreSign, namePl, card, board, seqOf, head, big, here, nameSize, FLAG, ballSvg, drawBall } };\n})();\n';var Oe=`// Rounds 4 and 5: the title screen, the setup screens and the dressed golf balls, in the wooden-sign look.
// Built from the pieces in kit.js and the balls in balls.js. Every word is in settings.js (SETUP_WORDS).
// The order of play (round 6, Lakota: "the join is in foxbox"): players join in FoxBox, mini golf has no join
// screen of its own -> title screen (the START sign swings down on its ropes after 6.6 s, when START shows on
// the host's phone) -> everyone makes a ball on their phone (pick.js), the TV shows every ball changing as it is
// made -> when everyone has tapped DONE the first hole sign comes up. No fly-in.
// The phone's ball picker and the drawing pad are in pick.js.
"use strict";
(function () {
  const K = window.KIT_B, { OUT, WOOD, CREAM, GOLD, pl, rope, grp, bunting, fit, namePl, card, board, seqOf, head, here, nameSize, ballSvg, drawBall } = K.h;
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

  // the name of the game on its wooden sign
  const logo = (x, y, w, h) => { const s = fit(W.name, w - 150, 260); return pl(x, y, w, h, "", \`<div style="position:absolute;inset:16px;border:8px solid \${GOLD}"></div><div style="font-size:\${s}px;color:\${GOLD};text-shadow:8px 8px 0 \${OUT};margin-top:-\${Math.round(s * 0.08)}px">\${esc(W.name)}</div>\`); };

  // ---- TV ----
  // Title screen. The first hole is behind it, the name hangs on its sign, the eight balls stand in a row in
  // their outfits. After 6.6 seconds, at the moment START shows on the host's phone, the PRESS START sign is let
  // down on its two ropes from behind the name sign, swings and comes to rest (round 6, Lakota: "Make it swing
  // down from the ropes not ropes hanging nothing"). Before that nothing hangs under the name: no empty ropes.
  K.tv.title = () => {
    let balls = "", shadows = "";
    PLAYERS.forEach((p, k) => { const x = 204 + 216 * k; shadows += \`<div class="gshadow" style="left:\${x - 76}px;top:1000px;width:152px"></div>\`; balls += stand(x, 1012, 20, 4, p.c, LOOKS[p.n], "tball"); });
    return {
      seq: "title", frame: () => 0,
      // the START sign and its ropes come before the name sign, so they are behind it until they are let down
      html: grp("bunt", bunting()) +
        grp("sg", rope(800, 380, 520) + rope(1104, 380, 520) + pl(680, 512, 560, 108, "gold", \`<div class="px" style="font-size:44px">\${W.pressStart}</div>\`, "", "ps"), 960, 462) +
        grp("lg", rope(600, -900, 140) + rope(1304, -900, 140) + logo(380, 132, 1160, 330)) + grp("tb", shadows + balls),
      tracks: [
        ["#bunt", "drop", 0.3, { from: -140, dur: 0.35, b: 12 }], ["#bunt .f", "wave", 0, { period: 0.45 }],
        ["#lg", "drop", 0.6, { from: -700, dur: 0.6, b: 40 }],
        [".gshadow", "show", 1.95, { stagger: 0.12 }], [".tball", "drop", 1.5, { from: -900, dur: 0.5, b: 28, stagger: 0.12 }],
        [".tball", "bob", 3.4, { amp: -8, period: 0.5, stagger: 0.25 }],
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
  const phoneTitle = (host) => () => {
    const s = fit("GOLF", 270, 132, 2);
    let balls = "";
    PLAYERS.forEach((p, k) => { balls += stand(46 + 90 * (k % 4) + (k > 3 ? 0 : 6), 150 + Math.floor(k / 4) * 150, 8, 4, p.c, LOOKS[p.n]); });
    return {
      // the host's START stays away for the first 6.6 seconds (Lakota: "hide it for host to dramatic effect"), then pops in.
      // Its room is kept, so nothing on the screen moves when it comes.
      html: \`<div class="pp tlogo" style="font-size:\${s}px">\${W.name.split(" ").join("<br>")}</div><div class="tballs">\${balls}</div>\` + (host ? \`<div class="pp gold btn px" id="st" style="flex:none;height:112px;font-size:48px">\${W.start}</div>\` : ""),
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
  K.h.setup = { LOOKS, colorOf, plain, stand, win, logo, ball, bsvg, bare, drawAt, DRAW_STEPS, DRAW_DONE, DRAW_DUR, DRAWN, PICKED, Q, INF };
})();
`;var ve=`// The phone's ball picker and the drawing pad, in the wooden-sign look.
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
`;var Te=[fe,xe,ue,ge,be,me,we,ye],Ee="OUTFITS, BALL_COLORS, BALL_PATTERNS, BALL_INK, ballGrid, ballColors, outfitOf, patternOf, DRAW, padNew, padRows, padBlank, padSnap, padUndo, padClear, padStamp, padWay, padLine, padFill, padArt, padFrom, drawnOutfit",ie=null,ae=null;function Xe(){if(!ie)ie=Function(`"use strict";
${Te.join(`
;
`)}
;return { ${Ee} };`)();return ie}function $e(){if(ae)return ae;let a=Object.create(globalThis);return ae=Function("window",`"use strict";
${[ce,he,...Te,Ae,Oe,ve].join(`
;
`)}
;return { K: window.KIT_B, SETUP_WORDS, SETTINGS, PHONE_WORDS, pix, esc, dg, ${Ee} };`)(a),ae}function Be(a){if(!a)return"none";return a.outfit==="drawn"&&a.art?Xe().drawnOutfit(a.art):a.outfit||"none"}var Ze=`
:where(.mg-set, .mg-set *) { box-sizing: border-box; margin: 0; padding: 0; }
.mg-set { position: fixed; inset: 0; z-index: 60; overflow: hidden; touch-action: none; user-select: none; -webkit-user-select: none; background: repeating-conic-gradient(#17694f 0 25%, #1b7558 0 50%) 0 0/120px 120px; }
.mg-set[hidden] { display: none; }
/* LOOK's phone screens are drawn for a 390 x 844 phone: the page keeps that shape and is scaled to fit this one */
#ph.mg-set-in { position: absolute; left: 50%; top: 0; width: 390px; height: 844px; transform-origin: 50% 0; }
#ph.mg-set-in .abs { position: absolute; }
#ph.mg-set-in svg.pix { display: block; }
#ph.mg-set-in .tap { cursor: pointer; }
#ph.mg-set-in .tap.down, #ph.mg-set-in .wc.down { filter: brightness(0.8); }
#ph.mg-set-in .mg-wait { margin-top: 6px; font-size: 15px; white-space: nowrap; }
#ph.mg-set-in .ttl { flex: 1; display: flex; flex-direction: column; gap: 12px; }
`;function Dt(a,{send:h,me:H}){let g=a.ownerDocument,f=g.defaultView,$=$e(),x=$.K,l=$.SETUP_WORDS,B=x.h,u=B.setup,{OUT:m,CREAM:P,ballSvg:q}=B,{pix:j,esc:b}=$,s=$;if(!g.getElementById("mg-kit-css")){let e=g.createElement("style");e.id="mg-kit-css",e.textContent=x.css,g.head.appendChild(e)}if(!g.getElementById("mg-set-css")){let e=g.createElement("style");e.id="mg-set-css",e.textContent=Ze,g.head.appendChild(e)}a.innerHTML='<div class="mg-pp" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>';let k=de(a.firstElementChild,{send:h,me:H}),T=g.createElement("div"),A=g.createElement("div");T.className="mg-set",T.hidden=!0,T.dataset.test="minigolf-setup",A.id="ph",A.className="sB pk mg-set-in",T.appendChild(A),a.appendChild(T);let W=()=>{let e=Math.min(f.innerWidth/390,f.innerHeight/844,1.15);A.style.transform=`translateX(-50%) scale(${e})`,A.style.top=`${Math.max(0,Math.round((f.innerHeight-844*e)/2))}px`};f.addEventListener("resize",W),W();let I=(e)=>(s.BALL_COLORS.find((o)=>o[1].toLowerCase()===String(e).toLowerCase())||s.BALL_COLORS[0])[0],p=null,R=null,y=null,z="",i=null,M=!1,S=!1,U="",D=()=>({outfit:p.o,pattern:p.s,colors:[u.colorOf(p.m),u.colorOf(p.c)],...p.o==="drawn"&&R?{art:R}:{}}),F=()=>R?s.drawnOutfit(R):null,E=(e,o,n)=>q(e,o,n.colors[0],Be(n),"",n.pattern,n.colors[1]);function V(){let e=D(),o=JSON.stringify(e);if(o!==U)U=o,h({type:"mg-ball",ball:e})}function G(e){return`<div class="ttl">${x.phone[e.host?"title":"title-guest"]().html}</div>`}let X=j(["......##",".....#gg","....#gg#","...#gg#.","..#gg#..",".#cg#...","#cc#....","###....."],2,{"#":m,g:B.GOLD,c:P}),Q=()=>{let e=F();return[s.OUTFITS[0],...e&&e!=="none"?[e]:[],...s.OUTFITS.slice(1)]},t=(e,o)=>(o%e+e)%e,d=(e,o,n)=>Array.from({length:n},(r,c)=>e[t(e.length,o+c-(n>>1))]),w=(e,o,n)=>`<div class="wh ${e}" style="${n||""}">${o.map((r,c)=>`<div class="wc tap${c===o.length>>1?" mid":c===0||c===o.length-1?" far":""}" data-k="${e.split(" ")[0]}" data-j="${c-(o.length>>1)}"${r[1]?` style="--c:${r[1]}"`:""}>${r[0]}</div>`).join("")}</div>`,C=(e,o)=>`<div class="wl px"><span>${e}</span><span class="nm">${b(o||"")}</span></div>`;function _(e){let o=Q(),n=Math.max(0,o.findIndex((v)=>v.id===p.o)),r=o[n],c=(v)=>v.art?v:v.id,L=u.colorOf(p.m),N=u.colorOf(p.c),Y=(v,se)=>[q(se,2,L,c(v))+(v.art?`<span class="pen">${X}</span>`:"")],J=Math.max(0,s.BALL_PATTERNS.findIndex((v)=>v[0]===p.s)),Ie=s.BALL_COLORS.findIndex((v)=>v[0]===p.m),Ce=s.BALL_COLORS.findIndex((v)=>v[0]===p.c);return`<div class="pg"><div class="pp shead px"><span class="pp col ch" style="--pc:${b(e.me.color)}">${b(String(e.me.name).toUpperCase())}</span><span>${l.yourBall}</span></div><div class="pv2"><div class="full pvb">${E(16,4,D())}</div><div class="pp gold ownb px tap" data-act="draw" data-test="mg-draw">${X}<span>${l.makeOwn.join("<br>")}</span></div></div><div class="px onm" style="font-size:${Math.min(16,Math.floor(340/r.name.length))}px">${b(r.name)}</div><div class="wg">${C(l.wOutfit)}`+w("w-o long",d(o,n,7).map((v,se)=>Y(v,se===3?8:5)),"--mh:74px;--sh:50px")+`</div><div class="wg">${C(l.wPattern,s.BALL_PATTERNS[J][1])}`+w("w-s",d(s.BALL_PATTERNS,J,5).map((v,se)=>[u.bare(se===2?12:8,2,{pattern:v[0],colors:[L,N]})]),"--mh:66px;--sh:46px")+`</div><div class="wg">${C(l.wMain,p.m)}`+w("w-m col",d(s.BALL_COLORS,Ie,5).map((v)=>["",v[1]]),"--mh:48px;--sh:36px")+`</div><div class="wg">${C(l.wSecond,p.c)}`+w("w-c col",d(s.BALL_COLORS,Ce,5).map((v)=>["",v[1]]),"--mh:48px;--sh:36px")+`</div><div class="brow"><div class="pp btn sp px tap" data-act="surprise">${l.surprise.replace(" ","<br>")}</div><div class="pp gold btn px dn tap" data-act="done" data-test="mg-done">${l.done}</div></div></div>`}function O(e){let o=e.me.ball||D(),n=e.phase!=="pick";return`<div class="pg"><div class="pp shead px"><span>${l.yourBall}</span></div><div class="prev"><div class="full">${E(20,4,o)}</div></div><div class="pp col who" style="--pc:${b(e.me.color)}">${b(String(e.me.name).toUpperCase())}</div><div class="pp rdy btn px" style="flex:none;height:96px;font-size:40px">${l.readyOn}</div>`+(n?"":`<div class="pp btn low px tap" data-act="change">${l.change}</div>`)+`<div class="px blab mg-wait">${b(n||!e.waiting?l.allReady:l.waiting(e.waiting))}</div></div>`}let te=11,oe=[["pen",l.pen,["....##","...###","..###.",".###..","###...","##...."]],["fill",l.fill,["..##..",".#..#.","######","######",".####.","..##.."]],["eraser",l.eraser,["..####",".#####","######","#####.","####..","......"]]],ke=Object.fromEntries(s.DRAW.colors.map(([e,o])=>[e,o]));function Re(){let e=i.pad,o=D(),n=te;return i.sq=n,`<div class="pg"><div class="drow"><div class="pp dbt px tap" data-act="dback">${l.back}</div><div class="px dtt">${l.drawTitle.join("<br>")}</div><div class="pp dbt px tap" data-act="dundo">${l.undo}</div><div class="pp dbt px tap" data-act="dclear">${l.clear}</div></div><div class="dboard" id="mg-dbd" style="width:${e.w*n}px;height:${e.h*n}px;background-size:${n*2}px ${n*2}px"><div>${j(s.ballGrid(e.R,"none",o.pattern).rows,n,s.ballColors(o.colors[0],"none",o.colors[1]))}</div><div id="mg-dart"></div></div><div class="drow">${oe.map(([r,c,L])=>`<div class="pp dtool px tap" data-act="tool" data-v="${r}" id="mg-dt-${r}">${j(L,3,{"#":P})}<span>${c}</span></div>`).join("")}`+s.DRAW.sizes.map((r,c)=>`<div class="pp dsz tap" data-act="size" data-v="${c}" id="mg-ds${c}"><i style="width:${r*8}px;height:${r*8}px"></i></div>`).join("")+`</div><div class="dpal">${s.DRAW.colors.map(([r,c])=>`<div class="dsw tap" data-act="color" data-v="${r}" id="mg-dc-${r}" style="--c:${c}"></div>`).join("")}</div><div class="spacer"></div><div class="drow"><div class="pp dprev px"><span id="mg-dpv"></span><span>${l.onCourse.join("<br>")}</span></div><div class="pp gold btn px tap" data-act="ddone" style="height:84px">${l.done}</div></div>`+(i.ask?`<div class="dask"><div class="pp q">${b(l.clearAsk)}</div><div class="brow"><div class="pp gold btn px tap" data-act="dyes" style="font-size:26px">${l.yes}</div><div class="pp btn px tap" data-act="dno" style="font-size:26px;text-shadow:2px 2px 0 ${m}">${l.no}</div></div></div>`:"")+"</div>"}function Z(){let e=s.padArt(i.pad),o=e.rows.join(""),n=i.ui;if(i.key!==o){i.key=o,A.querySelector("#mg-dart").innerHTML=j(e.rows,i.sq,ke);let r=s.drawnOutfit(e);if(A.querySelector("#mg-dpv").innerHTML=E(4,4,{...D(),outfit:"drawn",art:r==="none"?null:e}),r!=="none")h({type:"mg-ball",ball:{...D(),outfit:"drawn",art:e}})}oe.forEach(([r])=>A.querySelector(`#mg-dt-${r}`).classList.toggle("sel",n.tool===r)),s.DRAW.sizes.forEach((r,c)=>A.querySelector(`#mg-ds${c}`).classList.toggle("sel",n.size===c)),s.DRAW.colors.forEach(([r])=>A.querySelector(`#mg-dc-${r}`).classList.toggle("sel",n.color===r))}function Se(){let e=A.querySelector("#mg-dbd");if(!e)return;let o=null,n=null,r=(N)=>{let Y=e.getBoundingClientRect(),J=Y.width/e.offsetWidth;return[Math.floor((N.clientX-Y.left-4*J)/(i.sq*J)),Math.floor((N.clientY-Y.top-4*J)/(i.sq*J))]},c=()=>i.ui.tool==="eraser"?".":i.ui.color;e.addEventListener("pointerdown",(N)=>{if(o!=null||i.ask)return;N.preventDefault(),o=N.pointerId;try{e.setPointerCapture(o)}catch{}if(s.padSnap(i.pad),n=r(N),i.ui.tool==="fill")s.padFill(i.pad,n[0],n[1],c());else s.padStamp(i.pad,n[0],n[1],s.DRAW.sizes[i.ui.size],c());Z()}),e.addEventListener("pointermove",(N)=>{if(N.pointerId!==o||i.ui.tool==="fill")return;let Y=r(N);s.padLine(i.pad,n[0],n[1],Y[0],Y[1],s.DRAW.sizes[i.ui.size],c()),n=Y,Z()});let L=(N)=>{if(N.pointerId===o)o=null};e.addEventListener("pointerup",L),e.addEventListener("pointercancel",L)}function K(){let e=y;if(!e)return;let o=e.phase==="title"?"title":e.phase==="pick"&&!e.me.ready?i?"draw":"pick":"ready";if(z=o,o==="title"){A.innerHTML=G(e);let n=A.querySelector("#st");if(n)n.classList.add("tap"),n.dataset.act="start",n.dataset.test="mg-start",n.style.visibility=e.start?"":"hidden"}else if(o==="pick")A.innerHTML=_(e);else if(o==="draw")A.innerHTML=Re(),Se(),i.key="",Z();else A.innerHTML=O(e)}let ee=null;A.addEventListener("pointerdown",(e)=>{let o=e.target.closest(".tap");if(ee=o,o)o.classList.add("down")}),A.addEventListener("pointercancel",()=>{if(ee)ee.classList.remove("down");ee=null}),A.addEventListener("pointerup",(e)=>{let o=e.target.closest(".tap"),n=ee;if(n)n.classList.remove("down");if(ee=null,!o||o!==n)return;De(o)});function De(e){let o=e.dataset.act,n=e.dataset.k;if(n){let r=Number(e.dataset.j)||0;if(!r)return;if(n==="w-o"){let c=Q(),L=Math.max(0,c.findIndex((N)=>N.id===p.o));p.o=c[t(c.length,L+r)].id}else if(n==="w-s"){let c=Math.max(0,s.BALL_PATTERNS.findIndex((L)=>L[0]===p.s));p.s=s.BALL_PATTERNS[t(s.BALL_PATTERNS.length,c+r)][0]}else if(n==="w-m"||n==="w-c"){let c=n==="w-m"?"m":"c",L=s.BALL_COLORS.findIndex((N)=>N[0]===p[c]);p[c]=s.BALL_COLORS[t(s.BALL_COLORS.length,L+r)][0]}V(),K();return}switch(o){case"start":if(y&&y.start)h({type:"mg-start"});break;case"surprise":{let r=()=>Math.random(),c=(L)=>L[Math.floor(r()*L.length)];p={o:c(s.OUTFITS.slice(1)).id,s:r()<0.4?"plain":c(s.BALL_PATTERNS)[0],m:c(s.BALL_COLORS)[0],c:c(s.BALL_COLORS)[0]},V(),K();break}case"done":V(),h({type:"mg-done"});break;case"change":h({type:"mg-change"});break;case"draw":{i={pad:R?s.padFrom(R):s.padNew(),ui:{color:"C",tool:"pen",size:1},ask:!1,key:""},h({type:"mg-drawing",on:!0}),K();break}case"dback":i=null,h({type:"mg-drawing",on:!1}),U="",V(),K();break;case"ddone":{let r=s.padArt(i.pad);if(s.drawnOutfit(r)!=="none")R=r,p.o="drawn";else if(p.o==="drawn")R=null,p.o="none";i=null,h({type:"mg-drawing",on:!1}),U="",V(),K();break}case"dundo":s.padUndo(i.pad),Z();break;case"dclear":if(!s.padBlank(i.pad))i.ask=!0,K();break;case"dyes":s.padClear(i.pad),i.ask=!1,K();break;case"dno":i.ask=!1,K();break;case"tool":i.ui.tool=e.dataset.v,Z();break;case"size":i.ui.size=Number(e.dataset.v),Z();break;case"color":if(i.ui.color=e.dataset.v,i.ui.tool==="eraser")i.ui.tool="pen";Z();break}}function Ne(e){let o=!y;if(y=e,!p){let r=e.me.ball||{outfit:"none",pattern:"plain",colors:[e.me.color,e.me.color]};if(p={o:r.outfit||"none",s:r.pattern||"plain",m:I(r.colors[0]),c:I(r.colors[1])},r.outfit==="drawn"&&r.art)R=r.art;U=JSON.stringify(D())}if(e.phase!=="pick")i=null;let n=e.phase==="title"?"title":e.phase==="pick"&&!e.me.ready?i?"draw":"pick":"ready";if(o||n!==z||n==="ready"||n==="title")K()}function ne(){let e=S&&M;if(T.hidden=!e,e)W();a.firstElementChild.style.visibility=e?"hidden":""}return{onMessage(e){if(!e||typeof e!=="object")return;if(e.type==="mg-setup"){M=!0,ne(),Ne(e);return}if(e.type==="mg-view")M=!1,i=null,ne();k.onMessage(e)},show(e){let o=S;if(S=!!e,ne(),S&&!o)k.show()},release(){k.letGo()},get state(){return{screen:z,view:y,ball:p&&D(),putt:k.state}}}}export{Dt as createMinigolfPad};
