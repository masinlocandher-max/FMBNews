(()=>{
const sprite='/assets/images/horoscope/zodiac-sprite.png?v=20260902-1';
const positions={
Aries:['0%','0%'],Taurus:['33.333%','0%'],Gemini:['66.667%','0%'],Cancer:['100%','0%'],
Leo:['0%','50%'],Virgo:['33.333%','50%'],Libra:['66.667%','50%'],Scorpio:['100%','50%'],
Sagittarius:['0%','100%'],Capricorn:['33.333%','100%'],Aquarius:['66.667%','100%'],Pisces:['100%','100%']
};
const style=document.createElement('style');
style.textContent='.fmb-zodiac-art,.fmb-reading-zodiac-art{display:block;border-radius:50%;background-image:url("'+sprite+'");background-repeat:no-repeat;background-size:400% 300%;background-color:#fff}.fmb-zodiac-art{width:42px;height:42px}.fmb-reading-zodiac-art{width:54px;height:54px;flex:0 0 54px}.fmb-zodiac-grid button[aria-pressed="true"] .fmb-zodiac-art{box-shadow:0 0 0 2px rgba(255,255,255,.65)}';
document.head.appendChild(style);
function art(sign,cls){
const p=positions[sign];if(!p)return null;
const el=document.createElement('span');
el.className=cls;el.setAttribute('aria-hidden','true');el.style.backgroundPosition=p[0]+' '+p[1];return el;
}
function decorate(){
document.querySelectorAll('[data-zodiac-grid] button[data-sign]').forEach(btn=>{const old=btn.querySelector('.fmb-zodiac-icon');const node=art(btn.dataset.sign,'fmb-zodiac-art');if(old&&node)old.replaceWith(node);});
const reading=document.querySelector('[data-horoscope-reading]');
const sign=reading?.querySelector('.fmb-horoscope-title h2')?.textContent?.trim();
const old=reading?.querySelector('.fmb-reading-zodiac-icon');const node=sign?art(sign,'fmb-reading-zodiac-art'):null;if(old&&node)old.replaceWith(node);
}
decorate();
const observer=new MutationObserver(decorate);
const grid=document.querySelector('[data-zodiac-grid]');const reading=document.querySelector('[data-horoscope-reading]');
if(grid)observer.observe(grid,{childList:true,subtree:true});if(reading)observer.observe(reading,{childList:true,subtree:true});
})();
