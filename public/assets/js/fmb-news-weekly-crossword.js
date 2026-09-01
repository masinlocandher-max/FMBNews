(()=>{
const puzzleId='fmb-current-events-2026-09-01-v2';
const MIN_WORDS=35;
const GRID_SIZE=45;
const cfg=window.FMB_CONFIG||{};
const SUPABASE_URL=cfg.SUPABASE_URL||'https://wjnavdpppnhxbuydkrkd.supabase.co';
const SUPABASE_KEY=cfg.SUPABASE_ANON_KEY||'sb_publishable_bpdFntTHbHmxsG4L0PtcCw_5dJ8gpr8';
const SESSION_KEY='fmbNewsAuthSessionV1';
const entries=[
{id:'paxsilica',answer:'PAXSILICA',display:'PAX SILICA',clue:'U.S.-led initiative tied to advanced-manufacturing plans centered on New Clark City.'},
{id:'impeachment',answer:'IMPEACHMENT',clue:'Constitutional process at the center of Vice President Sara Duterte’s Senate trial.'},
{id:'padilla',answer:'PADILLA',clue:'Surname of Senator Robin, a recurring figure in Philippine political coverage.'},
{id:'duterte',answer:'DUTERTE',clue:'Surname of the vice president currently facing an impeachment trial.'},
{id:'senate',answer:'SENATE',clue:'Chamber convened as the impeachment court.'},
{id:'tarlac',answer:'TARLAC',clue:'Central Luzon province where New Clark City is located.'},
{id:'bcda',answer:'BCDA',clue:'Government corporation leading development of New Clark City.'},
{id:'aeta',answer:'AETA',clue:'Indigenous people whose community and livelihood concerns are part of development debates in Central Luzon.'},
{id:'deped',answer:'DEPED',clue:'Department whose confidential-fund records feature in impeachment-trial testimony.'},
{id:'boransing',answer:'BORANSING',clue:'Surname of retired Colonel Manaros, called to testify in the September 1 impeachment proceedings.'},
{id:'poa',answer:'POA',clue:'Surname of lawyer Michael, who stepped aside as a defense spokesperson after becoming a witness.'},
{id:'confidential',answer:'CONFIDENTIAL',clue:'Type of funds under scrutiny in testimony involving DepEd and the vice president.'},
{id:'funds',answer:'FUNDS',clue:'Public money at the center of the current confidential-spending testimony.'},
{id:'afp',answer:'AFP',clue:'Armed institution whose officers were called in the impeachment proceedings.'},
{id:'habagat',answer:'HABAGAT',clue:'Southwest monsoon continuing to bring rain to parts of Luzon and western Visayas.'},
{id:'pilandok',answer:'PILANDOK',clue:'Philippine name of the tropical storm being monitored east of Northern Luzon on September 1.'},
{id:'pagasa',answer:'PAGASA',clue:'Philippine weather agency issuing storm and rainfall bulletins.'},
{id:'visayas',answer:'VISAYAS',clue:'Island group whose power grid was placed on red alert on September 1.'},
{id:'mindanao',answer:'MINDANAO',clue:'Island group whose grid also faced yellow-alert conditions amid tight reserves.'},
{id:'ngcp',answer:'NGCP',clue:'Grid operator announcing power alerts and available-capacity conditions.'},
{id:'redalert',answer:'REDALERT',display:'RED ALERT',clue:'Highest grid-alert level reported for the Visayas during tight power supply.'},
{id:'flooding',answer:'FLOODING',clue:'Hazard disrupting roads, communities and transport across parts of Central Luzon.'},
{id:'pampanga',answer:'PAMPANGA',clue:'Central Luzon province among those hit hard by recent flooding.'},
{id:'zambales',answer:'ZAMBALES',clue:'Central Luzon province included in restoration orders after heavy rains damaged connectivity.'},
{id:'dpwh',answer:'DPWH',clue:'Department ordered to restore roads and connectivity in flood-hit Central Luzon.'},
{id:'nlex',answer:'NLEX',clue:'Expressway issuing traffic and passability advisories during the flooding.'},
{id:'airquality',answer:'AIRQUALITY',display:'AIR QUALITY',clue:'Public-health concern raised as haze from Kalimantan wildfire affected Philippine conditions.'},
{id:'kalimantan',answer:'KALIMANTAN',clue:'Indonesian region whose wildfire smoke was cited in Philippine air-quality advisories.'},
{id:'comelec',answer:'COMELEC',clue:'Election commission backing debates ahead of the September 14 polls.'},
{id:'bridge',answer:'BRIDGE',clue:'Infrastructure type receiving urgent attention after damage and collapse in flood-hit areas.'},
{id:'pcg',answer:'PCG',clue:'Coast Guard involved in recovery operations after the Agana Bridge collapse.'},
{id:'foodhubs',answer:'FOODHUBS',display:'FOOD HUBS',clue:'Facilities the agriculture sector says are needed to improve food distribution.'},
{id:'bonoan',answer:'BONOAN',clue:'Surname of the former DPWH chief appearing in September 1 legal and political coverage.'},
{id:'kadiwa',answer:'KADIWA',clue:'Government-supported market program appearing in agriculture and food-distribution coverage.'},
{id:'escudero',answer:'ESCUDERO',clue:'Senator who barred listening devices from the impeachment trial.'},
{id:'ortonio',answer:'ORTONIO',clue:'Surname appearing in viral-image coverage connected to the vice president’s impeachment trial.'}
];
if(entries.length<MIN_WORDS)throw new Error(`FMB Crossword requires at least ${MIN_WORDS} answers.`);

const releasedPuzzles=[]; // Previous answer keys are added here only when a new weekly puzzle is published.
const gridEl=document.querySelector('[data-cw-grid]');if(!gridEl)return;
const status=document.querySelector('[data-cw-status]');
const board=new Map(),placements=[],members=new Map();
const key=(r,c)=>`${r}:${c}`;
const parseKey=k=>k.split(':').map(Number);
const inBounds=(r,c)=>r>=0&&c>=0&&r<GRID_SIZE&&c<GRID_SIZE;
const jget=(k,d=null)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
let reader=null,session=null,registered=false,saveTimer=null,completedAt=null;

function cellAt(r,c){return board.get(key(r,c))}
function canPlace(entry,r,c,dir,relaxed=false){
  const len=entry.answer.length,endR=r+(dir==='D'?len-1:0),endC=c+(dir==='A'?len-1:0);
  if(!inBounds(r,c)||!inBounds(endR,endC))return null;
  const before=[r-(dir==='D'?1:0),c-(dir==='A'?1:0)],after=[endR+(dir==='D'?1:0),endC+(dir==='A'?1:0)];
  if(inBounds(...before)&&cellAt(...before))return null;if(inBounds(...after)&&cellAt(...after))return null;
  let crosses=0;
  for(let i=0;i<len;i++){
    const rr=r+(dir==='D'?i:0),cc=c+(dir==='A'?i:0),existing=cellAt(rr,cc),letter=entry.answer[i];
    if(existing){if(existing.letter!==letter||existing.dirs.has(dir))return null;crosses++}
    else if(!relaxed){
      const sides=dir==='A'?[[rr-1,cc],[rr+1,cc]]:[[rr,cc-1],[rr,cc+1]];
      if(sides.some(([sr,sc])=>inBounds(sr,sc)&&cellAt(sr,sc)))return null;
    }
  }
  return crosses?{crosses}:null;
}
function place(entry,r,c,dir){
  const placement={...entry,r,c,dir};placements.push(placement);
  for(let i=0;i<entry.answer.length;i++){
    const rr=r+(dir==='D'?i:0),cc=c+(dir==='A'?i:0),k=key(rr,cc),letter=entry.answer[i];
    if(!board.has(k))board.set(k,{r:rr,c:cc,letter,dirs:new Set(),wordIds:[]});
    const cell=board.get(k);cell.dirs.add(dir);cell.wordIds.push(entry.id);members.set(k,cell.wordIds);
  }
}
function bestPlacement(entry,relaxed=false){
  let best=null;
  for(let i=0;i<entry.answer.length;i++)for(const cell of board.values()){
    if(cell.letter!==entry.answer[i])continue;
    const dirs=[];if(!cell.dirs.has('A'))dirs.push('A');if(!cell.dirs.has('D'))dirs.push('D');
    for(const dir of dirs){
      const r=cell.r-(dir==='D'?i:0),c=cell.c-(dir==='A'?i:0),ok=canPlace(entry,r,c,dir,relaxed);if(!ok)continue;
      const midR=r+(dir==='D'?(entry.answer.length-1)/2:0),midC=c+(dir==='A'?(entry.answer.length-1)/2:0),center=(GRID_SIZE-1)/2;
      const score=ok.crosses*10000-(Math.abs(midR-center)+Math.abs(midC-center));
      if(!best||score>best.score)best={r,c,dir,score};
    }
  }
  return best;
}

const ordered=[...entries].sort((a,b)=>b.answer.length-a.answer.length||a.answer.localeCompare(b.answer));
const first=ordered.shift(),center=Math.floor(GRID_SIZE/2);place(first,center,Math.floor((GRID_SIZE-first.answer.length)/2),'A');
let pending=ordered,pass=0;
while(pending.length&&pass<12){let progress=false,next=[];for(const entry of pending){const best=bestPlacement(entry,false);if(best){place(entry,best.r,best.c,best.dir);progress=true}else next.push(entry)}pending=next;if(!progress)break;pass++}
if(pending.length){const next=[];for(const entry of pending){const best=bestPlacement(entry,true);if(best)place(entry,best.r,best.c,best.dir);else next.push(entry)}pending=next}
if(placements.length<MIN_WORDS){status.textContent='This week’s crossword could not be assembled completely. Please refresh after the newsroom update.';console.error('FMB Crossword placement shortfall',placements.length,pending.map(x=>x.answer));return}

const starts=new Map();for(const w of placements){const k=key(w.r,w.c);if(!starts.has(k))starts.set(k,[]);starts.get(k).push(w)}
const startKeys=[...starts.keys()].sort((a,b)=>{const[ar,ac]=parseKey(a),[br,bc]=parseKey(b);return ar-br||ac-bc});
const numbers=new Map(startKeys.map((k,i)=>[k,i+1]));placements.forEach(w=>w.n=numbers.get(key(w.r,w.c)));
let minR=GRID_SIZE,maxR=0,minC=GRID_SIZE,maxC=0;for(const cell of board.values()){minR=Math.min(minR,cell.r);maxR=Math.max(maxR,cell.r);minC=Math.min(minC,cell.c);maxC=Math.max(maxC,cell.c)}
minR=Math.max(0,minR-1);maxR=Math.min(GRID_SIZE-1,maxR+1);minC=Math.max(0,minC-1);maxC=Math.min(GRID_SIZE-1,maxC+1);
const rows=maxR-minR+1,cols=maxC-minC+1;gridEl.style.gridTemplateColumns=`repeat(${cols},31px)`;
for(let r=minR;r<=maxR;r++)for(let c=minC;c<=maxC;c++){
  const k=key(r,c),data=board.get(k),box=document.createElement('div');box.className='fmb-cell'+(data?'':' block');box.dataset.key=k;
  if(data){const n=numbers.get(k);if(n){const num=document.createElement('span');num.className='fmb-cell-number';num.textContent=n;box.append(num)}const input=document.createElement('input');input.maxLength=1;input.autocomplete='off';input.autocapitalize='characters';input.spellcheck=false;input.inputMode='text';input.setAttribute('aria-label',`Crossword row ${r-minR+1} column ${c-minC+1}`);input.disabled=true;box.append(input)}
  gridEl.append(box)
}
const cellNodes=()=>[...gridEl.querySelectorAll('.fmb-cell:not(.block)')];
const wordById=id=>placements.find(w=>w.id===id);
const wordKeys=w=>[...w.answer].map((_,i)=>key(w.r+(w.dir==='D'?i:0),w.c+(w.dir==='A'?i:0)));
let selectedWord=placements[0].id,selectedKey='';

const mode=document.createElement('div');mode.className='fmb-crossword-persistence';mode.dataset.mode='checking';mode.textContent='Checking save status…';status?.before(mode);
const cluePanel=document.createElement('aside');cluePanel.className='fmb-crossword-clue-popover';cluePanel.hidden=true;cluePanel.setAttribute('aria-live','polite');cluePanel.innerHTML='<button type="button" class="fmb-crossword-clue-close" data-cw-clue-close aria-label="Close clue">×</button><strong data-cw-active-title></strong><p data-cw-active-text></p><small data-cw-active-length></small>';document.body.append(cluePanel);
cluePanel.querySelector('[data-cw-clue-close]').onclick=()=>{cluePanel.hidden=true};

function showClue(w){if(!w)return;cluePanel.querySelector('[data-cw-active-title]').textContent=`${w.n} ${w.dir==='A'?'Across':'Down'}`;cluePanel.querySelector('[data-cw-active-text]').textContent=w.clue;cluePanel.querySelector('[data-cw-active-length]').textContent=`${w.answer.length} letters`;cluePanel.hidden=false}
function enableGrid(){cellNodes().forEach(b=>b.querySelector('input').disabled=false)}
function collectCells(){const data={};for(const box of cellNodes()){const v=box.querySelector('input').value.toUpperCase();if(v)data[box.dataset.key]=v}return data}
function applyCells(cells={}){for(const box of cellNodes())box.querySelector('input').value=String(cells[box.dataset.key]||'').slice(0,1).toUpperCase()}

async function recoverReader(){
  session=jget(SESSION_KEY,null);if(!session?.access_token)return null;
  if(session.expires_at&&session.expires_at<Date.now()+60000&&session.refresh_token){
    try{const rr=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});if(rr.ok){const n=await rr.json();session={access_token:n.access_token,refresh_token:n.refresh_token||session.refresh_token,expires_at:Date.now()+Number(n.expires_in||3600)*1000};localStorage.setItem(SESSION_KEY,JSON.stringify(session))}}catch{}
  }
  if(!session?.access_token)return null;
  try{const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${session.access_token}`}});if(!r.ok)return null;reader=await r.json();return reader}catch{return null}
}
async function cloud(path,options={}){if(!session?.access_token)throw new Error('No active FMB News sign-in.');return fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json',...(options.headers||{})}})}
async function loadCloudProgress(){
  const r=await cloud(`news_crossword_progress?select=cells,selected_word,selected_key,completed_at,updated_at&user_id=eq.${encodeURIComponent(reader.id)}&puzzle_id=eq.${encodeURIComponent(puzzleId)}&limit=1`);if(!r.ok)return null;const rows=await r.json(),row=rows[0];if(!row)return null;applyCells(row.cells||{});completedAt=row.completed_at||null;if(row.selected_word&&wordById(row.selected_word)){selectedWord=row.selected_word;selectedKey=row.selected_key||nextEmpty(wordById(selectedWord));selectWord(selectedWord,selectedKey,false)}return row
}
async function saveCloud(keepalive=false){
  if(!registered||!reader||!session?.access_token)return;
  const body={user_id:reader.id,puzzle_id:puzzleId,cells:collectCells(),selected_word:selectedWord,selected_key:selectedKey||null,completed_at:completedAt,updated_at:new Date().toISOString()};
  mode.dataset.mode='checking';mode.textContent='Saving…';
  try{const r=await cloud('news_crossword_progress?on_conflict=user_id,puzzle_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(body),keepalive});if(!r.ok)throw new Error('save failed');mode.dataset.mode='saved';mode.textContent='Progress saved to your FMB account'}catch{mode.dataset.mode='guest';mode.textContent='Save interrupted · keep this page open';}
}
function scheduleSave(){if(!registered)return;clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveCloud(false),800)}

function selectWord(id,focusKey,openClue=false){selectedWord=id;const w=wordById(id),keys=wordKeys(w);if(focusKey)selectedKey=focusKey;cellNodes().forEach(b=>{b.classList.toggle('same-word',keys.includes(b.dataset.key));b.classList.toggle('selected',b.dataset.key===selectedKey)});document.querySelectorAll('.fmb-clue').forEach(c=>c.toggleAttribute('data-selected',c.dataset.word===id));if(openClue)showClue(w);if(focusKey)gridEl.querySelector(`[data-key="${focusKey}"] input`)?.focus();scheduleSave()}
function focusInWord(offset){const w=wordById(selectedWord),keys=wordKeys(w),idx=Math.max(0,keys.indexOf(selectedKey)),next=keys[Math.min(keys.length-1,Math.max(0,idx+offset))];selectWord(w.id,next,false)}
function nextEmpty(w){return wordKeys(w).find(k=>!gridEl.querySelector(`[data-key="${k}"] input`)?.value)||wordKeys(w)[0]}
function renderClues(dir,target){const el=document.querySelector(target),items=placements.filter(w=>w.dir===dir).sort((a,b)=>a.n-b.n);el.innerHTML=items.map(w=>`<div class="fmb-clue" data-word="${w.id}"><strong>${w.n}</strong><button type="button" data-clue-word="${w.id}">${w.clue}</button></div>`).join('')}
renderClues('A','[data-cw-across]');renderClues('D','[data-cw-down]');
document.querySelectorAll('[data-clue-word]').forEach(b=>b.addEventListener('click',()=>{const w=wordById(b.dataset.clueWord);selectWord(w.id,nextEmpty(w),true)}));
gridEl.addEventListener('focusin',e=>{const box=e.target.closest('.fmb-cell:not(.block)');if(!box)return;selectedKey=box.dataset.key;const ids=members.get(selectedKey)||[];if(!ids.includes(selectedWord))selectedWord=ids[0];selectWord(selectedWord,selectedKey,false)});
gridEl.addEventListener('click',e=>{const box=e.target.closest('.fmb-cell:not(.block)');if(!box)return;const ids=members.get(box.dataset.key)||[];if(ids.length>1&&box.dataset.key===selectedKey){const i=ids.indexOf(selectedWord);selectedWord=ids[(i+1)%ids.length]}selectWord(selectedWord,box.dataset.key,true)});
gridEl.addEventListener('input',e=>{if(!e.target.matches('input'))return;e.target.value=e.target.value.replace(/[^a-z]/gi,'').slice(-1).toUpperCase();e.target.closest('.fmb-cell').classList.remove('wrong','correct');scheduleSave();if(e.target.value)focusInWord(1);checkCompletion()});
gridEl.addEventListener('keydown',e=>{if(!e.target.matches('input'))return;if(e.key==='Backspace'&&!e.target.value){e.preventDefault();focusInWord(-1)}if(e.key===' '){e.preventDefault();const ids=members.get(selectedKey)||[];if(ids.length>1){const i=ids.indexOf(selectedWord);selectWord(ids[(i+1)%ids.length],selectedKey,true)}}if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();focusInWord(1)}if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();focusInWord(-1)}});
function evaluate(keys){let wrong=0,empty=0;for(const k of keys){const box=gridEl.querySelector(`[data-key="${k}"]`),input=box?.querySelector('input');if(!input)continue;const expected=board.get(k).letter;if(!input.value){empty++;continue}if(input.value.toUpperCase()!==expected)wrong++}return{wrong,empty}}
function checkCompletion(){const result=evaluate([...board.keys()]);if(result.wrong===0&&result.empty===0){completedAt=new Date().toISOString();if(registered)saveCloud(false);status.textContent=registered?'Puzzle complete. Your result is saved to your FMB account.':'Puzzle complete. You are playing without an account, so this result will be lost when you leave.';return true}return false}

function showSaveGate(){
  document.querySelector('.fmb-crossword-save-gate')?.remove();const gate=document.createElement('div');gate.className='fmb-crossword-save-gate';gate.innerHTML='<section class="fmb-crossword-save-panel" role="dialog" aria-modal="true" aria-labelledby="fmb-cw-save-title"><button type="button" class="fmb-crossword-save-x" data-cw-dismiss-save aria-label="Close">×</button><h2 id="fmb-cw-save-title">Save your crossword progress</h2><p>Register or sign in to save your crossword progress. If you continue without an account, nothing is stored and your progress will be lost when you close, refresh, or leave this page.</p><div class="fmb-crossword-save-actions"><button type="button" data-cw-register>Register / Sign in</button><button type="button" data-cw-continue>Continue without saving</button></div></section>';document.body.append(gate);
  const continueGuest=()=>{gate.remove();enableGrid();mode.dataset.mode='guest';mode.textContent='Guest mode · progress will be lost when you leave';status.textContent='Guest mode. Nothing is being saved.'};
  gate.querySelector('[data-cw-dismiss-save]').onclick=continueGuest;gate.querySelector('[data-cw-continue]').onclick=continueGuest;gate.addEventListener('click',e=>{if(e.target===gate)continueGuest()});gate.querySelector('[data-cw-register]').onclick=()=>{continueGuest();const open=()=>{const b=document.querySelector('[data-fmb-account]');if(b)b.click();else setTimeout(open,350)};open()};
}

const releaseEl=document.querySelector('[data-cw-released-answers]'),policyEl=document.querySelector('[data-cw-answer-policy]');
if(releasedPuzzles.length&&releaseEl){releaseEl.innerHTML=releasedPuzzles.map(p=>`<div><strong>${p.week}</strong><span>${p.answers.join(' · ')}</span></div>`).join('');if(policyEl)policyEl.textContent='The active puzzle remains unrevealed. Only completed previous-week answer keys are published here.'}
selectWord(placements[0].id,nextEmpty(placements[0]),false);

(async()=>{
  const u=await recoverReader();
  if(u){registered=true;enableGrid();const restored=await loadCloudProgress();mode.dataset.mode='saved';mode.textContent='Progress saves automatically to your FMB account';if(restored){status.textContent=restored.completed_at?'Completed this week. Your result is saved to your FMB account.':'Your saved crossword progress is restored.'}}
  else{registered=false;mode.dataset.mode='guest';mode.textContent='Sign in to save progress';showSaveGate()}
})();

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&registered)saveCloud(true)});
window.addEventListener('beforeunload',()=>{if(registered)saveCloud(true)});
})();
