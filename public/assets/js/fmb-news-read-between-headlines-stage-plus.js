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
const questionNo=root.querySelector('[data-rbt-question-no]');

const style=document.createElement('style');
style.dataset.rbtStagePlus='true';
style.textContent=`
[data-rbt-root][data-rbt-tension="warning"] .rbt-arena{box-shadow:inset 0 0 0 1px rgba(215,25,32,.08),0 28px 80px rgba(10,10,10,.14),0 0 54px rgba(215,25,32,.08)}
[data-rbt-root][data-rbt-tension="critical"] .rbt-arena{box-shadow:inset 0 0 0 1px rgba(239,27,36,.16),0 28px 86px rgba(10,10,10,.18),0 0 72px rgba(215,25,32,.15);animation:rbt-stage-tension .82s ease-in-out infinite alternate}
[data-rbt-root][data-rbt-tension="critical"] .rbt-question-chamber{border-color:rgba(239,27,36,.34)!important}
.rbt-score-bump{animation:rbt-score-bump .44s cubic-bezier(.2,.85,.25,1)}
.rbt-option:focus-visible{outline:2px solid rgba(245,243,239,.94)!important;outline-offset:3px!important}
.rbt-question-entering .rbt-question-card{animation:rbt-question-arrive .36s cubic-bezier(.2,.82,.24,1) both}
.rbt-answer-locked .rbt-question-chamber{box-shadow:inset 0 1px 0 rgba(255,255,255,.32),0 0 0 1px rgba(215,25,32,.12),0 20px 52px rgba(215,25,32,.10)!important}
.rbt-answer-locked .rbt-feedback{animation:rbt-lock-confirm .34s cubic-bezier(.2,.82,.24,1) both}
.rbt-ladder-list [data-milestone="true"].is-past{box-shadow:inset 0 0 0 1px rgba(215,25,32,.22),0 0 18px rgba(215,25,32,.08)}
.rbt-milestone-flash{position:fixed;z-index:90;left:50%;top:max(74px,calc(env(safe-area-inset-top) + 58px));width:min(520px,calc(100vw - 32px));transform:translate(-50%,-14px);opacity:0;pointer-events:none;padding:14px 20px;border:1px solid rgba(215,25,32,.34);border-radius:18px;background:linear-gradient(120deg,rgba(255,255,255,.14),transparent 34%,rgba(215,25,32,.07)),rgba(16,16,16,.68);-webkit-backdrop-filter:blur(18px) saturate(132%);backdrop-filter:blur(18px) saturate(132%);box-shadow:inset 0 1px 0 rgba(255,255,255,.24),0 16px 44px rgba(0,0,0,.28),0 0 26px rgba(215,25,32,.10);text-align:center;color:#f5f3ef;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:11px;font-weight:800;line-height:1.35;letter-spacing:.13em;text-transform:uppercase;transition:opacity .18s ease,transform .24s cubic-bezier(.2,.82,.24,1)}
.rbt-milestone-flash[data-visible="true"]{opacity:1;transform:translate(-50%,0)}
.rbt-milestone-flash strong{color:#ff747a;font:600 16px/1.2 'Bodoni Moda',Georgia,serif;letter-spacing:.015em;text-transform:none;margin-right:8px}
@keyframes rbt-stage-tension{from{transform:translateZ(0) scale(1)}to{transform:translateZ(0) scale(1.002)}}
@keyframes rbt-score-bump{0%{transform:scale(1)}42%{transform:scale(1.12)}100%{transform:scale(1)}}
@keyframes rbt-question-arrive{0%{opacity:.68;transform:translateY(7px)}100%{opacity:1;transform:translateY(0)}}
@keyframes rbt-lock-confirm{0%{opacity:.45;transform:translateY(3px)}100%{opacity:1;transform:translateY(0)}}
@media(prefers-color-scheme:light){.rbt-milestone-flash{background:linear-gradient(120deg,rgba(255,255,255,.70),transparent 36%,rgba(215,25,32,.06)),rgba(245,243,239,.82);color:#141414;box-shadow:inset 0 1px 0 rgba(255,255,255,.78),0 16px 40px rgba(10,10,10,.13),0 0 24px rgba(215,25,32,.08)}.rbt-milestone-flash strong{color:#b70f17}}
@media(prefers-reduced-motion:reduce){[data-rbt-root][data-rbt-tension="critical"] .rbt-arena,.rbt-score-bump,.rbt-question-entering .rbt-question-card,.rbt-answer-locked .rbt-feedback{animation:none!important}.rbt-milestone-flash{transition:none!important}}
`;
document.head.append(style);

const milestoneFlash=document.createElement('div');
milestoneFlash.className='rbt-milestone-flash';
milestoneFlash.dataset.rbtMilestoneFlash='true';
milestoneFlash.dataset.visible='false';
milestoneFlash.setAttribute('role','status');
milestoneFlash.setAttribute('aria-live','polite');
milestoneFlash.setAttribute('aria-atomic','true');
document.body.append(milestoneFlash);
let milestoneTimer=null;

function parseSeconds(text){
  const match=String(text||'').match(/(\d+):(\d+)/);
  if(!match)return 30;
  return (Number(match[1])||0)*60+(Number(match[2])||0);
}

function currentQuestion(){
  const match=String(questionNo?.textContent||'').match(/Question\s+(\d+)/i);
  return match?Number(match[1]):1;
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

function showMilestone(completed){
  if(![5,10,15,20,25].includes(completed))return;
  clearTimeout(milestoneTimer);
  milestoneFlash.innerHTML=`<strong>${completed} questions cleared.</strong>${30-completed} to go`;
  milestoneFlash.dataset.visible='true';
  milestoneTimer=setTimeout(()=>{milestoneFlash.dataset.visible='false';},1050);
}

let previousQuestion=currentQuestion();
function syncQuestionProgress(){
  const next=currentQuestion();
  if(next===previousQuestion)return;
  const completed=next-1;
  if(next>previousQuestion)showMilestone(completed);
  previousQuestion=next;
}

function gameIsActive(){
  return !!gameView&&!gameView.hidden;
}

document.addEventListener('keydown',(event)=>{
  if(!gameIsActive()||event.defaultPrevented||event.metaKey||event.ctrlKey||event.altKey||event.repeat)return;
  const active=document.activeElement;
  if(active?.classList?.contains('rbt-identification'))return;

  if(event.key==='Enter'&&submitButton&&!submitButton.disabled&&
    (!active||active===document.body||active===root||active.classList?.contains('rbt-option'))){
    event.preventDefault();
    event.stopPropagation();
    submitButton.click();
    return;
  }

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
  }
});

const observer=new MutationObserver(()=>{
  syncTension();
  animateScore();
  syncKeyboardLabels();
  syncQuestionProgress();
});
if(timerText)observer.observe(timerText,{subtree:true,childList:true,characterData:true,attributes:true});
if(scoreEl)observer.observe(scoreEl,{subtree:true,childList:true,characterData:true});
if(answerArea)observer.observe(answerArea,{subtree:true,childList:true});
if(questionNo)observer.observe(questionNo,{subtree:true,childList:true,characterData:true});

syncTension();
syncKeyboardLabels();
syncQuestionProgress();
})();
