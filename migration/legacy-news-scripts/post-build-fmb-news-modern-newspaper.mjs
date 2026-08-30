import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const strip = (value = '') => String(value)
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#0?39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/\s+/g, ' ')
  .trim();

function latestHeadlines(html, limit = 8) {
  const results = [];
  const seen = new Set();
  const pattern = /<h(?:2|3)\b[^>]*>\s*<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>\s*<\/h(?:2|3)>/gi;
  for (const match of html.matchAll(pattern)) {
    const href = match[1];
    const title = strip(match[2]);
    if (!href.startsWith('/news/') || /\/news\/(?:fmb-brief|archive|about)\/?$/i.test(href)) continue;
    if (!title || seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    results.push({ href, title });
    if (results.length >= limit) break;
  }
  return results;
}

function headlineWire(headlines) {
  const fallback = [{ href: '/news/', title: 'FMB News · Verified reporting, useful context, Philippine perspective' }];
  const items = headlines.length ? headlines : fallback;
  const run = items.map((item) => `<a href="${esc(item.href)}">${esc(item.title)}</a>`).join('');
  return `<div class="fmb-news-wire" data-fmb-news-wire aria-label="Latest FMB News headlines"><div class="fmb-wire-label"><span aria-hidden="true"></span>HEADLINES</div><div class="fmb-wire-window"><div class="fmb-wire-track">${run}${run}</div></div><div class="fmb-wire-clock"><span id="fmbPhtDate">Philippine Standard Time</span><time id="fmbPhtClock">PHT</time></div></div>`;
}

const newspaperStyles = `<style id="fmb-modern-newspaper-style">
.fmb-news-wire{position:sticky;top:0;z-index:120;display:grid;grid-template-columns:auto minmax(0,1fr) auto;min-height:38px;overflow:hidden;background:#1b0828;color:#fff;border-bottom:1px solid #ffffff24;font-family:Arial,Helvetica,sans-serif}.fmb-wire-label,.fmb-wire-clock{display:flex;align-items:center;white-space:nowrap}.fmb-wire-label{gap:9px;padding:0 18px;font-size:9px;font-weight:800;letter-spacing:.14em}.fmb-wire-label span{width:7px;height:7px;border-radius:50%;background:#b777f4;box-shadow:0 0 0 4px #b777f422}.fmb-wire-window{min-width:0;overflow:hidden;border-inline:1px solid #ffffff22}.fmb-wire-track{display:flex;align-items:center;width:max-content;min-height:38px;animation:fmbHeadlineMove 48s linear infinite;will-change:transform}.fmb-wire-track:hover{animation-play-state:paused}.fmb-wire-track a{display:flex;align-items:center;white-space:nowrap;color:#f7f1fa;text-decoration:none;font-size:11px;font-weight:650}.fmb-wire-track a:after{content:"";width:26px;height:1px;margin:0 18px;background:#b77af7aa}.fmb-wire-clock{min-width:190px;justify-content:flex-end;gap:10px;padding:0 18px}.fmb-wire-clock span{color:#cdbdd4;font-size:8px;letter-spacing:.06em}.fmb-wire-clock time{font-size:10px;font-weight:800;letter-spacing:.04em}@keyframes fmbHeadlineMove{to{transform:translateX(-50%)}}
.topline{display:none!important}.mast{top:38px!important;background:rgba(255,253,251,.985)!important;box-shadow:0 8px 28px rgba(28,8,40,.045)}.mast-inner{width:min(1380px,calc(100% - 48px))!important;min-height:0!important;padding:17px 0 0;display:grid!important;grid-template-columns:1fr!important;justify-items:center;gap:0!important}.brand{display:block;text-align:center;color:#281136!important;font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(3.2rem,6.5vw,5.8rem)!important;font-weight:700!important;line-height:.82!important;letter-spacing:-.065em!important}.brand small{display:block!important;margin:11px 0 0!important;color:#6d6670!important;font:800 .58rem/1 Arial,Helvetica,sans-serif!important;letter-spacing:.24em!important;text-transform:uppercase}.nav{width:100%;justify-content:center!important;gap:clamp(18px,3vw,38px)!important;margin-top:16px;border-top:1px solid #d9d4da}.nav a{padding:12px 0 11px!important;font-size:.63rem!important;letter-spacing:.095em!important}.nav a.active,.nav a:hover{border-color:#35125e!important}
.hero{background:#fffdfb!important;border-bottom:4px double #18151a!important}.hero-inner{width:min(1380px,calc(100% - 48px))!important;padding:18px 0 16px!important;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:end;gap:8px 26px}.hero .eyebrow{align-self:center;padding:0!important;background:transparent!important;color:#6d28d9!important;font-size:.58rem!important;letter-spacing:.14em!important}.hero h1{max-width:none!important;margin:0!important;font-size:clamp(1.85rem,3.2vw,3.15rem)!important;line-height:.96!important;letter-spacing:-.04em!important}.hero p{grid-column:2;margin:0!important;max-width:900px!important;font:1rem/1.5 Georgia,'Times New Roman',serif!important}.section{padding-top:34px!important}.section-head{align-items:center!important;margin-bottom:24px!important;padding:10px 0 11px!important;border-top:3px solid #18151a!important;border-bottom:1px solid #18151a!important}.section-head h2{font-size:clamp(2.2rem,3.6vw,3.7rem)!important}.lead-grid{gap:26px!important}.lead-card h2{font-size:clamp(2.7rem,4.8vw,4.9rem)!important;line-height:.92!important}.lead-card p,.story-card p{font-family:Georgia,'Times New Roman',serif}.story-card{border-top-color:#bfb8c0!important}.story-card h3{letter-spacing:-.03em!important}.special .section-head{border-top-color:#fff!important;border-bottom-color:#ffffff55!important}.special .eyebrow{background:transparent!important;padding:0!important;color:#d6b5ec!important}.footer{border-top:5px solid #35125e}
@media(max-width:900px){.fmb-wire-clock{min-width:auto}.fmb-wire-clock span{display:none}.mast-inner{width:min(100% - 28px,1380px)!important;padding-top:14px}.brand{font-size:clamp(2.7rem,10vw,4.2rem)!important}.nav{justify-content:flex-start!important;overflow-x:auto;scrollbar-width:none}.nav::-webkit-scrollbar{display:none}.nav a{white-space:nowrap}.hero-inner{width:min(100% - 28px,1380px)!important;grid-template-columns:1fr;gap:7px}.hero p{grid-column:1}.hero .eyebrow{order:-1}.section-head{align-items:flex-end!important;flex-direction:row!important}.section-head h2{font-size:2.6rem!important}}
@media(max-width:560px){.fmb-news-wire{grid-template-columns:auto minmax(0,1fr) auto;min-height:34px}.fmb-wire-label{padding:0 10px;font-size:8px}.fmb-wire-label span{display:none}.fmb-wire-track{min-height:34px;animation-duration:58s}.fmb-wire-track a{font-size:10px}.fmb-wire-track a:after{width:18px;margin:0 12px}.fmb-wire-clock{padding:0 10px}.fmb-wire-clock time{font-size:9px}.mast{top:34px!important}.mast-inner{width:100%!important;padding:12px 14px 0}.brand{font-size:2.65rem!important}.brand small{font-size:.49rem!important;letter-spacing:.19em!important;margin-top:8px!important}.nav{margin-top:12px!important;gap:20px!important}.nav a{padding:10px 0 11px!important;font-size:.56rem!important}.hero-inner{width:calc(100% - 28px)!important;padding:14px 0 13px!important}.hero h1{font-size:2rem!important}.hero p{font-size:.9rem!important;line-height:1.45!important}.section{padding-top:27px!important}.section-head{padding:8px 0 9px!important}.section-head h2{font-size:2.3rem!important}.lead-card h2{font-size:2.75rem!important}}
@media(prefers-reduced-motion:reduce){.fmb-wire-window{overflow-x:auto}.fmb-wire-track{animation:none!important}.fmb-wire-track a:nth-child(n+9){display:none}}
</style>`;

const newspaperScript = `<script id="fmb-modern-newspaper-script">(()=>{const clock=document.getElementById('fmbPhtClock');const date=document.getElementById('fmbPhtDate');if(!clock)return;const tf=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true});const df=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',weekday:'short',month:'short',day:'numeric'});function update(){const now=new Date();clock.textContent=tf.format(now)+' PHT';clock.dateTime=now.toISOString();if(date)date.textContent=df.format(now)}update();setInterval(update,1000)})();</script>`;

function patch(html) {
  if (!html.includes('id="fmb-modern-newspaper-style"')) {
    html = html.replace('</head>', `${newspaperStyles}</head>`);
  }
  if (!html.includes('data-fmb-news-wire')) {
    html = html.replace(/(<body\b[^>]*>)/i, `$1${headlineWire(latestHeadlines(html))}`);
  }
  if (!html.includes('id="fmb-modern-newspaper-script"')) {
    html = html.replace('</body>', `${newspaperScript}</body>`);
  }
  return html;
}

const targets = [
  path.join(dist, 'news', 'index.html'),
  path.join(dist, 'fmbnews', 'index.html'),
  path.join(dist, 'news', 'archive', 'index.html'),
];

for (const file of targets) {
  let html = await readFile(file, 'utf8');
  html = patch(html);
  await writeFile(file, html, 'utf8');
}

console.log('FMB News modern newspaper masthead, moving headline wire, and live PHT clock installed.');
