(()=>{
const signs=[
{name:'Aries',icon:'♈',range:'Mar 21 – Apr 19'},
{name:'Taurus',icon:'♉',range:'Apr 20 – May 20'},
{name:'Gemini',icon:'♊',range:'May 21 – Jun 20'},
{name:'Cancer',icon:'♋',range:'Jun 21 – Jul 22'},
{name:'Leo',icon:'♌',range:'Jul 23 – Aug 22'},
{name:'Virgo',icon:'♍',range:'Aug 23 – Sep 22'},
{name:'Libra',icon:'♎',range:'Sep 23 – Oct 22'},
{name:'Scorpio',icon:'♏',range:'Oct 23 – Nov 21'},
{name:'Sagittarius',icon:'♐',range:'Nov 22 – Dec 21'},
{name:'Capricorn',icon:'♑',range:'Dec 22 – Jan 19'},
{name:'Aquarius',icon:'♒',range:'Jan 20 – Feb 18'},
{name:'Pisces',icon:'♓',range:'Feb 19 – Mar 20'}
];
const readings={
Aries:['Move with urgency, but do not confuse speed with clarity. One decision benefits from a second look.','Directness helps, but listening matters just as much.','Finish the highest-impact task first and avoid scattering your attention.','Strong energy. Pace yourself so momentum lasts.','Tuesday','What deserves action, and what only feels urgent?'],
Taurus:['Stability comes from simplifying. A practical choice may matter more than a dramatic one.','Consistency is more useful than guessing where you stand.','Review recurring costs, commitments, and anything that quietly drains resources.','Protect your routine and make rest part of the plan.','Friday','What can you make easier this week?'],
Gemini:['Information moves quickly this week. Verify before repeating, and give important conversations your full attention.','Ask instead of assuming. Clear questions reduce unnecessary tension.','Organize ideas before adding more. One finished thought beats five unfinished ones.','Reduce mental clutter and take short breaks from constant input.','Wednesday','Which signal matters more than the noise?'],
Cancer:['Home, belonging, and emotional boundaries come into focus. Make room for care without carrying everything.','Say what support actually looks like instead of hoping someone will guess.','Avoid taking on invisible labor automatically. Protect time for your own priorities.','Recovery is productive. Build a quieter pocket into the week.','Monday','What are you protecting, and why?'],
Leo:['Visibility rises, but substance matters more than applause. Let the work speak before the performance.','Generosity works best without scorekeeping or hidden expectations.','Present one strong idea clearly. Do not overdecorate a message that already works.','Channel confidence into completion, not just activity.','Sunday','What would you still choose without an audience?'],
Virgo:['Details reveal the next move. A small correction now can prevent a larger problem later.','Soften criticism with context and leave room for another perspective.','Audit the process, not just the result. A weak system keeps reproducing the same problem.','Schedule breathing room before your calendar fills itself.','Thursday','Which detail genuinely changes the outcome?'],
Libra:['Balance is not the same as keeping everyone comfortable. A fair boundary may be the most diplomatic choice.','Clarity reduces resentment. Say what you can and cannot give.','Define what a good compromise actually includes before agreeing to one.','Step away from endless comparison and decision fatigue.','Friday','Where are you trading clarity for peace?'],
Scorpio:['A hidden assumption becomes easier to see. Use that insight to reset strategy rather than intensify conflict.','Honesty works better than testing people or reading too much into silence.','Investigate before committing. A missing detail may change the whole picture.','Protect focus and limit unnecessary emotional noise.','Tuesday','What changes when you stop guessing motives?'],
Sagittarius:['The week favors learning, movement, and perspective, but not careless promises. Leave space for new facts.','Curiosity helps more than certainty. Ask what you have not yet considered.','Test an idea before scaling it. Exploration is useful when paired with evidence.','Movement clears your head. Make room for something that expands perspective.','Saturday','Which belief needs fresh evidence?'],
Capricorn:['Long-term thinking pays off when paired with a realistic next step. Progress may look quieter than expected.','Make time, not just plans. Consistency will say more than elaborate promises.','Protect the foundation before expanding. Stability is an advantage this week.','Consistency over intensity. Your pace should be repeatable.','Thursday','What is the next durable move?'],
Aquarius:['A different perspective can unlock a stuck problem. Keep the originality, but make the idea usable.','Explain the thought behind the distance instead of assuming others understand it.','Translate vision into a simple system people can actually follow.','Alternate solitude and collaboration instead of forcing one mode all week.','Wednesday','How can the unusual become practical?'],
Pisces:['Sensitivity is useful information, but it still needs boundaries. Put intuition beside evidence before deciding.','Name what you need without overexplaining or shrinking the request.','Separate inspiration from obligation. Not every possibility has to become a commitment.','Protect sleep, quiet time, and the spaces where your mind can settle.','Monday','What feels true, and what can you verify?']};
const icons={
overview:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.55 5.17 5.7.83-4.12 4.02.97 5.68L12 15.81 6.9 18.5l.97-5.68L3.75 8.8l5.7-.83L12 2.8Z"/></svg>',
love:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.2 4.8 13C1.4 9.6 3.84 4 8.5 4c1.54 0 2.93.71 3.5 1.83A4.01 4.01 0 0 1 15.5 4c4.66 0 7.1 5.6 3.7 9L12 20.2Z"/></svg>',
career:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5V3.8C9 2.8 9.8 2 10.8 2h2.4c1 0 1.8.8 1.8 1.8V5h4.2A2.8 2.8 0 0 1 22 7.8v10.4a2.8 2.8 0 0 1-2.8 2.8H4.8A2.8 2.8 0 0 1 2 18.2V7.8A2.8 2.8 0 0 1 4.8 5H9Zm2 0h2V4h-2v1Zm-7 6.1V18c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-6.9c-2.3 1.12-4.97 1.75-8 1.75s-5.7-.63-8-1.75Zm8 .75c2.92 0 5.6-.66 8-1.91V8c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v1.94c2.4 1.25 5.08 1.91 8 1.91Z"/></svg>',
energy:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.25 1.8 5.9 13h5.16l-.72 9.2L18.1 10.6h-5.22l.37-8.8Z"/></svg>'
};
const grid=document.querySelector('[data-zodiac-grid]');
const reading=document.querySelector('[data-horoscope-reading]');
const week=document.querySelector('[data-horoscope-week]');
if(!grid||!reading)return;
function weekRange(){
  const n=new Date();
  const day=(n.getDay()+6)%7;
  const start=new Date(n);
  start.setHours(0,0,0,0);
  start.setDate(n.getDate()-day);
  const end=new Date(start);
  end.setDate(start.getDate()+6);
  const a=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(start);
  const b=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(end);
  return `${a} – ${b}`;
}
if(week)week.textContent=weekRange();
function section(icon,title,body){
  return `<section class="fmb-horoscope-section"><span class="fmb-horoscope-section-icon">${icons[icon]}</span><div><h3>${title}</h3><p>${body}</p></div></section>`;
}
function render(sign){
  localStorage.setItem('fmbZodiacV1',sign);
  [...grid.querySelectorAll('button')].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sign===sign)));
  const r=readings[sign];
  const meta=signs.find(s=>s.name===sign);
  reading.innerHTML=`
    <header class="fmb-horoscope-title">
      <div class="fmb-horoscope-title-copy">
        <span class="fmb-reading-kicker">This week</span>
        <h2>${sign}</h2>
        <p class="fmb-sign-range">${meta.range}</p>
        <p class="fmb-reading-intro">${r[0]}</p>
      </div>
      <div class="fmb-reading-art-wrap"><span class="fmb-reading-zodiac-icon" aria-hidden="true">${meta.icon}</span></div>
    </header>
    <div class="fmb-horoscope-sections">
      ${section('overview','General Outlook',r[0])}
      ${section('love','Love',r[1])}
      ${section('career','Career / Money',r[2])}
      ${section('energy','Energy / Well-being',r[3])}
    </div>
    <div class="fmb-reading-details">
      <div><span>Key day</span><strong>${r[4]}</strong></div>
      <blockquote><span>Reflection prompt</span><p>${r[5]}</p></blockquote>
    </div>`;
}
grid.innerHTML=signs.map(s=>`<button type="button" data-sign="${s.name}" aria-pressed="false"><span class="fmb-zodiac-icon" aria-hidden="true">${s.icon}</span><span class="fmb-zodiac-name">${s.name}</span><span class="fmb-zodiac-range">${s.range}</span></button>`).join('');
grid.addEventListener('click',e=>{
  const b=e.target.closest('button[data-sign]');
  if(b)render(b.dataset.sign);
});
render(localStorage.getItem('fmbZodiacV1')||'Aries');
})();
