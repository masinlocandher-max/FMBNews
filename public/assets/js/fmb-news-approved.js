const assetBase="/assets/data/fmb-news-approved/";
const assetFiles={
  logo:["logo-0.txt","logo-1.txt","logo-2.txt","logo-3.txt"],
  hero:["hero-0.txt","hero-1.txt","hero-2.txt","hero-3.txt","hero-4.txt"]
};

async function loadAsset(name){
  const parts=await Promise.all(assetFiles[name].map(file=>fetch(assetBase+file).then(r=>{
    if(!r.ok)throw new Error(`Unable to load ${file}`);
    return r.text();
  })));
  const src="data:image/webp;base64,"+parts.join("");
  document.querySelectorAll(`[data-fmb-asset="${name}"]`).forEach(img=>img.src=src);
}

Promise.all([loadAsset("logo"),loadAsset("hero")]).catch(console.error);

const clock=document.getElementById("phtClock");
function updateClock(){
  if(!clock)return;
  clock.textContent=new Intl.DateTimeFormat("en-PH",{
    timeZone:"Asia/Manila",
    hour:"numeric",
    minute:"2-digit",
    hour12:true
  }).format(new Date())+" PHT";
}
updateClock();
setInterval(updateClock,30000);

const menu=document.querySelector("[data-menu]");
const mobileNav=document.querySelector("[data-mobile-nav]");
if(menu&&mobileNav){
  menu.addEventListener("click",()=>{
    const next=!mobileNav.hasAttribute("data-open");
    mobileNav.toggleAttribute("data-open",next);
    menu.setAttribute("aria-expanded",String(next));
  });
}

(function activateWorldwideDesk(){
  const pathname=location.pathname.replace(/\/+$/, "/");
  if(!pathname.startsWith("/news/world/"))return;

  document.body.classList.add("fmb-worldwide-route");

  if(!document.querySelector('link[data-fmb-worldwide]')){
    const link=document.createElement("link");
    link.rel="stylesheet";
    link.href="/assets/css/fmb-worldwide.css?v=20260831b";
    link.dataset.fmbWorldwide="true";
    document.head.appendChild(link);
  }

  document.querySelectorAll('.desktop-nav a[href="/news/world/"], .mobile-nav a[href="/news/world/"]').forEach(link=>{
    link.setAttribute("aria-current","page");
  });

  if(pathname==="/news/world/"){
    const kicker=document.querySelector(".world-kicker");
    if(kicker&&!document.querySelector(".world-live")){
      const badge=document.createElement("span");
      badge.className="world-live";
      const dot=document.createElement("i");
      dot.setAttribute("aria-hidden","true");
      badge.append(dot,document.createTextNode(" Live global desk"));
      kicker.insertAdjacentElement("afterend",badge);
    }

    const editionLink=document.querySelector(".edition-link");
    if(editionLink){
      editionLink.href="/news/world/live/";
      editionLink.textContent="Read live edition →";
    }

    const deskNote=document.querySelector(".world-feed .world-note");
    if(deskNote){
      deskNote.innerHTML="<strong>Live desk:</strong> This page refreshes from the latest published FMB Worldwide edition. The strongest verified developments stay prominent while the complete country-by-country briefing remains available in the live edition.";
    }
  }
})();

(function loadFmbCms(){
  if(!document.querySelector('link[data-fmb-cms]')){
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='/assets/css/fmb-news-cms.css?v=20260831';
    l.dataset.fmbCms='true';
    document.head.appendChild(l);
  }
  if(!document.querySelector('script[data-fmb-cms]')){
    const s=document.createElement('script');
    s.src='/assets/js/fmb-news-cms.js?v=20260831';
    s.defer=true;
    s.dataset.fmbCms='true';
    document.head.appendChild(s);
  }
})();