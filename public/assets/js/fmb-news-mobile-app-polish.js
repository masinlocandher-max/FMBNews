(()=>{
  if(!matchMedia('(max-width:699px)').matches)return;
  const $=(q,s=document)=>s.querySelector(q),$$=(q,s=document)=>[...s.querySelectorAll(q)];
  document.documentElement.setAttribute('data-fmb-mobile-polish','true');

  function dedupeProductRails(){
    for(const nav of $$('.fmb-mobile-product-rail')){
      const seen=new Set();
      for(const link of $$('a[href]',nav)){
        const href=(link.getAttribute('href')||'').replace(/[?#].*$/,'').replace(/\/+$/,'/')||'/';
        const key=href==='/news/'?'news':href.startsWith('/news/world/')?'world':href.startsWith('/news/explainer/')?'explainer':href.startsWith('/news/fact-check/')?'fact':href.startsWith('/news/fmb-brief/')?'brief':null;
        if(!key)continue;
        if(seen.has(key)){link.remove();continue}
        seen.add(key);
      }
    }
  }

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

  function clean(){dedupeProductRails();hideLegacyProductRails();cleanGlobalUtility()}
  clean();
  addEventListener('DOMContentLoaded',clean,{once:true});
  addEventListener('load',clean,{once:true});
  const observer=new MutationObserver(()=>requestAnimationFrame(clean));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),5000);
})();
