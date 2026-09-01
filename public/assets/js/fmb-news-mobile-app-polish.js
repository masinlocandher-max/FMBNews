(()=>{
  if(!matchMedia('(max-width:699px)').matches)return;
  const $=(q,s=document)=>s.querySelector(q),$$=(q,s=document)=>[...s.querySelectorAll(q)];
  document.documentElement.setAttribute('data-fmb-mobile-polish','true');

  function hideLegacyProductRails(){
    for(const nav of $$('nav')){
      if(nav.classList.contains('fmb-mobile-product-rail')||nav.closest('footer'))continue;
      const hrefs=$$('a[href]',nav).map(a=>a.getAttribute('href')||'');
      const hits=[
        hrefs.some(h=>/^\/news\/?(?:$|[?#])/.test(h)),
        hrefs.some(h=>h.startsWith('/news/world')),
        hrefs.some(h=>h.startsWith('/news/explainer')),
        hrefs.some(h=>h.startsWith('/news/fmb-brief'))
      ].filter(Boolean).length;
      if(hits>=3){
        nav.classList.add('fmb-legacy-product-rail');
        nav.hidden=true;
        nav.setAttribute('aria-hidden','true');
      }
    }
  }

  function cleanGlobalUtility(){
    const utility=$('.fmb-global-mobile-utility');
    if(utility)utility.remove();
    const heroOverlay=$('.fmb-app-brand-hero>.fmb-hero-live-overlay');
    if(!heroOverlay)return;
    const weather=$('[data-fmb-weather]',heroOverlay);
    if(weather&&/set local weather/i.test(weather.textContent||''))weather.textContent='Weather';
    const button=$('[data-fmb-weather-button]',heroOverlay);
    if(button)button.setAttribute('aria-label','Set local weather');
  }

  function clean(){hideLegacyProductRails();cleanGlobalUtility()}
  clean();
  addEventListener('DOMContentLoaded',clean,{once:true});
  addEventListener('load',clean,{once:true});
  const observer=new MutationObserver(()=>requestAnimationFrame(clean));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),5000);
})();
