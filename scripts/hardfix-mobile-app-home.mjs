import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const page=path.join(root,'dist','news','index.html');
const contentRoot=path.join(root,'content','news','articles');
const fallback='/assets/images/news/fmb-news-editorial-fallback.svg';
const approvedHero='/assets/images/mobile/fmb-mobile-hero.jpg';
const approvedMug='/assets/images/mobile/fmb-daily-brief-mug.jpg';

const esc=(v='')=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const fmtTime=iso=>{try{return new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(iso))+' PHT'}catch{return''}};
const readTime=s=>Math.max(1,Math.ceil((s.sections||[]).flatMap(x=>x.paragraphs||[]).join(' ').split(/\s+/).filter(Boolean).length/220));
async function walk(dir){const out=[];let entries=[];try{entries=await readdir(dir,{withFileTypes:true})}catch{return out}for(const e of entries){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else if(e.isFile()&&e.name.endsWith('.json'))out.push(p)}return out}
async function stories(){const out=[];for(const f of await walk(contentRoot)){try{const s=JSON.parse(await readFile(f,'utf8'));if(s.status==='published'&&s.slug&&s.headline&&s.publishedAt)out.push(s)}catch{}}return out.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt))}
function imageFor(s){const u=String(s?.image?.url||'').trim();return /^https?:\/\//i.test(u)||u.startsWith('/')?u:fallback}
function meta(s){return `<div class="fmb-app-story-meta"><span>${esc(s.category||s.kicker||'News')}</span><span>·</span><time datetime="${esc(s.publishedAt)}">${esc(fmtTime(s.publishedAt))}</time><span>·</span><span>${readTime(s)} min</span></div>`}
function storyRow(s){return `<a class="fmb-app-story-row" href="/news/${esc(s.slug)}/"><div class="fmb-app-story-copy">${meta(s)}<h3>${esc(s.headline)}</h3></div><img src="${esc(imageFor(s))}" alt="${esc(s.image?.alt||s.headline)}" loading="lazy"></a>`}
function breakingStory(ss){return ss.find(s=>s?.audit?.push_alert===true||s?.push_alert===true||s?.breaking===true)}

const ss=await stories();
if(!ss.length)throw new Error('Cannot build FMB mobile app home without published stories.');
const lead=ss[0],latest=ss.slice(1,6),breaking=breakingStory(ss),tickerStories=[lead,...latest].slice(0,4);
const tickerLabel=breaking?'BREAKING NEWS':'LATEST';
const tickerHref=breaking?`/news/${esc(breaking.slug)}/`:'#fmb-app-latest-title';
const tickerGroup=tickerStories.map(s=>`<i>${esc(s.headline)}</i>`).join('');
const mobileHome=`<div class="fmb-mobile-app-home" data-fmb-mobile-home>
  <section class="fmb-app-brand-hero" aria-label="FMB News live home">
    <img src="${approvedHero}" alt="FMB News Philippines newsroom hero with the Philippine flag, global map, broadcast camera and official gold shell emblem" fetchpriority="high" data-fmb-approved-hero>
    <span class="fmb-hero-readable-shade" aria-hidden="true"></span>
    <div class="fmb-approved-hero-copy">
      <span class="fmb-approved-hero-label">LATEST UPDATE</span>
      <p data-fmb-greeting>Hello, night owl.</p>
      <h1 data-fmb-greeting-line>The world is still moving. Here’s what changed.</h1>
      <p class="fmb-approved-hero-deck">Stay informed with verified facts, meaningful context, and perspectives that help you understand what matters.</p>
      <div class="fmb-approved-hero-cta">
        <a href="#fmb-app-latest-title">Read the Latest</a>
        <button type="button" data-fmb-customize>Customize</button>
      </div>
    </div>
    <a class="fmb-approved-hero-ticker" href="${tickerHref}" aria-label="${tickerLabel}">
      <strong>${tickerLabel}</strong>
      <span class="fmb-approved-hero-ticker-window"><span class="fmb-approved-hero-ticker-track"><span class="fmb-approved-hero-ticker-group">${tickerGroup}</span><span class="fmb-approved-hero-ticker-group" aria-hidden="true">${tickerGroup}</span></span></span>
    </a>
    <div class="fmb-hero-live-overlay" aria-label="Live local date, time and weather">
      <div class="fmb-hero-clock">
        <strong data-fmb-local-date>Today</strong>
        <span data-fmb-local-time>--:--</span>
      </div>
      <button class="fmb-hero-weather" type="button" data-fmb-weather-button aria-label="Set local weather">
        <span class="fmb-hero-weather-icon" data-fmb-weather-icon aria-hidden="true">☀</span>
        <span class="fmb-hero-weather-copy"><strong data-fmb-weather>Weather</strong><small data-fmb-weather-note>Tap for local weather</small></span>
      </button>
    </div>
  </section>
  <section class="fmb-app-lead" aria-label="Lead story">
    <a href="/news/${esc(lead.slug)}/" class="fmb-app-lead-media"><img src="${esc(imageFor(lead))}" alt="${esc(lead.image?.alt||lead.headline)}" fetchpriority="high" data-fmb-lead-story-image><span class="fmb-app-lead-shade" aria-hidden="true"></span><div class="fmb-app-lead-copy">${meta(lead)}<h2>${esc(lead.headline)}</h2><p>${esc(lead.deck||lead.seoDescription||'')}</p><span class="fmb-app-read">Read story <b aria-hidden="true">›</b></span></div></a>
  </section>
  <section class="fmb-app-section" aria-labelledby="fmb-app-latest-title">
    <div class="fmb-app-section-head"><h2 id="fmb-app-latest-title">Latest News</h2><a href="/news/archive/">View all</a></div>
    <div class="fmb-app-story-list">${latest.map(storyRow).join('')}</div>
  </section>
  <section class="fmb-app-brief-card">
    <img src="${approvedMug}" alt="Purple FMB Daily Brief coffee mug with gold FMB emblem" loading="lazy" data-fmb-approved-mug>
    <div class="fmb-app-brief-copy"><span>FMB Daily Brief</span><h2>Know what matters today.</h2><p>A concise daily briefing with the developments, context and implications worth knowing.</p><a href="/news/fmb-brief/live/">Read today’s brief <b aria-hidden="true">›</b></a></div>
  </section>
  <section class="fmb-app-section fmb-app-week" aria-labelledby="fmb-app-week-title">
    <div class="fmb-app-section-head"><h2 id="fmb-app-week-title">This Week</h2></div>
    <div class="fmb-app-week-grid">
      <a class="fmb-app-week-card horoscope" href="/news/horoscope/"><span class="fmb-app-week-art" aria-hidden="true">☾</span><span class="fmb-app-week-kicker">Lifestyle · Entertainment</span><h3>Weekly Horoscope</h3><p>All 12 zodiac signs, with free will kept front and center.</p><b>Read this week ›</b></a>
      <a class="fmb-app-week-card crossword" href="/news/crossword/"><span class="fmb-mini-grid" aria-hidden="true"><i></i><i></i><i class="on"></i><i></i><i class="on"></i><i class="on"></i><i></i><i class="on"></i><i></i></span><span class="fmb-app-week-kicker">Weekly Current Events</span><h3>FMB Crossword</h3><p>35+ clues drawn from the week’s verified news cycle.</p><b>Play now ›</b></a>
    </div>
  </section>
</div>`;

let html=await readFile(page,'utf8');
html=html.replace(/<div class="fmb-mobile-app-home"[\s\S]*?<\/div>\s*(?=<main class="network-home")/i,'');
if(!html.includes('data-fmb-mobile-home'))html=html.replace('<main class="network-home">',`${mobileHome}<main class="network-home">`);
await writeFile(page,html,'utf8');
console.log(`Injected the approved FMB Philippines hero as an HTML-overlay mobile home with Read the Latest / Customize CTAs, a continuous headline crawl, and ${Math.min(ss.length,6)} live published stories.`);
