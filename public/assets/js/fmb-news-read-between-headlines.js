(()=>{
'use strict';

const EDITION_ID='impeachment-refresher-v3';
const STORAGE_KEY='fmbReadBetweenHeadlinesV1';
const RUN_KEY='fmbReadBetweenHeadlinesActiveRunV1';
const POINTS_PER_CORRECT=10;

const questions=[
  {id:'q01',day:'Day 1',type:'single_select',prompt:'Who was elected presiding officer of the Senate impeachment court when the trial opened?',options:['Francis “Chiz” Escudero','Sherwin Gatchalian','Risa Hontiveros','Joel Villanueva'],answer:'Francis “Chiz” Escudero'},
  {id:'q02',day:'Day 1',type:'identification',prompt:'How many votes did presiding officer Francis “Chiz” Escudero rule were needed to convict Vice President Sara Duterte?',answer:'16',aliases:['sixteen','16 votes']},
  {id:'q03',day:'Day 2',type:'identification',prompt:'Name the NBI senior agent who became the prosecution’s first witness and testified about the authenticity of the November 2024 video.',answer:'John Mark Calilung',aliases:['Calilung','John Calilung']},
  {id:'q04',day:'Day 2',type:'true_false',prompt:'The November 2024 video at the center of the grave-threat allegation was admitted as prosecution evidence despite defense objections.',options:['True','False'],answer:'True'},
  {id:'q05',day:'Day 4',type:'single_select',prompt:'Who was presented as the prosecution’s second NBI witness?',options:['Jeremy Lotoc','Melvin Matibag','Michael Poa','Roderick Wamil'],answer:'Jeremy Lotoc'},
  {id:'q06',day:'Day 4',type:'true_false',prompt:'NBI witness Jeremy Lotoc testified that the bureau had validated information identifying an alleged hitman supposedly linked to the threat.',options:['True','False'],answer:'False'},
  {id:'q07',day:'Day 7',type:'single_select',prompt:'What records did the impeachment court allow prosecutors to subpoena in connection with Vice President Duterte and her husband?',options:['Financial records','Medical records','School records','Travel photographs'],answer:'Financial records'},
  {id:'q08',day:'Day 8',type:'identification',prompt:'Name the NBI director who testified as the prosecution continued presenting evidence on Article IV.',answer:'Melvin Matibag',aliases:['Matibag','Melvin A. Matibag']},
  {id:'q09',day:'Day 9',type:'true_false',prompt:'By Day 9, the prosecution had concluded its presentation of evidence on Article IV, the article involving the alleged grave threats.',options:['True','False'],answer:'True'},
  {id:'q10',day:'Day 10',type:'single_select',prompt:'The two former branch managers who testified about large OVP and DepEd cash withdrawals previously worked for which bank?',options:['LandBank','DBP','PNB','BPI'],answer:'LandBank'},
  {id:'q11',day:'Day 12',type:'identification',prompt:'Name the former COA Intelligence and Confidential Funds Audit Office state auditor who testified about confidential-fund documentation.',answer:'Roderick Wamil',aliases:['Wamil','Atty. Roderick Wamil','Lawyer Roderick Wamil']},
  {id:'q12',day:'Day 12',type:'single_select',prompt:'According to Roderick Wamil’s testimony, how much of the OVP’s ₱250-million confidential-fund allocation for the first two quarters of 2023 lacked supporting documents for the stated purposes?',options:['₱129 million','₱73 million','₱250 million','₱37.5 million'],answer:'₱129 million'},
  {id:'q13',day:'Day 14–15',type:'identification',prompt:'Name the COA state auditor who testified about the OVP’s 2022 confidential-fund disbursements and the notice of disallowance.',answer:'Xylene del Campo',aliases:['Del Campo','Xylene Del Campo']},
  {id:'q14',day:'Day 14–15',type:'single_select',prompt:'What amount from the OVP’s 2022 confidential-fund spending was covered by the COA notice of disallowance discussed in Xylene del Campo’s testimony?',options:['₱73 million','₱125 million','₱129 million','₱500 million'],answer:'₱73 million'},
  {id:'q15',day:'Day 16–17',type:'identification',prompt:'Which former OVP special disbursing officer was declared a hostile witness and testified about releasing confidential funds?',answer:'Gina Acosta',aliases:['Acosta','Gina B. Acosta']},
  {id:'q16',day:'Day 16–17',type:'single_select',prompt:'According to Gina Acosta’s testimony, to whom did she release ₱500 million in OVP confidential funds on Vice President Duterte’s order?',options:['Col. Raymund Lachica','Atty. Michael Poa','Lemuel Ortonio','Jeremy Lotoc'],answer:'Col. Raymund Lachica'},
  {id:'q17',day:'Day 18–19',type:'identification',prompt:'Name the OVP assistant secretary and assistant chief of staff who was declared the prosecution’s second hostile witness.',answer:'Lemuel Ortonio',aliases:['Ortonio','Lemuel B. Ortonio']},
  {id:'q18',day:'Day 20',type:'true_false',prompt:'Army officers Manaros Boransing II and Magtanggol Panopio said their certifications attested to the propriety of DepEd confidential-fund expenditures.',options:['True','False'],answer:'False'},
  {id:'q19',day:'Day 22',type:'identification',prompt:'Name the Philippine Statistics Authority assistant national statistician who testified after PSA records were checked against names listed as confidential-fund recipients.',answer:'Marizza Grande',aliases:['Grande','Marizza B. Grande']},
  {id:'q20',day:'Day 23',type:'single_select',prompt:'On Day 23, what did the prosecution do with the remaining 15 planned witnesses for Article I?',options:['It chose to forego presenting them','It presented all 15 in one session','It transferred them to the defense list','It withdrew Article I entirely'],answer:'It chose to forego presenting them'},
  {id:'q21',day:'Day 9',type:'identification',prompt:'Before closing its presentation on Article IV, the prosecution said it would no longer present how many additional witnesses for that article?',answer:'6',aliases:['six','6 witnesses']},
  {id:'q22',day:'Day 10',type:'single_select',prompt:'Former LandBank manager Violeta Constantino testified that Gina Acosta encashed how many ₱125-million OVP checks between December 2022 and July 2023?',options:['Four','Two','Six','Eight'],answer:'Four'},
  {id:'q23',day:'Day 11',type:'single_select',prompt:'Which unusual name appeared in the confidential-fund records discussed during former COA auditor Roderick Wamil’s testimony?',options:['Piattos','Mabini','Malakas','Bagwis'],answer:'Piattos'},
  {id:'q24',day:'Day 13',type:'true_false',prompt:'Roderick Wamil testified that the OVP submitted receipts or sales invoices when it liquidated its ₱125-million confidential fund for 2022.',options:['True','False'],answer:'False'},
  {id:'q25',day:'Day 14',type:'single_select',prompt:'After the defense declined a joint stipulation on the acknowledgement receipts, prosecutors said Xylene del Campo could have to testify on roughly how many documents?',options:['More than 4,000','About 400','About 40','More than 40,000'],answer:'More than 4,000'},
  {id:'q26',day:'Day 15',type:'true_false',prompt:'Xylene del Campo testified that supplier details for the OVP’s confidential-fund purchases were themselves confidential and therefore receipts or invoices were unnecessary.',options:['True','False'],answer:'False'},
  {id:'q27',day:'Day 16',type:'identification',prompt:'Name the House records official who was excused after the defense stipulated to the documents presented through her.',answer:'Marivic Pareja',aliases:['Pareja','Marivic P. Pareja']},
  {id:'q28',day:'Day 17',type:'true_false',prompt:'Gina Acosta testified that Col. Raymund Lachica was a bonded accountable officer responsible for accounting for confidential funds if they were lost.',options:['True','False'],answer:'False'},
  {id:'q29',day:'Day 23',type:'identification',prompt:'By Day 23, how many Article I witnesses had the prosecution presented or covered through stipulated testimony before it dropped the remaining 15?',answer:'12',aliases:['twelve','12 witnesses']},
  {id:'q30',day:'Article I',type:'single_select',prompt:'Which article of impeachment centered on the alleged misuse of ₱612.5 million in confidential funds from the OVP and DepEd?',options:['Article I','Article II','Article III','Article IV'],answer:'Article I'}
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
const questionNo=$('[data-rbt-question-no]');
const dayLabel=$('[data-rbt-day]');
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

const normalize=(value)=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[₱,.'’“”\-–—]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
const validEmail=(value)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim());
const makeId=()=>window.crypto?.randomUUID?.()||`player-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch{return fallback;}}
function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
function readProfile(){
  const parsed=readJSON(STORAGE_KEY,{});
  return {
    playerId:parsed.playerId||makeId(),
    playerName:parsed.playerName||'',
    email:parsed.email||'',
    lifetimePoints:Number(parsed.lifetimePoints||0),
    completedEditions:Array.isArray(parsed.completedEditions)?parsed.completedEditions:[],
    editionResults:parsed.editionResults&&typeof parsed.editionResults==='object'?parsed.editionResults:{}
  };
}

let profile=readProfile();
let index=0,score=0,correctCount=0,locked=false,answered=[];
let activeRun=false,startedAt=0,timerId=null,finishing=false;

function persistProfile(){writeJSON(STORAGE_KEY,profile);}
function readRun(){return readJSON(RUN_KEY,null);}
function persistRun(run){writeJSON(RUN_KEY,run);}
function clearRun(){try{localStorage.removeItem(RUN_KEY);}catch{}}
function typeName(type){if(type==='single_select')return 'Multiple Choice';if(type==='true_false')return 'True or False';return 'Identification';}
function validAnswers(q){return [q.answer,...(q.aliases||[])].map(normalize);}
function elapsedSeconds(){return startedAt?Math.max(0,Math.floor((Date.now()-startedAt)/1000)):0;}
function formatTime(total){const m=Math.floor(total/60),s=total%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
function updateTimer(){if(timerEl)timerEl.textContent=formatTime(elapsedSeconds());}
function startTimer(){stopTimer();updateTimer();timerId=setInterval(updateTimer,1000);}
function stopTimer(){if(timerId){clearInterval(timerId);timerId=null;}}

function saveActiveRun(status='active'){
  persistRun({editionId:EDITION_ID,status,startedAt,updatedAt:Date.now(),questionIndex:index,score,correctCount});
}

function renderQuestion(){
  const q=questions[index];
  locked=false;
  questionNo.textContent=`Question ${index+1} of ${questions.length}`;
  dayLabel.textContent=q.day;
  typeLabel.textContent=typeName(q.type);
  promptEl.textContent=q.prompt;
  scoreEl.textContent=score.toLocaleString('en-PH');
  lifetimeEl.textContent=profile.lifetimePoints.toLocaleString('en-PH');
  progressFill.style.width=`${(index/questions.length)*100}%`;
  feedback.textContent='';feedback.dataset.state='';answerArea.innerHTML='';
  submitButton.hidden=q.type!=='identification';submitButton.disabled=false;skipButton.disabled=false;
  saveActiveRun();

  if(q.type==='identification'){
    const input=document.createElement('input');
    input.className='rbt-identification';input.type='text';input.autocomplete='off';input.spellcheck=false;input.placeholder='Type your answer';input.setAttribute('aria-label','Your answer');
    input.addEventListener('keydown',(event)=>{if(event.key==='Enter')submitIdentification();});
    answerArea.append(input);setTimeout(()=>input.focus(),0);
  }else{
    const group=document.createElement('div');group.className='rbt-options';
    q.options.forEach(option=>{const button=document.createElement('button');button.type='button';button.className='rbt-option';button.textContent=option;button.addEventListener('click',()=>grade(option,button));group.append(button);});
    answerArea.append(group);
  }
}

function grade(value,control){
  if(locked||!activeRun)return;
  const q=questions[index];locked=true;
  const isCorrect=validAnswers(q).includes(normalize(value));
  if(isCorrect){score+=POINTS_PER_CORRECT;correctCount++;feedback.textContent=`Correct. +${POINTS_PER_CORRECT} points.`;feedback.dataset.state='correct';if(control)control.dataset.chosen='correct';}
  else{feedback.textContent='Not this one. The correct answer will not be revealed.';feedback.dataset.state='wrong';if(control)control.dataset.chosen='wrong';}
  answered.push({id:q.id,correct:isCorrect});
  submitButton.disabled=true;skipButton.disabled=true;answerArea.querySelectorAll('button,input').forEach(el=>el.disabled=true);
  saveActiveRun();setTimeout(nextQuestion,850);
}

function submitIdentification(){
  if(locked||!activeRun)return;
  const input=answerArea.querySelector('input');if(!input)return;
  if(!input.value.trim()){feedback.textContent='Enter an answer first, or skip this question.';feedback.dataset.state='neutral';input.focus();return;}
  grade(input.value,input);
}

function skipQuestion(){
  if(locked||!activeRun)return;
  locked=true;answered.push({id:questions[index].id,correct:false,skipped:true});feedback.textContent='Skipped. The answer stays hidden.';feedback.dataset.state='neutral';
  answerArea.querySelectorAll('button,input').forEach(el=>el.disabled=true);submitButton.disabled=true;skipButton.disabled=true;saveActiveRun();setTimeout(nextQuestion,650);
}

function nextQuestion(){index++;if(index<questions.length){renderQuestion();return;}finishGame();}

function recordEdition(result){
  if(profile.completedEditions.includes(EDITION_ID))return false;
  profile.completedEditions.push(EDITION_ID);
  profile.editionResults[EDITION_ID]=result;
  if(result.status==='completed')profile.lifetimePoints+=Number(result.score||0);
  persistProfile();
  return true;
}

function showResult(result){
  activeRun=false;finishing=true;stopTimer();clearRun();
  if(progressFill)progressFill.style.width=result.status==='completed'?'100%':'0%';
  resultScore.textContent=Number(result.score||0).toLocaleString('en-PH');
  resultCorrect.textContent=`${Number(result.correctCount||0)} / ${questions.length}`;
  resultLifetime.textContent=profile.lifetimePoints.toLocaleString('en-PH');
  if(resultTime)resultTime.textContent=formatTime(Number(result.elapsedSeconds||0));
  const note=resultView.querySelector('[data-rbt-result-note]');
  if(note)note.textContent=result.status==='forfeited'
    ? 'Run forfeited. Leaving, hiding, refreshing, or closing the game page after the challenge starts makes the scored result 0.'
    : 'Your scored run is complete. Answers remain hidden and this edition cannot be replayed for additional points.';
  startView.hidden=true;gameView.hidden=true;resultView.hidden=false;
  setTimeout(()=>{finishing=false;},0);
}

function finishGame(){
  if(!activeRun)return;
  const result={status:'completed',score,correctCount,elapsedSeconds:elapsedSeconds(),finishedAt:Date.now()};
  recordEdition(result);showResult(result);
}

function forfeitRun(){
  if(!activeRun||finishing)return;
  const result={status:'forfeited',score:0,correctCount:0,elapsedSeconds:elapsedSeconds(),finishedAt:Date.now()};
  recordEdition(result);
  persistRun({editionId:EDITION_ID,status:'forfeited',...result});
  activeRun=false;stopTimer();
  if(document.visibilityState==='visible')showResult(result);
}

function startGame(){
  const name=(nameInput.value||'').trim().slice(0,60);
  const email=(emailInput.value||'').trim().slice(0,120);
  if(!name||!validEmail(email)){entryError.textContent='Name and a valid email are required to enter the game.';(!name?nameInput:emailInput).focus();return;}
  if(profile.completedEditions.includes(EDITION_ID)){entryError.textContent='This edition already has a scored result on this device.';return;}
  profile.playerName=name;profile.email=email;persistProfile();
  index=0;score=0;correctCount=0;answered=[];locked=false;startedAt=Date.now();activeRun=true;
  saveActiveRun();entryError.textContent='';startView.hidden=true;resultView.hidden=true;gameView.hidden=false;startTimer();renderQuestion();
}

function recoverInterruptedRun(){
  const run=readRun();
  if(!run||run.editionId!==EDITION_ID)return false;
  if(run.status==='active'){
    const result={status:'forfeited',score:0,correctCount:0,elapsedSeconds:Math.max(0,Math.floor((Date.now()-Number(run.startedAt||Date.now()))/1000)),finishedAt:Date.now()};
    recordEdition(result);persistRun({editionId:EDITION_ID,status:'forfeited',...result});showResult(result);return true;
  }
  return false;
}

nameInput.value=profile.playerName;emailInput.value=profile.email;lifetimeEl.textContent=profile.lifetimePoints.toLocaleString('en-PH');
startButton.addEventListener('click',startGame);submitButton.addEventListener('click',submitIdentification);skipButton.addEventListener('click',skipQuestion);

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')forfeitRun();});
window.addEventListener('pagehide',forfeitRun);
window.addEventListener('beforeunload',forfeitRun);

if(!recoverInterruptedRun()&&profile.completedEditions.includes(EDITION_ID)){
  const previous=profile.editionResults[EDITION_ID];
  if(previous)showResult(previous);
}
})();