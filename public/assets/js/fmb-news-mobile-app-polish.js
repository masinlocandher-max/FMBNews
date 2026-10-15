(()=>{
  if(!matchMedia('(max-width:699px)').matches)return;
  const $=(q,s=document)=>s.querySelector(q),$$=(q,s=document)=>[...s.querySelectorAll(q)];
  document.documentElement.setAttribute('data-fmb-mobile-polish','true');

  // Approved mobile navigation is the section rail under the wordmark plus the
  // fixed editorial dock. Suppress only retired duplicate strips; never hide the
  // rail or the dock (both must stay in the accessibility tree).
  const APPROVED=['fmb-editorial-mobile-dock','fmb-mobile-app-shell','fmb-mobile-product-rail'];
  function hideLegacyProductRails(){
    for(const nav of $$('nav')){
      if(nav.closest('footer'))continue;
      if(APPROVED.some(cls=>nav.classList.contains(cls)||nav.closest(`.${cls}`))){
        if(nav.classList.contains('fmb-legacy-product-rail')){
          nav.classList.remove('fmb-legacy-product-rail');
          nav.hidden=false;
          nav.removeAttribute('aria-hidden');
        }
        continue;
      }
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
    // The old utility strip used to be built into the shell here and then torn
    // out again on every page, which also meant it could flash before removal.
    // It is no longer built, so there is nothing to remove.
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
