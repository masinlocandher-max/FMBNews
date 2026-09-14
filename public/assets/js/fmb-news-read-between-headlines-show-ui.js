(()=>{
'use strict';

const root=document.querySelector('[data-rbt-root]');
if(!root)return;

const timerText=root.querySelector('[data-rbt-timer]');
const timerOrb=root.querySelector('[data-rbt-timer-orb]');
const questionNo=root.querySelector('[data-rbt-question-no]');
const scoreEl=root.querySelector('[data-rbt-score]');
const lifetimeEl=root.querySelector('[data-rbt-lifetime]');
const answerArea=root.querySelector('[data-rbt-answer]');
const nameInput=root.querySelector('[data-rbt-player]');
const playerDisplay=root.querySelector('[data-rbt-player-display]');
const ladderItems=[...root.querySelectorAll('[data-rbt-ladder-item]')];
const runScoreMirror=root.querySelector('[data-rbt-run-score-mirror]');
const lifetimeMirror=root.querySelector('[data-rbt-lifetime-mirror]');

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
}

function syncOptions(){
  if(!answerArea)return;
  const labels=['A','B','C','D'];
  [...answerArea.querySelectorAll('.rbt-option')].forEach((button,index)=>{
    button.dataset.optionLabel=labels[index]||String(index+1);
  });
}

function syncPlayer(){
  if(playerDisplay&&nameInput)playerDisplay.textContent=(nameInput.value||'Player').trim()||'Player';
}

function syncMirrors(){
  if(runScoreMirror&&scoreEl)runScoreMirror.textContent=scoreEl.textContent||'0';
  if(lifetimeMirror&&lifetimeEl)lifetimeMirror.textContent=lifetimeEl.textContent||'0';
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
