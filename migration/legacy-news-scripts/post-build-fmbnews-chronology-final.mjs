import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const roots = [path.join(root, 'dist', 'fmbnews'), path.join(root, 'dist', 'news')];
const landingPaths = roots.map(dir => path.join(dir, 'index.html'));

async function walk(dir) {
  const out = [];
  try {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...await walk(p));
      else if (e.isFile() && e.name === 'index.html') out.push(p);
    }
  } catch {}
  return out;
}

const strip = s => String(s || '')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const esc = s => String(s || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const attr = (html, re) => html.match(re)?.[1]?.trim() || '';

function publicationDate(html) {
  const candidates = [
    attr(html, /<meta\b[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i),
    attr(html, /<meta\b[^>]*content=["']([^"']+)["'][^>]*property=["']article:published_time["']/i),
    attr(html, /["']datePublished["']\s*:\s*["']([^"']+)["']/i),
    attr(html, /<time\b[^>]*datetime=["']([^"']+)["'][^>]*>/i),
  ].filter(Boolean);
  for (const value of candidates) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function canonicalPath(html, file) {
  const canonical = attr(html, /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
    || attr(html, /<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  if (canonical) {
    try { return new URL(canonical).pathname; } catch {}
  }
  const rel = path.relative(path.join(root, 'dist'), path.dirname(file)).split(path.sep).join('/');
  return `/${rel}/`;
}

function titleOf(html) {
  return strip(attr(html, /<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    || attr(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
    || attr(html, /<title>([\s\S]*?)<\/title>/i)).replace(/\s*\|\s*FMB News.*$/i, '');
}

function descOf(html) {
  return strip(attr(html, /<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    || attr(html, /<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i));
}

function imageOf(html) {
  return attr(html, /<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-PH', { timeZone:'Asia/Manila', month:'long', day:'numeric', year:'numeric' }).format(date);
}
function formatTime(date) {
  return new Intl.DateTimeFormat('en-PH', { timeZone:'Asia/Manila', hour:'numeric', minute:'2-digit', hour12:true }).format(date).replace('am','AM').replace('pm','PM');
}
function dayKey(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Manila', year:'numeric', month:'2-digit', day:'2-digit' }).format(date);
}

const files = [...new Set((await Promise.all(roots.map(walk))).flat())]
  .filter(f => !landingPaths.includes(f) && !/[/\\]about[/\\]index\.html$/i.test(f));
const byUrl = new Map();
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const date = publicationDate(html);
  const title = titleOf(html);
  if (!date || !title) continue;
  const url = canonicalPath(html, file).replace(/^\/news\//, '/fmbnews/');
  const item = { url, title, description: descOf(html), image: imageOf(html), date };
  const existing = byUrl.get(url);
  if (!existing || date > existing.date) byUrl.set(url, item);
}
const stories = [...byUrl.values()].sort((a,b) => b.date - a.date);
const groups = new Map();
for (const story of stories) {
  const k = dayKey(story.date);
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(story);
}

const chronology = `<section class="fmb-chronology" id="rundown" data-fmb-chronology-final aria-labelledby="fmbChronologyTitle">
  <div class="wrap fmb-chronology-wrap">
    <div class="fmb-chronology-head"><p>FMB News</p><h2 id="fmbChronologyTitle">Latest by date and time</h2><span>Philippine Standard Time</span></div>
    ${[...groups.values()].map(items => `<section class="fmb-day-group"><h3>${esc(formatDate(items[0].date))}</h3><div class="fmb-day-list">${items.map(story => `<article class="fmb-time-story"><a href="${esc(story.url)}">${story.image ? `<img src="${esc(story.image)}" alt="" loading="lazy">` : ''}<div><time datetime="${story.date.toISOString()}">${esc(formatTime(story.date))} PHT</time><h4>${esc(story.title)}</h4>${story.description ? `<p>${esc(story.description)}</p>` : ''}</div></a></article>`).join('')}</div></section>`).join('')}
  </div>
</section>`;

const css = `<style data-fmb-chronology-final>
.fmb-chronology{padding:28px 0 64px;background:#fff;color:#111}.fmb-chronology-wrap{max-width:1180px;margin:auto;padding:0 20px}.fmb-chronology-head{display:grid;grid-template-columns:1fr auto;gap:6px 24px;align-items:end;border-bottom:3px solid #111;padding-bottom:16px;margin-bottom:30px}.fmb-chronology-head p{grid-column:1/-1;margin:0;font:700 12px/1.2 Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase}.fmb-chronology-head h2{margin:0;font:700 clamp(32px,5vw,58px)/.95 Georgia,serif}.fmb-chronology-head span{font:600 12px/1.2 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}.fmb-day-group{margin:0 0 42px}.fmb-day-group>h3{position:sticky;top:64px;z-index:2;margin:0 0 14px;padding:10px 0;background:#fff;border-bottom:1px solid #cfcfcf;font:700 18px/1.2 Arial,sans-serif}.fmb-day-list{display:grid}.fmb-time-story{border-bottom:1px solid #e4e4e4}.fmb-time-story>a{display:grid;grid-template-columns:minmax(0,180px) 1fr;gap:22px;padding:18px 0;color:inherit;text-decoration:none}.fmb-time-story img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px}.fmb-time-story time{display:block;margin-bottom:7px;font:800 12px/1.2 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}.fmb-time-story h4{margin:0;font:700 clamp(22px,3vw,34px)/1.04 Georgia,serif}.fmb-time-story p{margin:8px 0 0;max-width:760px;font:15px/1.5 Arial,sans-serif;color:#555}@media(max-width:700px){.fmb-chronology-head{grid-template-columns:1fr}.fmb-chronology-head span{margin-top:5px}.fmb-time-story>a{grid-template-columns:1fr}.fmb-time-story img{max-height:220px}.fmb-day-group>h3{top:56px}}
</style>`;

for (const landingPath of landingPaths) {
  let html;
  try { html = await readFile(landingPath, 'utf8'); } catch { continue; }
  html = html.replace(/<style\b[^>]*data-fmb-chronology-final[^>]*>[\s\S]*?<\/style>\s*/gi, '');
  html = html.replace(/<section\b[^>]*data-fmb-chronology-final[^>]*>[\s\S]*?<\/section>\s*/gi, '');
  html = html.replace(/\sid=["']rundown["']/gi, '');
  html = html.replace(/<\/head>/i, `${css}</head>`);
  if (/class=["'][^"']*fn7-intro[^"']*["']/.test(html)) {
    html = html.replace(/(<section\b[^>]*class=["'][^"']*fn7-intro[^"']*["'][^>]*>[\s\S]*?<\/section>)/i, `$1${chronology}`);
  } else {
    html = html.replace(/<main\b([^>]*)>/i, m => `${m}${chronology}`);
  }
  await writeFile(landingPath, html, 'utf8');
}

console.log(`FMB News chronology finalized: ${stories.length} stories, ${groups.size} dates, newest first in PHT.`);
