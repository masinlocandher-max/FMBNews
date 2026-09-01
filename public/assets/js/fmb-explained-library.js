const FMB_EXPLAINED_SHARDS=[
  '/assets/data/fmb-explained/001-025.json',
  '/assets/data/fmb-explained/026-050.json',
  '/assets/data/fmb-explained/051-075.json',
  '/assets/data/fmb-explained/076-100.json',
  '/assets/data/fmb-explained/101-125.json',
  '/assets/data/fmb-explained/126-150.json',
  '/assets/data/fmb-explained/151-175.json',
  '/assets/data/fmb-explained/176-200.json',
  '/assets/data/fmb-explained/201-206.json'
];

const $=selector=>document.querySelector(selector);
const list=$('#fmbExplainedList');
const search=$('#fmbExplainedSearch');
const count=$('#fmbExplainedCount');
const status=$('#fmbExplainedStatus');
let library=[];

function cleanTitle(title){
  return title
    .replace(/^EXPLAINER\s*\|\s*/i,'')
    .replace(/^#FactsFirstRedefined\s*\|\s*/i,'')
    .replace(/\s*\[duplicate archive title\]\s*/i,' — Energy reliability revisited')
    .trim();
}

function escapeHtml(value=''){
  return value.replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  })[char]);
}

function render(items){
  if(!list)return;
  if(count)count.textContent=`${items.length} of ${library.length} explainers`;
  if(!items.length){
    list.innerHTML='<div class="explained-no-results"><strong>No matching explainer.</strong><span>Try another word, place, policy, person, or issue.</span></div>';
    return;
  }
  list.innerHTML=items.map(item=>`<details class="explained-item" id="topic-${item.id}">
    <summary>
      <span class="explained-number">${String(item.id).padStart(3,'0')}</span>
      <span class="explained-title">${escapeHtml(cleanTitle(item.title))}</span>
      <span class="explained-plus" aria-hidden="true">+</span>
    </summary>
    <div class="explained-body">
      <section>
        <div class="explained-label">Let me explain</div>
        <p>${escapeHtml(item.explanation)}</p>
      </section>
      <section class="explained-why">
        <div class="explained-label">Why this matters to us as Filipinos</div>
        <p>${escapeHtml(item.why)}</p>
      </section>
      <div class="explained-source-note">Verified source lists are attached when each explainer is finalized for publication.</div>
    </div>
  </details>`).join('');
}

function filterLibrary(){
  const q=(search?.value||'').trim().toLocaleLowerCase('en-PH');
  if(!q)return render(library);
  const filtered=library.filter(item=>`${item.title} ${item.explanation} ${item.why}`.toLocaleLowerCase('en-PH').includes(q));
  render(filtered);
}

async function loadLibrary(){
  try{
    if(status)status.textContent='Loading 206 explainers…';
    const responses=await Promise.all(FMB_EXPLAINED_SHARDS.map(url=>fetch(url,{cache:'no-store'})));
    const failed=responses.find(response=>!response.ok);
    if(failed)throw new Error(`Library request failed: ${failed.status}`);
    const chunks=await Promise.all(responses.map(response=>response.json()));
    library=chunks.flat().sort((a,b)=>a.id-b.id);
    if(library.length!==206)throw new Error(`Expected 206 entries, received ${library.length}`);
    if(status)status.textContent='206 explainers · FMB Explained';
    render(library);
    const hash=location.hash.match(/^#topic-(\d+)$/);
    if(hash){
      const target=document.querySelector(location.hash);
      if(target){target.open=true;setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'start'}),50);}
    }
  }catch(error){
    console.error(error);
    if(status)status.textContent='FMB Explained library unavailable';
    if(list)list.innerHTML='<div class="explained-no-results"><strong>The explainer library could not load.</strong><span>Please refresh the page.</span></div>';
  }
}

search?.addEventListener('input',filterLibrary);
loadLibrary();
