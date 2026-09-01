const FMB_EXPLAINED_SHARDS=[
  '/assets/data/fmb-explained/001-025.json','/assets/data/fmb-explained/026-050.json','/assets/data/fmb-explained/051-075.json','/assets/data/fmb-explained/076-100.json','/assets/data/fmb-explained/101-125.json','/assets/data/fmb-explained/126-150.json','/assets/data/fmb-explained/151-175.json','/assets/data/fmb-explained/176-200.json','/assets/data/fmb-explained/201-206.json'
];
const PUBLISHED_INDEX='/assets/data/fmb-explained/published-index.json';
const $=selector=>document.querySelector(selector);
const list=$('#fmbExplainedList'),search=$('#fmbExplainedSearch'),count=$('#fmbExplainedCount'),status=$('#fmbExplainedStatus');
let library=[],published=new Map();
function cleanTitle(title){return String(title).replace(/^EXPLAINER\s*\|\s*/i,'').replace(/^#FactsFirstRedefined\s*\|\s*/i,'').replace(/\s*\[duplicate archive title\]\s*/i,' — Energy reliability revisited').trim()}
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[char])}
function publicationLabel(pub){
  if(pub?.originalPublishedAt){
    return new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',month:'long',day:'numeric',year:'numeric'}).format(new Date(pub.originalPublishedAt));
  }
  return 'Original publication chronology';
}
function render(items){
  if(!list)return;if(count)count.textContent=`${items.length} of ${library.length} explainers`;
  if(!items.length){list.innerHTML='<div class="explained-no-results"><strong>No matching explainer.</strong><span>Try another word, place, policy, person, or issue.</span></div>';return}
  list.innerHTML=items.map(item=>{const pub=published.get(Number(item.id));const title=pub?.title||cleanTitle(item.title);const date=pub?`<div class="explained-source-note">${escapeHtml(publicationLabel(pub))}</div>`:'';const read=pub?`<a class="explained-read" href="/news/explainer/${escapeHtml(pub.articleSlug)}/">Read the full article →</a>`:'';return `<details class="explained-item" id="topic-${item.id}"><summary><span class="explained-number">${String(item.id).padStart(3,'0')}</span><span class="explained-title">${escapeHtml(title)}</span><span class="explained-plus" aria-hidden="true">+</span></summary><div class="explained-body"><section><div class="explained-label">Overview</div><p>${escapeHtml(item.explanation)}</p></section><section class="explained-why"><div class="explained-label">Why it matters</div><p>${escapeHtml(item.why)}</p></section>${date}${read}</div></details>`}).join('')
}
function filterLibrary(){const q=(search?.value||'').trim().toLocaleLowerCase('en-PH');if(!q)return render(library);render(library.filter(item=>`${published.get(Number(item.id))?.title||item.title} ${item.explanation} ${item.why}`.toLocaleLowerCase('en-PH').includes(q)))}
async function loadLibrary(){
  try{
    if(status)status.textContent='Loading 206 explainers…';
    const responses=await Promise.all([...FMB_EXPLAINED_SHARDS,PUBLISHED_INDEX].map(url=>fetch(url,{cache:'no-store'})));
    const failed=responses.find(response=>!response.ok);if(failed)throw new Error(`Library request failed: ${failed.status}`);
    const payloads=await Promise.all(responses.map(response=>response.json()));
    const index=payloads.at(-1);
    if(index.length!==206)throw new Error(`Expected 206 published articles, received ${index.length}`);
    published=new Map(index.map(item=>[Number(item.id),item]));
    library=payloads.slice(0,-1).flat().sort((a,b)=>(published.get(Number(a.id))?.sourceOrder??Number(a.id))-(published.get(Number(b.id))?.sourceOrder??Number(b.id)));
    if(library.length!==206)throw new Error(`Expected 206 topics, received ${library.length}`);
    if(status)status.textContent='206 full articles · original publication order';render(library);
    const hash=location.hash.match(/^#topic-(\d+)$/);if(hash){const target=document.querySelector(location.hash);if(target){target.open=true;setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'start'}),50)}}
  }catch(error){console.error(error);if(status)status.textContent='FMB Explainer library unavailable';if(list)list.innerHTML='<div class="explained-no-results"><strong>The explainer library could not load.</strong><span>Please refresh the page.</span></div>'}
}
search?.addEventListener('input',filterLibrary);loadLibrary();
