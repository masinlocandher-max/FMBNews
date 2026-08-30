import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const sitemapPath = path.join(root, 'dist', 'sitemap.xml');
const published = '2026-08-11T08:38:00+08:00';
const publishedLabel = '11 August 2026, 8:38 a.m. PHT';
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

const slug = 'multifaceted-impact-all-purpose-kween-yasmin-filipino-digital-culture';
const title = 'The Multifaceted Impact of the All-Purpose Kween: Understanding Kween Yasmin’s Place in Filipino Digital Culture';
const deck = 'A cultural study of how Kween Yasmin turned recognizability, humor, everyday relatability, romance, small-business hustle and internet participation into a distinctly Filipino form of digital celebrity.';
const description = 'FMB News examines Kween Yasmin as a Filipino digital-cultural figure through participatory celebrity, meme circulation, parasocial familiarity, class, creator entrepreneurship, commercial crossover and internet longevity.';
const hero = '/assets/images/fmbnews/kween-yasmin-multifaceted-impact.jpeg';

const sections = [
  ['Ano nga ba talaga ang meron kay Kween Yasmin?', [
    'Singer. Content creator. Poet. Actress. Endorser. Mango graham entrepreneur. At, apparently, may recurring genre pa ang love life niya involving security guards. Madaling gawing punchline ang listahang iyon. Pero kapag pinag-aralan nang mas seryoso, may mas malaking kuwento sa likod nito.',
    'Kween Yasmin, whose real name is Yasmin Marie Asistido, has built a public identity that moves easily between performance, humor, meme culture, television, brand work and everyday life. That flexibility is not a side effect of her fame. It is the structure of it.',
    'So the question is not simply why she became viral. The more useful question is: what makes Kween Yasmin a Kween, and why has she lasted when so many viral personalities disappear after one meme cycle?'
  ]],
  ['1. The Kween Who Was Crowned by the Internet', [
    'Traditional celebrities usually need gatekeepers. May network, manager, casting director, record label, pageant organization, or some institution saying: this person deserves your attention.',
    'Kween Yasmin represents another route. The audience itself can create cultural importance. People watched, shared, quoted, reacted, remixed and kept her in circulation until her name became recognizable even outside her own pages.',
    'That is one of the clearest features of digital celebrity: the audience does not only consume the personality. The audience helps manufacture the personality. Walang official coronation, but there was a collective one.'
  ]],
  ['2. Her Real Talent May Be Recognizability', [
    'This sounds like a joke, but it is actually central to her impact. Kween Yasmin is unmistakable. The delivery, confidence, facial expressions, poses, phrasing and unpredictability all create a strong distinctive identity.',
    'In an attention economy crowded with polished creators, recognizability can matter as much as technical excellence. A person can be very skilled and still disappear into sameness. Kween Yasmin became difficult to confuse with anyone else.',
    'That is why “Esophagus, Esophagus” could travel beyond one performance and become a shared reference. The point is not that one anatomical word changed Philippine culture. The point is that repetition, recognition and audience reuse can turn even an absurd moment into digital vocabulary.'
  ]],
  ['3. The All-Purpose Part Is Actually Important', [
    'The “All-Purpose Kween” title works because she refuses to stay inside one category. She sings, performs, appears on television, joins campaigns, collaborates, trends, becomes a meme, and then moves into something else.',
    'Hindi ito traditional triple-threat versatility. Mas malapit siya sa: may activity? Sali tayo. And that adaptability is part of the brand.',
    'Her 2025 Canva Philippines collaboration made this especially visible. Her image, expressions and persona were turned into reusable creative assets, transforming internet recognizability into commercial design language. A person became a meme, the meme became an aesthetic, and the aesthetic became a tool other people could use.'
  ]],
  ['4. And Then There’s the Mango Graham', [
    'Yes, we need to study the mango graham. Because if this is a study of the All-Purpose Kween, hindi puwedeng puro internet theory.',
    'Kween Yasmin publicly sold “Kween of Mango Graham Special,” posting batches, customer thanks and business updates through her own social channels. On the surface, dessert lang. But culturally, it reflects a very Filipino form of creator entrepreneurship: may audience, may produkto, may orders, may repeat customers, may “thank you po sa support.”',
    'No startup jargon. No “disrupting the dessert ecosystem.” Just mango graham and business. It shows how digital visibility can become livelihood. Some creators launch beauty lines. Some sell courses. Kween Yasmin sold mango graham. Extremely local. Extremely understandable. Extremely on-brand.'
  ]],
  ['5. The Security Guard Cinematic Universe', [
    'Her love life is another piece of the public ecosystem. In a 2024 interview with Luis Manzano, Yasmin discussed a former boyfriend who worked as a security guard and said she ended that relationship after discovering that he already had a family. She also talked about another former boyfriend whom she left after, according to her account, he expected her to shoulder transportation and food expenses during dates.',
    'Yes, very teleserye. But this is analytically useful because it helps explain her relatability. Traditional celebrity romance is often packaged as fantasy. Kween Yasmin’s stories feel more like something a friend would tell you over merienda: may kilig, may red flag, may breakup, may “ako pa gagastos?” and may next.',
    'That creates parasocial familiarity. People are not only following content. They are following a character arc. “Ano na naman nangyari kay Yasmin?” becomes part of audience retention.'
  ]],
  ['6. There Is Also a Class Dimension', [
    'Part of what makes Kween Yasmin feel different from traditional celebrity is that her public life is often not packaged as elite. Small business. Ordinary dating. Self-produced content. Everyday language. Unpolished performance.',
    'She does not primarily sell the fantasy, “I live a life you wish you had.” Much of her appeal is closer to, “You probably know someone like me.” Traditional fame often depends on distance. Digital fame often depends on proximity.',
    'That makes her culturally legible to audiences who do not see themselves reflected in polished celebrity culture.'
  ]],
  ['7. But We Also Need to Talk About How Filipinos Treat Her', [
    'Kween Yasmin is loved, but she is also mocked. Sometimes both things happen in the same comment section. That contradiction is worth studying because Filipino internet culture has a habit of turning ordinary people into collective entertainment, sometimes lovingly and sometimes cruelly.',
    'Laughing with someone is different from treating a person as inherently laughable. Once a person becomes a meme, audiences can forget that the meme contains an actual human being.',
    'Kween Yasmin therefore reveals something uncomfortable about digital spectatorship. We celebrate authenticity, but we also punish people for being too authentic. We say “be yourself,” then react with “ay, bakit ganiyan?” when somebody actually does.'
  ]],
  ['8. Her Persistence Is Part of the Cultural Impact', [
    'One of her most underestimated characteristics is endurance. The internet is very good at embarrassing people. One awkward clip can make someone disappear. Kween Yasmin keeps participating.',
    'Another video. Another song. Another appearance. Another relationship update. Another business batch. Another campaign.',
    'Shame is one of the internet’s strongest mechanisms of social control. But what happens when someone absorbs the embarrassment and keeps going? Eventually, embarrassing becomes recognizable. Recognizable becomes memorable. Memorable can become marketable.'
  ]],
  ['9. The Commercialization of Kween Culture', [
    'The Canva collaboration is one of the strongest signs that Kween Yasmin moved beyond fleeting virality. Her image became sufficiently recognizable to function as design language and creative material that users could remix again.',
    'That creates a cultural feedback loop: Yasmin creates content. People create Yasmin content. A brand creates tools for people to create more Yasmin content.',
    'Very 2020s. And actually quite sophisticated from a media-studies perspective.'
  ]],
  ['10. So What Makes Her a Kween?', [
    'Not traditional prestige. Not institutional authority. Not perfection. And not merely virality.',
    'Her cultural power seems to come from a combination of recognizability, willingness to perform, adaptability, openness, ordinariness, unpredictability, persistence and an unusual ability to generate moments that people want to reuse.',
    'That combination is difficult to manufacture. You can buy advertising, but genuine cultural recognizability still needs participation from people.'
  ]],
  ['11. Maybe “All-Purpose Kween” Is Actually a Very Accurate Cultural Description', [
    'Singer? Yes. Internet celebrity? Yes. Television personality? Yes. Meme? Obviously. Spoken-word icon because of one unexpectedly famous anatomical organ? Unfortunately for the esophagus, yes. Girlfriend with public romantic plotlines involving security guards? Yes. Small entrepreneur selling mango graham? Also yes. Commercial creative asset? Now apparently yes too.',
    'The humor is easy to see. Beneath it is a very contemporary Filipino story about social media, participatory humor, ordinary aspiration, entrepreneurship, celebrity culture and the Filipino instinct to turn almost everything into a shared reference.',
    'There are many queens. But culturally speaking, there is only one person who could make security guards, esophagus, Canva fonts and mango graham belong in the same serious media study and somehow make the study make sense.'
  ]]
];

const sources = [
  ['GMA Entertainment, Kween Yasmin on her past love life', 'https://www.gmanetwork.com/entertainment/showbiznews/kween-yasmin-may-inamin-kay-luis-manzano-tungkol-sa-past-love-life/111481/'],
  ['GMA News Online, Kween Yasmin and the Canva All-Purpose Kween design assets', 'https://www.gmanetwork.com/news/lifestyle/hobbiesandactivities/967779/what-s-with-the-kween-yasmin-font-here-s-where-it-came-from-and-how-you-can-use-it/story/'],
  ['ABS-CBN Lifestyle, Canva x Kween Yasmin All-Purpose Kween creative packs', 'https://www.abs-cbn.com/lifestyle/people-culture-events/2025/11/28/netizens-hop-on-canva-x-kween-yasmin-s-allpurposekween-creative-packs-1712'],
  ['GMA Entertainment, Kween Yasmin, virality and business opportunities', 'https://www.gmanetwork.com/entertainment/tv/trggrd/262563/trggrd-the-rise-of-kween-yasmin-diwata-and-their-virality-turning-into-a-business-opportunity/video'],
  ['Kween Yasmin official Facebook post, Kween of Mango Graham Special', 'https://www.facebook.com/www.facebookyasminasistido.090/posts/for-the-batch-4-on-my-business-kween-of-mango-graham-special-thanks-so-much-ever/1159521022208570/']
];

const articleHtml = `<!doctype html>
<html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | FMB News</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="https://www.francinemariebautista.com/news/${slug}/">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="https://www.francinemariebautista.com${hero}"><meta property="article:published_time" content="${published}">
<style>body{margin:0;font-family:Georgia,serif;background:#fff;color:#17121f;line-height:1.75}main{max-width:920px;margin:auto;padding:28px 20px 80px}.kicker{font:700 12px/1.2 Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#5a2a83}.hero{width:100%;border-radius:24px;margin:20px 0 12px}h1{font-size:clamp(40px,7vw,78px);line-height:.95;margin:18px 0}.deck{font-size:22px;color:#51485d}.meta{font:14px Arial,sans-serif;color:#756b7d;margin-bottom:26px}.credit{font:11px Arial,sans-serif;color:#756b7d}.article{font-size:20px}.article h2{font-size:34px;line-height:1.1;margin-top:52px}.article p{margin:18px 0}.sources{margin-top:54px;padding-top:24px;border-top:1px solid #ddd}.sources li{margin:8px 0}.sources a{color:#4b1f70}.fmbnote{margin-top:44px;padding:22px;border-radius:18px;background:#f6f1fa;font:16px/1.6 Arial,sans-serif}</style></head><body><main>
<div class="kicker">Culture · Digital Culture · Feature Essay</div><h1>${esc(title)}</h1><p class="deck">${esc(deck)}</p><div class="meta">FMB News · ${publishedLabel}</div>
<img class="hero" src="${hero}" width="1536" height="768" alt="The Multifaceted Impact of the All-Purpose Kween feature artwork featuring Kween Yasmin"><div class="credit">FMB NEWS FEATURE ARTWORK</div>
<div class="article">${sections.map(([h,ps])=>`<h2>${esc(h)}</h2>${ps.map(p=>`<p>${esc(p)}</p>`).join('')}`).join('')}</div>
<section class="sources"><h2>Sources and references</h2><ul>${sources.map(([label,url])=>`<li><a href="${url}" target="_blank" rel="noopener noreferrer">${esc(label)}</a></li>`).join('')}</ul></section>
<div class="fmbnote"><strong>FMB News cultural review:</strong> This feature distinguishes documented events from interpretation. Humor is used as part of the explainer style, not as a substitute for evidence.</div>
</main></body></html>`;

await mkdir(path.join(newsRoot, slug), {recursive:true});
await writeFile(path.join(newsRoot, slug, 'index.html'), articleHtml, 'utf8');

try {
  let landing = await readFile(landingPath, 'utf8');
  const card = `<article class="news-card" data-fmb-kween-yasmin><a href="/news/${slug}/"><img src="${hero}" width="1536" height="768" alt="Kween Yasmin cultural feature"><div><span>Culture · Feature Essay</span><h3>${esc(title)}</h3><p>${esc(deck)}</p></div></a></article>`;
  if (!landing.includes(`data-fmb-kween-yasmin`)) {
    const marker = /(<main[^>]*>)/i;
    landing = marker.test(landing) ? landing.replace(marker, `$1${card}`) : `${card}${landing}`;
    await writeFile(landingPath, landing, 'utf8');
  }
} catch {}

try {
  let sitemap = await readFile(sitemapPath, 'utf8');
  const url = `https://www.francinemariebautista.com/news/${slug}/`;
  if (!sitemap.includes(url)) sitemap = sitemap.replace('</urlset>', `<url><loc>${url}</loc><lastmod>2026-08-11</lastmod></url></urlset>`);
  await writeFile(sitemapPath, sitemap, 'utf8');
} catch {}

console.log(`Published FMB News feature: /news/${slug}/`);
