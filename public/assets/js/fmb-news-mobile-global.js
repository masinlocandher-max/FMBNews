(()=>{
  if(!matchMedia('(max-width:699px)').matches)return;
  document.documentElement.setAttribute('data-fmb-global-mobile','true');
  const $=(q,s=document)=>s.querySelector(q);
  const SAVED_KEY='fmbSavedStoriesV1';
  const jget=(k,d=null)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
  const jset=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

  function productForPath(){
    const p=location.pathname.replace(/\/+$/,'')||'/news';
    if(p.startsWith('/news/world'))return{key:'world',label:'FMB Worldwide'};
    if(p.startsWith('/news/explainer'))return{key:'explainer',label:'FMB Explainer'};
    if(p.startsWith('/news/fact-check'))return{key:'fact',label:'FMB Fact Check'};
    if(p.startsWith('/news/fmb-brief'))return{key:'brief',label:'FMB Daily Brief'};
    return{key:'news',label:'FMB News'};
  }

  function svg(key){
    const icons={
      menu:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>',
      search:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg>',
      account:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"></circle><path d="M5.8 19c.8-3.4 3-5.2 6.2-5.2s5.4 1.8 6.2 5.2"></path></svg>',
      news:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2"></rect><path d="M8 9h5M8 13h8M8 16h6M16 9h1"></path></svg>',
      world:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M4 12h16M12 4c2.2 2.2 3.2 4.9 3.2 8s-1 5.8-3.2 8M12 4C9.8 6.2 8.8 8.9 8.8 12s1 5.8 3.2 8"></path></svg>',
      explainer:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5A3.5 3.5 0 0 1 8.5 3H12v16H8.5A3.5 3.5 0 0 0 5 22zM19 6.5A3.5 3.5 0 0 0 15.5 3H12v16h3.5A3.5 3.5 0 0 1 19 22z"></path></svg>',
      fact:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5c0 4.6-2.6 8-7 10-4.4-2-7-5.4-7-10V6z"></path><path d="m9 12 2 2 4-4"></path></svg>',
      brief:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2"></rect><path d="M8 8h8M8 12h8M8 16h5"></path></svg>'
    };
    return icons[key]||'';
  }

  function productRail(active){
    const items=[['news','/news/','FMB News'],['world','/news/world/','FMB Worldwide'],['explainer','/news/explainer/','FMB Explainer'],['fact','/news/fact-check/','FMB Fact Check'],['brief','/news/fmb-brief/','FMB Daily Brief']];
    return `<nav class="fmb-mobile-product-rail" aria-label="FMB products">${items.map(([key,href,label])=>`<a href="${href}" data-product="${key}"${key===active?' aria-current="page"':''}>${svg(key)}<span>${label}</span></a>`).join('')}</nav>`;
  }

  const focusableSelector='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function openSheet(title,body,opener=document.activeElement){
    $('.fmb-app-action-sheet')?.remove();
    const sheet=document.createElement('div');
    const titleId=`fmb-sheet-title-${Date.now()}`;
    sheet.className='fmb-app-action-sheet';
    sheet.innerHTML=`<section class="fmb-app-action-panel" role="dialog" aria-modal="true" aria-labelledby="${titleId}" tabindex="-1"><h2 id="${titleId}">${title}</h2><div class="fmb-app-action-list">${body}</div><button type="button" data-close-sheet>Close</button></section>`;
    document.body.append(sheet);
    const panel=$('.fmb-app-action-panel',sheet);
    const close=()=>{
      if(!sheet.isConnected)return;
      sheet.remove();
      if(opener instanceof HTMLElement&&opener.isConnected)opener.focus({preventScroll:true});
    };
    $('[data-close-sheet]',sheet).addEventListener('click',close);
    sheet.addEventListener('click',e=>{if(e.target===sheet)close()});
    sheet.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();close();return}
      if(e.key!=='Tab')return;
      const focusable=[...sheet.querySelectorAll(focusableSelector)].filter(el=>el.getClientRects().length>0);
      if(!focusable.length){e.preventDefault();panel.focus();return}
      const first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    });
    const focusInside=()=>{
      const first=$(focusableSelector,panel);
      (first||panel).focus({preventScroll:true});
    };
    focusInside();
    requestAnimationFrame(()=>{if(!sheet.contains(document.activeElement))focusInside()});
    return sheet;
  }

  function openMore(opener){
    const accountItem=`<button type="button" data-fmb-open-account><span class="fmb-menu-item-main">${svg('account')}<span>Your FMB</span></span><span>›</span></button>`;
    const installItem='<button type="button" data-fmb-install><span>Add to Home Screen</span><span>›</span></button>';
    const sheet=openSheet('More from FMB News',`${accountItem}${installItem}<a href="/news/world/">Worldwide <span>›</span></a><a href="/news/explainer/">Explainer <span>›</span></a><a href="/news/fact-check/">Fact Check <span>›</span></a><a href="/news/horoscope/">Horoscope <span>›</span></a><a href="/news/crossword/">Crossword Puzzle <span>›</span></a><a href="/news/about/">About FMB News <span>›</span></a><a href="/news/submit/">Submit a story <span>›</span></a>`,opener);
    $('[data-fmb-open-account]',sheet)?.addEventListener('click',()=>{
      $('[data-close-sheet]',sheet)?.click();
      requestAnimationFrame(()=>document.querySelector('[data-fmb-account],.fmb-account-button,[data-account]')?.click());
    });
    $('[data-fmb-install]',sheet)?.addEventListener('click',()=>{
      $('[data-close-sheet]',sheet)?.click();
      requestAnimationFrame(()=>document.dispatchEvent(new CustomEvent('fmb:install-request')));
    });
    return sheet;
  }

  function ensureShell(){
    if($('.fmb-mobile-app-shell'))return $('.fmb-mobile-app-shell');
    const product=productForPath();
    const isHome=location.pathname.replace(/\/+$/,'')==='/news';
    const shell=document.createElement('div');
    shell.className=`fmb-mobile-app-shell${isHome?' is-home':''}`;
    const brand=`<a class="fmb-mobile-shell-brand" href="/news/" aria-label="FMB News — Filipino Media Bulletin"><img src="/news/assets/images/brand/fmb-bulletin-emblem.svg" alt=""><span class="fmb-mobile-shell-copy"><strong>FMB News</strong><small>Filipino Media Bulletin</small></span></a>`;
    shell.innerHTML=`<div class="fmb-mobile-shell-head"><div class="fmb-mobile-shell-actions fmb-mobile-shell-search"><a href="/news/search/" aria-label="Search FMB News">${svg('search')}</a></div>${brand}<button class="fmb-mobile-shell-menu" type="button" data-fmb-shell-menu aria-label="Open FMB News menu" aria-haspopup="dialog">${svg('menu')}</button></div>${productRail(product.key)}`;
    document.body.prepend(shell);
    if(isHome){
      const ticker=$('.fmb-app-top-ticker');
      if(ticker)shell.append(ticker);
    }
    $('[data-fmb-shell-menu]',shell)?.addEventListener('click',e=>openMore(e.currentTarget));
    return shell;
  }

  function addReaderActions(){
    const article=$('.article,.cms-article,article.article');
    if(!article||$('.fmb-mobile-reader-actions'))return;
    const title=$('h1',article)?.textContent?.trim()||document.title.replace(/\s*\|.*$/,'');
    const toolbar=document.createElement('div');
    toolbar.className='fmb-mobile-reader-actions';
    toolbar.innerHTML='<button type="button" data-fmb-reader-back aria-label="Go back">← Back</button><span></span><button type="button" data-fmb-reader-save>Save</button><button type="button" data-fmb-reader-share>Share</button>';
    article.prepend(toolbar);
    $('[data-fmb-reader-back]',toolbar).onclick=()=>history.length>1?history.back():location.assign('/news/');
    const save=$('[data-fmb-reader-save]',toolbar);
    const saved=jget(SAVED_KEY,[]);
    const current=()=>saved.some(x=>x.path===location.pathname);
    const sync=()=>{save.textContent=current()?'Saved':'Save';save.setAttribute('aria-pressed',String(current()))};
    sync();
    save.onclick=()=>{
      const i=saved.findIndex(x=>x.path===location.pathname);
      if(i>=0)saved.splice(i,1);else saved.unshift({path:location.pathname,title,savedAt:Date.now()});
      jset(SAVED_KEY,saved.slice(0,100));sync();
    };
    $('[data-fmb-reader-share]',toolbar).onclick=async()=>{
      try{
        if(navigator.share)await navigator.share({title,url:location.href});
        else{
          await navigator.clipboard.writeText(location.href);
          const button=$('[data-fmb-reader-share]',toolbar);button.textContent='Copied';setTimeout(()=>button.textContent='Share',1200);
        }
      }catch{}
    };
  }

  ensureShell();
  addReaderActions();
})();