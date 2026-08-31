import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsRoot = path.join(root, 'dist', 'news');
const contentRoot = path.join(root, 'content', 'news', 'articles');

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

async function walk(dir, predicate = () => true) {
  const out = [];
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(target, predicate));
    else if (entry.isFile() && predicate(target)) out.push(target);
  }
  return out;
}

async function latestStories() {
  const files = await walk(contentRoot, (target) => target.endsWith('.json'));
  const stories = [];
  for (const file of files) {
    try {
      const story = JSON.parse(await readFile(file, 'utf8'));
      if (story.status === 'published' && story.slug && story.headline && story.publishedAt) stories.push(story);
    } catch {}
  }
  return stories.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 8);
}

function ticker(stories) {
  const run = stories.map((story, index) => {
    const dot = index < stories.length - 1 ? '<span class="ticker-dot" aria-hidden="true">◆</span>' : '';
    return `<a href="/news/${esc(story.slug)}/"><span class="ticker-headline">${esc(story.headline)}</span></a>${dot}`;
  }).join('');

  return `<div class="headline-ticker" role="region" aria-label="Latest FMB News headlines"><div class="ticker-clock" aria-label="Philippine Standard Time"><span data-pht-clock>--:--</span><small>PHT</small></div><div class="ticker-label"><span class="ticker-pulse" aria-hidden="true"></span>LATEST</div><div class="ticker-window"><div class="ticker-track"><div class="ticker-run">${run}</div><div class="ticker-run" aria-hidden="true">${run}</div></div></div></div>`;
}

function utility() {
  return `<div class="utility"><div class="shell"><span><span data-pht-date></span></span><span class="utility-context">Philippine Standard Time · Information with Purpose.</span></div></div>`;
}

function clockScript() {
  return `<script data-fmb-network-clock>(()=>{const d=document.querySelector('[data-pht-date]'),t=document.querySelector('[data-pht-clock]');const tick=()=>{const n=new Date();if(d)d.textContent=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(n);if(t)t.textContent=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true}).format(n)};tick();setInterval(tick,1000)})();</script>`;
}

function ensureTickerStyles(html) {
  if (html.includes('/assets/css/fmb-news-ticker-hardfix.css')) return html;
  return html.replace('</head>', '<link rel="stylesheet" href="/assets/css/fmb-news-ticker-hardfix.css?v=20260831-ticker-hardfix"></head>');
}

function replaceTickerRegion(html, stories) {
  const start = html.indexOf('<div class="headline-ticker"');
  const mast = html.indexOf('<header class="mast">', start);
  if (start < 0 || mast < 0) return html;
  return `${html.slice(0, start)}${ticker(stories)}${utility()}${html.slice(mast)}`;
}

function normalizeClockScripts(html) {
  let out = html;
  out = out.replace(/<script data-fmb-network-clock>[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script>\(\(\)=>\{const d=document\.querySelector\('\[data-pht-date\]'\),t=document\.querySelector\('\[data-pht-clock\]'\);[\s\S]*?<\/script>/gi, '');
  return out.replace('</body>', `${clockScript()}</body>`);
}

const stories = await latestStories();
const pages = await walk(newsRoot, (target) => target.endsWith('.html'));
let changed = 0;

for (const page of pages) {
  let html = await readFile(page, 'utf8');
  const before = html;
  html = ensureTickerStyles(html);
  html = replaceTickerRegion(html, stories);
  html = normalizeClockScripts(html);
  if (html !== before) {
    await writeFile(page, html, 'utf8');
    changed += 1;
  }
}

console.log(`FMB ticker hard fix applied to ${changed} built HTML pages: one fixed PHT clock, one clock process, no moving-story timestamps, unified editorial headline typography.`);
