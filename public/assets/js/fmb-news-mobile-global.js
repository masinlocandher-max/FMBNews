(()=>{
  if(!matchMedia('(max-width:699px)').matches)return;
  document.documentElement.setAttribute('data-fmb-global-mobile','true');
  const $=(q,s=document)=>s.querySelector(q),$$=(q,s=document)=>[...s.querySelectorAll(q)];
  const WEATHER_KEY='fmbWeatherV1',SAVED_KEY='fmbSavedStoriesV1';
  const weatherLabels={0:['Clear','☀'],1:['Mostly clear','☀'],2:['Partly cloudy','◐'],3:['Cloudy','☁'],45:['Fog','≋'],48:['Fog','≋'],51:['Drizzle','☂'],53:['Drizzle','☂'],55:['Drizzle','☂'],61:['Rain','☂'],63:['Rain','☂'],65:['Heavy rain','☂'],71:['Snow','❄'],73:['Snow','❄'],75:['Snow','❄'],80:['Showers','☂'],81:['Showers','☂'],82:['Heavy showers','☂'],95:['Thunderstorm','ϟ'],96:['Thunderstorm','ϟ'],99:['Thunderstorm','ϟ']};
  const jget=(k,d=null)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}},jset=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

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
      brief:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2"></rect><path d="M8 8h8M8 12h8M8 16h5"></path></svg>',
      home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 11 8-7 8 7v9h-6v-6h-4v6H4z"></path></svg>',
      saved:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4z"></path></svg>',
      more:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle></svg>'
    };return icons[key]||'';
  }
  function productRail(active){
    const items=[['news','/news/','FMB News'],['world','/news/world/','FMB Worldwide'],['explainer','/news/explainer/','FMB Explainer'],['fact','/news/fact-check/','FMB Fact Check'],['brief','/news/fmb-brief/','FMB Daily Brief']];
    return `<nav class="fmb-mobile-product-rail" aria-label="FMB products">${items.map(([key,href,label])=>`<a href="${href}" data-product="${key}"${key===active?' aria-current="page"':''}>${svg(key)}<span>${label}</span></a>`).join('')}</nav>`;
  }
  function openSheet(title,body){
    $('.fmb-app-action-sheet')?.remove();
    const sheet=document.createElement('div');sheet.className='fmb-app-action-sheet';sheet.innerHTML=`<section class="fmb-app-action-panel" role="dialog" aria-modal="true"><h2>${title}</h2><div class="fmb-app-action-list">${body}</div><button type="button" data-close-sheet>Close</button></section>`;document.body.append(sheet);
    $('[data-close-sheet]',sheet).onclick=()=>sheet.remove();sheet.addEventListener('click',e=>{if(e.target===sheet)sheet.remove()});
    return sheet;
  }
  function openMore(){openSheet('More from FMB News','<a href="/news/world/">Worldwide <span>›</span></a><a href="/news/explainer/">Explainer <span>›</span></a><a href="/news/fact-check/">Fact Check <span>›</span></a><a href="/news/horoscope/">Horoscope <span>›</span></a><a href="/news/crossword/">Crossword Puzzle <span>›</span></a><a href="/news/about/">About FMB News <span>›</span></a><a href="/news/submit/">Submit a story <span>›</span></a>')}
  function openSaved(){
    const saved=jget(SAVED_KEY,[]);
    if(!saved.length){openSheet('Saved','<div style="padding:16px 4px;color:#756d78;font-size:14px;line-height:1.5">Stories you save while reading will appear here.</div>');return}
    openSheet('Saved',saved.slice(0,30).map(item=>`<a href="${item.path}"><span>${String(item.title||'Saved story').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}</span><span>›</span></a>`).join(''));
  }
  function ensureBottomNav(){
    if($('.fmb-approved-bottom-nav'))return;
    const p=location.pathname.replace(/\/+$/,'')||'/news',nav=document.createElement('nav');nav.className='fmb-approved-bottom-nav';nav.setAttribute('aria-label','FMB app navigation');
    nav.innerHTML=`<a href="/news/"${p==='/news'?' aria-current="page"':''}>${svg('home')}<span>Home</span></a><a href="/news/search/">${svg('search')}<span>Search</span></a><button type="button" data-fmb-bottom-saved>${svg('saved')}<span>Saved</span></button><a href="/news/fmb-brief/live/"${p.startsWith('/news/fmb-brief')?' aria-current="page"':''}>${svg('brief')}<span>Brief</span></a><button type="button" data-fmb-bottom-more>${svg('more')}<span>More</span></button>`;
    document.body.append(nav);$('[data-fmb-bottom-saved]',nav).onclick=openSaved;$('[data-fmb-bottom-more]',nav).onclick=openMore;
  }

  function ensureShell(){
    if($('.fmb-mobile-app-shell'))return $('.fmb-mobile-app-shell');
    const product=productForPath(),isHome=location.pathname.replace(/\/+$/,'')==='/news',shell=document.createElement('div');
    shell.className=`fmb-mobile-app-shell${isHome?' is-home':''}`;
    const brand=`<a class="fmb-mobile-shell-brand" href="/news/" aria-label="FMB News — Filipino Media Bulletin"><img src="/news/assets/images/brand/fmb-bulletin-emblem.svg" alt=""><span class="fmb-mobile-shell-copy"><strong>FMB News</strong><small>Filipino Media Bulletin</small></span></a>`;
    if(isHome){
      shell.innerHTML=`<div class="fmb-mobile-shell-head"><button class="fmb-mobile-shell-menu" type="button" data-fmb-shell-menu aria-label="Open FMB News menu">${svg('menu')}</button>${brand}<div class="fmb-mobile-shell-actions"><a href="/news/search/" aria-label="Search FMB News">${svg('search')}</a><button type="button" data-fmb-shell-account aria-label="Your FMB">${svg('account')}</button></div></div>${productRail(product.key)}`;
    }else{
      shell.innerHTML=`<div class="fmb-mobile-shell-head">${brand}<div class="fmb-mobile-shell-actions"><a href="/news/search/" aria-label="Search FMB News">${svg('search')}</a><button type="button" data-fmb-shell-account aria-label="Your FMB">${svg('account')}</button></div></div><nav class="fmb-mobile-product-rail" aria-label="FMB products"><a href="/news/" data-product="news">FMB News</a><a href="/news/world/" data-product="world">FMB Worldwide</a><a href="/news/explainer/" data-product="explainer">FMB Explainer</a><a href="/news/fact-check/" data-product="fact">FMB Fact Check</a><a href="/news/fmb-brief/" data-product="brief">FMB Daily Brief</a></nav><section class="fmb-global-mobile-utility" data-fmb-global-utility aria-label="FMB mobile utilities"><div class="fmb-app-clock"><strong data-fmb-local-date>Today</strong><span data-fmb-local-time>--:--</span></div><button class="fmb-app-weather" type="button" data-fmb-weather-button aria-label="Set local weather"><span data-fmb-weather-icon aria-hidden="true">○</span><span data-fmb-weather>Set local weather</span></button><nav class="fmb-global-week-actions" aria-label="FMB weekly features"><a href="/news/horoscope/">Horoscope</a><a href="/news/crossword/">Crossword</a></nav></section>`;
      $(`[data-product="${product.key}"]`,shell)?.setAttribute('aria-current','page');
    }
    document.body.prepend(shell);
    $('[data-fmb-shell-account]',shell)?.addEventListener('click',()=>{const target=document.querySelector('[data-fmb-account],.fmb-account-button,[data-account]');if(target)target.click()});
    $('[data-fmb-shell-menu]',shell)?.addEventListener('click',openMore);
    return shell;
  }

  function tick(){const n=new Date(),date=new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric'}).format(n),time=new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(n);$$('[data-fmb-local-date]').forEach(el=>el.textContent=date);$$('[data-fmb-local-time]').forEach(el=>el.textContent=time);$$('[data-fmb-greeting]').forEach(el=>{const h=n.getHours();el.textContent=h<12?'Good morning':h<18?'Good afternoon':'Good evening'})}
  function renderWeather(data){if(!data)return;const label=weatherLabels[Number(data.code)]||['Weather','○'],stale=Date.now()-Number(data.savedAt||0)>30*60*1000;$$('[data-fmb-weather-icon]').forEach(el=>el.textContent=label[1]);$$('[data-fmb-weather]').forEach(el=>el.textContent=`${Math.round(data.temp)}° · ${data.city||label[0]}${stale?' · cached':''}`)}
  async function fetchWeather(lat,lon,city){const u=new URL('https://api.open-meteo.com/v1/forecast');u.searchParams.set('latitude',lat);u.searchParams.set('longitude',lon);u.searchParams.set('current','temperature_2m,weather_code');u.searchParams.set('timezone','auto');const r=await fetch(u);if(!r.ok)throw new Error('Weather is unavailable right now.');const d=await r.json(),data={temp:d.current?.temperature_2m,code:d.current?.weather_code,city:city||'Local weather',savedAt:Date.now()};jset(WEATHER_KEY,data);renderWeather(data)}
  async function geocode(city){const u=new URL('https://geocoding-api.open-meteo.com/v1/search');u.searchParams.set('name',city);u.searchParams.set('count','1');u.searchParams.set('language','en');u.searchParams.set('format','json');const r=await fetch(u);if(!r.ok)throw new Error('Could not find that city.');const d=await r.json(),hit=d.results?.[0];if(!hit)throw new Error('Could not find that city.');return hit}
  function weatherSheet(){
    $('.fmb-weather-sheet')?.remove();const el=document.createElement('div');el.className='fmb-weather-sheet';el.innerHTML='<section class="fmb-weather-panel" role="dialog" aria-modal="true" aria-labelledby="fmb-weather-title"><h2 id="fmb-weather-title">Local weather</h2><p>Location is requested only after you choose it. You can also enter a city manually.</p><div class="fmb-weather-actions"><button type="button" data-use-location>Use Current Location</button><button type="button" class="secondary" data-close-weather>Not now</button></div><form class="fmb-weather-manual"><input type="text" autocomplete="address-level2" placeholder="City, e.g. Masinloc" aria-label="City"><button type="submit">Set</button></form><div class="fmb-weather-status" role="status" aria-live="polite"></div></section>';document.body.append(el);
    const status=$('.fmb-weather-status',el);$('[data-close-weather]',el).onclick=()=>el.remove();el.addEventListener('click',e=>{if(e.target===el)el.remove()});$('[data-use-location]',el).onclick=()=>{if(!navigator.geolocation){status.textContent='Location is not supported on this device.';return}status.textContent='Getting your location…';navigator.geolocation.getCurrentPosition(async p=>{try{await fetchWeather(p.coords.latitude,p.coords.longitude,'Near you');el.remove()}catch(err){status.textContent=err.message}},()=>status.textContent='Location was not shared. Enter a city instead.',{enableHighAccuracy:false,timeout:10000,maximumAge:1800000})};$('.fmb-weather-manual',el).onsubmit=async e=>{e.preventDefault();const city=$('input',e.currentTarget).value.trim();if(!city)return;status.textContent='Finding weather…';try{const hit=await geocode(city);await fetchWeather(hit.latitude,hit.longitude,hit.name);el.remove()}catch(err){status.textContent=err.message}};
  }
  function addReaderActions(){const article=$('.article,.cms-article,article.article');if(!article||$('.fmb-mobile-reader-actions'))return;const title=$('h1',article)?.textContent?.trim()||document.title.replace(/\s*\|.*$/,''),toolbar=document.createElement('div');toolbar.className='fmb-mobile-reader-actions';toolbar.innerHTML='<button type="button" data-fmb-reader-back aria-label="Go back">← Back</button><span></span><button type="button" data-fmb-reader-save>Save</button><button type="button" data-fmb-reader-share>Share</button>';article.prepend(toolbar);$('[data-fmb-reader-back]',toolbar).onclick=()=>history.length>1?history.back():location.assign('/news/');const save=$('[data-fmb-reader-save]',toolbar),saved=jget(SAVED_KEY,[]),current=()=>saved.some(x=>x.path===location.pathname),sync=()=>{save.textContent=current()?'Saved':'Save';save.setAttribute('aria-pressed',String(current()))};sync();save.onclick=()=>{const i=saved.findIndex(x=>x.path===location.pathname);if(i>=0)saved.splice(i,1);else saved.unshift({path:location.pathname,title,savedAt:Date.now()});jset(SAVED_KEY,saved.slice(0,100));sync()};$('[data-fmb-reader-share]',toolbar).onclick=async()=>{try{if(navigator.share)await navigator.share({title,url:location.href});else{await navigator.clipboard.writeText(location.href);const b=$('[data-fmb-reader-share]',toolbar);b.textContent='Copied';setTimeout(()=>b.textContent='Share',1200)}}catch{}}}

  ensureShell();ensureBottomNav();tick();setInterval(tick,30000);renderWeather(jget(WEATHER_KEY,null));$$('[data-fmb-weather-button]').forEach(btn=>{if(!btn.dataset.fmbWeatherBound){btn.dataset.fmbWeatherBound='1';btn.addEventListener('click',weatherSheet)}});$('[data-fmb-customize]')?.addEventListener('click',()=>document.querySelector('[data-fmb-account],.fmb-account-button,[data-account]')?.click());addReaderActions();
})();