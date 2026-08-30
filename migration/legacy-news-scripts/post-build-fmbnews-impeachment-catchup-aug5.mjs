import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const published = '2026-08-05T08:55:00+08:00';
const image = '/assets/images/news/pbbm-sona-2026-analysis.svg';

const stories = [
  {
    slug: 'john-mark-calilung-authenticates-threat-video-sara-duterte-trial',
    eventDate: '2026-07-08T17:19:00+08:00',
    dateLabel: '8 July 2026',
    title: 'Calilung Authenticates Duterte Threat Video as Defense Tests NBI Probe',
    deck: 'The prosecution’s first witness established how the NBI preserved and examined the recording, while the defense challenged the absence of a complainant, the conditional wording and the investigation’s legal foundation.',
    meta: 'NBI senior agent John Mark Calilung authenticated the recording at the center of Article IV in Sara Duterte’s impeachment trial as the defense challenged the probe during cross-examination.',
    body: [
      ['The first witness and the recording', 'National Bureau of Investigation senior agent John Mark Calilung became the first prosecution witness on Article IV of the impeachment case against Vice President Sara Duterte. The article concerns Duterte’s statements during a November 2024 online press briefing in which she said she had instructed a person to kill President Ferdinand Marcos Jr., First Lady Liza Araneta-Marcos and then House Speaker Martin Romualdez if she herself were killed. Calilung told the Senate impeachment court that the NBI collected and preserved copies of the recording and examined them as part of its threat investigation. His testimony was offered to establish that the material shown by prosecutors was an authentic copy of the publicly circulated video, not a fabricated clip created for the trial.'],
      ['What the prosecution tried to establish', 'Prosecutors used Calilung to lay the technical and investigative foundation for the digital evidence. They argued that the recording had been identified, preserved and examined through the bureau’s procedures and that the statement could be investigated even without a formal complaint from the officials named. The prosecution’s position was that threats against the country’s highest officials involve public security and can trigger government action on their own. This was an evidentiary step, not yet a finding that Duterte committed an impeachable offense.'],
      ['How the defense challenged him', 'During cross-examination, defense counsel Carlo Narvasa questioned the chain of custody, the lack of a direct complainant and whether the wording described a completed threat or a conditional response to a feared attack. The defense pressed the distinction because Article IV does not turn only on whether the words were spoken. The senator-judges must eventually decide what those words meant, whether they demonstrated a genuine threat and whether the conduct rose to the constitutional level required for conviction.'],
      ['What remained unresolved', 'Calilung could authenticate and describe the investigation, but he could not by himself settle the central legal and factual disputes. Authentication establishes that a recording is what a party claims it to be. It does not automatically prove the intent behind every statement, identify the person Duterte said she contacted or establish that an assassination plan existed. Those questions remained for later witnesses, the defense and the senator-judges.'],
      ['Why It Matters to Us, Filipinos', 'The hearing showed why impeachment trials must be built in public, one piece of evidence at a time. Filipinos are entitled to examine both the seriousness of statements made by powerful officials and the reliability of the process used to judge them. A public official’s words can carry security consequences, but accountability also requires evidence that survives careful questioning. The country gains nothing from treating an allegation as a conviction, or from dismissing documented statements without examination.'],
      ['What happens next', 'The prosecution called additional NBI officials to reinforce the authentication, explain the bureau’s investigative process and present the conclusions reached by its leadership. The defense retained the right to challenge every document, inference and opinion offered under Article IV.']
    ],
    sources: [
      ['Philippine News Agency, 8 July 2026','https://www.pna.gov.ph/index.php/articles/1278998'],
      ['Philippine News Agency photo record, 8 July 2026','https://www.pna.gov.ph/photos/83767'],
      ['House prosecution statement, 9 July 2026','https://congress.gov.ph/index.php/media/press-releases/9893']
    ]
  },
  {
    slug: 'jeremy-lotoc-testimony-document-errors-sara-duterte-impeachment',
    eventDate: '2026-07-14T18:46:00+08:00',
    dateLabel: '14 July 2026',
    title: 'Lotoc Defends NBI Findings as Defense Raises Errors in Impeachment Records',
    deck: 'Jeremy Lotoc said clerical discrepancies did not alter the underlying video or the bureau’s findings, while the defense argued that document integrity matters in a trial carrying constitutional consequences.',
    meta: 'NBI regional director Jeremy Lotoc defended the bureau’s findings during Sara Duterte’s impeachment trial as the defense highlighted typographical and docket discrepancies.',
    body: [
      ['A second witness takes the stand', 'National Bureau of Investigation regional director Jeremy Lotoc testified as the prosecution’s second witness on the alleged-threat article. A former head of the NBI Cybercrime Division, Lotoc described the stages used to handle the Duterte recording: identifying and preserving digital material, collecting and hashing files, examining their contents and evaluating possible legal action. His testimony was intended to reinforce the foundation laid by senior agent John Mark Calilung.'],
      ['The defense focuses on the paperwork', 'The defense drew attention to typographical errors, inconsistent docket details and other discrepancies in documents connected to the investigation. This was not a trivial line of questioning. In any proceeding involving digital evidence, the paperwork surrounding collection, transmission and examination helps establish that the material remained identifiable and reliable. The defense argued that errors could weaken confidence in the process and in the conclusions prosecutors wanted the court to draw.'],
      ['Lotoc’s answer', 'Lotoc acknowledged clerical imperfections but maintained that they did not alter the recording, the files examined or the NBI’s essential findings. The prosecution later described his testimony as corroboration of Calilung’s account. That was the prosecution’s assessment, not a ruling by the impeachment court. The senator-judges still had to determine how much weight to give the testimony and whether the identified discrepancies were harmless mistakes or signs of a deeper reliability problem.'],
      ['The wider meaning of the exchange', 'The hearing exposed two different ways of understanding evidence. Prosecutors emphasized the substance: a public recording, a documented investigation and witnesses who said the material was authentic. The defense emphasized the safeguards: exact records, consistent identifiers and a process that must be strong enough for a constitutional trial. Both questions are legitimate. Evidence can be highly important and still require strict scrutiny.'],
      ['Why It Matters to Us, Filipinos', 'Public accountability does not become stronger when procedural weaknesses are ignored. It becomes stronger when important evidence can withstand detailed inspection. The defense had the right to challenge the NBI’s records, while prosecutors had the responsibility to explain why the mistakes did or did not affect reliability. For Filipinos, the real public interest is not in giving either side an easy victory. It is in a verdict that can be understood and defended after the political noise fades.'],
      ['What happens next', 'After Lotoc’s testimony, prosecutors narrowed their Article IV witness list and prepared to call NBI Director Melvin Matibag. The court would then hear the bureau leadership’s assessment and the defense’s objections to the opinions and information he relied upon.']
    ],
    sources: [
      ['Philippine News Agency photo record, 13 July 2026','https://www.pna.gov.ph/photos/83831'],
      ['Philippine News Agency photo record, 14 July 2026','https://www.pna.gov.ph/photos/83853'],
      ['House prosecution statement, 14 July 2026','https://congress.gov.ph/media/press-releases/9903']
    ]
  },
  {
    slug: 'melvin-matibag-final-witness-article-four-sara-duterte-trial',
    eventDate: '2026-07-22T19:24:00+08:00',
    dateLabel: '22 July 2026',
    title: 'Matibag Faces Hearsay Challenge as Prosecution Closes Article IV Evidence',
    deck: 'The NBI director was the third and final prosecution witness on the alleged-threat charge, ending one phase of the trial without resolving the central disputes over intent, corroboration and legal weight.',
    meta: 'NBI Director Melvin Matibag completed his testimony in Sara Duterte’s impeachment trial as the defense challenged portions of his evidence and prosecutors rested Article IV.',
    body: [
      ['The final prosecution witness', 'National Bureau of Investigation Director Melvin Matibag testified as the third and final prosecution witness on Article IV. He described the bureau’s continuing assessment of Vice President Sara Duterte’s public statements and said investigators were certain that she had contacted someone in connection with the alleged plan she described. At the same time, the NBI had not publicly identified that person. Matibag also referred to other publicly available material that the bureau considered in assessing what he described as a pattern relevant to the threat investigation.'],
      ['The defense objects to hearsay and inference', 'The defense challenged portions of Matibag’s testimony as hearsay and questioned whether conclusions drawn from public reports or information gathered by other investigators could establish the truth of the underlying claims. That objection went to the difference between explaining why an agency acted and proving that the alleged conduct actually occurred. An investigator may describe an assessment, but the court must still decide which parts are admissible and how much evidentiary weight they deserve.'],
      ['What the prosecution said it had proved', 'After cross-examination, the House prosecution ended its presentation on Article IV. Prosecutors said the combined testimony of Calilung, Lotoc and Matibag authenticated the recording, explained the NBI process and demonstrated the seriousness with which the bureau treated Duterte’s statements. They argued that the evidence was sufficient to require an answer from the defense. That claim did not shift the constitutional duty of the senator-judges, and it was not itself a judgment that the article had been proved.'],
      ['What the hearings did and did not establish', 'The three witnesses created a record showing that the recording existed, that the NBI examined it and that bureau officials considered the statements serious. Still unresolved were Duterte’s intent, the identity and role of the person she allegedly contacted, whether a real operational plan existed and whether the conduct constituted betrayal of public trust or another impeachable offense. The defense was entitled to present evidence and alternative interpretations before the court reached any conclusion.'],
      ['Why It Matters to Us, Filipinos', 'Article IV tested more than one controversial statement. It tested how the country responds when the language of a senior official appears to invoke political violence. The state cannot casually dismiss such language, especially when it names public officials and refers to killing. But a constitutional trial must also resist turning agency opinion into automatic proof. Filipinos deserve a process that is serious about threats, careful with evidence and honest about what remains uncertain.'],
      ['What happens next', 'With the prosecution resting Article IV, attention moved toward the remaining impeachment articles, financial records and proposed changes to the order of presentation. The defense would later have the opportunity to answer the alleged-threat charge and challenge the prosecution’s theory as a whole.']
    ],
    sources: [
      ['Philippine News Agency, 21 July 2026','https://www.pna.gov.ph/index.php/articles/1279961'],
      ['Philippine News Agency photo record, 22 July 2026','https://www.pna.gov.ph/photos/83979'],
      ['House prosecution statement, 22 July 2026','https://congress.gov.ph/media/press-releases/9935']
    ]
  }
];

const esc = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function page(story) {
  const canonical = `https://www.francinemariebautista.com/news/${story.slug}/`;
  const sections = story.body.map(([h,p]) => `<section><h2>${esc(h)}</h2><p>${esc(p)}</p></section>`).join('\n');
  const sources = story.sources.map(([label,url]) => `<li><a href="${esc(url)}" rel="noopener noreferrer">${esc(label)}</a></li>`).join('');
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'NewsArticle',headline:story.title,description:story.meta,dateCreated:story.eventDate,datePublished:published,dateModified:published,image:[`https://www.francinemariebautista.com${image}`],author:{'@type':'Organization',name:'FMB News'},publisher:{'@type':'Organization',name:'FMB News'},mainEntityOfPage:canonical});
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(story.title)} | FMB News</title><meta name="description" content="${esc(story.meta)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(story.title)}"><meta property="og:description" content="${esc(story.deck)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://www.francinemariebautista.com${image}"><link rel="stylesheet" href="/assets/css/news-center-v2.css"><link rel="stylesheet" href="/assets/css/fmb-news-polish-v3.css"><link rel="stylesheet" href="/assets/css/fmb-news-channel-v4.css"><script type="application/ld+json">${schema}</script><style>.fmb-catchup{max-width:920px;margin:auto;padding:28px 20px 80px}.fmb-catchup h1{font-size:clamp(2.2rem,6vw,4.8rem);line-height:.98;margin:.35em 0}.fmb-catchup .deck{font-size:1.25rem;line-height:1.55}.fmb-catchup figure{margin:32px 0}.fmb-catchup img{width:100%;height:auto;border-radius:24px}.fmb-catchup figcaption,.fmb-catchup .dates{font-size:.86rem;opacity:.72}.fmb-catchup section{margin:34px 0}.fmb-catchup section p{font-family:Georgia,serif;font-size:1.12rem;line-height:1.82}.fmb-catchup h2{font-size:1.55rem}.fmb-catchup .kicker{letter-spacing:.13em;text-transform:uppercase;font-weight:800}.fmb-catchup .sources{border-top:1px solid #ccc;padding-top:24px}</style></head><body class="news-story-route newsroom-polish-v3 news-channel-v4"><main class="fmb-catchup"><a href="/news/">FMB News</a><p class="kicker">Impeachment Trial · Evidence Desk</p><h1>${esc(story.title)}</h1><p class="deck">${esc(story.deck)}</p><p class="dates">Event: ${story.dateLabel} · Published to the FMB News archive: 5 August 2026</p><figure><img src="${image}" width="1536" height="864" alt="FMB News Impeachment Trial series visual"><figcaption>FMB News editorial series visual. The user-supplied Impeachment Trial hero will replace this temporary production-safe visual in the next asset pass.</figcaption></figure>${sections}<section class="sources"><h2>Sources and documents</h2><ul>${sources}</ul></section><p><a href="/news/">Return to FMB News</a></p></main></body></html>`;
}

for (const story of stories) {
  const dir = path.join(newsRoot, story.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), page(story), 'utf8');
}

let landing = await readFile(landingPath, 'utf8');
const marker = '<div class="nc-rundown-head">';
if (!landing.includes(stories[0].slug) && landing.includes(marker)) {
  const cards = stories.map((s,i) => `<article class="nc-rundown-story"><a href="/news/${s.slug}/"><span class="nc-rundown-number">${String(i+1).padStart(2,'0')}</span><figure class="news-visual"><img src="${image}" width="1536" height="864" loading="lazy" decoding="async" alt="FMB News Impeachment Trial series visual"></figure><div><p>Impeachment Trial · ${s.dateLabel}</p><h3>${esc(s.title)}</h3><span>7 min read</span></div></a></article>`).join('');
  const headEnd = landing.indexOf('</div>', landing.indexOf(marker));
  const insertAt = landing.indexOf('</div>', headEnd + 6) + 6;
  landing = `${landing.slice(0, insertAt)}${cards}${landing.slice(insertAt)}`;
}
landing = landing.replace(/<time(?: data-news-updated)?>(?:Updated )?[^<]*<\/time>/, '<time data-news-updated>Updated 5 August 2026</time>');
await writeFile(landingPath, landing, 'utf8');
console.log(`Published ${stories.length} chronological FMB News impeachment hearing reports.`);
