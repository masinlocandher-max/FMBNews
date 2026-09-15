(()=>{
'use strict';

const root=document.querySelector('[data-rbt-root]');
if(!root)return;

const gameView=root.querySelector('[data-rbt-game]');
const answerArea=root.querySelector('[data-rbt-answer]');
const submitButton=root.querySelector('[data-rbt-submit]');
const scoreEl=root.querySelector('[data-rbt-score]');
const mobileScore=root.querySelector('[data-rbt-mobile-score]');
const timerText=root.querySelector('[data-rbt-timer]');

const style=document.createElement('style');
style.dataset.rbtStagePlus='true';
style.textContent=`
[data-rbt-root][data-rbt-tension="warning"] .rbt-arena{box-shadow:inset 0 0 0 1px rgba(215,25,32,.08),0 28px 80px rgba(10,10,10,.14),0 0 54px rgba(215,25,32,.08)}
[data-rbt-root][data-rbt-tension="critical"] .rbt-arena{box-shadow:inset 0 0 0 1px rgba(239,27,36,.16),0 28px 86px rgba(10,10,10,.18),0 0 72px rgba(215,25,32,.15);animation:rbt-stage-tension .82s ease-in-out infinite alternate}
[data-rbt-root][data-rbt-tension="critical"] .rbt-question-chamber{border-color:rgba(239,27,36,.34)!important}
.rbt-score-bump{animation:rbt-score-bump .44s cubic-bezier(.2,.85,.25,1)}
.rbt-option:focus-visible{outline:2px solid rgba(245,243,239,.94)!important;outline-offset:3px!important}
@keyframes rbt-stage-tension{from{transform:translateZ(0) scale(1)}to{transform:translateZ(0) scale(1.002)}}
@keyframes rbt-score-bump{0%{transform:scale(1)}42%{transform:scale(1.12)}100%{transform:scale(1)}}
@media(prefers-reduced-motion:reduce){[data-rbt-root][data-rbt-tension="critical"] .rbt-arena,.rbt-score-bump{animation:none!important}}
`;
document.head.append(style);

function parseSeconds(text){
  const match=String(text||'').match(/(\d+):(\d+)/);
  if(!match)return 30;
  return (Number(match[1])||0)*60+(Number(match[2])||0);
}

function syncTension(){
  if(!timerText)return;
  const remaining=Math.max(0,Math.min(30,parseSeconds(timerText.textContent)));
  root.dataset.rbtTension=remaining<=5?'critical':remaining<=10?'warning':'normal';
}

let previousScore=scoreEl?.textContent||'0';
function animateScore(){
  if(!scoreEl)return;
  const next=scoreEl.textContent||'0';
  if(next===previousScore)return;
  previousScore=next;
  [scoreEl,mobileScore].filter(Boolean).forEach((el)=>{
    el.classList.remove('rbt-score-bump');
    void el.offsetWidth;
    el.classList.add('rbt-score-bump');
    setTimeout(()=>el.classList.remove('rbt-score-bump'),480);
  });
}

function syncKeyboardLabels(){
  const options=[...(answerArea?.querySelectorAll('.rbt-option')||[])];
  const labels=['A','B','C','D'];
  options.forEach((button,index)=>{
    const label=labels[index];
    if(label)button.setAttribute('aria-keyshortcuts',label);
  });
  if(submitButton)submitButton.setAttribute('aria-keyshortcuts','Enter');
}

function gameIsActive(){
  return !!gameView&&!gameView.hidden;
}

document.addEventListener('keydown',(event)=>{
  if(!gameIsActive()||event.defaultPrevented||event.metaKey||event.ctrlKey||event.altKey)return;
  const active=document.activeElement;
  if(active?.classList?.contains('rbt-identification'))return;

  const options=[...(answerArea?.querySelectorAll('.rbt-option:not(:disabled)')||[])];
  if(!options.length)return;

  const map={a:0,b:1,c:2,d:3,'1':0,'2':1,'3':2,'4':3};
  const key=String(event.key||'').toLowerCase();
  if(Object.prototype.hasOwnProperty.call(map,key)){
    const option=options[map[key]];
    if(!option)return;
    event.preventDefault();
    option.focus({preventScroll:true});
    option.click();
    return;
  }

  if(event.key==='Enter'&&submitButton&&!submitButton.disabled&&
    (!active||active===document.body||active===root||active.classList?.contains('rbt-option'))){
    event.preventDefault();
    submitButton.click();
  }
});

const observer=new MutationObserver(()=>{
  syncTension();
  animateScore();
  syncKeyboardLabels();
});
if(timerText)observer.observe(timerText,{subtree:true,childList:true,characterData:true,attributes:true});
if(scoreEl)observer.observe(scoreEl,{subtree:true,childList:true,characterData:true});
if(answerArea)observer.observe(answerArea,{subtree:true,childList:true});

syncTension();
syncKeyboardLabels();
})();
