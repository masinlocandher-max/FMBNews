(()=>{
  const isMobile=()=>window.matchMedia('(max-width:699px)').matches;
  const route=location.pathname.replace(/\/+$/,'/')||'/';
  const excluded=new Set(['/news/','/news/world/','/news/fmb-brief/','/news/about/']);
  const icon={
    search:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.25"></circle><path d="m15.2 15.2 4.8 4.8"></path></svg>',
    menu:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>',
    home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3.8 10.4 8.2-7 8.2 7v9.2a1.4 1.4 0 0 1-1.4 1.4h-4.7v-6h-4.2v6H5.2a1.4 1.4 0 0 1-1.4-1.4z"></path></svg>',
    brief:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.8h9l3 3V20H6z"></path><path d="M15 3.8V7h3M9 11h6M9 14h6M9 17h4"></path></svg>',
    saved:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.2h11v16l-5.5-3.5-5.5 3.5z"></path></svg>',
    wire:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.4 8.7a4.8 4.8 0 0 0 0 6.6M5.5 5.7a9 9 0 0 0 0 12.6M15.6 8.7a4.8 4.8 0 0 1 0 6.6M18.5 5.7a9 9 0 0 1 0 12.6"></path><circle cx="12" cy="12" r="1.7"></circle></svg>',
    bookmark:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.2h11v16l-5.5-3.5-5.5 3.5z"></path></svg>'
  };
  const clean=s=>(s||'').replace(/\s+/g,' ').trim();
  const slugFromHref=href=>{try{return new URL(href,location.origin).pathname}catch{return href||''}};
  const blocked=href=>{
    const p=slugFromHref(href);
    return !p.startsWith('/news/')||p==='/news/'||p.startsWith('/news/world/')||p.startsWith('/news/fmb-brief/')||p.startsWith('/news/about/')||p.startsWith('/news/archive/');
  };
  function candidateFrom(el){
    const link=el.matches('a[href]')?el:el.querySelector('a[href]');
    if(!link||blocked(link.getAttribute('href')||''))return null;
    const root=el.closest('article,.archive-item,.story-card,.more-item,.support-item,.lead-story,.cms-edition-entry')||el;
    const titleEl=root.querySelector('h1,h2,h3')||link.querySelector('h1,h2,h3');
    const title=clean(titleEl?.textContent||link.getAttribute('aria-label')||link.textContent);
    if(title.length<18)return null;
    const img=root.querySelector('img');
    const category=clean(root.querySelector('.category,.cms-kicker,.article-kicker,.meta .category,em,small')?.textContent||'FMB News');
    const deck=clean(root.querySelector('p')?.textContent||'');
    const time=clean(root.querySelector('time,.article-date,.meta span:not(.category)')?.textContent||'');
    return {href:link.href,title,img:img?.currentSrc||img?.src||'',alt:img?.alt||title,category,deck,time};
  }
  function collectStories(){
    const selectors=['main article','main .archive-item','main .story-card','main .more-item','main .support-item','main .lead-story','main .cms-edition-entry'];
    const seen=new Set(),out=[];
    document.querySelectorAll(selectors.join(',')).forEach(el=>{
      const s=candidateFrom(el);if(!s)return;
      const key=slugFromHref(s.href);if(seen.has(key))return;seen.add(key);out.push(s);
    });
    if(out.length<3){
      document.querySelectorAll('main a[href^="/news/"]').forEach(link=>{
        const s=candidateFrom(link);if(!s)return;const key=slugFromHref(s.href);if(seen.has(key))return;seen.add(key);out.push(s);
      });
    }
    return out.slice(0,24);
  }
  const savedKey='fmbNewsSavedStoriesV1';
  const readSaved=()=>{try{return JSON.parse(localStorage.getItem(savedKey)||'[]')}catch{return[]}};
  const writeSaved=list=>{try{localStorage.setItem(savedKey,JSON.stringify(list))}catch{}};
  const isSaved=href=>readSaved().some(x=>x.href===slugFromHref(href));
  function toggleSaved(story){
    const path=slugFromHref(story.href),list=readSaved(),i=list.findIndex(x=>x.href===path);
    if(i>=0){list.splice(i,1);writeSaved(list);return false}
    list.unshift({href:path,title:story.title,category:story.category,img:story.img,alt:story.alt,time:story.time});writeSaved(list.slice(0,50));return true;
  }
  const esc=s=>String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function normalizedCategory(s){return clean(s.category).toLowerCase()}
  function tabMatch(story,tab){
    if(tab==='All')return true;const c=normalizedCategory(story);
    if(tab==='Philippines')return /philipp|nation|zambales|government|politic|metro|luzon|visayas|mindanao/.test(c);
    if(tab==='World')return /world|global|international|united states|iran|russia|china|japan|korea|nepal/.test(c);
    if(tab==='Economy')return /econom|business|finance|market|peso|inflation|energy|trade/.test(c);
    if(tab==='Culture')return /culture|entertain|pageant|film|arts|heritage|people/.test(c);
    return true;
  }
  function storyRow(s){
    const saved=isSaved(s.href);
    return `<article class="fmb-app-story" data-story-href="${esc(slugFromHref(s.href))}"><a href="${esc(slugFromHref(s.href))}" aria-label="${esc(s.title)}">${s.img?`<img class="fmb-app-story-media" src="${esc(s.img)}" alt="${esc(s.alt)}" loading="lazy">`:'<div class="fmb-app-story-media"></div>'}</a><div class="fmb-app-story-copy"><span class="fmb-app-category">${esc(s.category||'FMB News')}</span><h3><a href="${esc(slugFromHref(s.href))}" style="color:inherit;text-decoration:none">${esc(s.title)}</a></h3><div class="fmb-app-story-meta">${esc(s.time||'Read report')}</div></div><button class="fmb-app-story-save" type="button" aria-label="${saved?'Remove from saved':'Save story'}" aria-pressed="${saved}" data-save="${esc(slugFromHref(s.href))}">${icon.bookmark}</button></article>`;
  }
  function leadCard(s){
    if(!s)return'';const saved=isSaved(s.href);return `<article class="fmb-app-lead"><a href="${esc(slugFromHref(s.href))}" aria-label="${esc(s.title)}" style="position:absolute;inset:0;z-index:1"></a>${s.img?`<img class="fmb-app-lead-media" src="${esc(s.img)}" alt="${esc(s.alt)}" fetchpriority="high">`:''}<div class="fmb-app-lead-content"><span class="fmb-app-category">Top story · ${esc(s.category||'FMB News')}</span><h1>${esc(s.title)}</h1>${s.deck?`<p>${esc(s.deck)}</p>`:''}<div class="fmb-app-meta"><span>${esc(s.time||'Latest report')}</span></div></div><button class="fmb-app-save" type="button" aria-label="${saved?'Remove from saved':'Save story'}" aria-pressed="${saved}" data-save="${esc(slugFromHref(s.href))}">${icon.bookmark}</button></article>`}
  function createSheet(id,title,body){return `<div class="fmb-app-sheet" id="${id}" aria-hidden="true"><div class="fmb-app-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="${id}-title"><div class="fmb-app-sheet-handle"></div><div class="fmb-app-sheet-head"><h2 id="${id}-title">${title}</h2><button class="fmb-app-sheet-close" type="button" data-close-sheet aria-label="Close">×</button></div>${body}</div></div>`}
  function boot(){
    if(!isMobile()||document.querySelector('.fmb-mobile-app'))return;
    const stories=collectStories();
    if(stories.length<2)return;
    const pathname=location.pathname.replace(/\/+$/,'/');
    if(pathname==='/news/'&&document.body.classList.contains('fmb-network-landing'))return;
    const wireHeadline=clean(document.querySelector('.headline-ticker .ticker-headline')?.textContent||stories[0].title);
    const lead=stories[0],rest=stories.slice(1,9);
    const app=document.createElement('div');app.className='fmb-mobile-app';app.setAttribute('data-fmb-mobile-app','');
    app.innerHTML=`<header class="fmb-app-top"><div class="fmb-app-top-row"><a class="fmb-app-brand" href="/news/archive/" aria-label="FMB News"><strong>FMB</strong><span>News</span></a><div class="fmb-app-actions"><button class="fmb-app-icon-button" type="button" data-open-search aria-label="Search FMB News">${icon.search}</button><button class="fmb-app-icon-button" type="button" data-open-menu aria-label="Open menu">${icon.menu}</button></div></div><div class="fmb-app-tabs" role="tablist" aria-label="News categories">${['All','Philippines','World','Economy','Culture'].map((x,i)=>`<button class="fmb-app-tab" type="button" role="tab" aria-selected="${i===0}" data-tab="${x}">${x==='All'?'Top Stories':x}</button>`).join('')}</div></header><main class="fmb-app-main"><section class="fmb-app-wire" id="fmb-app-wire"><span class="fmb-app-wire-dot"></span><span class="fmb-app-wire-label">Newsroom Wire</span><span class="fmb-app-wire-text">${esc(wireHeadline)}</span></section><div data-lead-slot>${leadCard(lead)}</div><section aria-labelledby="fmb-app-latest-title"><div class="fmb-app-section-head"><h2 id="fmb-app-latest-title">Latest stories</h2><a href="/news/archive/">View all</a></div><div class="fmb-app-list" data-story-list>${rest.map(storyRow).join('')}</div></section><a class="fmb-app-brief" href="/news/fmb-brief/live/"><small>Today’s Brief</small><h2>FMB Brief</h2><p>What happened. Why it matters. What to watch.</p><span>Read now</span></a></main>`;
    const dock=document.createElement('nav');dock.className='fmb-app-dock';dock.setAttribute('aria-label','FMB News app navigation');dock.innerHTML=`<a href="/news/archive/" aria-current="page">${icon.home}<span>Home</span></a><a href="/news/fmb-brief/live/">${icon.brief}<span>Brief</span></a><button type="button" data-open-saved>${icon.saved}<span>Saved</span></button><button type="button" data-wire>${icon.wire}<span>Wire</span></button><button type="button" data-open-menu>${icon.menu}<span>Menu</span></button>`;
    const searchSheet=document.createElement('div');searchSheet.innerHTML=createSheet('fmb-app-search-sheet','Search',`<input class="fmb-app-search" type="search" inputmode="search" placeholder="Search stories" aria-label="Search stories"><div class="fmb-app-search-results" data-search-results></div>`);
    const savedSheet=document.createElement('div');savedSheet.innerHTML=createSheet('fmb-app-saved-sheet','Saved',`<div class="fmb-app-search-results" data-saved-results></div>`);
    const menuSheet=document.createElement('div');menuSheet.innerHTML=createSheet('fmb-app-menu-sheet','FMB News',`<nav class="fmb-app-menu-links"><a href="/news/archive/">Latest stories</a><a href="/news/fmb-brief/">FMB Brief</a><a href="/news/world/">FMB Worldwide</a><a href="/news/about/">About FMB News</a><a href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Share a story</a></nav>`);
    const toast=document.createElement('div');toast.className='fmb-app-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
    document.body.prepend(app);document.body.append(dock,searchSheet.firstElementChild,savedSheet.firstElementChild,menuSheet.firstElementChild,toast);document.body.classList.add('fmb-mobile-app-active');
    const storyByPath=new Map(stories.map(s=>[slugFromHref(s.href),s]));
    let currentTab='All',toastTimer;
    const showToast=msg=>{toast.textContent=msg;toast.setAttribute('data-show','');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.removeAttribute('data-show'),1600)};
    const syncSaveButtons=()=>document.querySelectorAll('[data-save]').forEach(btn=>{const on=isSaved(btn.getAttribute('data-save'));btn.setAttribute('aria-pressed',String(on));btn.setAttribute('aria-label',on?'Remove from saved':'Save story')});
    const renderList=()=>{const filtered=stories.filter(s=>s!==lead&&tabMatch(s,currentTab)).slice(0,12);app.querySelector('[data-story-list]').innerHTML=filtered.length?filtered.map(storyRow).join(''):'<div class="fmb-app-empty">No stories in this section yet.</div>';syncSaveButtons()};
    app.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{currentTab=btn.dataset.tab;app.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-selected',String(x===btn)));renderList()}));
    const openSheet=id=>{const sheet=document.getElementById(id);if(!sheet)return;sheet.setAttribute('data-open','');sheet.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';setTimeout(()=>sheet.querySelector('input,button,a')?.focus(),30)};
    const closeSheet=sheet=>{sheet.removeAttribute('data-open');sheet.setAttribute('aria-hidden','true');document.body.style.overflow=''};
    document.addEventListener('click',e=>{
      const save=e.target.closest('[data-save]');if(save){e.preventDefault();e.stopPropagation();const s=storyByPath.get(save.getAttribute('data-save'));if(!s)return;const on=toggleSaved(s);syncSaveButtons();showToast(on?'Saved for later':'Removed from saved');return}
      if(e.target.closest('[data-open-search]')){const box=document.querySelector('[data-search-results]');box.innerHTML=stories.slice(0,10).map(s=>`<a class="fmb-app-search-result" href="${esc(slugFromHref(s.href))}"><small>${esc(s.category)}</small><strong>${esc(s.title)}</strong></a>`).join('');openSheet('fmb-app-search-sheet');return}
      if(e.target.closest('[data-open-saved]')){const saved=readSaved();const box=document.querySelector('[data-saved-results]');box.innerHTML=saved.length?saved.map(s=>`<a class="fmb-app-search-result" href="${esc(s.href)}"><small>${esc(s.category||'FMB News')}</small><strong>${esc(s.title)}</strong></a>`).join(''):'<div class="fmb-app-empty">Saved stories will appear here.</div>';openSheet('fmb-app-saved-sheet');return}
      if(e.target.closest('[data-open-menu]')){openSheet('fmb-app-menu-sheet');return}
      if(e.target.closest('[data-wire]')){document.getElementById('fmb-app-wire')?.scrollIntoView({behavior:'smooth',block:'center'});return}
      const close=e.target.closest('[data-close-sheet]');if(close){closeSheet(close.closest('.fmb-app-sheet'));return}
      if(e.target.classList.contains('fmb-app-sheet'))closeSheet(e.target)
    });
    const input=document.querySelector('.fmb-app-search');input?.addEventListener('input',()=>{const q=input.value.toLowerCase().trim();const matches=stories.filter(s=>!q||`${s.title} ${s.category} ${s.deck}`.toLowerCase().includes(q)).slice(0,14);document.querySelector('[data-search-results]').innerHTML=matches.length?matches.map(s=>`<a class="fmb-app-search-result" href="${esc(slugFromHref(s.href))}"><small>${esc(s.category)}</small><strong>${esc(s.title)}</strong></a>`).join(''):'<div class="fmb-app-empty">No matching stories.</div>'});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){const sheet=document.querySelector('.fmb-app-sheet[data-open]');if(sheet)closeSheet(sheet)}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
