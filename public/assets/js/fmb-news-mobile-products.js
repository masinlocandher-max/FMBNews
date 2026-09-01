(()=>{
  if(!matchMedia('(max-width:699px)').matches)return;
  const path=location.pathname.replace(/\/+$/,'')||'/news';
  const body=document.body;
  const route=
    path==='/news'?'home':
    path==='/news/archive'?'archive':
    path.startsWith('/news/world')?'world':
    path.startsWith('/news/explainer')?'explainer':
    path.startsWith('/news/fmb-brief')?'brief':
    path.startsWith('/news/horoscope')?'horoscope':
    path.startsWith('/news/crossword')?'crossword':
    path.startsWith('/news/about')?'about':'article';
  body.classList.add('fmb-mobile-product-page',`fmb-mobile-route-${route}`);
  body.dataset.fmbRoute=route;

  const shell=document.querySelector('.fmb-mobile-app-shell');
  if(shell)shell.dataset.fmbRoute=route;

  function addArchiveIntro(){
    const main=document.querySelector('main.shell.section');
    if(!main||main.querySelector('.fmb-route-signature'))return;
    const el=document.createElement('section');
    el.className='fmb-route-signature fmb-archive-signature';
    el.innerHTML='<div><small>FMB NEWSROOM INDEX</small><h1>Every report. One record.</h1><p>Browse the Filipino Media Bulletin archive by story, date, and subject.</p></div><span aria-hidden="true">FMB</span>';
    main.prepend(el);
  }

  function addWorldSignature(){
    const hero=document.querySelector('.world-hero .shell');
    if(!hero||hero.querySelector('.fmb-world-signal'))return;
    const el=document.createElement('div');
    el.className='fmb-world-signal';
    el.innerHTML='<span class="fmb-world-orbit" aria-hidden="true"></span><div><strong>GLOBAL DESK</strong><small>24-hour verified intelligence for Filipino readers</small></div>';
    hero.prepend(el);
  }

  function addBriefSignature(){
    const hero=document.querySelector('.brief-archive-hero .brief-shell,.brief-archive-hero .shell');
    if(!hero||hero.querySelector('.fmb-brief-signature-visual'))return;
    const img=document.createElement('img');
    img.className='fmb-brief-signature-visual';
    img.src='/news/assets/images/mobile/fmb-daily-brief-mug.jpg';
    img.alt='Purple FMB Daily Brief coffee mug with gold FMB emblem';
    img.loading='eager';
    hero.append(img);
  }

  function addHoroscopeSignature(){
    const hero=document.querySelector('.fmb-feature-hero');
    if(!hero||hero.querySelector('.fmb-horoscope-constellation'))return;
    const art=document.createElement('div');
    art.className='fmb-horoscope-constellation';
    art.setAttribute('aria-hidden','true');
    art.innerHTML='<span>♈</span><span>♊</span><span>♌</span><span>♎</span><span>♐</span><span>♒</span>';
    hero.prepend(art);
  }

  function addCrosswordSignature(){
    const hero=document.querySelector('.fmb-feature-hero');
    if(!hero||hero.querySelector('.fmb-crossword-count'))return;
    const count=document.createElement('div');
    count.className='fmb-crossword-count';
    count.innerHTML='<strong>36</strong><span>CURRENT-EVENT<br>ANSWERS</span>';
    hero.prepend(count);
  }

  function addAboutSignature(){
    const hero=document.querySelector('.fmb-about-hero .fnc-shell');
    if(!hero||hero.querySelector('.fmb-about-fmb-mark'))return;
    const mark=document.createElement('div');
    mark.className='fmb-about-fmb-mark';
    mark.innerHTML='<img src="/news/assets/images/brand/fmb-bulletin-emblem.svg" alt=""><span>FILIPINO<br>MEDIA<br>BULLETIN</span>';
    hero.prepend(mark);
  }

  function addArticleProgress(){
    const article=document.querySelector('.article,.cms-article,article.article,[data-cms-article]');
    if(!article||document.querySelector('.fmb-reading-progress'))return;
    const bar=document.createElement('div');
    bar.className='fmb-reading-progress';
    bar.setAttribute('aria-hidden','true');
    bar.innerHTML='<i></i>';
    document.body.append(bar);
    const fill=bar.querySelector('i');
    const update=()=>{
      const rect=article.getBoundingClientRect();
      const total=Math.max(1,article.offsetHeight-innerHeight*.45);
      const read=Math.min(total,Math.max(0,-rect.top+innerHeight*.22));
      fill.style.transform=`scaleX(${Math.min(1,read/total)})`;
    };
    update();addEventListener('scroll',update,{passive:true});addEventListener('resize',update,{passive:true});
  }

  ({archive:addArchiveIntro,world:addWorldSignature,brief:addBriefSignature,horoscope:addHoroscopeSignature,crossword:addCrosswordSignature,about:addAboutSignature,article:addArticleProgress}[route]||(()=>{}))();
  // Reading progress belongs to every true long-form article even when the
  // page remains inside a branded product family such as FMB Explainer.
  addArticleProgress();
})();
