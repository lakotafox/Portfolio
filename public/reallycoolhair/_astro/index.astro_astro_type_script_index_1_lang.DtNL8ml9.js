const y="/reallycoolhair".replace(/\/$/,"");let s=[];function w(n){return/^https?:\/\//.test(n)?n:`${y}/retro/${n}`}async function M(){try{s=(await(await fetch(`${y}/retro/gallery-data.json`)).json()).clients||[]}catch(n){console.error("Failed to load gallery data:",n),s=[]}return s}document.addEventListener("DOMContentLoaded",async function(){await M();const n=document.getElementById("gallery-grid"),d=document.getElementById("gallery-modal"),h=document.getElementById("modal-gallery"),k=document.getElementById("modal-title"),p=document.querySelector(".modal-close"),c=document.getElementById("image-lightbox"),b=document.getElementById("lightbox-image"),E=document.querySelector(".lightbox-close"),r=document.getElementById("gallery-see-more-btn");let g=!1;if(!n||!d)return;function v(){return window.innerWidth<=768}s.forEach((e,i)=>{const o=document.createElement("div");o.className="gallery-item",v()&&i>=3&&o.classList.add("hidden-mobile"),o.dataset.index=i;const l=document.createElement("img");l.src=w(e.preview),l.alt=`Client ${i+1} Hair Style`,l.loading="lazy",o.appendChild(l),n.appendChild(o),o.addEventListener("click",function(){B(i)})}),r&&r.addEventListener("click",function(){v()?window.location.href=`${y}/1998/gallery`:g?(document.querySelectorAll(".gallery-item").forEach((i,o)=>{o>=3&&i.classList.add("hidden-mobile")}),r.textContent="See More",g=!1,document.getElementById("gallery").scrollIntoView({behavior:"smooth"})):(document.querySelectorAll(".gallery-item.hidden-mobile").forEach(i=>{i.classList.remove("hidden-mobile")}),r.textContent="See Less",g=!0)});let I=0;function B(e){if(I=window.scrollY||window.pageYOffset,/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)){const l=document.createElement("div");l.id="modal-fake-scrollbar",l.innerHTML=`
                <div style="
                    position: fixed;
                    right: 0;
                    top: 0;
                    width: 17px;
                    height: 100%;
                    background: #c0c0c0;
                    border-left: 1px solid #808080;
                    z-index: 1000001;
                ">
                    <div id="modal-fake-thumb" style="
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
            `,document.body.appendChild(l);const m=function(){const t=document.getElementById("gallery-modal");if(t){const a=t.scrollHeight-t.clientHeight,H=a>0?t.scrollTop/a:0,L=window.innerHeight-60,x=document.getElementById("modal-fake-thumb");x&&(x.style.top=Math.max(0,Math.min(L,H*L))+"px")}};setTimeout(function(){const t=document.getElementById("gallery-modal");t&&(t.addEventListener("scroll",m),m())},100)}const o=s[e];k.textContent="BEAUTIFUL PEOPLE WITH BEAUTIFUL HAIR",h.innerHTML="",o.images.forEach((l,m)=>{const t=document.createElement("div");t.className="modal-image";const a=document.createElement("img");a.src=w(l),a.alt=`Client ${e+1} - Photo ${m+1}`,a.loading="lazy",a.addEventListener("click",function(){C(a.src)}),t.appendChild(a),h.appendChild(t)}),d.style.display="block",document.body.classList.add("modal-open"),d.scrollTop=0}function u(){d.style.display="none",document.body.classList.remove("modal-open");const e=document.getElementById("modal-fake-scrollbar");e&&e.remove(),window.scrollTo(0,I)}p&&p.addEventListener("click",u),d.addEventListener("click",function(e){e.target===d&&u()}),document.addEventListener("keydown",function(e){e.key==="Escape"&&(c&&c.style.display==="block"?f():d.style.display==="block"&&u())});function C(e){c&&(b.src=e,c.style.display="block")}function f(){c.style.display="none",b.src=""}E&&E.addEventListener("click",f),c&&c.addEventListener("click",function(e){e.target===c&&f()})});export{M as l};
