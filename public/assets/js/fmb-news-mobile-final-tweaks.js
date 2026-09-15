(()=>{
  if(!matchMedia('(max-width:699px)').matches)return;
  const path=location.pathname.replace(/\/+$/,'')||'/news';

  if(path==='/news'){
    /* The final visual system owns hero geometry in CSS. Keep JavaScript limited
       to behavior so runtime inline styles cannot override responsive layout. */

    /* This used to clear inline presentation the shared runtime forced onto the
       selected item of .fmb-mobile-product-rail. That rail is no longer built,
       so there is no inline presentation left to clear. */
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