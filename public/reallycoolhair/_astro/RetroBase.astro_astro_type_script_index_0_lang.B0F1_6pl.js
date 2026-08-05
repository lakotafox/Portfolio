const d=window.matchMedia("(prefers-reduced-motion: reduce)");document.addEventListener("DOMContentLoaded",function(){setTimeout(function(){const t=document.querySelector("#home .hero-content h2");if(t){let a=function(){r<o.length?(n.textContent+=o.charAt(r),r++,setTimeout(a,150)):i.style.animation="blink 1s infinite"};var e=a;const o="LUCKY YOU";if(d.matches){t.innerHTML='<span class="typewriter-text"></span>',t.querySelector(".typewriter-text").textContent=o;return}t.innerHTML='<span class="typewriter-text"></span><span class="typewriter-cursor">_</span>';const n=t.querySelector(".typewriter-text"),i=t.querySelector(".typewriter-cursor");let r=0;a()}},100);const s=document.getElementById("hamburger-menu"),c=document.getElementById("nav-links");s&&(s.addEventListener("click",function(){s.classList.toggle("active"),c.classList.toggle("active")}),c.querySelectorAll("a").forEach(e=>{e.addEventListener("click",function(){s.classList.remove("active"),c.classList.remove("active")})}),document.addEventListener("click",function(e){!s.contains(e.target)&&!c.contains(e.target)&&(s.classList.remove("active"),c.classList.remove("active"))}));const m=document.getElementById("stars");if(m)for(let t=0;t<100;t++){const e=document.createElement("div");e.className="star",e.style.left=Math.random()*100+"%",e.style.top=Math.random()*100+"%",e.style.animationDelay=Math.random()*3+"s",m.appendChild(e)}const f=document.getElementById("visitor-counter");if(f){let t=Math.floor(Math.random()*1e6);f.textContent=String(t).padStart(6,"0"),d.matches||setInterval(function(){t+=Math.floor(Math.random()*3),f.textContent=String(t).padStart(6,"0")},1e4)}if(document.querySelectorAll("h1, h2, h3").forEach(t=>{if(t.closest("[data-step-panel], [data-details-form], dialog"))return;const e=t.textContent;t.innerHTML="";for(let o=0;o<e.length;o++){const n=document.createElement("span");n.textContent=e[o],n.style.animationDelay=`${o*.1}s`,t.appendChild(n)}}),!d.matches){let t=0;setInterval(function(){t=(t+1)%360,document.body.style.borderTop=`5px solid hsl(${t}, 100%, 50%)`,document.body.style.borderBottom=`5px solid hsl(${t+180}, 100%, 50%)`},50)}if(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)){const t=document.createElement("div");t.id="fake-mobile-scrollbar",t.innerHTML=`
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
        `,window.addEventListener("load",function(){document.body.appendChild(t);const e=document.getElementById("fake-thumb");function o(){const n=document.documentElement.scrollHeight-window.innerHeight,i=window.pageYOffset/n,l=window.innerHeight-60;e.style.top=i*l+"px"}window.addEventListener("scroll",o),o()})}setTimeout(function(){const t=document.querySelectorAll(".floating-gif"),e=document.querySelector(".footer-gifs");t.length>0&&e&&!d.matches&&t.forEach(o=>{let n=Math.random()*(e.offsetWidth-60),i=Math.random()*(e.offsetHeight-60),r=(Math.random()*2+1)*(Math.random()<.5?1:-1),a=(Math.random()*2+1)*(Math.random()<.5?1:-1);o.style.position="absolute";function l(){const h=e.offsetWidth,u=e.offsetHeight,p=o.offsetWidth||60,g=o.offsetHeight||60;n+=r,i+=a,n>h?n=-p:n<-p&&(n=h),i>u?i=-g:i<-g&&(i=u),o.style.left=n+"px",o.style.top=i+"px",requestAnimationFrame(l)}l()})},500),console.log(`%c
    ╔══════════════════════════════════════╗
    ║  LUCKY YOU HAIR SALON - EST. 1999   ║
    ║  ----------------------------------- ║
    ║  Welcome to the COOLEST site on the  ║
    ║  World Wide Web! Don't forget to     ║
    ║  bookmark us and come back soon!     ║
    ╚══════════════════════════════════════╝
    `,"color: #00ff00; background: #000; font-family: monospace; font-size: 14px;")});
