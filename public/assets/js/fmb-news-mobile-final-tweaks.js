(()=>{
  if(!matchMedia('(max-width:699px)').matches)return;
  const path=location.pathname.replace(/\/+$/,'')||'/news';

  if(path==='/news'){
    const copy=document.querySelector('.fmb-approved-hero-copy');
    if(copy){
      copy.style.setProperty('width',window.innerWidth<=390?'min(55%,206px)':'min(56%,224px)','important');
      copy.style.setProperty('max-width',window.innerWidth<=390?'206px':'224px','important');
    }

    /* The shared runtime used to force a heavier selected-product tile inline.
       Clear only those old presentation properties so the final minimal metallic CSS is authoritative. */
    const active=document.querySelector('.fmb-mobile-product-rail a[aria-current="page"]');
    if(active){
      active.style.removeProperty('color');
      active.style.removeProperty('background');
      active.style.removeProperty('text-shadow');
    }
  }

  if(path.startsWith('/news/crossword')){
    document.querySelectorAll('.fmb-crossword-count').forEach(el=>el.remove());
    const hero=document.querySelector('.fmb-feature-hero');
    if(hero&&!hero.querySelector('.fmb-crossword-visual')){
      const art=document.createElement('div');
      art.className='fmb-crossword-visual';
      art.setAttribute('aria-hidden','true');
      art.innerHTML='<i></i><i></i><i class="on"></i><i></i><i class="on"></i><i></i><i class="on"></i><i class="on"></i><i></i>';
      hero.prepend(art);
    }
  }
})();
