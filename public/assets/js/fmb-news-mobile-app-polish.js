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
        if(!nav.hidden)nav.hidden=true;
        nav.setAttribute('aria-hidden','true');
      }
    }
  }

  function placeHomeContext(){
    const shell=$('.fmb-mobile-app-shell'),utility=$('.fmb-global-mobile-utility');
    if(!shell||!utility)return;
    $('.fmb-global-week-actions',utility)?.remove();
    const isHome=document.body.dataset.fmbRoute==='home'||location.pathname.replace(/\/+$/,'')==='/news';
    if(!isHome){utility.remove();return}
    const hero=$('.fmb-app-brand-hero');
    if(hero&&utility.previousElementSibling!==hero)hero.after(utility);
    const weather=$('[data-fmb-weather]',utility);
    if(weather&&/set local weather/i.test(weather.textContent||''))weather.textContent='Weather';
    const button=$('[data-fmb-weather-button]',utility);
    if(button)button.setAttribute('aria-label','Set local weather');
  }

  function clean(){hideLegacyProductRails();placeHomeContext()}
  clean();
  addEventListener('DOMContentLoaded',clean,{once:true});
  addEventListener('load',clean,{once:true});
  const observer=new MutationObserver(()=>requestAnimationFrame(clean));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),5000);
})();
