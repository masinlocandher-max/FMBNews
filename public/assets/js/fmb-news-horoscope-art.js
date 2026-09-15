(()=>{
const sprite='/assets/images/horoscope/zodiac-production-light-dark.webp?v=20260916-production-v1';
const positions={
Aries:['0%','0%','66.667%'],Taurus:['20%','0%','66.667%'],Gemini:['40%','0%','66.667%'],Cancer:['60%','0%','66.667%'],Leo:['80%','0%','66.667%'],Virgo:['100%','0%','66.667%'],
Libra:['0%','33.333%','100%'],Scorpio:['20%','33.333%','100%'],Sagittarius:['40%','33.333%','100%'],Capricorn:['60%','33.333%','100%'],Aquarius:['80%','33.333%','100%'],Pisces:['100%','33.333%','100%']
};
const style=document.createElement('style');
style.textContent=`
body.fmb-horoscope-page .fmb-zodiac-grid .fmb-zodiac-art,
body.fmb-horoscope-page .fmb-reading-zodiac-art{
  display:block!important;
  border:0!important;
  border-radius:0!important;
  background-image:url("${sprite}")!important;
  background-repeat:no-repeat!important;
  background-size:600% 400%!important;
  background-position:var(--hz-x) var(--hz-y-light)!important;
  background-color:#FAF9F6!important;
  box-shadow:none!important;
  filter:none!important;
}
body.fmb-horoscope-page .fmb-zodiac-grid .fmb-zodiac-art{
  width:64px!important;
  height:64px!important;
  flex:0 0 64px!important;
}
body.fmb-horoscope-page .fmb-reading-zodiac-art{
  width:250px!important;
  height:250px!important;
  flex:0 0 250px!important;
}
html[data-fmb-theme="dark"] body.fmb-horoscope-page .fmb-zodiac-grid .fmb-zodiac-art,
html[data-fmb-theme="dark"] body.fmb-horoscope-page .fmb-reading-zodiac-art{
  background-position:var(--hz-x) var(--hz-y-dark)!important;
  background-color:#0A0A0A!important;
}
@media(prefers-color-scheme:dark){
  html:not([data-fmb-theme]) body.fmb-horoscope-page .fmb-zodiac-grid .fmb-zodiac-art,
  html:not([data-fmb-theme]) body.fmb-horoscope-page .fmb-reading-zodiac-art,
  html[data-fmb-theme="system"] body.fmb-horoscope-page .fmb-zodiac-grid .fmb-zodiac-art,
  html[data-fmb-theme="system"] body.fmb-horoscope-page .fmb-reading-zodiac-art{
    background-position:var(--hz-x) var(--hz-y-dark)!important;
    background-color:#0A0A0A!important;
  }
}
body.fmb-horoscope-page .fmb-zodiac-grid button[aria-pressed="true"] .fmb-zodiac-art{
  box-shadow:none!important;
  filter:none!important;
}
`;
document.head.appendChild(style);
function art(sign,cls){
  const p=positions[sign];
  if(!p)return null;
  const el=document.createElement('span');
  el.className=cls;
  el.setAttribute('aria-hidden','true');
  el.style.setProperty('--hz-x',p[0]);
  el.style.setProperty('--hz-y-light',p[1]);
  el.style.setProperty('--hz-y-dark',p[2]);
  return el;
}
function decorate(){
  document.querySelectorAll('[data-zodiac-grid] button[data-sign]').forEach(btn=>{
    const old=btn.querySelector('.fmb-zodiac-icon');
    const node=art(btn.dataset.sign,'fmb-zodiac-art');
    if(old&&node)old.replaceWith(node);
  });
  const reading=document.querySelector('[data-horoscope-reading]');
  const sign=reading?.querySelector('.fmb-horoscope-title h2')?.textContent?.trim();
  const old=reading?.querySelector('.fmb-reading-zodiac-icon');
  const node=sign?art(sign,'fmb-reading-zodiac-art'):null;
  if(old&&node)old.replaceWith(node);
}
decorate();
const observer=new MutationObserver(decorate);
const grid=document.querySelector('[data-zodiac-grid]');
const reading=document.querySelector('[data-horoscope-reading]');
if(grid)observer.observe(grid,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']});
if(reading)observer.observe(reading,{childList:true,subtree:true});
})();
