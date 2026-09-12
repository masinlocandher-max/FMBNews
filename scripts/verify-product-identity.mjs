import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
const resolve=(...parts)=>path.join(root,...parts);
const must=(value,message)=>{if(!value)throw new Error(message)};

for(const rel of [
  'public/assets/css/fmb-news-product-identity.css',
  'dist/news/assets/css/fmb-news-product-identity.css',
  'public/assets/css/fmb-news-publication-landing.css',
  'dist/news/assets/css/fmb-news-publication-landing.css',
  'public/assets/css/fmb-news-editorial-ia.css',
  'dist/news/assets/css/fmb-news-editorial-ia.css',
  'public/assets/css/fmb-news-editorial-refresh.css',
  'dist/news/assets/css/fmb-news-editorial-refresh.css',
  'dist/news/sports/index.html',
])await access(resolve(rel));

const productCss=await readFile(resolve('dist/news/assets/css/fmb-news-product-identity.css'),'utf8');
const landingCss=await readFile(resolve('dist/news/assets/css/fmb-news-publication-landing.css'),'utf8');
const iaCss=await readFile(resolve('dist/news/assets/css/fmb-news-editorial-ia.css'),'utf8');
const refreshCss=await readFile(resolve('dist/news/assets/css/fmb-news-editorial-refresh.css'),'utf8');

must(productCss.includes('Bodoni Moda')&&productCss.includes('Manrope'),'FMB typography regression: editorial display or UI font missing');
must(productCss.includes('--fmb-display')&&productCss.includes('--fmb-ui'),'FMB typography regression: shared font variables missing');
for(const signal of ['.network-products','.network-product:nth-child(4)','.daily-brief-signup','.publication-footer'])must(landingCss.includes(signal),`Landing structure regression: missing ${signal}`);
for(const signal of ['.editorial-desks','.editorial-desk-grid','.publication-menu-panel','body.fmb-sports-page','.sports-empty','.sports-story-grid'])must(iaCss.includes(signal),`Editorial IA stylesheet regression: missing ${signal}`);

for(const signal of [
  '--fmb-ink:#171A1B',
  '--fmb-charcoal:#101314',
  '--fmb-ivory:#F4F0E8',
  '--fmb-paper:#FAF8F3',
  '--fmb-crimson:#A71930',
  '--fmb-crimson-deep:#861226',
  '--fmb-metal-silver:#C6C8C7',
  '--fmb-metal-platinum:#E1E1DD',
  '--fmb-metal-steel:#8A8E90',
  '.fmb-brand-period',
  '.fmb-brand-descriptor',
  '.about-fmb-home',
  '.fmb-mobile-bottom-nav',
])must(refreshCss.includes(signal),`Approved identity regression: missing ${signal}`);
must(refreshCss.includes('.fmb-legacy-brand')&&refreshCss.includes('display:none!important'),'Legacy visible logo/emblem must remain suppressed by final visual authority');
must(!refreshCss.toLowerCase().includes('cyberpunk'),'Approved editorial refresh must not drift into cyberpunk styling');
if(landingCss.includes('/news/news/assets/')||iaCss.includes('/news/news/assets/')||refreshCss.includes('/news/news/assets/'))throw new Error('Landing asset is double-scoped');

async function walk(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else if(e.isFile()&&e.name.endsWith('.html'))out.push(p)}return out}
function expected(rel){const p=rel.replaceAll('\\','/').toLowerCase();if(p==='index.html')return{cls:'fmb-network-landing',kind:'landing'};if(p.startsWith('world/'))return{cls:'fmb-worldwide-route',kind:'world'};if(p.startsWith('explainer/'))return{cls:'fmb-explainer-route',kind:'explainer'};if(p.startsWith('fact-check/'))return{cls:'fmb-fact-check-route',kind:'factcheck'};if(p.startsWith('fmb-brief/')||/^fmb-brief-[^/]+\//.test(p))return{cls:'fmb-daily-brief-route',kind:'brief'};return{cls:'fmb-news-route',kind:p.startsWith('sports/')?'sports':'news'}}

const pages=await walk(newsRoot);let checked=0;
for(const file of pages){
  const rel=path.relative(newsRoot,file);const exp=expected(rel);const html=await readFile(file,'utf8');checked++;
  must(html.includes(exp.cls),`${rel}: missing ${exp.cls}`);
  must(html.includes('/news/assets/css/fmb-news-editorial-refresh.css?v=20260912-v3'),`${rel}: final editorial refresh stylesheet missing`);
  must(html.includes('class="fmb-lux-wordmark"'),`${rel}: FMB NEWS masthead wordmark missing`);
  must(html.includes('FMB NEWS<span class="fmb-brand-period">.</span>'),`${rel}: approved crimson-period masthead markup missing`);
  must(html.includes('class="fmb-brand-descriptor">FILIPINO MEDIA BULLETIN</span>'),`${rel}: masthead descriptor missing`);
  must(!html.includes('/news/news/assets/'),`${rel}: double-scoped asset path remains`);

  for(const href of ['/news/world/','/news/sports/','/news/fmb-brief/','/news/fact-check/','/news/explainer/','/news/horoscope/','/news/crossword/'])must(html.includes(`href="${href}"`),`${rel}: approved navigation missing ${href}`);

  if(exp.kind==='landing'){
    for(const signal of [
      '/news/assets/css/fmb-news-publication-landing.css',
      '/news/assets/css/fmb-news-editorial-ia.css',
      'News. World. Sports.',
      'href="/news/" aria-current="page">Home</a>',
      'href="/news/world/">World</a>',
      'href="/news/sports/">Sports</a>',
      'href="/news/fmb-brief/">Daily Briefing</a>',
      'href="/news/fact-check/">Fact Check</a>',
      'href="/news/explainer/">Explainers</a>',
      '<summary>Entertainment</summary>',
      'href="/news/horoscope/">Horoscope</a>',
      'href="/news/crossword/">Crossword</a>',
      'about-fmb-home',
      'Francine Marie Bautista',
      'Founder, FMB News',
      'Founder portrait placeholder for Francine Marie Bautista',
      '<h2>FMB News</h2>',
      '<h2>FMB Worldwide</h2>',
      '<h2>FMB Explainer</h2>',
      '<h2>FMB Fact Check</h2>',
      '<h2>FMB Daily Brief</h2>',
    ])must(html.includes(signal),`${rel}: refreshed editorial landing content missing ${signal}`);
    must(!html.includes('fmb-news-landing-hardfix.css'),`${rel}: legacy landing hardfix is still referenced by canonical homepage`);
    must((html.match(/class="network-product /g)||[]).length===5,`${rel}: landing must preserve exactly five editorial product cards`);
    must((html.match(/class="editorial-desk /g)||[]).length===3,`${rel}: landing must preserve exactly three editorial desks`);
    must((html.match(/data-fmb-newsletter-form/g)||[]).length===1,`${rel}: landing must contain exactly one Daily Brief email form`);
  }

  if(exp.kind==='sports'){
    for(const signal of ['<h1 id="sports-title">Sports</h1>','FMB News · Editorial Desk','/news/assets/css/fmb-news-editorial-ia.css'])must(html.includes(signal),`${rel}: Sports desk contract missing ${signal}`);
    const hasStories=html.includes('class="sports-story-grid"');
    const hasEmptyState=html.includes('class="sports-empty"');
    must(hasStories!==hasEmptyState,`${rel}: Sports desk must expose either story inventory or one explicit empty state`);
    if(hasStories)must(html.includes('class="sports-story"'),`${rel}: Sports story grid contains no rendered Sports stories`);
    if(hasEmptyState)must(html.includes('No Sports report is published yet.'),`${rel}: Sports empty state is not explicit`);
  }

  if(html.includes('>FMB Explained</a>'))throw new Error(`${rel}: obsolete visible FMB Explained label remains`);
  const footer=html.slice(html.indexOf('<footer class="footer'));
  if(footer.includes('data-fmb-newsletter-form'))throw new Error(`${rel}: footer contains redundant newsletter form`);
}

console.log(`Product identity verification passed across ${checked} pages: canonical FMB NEWS. masthead, Filipino Media Bulletin descriptor, ivory/ink/crimson frost/metal system, News/World/Sports desk IA, approved primary navigation, Entertainment grouping, founder provenance, and preserved five-product publication structure.`);