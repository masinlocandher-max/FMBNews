(()=>{
  if(!window.matchMedia('(max-width:699px)').matches)return;
  const root=document.querySelector('[data-fmb-mobile-home]');
  if(!root)return;
  const WEATHER_KEY='fmbWeatherV1';
  const $=(q,s=document)=>s.querySelector(q);
  const weatherLabels={0:['Clear','☀'],1:['Mostly clear','☀'],2:['Partly cloudy','◐'],3:['Cloudy','☁'],45:['Fog','≋'],48:['Fog','≋'],51:['Drizzle','☂'],53:['Drizzle','☂'],55:['Drizzle','☂'],61:['Rain','☂'],63:['Rain','☂'],65:['Heavy rain','☂'],71:['Snow','❄'],73:['Snow','❄'],75:['Snow','❄'],80:['Showers','☂'],81:['Showers','☂'],82:['Heavy showers','☂'],95:['Thunderstorm','ϟ'],96:['Thunderstorm','ϟ'],99:['Thunderstorm','ϟ']};
  const slogans=['The world is still moving. Here’s what changed.','Know what changed. Understand what matters.','Facts first. Context always.','Stay informed. Stay aware. Stay connected.','Information with purpose.'];
  const readCache=()=>{try{return JSON.parse(localStorage.getItem(WEATHER_KEY)||'null')}catch{return null}};
  const saveCache=v=>localStorage.setItem(WEATHER_KEY,JSON.stringify(v));

  function greetingFor(date){
    const h=date.getHours();
    if(h<5)return'Hello, night owl.';
    if(h<12)return'Good morning.';
    if(h<17)return'Good afternoon.';
    if(h<21)return'Good evening.';
    return'Still up?';
  }
  function tick(){
    const n=new Date(),date=$('[data-fmb-local-date]',root),time=$('[data-fmb-local-time]',root),greet=$('[data-fmb-greeting]',root);
    if(date){const day=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',weekday:'long'}).format(n),d=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',month:'long',day:'numeric',year:'numeric'}).format(n);date.textContent=`${day} · ${d}`}
    if(time)time.textContent=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:true}).format(n)+' PHT';
    if(greet)greet.textContent=greetingFor(n);
  }
  tick();setInterval(tick,30000);

  const slogan=$('[data-fmb-rotating-slogan],[data-fmb-greeting-line]',root);
  if(slogan){let index=Math.max(0,slogans.indexOf(slogan.textContent.trim()));setInterval(()=>{index=(index+1)%slogans.length;slogan.classList.add('is-changing');setTimeout(()=>{slogan.textContent=slogans[index];slogan.classList.remove('is-changing')},180)},7200)}

  function renderWeather(data){
    const text=$('[data-fmb-weather]',root),icon=$('[data-fmb-weather-icon]',root),note=$('[data-fmb-weather-note]',root);
    if(!data){if(text)text.textContent='Weather';if(note)note.textContent='Tap to set local';return}
    const label=weatherLabels[Number(data.code)]||['Weather','○'],age=Date.now()-Number(data.savedAt||0),stale=age>30*60*1000;
    if(icon)icon.textContent=label[1];if(text)text.textContent=`${Math.round(data.temp)}°`;if(note)note.textContent=`${data.city||'Local'} · ${label[0]}${stale?' · cached':''}`;
  }
  renderWeather(readCache());
  async function fetchWeather(lat,lon,city){const u=new URL('https://api.open-meteo.com/v1/forecast');u.searchParams.set('latitude',lat);u.searchParams.set('longitude',lon);u.searchParams.set('current','temperature_2m,weather_code');u.searchParams.set('timezone','auto');const r=await fetch(u);if(!r.ok)throw new Error('Weather is unavailable right now.');const d=await r.json(),data={temp:d.current?.temperature_2m,code:d.current?.weather_code,city:city||'Local weather',savedAt:Date.now()};saveCache(data);renderWeather(data);return data}
  async function geocode(city){const u=new URL('https://geocoding-api.open-meteo.com/v1/search');u.searchParams.set('name',city);u.searchParams.set('count','1');u.searchParams.set('language','en');u.searchParams.set('format','json');const r=await fetch(u);if(!r.ok)throw new Error('Could not find that city.');const d=await r.json(),hit=d.results?.[0];if(!hit)throw new Error('Could not find that city.');return hit}
  function weatherSheet(){document.querySelector('.fmb-weather-sheet')?.remove();const el=document.createElement('div');el.className='fmb-weather-sheet';el.innerHTML=`<section class="fmb-weather-panel" role="dialog" aria-modal="true" aria-labelledby="fmb-weather-title"><h2 id="fmb-weather-title">Local weather</h2><p>FMB News asks for location only after you choose it. You can also enter a city manually.</p><div class="fmb-weather-actions"><button type="button" data-use-location>Use Current Location</button><button type="button" class="secondary" data-close-weather>Not now</button></div><form class="fmb-weather-manual"><input type="text" autocomplete="address-level2" placeholder="City, e.g. Masinloc" aria-label="City"><button type="submit">Set</button></form><div class="fmb-weather-status" role="status" aria-live="polite"></div></section>`;document.body.append(el);const status=$('.fmb-weather-status',el);$('[data-close-weather]',el).onclick=()=>el.remove();el.addEventListener('click',e=>{if(e.target===el)el.remove()});$('[data-use-location]',el).onclick=()=>{if(!navigator.geolocation){status.textContent='Location is not supported on this device.';return}status.textContent='Getting your location…';navigator.geolocation.getCurrentPosition(async pos=>{try{await fetchWeather(pos.coords.latitude,pos.coords.longitude,'Near you');el.remove()}catch(err){status.textContent=err.message}},()=>{status.textContent='Location was not shared. Enter a city instead.'},{enableHighAccuracy:false,timeout:10000,maximumAge:30*60*1000})};$('.fmb-weather-manual',el).onsubmit=async e=>{e.preventDefault();const city=$('input',e.currentTarget).value.trim();if(!city)return;status.textContent='Finding weather…';try{const hit=await geocode(city);await fetchWeather(hit.latitude,hit.longitude,hit.name);el.remove()}catch(err){status.textContent=err.message}}}
  root.querySelectorAll('[data-fmb-weather-button]').forEach(button=>button.addEventListener('click',weatherSheet));
  $('[data-fmb-customize]',root)?.addEventListener('click',()=>{const account=document.querySelector('[data-fmb-account],.fmb-account-button,[data-account]');if(account)account.click();else window.scrollTo({top:0,behavior:'smooth'})});
})();