import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const landingPath = path.join(repositoryRoot, 'dist', 'news', 'index.html');
const storyHref = '/news/marcos-authorizes-release-sara-duterte-tax-records/';

let html = await readFile(landingPath, 'utf8');

if (!html.includes(storyHref)) {
  const wireNeedle = '<div class="nc-wire-track">';
  if (html.includes(wireNeedle)) {
    html = html.replace(
      wireNeedle,
      `${wireNeedle}<span>Marcos authorizes the release of Sara Duterte’s tax records for the Senate impeachment trial</span>`,
    );
  } else {
    console.warn('FMB News tax-records feature: legacy news wire not present; the final feed renderer will add the story.');
  }

  const rundownNeedle = '<div class="nc-rundown-head">';
  if (html.includes(rundownNeedle)) {
    const rundownHeadEnd = html.indexOf('</div>', html.indexOf(rundownNeedle));
    const rundownInsertPoint = html.indexOf('</div>', rundownHeadEnd + 6) + 6;
    const card = `
        <article class="nc-rundown-story"><a href="${storyHref}"><span class="nc-rundown-number">NEW</span><figure class="news-visual"><img src="/assets/images/news/pbbm-sona-2026-analysis.svg" width="1536" height="864" loading="lazy" decoding="async" alt="FMB News editorial illustration representing Philippine public accountability"><figcaption>FMB News editorial illustration. Full sources appear in the report.</figcaption></figure><div><p>Philippines · Politics · Developing story</p><h3>Marcos authorizes release of Sara Duterte tax records</h3><span>5 min read</span></div></a></article>`;
    html = `${html.slice(0, rundownInsertPoint)}${card}${html.slice(rundownInsertPoint)}`;
  } else {
    console.warn('FMB News tax-records feature: legacy rundown not present; the final feed renderer will add the story.');
  }

  const listNeedle = '"itemListElement":[';
  if (html.includes(listNeedle)) {
    html = html.replace(
      listNeedle,
      `${listNeedle}\n        {"@type":"ListItem","position":1,"url":"https://www.francinemariebautista.com${storyHref}","name":"Marcos Authorizes Release of Sara Duterte Tax Records"},`,
    );

    html = html.replace(/"position":(\d+)/g, (match, value, offset) => {
      if (offset < html.indexOf(listNeedle)) return match;
      const number = Number(value);
      return number === 1 && html.slice(Math.max(0, offset - 180), offset).includes('marcos-authorizes')
        ? match
        : `"position":${number + 1}`;
    });
  } else {
    console.warn('FMB News tax-records feature: legacy structured list not present; the final feed renderer will rebuild it.');
  }
}

html = html.replace(/<time(?: data-news-updated)?>(?:Updated )?[^<]*<\/time>/, '<time data-news-updated>Updated 31 July 2026</time>');
await writeFile(landingPath, html, 'utf8');
console.log('Featured the Sara Duterte tax-records report on the FMB News Center homepage and structured story index.');
