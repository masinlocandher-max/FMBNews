import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'dist','news','index.html');
let html=await readFile(file,'utf8');

html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>Filipino Media Bulletin | FMB News, FMB Worldwide & FMB Daily Brief</title>');
html=html.replace(/<meta name="description" content="[^"]*">/i,'<meta name="description" content="Filipino Media Bulletin brings together FMB News, FMB Worldwide, and the FMB Daily Brief newsletter.">');
html=html.replace(/<meta property="og:site_name" content="[^"]*">/i,'<meta property="og:site_name" content="Filipino Media Bulletin">');
html=html.replace(/<meta property="og:title" content="[^"]*">/i,'<meta property="og:title" content="Filipino Media Bulletin">');
html=html.replace(/<meta property="og:description" content="[^"]*">/i,'<meta property="og:description" content="FMB News, FMB Worldwide, and the FMB Daily Brief newsletter in one clear publication network.">');

if(!html.includes('/news/assets/css/fmb-news-landing-hardfix.css')){
  html=html.replace('</head>','<link rel="stylesheet" href="/news/assets/css/fmb-news-landing-hardfix.css?v=20260831-landing-hardfix"></head>');
}

html=html.replace(/<body\s+class="([^"]*)"/i,(_m,c)=>{
  const set=new Set(c.split(/\s+/).filter(Boolean));
  set.delete('fmb-news-route');
  set.add('fmb-network-landing');
  return `<body class="${[...set].join(' ')}"`;
});

html=html.replace(/<header class="mast"><div class="shell">[\s\S]*?<\/div><\/header>/i,
  '<header class="mast"><div class="shell"><a class="publication-wordmark" href="/news/" aria-label="Filipino Media Bulletin">Filipino Media Bulletin</a><div class="publication-tagline">Information with Purpose</div></div></header>');

html=html.replace(/<nav class="nav"[\s\S]*?<\/nav>/i,
  '<nav class="nav" aria-label="Filipino Media Bulletin"><div class="shell"><a href="/news/archive/">FMB News</a><a href="/news/world/">FMB Worldwide</a><a href="/news/fmb-brief/">FMB Daily Brief</a><a href="/news/about/">About</a></div></nav>');

const main=`<main class="network-home">
  <section class="network-intro" aria-labelledby="network-intro-title">
    <div class="network-intro-copy">
      <div class="network-kicker">One publication. Three focused products.</div>
      <h1 id="network-intro-title">Clear reporting without the noise.</h1>
      <p>Filipino Media Bulletin organizes its journalism by purpose: explain the Philippines clearly, track consequential developments around the world, and deliver the essential daily briefing by email.</p>
    </div>
    <div class="network-principles" aria-label="Editorial principles">
      <div class="network-principle"><strong>Verified first</strong><span>Facts are checked before they are framed.</span></div>
      <div class="network-principle"><strong>Context included</strong><span>Readers get the meaning, not just the event.</span></div>
      <div class="network-principle"><strong>Useful by design</strong><span>Every product has one clear job.</span></div>
    </div>
  </section>

  <section class="network-products" aria-label="Filipino Media Bulletin publications">
    <a class="network-product news" href="/news/archive/">
      <span class="product-index">Philippines · Explainers · Overviews</span>
      <h2>FMB News</h2>
      <p>Verified explainers and concise overviews of the national, local, civic, business, technology, health, and public-interest developments Filipinos need to understand.</p>
      <span class="product-link">Explore FMB News →</span>
    </a>
    <a class="network-product world" href="/news/world/">
      <span class="product-index">World · Context · Relevance</span>
      <h2>FMB Worldwide</h2>
      <p>Consequential developments beyond the Philippines, organized with enough context to understand what happened, why it matters, and what Filipino readers should watch next.</p>
      <span class="product-link">Explore FMB Worldwide →</span>
    </a>
  </section>

  <section class="daily-brief-signup" aria-labelledby="daily-brief-title">
    <div>
      <div class="brief-label">Daily Newsletter</div>
      <h2 id="daily-brief-title">FMB Daily Brief</h2>
      <p>Subscribe for one concise daily email with the developments worth knowing. No duplicate feed. No unnecessary noise.</p>
    </div>
    <form data-fmb-newsletter-form novalidate>
      <label class="sr-only" for="fmb-landing-email">Email address</label>
      <input id="fmb-landing-email" type="email" name="email" placeholder="Enter your email address" autocomplete="email" required>
      <button type="submit">Subscribe</button>
      <input data-fmb-newsletter-honeypot name="company" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
      <label class="consent"><input type="checkbox" data-fmb-newsletter-consent required><span>I agree to receive the FMB Daily Brief and understand I can unsubscribe at any time. Read our <a href="/privacy/">Privacy Policy</a>.</span></label>
      <p class="status" data-fmb-newsletter-status role="status" aria-live="polite"></p>
    </form>
  </section>
</main>`;

html=html.replace(/<main[\s\S]*?<\/main>/i,main);

await writeFile(file,html,'utf8');
console.log('Filipino Media Bulletin root landing page hard-fixed: FMB News overview, FMB Worldwide overview, and one FMB Daily Brief subscription CTA.');
