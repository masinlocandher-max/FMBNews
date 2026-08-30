import { esc, colorLogo, whiteLogo, logo } from './fmbnews-clean-lib.mjs';

const css = '/assets/css/fmbnews-clean-v1.css?v=20260808-newsdesk-v6';
const outlineLogo = '/assets/images/news/fmb-news-outline-logo-2026.webp';
const arrowIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg>';
const searchIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.75" cy="10.75" r="6.75"/><path d="m16 16 4.25 4.25"/></svg>';
const newsCategories = [
  ['all', 'All news'],
  ['national', 'Nation'],
  ['world', 'World'],
  ['business', 'Business'],
  ['technology', 'Technology'],
  ['culture', 'Life and culture'],
  ['environment', 'Environment'],
  ['health', 'Health'],
];

const defaultTickerItems = [
  { title: 'Important news, made clear for Filipinos', route: '/fmbnews/#reports' },
  { title: 'Evidence first, with sources kept visible', route: '/fmbnews/about/#standards' },
  { title: 'Context, Filipino relevance, and what comes next', route: '/fmbnews/about/#method' },
];

function ticker(items = defaultTickerItems) {
  const headlines = items.length ? items.slice(0, 6) : defaultTickerItems;
  const repeated = [...headlines, ...headlines];
  const links = repeated.map((item, index) => {
    const duplicate = index >= headlines.length ? ' aria-hidden="true" tabindex="-1"' : '';
    return `<a href="${esc(item.route)}"${duplicate}>${esc(item.title)}</a>`;
  }).join('');

  return `<div class="fnc-livebar" aria-label="Moving headlines and Philippine time"><div class="fnc-live-label"><i aria-hidden="true"></i>Moving headlines</div><div class="fnc-ticker"><div class="fnc-ticker-track">${links}</div></div><div class="fnc-pht"><span>Philippine time</span><time data-pht-time data-fmb-hq-clock data-news-updated datetime="2026-08-07T00:00:00+08:00">--:--:--</time></div></div>`;
}

export function shell(active = '', headlines = defaultTickerItems) {
  const searchHref = active === 'latest' ? '#newsSearch' : '/fmbnews/#newsSearch';
  const primaryLinks = [
    ['Latest reports', '/fmbnews/', 'latest'],
    ['About FMB News', '/fmbnews/about/', 'about'],
    ['Editorial standards', '/fmbnews/about/#standards', 'standards'],
    ['Corrections', 'mailto:withlovefmb@gmail.com?subject=FMB%20News%20Correction', 'corrections'],
    ['Contact', 'mailto:withlovefmb@gmail.com?subject=FMB%20Newsroom%20Inquiry', 'contact'],
  ];
  const links = primaryLinks.map(([label, href, key]) => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const categories = newsCategories.map(([value, label]) => `<a href="/fmbnews/?section=${value}#reports" data-fnc-drawer-category="${value}">${label}</a>`).join('');
  return `<a class="fnc-skip" href="#main">Skip to the newsroom</a>${ticker(headlines)}<header class="fnc-header"><div class="fnc-shell fnc-header-row"><a class="fnc-brand" href="/fmbnews/" aria-label="FMB News home"><img src="${colorLogo}" width="1225" height="265" alt="FMB News, Filipino Media Bulletin"></a><nav class="fnc-nav" id="fncNav" aria-label="FMB News menu"><div class="fnc-nav-head"><div class="fnc-nav-identity"><img src="${whiteLogo}" width="1133" height="243" alt=""><span>FMB News · Philippine edition</span><strong>News menu</strong></div><button class="fnc-nav-close" type="button" data-fnc-menu-close aria-label="Close FMB News menu"><i aria-hidden="true"></i></button></div><div class="fnc-nav-links">${links}</div><section class="fnc-nav-categories" aria-labelledby="fncDrawerCategories"><p id="fncDrawerCategories">News categories</p><div>${categories}</div></section><div class="fnc-nav-meta"><span>Philippine time <strong><time data-pht-time>--:--:--</time></strong></span><span>Editorial standard <strong>Evidence first</strong></span></div></nav><div class="fnc-actions"><a class="fnc-search-jump" href="${searchHref}" aria-label="Search FMB News">${searchIcon}</a><a class="fnc-submit" href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Submit story</a><button class="fnc-menu" type="button" aria-label="Open FMB News menu" aria-expanded="false" aria-controls="fncNav"><span aria-hidden="true"></span></button></div></div></header><div class="fnc-nav-backdrop" data-fnc-menu-close aria-hidden="true"></div>`;
}

export function foot() {
  return `<footer class="fnc-footer"><div class="fnc-footer-orbit" aria-hidden="true"><i></i><i></i><i></i></div><div class="fnc-shell fnc-footer-grid"><div class="fnc-footer-brand"><span class="fnc-footer-logo-frame"><img src="${whiteLogo}" width="1133" height="243" alt="FMB News, Filipino Media Bulletin"></span><p>The news that matters.<br>Made clear for Filipinos.</p><span class="fnc-footer-proof">Philippine edition · Evidence first</span></div><nav class="fnc-footer-group" aria-label="Newsroom links"><span>Newsroom</span><a href="/fmbnews/">Latest reports</a><a href="/fmbnews/?section=national#reports">Nation</a><a href="/fmbnews/?section=world#reports">World</a><a href="/fmbnews/?section=business#reports">Business</a></nav><nav class="fnc-footer-group" aria-label="FMB News information"><span>FMB News</span><a href="/fmbnews/about/">About</a><a href="/fmbnews/about/#method">Our method</a><a href="/fmbnews/about/#standards">Editorial standards</a></nav><nav class="fnc-footer-group" aria-label="FMB News contact links"><span>Contact</span><a href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Submit a story</a><a href="mailto:withlovefmb@gmail.com?subject=FMB%20News%20Correction">Send a correction</a><a href="mailto:withlovefmb@gmail.com?subject=FMB%20Newsroom%20Inquiry">Contact newsroom</a></nav></div><div class="fnc-shell fnc-footer-bottom"><span>© 2026 FMB News. All rights reserved.</span><span>Filipino Media Bulletin</span><a href="#top">Back to top ${arrowIcon}</a></div></footer>`;
}

export function runtime() {
  return `<script>(()=>{
    const body=document.body,menu=document.querySelector('.fnc-menu'),nav=document.querySelector('#fncNav'),mobile=matchMedia('(max-width:1080px)');
    const closeControls=[...document.querySelectorAll('[data-fnc-menu-close]')];
    const focusable=()=>nav?[...nav.querySelectorAll('a[href],button:not([disabled])')].filter(node=>node.offsetParent!==null):[];
    const setMenu=open=>{
      if(!menu||!nav)return;
      const next=Boolean(open&&mobile.matches);
      body.classList.toggle('fnc-menu-open',next);
      body.classList.toggle('fnc-scroll-lock',next);
      menu.setAttribute('aria-expanded',String(next));
      menu.setAttribute('aria-label',next?'Close FMB News menu':'Open FMB News menu');
      nav.setAttribute('aria-hidden',String(mobile.matches&&!next));
      if(next){const target=nav.querySelector('[data-fnc-menu-close]')||nav.querySelector('a,button');const focusTarget=()=>target?.focus({preventScroll:true});nav.addEventListener('transitionend',focusTarget,{once:true});requestAnimationFrame(focusTarget);setTimeout(focusTarget,80);setTimeout(focusTarget,500)}
    };
    menu?.addEventListener('click',()=>setMenu(!body.classList.contains('fnc-menu-open')));
    closeControls.forEach(control=>control.addEventListener('click',()=>{setMenu(false);menu?.focus()}));
    nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&body.classList.contains('fnc-menu-open')){setMenu(false);menu?.focus();return}
      if(event.key!=='Tab'||!body.classList.contains('fnc-menu-open'))return;
      const nodes=focusable();if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    });
    const syncMenu=()=>{if(!mobile.matches)setMenu(false);else nav?.setAttribute('aria-hidden',String(!body.classList.contains('fnc-menu-open')))};
    mobile.addEventListener?.('change',syncMenu);syncMenu();

    const search=document.querySelector('[data-fnc-search]'),cards=[...document.querySelectorAll('[data-fnc-result-card]')],buttons=[...document.querySelectorAll('[data-fnc-filter]')],defaults=[...document.querySelectorAll('[data-fnc-default]')],results=document.querySelector('[data-fnc-results]'),empty=document.querySelector('[data-fnc-empty]'),status=document.querySelector('[data-fnc-filter-status]'),clear=document.querySelector('[data-fnc-clear]');
    const allowed=new Set(['all','national','world','business','technology','culture','environment','health']);
    let active=new URLSearchParams(location.search).get('section')||'all';if(!allowed.has(active))active='all';
    const matches=(node,term)=>{const category=node.dataset.category||'national';return(active==='all'||category===active)&&(!term||(node.textContent||'').toLowerCase().includes(term))};
    const apply=()=>{
      const term=(search?.value||'').trim().toLowerCase();let shown=0;
      cards.forEach(card=>{card.hidden=!matches(card,term);if(!card.hidden)shown++});
      buttons.forEach(button=>{const selected=button.dataset.fncFilter===active;button.classList.toggle('is-active',selected);button.setAttribute('aria-pressed',String(selected))});
      const discovering=Boolean(term||active!=='all');defaults.forEach(node=>{node.hidden=discovering});if(results)results.hidden=!discovering;if(clear)clear.hidden=!discovering;
      if(empty)empty.hidden=!discovering||shown!==0;if(status){status.textContent=discovering?(shown===1?'1 report found':shown+' reports found'):cards.length+' reports available';status.setAttribute('aria-live','polite')}
    };
    buttons.forEach(button=>button.addEventListener('click',()=>{active=button.dataset.fncFilter||'all';const url=new URL(location.href);if(active==='all')url.searchParams.delete('section');else url.searchParams.set('section',active);history.replaceState({},'',url.pathname+url.search+'#reports');apply()}));
    clear?.addEventListener('click',()=>{active='all';if(search)search.value='';const url=new URL(location.href);url.searchParams.delete('section');history.replaceState({},'',url.pathname+url.search+'#reports');apply();search?.focus()});
    search?.addEventListener('input',apply);apply();

    const clocks=[...document.querySelectorAll('[data-pht-time]')];
    const tick=()=>{const now=new Date(),label=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true}).format(now),iso=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now).replace(' ','T')+'+08:00';clocks.forEach(clock=>{clock.textContent=label;clock.setAttribute('datetime',iso)})};
    tick();setInterval(tick,1000);
  })();</script>`;
}

export function head(title, description, canonical, image = logo, type = 'website', publishedAt = '', options = {}) {
  const absoluteImage = image.startsWith('http') ? image : `https://www.francinemariebautista.com${image}`;
  const published = type === 'article' && publishedAt ? `<meta property="article:published_time" content="${esc(publishedAt)}">` : '';
  const modified = type === 'article' && options.updatedAt ? `<meta property="article:modified_time" content="${esc(options.updatedAt)}">` : '';
  const imageDimensions = `${options.imageWidth ? `<meta property="og:image:width" content="${esc(options.imageWidth)}">` : ''}${options.imageHeight ? `<meta property="og:image:height" content="${esc(options.imageHeight)}">` : ''}`;
  const imageAlt = options.imageAlt || 'FMB News';
  const structuredData = options.structuredData || '';
  return `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#12071f"><link rel="canonical" href="${canonical}"><meta property="og:type" content="${type}">${published}${modified}<meta property="og:site_name" content="FMB News"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${esc(absoluteImage)}">${imageDimensions}<meta property="og:image:alt" content="${esc(imageAlt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(absoluteImage)}"><meta name="twitter:image:alt" content="${esc(imageAlt)}">${structuredData}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Playfair+Display:wght@600;700&display=swap"><link rel="stylesheet" href="${css}"></head>`;
}

const reportCard = (record, result = false) => `<article class="fnc-report-card"${result ? ' data-fnc-result-card' : ''} data-category="${esc(record.category)}" data-published-at="${esc(record.publishedAt)}"><a href="${record.route}"><figure><img src="${esc(record.image)}" loading="lazy" decoding="async" alt="${esc(record.alt)}"><figcaption class="fnc-credit">${esc(record.credit)}</figcaption></figure><div class="fnc-report-copy"><p class="fnc-meta">${esc(record.kicker)}</p><h3>${esc(record.title)}</h3><p>${esc(record.description)}</p><small><time datetime="${esc(record.publishedAt)}">${esc(record.published)}</time></small><span class="fnc-card-arrow">${arrowIcon}</span></div></a></article>`;

const supportCard = (record) => `<article class="fnc-support-story" data-category="${esc(record.category)}" data-published-at="${esc(record.publishedAt)}"><a href="${record.route}"><figure><img src="${esc(record.image)}" loading="lazy" decoding="async" alt="${esc(record.alt)}"><figcaption class="fnc-credit">${esc(record.credit)}</figcaption></figure><div><p class="fnc-meta">${esc(record.kicker)}</p><h3>${esc(record.title)}</h3><small><time datetime="${esc(record.publishedAt)}">${esc(record.published)}</time></small></div></a></article>`;

const briefingTime = (record) => {
  const date = new Date(record.publishedAt);
  if (Number.isNaN(date.getTime())) return record.published;
  return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
};

const briefingRow = (record) => `<a class="fnc-briefing-row" href="${record.route}" data-category="${esc(record.category)}" data-published-at="${esc(record.publishedAt)}"><time datetime="${esc(record.publishedAt)}">${esc(briefingTime(record))}</time><span><small>${esc(record.kicker)}</small><strong>${esc(record.title)}</strong></span>${arrowIcon}</a>`;

const contextRow = (record, number) => `<a class="fnc-context-row" href="${record.route}" data-category="${esc(record.category)}" data-published-at="${esc(record.publishedAt)}"><span>${String(number).padStart(2, '0')}</span><div><small>${esc(record.kicker)}</small><strong>${esc(record.title)}</strong><time datetime="${esc(record.publishedAt)}">${esc(record.published)}</time></div></a>`;

export function landingPage(records) {
  const lead = records[0];
  const developing = records.slice(1, 3);
  const briefings = records.slice(3, 8);
  const latest = records.slice(8, 16);
  const context = records.slice(16, 20);
  const archive = records.slice(20);
  const filters = newsCategories;
  const wire = records.slice(0, 6).map((record) => ({ title: record.title, route: record.route }));

  return `<!doctype html><html lang="en-PH">${head('FMB News | The News That Matters. Made Clear for Filipinos.', 'FMB News gathers credible facts, adds useful context, and explains why important stories matter to Filipino lives.', 'https://www.francinemariebautista.com/fmbnews/', lead.image)}<body id="top" class="fmb-news-clean fmb-news-landing">${shell('latest', wire)}<main id="main"><span id="rundown" hidden></span><span id="philippines" hidden></span><span id="world" hidden></span><span id="culture" hidden></span>
  <section class="fnc-identity-band" aria-labelledby="fmbNewsTitle" data-fnc-default><div class="fnc-shell fnc-identity-grid"><div><p>FMB News · Filipino Media Bulletin</p><h1 id="fmbNewsTitle">The news that matters. <span>Made clear for Filipinos.</span></h1></div><p>Credible evidence, useful context, and clear Filipino relevance. Published newest first from the FMB News desk.</p><div class="fnc-identity-arcs" aria-hidden="true"><i></i><i></i><i></i></div></div></section>
  <section class="fnc-newsdesk" aria-label="FMB News front desk" data-fnc-default><div class="fnc-shell"><div class="fnc-desk-grid">
    <article class="fnc-desk-lead" data-category="${esc(lead.category)}" data-published-at="${esc(lead.publishedAt)}"><div class="fnc-desk-lead-copy"><p class="fnc-meta"><span>Lead report</span> ${esc(lead.kicker)}</p><h2><a href="${lead.route}">${esc(lead.title)}</a></h2><p>${esc(lead.description)}</p><div class="fnc-desk-lead-meta"><time datetime="${esc(lead.publishedAt)}">${esc(lead.published)}</time><a class="fnc-read" href="${lead.route}">Read full report ${arrowIcon}</a></div></div><a class="fnc-desk-lead-media" href="${lead.route}" aria-label="Read ${esc(lead.title)}"><figure><img src="${esc(lead.image)}" fetchpriority="high" decoding="async" alt="${esc(lead.alt)}"><figcaption class="fnc-credit">${esc(lead.credit)}</figcaption></figure></a></article>
    <section class="fnc-developing" aria-labelledby="developingTitle"><header><p>Developing</p><h2 id="developingTitle">Stories shaping the day</h2></header><div>${developing.map(supportCard).join('')}</div></section>
    <aside class="fnc-briefings" aria-labelledby="briefingsTitle"><header><div><p>Latest briefings</p><h2 id="briefingsTitle">From the desk</h2></div><span>Philippine time</span></header><div>${briefings.map(briefingRow).join('')}</div><a class="fnc-briefings-all" href="#reports">View all reports ${arrowIcon}</a></aside>
  </div></div></section>
  <section class="fnc-tools" aria-label="Search and filter FMB News"><div class="fnc-shell fnc-tools-row"><div class="fnc-search-wrap"><label class="fnc-search-label" for="newsSearch">${searchIcon}<span class="sr-only">Search FMB News</span><input id="newsSearch" class="fnc-search" data-fnc-search type="search" placeholder="Search reports, people, places, or topics" autocomplete="off"></label><div class="fnc-search-state"><span class="fnc-filter-status" data-fnc-filter-status></span><button type="button" data-fnc-clear hidden>Clear search and filters</button></div></div><div class="fnc-category-wrap"><p>News categories</p><div class="fnc-categories" aria-label="News categories">${filters.map(([value, label]) => `<button class="fnc-category" type="button" data-fnc-filter="${value}" aria-pressed="false">${label}</button>`).join('')}</div></div></div></section>
  <section class="fnc-content" id="reports"><div class="fnc-shell"><div class="fnc-report-overview" data-fnc-default><header class="fnc-section-head"><div><p class="fnc-kicker">The newsroom</p><h2>Latest reports</h2></div><p><strong>Newest first</strong><span>${records.length} reports accessible</span></p></header><div class="fnc-report-layout"><div class="fnc-report-columns">${latest.map((record) => reportCard(record)).join('')}</div><aside class="fnc-context" aria-labelledby="contextTitle"><header><p>In context</p><h2 id="contextTitle">From the archive</h2><span>Reports worth returning to</span></header><div>${context.map((record, index) => contextRow(record, index + 1)).join('')}</div><a href="/fmbnews/about/">How FMB News works ${arrowIcon}</a></aside></div>${archive.length ? `<details class="fnc-archive"><summary><span>More from the newsroom</span><strong>Browse ${archive.length} earlier reports</strong>${arrowIcon}</summary><div class="fnc-archive-list">${archive.map((record) => `<a href="${record.route}" data-category="${esc(record.category)}" data-published-at="${esc(record.publishedAt)}"><span>${esc(record.kicker)}</span><strong>${esc(record.title)}</strong><time datetime="${esc(record.publishedAt)}">${esc(record.published)}</time></a>`).join('')}</div></details>` : ''}</div><div class="fnc-discovery" data-fnc-results hidden><header><p class="fnc-kicker">Search and category results</p><h2>Reports from the newsroom</h2></header><div class="fnc-discovery-grid">${records.map((record) => reportCard(record, true)).join('')}</div><p class="fnc-no-results" data-fnc-empty hidden>No reports match this search yet. Try another category or search term.</p></div></div></section>
  </main>${foot()}${runtime()}</body></html>`;
}

export function aboutPage() {
  const questions = [
    ['01', 'What happened?', 'The verified facts.'],
    ['02', 'What is the context?', 'The background, institutions, history, and forces shaping the story.'],
    ['03', 'Why does it matter to Filipinos?', 'The possible effect on people, communities, livelihoods, rights, safety, culture, and opportunities.'],
    ['04', 'What should readers watch next?', 'The developments, decisions, risks, or consequences that may follow.'],
  ];
  const principles = [
    ['Evidence first', 'We use credible sources, official documents, primary records, and clear attribution.'],
    ['Context always', 'We do not publish isolated facts without explaining the larger situation.'],
    ['Filipino relevance', 'Every major story explains why it matters to Filipino readers.'],
    ['Original writing', 'We do not copy, lightly rewrite, or imitate source articles.'],
    ['Fact and analysis kept distinct', 'Readers should know what is verified and what is interpretation.'],
    ['Accountability stays visible', 'Sources, corrections, and editorial methods should be easy to find.'],
  ];

  return `<!doctype html><html lang="en-PH">${head('About FMB News | A Filipino News-Explainer Platform', 'FMB News gathers credible facts, adds useful context, and explains why important stories matter to Filipino lives.', 'https://www.francinemariebautista.com/fmbnews/about/', colorLogo)}<body class="fmb-news-clean fmb-news-about">${shell('about')}<main id="main"><section class="fmb-about-hero" aria-labelledby="aboutTitle"><div class="fnc-shell fmb-about-hero-grid"><div class="fmb-about-hero-copy"><p class="fmb-about-label">About FMB News</p><h1 id="aboutTitle">Clarity without making the story shallow.</h1></div><div class="fmb-about-hero-statement"><p>FMB News is a Filipino news-explainer platform built for people who deserve the full picture but do not always have hours to gather it themselves.</p><strong>The news that matters. Made clear for Filipinos.</strong></div></div></section><section class="fmb-about-purpose" aria-labelledby="purposeTitle"><div class="fnc-shell fmb-about-purpose-grid"><div class="fmb-about-purpose-title"><p class="fmb-about-label">What we do</p><h2 id="purposeTitle">We connect complex public information to Filipino life.</h2></div><div class="fmb-about-purpose-copy"><p>Important facts are often spread across credible reporting, official records, public documents, research, and direct statements. FMB News gathers that evidence, compares the available accounts, and produces original reports for Filipino readers.</p><p>We are the interpretation and relevance layer between complex public information and the reader. We make stories easier to follow while preserving their context, uncertainty, and consequence.</p><p>The problem is not a lack of intelligence. It is time, access, context, information overload, and the way many reports are written.</p></div></div></section><section class="fmb-about-mission-vision" aria-label="FMB News mission and vision"><div class="fnc-shell fmb-about-mv-grid"><article class="fmb-about-mv"><span>01</span><p class="fmb-about-label">Our mission</p><h2>Help Filipinos understand important local and global developments.</h2><p>We do this through verified facts, visible sources, meaningful context, and clear explanations.</p></article><article class="fmb-about-mv"><span>02</span><p class="fmb-about-label">Our vision</p><h2>Become one of the Philippines' most trusted digital news-explainer platforms.</h2><p>We want FMB News to be known for clarity, evidence, accountability, and Filipino relevance.</p></article></div></section><section class="fmb-about-method" id="method" aria-labelledby="methodTitle"><img class="fmb-about-method-watermark" src="${outlineLogo}" width="1133" height="243" alt="" aria-hidden="true"><div class="fnc-shell"><div class="fmb-about-method-head"><p class="fmb-about-label">The FMB News lens</p><h2 id="methodTitle">Four questions guide every major story.</h2></div><ol class="fmb-about-method-list">${questions.map(([number, question, answer]) => `<li><span>${number}</span><div><h3>${question}</h3><p>${answer}</p></div></li>`).join('')}</ol></div></section><section class="fmb-about-standards" id="standards" aria-labelledby="standardsTitle"><div class="fnc-shell fmb-about-standards-grid"><div class="fmb-about-standards-intro"><p class="fmb-about-label">Our editorial principles</p><h2 id="standardsTitle">Evidence before noise.</h2></div><div class="fmb-about-principles">${principles.map(([title, copy]) => `<article><span>${title}</span><p>${copy}</p></article>`).join('')}<article id="image-policy"><span>Image sources stay honest</span><p>Open-license and public-domain images retain their creator, source, and license. When a visual is supplied directly for a report, we label it as supplied and never invent a photographer credit. Publication does not transfer copyright, and verified credit or rights information will be added when provided.</p></article></div></div></section><section class="fmb-about-closing" aria-labelledby="closingTitle"><div class="fnc-shell fmb-about-closing-grid"><div><p class="fmb-about-label">The simplest definition</p><h2 id="closingTitle">We gather the facts, explain the context, and show Filipinos why the story matters.</h2></div><nav aria-label="Continue exploring FMB News"><a href="/fmbnews/">Read the latest reports</a><a href="#standards">Review our editorial principles</a><a href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Submit a story or tip</a></nav></div></section></main>${foot()}${runtime()}</body></html>`;
}

export const redirectPage = (to) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="FMB News canonical newsroom redirect."><meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0;url=${to}"><link rel="canonical" href="https://www.francinemariebautista.com${to}"><title>FMB News</title></head><body><p>FMB News has moved to <a href="${to}">${to}</a>.</p></body></html>`;
