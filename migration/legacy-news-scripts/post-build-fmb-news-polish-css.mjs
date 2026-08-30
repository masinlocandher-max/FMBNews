import { cp, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const polishSource = path.join(root,'apps','withlovefmb','assets','css','fmb-news-reference-polish.css');
const polishOut = path.join(root,'dist','assets','css','fmb-news-reference-polish.css');
const hardfixSource = path.join(root,'apps','withlovefmb','assets','css','fmb-news-reference-hardfix.css');
const hardfixOut = path.join(root,'dist','assets','css','fmb-news-reference-hardfix.css');
const finalSource = path.join(root,'apps','withlovefmb','assets','css','fmb-news-reference-final.css');
const finalOut = path.join(root,'dist','assets','css','fmb-news-reference-final.css');
const newsRoot = path.join(root,'dist','news');
const articleRoot = path.join(root,'apps','withlovefmb','content','news','articles');
const heroPhoto = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rizal_Park,_PH_flag_-_Rizal_day_ceremony_(Manila)(2017-12-30).jpg';
const heroSource = 'https://commons.wikimedia.org/wiki/File:Rizal_Park,_PH_flag_-_Rizal_day_ceremony_(Manila)(2017-12-30).jpg';

await cp(polishSource,polishOut,{force:true});
await cp(hardfixSource,hardfixOut,{force:true});
await cp(finalSource,finalOut,{force:true});

const esc=(value='')=>String(value)
  .replaceAll('&','&amp;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;')
  .replaceAll('"','&quot;')
  .replaceAll("'",'&#39;');

async function walkIndexHtml(dir){
  const files=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) files.push(...await walkIndexHtml(p));
    else if(entry.isFile()&&entry.name==='index.html') files.push(p);
  }
  return files;
}

async function walkJson(dir){
  const files=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) files.push(...await walkJson(p));
    else if(entry.isFile()&&entry.name.endsWith('.json')) files.push(p);
  }
  return files;
}

async function latestHeadlines(){
  const items=[];
  for(const file of await walkJson(articleRoot)){
    try{
      const story=JSON.parse(await readFile(file,'utf8'));
      if(story.status==='published'&&story.slug&&story.headline&&story.publishedAt){
        items.push(story);
      }
    }catch{}
  }
  return items
    .sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt))
    .slice(0,7);
}

function tickerMarkup(stories){
  const run=stories.map((story,index)=>{
    const separator=index<stories.length-1?'<span class="ticker-dot" aria-hidden="true">◆</span>':'';
    return `<a href="/news/${esc(story.slug)}/"><span class="ticker-headline">${esc(story.headline)}</span></a>${separator}`;
  }).join('');
  return `<div class="headline-ticker" role="region" aria-label="Latest FMB News headlines"><div class="ticker-clock" aria-label="Current Philippine time"><span data-pht-ticker-clock>--:--</span><small>PHT</small></div><div class="ticker-label"><span class="ticker-pulse" aria-hidden="true"></span>LATEST</div><div class="ticker-window"><div class="ticker-track"><div class="ticker-run">${run}</div><div class="ticker-run" aria-hidden="true">${run}</div></div></div></div>`;
}

function wordmarkMarkup(footer=false){
  const variant=footer?' brand-wordmark-footer':'';
  const subtitleVariant=footer?' brand-subtitle-footer':'';
  return `<a class="brand-wordmark${variant}" href="/news/" aria-label="FMB News home"><span class="brand-fmb">FMB</span><span class="brand-news">News</span></a><div class="brand-subtitle${subtitleVariant}">FILIPINO MEDIA BULLETIN</div>`;
}

const searchIcon=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg>`;
const footerSocials=`<div class="footer-socials" aria-label="FMB News social links"><a href="https://www.facebook.com/BinibiningFrancineMarie" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill-icon" d="M13.5 21v-8h2.8l.4-3h-3.2V8.1c0-.9.3-1.6 1.7-1.6H17V3.8c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5V10H7v3h3v8h3.5Z"></path></svg></a><a href="https://www.instagram.com/bb.fmb/" target="_blank" rel="noopener noreferrer" aria-label="Instagram @bb.fmb"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"></rect><circle cx="12" cy="12" r="3.5"></circle><circle class="fill-icon" cx="17.2" cy="6.8" r="1"></circle></svg></a><a href="mailto:withlovefmb@gmail.com" aria-label="Email FMB News"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path></svg></a></div>`;
const tickerClockScript=`<script data-pht-ticker-script>(()=>{const nodes=[...document.querySelectorAll('[data-pht-ticker-clock]')];if(!nodes.length)return;const tick=()=>{const value=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date());nodes.forEach(node=>{node.textContent=value})};tick();setInterval(tick,30000)})();</script>`;

const headlines=await latestHeadlines();
const ticker=tickerMarkup(headlines);
const homeFile=path.join(newsRoot,'index.html');

for(const file of await walkIndexHtml(newsRoot)){
  let html=await readFile(file,'utf8');

  if(!html.includes('/assets/css/fmb-news-reference-polish.css')){
    html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/fmb-news-reference-polish.css?v=20260830b"></head>');
  }
  if(!html.includes('/assets/css/fmb-news-reference-hardfix.css')){
    html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/fmb-news-reference-hardfix.css?v=20260830a"></head>');
  }
  if(!html.includes('/assets/css/fmb-news-reference-final.css')){
    html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/fmb-news-reference-final.css?v=20260830d"></head>');
  }

  html=html
    .replace(/<a href="\/news\/" aria-label="FMB News home"><img[^>]*><\/a><div class="tagline">[\s\S]*?<\/div>/g,wordmarkMarkup(false))
    .replace(/<a[^>]*aria-label="FMB News home"[^>]*><img[^>]*><\/a><div class="tagline">[\s\S]*?<\/div>/g,wordmarkMarkup(false))
    .replace(/<img class="footer-logo"[^>]*>/g,wordmarkMarkup(true))
    .replace(/<a class="search" href="\/news\/archive\/" aria-label="Search FMB News">[\s\S]*?<\/a>/g,`<a class="search" href="/news/archive/" aria-label="Search FMB News">${searchIcon}<span>Search</span></a>`);

  if(!html.includes('class="headline-ticker"')){
    html=html.replace('<div class="utility">',`${ticker}<div class="utility">`);
  }

  if(!html.includes('data-pht-ticker-script')){
    html=html.replace('</body>',`${tickerClockScript}</body>`);
  }

  if(!html.includes('class="footer-socials"')){
    html=html.replace('<a href="/news/about/"><strong>About FMB News →</strong></a>',`<a href="/news/about/"><strong>About FMB News →</strong></a>${footerSocials}`);
  }

  if(path.resolve(file)===path.resolve(homeFile)){
    const hero=`<div class="hero-image"><img src="${heroPhoto}" alt="Philippine flag at Rizal Park in Manila" fetchpriority="high"><a class="hero-credit" href="${heroSource}" target="_blank" rel="noopener noreferrer">Photo: Patrick Roque / Wikimedia Commons · CC BY-SA 4.0</a></div>`;
    html=html.replace(/<div class="hero-image">[\s\S]*?<\/div>/,hero);
  }

  await writeFile(file,html);
}

console.log(`FMB News hard correction applied: typographic FMB/News identity, live PHT clock beside ${headlines.length} moving headlines, verified social icons, metallic-purple broadcast styling hook, and Rizal Park hero.`);
