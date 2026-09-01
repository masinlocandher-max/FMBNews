(()=>{
const puzzleId='fmb-current-events-2026-09-01';
const SIZE=11;
const words=[
{id:'bcda',n:1,dir:'A',r:0,c:6,answer:'BCDA',clue:'Government corporation leading New Clark City development discussions tied to Pax Silica.'},
{id:'duterte',n:2,dir:'D',r:0,c:8,answer:'DUTERTE',clue:'Surname of the vice president whose impeachment trial is underway.'},
{id:'paxsilica',n:3,dir:'D',r:2,c:4,answer:'PAXSILICA',display:'PAX SILICA',clue:'U.S.-led initiative tied to a proposed high-tech industrial hub in New Clark City.'},
{id:'impeachment',n:4,dir:'A',r:3,c:0,answer:'IMPEACHMENT',clue:'Constitutional process at the center of the current Senate trial of Vice President Sara Duterte.'},
{id:'padilla',n:5,dir:'D',r:3,c:2,answer:'PADILLA',clue:'Surname of Senator Robin, a recurring figure in current national political coverage.'},
{id:'senate',n:6,dir:'A',r:5,c:4,answer:'SENATE',clue:'Chamber currently convened as the impeachment court.'},
{id:'aeta',n:7,dir:'D',r:7,c:7,answer:'AETA',clue:'Indigenous people whose community and livelihood concerns are part of the Pax Silica debate.'},
{id:'deped',n:8,dir:'A',r:8,c:6,answer:'DEPED',clue:'Department whose confidential-fund records feature in current impeachment-trial testimony.'},
{id:'tarlac',n:9,dir:'A',r:10,c:3,answer:'TARLAC',clue:'Province where New Clark City, the proposed Pax Silica hub location, is situated.'}
];
const gridEl=document.querySelector('[data-cw-grid]');if(!gridEl)return;
const status=document.querySelector('[data-cw-status]'),saveKey=`${puzzleId}:progress`,completeKey=`${puzzleId}:complete`;
const cells=new Map(),members=new Map();let selectedWord=words[0].id,selectedKey='';
const key=(r,c)=>`${r}:${c}`;
for(const w of words){for(let i=0;i<w.answer.length;i++){const r=w.r+(w.dir==='D'?i:0),c=w.c+(w.dir==='A'?i:0),k=key(r,c),letter=w.answer[i];if(!cells.has(k))cells.set(k,{r,c,letter,number:null});if(!members.has(k))members.set(k,[]);members.get(k).push(w.id)}const start=cells.get(key(w.r,w.c));start.number=w.n}
const saved=(()=>{try{return JSON.parse(localStorage.getItem(saveKey)||'{}')}catch{return{}}})();
gridEl.style.gridTemplateColumns=`repeat(${SIZE},1fr)`;
for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){const k=key(r,c),data=cells.get(k),box=document.createElement('div');box.className='fmb-cell'+(data?'':' block');box.dataset.key=k;if(data){if(data.number){const num=document.createElement('span');num.className='fmb-cell-number';num.textContent=data.number;box.append(num)}const input=document.createElement('input');input.maxLength=1;input.autocomplete='off';input.autocapitalize='characters';input.spellcheck=false;input.inputMode='text';input.setAttribute('aria-label',`Crossword row ${r+1} column ${c+1}`);input.value=(saved[k]||'').slice(0,1).toUpperCase();box.append(input)}gridEl.append(box)}
const cellNodes=()=>[...gridEl.querySelectorAll('.fmb-cell:not(.block)')];
function wordById(id){return words.find(w=>w.id===id)}
function wordKeys(w){return [...w.answer].map((_,i)=>key(w.r+(w.dir==='D'?i:0),w.c+(w.dir==='A'?i:0)))}
function save(){const data={};for(const box of cellNodes()){const v=box.querySelector('input').value.toUpperCase();if(v)data[box.dataset.key]=v}localStorage.setItem(saveKey,JSON.stringify(data))}
function selectWord(id,focusKey){selectedWord=id;const w=wordById(id),keys=wordKeys(w);cellNodes().forEach(b=>{b.classList.toggle('same-word',keys.includes(b.dataset.key));b.classList.toggle('selected',b.dataset.key===(focusKey||selectedKey))});document.querySelectorAll('.fmb-clue').forEach(c=>c.toggleAttribute('data-selected',c.dataset.word===id));if(focusKey){selectedKey=focusKey;const box=gridEl.querySelector(`[data-key="${focusKey}"]`);box?.querySelector('input')?.focus();cellNodes().forEach(b=>b.classList.toggle('selected',b.dataset.key===focusKey))}}
function focusInWord(offset){const w=wordById(selectedWord),keys=wordKeys(w),idx=Math.max(0,keys.indexOf(selectedKey)),next=keys[Math.min(keys.length-1,Math.max(0,idx+offset))];selectWord(w.id,next)}
function nextEmpty(w){const k=wordKeys(w).find(k=>!gridEl.querySelector(`[data-key="${k}"] input`)?.value);return k||wordKeys(w)[0]}
function renderClues(dir,target){const el=document.querySelector(target);el.innerHTML=words.filter(w=>w.dir===dir).map(w=>`<div class="fmb-clue" data-word="${w.id}"><strong>${w.n}</strong><button type="button" data-clue-word="${w.id}">${w.clue}</button></div>`).join('')}
renderClues('A','[data-cw-across]');renderClues('D','[data-cw-down]');
document.querySelectorAll('[data-clue-word]').forEach(b=>b.addEventListener('click',()=>{const w=wordById(b.dataset.clueWord);selectWord(w.id,nextEmpty(w))}));
gridEl.addEventListener('focusin',e=>{const box=e.target.closest('.fmb-cell:not(.block)');if(!box)return;selectedKey=box.dataset.key;const ids=members.get(selectedKey)||[];if(!ids.includes(selectedWord))selectedWord=ids[0];selectWord(selectedWord,selectedKey)});
gridEl.addEventListener('click',e=>{const box=e.target.closest('.fmb-cell:not(.block)');if(!box)return;const ids=members.get(box.dataset.key)||[];if(ids.length>1&&box.dataset.key===selectedKey){const i=ids.indexOf(selectedWord);selectedWord=ids[(i+1)%ids.length]}selectWord(selectedWord,box.dataset.key)});
gridEl.addEventListener('input',e=>{if(!e.target.matches('input'))return;e.target.value=e.target.value.replace(/[^a-z]/gi,'').slice(-1).toUpperCase();e.target.closest('.fmb-cell').classList.remove('wrong','correct');save();if(e.target.value)focusInWord(1);checkCompletion(false)});
gridEl.addEventListener('keydown',e=>{if(!e.target.matches('input'))return;if(e.key==='Backspace'&&!e.target.value){e.preventDefault();focusInWord(-1);const box=gridEl.querySelector(`[data-key="${selectedKey}"]`);box?.querySelector('input')?.select()}if(e.key===' '){e.preventDefault();const ids=members.get(selectedKey)||[];if(ids.length>1){const i=ids.indexOf(selectedWord);selectWord(ids[(i+1)%ids.length],selectedKey)}}if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();focusInWord(1)}if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();focusInWord(-1)}});
function mark(keys){let wrong=0,empty=0;for(const k of keys){const box=gridEl.querySelector(`[data-key="${k}"]`),input=box.querySelector('input'),expected=cells.get(k).letter;box.classList.remove('wrong','correct');if(!input.value){empty++;continue}if(input.value.toUpperCase()===expected)box.classList.add('correct');else{box.classList.add('wrong');wrong++}}return{wrong,empty}}
function checkCompletion(announce=true){const all=[...cells.keys()],result=mark(all);if(result.wrong===0&&result.empty===0){localStorage.setItem(completeKey,new Date().toISOString());status.textContent='Puzzle complete. You solved this week’s FMB current-events crossword.';return true}if(announce)status.textContent=result.wrong?`${result.wrong} letter${result.wrong===1?'':'s'} need another look.`:`${result.empty} square${result.empty===1?'':'s'} still open.`;return false}
document.querySelector('[data-cw-check]').onclick=()=>checkCompletion(true);
document.querySelector('[data-cw-check-word]').onclick=()=>{const w=wordById(selectedWord),r=mark(wordKeys(w));status.textContent=r.wrong?`${w.display||w.answer}: ${r.wrong} letter${r.wrong===1?'':'s'} need another look.`:r.empty?`${w.display||w.answer}: no wrong letters yet; ${r.empty} square${r.empty===1?'':'s'} open.`:`${w.display||w.answer} is correct.`};
function reveal(keys,label){for(const k of keys){const box=gridEl.querySelector(`[data-key="${k}"]`);box.querySelector('input').value=cells.get(k).letter;box.classList.add('correct');box.classList.remove('wrong')}save();status.textContent=label;checkCompletion(false)}
document.querySelector('[data-cw-reveal-letter]').onclick=()=>{if(!selectedKey){status.textContent='Select a square first.';return}if(confirm('Reveal this letter?'))reveal([selectedKey],'Letter revealed.')};
document.querySelector('[data-cw-reveal-word]').onclick=()=>{const w=wordById(selectedWord);if(confirm(`Reveal ${w.n} ${w.dir==='A'?'Across':'Down'}?`))reveal(wordKeys(w),'Word revealed.')};
document.querySelector('[data-cw-reveal-puzzle]').onclick=()=>{if(confirm('Reveal the entire crossword?'))reveal([...cells.keys()],'Puzzle revealed.')};
document.querySelector('[data-cw-reset]').onclick=()=>{if(!confirm('Clear your saved progress for this week?'))return;localStorage.removeItem(saveKey);localStorage.removeItem(completeKey);for(const box of cellNodes()){box.querySelector('input').value='';box.classList.remove('correct','wrong')}status.textContent='Puzzle reset.';selectWord(words[0].id,nextEmpty(words[0]))};
selectWord(words[0].id,nextEmpty(words[0]));if(localStorage.getItem(completeKey))status.textContent='Completed this week. You can replay or reset the puzzle.';
})();
