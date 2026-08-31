import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'dist','news','index.html');
let html=await readFile(file,'utf8');

html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>Filipino Media Bulletin | Trusted News. Meaningful Perspectives.</title>');
html=html.replace(/<meta name="description" content="[^"]*">/i,'<meta name="description" content="Filipino Media Bulletin delivers verified Philippine news, worldwide context, and the FMB Daily Brief newsletter.">');
html=html.replace(/<meta property="og:site_name" content="[^"]*">/i,'<meta property="og:site_name" content="Filipino Media Bulletin">');
html=html.replace(/<meta property="og:title" content="[^"]*">/i,'<meta property="og:title" content="Filipino Media Bulletin">');
html=html.replace(/<meta property="og:description" content="[^"]*">/i,'<meta property="og:description" content="Trusted news. Meaningful perspectives. Philippine reporting, worldwide context, and one concise daily newsletter.">');

if(!html.includes('/assets/css/fmb-news-landing-hardfix.css')){
  html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/fmb-news-landing-hardfix.css?v=20260831-approved-buildwebapps"></head>');
}else{
  html=html.replace(/fmb-news-landing-hardfix\.css\?v=[^\"]+/,'fmb-news-landing-hardfix.css?v=20260831-approved-buildwebapps');
}
if(!html.includes('/assets/images/brand/fmb-bulletin-emblem.svg')){
  html=html.replace('</head>','<link rel="icon" type="image/svg+xml" href="/assets/images/brand/fmb-bulletin-emblem.svg"></head>');
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
const envelopeIcon='<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="12" width="32" height="24" rx="2"></rect><path d="m10 15 14 12 14-12"></path></svg>';

const mast=`<header class="mast publication-mast"><div class="shell publication-header-inner"><a class="publication-lockup" href="/news/" aria-label="Filipino Media Bulletin"><img class="publication-emblem" src="/assets/images/brand/fmb-bulletin-emblem.svg" alt=""><span class="publication-name"><strong class="publication-wordmark">Filipino Media Bulletin</strong><span class="publication-tagline"><span></span>Information with Purpose<span></span></span></span></a><nav class="nav publication-nav" aria-label="Filipino Media Bulletin"><a href="/news/archive/">FMB News</a><a href="/news/world/">FMB Worldwide</a><a href="/news/fmb-brief/">FMB Daily Brief</a><a href="/news/about/">About</a><a class="publication-search" href="/news/archive/" aria-label="Search FMB News">${searchIcon}</a></nav></div></header>`;
html=html.replace(/<header class="mast[^"]*"[\s\S]*?<\/header>\s*<nav class="nav"[\s\S]*?<\/nav>/i,mast);

const main=`<main class="network-home">
  <section class="network-hero" aria-labelledby="network-hero-title">
    <div class="network-hero-art" aria-hidden="true"></div>
    <div class="network-hero-inner">
      <div class="network-hero-copy">
        <h1 id="network-hero-title"><span>Trusted News.</span><span>Meaningful Perspectives.</span></h1>
        <div class="network-hero-rule"><span></span></div>
        <p>We deliver verified news and clear context from the Philippines and around the world—so you can understand what truly matters.</p>
      </div>

      <div class="network-products" aria-label="Filipino Media Bulletin publications">
        <a class="network-product news" href="/news/archive/">
          <span class="network-product-icon">${newspaperIcon}</span>
          <h2>FMB News</h2>
          <span class="network-card-rule"><i></i></span>
          <p>Philippine news, explained.<br>Verified facts, concise overviews,<br>and meaningful context.</p>
          <span class="product-link">Explore FMB News <b>›</b></span>
        </a>

        <a class="network-product world" href="/news/world/">
          <span class="network-product-icon">${globeIcon}</span>
          <h2>FMB Worldwide</h2>
          <span class="network-card-rule"><i></i></span>
          <p>The world, made relevant.<br>Major global developments<br>explained for Filipino readers.</p>
          <span class="product-link">Explore FMB Worldwide <b>›</b></span>
        </a>

        <a class="network-product brief" href="#fmb-daily-brief-signup">
          <span class="network-product-icon">${envelopeIcon}</span>
          <h2>FMB Daily Brief</h2>
          <span class="network-card-rule"><i></i></span>
          <p>One concise email with the stories<br>that matter most.<br>Delivered daily.</p>
          <span class="product-link">Subscribe Now <b>›</b></span>
        </a>
      </div>

      <section class="daily-brief-signup" id="fmb-daily-brief-signup" aria-labelledby="daily-brief-title">
        <div class="daily-brief-mark"><img src="/assets/images/brand/fmb-bulletin-emblem.svg" alt="" aria-hidden="true"></div>
        <div class="brief-copy">
          <div class="brief-label">Subscribe to our daily newsletter</div>
          <h2 id="daily-brief-title">FMB Daily Brief</h2>
          <span class="brief-rule"><i></i></span>
        </div>
        <p class="brief-promise">Stay informed. Save time.<br>Delivered straight to your inbox<br>every morning.</p>
        <form data-fmb-newsletter-form novalidate>
          <div class="brief-form-row">
            <label class="sr-only" for="fmb-landing-email">Email address</label>
            <input id="fmb-landing-email" type="email" name="email" placeholder="Enter your email address" autocomplete="email" required>
            <button type="submit">Subscribe</button>
          </div>
          <input data-fmb-newsletter-honeypot name="company" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
          <label class="consent"><input type="checkbox" data-fmb-newsletter-consent required><span>No spam. Unsubscribe anytime. <a href="/privacy/">Privacy Policy</a>.</span></label>
          <p class="status" data-fmb-newsletter-status role="status" aria-live="polite"></p>
        </form>
      </section>
    </div>
  </section>
</main>`;
html=html.replace(/<main[\s\S]*?<\/main>/i,main);

const footer=`<footer class="footer publication-footer"><div class="shell publication-footer-inner"><img class="publication-footer-emblem" src="/assets/images/brand/fmb-bulletin-emblem.svg" alt=""><div><div class="footer-publication-title">Filipino Media Bulletin</div><div class="footer-publication-kicker">© 2026 · Information with Purpose</div></div></div></footer>`;
html=html.replace(/<footer class="footer"[\s\S]*?<\/footer>/i,footer);

html=html.replace(/<div class="ticker-label">[\s\S]*?<\/div>/i,'<div class="ticker-label"><span class="ticker-pulse" aria-hidden="true"></span>HEADLINES</div>');

await writeFile(file,html,'utf8');
console.log('Approved Build Web Apps landing applied: emblem mast, editorial hero, three product cards, Daily Brief signup rail, and simplified publication footer.');
