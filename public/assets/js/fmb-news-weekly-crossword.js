(()=>{
const puzzleId='fmb-current-events-2026-09-01-v2';
const MIN_WORDS=35;
const GRID_SIZE=45;
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
const status=document.querySelector('[data-cw-status]'),saveKey=`${puzzleId}:progress`,completeKey=`${puzzleId}:complete`;
const board=new Map(),placements=[],members=new Map();
const key=(r,c)=>`${r}:${c}`;
const parseKey=k=>k.split(':').map(Number);
const inBounds=(r,c)=>r>=0&&c>=0&&r<GRID_SIZE&&c<GRID_SIZE;

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
const saved=(()=>{try{return JSON.parse(localStorage.getItem(saveKey)||'{}')}catch{return{}}})();
for(let r=minR;r<=maxR;r++)for(let c=minC;c<=maxC;c++){
  const k=key(r,c),data=board.get(k),box=document.createElement('div');box.className='fmb-cell'+(data?'':' block');box.dataset.key=k;
  if(data){const n=numbers.get(k);if(n){const num=document.createElement('span');num.className='fmb-cell-number';num.textContent=n;box.append(num)}const input=document.createElement('input');input.maxLength=1;input.autocomplete='off';input.autocapitalize='characters';input.spellcheck=false;input.inputMode='text';input.setAttribute('aria-label',`Crossword row ${r-minR+1} column ${c-minC+1}`);input.value=(saved[k]||'').slice(0,1).toUpperCase();box.append(input)}
  gridEl.append(box)
}
const cellNodes=()=>[...gridEl.querySelectorAll('.fmb-cell:not(.block)')];
const wordById=id=>placements.find(w=>w.id===id);
const wordKeys=w=>[...w.answer].map((_,i)=>key(w.r+(w.dir==='D'?i:0),w.c+(w.dir==='A'?i:0)));
let selectedWord=placements[0].id,selectedKey='';
function save(){const data={};for(const box of cellNodes()){const v=box.querySelector('input').value.toUpperCase();if(v)data[box.dataset.key]=v}localStorage.setItem(saveKey,JSON.stringify(data))}
function selectWord(id,focusKey){selectedWord=id;const w=wordById(id),keys=wordKeys(w);if(focusKey)selectedKey=focusKey;cellNodes().forEach(b=>{b.classList.toggle('same-word',keys.includes(b.dataset.key));b.classList.toggle('selected',b.dataset.key===selectedKey)});document.querySelectorAll('.fmb-clue').forEach(c=>c.toggleAttribute('data-selected',c.dataset.word===id));if(focusKey)gridEl.querySelector(`[data-key="${focusKey}"] input`)?.focus()}
function focusInWord(offset){const w=wordById(selectedWord),keys=wordKeys(w),idx=Math.max(0,keys.indexOf(selectedKey)),next=keys[Math.min(keys.length-1,Math.max(0,idx+offset))];selectWord(w.id,next)}
function nextEmpty(w){return wordKeys(w).find(k=>!gridEl.querySelector(`[data-key="${k}"] input`)?.value)||wordKeys(w)[0]}
function renderClues(dir,target){const el=document.querySelector(target),items=placements.filter(w=>w.dir===dir).sort((a,b)=>a.n-b.n);el.innerHTML=items.map(w=>`<div class="fmb-clue" data-word="${w.id}"><strong>${w.n}</strong><button type="button" data-clue-word="${w.id}">${w.clue}</button></div>`).join('')}
renderClues('A','[data-cw-across]');renderClues('D','[data-cw-down]');
document.querySelectorAll('[data-clue-word]').forEach(b=>b.addEventListener('click',()=>{const w=wordById(b.dataset.clueWord);selectWord(w.id,nextEmpty(w))}));
gridEl.addEventListener('focusin',e=>{const box=e.target.closest('.fmb-cell:not(.block)');if(!box)return;selectedKey=box.dataset.key;const ids=members.get(selectedKey)||[];if(!ids.includes(selectedWord))selectedWord=ids[0];selectWord(selectedWord,selectedKey)});
gridEl.addEventListener('click',e=>{const box=e.target.closest('.fmb-cell:not(.block)');if(!box)return;const ids=members.get(box.dataset.key)||[];if(ids.length>1&&box.dataset.key===selectedKey){const i=ids.indexOf(selectedWord);selectedWord=ids[(i+1)%ids.length]}selectWord(selectedWord,box.dataset.key)});
gridEl.addEventListener('input',e=>{if(!e.target.matches('input'))return;e.target.value=e.target.value.replace(/[^a-z]/gi,'').slice(-1).toUpperCase();e.target.closest('.fmb-cell').classList.remove('wrong','correct');save();if(e.target.value)focusInWord(1);checkCompletion(false)});
gridEl.addEventListener('keydown',e=>{if(!e.target.matches('input'))return;if(e.key==='Backspace'&&!e.target.value){e.preventDefault();focusInWord(-1)}if(e.key===' '){e.preventDefault();const ids=members.get(selectedKey)||[];if(ids.length>1){const i=ids.indexOf(selectedWord);selectWord(ids[(i+1)%ids.length],selectedKey)}}if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();focusInWord(1)}if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();focusInWord(-1)}});
function mark(keys){let wrong=0,empty=0;for(const k of keys){const box=gridEl.querySelector(`[data-key="${k}"]`),input=box?.querySelector('input');if(!input)continue;const expected=board.get(k).letter;box.classList.remove('wrong','correct');if(!input.value){empty++;continue}if(input.value.toUpperCase()===expected)box.classList.add('correct');else{box.classList.add('wrong');wrong++}}return{wrong,empty}}
function checkCompletion(announce=true){const result=mark([...board.keys()]);if(result.wrong===0&&result.empty===0){localStorage.setItem(completeKey,new Date().toISOString());status.textContent='Puzzle complete. You solved this week’s FMB current-events crossword.';return true}if(announce)status.textContent=result.wrong?`${result.wrong} letter${result.wrong===1?'':'s'} need another look.`:`${result.empty} square${result.empty===1?'':'s'} still open.`;return false}
document.querySelector('[data-cw-check]').onclick=()=>checkCompletion(true);
document.querySelector('[data-cw-check-word]').onclick=()=>{const w=wordById(selectedWord),r=mark(wordKeys(w));status.textContent=r.wrong?`${w.display||w.answer}: ${r.wrong} letter${r.wrong===1?'':'s'} need another look.`:r.empty?`${w.display||w.answer}: no wrong letters yet; ${r.empty} square${r.empty===1?'':'s'} open.`:`${w.display||w.answer} is correct.`};
document.querySelector('[data-cw-reset]').onclick=()=>{if(!confirm('Clear your saved progress for this week?'))return;localStorage.removeItem(saveKey);localStorage.removeItem(completeKey);for(const box of cellNodes()){box.querySelector('input').value='';box.classList.remove('correct','wrong')}status.textContent='Puzzle reset.';selectWord(placements[0].id,nextEmpty(placements[0]))};

const releaseEl=document.querySelector('[data-cw-released-answers]'),policyEl=document.querySelector('[data-cw-answer-policy]');
if(releasedPuzzles.length&&releaseEl){releaseEl.innerHTML=releasedPuzzles.map(p=>`<div><strong>${p.week}</strong><span>${p.answers.join(' · ')}</span></div>`).join('');if(policyEl)policyEl.textContent='The active puzzle remains unrevealed. Only completed previous-week answer keys are published here.'}
selectWord(placements[0].id,nextEmpty(placements[0]));if(localStorage.getItem(completeKey))status.textContent='Completed this week. Your progress is saved on this device.';
})();
