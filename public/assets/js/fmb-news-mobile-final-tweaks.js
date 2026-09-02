(()=>{
  if(!matchMedia('(max-width:699px)').matches)return;
  const path=location.pathname.replace(/\/+$/,'')||'/news';

  if(path==='/news'){
    const copy=document.querySelector('.fmb-approved-hero-copy');
    if(copy){
      copy.style.setProperty('width',window.innerWidth<=390?'min(50%,194px)':'min(52%,208px)','important');
      copy.style.setProperty('max-width',window.innerWidth<=390?'194px':'208px','important');
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
