const assetBase="/assets/data/fmb-news-approved/";
const assetFiles={logo:["logo-0.txt","logo-1.txt","logo-2.txt","logo-3.txt"],hero:["hero-0.txt","hero-1.txt","hero-2.txt","hero-3.txt","hero-4.txt"]};
async function loadAsset(name){const parts=await Promise.all(assetFiles[name].map(file=>fetch(assetBase+file).then(r=>{if(!r.ok)throw new Error(`Unable to load ${file}`);return r.text()})));const src="data:image/webp;base64,"+parts.join("");document.querySelectorAll(`[data-fmb-asset="${name}"]`).forEach(img=>img.src=src)}
Promise.all([loadAsset("logo"),loadAsset("hero")]).catch(console.error);
const clock=document.getElementById("phtClock");
function updateClock(){if(!clock)return;clock.textContent=new Intl.DateTimeFormat("en-PH",{timeZone:"Asia/Manila",hour:"numeric",minute:"2-digit",hour12:true}).format(new Date())+" PHT"}
updateClock();setInterval(updateClock,30000);
const menu=document.querySelector("[data-menu]");const mobileNav=document.querySelector("[data-mobile-nav]");
if(menu&&mobileNav){menu.addEventListener("click",()=>{const next=!mobileNav.hasAttribute("data-open");mobileNav.toggleAttribute("data-open",next);menu.setAttribute("aria-expanded",String(next))})}

(function activateWorldwideDesk(){
  const pathname=location.pathname.replace(/\/+$/, "/");
  if(!pathname.startsWith("/news/world/"))return;
  document.body.classList.add("fmb-worldwide-route");
  const addCss=(href,key)=>{if(document.querySelector(`link[data-${key}]`))return;const link=document.createElement("link");link.rel="stylesheet";link.href=href;link.dataset[key]="true";document.head.appendChild(link)};
  addCss("/assets/css/fmb-worldwide.css?v=20260831-worldwide-v2","fmbWorldwide");
  addCss("/assets/css/fmb-worldwide-v2.css?v=20260831-worldwide-v2","fmbWorldwideV2");
  document.querySelectorAll('.desktop-nav a[href="/news/world/"],.mobile-nav a[href="/news/world/"]').forEach(link=>link.setAttribute("aria-current","page"));

  if(pathname==="/news/world/"&&!document.querySelector(".world-gateway-hero")){
    const main=document.querySelector("main");
    if(main)main.innerHTML=`<section class="world-gateway-hero"><div class="shell"><div class="world-gateway-topline"><span class="world-gateway-kicker">FMB News · Global Desk</span><span class="world-gateway-live"><i aria-hidden="true"></i> Live 24-hour desk</span></div><h1>FMB <span>Worldwide</span></h1><p class="world-gateway-deck">The consequential verified developments shaping the world right now, filtered through a rolling 24-hour window and made clear for Filipino readers. No forced country quota. No filler.</p><div class="world-gateway-actions"><a class="world-gateway-primary" href="/news/world/live/">Open the live briefing →</a><a class="world-gateway-secondary" href="#archive">Browse archived editions</a></div><div class="world-gateway-rule"><span>Rolling 24-hour window</span><span>Verified sources</span><span>Country by country</span><span>Fact separated from analysis</span></div></div></section><section class="world-gateway-main"><div class="shell"><div class="world-gateway-grid"><article class="world-gateway-livecard"><p class="world-gateway-label">Current desk</p><h2>The world, in one verified briefing.</h2><p>The live edition is the source of truth for the newest FMB Worldwide coverage. Each entry identifies what is verified, why it matters, and the strategic or reputational implications worth watching.</p><a href="/news/world/live/">Enter the live global desk <span aria-hidden="true">→</span></a></article><div class="world-gateway-side" id="archive"><a class="world-gateway-card" href="/news/world/august-30-2026/"><small>Archive · Latest preserved edition</small><div><h3>Dated editions stay permanent.</h3><p>Verified reporting remains accessible after it leaves the rolling live window.</p></div></a><a class="world-gateway-card" href="/news/about/"><small>FMB standard</small><div><h3>Evidence first. Context visible.</h3><p>See how FMB News handles sourcing, analysis, corrections, and editorial clarity.</p></div></a></div></div><div class="world-gateway-method"><article><strong>What happened</strong><p>The verified development, stated without unnecessary interpretation.</p></article><article><strong>Why it matters</strong><p>The economic, political, cultural, technological, or human consequence.</p></article><article><strong>What to watch</strong><p>The next signal that could materially change the story or its impact.</p></article></div></div></section>`;
  }

  if(pathname==="/news/world/live/"&&!document.querySelector(".world-gateway-topline")){
    document.body.classList.add("fmb-worldwide-edition");
    const main=document.querySelector("main");
    if(main)main.innerHTML=`<section class="cms-live-hero"><div class="shell"><a href="/news/world/">← FMB Worldwide</a><div class="world-gateway-topline" style="margin-top:22px;margin-bottom:14px"><span class="world-gateway-kicker">Live global desk</span><span class="world-gateway-live"><i aria-hidden="true"></i> Rolling 24 hours</span></div><h1 style="margin:0;max-width:12ch;font-family:Georgia,'Times New Roman',serif;font-size:clamp(2.8rem,7vw,5.6rem);line-height:.92;letter-spacing:-.05em">The world, now.</h1><p>The newest verified FMB Worldwide edition. Facts, relevance and strategic context are kept distinct so readers can see what happened and what it may mean.</p></div></section><div class="shell"><div data-cms-edition="worldwide"><p class="cms-loading">Loading FMB Worldwide…</p></div></div>`;
  }
})();

(function loadFmbCms(){if(!document.querySelector('link[data-fmb-cms]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/assets/css/fmb-news-cms.css?v=20260831';l.dataset.fmbCms='true';document.head.appendChild(l)}if(!document.querySelector('script[data-fmb-cms]')){const s=document.createElement('script');s.src='/assets/js/fmb-news-cms.js?v=20260831';s.defer=true;s.dataset.fmbCms='true';document.head.appendChild(s)}})();