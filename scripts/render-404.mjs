// The page a reader gets when a /news/ URL does not resolve.
//
// wrangler.jsonc sets "not_found_handling": "404-page", which makes Cloudflare
// serve /404.html from the assets directory whenever ASSETS cannot match a
// path. dist/404.html did not exist, so every mistyped, moved or expired FMB
// News URL -- and every stale link from search or social -- landed on
// Cloudflare's default plain-text 404 with no masthead, no navigation and no
// way back into the publication.
//
// SELF-CONTAINED ON PURPOSE. Every other page loads the content-hashed
// stylesheets, which is right for them and wrong for this one. This file sits
// at the ROOT of dist rather than under dist/news/, so the later passes that
// walk dist/news and rewrite asset paths never touch it; a hashed href written
// here would go stale the first time a stylesheet changed, and the failure mode
// would be an unstyled error page that nobody looks at until a reader hits it.
// Inlining the styling costs about 3 KB and cannot break.
//
// It declares noindex: a 404 is not a page anyone should reach from search.

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(root, 'dist');

const DESKS = [
  ['/news/', 'Home', 'The current front page'],
  ['/news/world/', 'FMB Worldwide', 'International reporting'],
  ['/news/sports/', 'FMB Sports', 'Philippine and world sport'],
  ['/news/fmb-brief/', 'FMB Daily Brief', 'The day in short'],
  ['/news/fact-check/', 'FMB Fact Check', 'Claims checked against records'],
  ['/news/explainer/', 'FMB Explainer', 'Context and background'],
  ['/news/archive/', 'Archive', 'Everything FMB News has published'],
  ['/news/search/', 'Search', 'Find a story by claim, person or issue'],
];

const page = `<!doctype html>
<html lang="en-PH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Page not found | FMB News</title>
<meta name="description" content="This FMB News address does not resolve. Browse the current front page, the editorial desks or the archive.">
<meta name="robots" content="noindex,follow">
<link rel="icon" type="image/svg+xml" href="/news/assets/images/brand/fmb-bulletin-emblem.svg">
<style>
:root{--ink:#141414;--paper:#F5F3EF;--red:#D71920;--muted:#6D7072;--rule:rgba(20,20,20,.16);--card:#fff}
@media(prefers-color-scheme:dark){:root{--ink:#F5F3EF;--paper:#0A0A0A;--red:#F53A3F;--muted:#c8c4bd;--rule:rgba(255,255,255,.14);--card:rgba(255,255,255,.05)}}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--paper);color:var(--ink);overflow-x:clip}
body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Inter,Helvetica,Arial,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{width:min(760px,calc(100% - 32px));margin:0 auto;padding:56px 0 72px}
.mast{display:block;font-family:Newsreader,"Bodoni Moda",Georgia,"Times New Roman",serif;font-size:clamp(30px,8vw,44px);font-weight:700;letter-spacing:-.045em;color:var(--ink);text-decoration:none;line-height:1}
.mast span{color:var(--red)}
.sub{margin:8px 0 0;font-size:10.5px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
hr{border:0;border-top:1px solid var(--rule);margin:26px 0 30px}
h1{margin:0 0 12px;font-family:Newsreader,"Bodoni Moda",Georgia,serif;font-size:clamp(30px,7vw,46px);line-height:1.04;letter-spacing:-.04em;font-weight:700}
.lede{margin:0 0 6px;font-size:17px;color:var(--ink)}
.note{margin:0 0 30px;font-size:14.5px;color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:10px;margin:0 0 30px}
a.card{display:block;padding:15px 16px;border:1px solid var(--rule);border-radius:14px;background:var(--card);text-decoration:none;color:inherit}
a.card:hover,a.card:focus-visible{border-color:var(--red)}
a.card b{display:block;font-size:15px;font-weight:750;letter-spacing:-.012em}
a.card span{display:block;margin-top:3px;font-size:12.5px;color:var(--muted)}
.foot{font-size:12.5px;color:var(--muted);border-top:1px solid var(--rule);padding-top:18px}
.foot a{color:var(--ink)}
:focus-visible{outline:2px solid var(--red);outline-offset:3px}
@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
</head>
<body>
<main class="wrap">
  <a class="mast" href="/news/">FMB NEWS<span>.</span></a>
  <p class="sub">Filipino Media Bulletin</p>
  <hr>
  <h1>That page is not here.</h1>
  <p class="lede">The address you followed does not match anything FMB News publishes.</p>
  <p class="note">It may have been mistyped, or the link may be older than the story it pointed to. Nothing has been removed from the archive &mdash; published FMB News reports keep their address.</p>
  <div class="grid">
${DESKS.map(([href, name, blurb]) => `    <a class="card" href="${href}"><b>${name}</b><span>${blurb}</span></a>`).join('\n')}
  </div>
  <p class="foot">If you reached this from a link on FMB News, please <a href="/news/submit/">tell the newsroom</a> so it can be corrected. &copy; 2026 Filipino Media Bulletin.</p>
</main>
</body>
</html>
`;

await mkdir(distRoot, { recursive: true });
await writeFile(path.join(distRoot, '404.html'), page, 'utf8');
console.log(`Custom 404 page rendered at dist/404.html with ${DESKS.length} recovery destinations; Cloudflare serves it for any unresolved /news/ address.`);
