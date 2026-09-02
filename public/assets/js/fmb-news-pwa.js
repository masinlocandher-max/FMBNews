(()=>{
  'use strict';

  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
  const isMobile=()=>window.matchMedia('(max-width: 899px)').matches;
  const isNewsHome=()=>location.pathname.replace(/\/+$/,'')==='/news';
  let installPrompt=null;

  function addStyles(){
    if(document.getElementById('fmb-pwa-style'))return;
    const style=document.createElement('style');
    style.id='fmb-pwa-style';
    style.textContent=`
      .fmb-pwa-install{position:fixed;right:16px;bottom:max(18px,env(safe-area-inset-bottom));z-index:2147481500;display:none;align-items:center;justify-content:center;gap:.45rem;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(36,16,47,.94);color:#fff;padding:.72rem 1rem;font:inherit;font-weight:700;cursor:pointer;box-shadow:0 14px 45px rgba(0,0,0,.32);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
      .fmb-pwa-install[data-visible="true"]{display:inline-flex}
      .fmb-pwa-install svg{width:1rem;height:1rem;fill:currentColor}
      .fmb-pwa-sheet{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:end center;background:rgba(8,4,14,.55);padding:20px;padding-bottom:max(20px,env(safe-area-inset-bottom));backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
      .fmb-pwa-panel{width:min(100%,540px);border:1px solid rgba(255,255,255,.13);border-radius:26px;background:#24102f;color:#fff;padding:24px;box-shadow:0 28px 90px rgba(0,0,0,.45)}
      .fmb-pwa-panel h2{font-size:1.35rem;line-height:1.15;margin:0 0 10px}.fmb-pwa-panel p{margin:0;color:rgba(255,255,255,.72);line-height:1.55}.fmb-pwa-panel ol{margin:18px 0 0;padding-left:1.25rem;color:rgba(255,255,255,.88);line-height:1.65}.fmb-pwa-panel button{margin-top:20px;width:100%;border:0;border-radius:999px;background:#fff;color:#24102f;padding:13px 18px;font:inherit;font-weight:800;cursor:pointer}
      @media (display-mode: standalone){html{background:#170b24}body{overscroll-behavior-y:contain}.masthead{padding-top:env(safe-area-inset-top)}.fmb-pwa-install{display:none!important}body::after{content:"";position:fixed;left:0;right:0;bottom:0;height:env(safe-area-inset-bottom);background:#170b24;pointer-events:none;z-index:2147482000}}
    `;
    document.head.appendChild(style);
  }

  function sheet(){
    document.querySelector('.fmb-pwa-sheet')?.remove();
    const wrap=document.createElement('div');
    wrap.className='fmb-pwa-sheet';
    wrap.innerHTML=`<section class="fmb-pwa-panel" role="dialog" aria-modal="true" aria-labelledby="fmb-pwa-title"><h2 id="fmb-pwa-title">Add FMB News to your Home Screen</h2><p>It will open in its own app-style window with no browser address bar.</p><ol><li>Tap the Share button in your browser.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>.</li></ol><button type="button">Got it</button></section>`;
    document.body.appendChild(wrap);
    wrap.querySelector('button')?.addEventListener('click',()=>wrap.remove());
    wrap.addEventListener('click',event=>{if(event.target===wrap)wrap.remove()});
  }

  function installButton(){
    let button=document.querySelector('[data-fmb-install-app]');
    if(button)return button;
    button=document.createElement('button');
    button.type='button';
    button.className='fmb-pwa-install';
    button.dataset.fmbInstallApp='true';
    button.setAttribute('aria-label','Install FMB News app');
    button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v10.17l3.59-3.58L18 11l-6 6-6-6 1.41-1.41L11 13.17V3ZM5 19h14v2H5v-2Z"/></svg><span>Install app</span>';
    document.body.appendChild(button);
    button.addEventListener('click',async()=>{
      if(installPrompt){
        installPrompt.prompt();
        try{await installPrompt.userChoice}catch{}
        installPrompt=null;
        button.dataset.visible='false';
        return;
      }
      if(isIOS())sheet();
    });
    return button;
  }

  function updateInstallUI(){
    const existing=document.querySelector('[data-fmb-install-app]');
    if(isStandalone()){
      document.documentElement.classList.add('fmb-pwa-installed');
      if(existing)existing.dataset.visible='false';
      return;
    }
    if(!isMobile()||!isNewsHome()){
      if(existing)existing.dataset.visible='false';
      return;
    }
    const button=installButton();
    const shouldShow=Boolean(installPrompt)||isIOS();
    button.dataset.visible=shouldShow?'true':'false';
    const label=button.querySelector('span');
    if(label)label.textContent=isIOS()&&!installPrompt?'Add to Home Screen':'Install app';
  }

  async function registerServiceWorker(){
    if(!('serviceWorker'in navigator)||location.protocol!=='https:')return;
    try{
      const registration=await navigator.serviceWorker.register('/news/sw.js',{scope:'/news/'});
      registration.update().catch(()=>{});
    }catch(error){console.warn('FMB News service worker registration failed.',error)}
  }

  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    installPrompt=event;
    updateInstallUI();
  });

  window.addEventListener('appinstalled',()=>{
    installPrompt=null;
    document.documentElement.classList.add('fmb-pwa-installed');
    updateInstallUI();
  });

  addStyles();
  registerServiceWorker();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',updateInstallUI,{once:true});
  else updateInstallUI();
})();
