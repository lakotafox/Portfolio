const d=window.matchMedia("(prefers-reduced-motion: reduce)");document.addEventListener("DOMContentLoaded",function(){setTimeout(function(){const t=document.querySelector("#home .hero-content h2");if(t){let c=function(){r<e.length?(n.textContent+=e.charAt(r),r++,setTimeout(c,150)):i.style.animation="blink 1s infinite"};var o=c;const e="LUCKY YOU";if(d.matches){t.innerHTML='<span class="typewriter-text"></span>',t.querySelector(".typewriter-text").textContent=e;return}t.innerHTML='<span class="typewriter-text"></span><span class="typewriter-cursor">_</span>';const n=t.querySelector(".typewriter-text"),i=t.querySelector(".typewriter-cursor");let r=0;c()}},100);const s=document.getElementById("hamburger-menu"),a=document.getElementById("nav-links");if(s){s.addEventListener("click",function(){s.classList.toggle("active"),a.classList.toggle("active")}),a.querySelectorAll("a").forEach(e=>{e.addEventListener("click",function(){s.classList.remove("active"),a.classList.remove("active")})}),document.addEventListener("click",function(e){!s.contains(e.target)&&!a.contains(e.target)&&(s.classList.remove("active"),a.classList.remove("active"))});const o=document.querySelector("header");if(o){const e=function(){const n=window.scrollY>o.offsetTop+o.offsetHeight;s.classList.toggle("floating",n)};window.addEventListener("scroll",e,{passive:!0}),e()}}const m=document.getElementById("stars");if(m)for(let t=0;t<100;t++){const o=document.createElement("div");o.className="star",o.style.left=Math.random()*100+"%",o.style.top=Math.random()*100+"%",o.style.animationDelay=Math.random()*3+"s",m.appendChild(o)}const f=document.getElementById("visitor-counter");if(f){let t=Math.floor(Math.random()*1e6);f.textContent=String(t).padStart(6,"0"),d.matches||setInterval(function(){t+=Math.floor(Math.random()*3),f.textContent=String(t).padStart(6,"0")},1e4)}if(document.querySelectorAll("h1, h2, h3").forEach(t=>{if(t.closest("[data-step-panel], [data-details-form], dialog"))return;const o=t.textContent;t.innerHTML="";for(let e=0;e<o.length;e++){const n=document.createElement("span");n.textContent=o[e],n.style.animationDelay=`${e*.1}s`,t.appendChild(n)}}),!d.matches){let t=0;setInterval(function(){t=(t+1)%360,document.body.style.borderTop=`5px solid hsl(${t}, 100%, 50%)`,document.body.style.borderBottom=`5px solid hsl(${t+180}, 100%, 50%)`},50)}if(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)){const t=document.createElement("div");t.id="fake-mobile-scrollbar",t.innerHTML=`
            <div style="
                position: fixed;
                right: 0;
                top: 0;
                width: 17px;
                height: 100%;
                background: #c0c0c0;
                border-left: 1px solid #808080;
                z-index: 999999;
            ">
                <div id="fake-thumb" style="
                    position: absolute;
                    width: 15px;
                    height: 60px;
                    left: 1px;
                    background: linear-gradient(to bottom, #ffffff, #c0c0c0, #808080);
                    border: 1px solid #808080;
                    box-shadow: inset 1px 1px 0 #dfdfdf;
                    top: 0;
                "></div>
            </div>
        `,window.addEventListener("load",function(){document.body.appendChild(t);const o=document.getElementById("fake-thumb");function e(){const n=document.documentElement.scrollHeight-window.innerHeight,i=window.pageYOffset/n,l=window.innerHeight-60;o.style.top=i*l+"px"}window.addEventListener("scroll",e),e()})}setTimeout(function(){const t=document.querySelectorAll(".floating-gif"),o=document.querySelector(".footer-gifs");t.length>0&&o&&!d.matches&&t.forEach(e=>{let n=Math.random()*(o.offsetWidth-60),i=Math.random()*(o.offsetHeight-60),r=(Math.random()*2+1)*(Math.random()<.5?1:-1),c=(Math.random()*2+1)*(Math.random()<.5?1:-1);e.style.position="absolute";function l(){const u=o.offsetWidth,h=o.offsetHeight,p=e.offsetWidth||60,g=e.offsetHeight||60;n+=r,i+=c,n>u?n=-p:n<-p&&(n=u),i>h?i=-g:i<-g&&(i=h),e.style.left=n+"px",e.style.top=i+"px",requestAnimationFrame(l)}l()})},500),console.log(`%c
    ╔══════════════════════════════════════╗
    ║  LUCKY YOU HAIR SALON - EST. 1999   ║
    ║  ----------------------------------- ║
    ║  Welcome to the COOLEST site on the  ║
    ║  World Wide Web! Don't forget to     ║
    ║  bookmark us and come back soon!     ║
    ╚══════════════════════════════════════╝
    `,"color: #00ff00; background: #000; font-family: monospace; font-size: 14px;")});
