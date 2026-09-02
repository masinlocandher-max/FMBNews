(()=>{
const puzzleId='fmb-current-events-2026-09-01-v2';
const cfg=window.FMB_CONFIG||{};
const SUPABASE_URL=cfg.SUPABASE_URL||'https://wjnavdpppnhxbuydkrkd.supabase.co';
const SUPABASE_KEY=cfg.SUPABASE_ANON_KEY||'sb_publishable_bpdFntTHbHmxsG4L0PtcCw_5dJ8gpr8';
const SESSION_KEY='fmbNewsAuthSessionV1';
const gridEl=document.querySelector('[data-cw-grid]');
const status=document.querySelector('[data-cw-status]');
if(!gridEl)return;
const k=(r,c)=>`${r}:${c}`;
const jget=(name,fallback=null)=>{try{return JSON.parse(localStorage.getItem(name)||JSON.stringify(fallback))}catch{return fallback}};
let words=[],cells=new Map(),selectedWord='',selectedKey='',reader=null,session=null,registered=false,saveTimer=null;

function wordKeys(w){return Array.from({length:w.length},(_,i)=>k(w.r+(w.dir==='D'?i:0),w.c+(w.dir==='A'?i:0)))}
function wordById(id){return words.find(w=>w.id===id)}
function collectCells(){const out={};gridEl.querySelectorAll('.fmb-cell:not(.block)').forEach(box=>{const v=box.querySelector('input')?.value?.toUpperCase();if(v)out[box.dataset.key]=v});return out}
function applyCells(saved={}){gridEl.querySelectorAll('.fmb-cell:not(.block)').forEach(box=>{const input=box.querySelector('input');if(input)input.value=String(saved[box.dataset.key]||'').replace(/[^A-Z]/gi,'').slice(0,1).toUpperCase()})}
function nextEmpty(w){return wordKeys(w).find(key=>!gridEl.querySelector(`[data-key="${key}"] input`)?.value)||wordKeys(w)[0]}
function selectWord(id,focusKey){const w=wordById(id);if(!w)return;selectedWord=id;if(focusKey)selectedKey=focusKey;const keys=wordKeys(w);gridEl.querySelectorAll('.fmb-cell:not(.block)').forEach(box=>{box.classList.toggle('same-word',keys.includes(box.dataset.key));box.classList.toggle('selected',box.dataset.key===selectedKey)});document.querySelectorAll('.fmb-clue').forEach(c=>c.toggleAttribute('data-selected',c.dataset.word===id));if(focusKey)gridEl.querySelector(`[data-key="${focusKey}"] input`)?.focus();scheduleSave()}
function focusInWord(offset){const w=wordById(selectedWord);if(!w)return;const keys=wordKeys(w),idx=Math.max(0,keys.indexOf(selectedKey)),next=keys[Math.min(keys.length-1,Math.max(0,idx+offset))];selectWord(w.id,next)}
function checkFilled(){const inputs=[...gridEl.querySelectorAll('.fmb-cell:not(.block) input')];if(inputs.length&&inputs.every(input=>input.value)){status.textContent='All squares are filled. Correctness remains sealed until the official answer release.'}else if(status.textContent.includes('All squares'))status.textContent='Active puzzle. Answers and correctness remain sealed until the official release.'}

async function recoverReader(){session=jget(SESSION_KEY,null);if(!session?.access_token)return null;try{const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${session.access_token}`}});if(!r.ok)return null;reader=await r.json();return reader}catch{return null}}
async function cloud(path,options={}){return fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json',...(options.headers||{})}})}
async function loadCloud(){if(!reader)return;try{const r=await cloud(`news_crossword_progress?select=cells,selected_word,selected_key&user_id=eq.${encodeURIComponent(reader.id)}&puzzle_id=eq.${encodeURIComponent(puzzleId)}&limit=1`);if(!r.ok)return;const row=(await r.json())[0];if(!row)return;applyCells(row.cells||{});if(wordById(row.selected_word)){selectedWord=row.selected_word;selectedKey=row.selected_key||nextEmpty(wordById(selectedWord));selectWord(selectedWord,selectedKey)}}catch{}}
async function saveCloud(keepalive=false){if(!registered||!reader||!session?.access_token)return;const body={user_id:reader.id,puzzle_id:puzzleId,cells:collectCells(),selected_word:selectedWord||null,selected_key:selectedKey||null,completed_at:null,updated_at:new Date().toISOString()};try{await cloud('news_crossword_progress?on_conflict=user_id,puzzle_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(body),keepalive})}catch{}}
function scheduleSave(){if(!registered)return;clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveCloud(false),800)}

function renderClues(dir,target){const el=document.querySelector(target);if(!el)return;el.innerHTML=words.filter(w=>w.dir===dir).sort((a,b)=>a.n-b.n).map(w=>`<div class="fmb-clue" data-word="${w.id}"><strong>${w.n}</strong><button type="button" data-clue-word="${w.id}">${w.clue}</button><small>${w.length} letters</small></div>`).join('');el.querySelectorAll('[data-clue-word]').forEach(btn=>btn.addEventListener('click',()=>{const w=wordById(btn.dataset.clueWord);selectWord(w.id,nextEmpty(w))}))}

async function init(){
  const response=await fetch('/news/assets/data/fmb-crossword-current.json?v=20260902-secure-v1',{cache:'no-store'});
  if(!response.ok)throw new Error('Crossword layout unavailable');
  words=await response.json();
  for(const w of words)for(const key of wordKeys(w)){const list=cells.get(key)||[];list.push(w.id);cells.set(key,list)}
  const coords=[...cells.keys()].map(key=>key.split(':').map(Number));
  const minR=Math.min(...coords.map(x=>x[0]))-1,maxR=Math.max(...coords.map(x=>x[0]))+1,minC=Math.min(...coords.map(x=>x[1]))-1,maxC=Math.max(...coords.map(x=>x[1]))+1;
  const starts=new Map();words.forEach(w=>starts.set(k(w.r,w.c),w.n));
  gridEl.style.gridTemplateColumns=`repeat(${maxC-minC+1},31px)`;
  for(let r=minR;r<=maxR;r++)for(let c=minC;c<=maxC;c++){
    const key=k(r,c),active=cells.has(key),box=document.createElement('div');box.className='fmb-cell'+(active?'':' block');box.dataset.key=key;
    if(active){const n=starts.get(key);if(n){const num=document.createElement('span');num.className='fmb-cell-number';num.textContent=n;box.append(num)}const input=document.createElement('input');input.maxLength=1;input.autocomplete='off';input.autocapitalize='characters';input.spellcheck=false;input.inputMode='text';input.setAttribute('aria-label',`Crossword row ${r-minR+1} column ${c-minC+1}`);box.append(input)}gridEl.append(box)
  }
  renderClues('A','[data-cw-across]');renderClues('D','[data-cw-down]');
  selectedWord=words[0]?.id||'';selectedKey=words[0]?nextEmpty(words[0]):'';selectWord(selectedWord,selectedKey);
  gridEl.addEventListener('focusin',e=>{const box=e.target.closest('.fmb-cell:not(.block)');if(!box)return;selectedKey=box.dataset.key;const ids=cells.get(selectedKey)||[];if(!ids.includes(selectedWord))selectedWord=ids[0];selectWord(selectedWord,selectedKey)});
  gridEl.addEventListener('click',e=>{const box=e.target.closest('.fmb-cell:not(.block)');if(!box)return;const ids=cells.get(box.dataset.key)||[];if(ids.length>1&&box.dataset.key===selectedKey){const i=ids.indexOf(selectedWord);selectedWord=ids[(i+1)%ids.length]}selectWord(selectedWord,box.dataset.key)});
  gridEl.addEventListener('input',e=>{if(!e.target.matches('input'))return;e.target.value=e.target.value.replace(/[^a-z]/gi,'').slice(-1).toUpperCase();scheduleSave();if(e.target.value)focusInWord(1);checkFilled()});
  gridEl.addEventListener('keydown',e=>{if(!e.target.matches('input'))return;if(e.key==='Backspace'&&!e.target.value){e.preventDefault();focusInWord(-1)}if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();focusInWord(1)}if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();focusInWord(-1)}});
  if(await recoverReader()){registered=true;await loadCloud();status.textContent='Active puzzle. Progress saves to your FMB account; answers and correctness remain sealed.'}else{status.textContent='Active puzzle. Answers and correctness remain sealed until the official release.'}
  checkFilled();
}
init().catch(err=>{console.error(err);status.textContent='The crossword could not load. Please refresh.'});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveCloud(true)});window.addEventListener('beforeunload',()=>saveCloud(true));
})();