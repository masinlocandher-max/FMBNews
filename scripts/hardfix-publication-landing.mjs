import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'dist','news','index.html');
let html=await readFile(file,'utf8');

html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>Filipino Media Bulletin | FMB News, Worldwide, Explained and Daily Brief</title>');
html=html.replace(/<meta name="description" content="[^"]*">/i,'<meta name="description" content="Filipino Media Bulletin brings together FMB News, FMB Worldwide, FMB Explained, and FMB Daily Brief.">');
html=html.replace(/<meta property="og:site_name" content="[^"]*">/i,'<meta property="og:site_name" content="Filipino Media Bulletin">');
html=html.replace(/<meta property="og:title" content="[^"]*">/i,'<meta property="og:title" content="Filipino Media Bulletin">');
html=html.replace(/<meta property="og:description" content="[^"]*">/i,'<meta property="og:description" content="Four editorial products: FMB News, FMB Worldwide, FMB Explained, and FMB Daily Brief.">');

if(!html.includes('/assets/css/fmb-news-landing-hardfix.css')){
  html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/fmb-news-landing-hardfix.css?v=20260831-approved-buildwebapps"></head>');
}else{
  html=html.replace(/fmb-news-landing-hardfix\.css\?v=[^\"]+/,'fmb-news-landing-hardfix.css?v=20260831-approved-buildwebapps');
}
if(!html.includes('/assets/images/brand/fmb-bulletin-emblem.svg')){
  html=html.replace('</head>','<link rel="icon" type="image/svg+xml" href="/assets/images/brand/fmb-bulletin-emblem.svg"></head>');
}
if(!html.includes('data-fmb-four-products')){
  html=html.replace('</head>','<style data-fmb-four-products>.fmb-ref.fmb-network-landing .network-products{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:16px!important}.fmb-ref.fmb-network-landing .network-product{padding-left:20px!important;padding-right:20px!important}.fmb-ref.fmb-network-landing .network-product h2{font-size:clamp(25px,2.2vw,36px)!important}@media(max-width:1120px){.fmb-ref.fmb-network-landing .network-products{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:699px){.fmb-ref.fmb-network-landing .network-products{grid-template-columns:1fr!important}}</style></head>');
}

html=html.replace(/<body\s+class="([^"]*)"/i,(_m,c)=>{
  const set=new Set(c.split(/\s+/).filter(Boolean));
  set.delete('fmb-news-route');
  set.add('fmb-network-landing');
  return `<body class="${[...set].join(' ')}"`;
});

const searchIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.25"></circle><path d="m15.1 15.1 5 5"></path></svg>';
const newspaperIcon='<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="11" y="10" width="26" height="28" rx="2"></rect><path d="M16 16h16M16 22h7M27 22h5M16 28h16M16 33h11"></path><path d="M8 15v20a3 3 0 0 0 3 3"></path></svg>';
const globeIcon='<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="16"></circle><path d="M8 24h32M24 8c5 4 7 10 7 16s-2 12-7 16M24 8c-5 4-7 10-7 16s2 12 7 16M12 15c3 2 7 3 12 3s9-1 12-3M12 33c3-2 7-3 12-3s9 1 12 3"></path></svg>';
const explainerIcon='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M13 9h22v30H13z"></path><path d="M18 16h12M18 22h12M18 28h8"></path><circle cx="32" cy="31" r="5"></circle><path d="m35.5 34.5 4 4"></path></svg>';
const envelopeIcon='<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="12" width="32" height="24" rx="2"></rect><path d="m10 15 14 12 14-12"></path></svg>';

const mast=`<header class="mast publication-mast"><div class="shell publication-header-inner"><a class="publication-lockup" href="/news/" aria-label="Filipino Media Bulletin"><img class="publication-emblem" src="/assets/images/brand/fmb-bulletin-emblem.svg" alt=""><span class="publication-name"><strong class="publication-wordmark">Filipino Media Bulletin</strong><span class="publication-tagline"><span></span>Information with Purpose<span></span></span></span></a><nav class="nav publication-nav" aria-label="Filipino Media Bulletin"><a href="/news/archive/">FMB News</a><a href="/news/world/">FMB Worldwide</a><a href="/news/explainer/">FMB Explained</a><a href="/news/fmb-brief/">FMB Daily Brief</a><a href="/news/about/">About</a><a class="publication-search" href="/news/archive/" aria-label="Search FMB News">${searchIcon}</a></nav></div></header>`;
html=html.replace(/<header class="mast[^"]*"[\s\S]*?<\/header>\s*<nav class="nav"[\s\S]*?<\/nav>/i,mast);

const main=`<main class="network-home">
  <section class="network-hero" aria-labelledby="network-hero-title">
    <div class="network-hero-art" aria-hidden="true"></div>
    <div class="network-hero-inner">
      <div class="network-hero-copy">
        <h1 id="network-hero-title"><span>Trusted News.</span><span>Meaningful Perspectives.</span></h1>
        <div class="network-hero-rule"><span></span></div>
        <p>Four distinct editorial products, one Filipino Media Bulletin standard: verified information, useful context, and clear relevance for Filipino readers.</p>
      </div>

      <div class="network-products" aria-label="Filipino Media Bulletin products">
        <a class="network-product news" href="/news/archive/">
          <span class="network-product-icon">${newspaperIcon}</span>
          <h2>FMB News</h2>
          <span class="network-card-rule"><i></i></span>
          <p>Verified Philippine reporting.<br>Clear facts, concise updates,<br>and meaningful context.</p>
          <span class="product-link">Explore FMB News <b>›</b></span>
        </a>

        <a class="network-product world" href="/news/world/">
          <span class="network-product-icon">${globeIcon}</span>
          <h2>FMB Worldwide</h2>
          <span class="network-card-rule"><i></i></span>
          <p>Major global developments.<br>Filtered for importance<br>and Filipino relevance.</p>
          <span class="product-link">Explore Worldwide <b>›</b></span>
        </a>

        <a class="network-product explainer" href="/news/explainer/">
          <span class="network-product-icon">${explainerIcon}</span>
          <h2>FMB Explained</h2>
          <span class="network-card-rule"><i></i></span>
          <p>Go beyond the headline.<br>Understand how things work,<br>why they happen, and why they matter.</p>
          <span class="product-link">Open FMB Explained <b>›</b></span>
        </a>

        <a class="network-product brief" href="#fmb-daily-brief-signup">
          <span class="network-product-icon">${envelopeIcon}</span>
          <h2>FMB Daily Brief</h2>
          <span class="network-card-rule"><i></i></span>
          <p>One concise daily briefing.<br>The developments, context,<br>and implications worth knowing.</p>
          <span class="product-link">Continue with Email <b>›</b></span>
        </a>
      </div>

      <section class="daily-brief-signup" id="fmb-daily-brief-signup" aria-labelledby="daily-brief-title">
        <div class="daily-brief-mark"><img src="/assets/images/brand/fmb-bulletin-emblem.svg" alt="" aria-hidden="true"></div>
        <div class="brief-copy">
          <div class="brief-label">Your personalized FMB News</div>
          <h2 id="daily-brief-title">FMB Daily Brief</h2>
          <span class="brief-rule"><i></i></span>
        </div>
        <p class="brief-promise">Sign in by email for your Daily Brief,<br>saved stories, preferences,<br>and mobile alerts.</p>
        <form data-fmb-newsletter-form novalidate>
          <div class="brief-form-row">
            <label class="sr-only" for="fmb-landing-email">Email address</label>
            <input id="fmb-landing-email" type="email" name="email" placeholder="Enter your email address" autocomplete="email" required>
            <button type="submit">Continue</button>
          </div>
          <input data-fmb-newsletter-honeypot name="company" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
          <label class="consent"><input type="checkbox" data-fmb-newsletter-consent required><span>Personalize FMB News and receive FMB Daily Brief. <a href="/privacy/">Privacy Policy</a>.</span></label>
          <p class="status" data-fmb-newsletter-status role="status" aria-live="polite"></p>
        </form>
      </section>
    </div>
  </section>
</main>`;
html=html.replace(/<main[\s\S]*?<\/main>/i,main);

const footer=`<footer class="footer publication-footer"><div class="shell publication-footer-inner"><img class="publication-footer-emblem" src="/assets/images/brand/fmb-bulletin-emblem.svg" alt=""><div><div class="footer-publication-title">Filipino Media Bulletin</div><div class="footer-publication-kicker">FMB News · FMB Worldwide · FMB Explained · FMB Daily Brief</div></div></div></footer>`;
html=html.replace(/<footer class="footer"[\s\S]*?<\/footer>/i,footer);

html=html.replace(/<div class="ticker-label">[\s\S]*?<\/div>/i,'<div class="ticker-label"><span class="ticker-pulse" aria-hidden="true"></span>HEADLINES</div>');

await writeFile(file,html,'utf8');
console.log('Applied four official FMB products: FMB News, FMB Worldwide, FMB Explained, and FMB Daily Brief.');
