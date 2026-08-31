import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'dist','news','index.html');
let html=await readFile(file,'utf8');

html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>Filipino Media Bulletin | FMB News, FMB Worldwide &amp; FMB Daily Brief</title>');
html=html.replace(/<meta name="description" content="[^"]*">/i,'<meta name="description" content="Filipino Media Bulletin: FMB News explainers and overviews, FMB Worldwide global context, and the FMB Daily Brief newsletter.">');
html=html.replace(/<meta property="og:site_name" content="[^"]*">/i,'<meta property="og:site_name" content="Filipino Media Bulletin">');
html=html.replace(/<meta property="og:title" content="[^"]*">/i,'<meta property="og:title" content="Filipino Media Bulletin">');
html=html.replace(/<meta property="og:description" content="[^"]*">/i,'<meta property="og:description" content="Philippine explainers, worldwide context, and one concise daily newsletter.">');

if(!html.includes('/assets/css/fmb-news-landing-hardfix.css')){
  html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/fmb-news-landing-hardfix.css?v=20260831-emblem-type"></head>');
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

html=html.replace(/<header class="mast"><div class="shell">[\s\S]*?<\/div><\/header>/i,
  '<header class="mast publication-mast"><div class="shell publication-lockup"><img class="publication-emblem" src="/assets/images/brand/fmb-bulletin-emblem.svg" alt="" aria-hidden="true"><div class="publication-name"><a class="publication-wordmark" href="/news/" aria-label="Filipino Media Bulletin">Filipino Media Bulletin</a><div class="publication-tagline">Information with Purpose</div></div></div></header>');

html=html.replace(/<nav class="nav"[\s\S]*?<\/nav>/i,
  '<nav class="nav" aria-label="Filipino Media Bulletin"><div class="shell"><a href="/news/archive/">FMB News</a><a href="/news/world/">FMB Worldwide</a><a href="/news/fmb-brief/">FMB Daily Brief</a><a href="/news/about/">About</a></div></nav>');

const main=`<main class="network-home">
  <h1 class="sr-only">Filipino Media Bulletin</h1>

  <section class="network-products" aria-label="Filipino Media Bulletin publications">
    <a class="network-product news" href="/news/archive/">
      <span class="product-index">Philippines · Explainers · Overviews</span>
      <div class="product-copy">
        <h2>FMB News</h2>
        <p>Philippine news, explained. Verified facts, concise overviews, and the context behind the stories shaping Filipino life.</p>
      </div>
      <span class="product-link">Read FMB News →</span>
    </a>

    <a class="network-product world" href="/news/world/">
      <span class="product-index">World · Explainers · Overviews</span>
      <div class="product-copy">
        <h2>FMB Worldwide</h2>
        <p>The world, made relevant. Major global developments explained clearly, with the context Filipino readers need.</p>
      </div>
      <span class="product-link">Read FMB Worldwide →</span>
    </a>
  </section>

  <section class="daily-brief-signup" aria-labelledby="daily-brief-title">
    <div class="brief-copy">
      <div class="brief-label">Daily Newsletter</div>
      <h2 id="daily-brief-title">FMB Daily Brief</h2>
      <p>One concise email with the stories that matter most. Delivered daily.</p>
    </div>
    <form data-fmb-newsletter-form novalidate>
      <label class="sr-only" for="fmb-landing-email">Email address</label>
      <input id="fmb-landing-email" type="email" name="email" placeholder="Email address" autocomplete="email" required>
      <button type="submit">Subscribe</button>
      <input data-fmb-newsletter-honeypot name="company" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
      <label class="consent"><input type="checkbox" data-fmb-newsletter-consent required><span>I agree to receive the FMB Daily Brief and can unsubscribe at any time. <a href="/privacy/">Privacy Policy</a>.</span></label>
      <p class="status" data-fmb-newsletter-status role="status" aria-live="polite"></p>
    </form>
  </section>
</main>`;

html=html.replace(/<main[\s\S]*?<\/main>/i,main);

await writeFile(file,html,'utf8');
console.log('Filipino Media Bulletin landing upgraded with official emblem, simplified copy, two publication overviews, and one FMB Daily Brief subscription CTA.');
