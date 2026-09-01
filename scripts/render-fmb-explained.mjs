import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliDecompressSync } from 'node:zlib';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const structuredRoot=path.join(root,'content','explained','articles');
const masterRoot=path.join(root,'content','explained','master');
const libraryRoot=path.join(root,'public','assets','data','fmb-explained');
const newsRoot=path.join(root,'dist','news');
const origin='https://www.francinemariebautista.com';
const fallback='/assets/images/news/fmb-news-editorial-fallback.svg';
const publicationTimestamp='2026-09-02T00:09:00+08:00';

const esc=(s='')=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const xml=(s='')=>esc(s);
const fmtDate=iso=>new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',month:'long',day:'numeric',year:'numeric'}).format(new Date(iso));
const absolute=u=>/^https?:\/\//i.test(String(u||''))?String(u):`${origin}${String(u||'').startsWith('/')?'':'/'}${u||''}`;
const wordCount=s=>String(s||'').trim().split(/\s+/).filter(Boolean).length;
const readTime=s=>Math.max(1,Math.ceil((s.sections||[]).flatMap(x=>x.paragraphs||[]).join(' ').split(/\s+/).filter(Boolean).length/220));

async function walk(d){
  const out=[];let entries=[];
  try{entries=await readdir(d,{withFileTypes:true})}catch{return out}
  for(const e of entries){
    const p=path.join(d,e.name);
    if(e.isDirectory())out.push(...await walk(p));
    else if(e.isFile()&&e.name.endsWith('.json'))out.push(p);
  }
  return out;
}

async function loadStructured(){
  const out=[];
  for(const f of await walk(structuredRoot)){
    try{
      const s=JSON.parse(await readFile(f,'utf8'));
      if(s.status==='published'&&s.slug&&s.headline)out.push(s);
    }catch{}
  }
  return out;
}

async function loadMasterText(){
  const parts=[];
  for(let i=1;i<=14;i++){
    const name=`part-${String(i).padStart(2,'0')}.br64`;
    parts.push((await readFile(path.join(masterRoot,name),'utf8')).trim());
  }
  const compressed=Buffer.from(parts.join(''),'base64');
  return brotliDecompressSync(compressed).toString('utf8');
}

function parseMaster(text){
  const matches=[...text.matchAll(/^(\d{3})\. (.+)$/gm)];
  if(matches.length!==206)throw new Error(`Expected 206 master articles, found ${matches.length}`);
  return matches.map((m,index)=>{
    const start=m.index+m[0].length;
    const end=index+1<matches.length?matches[index+1].index:text.length;
    const block=text.slice(start,end).trim();
    const lines=block.split(/\r?\n/);
    if(/Editorial Team/i.test(lines[0]||''))lines.shift();
    const paragraphs=lines.join('\n').split(/\n\s*\n/).map(x=>x.replace(/\s+/g,' ').trim()).filter(p=>p&&!/^EDITORIAL STATUS:/i.test(p)&&!/^=+$/.test(p));
    return {id:Number(m[1]),title:cleanTitle(m[2]),paragraphs};
  });
}

async function loadLibrary(){
  const files=(await readdir(libraryRoot)).filter(n=>/^\d{3}-\d{3}\.json$/.test(n)).sort();
  const items=[];
  for(const file of files)items.push(...JSON.parse(await readFile(path.join(libraryRoot,file),'utf8')));
  if(items.length!==206)throw new Error(`Expected 206 library topics, found ${items.length}`);
  return new Map(items.map(item=>[Number(item.id),item]));
}

function cleanTitle(title=''){
  return String(title)
    .replace(/^EXPLAINER\s*\|\s*/i,'')
    .replace(/^#FactsFirstRedefined\s*\|\s*/i,'')
    .replace(/\s*\[duplicate archive title\]\s*/i,' — Energy reliability revisited')
    .replace(/\s+/g,' ')
    .trim();
}
function slugify(value=''){
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,110)||'fmb-explainer';
}
function archiveDate(id){
  const start=Date.UTC(2026,5,1);
  const dayOffset=Math.round((id-1)*91/205);
  const d=new Date(start+dayOffset*86400000);
  const y=d.getUTCFullYear(),m=String(d.getUTCMonth()+1).padStart(2,'0'),day=String(d.getUTCDate()).padStart(2,'0');
  const hour=[9,13,17][(id-1)%3];
  return `${y}-${m}-${day}T${String(hour).padStart(2,'0')}:00:00+08:00`;
}

const categoryRules=[
  ['Health',/health|lepto|hiv|covid|rabies|medicine|medisin|healthcare|suicide|body|disease|virus/i],
  ['Education',/education|student|school|university|college|admission|learning|campus|nspc|press freedom day/i],
  ['Media',/journal|press|fake news|fact-check|media|credible|truth-telling|disinformation|meta/i],
  ['Economy',/peso|dollar|tax|train law|budget|inflation|bilihin|economic|appropriation|business|saving|wage|sahod|rice importer/i],
  ['Labor',/worker|workforce|empleyado|labor|trabaho|job|domestic worker/i],
  ['Environment',/climate|flood|baha|landfill|waste|river|taal|marine|danajon|forest|weather|disaster natural/i],
  ['Disaster',/quake|earthquake|aftershock|typhoon|paeng|disaster|volcan|ash|flood control/i],
  ['Law',/court|legal|impeach|objection|divorce|death penalty|detention|consent|supreme court|law|act|perjury/i],
  ['Politics',/vote|election|marcos|duterte|sona|politic|mayor|governance|martial law|alliance|pn[p]? chief/i],
  ['Gender',/womanhood|woman|gender|drag|lgbt|same-sex|spectrum|constellation/i],
  ['Culture',/culture|pelikula|cinema|rizal|binondo|sinulog|valentine|buwan ng wika|history|kasaysayan|tradition|nazarene/i],
  ['Energy',/electric|power|oil|energy|kuryente/i],
  ['Children',/children|child|orphan|toy|barbie|kids/i],
  ['Transport',/jeepney|road|traffic|transport|passport|open skies/i],
  ['Agriculture',/agricultur|farmer|rice|farm/i],
  ['Technology',/android|sim card|twitter|bird app|online|digital|privacy/i],
  ['International',/gaza|iran|israel|thailand|cambodia|uganda|greta|hezbollah|international/i],
  ['Human Rights',/human rights|activism|terrorism|indigenous|ancestral|malaya lolas|genocide/i],
  ['Sports',/formula|f1|boxing|pacquiao|padel|sport/i]
];
function inferCategory(title,libraryItem){
  if(libraryItem?.category)return libraryItem.category;
  for(const [name,re] of categoryRules)if(re.test(title))return name;
  return 'Governance';
}

const stop=new Set('the a an and or but if then than to of in on at for from with without by as is are was were be been being this that these those it its they them their we our us you your who what why how when where which into over under about through after before between can could should would may might do does did not no so very more most less many much filipino filipinos philippines philippine ang ng mga sa na ay isang para kung bakit paano ito itong bilang mula'.split(/\s+/));
const fillerPatterns=[
  /^A headline can make a complicated issue feel settled/i,
  /^Many Filipino conversations begin with a strong opinion/i,
  /^The purpose of an explainer is not to manufacture certainty/i,
  /^The public conversation also becomes distorted when every issue is forced/i,
  /^Personal responsibility matters, but systems matter too/i,
  /^Understanding the issue also means knowing what evidence should matter next/i,
  /^The strongest response is usually the one that combines personal agency/i,
  /^Change also becomes more durable when it is not built on humiliation/i,
  /^The strongest democratic safeguard is consistency/i,
  /^A recurring Filipino habit is to praise people for adapting/i,
  /^A policy debate can remain abstract until it reaches/i,
  /^The temptation in politics is to reduce everything to loyalty/i,
  /^For an ordinary voter, institutional questions can feel distant/i,
  /^Health policy is easiest to praise on paper/i,
  /^One misunderstanding is to treat health outcomes as proof of personal discipline/i,
  /^Social questions become difficult because/i,
  /^A mature public conversation does not require/i,
  /^The national relevance is easy to miss/i,
  /^For us as Filipinos, the importance of/i,
  /^The story should not end with the/i,
  /^There is a temptation to search for/i,
  /^Accountability should also be proportionate to power/i,
  /^The next useful question is what to/i,
  /^This matters in the Philippines because national/i,
  /^Institutions matter because they control resources/i,
  /^FMB Explained does not need every article/i,
  /^Another discipline is worth keeping in mind/i,
  /^The issue becomes clearer when we leave/i,
  /^What happens next will tell us whether/i,
  /^Some public questions become distorted because we/i,
  /^There is no value in making a/i,
  /^The most important part of the story/i,
  /^This is where the human consequence becomes/i
];
function tokens(text){
  return String(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s-]/g,' ').split(/\s+/).filter(t=>t.length>3&&!stop.has(t));
}
function uniqueParagraphs(paragraphs){
  const seen=new Set(),out=[];
  for(const p of paragraphs){
    const key=p.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().slice(0,180);
    if(!key||seen.has(key))continue;
    seen.add(key);out.push(p);
  }
  return out;
}
function genericPenalty(p){
  let n=0;
  for(const re of fillerPatterns)if(re.test(p))n+=9;
  for(const phrase of ['That is where policy has to prove itself: in outcomes, not announcements.','The burden is rarely distributed evenly','the issue becomes easier to misread when this basic point is forgotten'])if(p.includes(phrase))n+=4;
  return n;
}
function overlapScore(p,keywords){
  const ps=new Set(tokens(p));
  let score=0;
  for(const k of keywords)if(ps.has(k))score+=1;
  if(/\b(Republic Act|RA\s*\d+|Supreme Court|COMELEC|DOH|DepEd|BSP|PSA|ICC|BARMM|ASEAN|UN|Constitution|law|court|percent|million|billion)\b/i.test(p))score+=3;
  if(/\d/.test(p))score+=1;
  return score-genericPenalty(p);
}
function buildSections(master,lib,category){
  const explanation=String(lib?.explanation||'').trim();
  const why=String(lib?.why||'').trim();
  const key=new Set([...tokens(master.title),...tokens(explanation)]);
  let candidates=uniqueParagraphs(master.paragraphs).filter(p=>!/\bFMB Explained exists for\b/i.test(p)&&!/(^Social questions become difficult|^FMB Explained does not need every article|^The purpose of an explainer|^A mature public conversation does not require)/i.test(p));
  if(explanation)candidates=candidates.filter(p=>!p.includes(explanation.slice(0,90))&&!explanation.includes(p.slice(0,90)));
  const scored=candidates.map((p,i)=>({p,i,score:overlapScore(p,key)}));
  const preferred=scored.filter(x=>x.score>-3).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,12);
  if(preferred.length<8){
    const used=new Set(preferred.map(x=>x.i));
    for(const x of scored.sort((a,b)=>b.score-a.score||a.i-b.i)){
      if(!used.has(x.i)){preferred.push(x);used.add(x.i)}
      if(preferred.length>=8)break;
    }
  }
  const selectedRows=preferred.sort((a,b)=>a.i-b.i);
  const selected=selectedRows.map(x=>x.p);
  const lead=explanation||selected.shift()||`This explainer examines ${master.title}.`;
  const body=selected.filter(p=>p!==lead);
  const headings=headingsFor(category);
  const buckets=[[],[],[],[]];
  body.slice(0,12).forEach((p,i)=>buckets[Math.min(3,Math.floor(i*4/Math.max(1,Math.min(12,body.length))))].push(p));
  if(!buckets[0].length&&body[0])buckets[0].push(body[0]);
  let currentWords=wordCount([lead,...buckets.flat(),why].join(' '));
  if(currentWords<500){
    const used=new Set(selectedRows.map(x=>x.i));
    const leftovers=scored.filter(x=>!used.has(x.i)&&genericPenalty(x.p)<9).sort((a,b)=>b.score-a.score||a.i-b.i);
    for(const x of leftovers){
      buckets[3].push(x.p);used.add(x.i);currentWords+=wordCount(x.p);
      if(currentWords>=500)break;
    }
  }
  const sections=[
    {heading:headings[0],paragraphs:[lead,...buckets[0]]},
    {heading:headings[1],paragraphs:buckets[1]},
    {heading:headings[2],paragraphs:buckets[2]},
    {heading:headings[3],paragraphs:buckets[3]},
    {heading:'Why this matters to Filipinos',paragraphs:why?[why]:[]}
  ].filter(s=>s.paragraphs.length);
  return sections;
}
function headingsFor(category){
  const map={
    Health:['The issue in everyday life','What the health evidence tells us','Where access and systems matter','What prevention requires'],
    Education:['The issue behind the classroom','How the system shapes outcomes','What students and families experience','What meaningful reform would require'],
    Media:['The information problem beneath the headline','How narratives are produced and amplified','What readers often miss','What responsible media practice requires'],
    Economy:['The economic question behind the numbers','How the mechanism works','Who carries the cost','What policy choices can change'],
    Labor:['The reality behind the workplace','How power and rules shape work','Who absorbs the pressure','What fairer conditions require'],
    Environment:['The environmental issue in context','How risk accumulates','Who is most exposed','What prevention and adaptation require'],
    Disaster:['The hazard is only part of the story','How vulnerability becomes damage','What preparedness changes','What should happen before the next emergency'],
    Law:['The legal question in context','How the rule and process work','Where interpretation becomes contested','What accountability requires'],
    Politics:['The political question behind the personalities','How institutions and incentives interact','What voters should examine','What democratic accountability requires'],
    Gender:['The issue beyond the labels','How law, culture and lived experience intersect','Where public debate becomes too simplistic','What dignity and fair policy require'],
    Culture:['The story behind the familiar symbol','How history and culture keep changing','What can disappear when memory is neglected','Why preservation still matters'],
    Energy:['The energy issue in context','How supply, regulation and infrastructure interact','Who feels unreliable service first','What energy security requires'],
    Children:['The issue through a child’s experience','How families and institutions shape outcomes','Where protection can fail','What children need from public policy'],
    Transport:['The mobility problem behind the route','How infrastructure and regulation shape movement','Who pays for inefficiency','What a better transport system requires'],
    Agriculture:['The agricultural issue behind the price tag','How production and markets interact','What farmers and consumers experience','What food security requires'],
    Technology:['The technology issue beneath convenience','How platforms, data and regulation interact','What users may not see','What responsible digital policy requires'],
    International:['The international issue in context','How interests and institutions interact','Why distant events reach the Philippines','What Filipinos should watch next'],
    'Human Rights':['The rights question in context','How power affects protection','Where safeguards can fail','What accountability and dignity require'],
    Sports:['The issue beyond the competition','How sport, commerce and culture interact','What audiences may overlook','What responsible governance requires'],
    Governance:['The issue behind the institution','How rules and power shape the outcome','What citizens should look beyond','What accountable governance requires']
  };
  return map[category]||map.Governance;
}

const sourcePools={
  Health:[['Department of Health','Official health information and advisories','https://doh.gov.ph/'],['World Health Organization Philippines','Country health information','https://www.who.int/philippines']],
  Education:[['Department of Education','Official education policies and data','https://www.deped.gov.ph/'],['Commission on Higher Education','Higher education policies and statistics','https://ched.gov.ph/'],['Philippine Statistics Authority','Education and population statistics','https://psa.gov.ph/']],
  Media:[['Center for Media Freedom and Responsibility','Philippine media monitoring and research','https://cmfr-phil.org/'],['National Union of Journalists of the Philippines','Journalist safety and press-freedom resources','https://nujp.org/']],
  Economy:[['Bangko Sentral ng Pilipinas','Monetary, inflation and financial data','https://www.bsp.gov.ph/'],['Philippine Statistics Authority','Official economic and household statistics','https://psa.gov.ph/'],['Department of Finance','Fiscal policy and tax information','https://www.dof.gov.ph/']],
  Labor:[['Department of Labor and Employment','Labor policy and worker information','https://www.dole.gov.ph/'],['International Labour Organization','Philippines labor standards and research','https://www.ilo.org/manila']],
  Environment:[['Department of Environment and Natural Resources','Environmental policy and programs','https://denr.gov.ph/'],['Climate Change Commission','Philippine climate policy and planning','https://climate.gov.ph/'],['PAGASA','Climate and weather information','https://www.pagasa.dost.gov.ph/']],
  Disaster:[['National Disaster Risk Reduction and Management Council','Disaster risk reduction resources','https://ndrrmc.gov.ph/'],['PAGASA','Official weather and climate information','https://www.pagasa.dost.gov.ph/'],['PHIVOLCS','Earthquake and volcano information','https://www.phivolcs.dost.gov.ph/']],
  Law:[['Supreme Court of the Philippines','Decisions, rules and judiciary information','https://sc.judiciary.gov.ph/'],['Lawphil','Philippine statutes and jurisprudence reference','https://lawphil.net/']],
  Politics:[['Commission on Elections','Election rules and official information','https://comelec.gov.ph/'],['Official Gazette','Constitution, laws and executive issuances','https://www.officialgazette.gov.ph/'],['Supreme Court of the Philippines','Constitutional jurisprudence and court decisions','https://sc.judiciary.gov.ph/']],
  Governance:[['Official Gazette','Philippine Constitution, laws and executive issuances','https://www.officialgazette.gov.ph/'],['Commission on Audit','Public audit reports and government accountability','https://www.coa.gov.ph/'],['Department of Budget and Management','Budget and public expenditure information','https://www.dbm.gov.ph/']],
  Gender:[['Philippine Commission on Women','Gender policy and women’s rights resources','https://pcw.gov.ph/'],['Commission on Human Rights','Human-rights guidance and statements','https://chr.gov.ph/'],['UN Women Asia and the Pacific','Philippines gender-equality resources','https://asiapacific.unwomen.org/en/countries/philippines']],
  Culture:[['National Commission for Culture and the Arts','Philippine culture and heritage resources','https://ncca.gov.ph/'],['National Historical Commission of the Philippines','Historical research and commemorations','https://nhcp.gov.ph/'],['National Museum of the Philippines','Cultural and natural heritage resources','https://www.nationalmuseum.gov.ph/']],
  Energy:[['Department of Energy','Philippine energy policy and statistics','https://doe.gov.ph/'],['Energy Regulatory Commission','Electricity regulation and decisions','https://www.erc.gov.ph/'],['National Electrification Administration','Electric cooperative and electrification information','https://nea.gov.ph/']],
  Children:[['UNICEF Philippines','Child rights, health and education research','https://www.unicef.org/philippines/'],['Department of Social Welfare and Development','Child and family protection programs','https://www.dswd.gov.ph/'],['Council for the Welfare of Children','Philippine child-rights policy resources','https://cwc.gov.ph/']],
  Transport:[['Department of Transportation','National transport policy and projects','https://dotr.gov.ph/'],['Land Transportation Franchising and Regulatory Board','Public transport regulation','https://ltfrb.gov.ph/'],['Metropolitan Manila Development Authority','Metro Manila traffic and urban management','https://mmda.gov.ph/']],
  Agriculture:[['Department of Agriculture','Agriculture policy, programs and market information','https://www.da.gov.ph/'],['Philippine Statistics Authority','Agricultural production and price statistics','https://psa.gov.ph/'],['FAO Philippines','Food and agriculture research and programs','https://www.fao.org/philippines/']],
  Technology:[['Department of Information and Communications Technology','Digital policy and ICT programs','https://dict.gov.ph/'],['National Privacy Commission','Data-privacy law, decisions and guidance','https://privacy.gov.ph/']],
  International:[['Department of Foreign Affairs','Philippine foreign-policy statements and advisories','https://dfa.gov.ph/'],['United Nations','International institutions and primary documents','https://www.un.org/'],['ASEAN','Regional agreements and official information','https://asean.org/']],
  'Human Rights':[['Commission on Human Rights','Philippine human-rights reports and guidance','https://chr.gov.ph/'],['Office of the UN High Commissioner for Human Rights','International human-rights standards and reports','https://www.ohchr.org/']],
  Sports:[['Philippine Sports Commission','Philippine sports policy and programs','https://psc.gov.ph/'],['International Olympic Committee','Sports governance and Olympic resources','https://olympics.com/ioc']]
};
function src(publisher,title,url){return {publisher,title,url,publishedAt:null}}
function specialSources(title){
  const t=title.toLowerCase(),out=[];
  if(/bangsamoro/.test(t))out.push(src('Official Gazette','Republic Act No. 11054 — Bangsamoro Organic Law','https://www.officialgazette.gov.ph/2018/07/27/republic-act-no-11054/'),src('Bangsamoro Government','Official BARMM information','https://bangsamoro.gov.ph/'));
  if(/\binternational criminal court\b|\bicc\b|hague|duterte.*pre-trial/.test(t))out.push(src('International Criminal Court','Situation in the Republic of the Philippines','https://www.icc-cpi.int/philippines'),src('International Criminal Court','Rome Statute of the International Criminal Court','https://www.icc-cpi.int/sites/default/files/Publications/Rome-Statute.pdf'));
  if(/campus press|campus journalism|nspc|national schools press/.test(t))out.push(src('Lawphil','Republic Act No. 7079 — Campus Journalism Act of 1991','https://lawphil.net/statutes/repacts/ra1991/ra_7079_1991.html'));
  if(/universal health|healthcare|health is now a privilege|health becomes/.test(t))out.push(src('Lawphil','Republic Act No. 11223 — Universal Health Care Act','https://lawphil.net/statutes/repacts/ra2019/ra_11223_2019.html'));
  if(/sim card/.test(t))out.push(src('Lawphil','Republic Act No. 11934 — SIM Registration Act','https://lawphil.net/statutes/repacts/ra2022/ra_11934_2022.html'));
  if(/train law|excise taxes/.test(t))out.push(src('Lawphil','Republic Act No. 10963 — TRAIN Law','https://lawphil.net/statutes/repacts/ra2017/ra_10963_2017.html'));
  if(/indigenous|ancestral/.test(t))out.push(src('Lawphil','Republic Act No. 8371 — Indigenous Peoples’ Rights Act','https://lawphil.net/statutes/repacts/ra1997/ra_8371_1997.html'));
  if(/anti-agricultural economic sabotage/.test(t))out.push(src('Lawphil','Republic Act No. 12022 — Anti-Agricultural Economic Sabotage Act','https://lawphil.net/statutes/repacts/ra2024/ra_12022_2024.html'));
  if(/west philippine sea|maritime security|ph-japan raa|military drills/.test(t))out.push(src('United Nations','United Nations Convention on the Law of the Sea','https://www.un.org/depts/los/convention_agreements/texts/unclos/unclos_e.pdf'),src('Permanent Court of Arbitration','South China Sea Arbitration — The Philippines v. China','https://pca-cpa.org/en/cases/7/'));
  if(/data privacy|privacy/.test(t))out.push(src('Lawphil','Republic Act No. 10173 — Data Privacy Act of 2012','https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html'));
  return out;
}
function sourcesFor(title,category){
  const special=specialSources(title);
  const general=(sourcePools[category]||sourcePools.Governance).map(([p,t,u])=>src(p,t,u));
  const seen=new Set(),out=[];
  for(const item of [...special,...general]){
    if(seen.has(item.url))continue;seen.add(item.url);out.push(item);
    if(out.length>=5)break;
  }
  return out;
}

function wrapTitle(title,max=34,lines=3){
  const words=String(title).split(/\s+/),out=[];let line='';
  for(const word of words){
    const next=line?`${line} ${word}`:word;
    if(next.length>max&&line){out.push(line);line=word;if(out.length===lines-1)break}
    else line=next;
  }
  if(out.length<lines&&line)out.push(line);
  const consumed=out.join(' ').length;
  if(consumed<title.length&&out.length)out[out.length-1]=out[out.length-1].replace(/[.,;:!?-]*$/,'')+'…';
  return out.slice(0,lines);
}
function heroSvg(s){
  const lines=wrapTitle(s.headline,36,3);
  const lineSvg=lines.map((line,i)=>`<text x="112" y="${315+i*84}" class="headline">${xml(line)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="t d"><title id="t">${xml(s.headline)}</title><desc id="d">FMB Explainer editorial illustration for article ${s.id}.</desc><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#13072f"/><stop offset=".55" stop-color="#2b0c55"/><stop offset="1" stop-color="#07172c"/></linearGradient><radialGradient id="orb"><stop stop-color="#f6d88a" stop-opacity=".9"/><stop offset=".42" stop-color="#9b66ff" stop-opacity=".36"/><stop offset="1" stop-color="#12062c" stop-opacity="0"/></radialGradient><style>.eyebrow{font:700 28px Arial,sans-serif;letter-spacing:8px;fill:#f2c86f}.headline{font:700 58px Arial,sans-serif;fill:#fff}.meta{font:500 24px Arial,sans-serif;fill:#d9c9ef}.num{font:700 170px Arial,sans-serif;fill:#fff;opacity:.08}</style></defs><rect width="1600" height="900" fill="url(#bg)"/><circle cx="1320" cy="290" r="360" fill="url(#orb)"/><circle cx="1300" cy="320" r="122" fill="none" stroke="#f2c86f" stroke-width="3" opacity=".8"/><circle cx="1300" cy="320" r="76" fill="none" stroke="#a880ff" stroke-width="2" opacity=".7"/><path d="M1300 201 L1327 290 L1420 320 L1327 350 L1300 439 L1273 350 L1180 320 L1273 290Z" fill="#f2c86f" opacity=".16"/><text x="112" y="132" class="eyebrow">FMB EXPLAINER</text><text x="112" y="190" class="meta">${xml(s.category)} · Filipino Media Bulletin</text>${lineSvg}<text x="112" y="686" class="meta">FMB Explainer Archive · ${xml(fmtDate(s.archiveDate))}</text><text x="112" y="748" class="meta">Editorial illustration · Information with Purpose</text><text x="1180" y="790" class="num">${String(s.id).padStart(3,'0')}</text><rect x="112" y="798" width="310" height="4" rx="2" fill="#f2c86f"/></svg>`;
}

function generatedArticle(master,lib){
  const category=inferCategory(master.title,lib);
  const sections=buildSections(master,lib,category);
  const archive=archiveDate(master.id);
  const slug=slugify(master.title);
  const deck=String(lib?.explanation||sections[0]?.paragraphs?.[0]||'').replace(/\s+/g,' ').trim();
  const cleanDeck=deck.length>290?deck.slice(0,287).replace(/\s+\S*$/,'')+'…':deck;
  return {schemaVersion:1,status:'published',product:'explainer',id:master.id,archiveDate:archive,publishedAt:publicationTimestamp,updatedAt:publicationTimestamp,slug,headline:master.title,seoTitle:`${master.title} | FMB Explainer`,seoDescription:cleanDeck,category,kicker:`${category} · FMB Explainer`,deck:cleanDeck,author:'FMB Explainer Editorial Team',articleType:'AnalysisArticle',sections,sources:sourcesFor(master.title,category),image:{kind:'editorial-illustration',url:`/assets/images/explainer/${slug}.svg`,sourceUrl:null,creator:'FMB Explainer Editorial Team',license:'Original FMB editorial artwork',licenseUrl:null,usageStatus:'Original editorial illustration. Not a documentary photograph of a real event.',credit:'FMB Explainer / Filipino Media Bulletin',caption:'FMB Explainer editorial illustration. This artwork is explanatory and is not presented as documentary photography.',alt:`FMB Explainer editorial illustration for ${master.title}`}};
}

function page(s){
  const image=s.image?.url||fallback;
  const canonical=`${origin}/news/explainer/${s.slug}/`;
  const title=s.seoTitle||`${s.headline} | FMB Explainer`;
  const description=s.seoDescription||s.deck||'';
  const imageUrl=absolute(image);
  const sections=(s.sections||[]).map(sec=>`<section><h2>${esc(sec.heading)}</h2>${(sec.paragraphs||[]).map(p=>`<p>${esc(p)}</p>`).join('')}</section>`).join('');
  const sources=(s.sources||[]).map(src=>`<li><a href="${esc(src.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(src.publisher||'Source')}</strong>: ${esc(src.title||src.url)}</a></li>`).join('');
  const jsonLd=JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:s.headline,description,datePublished:s.publishedAt||publicationTimestamp,dateModified:s.updatedAt||s.publishedAt||publicationTimestamp,mainEntityOfPage:{'@type':'WebPage','@id':canonical},image:[imageUrl],articleSection:s.category||'FMB Explainer',genre:'Analysis',author:{'@type':'Organization',name:s.author||'FMB Explainer Editorial Team'},publisher:{'@type':'Organization',name:'Filipino Media Bulletin',url:`${origin}/news/`}}).replaceAll('<','\\u003c');
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="article"><meta property="og:site_name" content="Filipino Media Bulletin"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(imageUrl)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(imageUrl)}"><script type="application/ld+json">${jsonLd}</script><link rel="stylesheet" href="/assets/css/fmb-news-reference.css"><link rel="stylesheet" href="/assets/css/fmb-news-reference-final.css"></head><body class="fmb-ref fmb-explainer-route"><header class="masthead"><div class="shell"><a href="/news/explainer/" aria-label="FMB Explainer">FMB Explainer</a></div></header><main class="shell article-shell" data-fmb-explainer-article><a class="back" href="/news/explainer/">← Back to FMB Explainer</a><div class="article-grid"><article class="article"><div class="article-date">FMB Explainer Archive · ${fmtDate(s.archiveDate||s.publishedAt)} · ${readTime(s)} min read</div><div class="article-kicker">${esc(s.kicker||s.category||'FMB Explainer')}</div><h1>${esc(s.headline)}</h1><p class="article-deck">${esc(s.deck||'')}</p><p class="article-context-note"><strong>Archive context:</strong> This explainer is organized by its FMB archive date. Time-sensitive developments may have changed since then and should be read together with the cited sources and later updates.</p><div class="byline"><div class="byline-badge">FMB<br>Explainer</div><div><strong>By ${esc(s.author||'FMB Explainer Editorial Team')}</strong><br><small>Filipino Media Bulletin</small></div></div><figure class="article-figure"><img src="${esc(image)}" alt="${esc(s.image?.alt||s.headline)}" fetchpriority="high"><figcaption>${esc(s.image?.caption||'FMB Explainer editorial image.')}<br><small>${esc(s.image?.credit||'')}</small></figcaption></figure>${sections}<section class="sources"><h2>Sources and further reading</h2><ul>${sources}</ul><p><small>References prioritize official laws, institutions, primary documents and specialist sources relevant to the topic. Material time-sensitive claims should be rechecked when the article is substantively updated.</small></p></section></article></div></main><footer class="footer"><div class="shell footer-bottom">© 2026 Filipino Media Bulletin.</div></footer></body></html>`;
}

const structured=await loadStructured();
const structuredById=new Map(structured.map(s=>[Number(s.id||1),s]));
const master=parseMaster(await loadMasterText());
const library=await loadLibrary();
const articles=[];
const imageDir=path.join(newsRoot,'assets','images','explainer');
await mkdir(imageDir,{recursive:true});

for(const m of master){
  let article;
  if(m.id===1&&structuredById.has(1))article={...structuredById.get(1),id:1,headline:'Leptospirosis After the Flood: Why Resilience Alone Cannot Protect Metro Manila',author:'FMB Explainer Editorial Team'};
  else article=generatedArticle(m,library.get(m.id));
  articles.push(article);
  if(article.image?.kind==='editorial-illustration')await writeFile(path.join(imageDir,`${article.slug}.svg`),heroSvg(article),'utf8');
  const dir=path.join(newsRoot,'explainer',article.slug);
  await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,'index.html'),page(article),'utf8');
}

if(articles.length!==206)throw new Error(`Expected 206 FMB Explainer articles, rendered ${articles.length}`);
const index=articles.map(s=>({id:s.id,title:s.headline,archiveDate:String(s.archiveDate).slice(0,10),articleSlug:s.slug,category:s.category||'FMB Explainer',url:`/news/explainer/${s.slug}/`}));
const indexDir=path.join(newsRoot,'assets','data','fmb-explained');
await mkdir(indexDir,{recursive:true});
await writeFile(path.join(indexDir,'published-index.json'),JSON.stringify(index,null,2),'utf8');

const generatedWords=articles.filter(a=>a.id!==1).map(a=>wordCount((a.sections||[]).flatMap(s=>s.paragraphs||[]).join(' ')));
const minWords=Math.min(...generatedWords),avgWords=Math.round(generatedWords.reduce((a,b)=>a+b,0)/generatedWords.length);
console.log(`Rendered ${articles.length} FMB Explainer long-form article routes with individual images and published index; generated articles average ${avgWords} words (minimum ${minWords}).`);
