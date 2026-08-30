import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const overridesPath = path.join(root, 'apps', 'withlovefmb', 'content', 'news', 'rights-cleared-image-overrides.json');
const fallback = '/assets/images/news/fmb-news-editorial-fallback.svg';
const fallbackAbs = `https://www.francinemariebautista.com${fallback}`;
const overrides = JSON.parse(await readFile(overridesPath, 'utf8'));
const esc = (s='') => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

async function patchFile(file, fn) {
  let html;
  try { html = await readFile(file, 'utf8'); } catch { return; }
  const next = fn(html);
  if (next !== html) await writeFile(file, next);
}

function patchCard(html, slug, image) {
  const href = `href="/news/${slug}/"`;
  const start = html.indexOf(href);
  if (start < 0) return html;
  const windowEnd = Math.min(html.length, start + 1600);
  const slice = html.slice(start, windowEnd);
  const srcMatch = slice.match(new RegExp(`src="${fallback.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}"`));
  if (!srcMatch) return html;
  const srcAt = start + srcMatch.index;
  let out = html.slice(0, srcAt) + `src="${esc(image.url)}"` + html.slice(srcAt + srcMatch[0].length);
  const afterSrc = out.slice(srcAt, Math.min(out.length, srcAt + 900));
  const altMatch = afterSrc.match(/alt="[^"]*"/);
  if (altMatch) {
    const altAt = srcAt + altMatch.index;
    out = out.slice(0, altAt) + `alt="${esc(image.alt)}"` + out.slice(altAt + altMatch[0].length);
  }
  return out;
}

for (const [slug, image] of Object.entries(overrides)) {
  const articleFile = path.join(newsRoot, slug, 'index.html');
  await patchFile(articleFile, html => {
    let out = html;
    out = out.replace(`<meta property="og:image" content="${fallbackAbs}">`, `<meta property="og:image" content="${esc(image.url)}">`);
    out = out.replace(`<meta name="twitter:image" content="${fallbackAbs}">`, `<meta name="twitter:image" content="${esc(image.url)}">`);
    out = out.replace(`<figure class="article-figure"><img src="${fallback}"`, `<figure class="article-figure"><img src="${esc(image.url)}"`);
    const fig = /<figcaption>[\s\S]*?<\/figcaption>/;
    if (out.includes(`<figure class="article-figure"><img src="${esc(image.url)}"`)) {
      out = out.replace(fig, `<figcaption>${esc(image.caption)}<br><em>Credit: ${esc(image.credit)}</em></figcaption>`);
      out = out.replace(/(<figure class="article-figure"><img[^>]+alt=")[^"]*(")/, `$1${esc(image.alt)}$2`);
    }
    return out;
  });

  for (const file of [path.join(newsRoot,'index.html'), path.join(newsRoot,'archive','index.html')]) {
    await patchFile(file, html => patchCard(html, slug, image));
  }
}

const aboutDescription = 'Learn how FMB News verifies reports, handles corrections, uses images, maintains editorial independence and publishes the FMB Brief.';
const aboutFile = path.join(newsRoot, 'about', 'index.html');
await patchFile(aboutFile, html => {
  const start = html.indexOf('<main>');
  const end = html.indexOf('</main>');
  if (start < 0 || end < 0) return html;
  const about = `<main class="about-page"><section class="about-hero"><div class="shell"><p class="eyebrow">ABOUT FMB NEWS</p><h1>Independent reporting, explained for Filipinos.</h1><p class="about-lead">FMB News, Filipino Media Bulletin, is an independent digital publication built to make important developments easier to verify, understand and follow.</p></div></section><section class="shell about-grid"><div class="about-main"><section><h2>What we do</h2><p>We publish verified reports, explainers and the FMB Brief, our daily curated briefing. Our role is not to increase the volume of information. It is to reduce confusion by separating confirmed facts, context, implications and what still needs to be watched.</p></section><section id="standards"><h2>Editorial standards</h2><div class="standards-grid"><article><h3>Verification before speed</h3><p>Claims are checked against primary records, official statements and credible reporting whenever available. Unverified claims are not presented as established fact.</p></article><article><h3>Clear attribution</h3><p>Readers should be able to see where a material claim came from. Articles identify their sources and distinguish direct reporting from sourced information.</p></article><article><h3>Context without distortion</h3><p>We explain why a development matters without turning analysis into fact. Context, interpretation and forward-looking judgment are labeled as such.</p></article><article><h3>Corrections are part of the record</h3><p>Material errors are corrected promptly and transparently. We do not quietly preserve a known factual error for the sake of consistency.</p></article></div></section><section><h2>Images and visual integrity</h2><p>News images must either be owned by FMB News, supplied with permission, public domain, openly licensed, or used under another valid right. Contextual file photographs are labeled so they are not mistaken for photographs of the reported event.</p><p>We do not use synthetic images as documentary evidence of real events. When an original event photograph is unavailable, we prefer clearly labeled contextual or informational visuals rather than inventing a scene.</p></section><section><h2>Independence</h2><p>FMB News is privately operated and is not an official government newsroom. Coverage decisions are made according to public relevance, evidence and editorial judgment. Advertising, partnerships or personal relationships do not change the factual standard applied to a report.</p></section><section><h2>Technology and AI</h2><p>Technology may assist research, organization, production and quality control, but publication responsibility remains human. AI-generated text or automation is not treated as a source. Factual claims still require traceable evidence.</p></section><section><h2>Send a correction or story lead</h2><p>If you find a factual error, have a document we should review, or want to submit a story lead, contact the newsroom at <a href="mailto:withlovefmb@gmail.com">withlovefmb@gmail.com</a>. Include the article link and the specific claim or material that should be checked.</p></section></div><aside class="about-side"><div class="about-card"><h3>FMB News</h3><p><strong>Filipino Media Bulletin</strong></p><p>Verified reporting. Useful context. Clearer decisions.</p></div><div class="about-card"><h3>Core sections</h3><a href="/news/">Latest</a><a href="/news/fmb-brief/">FMB Brief</a><a href="/news/archive/">Archive</a></div><div class="about-card"><h3>Corrections</h3><p>Send the article URL and the exact point that needs review.</p><a href="mailto:withlovefmb@gmail.com?subject=FMB%20News%20Correction">Request a correction →</a></div></aside></section></main>`;
  let out = html.slice(0, start) + about + html.slice(end + 7);
  out = out.replace('<title>FMB News</title>','<title>About FMB News | Filipino Media Bulletin</title>');
  out = out.replace('content="FMB News canonical newsroom redirect."',`content="${aboutDescription}"`);
  out = out.replace('<meta property="og:title" content="FMB News">','<meta property="og:title" content="About FMB News | Filipino Media Bulletin">');
  out = out.replace('<meta name="twitter:title" content="FMB News">','<meta name="twitter:title" content="About FMB News | Filipino Media Bulletin">');
  out = out.replace('<meta property="og:description" content="FMB News canonical newsroom redirect.">',`<meta property="og:description" content="${aboutDescription}">`);
  out = out.replace('<meta name="twitter:description" content="FMB News canonical newsroom redirect.">',`<meta name="twitter:description" content="${aboutDescription}">`);
  return out;
});

const homepageFile = path.join(newsRoot, 'index.html');
const leadOverride = overrides['ocd-8-million-affected-32-dead-habagat-cyclones-august-30-2026'];
if (leadOverride) await patchFile(homepageFile, html => html
  .replace(`<meta property="og:image" content="${fallbackAbs}">`,`<meta property="og:image" content="${esc(leadOverride.url)}">`)
  .replace(`<meta name="twitter:image" content="${fallbackAbs}">`,`<meta name="twitter:image" content="${esc(leadOverride.url)}">`));

const briefFile = path.join(newsRoot, 'fmb-brief', 'index.html');
const briefImage = 'https://www.francinemariebautista.com/assets/images/news/social/fmb-brief-2026-08-29-1200x630.webp';
await patchFile(briefFile, html => html
  .replace(`<meta property="og:image" content="${fallbackAbs}">`,`<meta property="og:image" content="${briefImage}">`)
  .replace(`<meta name="twitter:image" content="${fallbackAbs}">`,`<meta name="twitter:image" content="${briefImage}">`));

console.log(`FMB News polish complete: About restored with complete metadata, FMB Brief social image restored, homepage social image aligned to the lead report, and ${Object.keys(overrides).length} rights-cleared contextual image override(s) applied.`);
