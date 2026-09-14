(()=>{
'use strict';

const EDITION_ID='impeachment-refresher-v2';
const STORAGE_KEY='fmbReadBetweenHeadlinesV1';
const POINTS_PER_CORRECT=100;

const questions=[
  {
    id:'q01',day:'Day 1',type:'single_select',
    prompt:'Who was elected presiding officer of the Senate impeachment court when the trial opened?',
    options:['Francis “Chiz” Escudero','Sherwin Gatchalian','Risa Hontiveros','Joel Villanueva'],
    answer:'Francis “Chiz” Escudero'
  },
  {
    id:'q02',day:'Day 1',type:'identification',
    prompt:'How many votes did presiding officer Francis “Chiz” Escudero rule were needed to convict Vice President Sara Duterte?',
    answer:'16',aliases:['sixteen','16 votes']
  },
  {
    id:'q03',day:'Day 2',type:'identification',
    prompt:'Name the NBI senior agent who became the prosecution’s first witness and testified about the authenticity of the November 2024 video.',
    answer:'John Mark Calilung',aliases:['Calilung','John Calilung']
  },
  {
    id:'q04',day:'Day 2',type:'true_false',
    prompt:'The November 2024 video at the center of the grave-threat allegation was admitted as prosecution evidence despite defense objections.',
    options:['True','False'],answer:'True'
  },
  {
    id:'q05',day:'Day 4',type:'single_select',
    prompt:'Who was presented as the prosecution’s second NBI witness?',
    options:['Jeremy Lotoc','Melvin Matibag','Michael Poa','Roderick Wamil'],
    answer:'Jeremy Lotoc'
  },
  {
    id:'q06',day:'Day 4',type:'true_false',
    prompt:'NBI witness Jeremy Lotoc testified that the bureau had validated information identifying an alleged hitman supposedly linked to the threat.',
    options:['True','False'],answer:'False'
  },
  {
    id:'q07',day:'Day 7',type:'single_select',
    prompt:'What records did the impeachment court allow prosecutors to subpoena in connection with Vice President Duterte and her husband?',
    options:['Financial records','Medical records','School records','Travel photographs'],
    answer:'Financial records'
  },
  {
    id:'q08',day:'Day 8',type:'identification',
    prompt:'Name the NBI director who testified as the prosecution continued presenting evidence on Article IV.',
    answer:'Melvin Matibag',aliases:['Matibag','Melvin A. Matibag']
  },
  {
    id:'q09',day:'Day 9',type:'true_false',
    prompt:'By Day 9, the prosecution had concluded its presentation of evidence on Article IV, the article involving the alleged grave threats.',
    options:['True','False'],answer:'True'
  },
  {
    id:'q10',day:'Day 10',type:'single_select',
    prompt:'The two former branch managers who testified about large OVP and DepEd cash withdrawals previously worked for which bank?',
    options:['LandBank','DBP','PNB','BPI'],
    answer:'LandBank'
  },
  {
    id:'q11',day:'Day 12',type:'identification',
    prompt:'Name the former COA Intelligence and Confidential Funds Audit Office state auditor who testified about confidential-fund documentation.',
    answer:'Roderick Wamil',aliases:['Wamil','Atty. Roderick Wamil','Lawyer Roderick Wamil']
  },
  {
    id:'q12',day:'Day 12',type:'single_select',
    prompt:'According to Roderick Wamil’s testimony, how much of the OVP’s ₱250-million confidential-fund allocation for the first two quarters of 2023 lacked supporting documents for the stated purposes?',
    options:['₱129 million','₱73 million','₱250 million','₱37.5 million'],
    answer:'₱129 million'
  },
  {
    id:'q13',day:'Day 14–15',type:'identification',
    prompt:'Name the COA state auditor who testified about the OVP’s 2022 confidential-fund disbursements and the notice of disallowance.',
    answer:'Xylene del Campo',aliases:['Del Campo','Xylene Del Campo']
  },
  {
    id:'q14',day:'Day 14–15',type:'single_select',
    prompt:'What amount from the OVP’s 2022 confidential-fund spending was covered by the COA notice of disallowance discussed in Xylene del Campo’s testimony?',
    options:['₱73 million','₱125 million','₱129 million','₱500 million'],
    answer:'₱73 million'
  },
  {
    id:'q15',day:'Day 16–17',type:'identification',
    prompt:'Which former OVP special disbursing officer was declared a hostile witness and testified about releasing confidential funds?',
    answer:'Gina Acosta',aliases:['Acosta','Gina B. Acosta']
  },
  {
    id:'q16',day:'Day 16–17',type:'single_select',
    prompt:'According to Gina Acosta’s testimony, to whom did she release ₱500 million in OVP confidential funds on Vice President Duterte’s order?',
    options:['Col. Raymund Lachica','Atty. Michael Poa','Lemuel Ortonio','Jeremy Lotoc'],
    answer:'Col. Raymund Lachica'
  },
  {
    id:'q17',day:'Day 18–19',type:'identification',
    prompt:'Name the OVP assistant secretary and assistant chief of staff who was declared the prosecution’s second hostile witness.',
    answer:'Lemuel Ortonio',aliases:['Ortonio','Lemuel B. Ortonio']
  },
  {
    id:'q18',day:'Day 20',type:'true_false',
    prompt:'Army officers Manaros Boransing II and Magtanggol Panopio said their certifications attested to the propriety of DepEd confidential-fund expenditures.',
    options:['True','False'],answer:'False'
  },
  {
    id:'q19',day:'Day 22',type:'identification',
    prompt:'Name the Philippine Statistics Authority assistant national statistician who testified after PSA records were checked against names listed as confidential-fund recipients.',
    answer:'Marizza Grande',aliases:['Grande','Marizza B. Grande']
  },
  {
    id:'q20',day:'Day 23',type:'single_select',
    prompt:'On Day 23, what did the prosecution do with the remaining 15 planned witnesses for Article I?',
    options:['It chose to forego presenting them','It presented all 15 in one session','It transferred them to the defense list','It withdrew Article I entirely'],
    answer:'It chose to forego presenting them'
  },
  {
    id:'q21',day:'Day 9',type:'identification',
    prompt:'Before closing its presentation on Article IV, the prosecution said it would no longer present how many additional witnesses for that article?',
    answer:'6',aliases:['six','6 witnesses']
  },
  {
    id:'q22',day:'Day 10',type:'single_select',
    prompt:'Former LandBank manager Violeta Constantino testified that Gina Acosta encashed how many ₱125-million OVP checks between December 2022 and July 2023?',
    options:['Four','Two','Six','Eight'],
    answer:'Four'
  },
  {
    id:'q23',day:'Day 11',type:'single_select',
    prompt:'Which unusual name appeared in the confidential-fund records discussed during former COA auditor Roderick Wamil’s testimony?',
    options:['Piattos','Mabini','Malakas','Bagwis'],
    answer:'Piattos'
  },
  {
    id:'q24',day:'Day 13',type:'true_false',
    prompt:'Roderick Wamil testified that the OVP submitted receipts or sales invoices when it liquidated its ₱125-million confidential fund for 2022.',
    options:['True','False'],answer:'False'
  },
  {
    id:'q25',day:'Day 14',type:'single_select',
    prompt:'After the defense declined a joint stipulation on the acknowledgement receipts, prosecutors said Xylene del Campo could have to testify on roughly how many documents?',
    options:['More than 4,000','About 400','About 40','More than 40,000'],
    answer:'More than 4,000'
  },
  {
    id:'q26',day:'Day 15',type:'true_false',
    prompt:'Xylene del Campo testified that supplier details for the OVP’s confidential-fund purchases were themselves confidential and therefore receipts or invoices were unnecessary.',
    options:['True','False'],answer:'False'
  },
  {
    id:'q27',day:'Day 16',type:'identification',
    prompt:'Name the House records official who was excused after the defense stipulated to the documents presented through her.',
    answer:'Marivic Pareja',aliases:['Pareja','Marivic P. Pareja']
  },
  {
    id:'q28',day:'Day 17',type:'true_false',
    prompt:'Gina Acosta testified that Col. Raymund Lachica was a bonded accountable officer responsible for accounting for confidential funds if they were lost.',
    options:['True','False'],answer:'False'
  },
  {
    id:'q29',day:'Day 23',type:'identification',
    prompt:'By Day 23, how many Article I witnesses had the prosecution presented or covered through stipulated testimony before it dropped the remaining 15?',
    answer:'12',aliases:['twelve','12 witnesses']
  },
  {
    id:'q30',day:'Article I',type:'single_select',
    prompt:'Which article of impeachment centered on the alleged misuse of ₱612.5 million in confidential funds from the OVP and DepEd?',
    options:['Article I','Article II','Article III','Article IV'],
    answer:'Article I'
  }
];

if(questions.length!==30)throw new Error('Read Between the Headlines requires exactly 30 questions.');

const root=document.querySelector('[data-rbt-root]');
if(!root)return;

const $=(sel)=>root.querySelector(sel);
const startView=$('[data-rbt-start]');
const gameView=$('[data-rbt-game]');
const resultView=$('[data-rbt-result]');
const startButton=$('[data-rbt-start-button]');
const playerInput=$('[data-rbt-player]');
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
const progressFill=$('[data-rbt-progress-fill]');
const resultScore=$('[data-rbt-result-score]');
const resultCorrect=$('[data-rbt-result-correct]');
const resultLifetime=$('[data-rbt-result-lifetime]');
const replayButton=$('[data-rbt-replay]');

const normalize=(value)=>String(value??'')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g,'')
  .replace(/[₱,.'’“”\-–—]/g,' ')
  .replace(/\s+/g,' ')
  .trim()
  .toLowerCase();

function readState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    return {
      playerId:parsed.playerId||((crypto&&crypto.randomUUID)?crypto.randomUUID():`anon-${Date.now()}-${Math.random().toString(36).slice(2)}`),
      playerName:parsed.playerName||'',
      lifetimePoints:Number(parsed.lifetimePoints||0),
      completedEditions:Array.isArray(parsed.completedEditions)?parsed.completedEditions:[]
    };
  }catch{
    return {playerId:`anon-${Date.now()}`,playerName:'',lifetimePoints:0,completedEditions:[]};
  }
}

let profile=readState();
let index=0;
let score=0;
let correctCount=0;
let locked=false;
let answered=[];

function persistProfile(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(profile));}catch{}
}

function typeName(type){
  if(type==='single_select')return 'Multiple Choice';
  if(type==='true_false')return 'True or False';
  return 'Identification';
}

function validAnswers(q){return [q.answer,...(q.aliases||[])].map(normalize);}

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
  feedback.textContent='';
  feedback.dataset.state='';
  answerArea.innerHTML='';
  submitButton.hidden=q.type!=='identification';
  submitButton.disabled=false;
  skipButton.disabled=false;

  if(q.type==='identification'){
    const input=document.createElement('input');
    input.className='rbt-identification';
    input.type='text';
    input.autocomplete='off';
    input.spellcheck=false;
    input.placeholder='Type your answer';
    input.setAttribute('aria-label','Your answer');
    input.addEventListener('keydown',(event)=>{if(event.key==='Enter')submitIdentification();});
    answerArea.append(input);
    setTimeout(()=>input.focus(),0);
  }else{
    const group=document.createElement('div');
    group.className='rbt-options';
    q.options.forEach(option=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='rbt-option';
      button.textContent=option;
      button.addEventListener('click',()=>grade(option,button));
      group.append(button);
    });
    answerArea.append(group);
  }
}

function grade(value,control){
  if(locked)return;
  const q=questions[index];
  locked=true;
  const isCorrect=validAnswers(q).includes(normalize(value));
  if(isCorrect){
    score+=POINTS_PER_CORRECT;
    correctCount++;
    feedback.textContent=`Correct. +${POINTS_PER_CORRECT} points.`;
    feedback.dataset.state='correct';
    if(control)control.dataset.chosen='correct';
  }else{
    feedback.textContent='Not this one. The answer stays hidden.';
    feedback.dataset.state='wrong';
    if(control)control.dataset.chosen='wrong';
  }
  answered.push({id:q.id,correct:isCorrect});
  submitButton.disabled=true;
  skipButton.disabled=true;
  answerArea.querySelectorAll('button,input').forEach(el=>el.disabled=true);
  setTimeout(nextQuestion,850);
}

function submitIdentification(){
  if(locked)return;
  const input=answerArea.querySelector('input');
  if(!input)return;
  if(!input.value.trim()){
    feedback.textContent='Enter an answer first, or skip this question.';
    feedback.dataset.state='neutral';
    input.focus();
    return;
  }
  grade(input.value,input);
}

function skipQuestion(){
  if(locked)return;
  locked=true;
  answered.push({id:questions[index].id,correct:false,skipped:true});
  feedback.textContent='Skipped. The answer stays hidden.';
  feedback.dataset.state='neutral';
  answerArea.querySelectorAll('button,input').forEach(el=>el.disabled=true);
  submitButton.disabled=true;
  skipButton.disabled=true;
  setTimeout(nextQuestion,650);
}

function nextQuestion(){
  index++;
  if(index<questions.length){renderQuestion();return;}
  finishGame();
}

function finishGame(){
  progressFill.style.width='100%';
  const alreadyCompleted=profile.completedEditions.includes(EDITION_ID);
  if(!alreadyCompleted){
    profile.lifetimePoints+=score;
    profile.completedEditions.push(EDITION_ID);
    persistProfile();
  }
  resultScore.textContent=score.toLocaleString('en-PH');
  resultCorrect.textContent=`${correctCount} / ${questions.length}`;
  resultLifetime.textContent=profile.lifetimePoints.toLocaleString('en-PH');
  const note=resultView.querySelector('[data-rbt-result-note]');
  if(note)note.textContent=alreadyCompleted
    ? 'Practice run complete. Your lifetime total is unchanged because this weekly challenge was already scored.'
    : 'Your points were added to your anonymous lifetime total.';
  gameView.hidden=true;
  resultView.hidden=false;
}

function startGame(){
  const name=(playerInput.value||'').trim().slice(0,24);
  if(!name){
    const error=$('[data-rbt-player-error]');
    if(error)error.textContent='Choose a player name. No email is required.';
    playerInput.focus();
    return;
  }
  profile.playerName=name;
  persistProfile();
  index=0;score=0;correctCount=0;answered=[];
  startView.hidden=true;
  resultView.hidden=true;
  gameView.hidden=false;
  renderQuestion();
}

function replay(){
  index=0;score=0;correctCount=0;answered=[];
  resultView.hidden=true;
  gameView.hidden=false;
  renderQuestion();
}

playerInput.value=profile.playerName;
lifetimeEl.textContent=profile.lifetimePoints.toLocaleString('en-PH');
startButton.addEventListener('click',startGame);
submitButton.addEventListener('click',submitIdentification);
skipButton.addEventListener('click',skipQuestion);
replayButton.addEventListener('click',replay);
})();