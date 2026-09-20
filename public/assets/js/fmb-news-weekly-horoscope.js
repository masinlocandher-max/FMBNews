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
Aries:['You do not need to respond to everything immediately. Some situations become clearer when you give them room.','Direct communication helps, but timing matters. Say what you mean without turning every uncertainty into a confrontation.','Focus on work that produces measurable value. Avoid spending simply because something promises faster progress.','Your momentum is strong, but constant stimulation can become exhausting. Build quiet into the week.','Tuesday, September 22','What deserves action now, and what only feels urgent?'],
Taurus:['Stability is useful until maintaining it costs more than changing.','Reliability matters more than dramatic reassurance. Notice who consistently makes space for you.','Review recurring expenses, commitments, and responsibilities. Small inefficiencies deserve attention before they become permanent costs.','Familiar routines will help, but introduce enough variety to prevent stagnation.','Thursday, September 24','What am I preserving because it is valuable, and what am I preserving simply because it is familiar?'],
Gemini:['Your attention is valuable. Treat it like a limited resource.','A meaningful conversation could reveal more than assumptions ever will. Listen beyond the most interesting part of the story.','One promising idea deserves deeper execution. Finish something before expanding its scope.','Mental fatigue may appear before physical tiredness. Reduce unnecessary information intake.','Wednesday, September 23','Which possibility becomes stronger if I finally give it my full attention?'],
Cancer:['Care for others without automatically becoming responsible for everything they feel.','Do not expect someone to understand a need you have never clearly expressed. Vulnerability works better when paired with clarity.','Protect your time from responsibilities that have quietly migrated onto your plate without discussion.','Rest is particularly important after socially or emotionally demanding days.','Friday, September 25','Where have I mistaken caring for carrying?'],
Leo:['Recognition feels good, but substance lasts longer.','Affection becomes more convincing through attention than performance. Give someone the experience of being genuinely heard.','Visibility can help professionally, but make sure the work underneath it is equally strong. Reputation compounds when delivery matches presentation.','Confidence improves when you keep promises you make to yourself.','Sunday, September 20','If nobody applauded this decision, would I still believe it was worth making?'],
Virgo:['Improvement is useful. Perfectionism is often improvement that has lost its sense of proportion.','Resist analyzing every pause, message, or change in tone. Ask rather than constructing explanations from incomplete information.','Excellent week for editing, auditing, organizing, and correcting inefficient systems.','Your mind may stay active after your work is technically finished. Create a clear end-of-day boundary.','Monday, September 21','What would “good enough to move forward” look like here?'],
Libra:['Peace is not always the absence of disagreement. Sometimes it comes from finally making the decision.','Mutuality matters. Notice whether compromise is moving in both directions.','Negotiations and collaborative decisions benefit from clear terms. Do not accept vagueness merely to keep things pleasant.','Decision fatigue may be your larger drain. Simplify low-stakes choices where possible.','Wednesday, September 23','What would I choose if pleasing everyone were removed from the equation?'],
Scorpio:['Not everything hidden is profound, and not everything obvious is superficial.','Intensity should not substitute for consistency. Pay attention to patterns rather than isolated moments.','Research is favored, particularly before making commitments involving money, partnerships, or long-term consequences.','Give yourself somewhere productive to place emotional intensity rather than letting it circulate internally.','Thursday, September 24','What do I actually know, and what have I merely inferred?'],
Sagittarius:['Expansion becomes meaningful when it has direction.','Shared experiences can refresh connection. For singles, curiosity may matter more than immediately deciding where an interaction is going.','Think beyond the immediate payoff. Learning, networking, or building something now may create value later, but avoid speculative spending without evidence.','Movement and a change of environment can reset your perspective.','Saturday, September 26','Am I moving toward something meaningful or simply away from boredom?'],
Capricorn:['Being capable does not mean every responsibility should belong to you.','Let relationships contain enjoyment as well as responsibility. Not every meaningful interaction needs to accomplish something.','Strong period for long-term planning and assessing whether your workload matches your actual objectives.','Recovery should be treated as maintenance, not a reward earned only after exhaustion.','Monday, September 21','What am I doing because it matters, and what am I doing because people know I will?'],
Aquarius:['Original thinking becomes powerful when other people can understand and use it.','Intellectual compatibility is valuable, but emotional presence cannot always be reasoned into existence. Allow conversations to become personal.','Prototype before overbuilding. Test an idea cheaply before committing significant time or money.','Too much screen time or mental stimulation may leave you feeling strangely disconnected. Return to something tangible.','Tuesday, September 22','How can I turn an interesting idea into something genuinely useful?'],
Pisces:['Your intuition deserves attention, but clarity improves when intuition is checked against reality.','Avoid romanticizing ambiguity. Genuine interest usually becomes clearer through consistent behavior.','Creative work is favored, especially when imagination is paired with deadlines and concrete deliverables. Be cautious with emotionally driven purchases.','Solitude can restore you, provided it does not become avoidance.','Friday, September 25','What is my intuition telling me, and what evidence would help me understand it better?']};
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
  return 'Sep 20 – Sep 26, 2026';
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