(()=>{
  const QUALITY_SELECTOR='.fmb-mobile-app';
  const weakImage=(src='')=>{
    const value=String(src).toLowerCase();
    return !value||value.includes('fmb-news-editorial-fallback')||value.includes('newsroom-editorial-fallback')||value.includes('placeholder')||value.includes('/news/2026-08-31/')&&value.endsWith('.svg')||/\/assets\/images\/news\/.*\.svg(?:\?|$)/.test(value);
  };

  const overrides=new Map([
    ['/news/south-korea-unification-church-sentencing-august-31-2026/',{
      src:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Dr._Hak_Xa_Han_Mun_duke_mbajtur_fjal%C3%ABn_kryesore.jpg?width=1600',
      alt:'Hak Ja Han speaking at a podium during a 2019 peace summit in Tirana',
      label:'ARCHIVE PHOTO'
    }],
    ['/news/nepal-bhote-koshi-flood-rescue-august-31-2026/',{
      src:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Bhote_Koshi_River_in_Tataopani%2C_Sindhupalchok_District%2C_Nepal.jpg?width=1600',
      alt:'Bhote Koshi River in Tatopani, Sindhupalchok District, Nepal',
      label:'FILE PHOTO'
    }],
    ['/news/us-iran-fire-resumes-oil-rises-august-31-2026/',{
      src:'https://commons.wikimedia.org/wiki/Special:Redirect/file/STS004-37-716_-_Strait_of_Hormuz.jpg?width=1600',
      alt:'Satellite view of the Strait of Hormuz between Iran, Oman and the United Arab Emirates',
      label:'FILE PHOTO'
    }]
  ]);

  const pathOf=href=>{try{return new URL(href,location.origin).pathname.replace(/\/+$/,'/')||'/'}catch{return''}};

  function removeWeakImage(card,img){
    if(img)img.remove();
    card.classList.add(card.classList.contains('fmb-app-lead')?'fmb-app-lead--no-image':'fmb-app-story--no-image');
    card.querySelector('.fmb-app-image-label')?.remove();
  }

  function addLabel(card,label){
    if(!label||card.querySelector('.fmb-app-image-label'))return;
    const badge=document.createElement('span');
    badge.className='fmb-app-image-label';
    badge.textContent=label;
    card.appendChild(badge);
  }

  function installImage(card,info){
    const isLead=card.classList.contains('fmb-app-lead');
    let img=card.querySelector('img');
    if(!img){
      img=document.createElement('img');
      if(isLead){
        img.className='fmb-app-lead-media';
        img.fetchPriority='high';
        card.insertBefore(img,card.querySelector('.fmb-app-lead-content'));
      }else{
        img.className='fmb-app-story-media';
        img.loading='lazy';
        const link=card.querySelector(':scope > a[href]');
        if(link)link.appendChild(img);
      }
    }
    img.src=info.src;
    img.alt=info.alt||'';
    img.decoding='async';
    img.referrerPolicy='no-referrer';
    card.classList.remove('fmb-app-lead--no-image','fmb-app-story--no-image');
    addLabel(card,info.label);
    img.addEventListener('error',()=>removeWeakImage(card,img),{once:true});
  }

  function improveCard(card){
    if(card.dataset.fmbImageChecked==='1')return;
    const href=card.querySelector('a[href^="/news/"],a[href*="/news/"]')?.getAttribute('href')||'';
    const path=pathOf(href);
    const override=overrides.get(path);
    const img=card.querySelector('img');
    if(override){
      installImage(card,override);
      card.dataset.fmbImageChecked='1';
      return;
    }
    if(!img||weakImage(img.currentSrc||img.src))removeWeakImage(card,img);
    else img.addEventListener('error',()=>removeWeakImage(card,img),{once:true});
    card.dataset.fmbImageChecked='1';
  }

  function audit(){
    const app=document.querySelector(QUALITY_SELECTOR);
    if(!app)return false;
    app.querySelectorAll('.fmb-app-lead,.fmb-app-story').forEach(card=>{
      if(card.dataset.fmbImageChecked==='1'&&!card.isConnected)return;
      improveCard(card);
    });
    return true;
  }

  function boot(){
    if(!matchMedia('(max-width:699px)').matches)return;
    let tries=0;
    const timer=setInterval(()=>{
      tries+=1;
      if(audit()||tries>40)clearInterval(timer);
    },100);
    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.addedNodes.length)){
        document.querySelectorAll('.fmb-app-lead,.fmb-app-story').forEach(card=>{
          if(card.dataset.fmbImageChecked!=='1')improveCard(card);
        });
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();