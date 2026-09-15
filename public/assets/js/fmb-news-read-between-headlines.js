(()=>{
'use strict';

const EDITION_ID='fmb-current-events-mix-v4';
const PREVIOUS_EDITION_ID=null;
const STORAGE_KEY='fmbReadBetweenHeadlinesV1';
const RUN_KEY='fmbReadBetweenHeadlinesActiveRunV1';
const POINTS_PER_CORRECT=10;
const QUESTION_SECONDS=30;
const PASS_CORRECT=21;
const RETRY_COOLDOWN_MS=24*60*60*1000;

const questions=[
  {id:'q01',category:'Philippines',type:'single_select',prompt:'Which Philippine region is holding its first parliamentary election in 2026?',options:['BARMM','CAR','NCR','Region XII'],answer:'BARMM'},
  {id:'q02',category:'Philippines',type:'identification',prompt:'Approximately how many registered voters are in the Bangsamoro region for the 2026 parliamentary election?',answer:'2.393 million',aliases:['2.393m','2.393 million voters','2393000','2,393,000']},
  {id:'q03',category:'Philippines',type:'identification',prompt:'How many seats make up the Bangsamoro Parliament in the 2026 election?',answer:'80',aliases:['eighty','80 seats']},
  {id:'q04',category:'Philippines',type:'single_select',prompt:'Of the 80 Bangsamoro parliamentary seats, how many are designated for party representatives?',options:['40','32','8','20'],answer:'40'},
  {id:'q05',category:'Nation',type:'identification',prompt:'What was the name of the passenger vessel that caught fire off Coron, Palawan?',answer:'MV June Aster',aliases:['June Aster','MV June Aster']},
  {id:'q06',category:'Nation',type:'single_select',prompt:'According to the Philippine Coast Guard’s initial inquiry, where did the MV June Aster fire begin?',options:['Cargo hold','Engine room','Passenger deck','Galley'],answer:'Cargo hold'},
  {id:'q07',category:'Environment',type:'single_select',prompt:'What alert level remains in effect over Mayon Volcano after its recent ash emission?',options:['Alert Level 2','Alert Level 1','Alert Level 3','Alert Level 4'],answer:'Alert Level 2'},
  {id:'q08',category:'Environment',type:'identification',prompt:'How wide is Mayon Volcano’s Permanent Danger Zone?',answer:'6 kilometers',aliases:['6 km','6km','six kilometers','6 kilometer']},
  {id:'q09',category:'Environment',type:'single_select',prompt:'Which Negros volcano recently emitted ash while remaining under Alert Level 2?',options:['Kanlaon','Taal','Bulusan','Hibok-Hibok'],answer:'Kanlaon'},
  {id:'q10',category:'Environment',type:'identification',prompt:'How wide is Kanlaon Volcano’s Permanent Danger Zone?',answer:'4 kilometers',aliases:['4 km','4km','four kilometers','4 kilometer']},
  {id:'q11',category:'Energy',type:'single_select',prompt:'Which Philippine power grid was placed under both red and yellow alerts because of limited power supply?',options:['Visayas','Luzon','Palawan','Batanes'],answer:'Visayas'},
  {id:'q12',category:'Environment',type:'single_select',prompt:'Smoke from forest fires in which Indonesian region contributed to haze over parts of the Philippines?',options:['Kalimantan','Java','Bali','Sulawesi'],answer:'Kalimantan'},
  {id:'q13',category:'Environment',type:'true_false',prompt:'The Southwest Monsoon, or Habagat, helped transport smoke from Indonesian forest fires toward parts of the Philippines.',options:['True','False'],answer:'True'},
  {id:'q14',category:'Technology',type:'identification',prompt:'Which technology company said it would send a technical team to study possible integration of the Philippine National ID system into its platforms?',answer:'Meta',aliases:['Meta Platforms','Facebook Meta']},
  {id:'q15',category:'Science',type:'single_select',prompt:'Project PAGPAWI is developing emergency water-filtration materials using what kind of waste?',options:['Wood waste','Plastic waste','Glass waste','Textile waste'],answer:'Wood waste'},
  {id:'q16',category:'Economy',type:'single_select',prompt:'The 2026 Luzon Economic Corridor Investment Forum was co-hosted by the Philippines together with which two countries?',options:['United States and Japan','China and South Korea','Australia and India','Singapore and Malaysia'],answer:'United States and Japan'},
  {id:'q17',category:'Economy',type:'single_select',prompt:'How large is the U.S. Threshold Program grant signed to help strengthen Philippine eligibility for a future MCC Compact?',options:['$60 million','$20 million','$100 million','$250 million'],answer:'$60 million'},
  {id:'q18',category:'Technology',type:'true_false',prompt:'The Philippines is pushing for stronger ASEAN-wide safeguards to protect young people online as digital technologies expand.',options:['True','False'],answer:'True'},
  {id:'q19',category:'P-Pop',type:'identification',prompt:'Which two P-pop groups were the only idol groups in Billboard Philippines’ mid-year Top 10 Artists of 2026?',answer:'SB19 and BINI',aliases:['BINI and SB19','SB19 BINI','BINI SB19']},
  {id:'q20',category:'P-Pop',type:'single_select',prompt:'What was SB19’s rank in Billboard Philippines’ mid-year Top 10 Artists of 2026?',options:['No. 6','No. 3','No. 9','No. 1'],answer:'No. 6',aliases:['6','number 6']},
  {id:'q21',category:'P-Pop',type:'single_select',prompt:'What was BINI’s rank in Billboard Philippines’ mid-year Top 10 Artists of 2026?',options:['No. 9','No. 6','No. 4','No. 2'],answer:'No. 9',aliases:['9','number 9']},
  {id:'q22',category:'P-Pop',type:'identification',prompt:'Which SB19 song became the first P-pop track to reach No. 1 on Billboard’s World Digital Song Sales chart?',answer:'DAM'},
  {id:'q23',category:'P-Pop',type:'single_select',prompt:'Which release topped Billboard Philippines’ fan poll for favorite P-pop release of the first half of 2026?',options:['Wakas At Simula — SB19','Signals — BINI','TABI — XONARA','DARAMA — OONA.'],answer:'Wakas At Simula — SB19',aliases:['Wakas At Simula','SB19 Wakas At Simula']},
  {id:'q24',category:'P-Pop',type:'identification',prompt:'Which rookie P-pop girl group placed second in that fan poll with the song “TABI”?',answer:'XONARA'},
  {id:'q25',category:'P-Pop',type:'single_select',prompt:'Which P-pop girl group is set to represent the Philippines at the 2026 ROUND Music Festival in South Korea?',options:['KAIA','G22','BINI','YARA'],answer:'KAIA'},
  {id:'q26',category:'P-Pop',type:'true_false',prompt:'HORI7ON said leaving MLD Entertainment and ABS-CBN meant the group was disbanding.',options:['True','False'],answer:'False'},
  {id:'q27',category:'OPM',type:'single_select',prompt:'Which act received the most Grand Awards nominations at the 39th Awit Awards?',options:['IV OF SPADES','SB19','Cup of Joe','Maki'],answer:'IV OF SPADES'},
  {id:'q28',category:'Sports',type:'single_select',prompt:'Which team did Gilas Pilipinas defeat, 109–78, for its first win at the 2026 Asian Games?',options:['Kazakhstan','Bahrain','Japan','Qatar'],answer:'Kazakhstan'},
  {id:'q29',category:'Sports',type:'single_select',prompt:'Who were named the Philippines’ flag bearers for the 2026 Asian Games opening ceremony?',options:['Aira Villegas and Albert Ian delos Santos','EJ Obiena and Hidilyn Diaz','Carlos Yulo and Nesthy Petecio','June Mar Fajardo and Vanessa Sarno'],answer:'Aira Villegas and Albert Ian delos Santos'},
  {id:'q30',category:'World Sports',type:'single_select',prompt:'Who defeated Aryna Sabalenka to win the 2026 US Open women’s singles title?',options:['Elena Rybakina','Iga Świątek','Coco Gauff','Naomi Osaka'],answer:'Elena Rybakina'}
];

if(questions.length!==30)throw new Error('Read Between the Headlines requires exactly 30 questions.');

const root=document.querySelector('[data-rbt-root]');
if(!root)return;
const $=(sel)=>root.querySelector(sel);
const startView=$('[data-rbt-start]');
const gameView=$('[data-rbt-game]');
const resultView=$('[data-rbt-result]');
const startButton=$('[data-rbt-start-button]');
const nameInput=$('[data-rbt-player]');
const emailInput=$('[data-rbt-email]');
const entryError=$('[data-rbt-player-error]');
const entryNote=$('[data-rbt-player-note]');
const questionNo=$('[data-rbt-question-no]');
const categoryLabel=$('[data-rbt-category]');
const typeLabel=$('[data-rbt-type]');
const promptEl=$('[data-rbt-prompt]');
const answerArea=$('[data-rbt-answer]');
const submitButton=$('[data-rbt-submit]');
const skipButton=$('[data-rbt-skip]');
const feedback=$('[data-rbt-feedback]');
const scoreEl=$('[data-rbt-score]');
const lifetimeEl=$('[data-rbt-lifetime]');
const timerEl=$('[data-rbt-timer]');
const progressFill=$('[data-rbt-progress-fill]');
const resultScore=$('[data-rbt-result-score]');
const resultCorrect=$('[data-rbt-result-correct]');
const resultLifetime=$('[data-rbt-result-lifetime]');
const resultTime=$('[data-rbt-result-time]');
const resultMark=$('[data-rbt-result-mark]');

const normalize=(value)=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[₱$,.'’“”\-–—]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
const validEmail=(value)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim());
const makeId=()=>window.crypto?.randomUUID?.()||`player-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const shuffle=(items)=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const formatTime=(total)=>{const safe=Math.max(0,Math.floor(Number(total)||0));const m=Math.floor(safe/60),s=safe%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;};
const formatCooldown=(ms)=>{const mins=Math.max(1,Math.ceil(ms/60000));const h=Math.floor(mins/60),m=mins%60;return h?`${h}h ${m}m`:`${m}m`;};

function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch{return fallback;}}
function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
function readProfile(){
  const parsed=readJSON(STORAGE_KEY,{});
  return {
    playerId:parsed.playerId||makeId(),
    playerName:parsed.playerName||'',
    email:parsed.email||'',
    joinedEditionId:parsed.joinedEditionId||'',
    lifetimePoints:Number(parsed.lifetimePoints||0),
    completedEditions:Array.isArray(parsed.completedEditions)?parsed.completedEditions:[],
    passedEditions:Array.isArray(parsed.passedEditions)?parsed.passedEditions:[],
    editionResults:parsed.editionResults&&typeof parsed.editionResults==='object'?parsed.editionResults:{}
  };
}

let profile=readProfile();
let activeQuestions=[];
let index=0,score=0,correctCount=0,locked=false,answered=[];
let activeRun=false,startedAt=0,finishing=false;
let questionDeadline=0,questionTimerId=null,pendingForfeitResult=null;
let selectedAnswerValue=null,selectedAnswerControl=null;
let attemptMode='scored';

function persistProfile(){writeJSON(STORAGE_KEY,profile);}
function readRun(){return readJSON(RUN_KEY,null);}
function persistRun(run){writeJSON(RUN_KEY,run);}
function clearRun(){try{localStorage.removeItem(RUN_KEY);}catch{}}
function typeName(type){if(type==='single_select')return 'Multiple Choice';if(type==='true_false')return 'True or False';return 'Identification';}
function validAnswers(q){return [q.answer,...(q.aliases||[])].map(normalize);}
function elapsedSeconds(){return startedAt?Math.max(0,Math.floor((Date.now()-startedAt)/1000)):0;}
function emptyEditionRecord(){return {attempts:[],passed:false,passedAt:0,lastAttemptAt:0,nextRetryAt:0,scoredPoints:0,bestCorrect:0,bestScore:0};}
function editionRecord(id=EDITION_ID){
  const raw=profile.editionResults[id];
  if(!raw||typeof raw!=='object')return emptyEditionRecord();
  if(Array.isArray(raw.attempts))return {...emptyEditionRecord(),...raw,attempts:raw.attempts};
  if(raw.status){
    const passed=raw.status==='completed'&&Number(raw.correctCount||0)>=PASS_CORRECT;
    return {...emptyEditionRecord(),attempts:[{...raw,passed,scoredAttempt:true,attemptNumber:1}],passed,passedAt:passed?Number(raw.finishedAt||0):0,lastAttemptAt:Number(raw.finishedAt||0),nextRetryAt:passed?0:Number(raw.finishedAt||0)+RETRY_COOLDOWN_MS,scoredPoints:Number(raw.score||0),bestCorrect:Number(raw.correctCount||0),bestScore:Number(raw.score||0)};
  }
  return {...emptyEditionRecord(),...raw};
}
function lastAttempt(record){return record.attempts.length?record.attempts[record.attempts.length-1]:null;}
function hasPassedEdition(id){return !id||profile.passedEditions.includes(id)||editionRecord(id).passed;}
function remainingCooldown(record){return Math.max(0,Number(record.nextRetryAt||0)-Date.now());}
function accessState(){
  const record=editionRecord();
  if(record.passed)return {allowed:false,reason:'passed',record};
  if(profile.joinedEditionId&&PREVIOUS_EDITION_ID&&!hasPassedEdition(PREVIOUS_EDITION_ID))return {allowed:false,reason:'previous',record};
  if(record.attempts.length===0)return {allowed:true,mode:'scored',record};
  const wait=remainingCooldown(record);
  if(wait>0)return {allowed:false,reason:'cooldown',wait,record};
  return {allowed:true,mode:'qualification',record};
}

function refreshEntryState(){
  const state=accessState();
  if(!startButton)return;
  startButton.disabled=!state.allowed;
  if(state.reason==='passed'){
    startButton.textContent='Edition Passed';
    if(entryNote)entryNote.textContent='You passed this edition. The next weekly challenge unlocks when it is released.';
    return;
  }
  if(state.reason==='previous'){
    startButton.textContent='Edition Locked';
    if(entryNote)entryNote.textContent='Pass your previous required edition before opening this one.';
    return;
  }
  if(state.reason==='cooldown'){
    startButton.textContent='Retry Locked';
    if(entryNote)entryNote.textContent=`Qualification retry opens in ${formatCooldown(state.wait)}. Use the time to review the week.`;
    return;
  }
  if(state.mode==='qualification'){
    startButton.textContent='Start Qualification Retry';
    if(entryNote)entryNote.textContent=`Pass ${PASS_CORRECT}/30 to progress. Retry points do not add to lifetime points.`;
    return;
  }
  startButton.textContent='Start the Challenge';
  if(entryNote)entryNote.textContent=`Your first run is the only scored attempt. Pass ${PASS_CORRECT}/30 to progress.`;
}

function setNavigationLocked(isLocked){
  document.body.classList.toggle('rbt-run-active',isLocked);
  document.querySelectorAll('a').forEach((link)=>{
    if(isLocked){
      if(!link.hasAttribute('data-rbt-prev-tabindex'))link.setAttribute('data-rbt-prev-tabindex',link.getAttribute('tabindex')??'');
      link.setAttribute('tabindex','-1');
      link.setAttribute('aria-disabled','true');
    }else{
      const prev=link.getAttribute('data-rbt-prev-tabindex');
      if(prev===null)return;
      if(prev==='')link.removeAttribute('tabindex');else link.setAttribute('tabindex',prev);
      link.removeAttribute('data-rbt-prev-tabindex');
      link.removeAttribute('aria-disabled');
    }
  });
}

function stopQuestionTimer(){
  if(questionTimerId){clearInterval(questionTimerId);questionTimerId=null;}
  if(timerEl){timerEl.removeAttribute('data-warning');timerEl.removeAttribute('data-critical');}
}

function updateQuestionTimer(){
  if(!activeRun||locked)return;
  const remaining=Math.max(0,Math.ceil((questionDeadline-Date.now())/1000));
  if(timerEl){
    timerEl.textContent=formatTime(remaining);
    timerEl.dataset.warning=remaining<=10?'true':'false';
    timerEl.dataset.critical=remaining<=5?'true':'false';
  }
  if(remaining<=0){stopQuestionTimer();timeoutQuestion();}
}

function startQuestionTimer(){
  stopQuestionTimer();
  questionDeadline=Date.now()+QUESTION_SECONDS*1000;
  updateQuestionTimer();
  questionTimerId=setInterval(updateQuestionTimer,250);
}

function saveActiveRun(status='active'){
  persistRun({editionId:EDITION_ID,status,attemptMode,startedAt,updatedAt:Date.now(),questionIndex:index,score,correctCount,questionDeadline});
}

function clearSelection(){
  selectedAnswerValue=null;selectedAnswerControl=null;
  answerArea.querySelectorAll('.rbt-option').forEach((button)=>{
    button.removeAttribute('data-selected');button.setAttribute('aria-pressed','false');
  });
}

function selectOption(value,button){
  if(locked||!activeRun)return;
  clearSelection();
  selectedAnswerValue=value;selectedAnswerControl=button;
  button.dataset.selected='true';button.setAttribute('aria-pressed','true');
  submitButton.disabled=false;
  feedback.textContent='Answer selected. Lock it in before time runs out.';feedback.dataset.state='neutral';
}

function renderQuestion(){
  const q=activeQuestions[index];
  locked=false;selectedAnswerValue=null;selectedAnswerControl=null;
  root.classList.remove('rbt-answer-locked','rbt-answer-resolved');
  root.classList.add('rbt-question-entering');setTimeout(()=>root.classList.remove('rbt-question-entering'),460);
  questionNo.textContent=`Question ${index+1} of ${activeQuestions.length}`;
  categoryLabel.textContent=q.category;
  typeLabel.textContent=typeName(q.type);
  promptEl.textContent=q.prompt;
  scoreEl.textContent=score.toLocaleString('en-PH');
  lifetimeEl.textContent=profile.lifetimePoints.toLocaleString('en-PH');
  progressFill.style.width=`${(index/activeQuestions.length)*100}%`;
  feedback.textContent='';feedback.dataset.state='';answerArea.innerHTML='';
  submitButton.hidden=false;submitButton.textContent='Lock Answer';submitButton.disabled=q.type!=='identification';skipButton.disabled=false;

  if(q.type==='identification'){
    const input=document.createElement('input');
    input.className='rbt-identification';input.type='text';input.autocomplete='off';input.spellcheck=false;input.placeholder='Type your answer';input.setAttribute('aria-label','Your answer');
    input.addEventListener('input',()=>{submitButton.disabled=!input.value.trim();});
    input.addEventListener('keydown',(event)=>{if(event.key==='Enter'&&input.value.trim()){event.preventDefault();lockCurrentAnswer();}});
    answerArea.append(input);setTimeout(()=>input.focus(),0);submitButton.disabled=true;
  }else{
    const group=document.createElement('div');group.className='rbt-options';
    shuffle(q.options).forEach((option)=>{
      const button=document.createElement('button');button.type='button';button.className='rbt-option';button.textContent=option;button.setAttribute('aria-pressed','false');
      button.addEventListener('click',()=>selectOption(option,button));group.append(button);
    });
    answerArea.append(group);
  }

  startQuestionTimer();
  saveActiveRun();
}

function disableQuestionControls(){
  submitButton.disabled=true;skipButton.disabled=true;
  answerArea.querySelectorAll('button,input').forEach((el)=>{el.disabled=true;});
}

function resolveAnswer(value,control){
  if(!activeRun)return;
  const q=activeQuestions[index];
  const isCorrect=validAnswers(q).includes(normalize(value));
  root.classList.remove('rbt-answer-locked');root.classList.add('rbt-answer-resolved');
  if(isCorrect){
    score+=POINTS_PER_CORRECT;correctCount++;
    feedback.textContent=`Correct. +${POINTS_PER_CORRECT} points.`;feedback.dataset.state='correct';
    if(control)control.dataset.chosen='correct';
  }else{
    feedback.textContent='Not this one. The correct answer stays hidden.';feedback.dataset.state='wrong';
    if(control)control.dataset.chosen='wrong';
  }
  answered.push({id:q.id,correct:isCorrect});
  scoreEl.textContent=score.toLocaleString('en-PH');saveActiveRun();setTimeout(nextQuestion,900);
}

function commitAnswer(value,control){
  if(locked||!activeRun)return;
  locked=true;stopQuestionTimer();disableQuestionControls();
  root.classList.add('rbt-answer-locked');
  if(control)control.dataset.chosen='locked';
  feedback.textContent='Answer locked.';feedback.dataset.state='neutral';
  setTimeout(()=>resolveAnswer(value,control),430);
}

function lockCurrentAnswer(){
  if(locked||!activeRun)return;
  const q=activeQuestions[index];
  if(q.type==='identification'){
    const input=answerArea.querySelector('input');
    if(!input||!input.value.trim()){
      feedback.textContent='Enter an answer first, or skip this question.';feedback.dataset.state='neutral';input?.focus();return;
    }
    commitAnswer(input.value,input);return;
  }
  if(selectedAnswerValue===null||!selectedAnswerControl){
    feedback.textContent='Choose an answer before locking it in.';feedback.dataset.state='neutral';return;
  }
  commitAnswer(selectedAnswerValue,selectedAnswerControl);
}

function skipQuestion(){
  if(locked||!activeRun)return;
  locked=true;stopQuestionTimer();root.classList.remove('rbt-answer-locked');
  answered.push({id:activeQuestions[index].id,correct:false,skipped:true});
  feedback.textContent='Skipped. 0 points. The answer stays hidden.';feedback.dataset.state='neutral';
  disableQuestionControls();saveActiveRun();setTimeout(nextQuestion,600);
}

function timeoutQuestion(){
  if(locked||!activeRun)return;
  locked=true;root.classList.add('rbt-time-expired');
  answered.push({id:activeQuestions[index].id,correct:false,timedOut:true});
  feedback.textContent='Time. 0 points. The answer stays hidden.';feedback.dataset.state='wrong';
  disableQuestionControls();saveActiveRun();setTimeout(()=>{root.classList.remove('rbt-time-expired');nextQuestion();},760);
}

function nextQuestion(){
  if(!activeRun)return;
  index++;
  if(index<activeQuestions.length){renderQuestion();return;}
  finishGame();
}

function recordEdition(result){
  const record=editionRecord();
  const isFirst=record.attempts.length===0;
  const passed=result.status==='completed'&&Number(result.correctCount||0)>=PASS_CORRECT;
  const saved={...result,passed,scoredAttempt:isFirst,attemptNumber:record.attempts.length+1};
  record.attempts.push(saved);
  record.lastAttemptAt=Number(saved.finishedAt||Date.now());
  record.bestCorrect=Math.max(Number(record.bestCorrect||0),Number(saved.correctCount||0));
  record.bestScore=Math.max(Number(record.bestScore||0),Number(saved.score||0));
  if(isFirst){
    record.scoredPoints=Number(saved.score||0);
    profile.lifetimePoints+=record.scoredPoints;
  }
  if(passed){
    record.passed=true;record.passedAt=record.lastAttemptAt;record.nextRetryAt=0;
    if(!profile.passedEditions.includes(EDITION_ID))profile.passedEditions.push(EDITION_ID);
    if(!profile.completedEditions.includes(EDITION_ID))profile.completedEditions.push(EDITION_ID);
  }else{
    record.nextRetryAt=record.lastAttemptAt+RETRY_COOLDOWN_MS;
  }
  profile.editionResults[EDITION_ID]=record;
  persistProfile();
  return saved;
}

function showResult(result){
  activeRun=false;finishing=true;stopQuestionTimer();setNavigationLocked(false);clearRun();
  const passed=Boolean(result.passed??(result.status==='completed'&&Number(result.correctCount||0)>=PASS_CORRECT));
  if(progressFill)progressFill.style.width=result.status==='completed'?'100%':'0%';
  resultScore.textContent=Number(result.score||0).toLocaleString('en-PH');
  resultCorrect.textContent=`${Number(result.correctCount||0)} / ${questions.length}`;
  resultLifetime.textContent=profile.lifetimePoints.toLocaleString('en-PH');
  if(resultTime)resultTime.textContent=formatTime(Number(result.elapsedSeconds||0));
  if(resultMark)resultMark.textContent=result.status==='forfeited'?'Run forfeited':passed?'Edition passed':'Keep learning';
  const note=resultView.querySelector('[data-rbt-result-note]');
  if(note){
    if(result.status==='forfeited')note.textContent='This run was forfeited and records 0 for the attempt. A qualification retry opens after the 24-hour learning cooldown.';
    else if(passed)note.textContent=`Passed with ${Number(result.correctCount||0)}/30. This edition is complete. Your next required weekly edition can unlock when it is released.`;
    else if(result.scoredAttempt)note.textContent=`You need ${PASS_CORRECT}/30 to progress. This first run is the only points-earning attempt. Review the week, then return after 24 hours for a qualification retry.`;
    else note.textContent=`You need ${PASS_CORRECT}/30 to progress. Review the week and try again after 24 hours. Qualification retries do not add lifetime points.`;
  }
  startView.hidden=true;gameView.hidden=true;resultView.hidden=false;
  pendingForfeitResult=null;
  setTimeout(()=>{finishing=false;},0);
}

function finishGame(){
  if(!activeRun)return;
  const result={status:'completed',score,correctCount,elapsedSeconds:elapsedSeconds(),finishedAt:Date.now(),questionSeconds:QUESTION_SECONDS,attemptMode};
  const saved=recordEdition(result);showResult(saved);
}

function forfeitRun(reason='left_page'){
  if(!activeRun||finishing)return;
  const result={status:'forfeited',score:0,correctCount:0,elapsedSeconds:elapsedSeconds(),finishedAt:Date.now(),reason,questionSeconds:QUESTION_SECONDS,attemptMode};
  stopQuestionTimer();
  const saved=recordEdition(result);persistRun({editionId:EDITION_ID,status:'forfeited',...saved});
  activeRun=false;pendingForfeitResult=saved;
  if(document.visibilityState==='visible')showResult(saved);
}

function startGame(){
  const name=(nameInput.value||'').trim().slice(0,60);
  const email=(emailInput.value||'').trim().slice(0,120);
  if(!name||!validEmail(email)){
    entryError.textContent='Name and a valid email are required to enter the game.';
    (!name?nameInput:emailInput).focus();return;
  }
  const access=accessState();
  if(!access.allowed){
    if(access.reason==='passed')entryError.textContent='You already passed this edition. The next weekly challenge will unlock when released.';
    else if(access.reason==='previous')entryError.textContent='This edition is locked until your previous required edition is passed.';
    else entryError.textContent=`Qualification retry opens in ${formatCooldown(access.wait)}.`;
    refreshEntryState();return;
  }
  profile.playerName=name;profile.email=email;
  if(!profile.joinedEditionId)profile.joinedEditionId=EDITION_ID;
  persistProfile();
  attemptMode=access.mode;
  activeQuestions=shuffle(questions);
  index=0;score=0;correctCount=0;answered=[];locked=false;startedAt=Date.now();activeRun=true;
  entryError.textContent='';startView.hidden=true;resultView.hidden=true;gameView.hidden=false;
  setNavigationLocked(true);renderQuestion();
}

function recoverInterruptedRun(){
  const run=readRun();
  if(!run)return false;
  if(run.editionId!==EDITION_ID){clearRun();return false;}
  if(run.status==='active'){
    attemptMode=run.attemptMode||accessState().mode||'scored';
    const result={status:'forfeited',score:0,correctCount:0,elapsedSeconds:Math.max(0,Math.floor((Date.now()-Number(run.startedAt||Date.now()))/1000)),finishedAt:Date.now(),reason:'interrupted',questionSeconds:QUESTION_SECONDS,attemptMode};
    const saved=recordEdition(result);persistRun({editionId:EDITION_ID,status:'forfeited',...saved});showResult(saved);return true;
  }
  if(run.status==='forfeited'){
    const record=editionRecord();const previous=lastAttempt(record)||run;showResult(previous);return true;
  }
  return false;
}

nameInput.value=profile.playerName;
emailInput.value=profile.email;
lifetimeEl.textContent=profile.lifetimePoints.toLocaleString('en-PH');
if(timerEl)timerEl.textContent=formatTime(QUESTION_SECONDS);
refreshEntryState();
startButton.addEventListener('click',startGame);
submitButton.addEventListener('click',lockCurrentAnswer);
skipButton.addEventListener('click',skipQuestion);

document.addEventListener('click',(event)=>{
  if(!activeRun)return;
  const link=event.target.closest('a');
  if(link){event.preventDefault();event.stopPropagation();}
},true);
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden')forfeitRun('page_hidden');
  else if(pendingForfeitResult)showResult(pendingForfeitResult);
});
window.addEventListener('pagehide',()=>forfeitRun('pagehide'));
window.addEventListener('beforeunload',()=>forfeitRun('beforeunload'));

if(!recoverInterruptedRun()){
  const record=editionRecord();const previous=lastAttempt(record);
  if(previous&&(record.passed||remainingCooldown(record)>0))showResult(previous);
  else refreshEntryState();
}
})();