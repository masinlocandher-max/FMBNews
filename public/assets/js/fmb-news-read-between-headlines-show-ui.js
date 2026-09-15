(()=>{
'use strict';

const CHOICE_STYLESHEET='/assets/css/fmb-news-read-between-headlines-choices.css?v=20260915-v1';
if(!document.querySelector('link[data-rbt-choice-style]')){
  const styleLink=document.createElement('link');
  styleLink.rel='stylesheet';
  styleLink.href=CHOICE_STYLESHEET;
  styleLink.dataset.rbtChoiceStyle='true';
  document.head.append(styleLink);
}

const root=document.querySelector('[data-rbt-root]');
if(!root)return;

const timerText=root.querySelector('[data-rbt-timer]');
const timerDisplay=root.querySelector('[data-rbt-timer-display]');
const timerOrb=root.querySelector('[data-rbt-timer-orb]');
const questionNo=root.querySelector('[data-rbt-question-no]');
const scoreEl=root.querySelector('[data-rbt-score]');
const lifetimeEl=root.querySelector('[data-rbt-lifetime]');
const answerArea=root.querySelector('[data-rbt-answer]');
const nameInput=root.querySelector('[data-rbt-player]');
const playerDisplay=root.querySelector('[data-rbt-player-display]');
const ladderItems=[...root.querySelectorAll('[data-rbt-ladder-item]')];
const mobileQuestion=root.querySelector('[data-rbt-mobile-question]');
const mobileScore=root.querySelector('[data-rbt-mobile-score]');

function parseSeconds(text){
  const match=String(text||'').match(/(\d+):(\d+)/);
  if(!match)return 30;
  return (Number(match[1])||0)*60+(Number(match[2])||0);
}

function syncTimer(){
  if(!timerText||!timerOrb)return;
  const remaining=Math.max(0,Math.min(30,parseSeconds(timerText.textContent)));
  timerOrb.style.setProperty('--timer-angle',`${(remaining/30)*360}deg`);
  timerOrb.dataset.warning=timerText.dataset.warning||'false';
  timerOrb.dataset.critical=timerText.dataset.critical||'false';
  if(timerDisplay)timerDisplay.textContent=String(remaining);
}

function currentQuestion(){
  const match=String(questionNo?.textContent||'').match(/Question\s+(\d+)/i);
  return match?Number(match[1]):1;
}

function syncLadder(){
  const current=currentQuestion();
  ladderItems.forEach((item)=>{
    const q=Number(item.dataset.q||0);
    item.classList.toggle('is-current',q===current);
    item.classList.toggle('is-past',q<current);
  });
  if(mobileQuestion)mobileQuestion.textContent=`Q ${String(current).padStart(2,'0')} / 30`;
}

function syncOptions(){
  if(!answerArea)return;
  const labels=['A','B','C','D'];
  [...answerArea.querySelectorAll('.rbt-option')].forEach((button,index)=>{
    const label=labels[index]||String(index+1);
    button.dataset.optionLabel=label;
    button.setAttribute('aria-label',`Answer ${label}: ${button.textContent.trim()}`);
  });
}

function syncPlayer(){
  if(playerDisplay&&nameInput)playerDisplay.textContent=(nameInput.value||'Player').trim()||'Player';
}

function syncMirrors(){
  if(mobileScore&&scoreEl)mobileScore.textContent=scoreEl.textContent||'0';
}

const observer=new MutationObserver(()=>{
  syncTimer();
  syncLadder();
  syncOptions();
  syncMirrors();
});

if(timerText)observer.observe(timerText,{subtree:true,childList:true,characterData:true,attributes:true});
if(questionNo)observer.observe(questionNo,{subtree:true,childList:true,characterData:true});
if(answerArea)observer.observe(answerArea,{subtree:true,childList:true});
if(scoreEl)observer.observe(scoreEl,{subtree:true,childList:true,characterData:true});
if(lifetimeEl)observer.observe(lifetimeEl,{subtree:true,childList:true,characterData:true});

nameInput?.addEventListener('input',syncPlayer);
root.querySelector('[data-rbt-start-button]')?.addEventListener('click',()=>setTimeout(()=>{syncPlayer();syncLadder();syncTimer();syncOptions();syncMirrors();},0));

syncPlayer();syncLadder();syncTimer();syncOptions();syncMirrors();
})();
