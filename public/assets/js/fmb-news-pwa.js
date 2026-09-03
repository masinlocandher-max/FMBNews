(()=>{
  'use strict';

  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
  let installPrompt=null;

  function addStyles(){
    if(document.getElementById('fmb-pwa-style'))return;
    const style=document.createElement('style');
    style.id='fmb-pwa-style';
    style.textContent=`
      .fmb-pwa-sheet{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:end center;background:rgba(8,4,14,.36);padding:12px;padding-bottom:max(12px,env(safe-area-inset-bottom));backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
      .fmb-pwa-panel{width:min(100%,540px);border:1px solid rgba(0,0,0,.08);border-radius:28px;background:rgba(250,250,252,.97);color:#1d1d1f;padding:22px;box-shadow:0 24px 80px rgba(0,0,0,.24);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif}
      .fmb-pwa-panel h2{font-size:1.3rem;line-height:1.15;margin:0 0 9px;letter-spacing:-.025em}.fmb-pwa-panel p{margin:0;color:#6e6e73;line-height:1.5;font-size:.94rem}.fmb-pwa-panel ol{margin:17px 0 0;padding-left:1.25rem;color:#343438;line-height:1.6}.fmb-pwa-panel button{margin-top:18px;width:100%;min-height:48px;border:0;border-radius:14px;background:#24102f;color:#fff;padding:12px 18px;font:inherit;font-weight:750;cursor:pointer}
      @media (display-mode: standalone){html{background:#170b24}body{overscroll-behavior-y:contain}.masthead{padding-top:env(safe-area-inset-top)}body::after{content:"";position:fixed;left:0;right:0;bottom:0;height:env(safe-area-inset-bottom);background:#170b24;pointer-events:none;z-index:2147482000}}
    `;
    document.head.appendChild(style);
  }

  function sheet(){
    document.querySelector('.fmb-pwa-sheet')?.remove();
    const wrap=document.createElement('div');
    wrap.className='fmb-pwa-sheet';
    const copy=isIOS()
      ? '<h2 id="fmb-pwa-title">Add FMB News to Home Screen</h2><p>Safari controls the Apple system action.</p><ol><li>Tap the <strong>Share</strong> button in Safari.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>.</li></ol>'
      : '<h2 id="fmb-pwa-title">Install FMB News</h2><p>Your browser can add FMB News to your Home Screen.</p>';
    wrap.innerHTML=`<section class="fmb-pwa-panel" role="dialog" aria-modal="true" aria-labelledby="fmb-pwa-title">${copy}<button type="button">Got it</button></section>`;
    document.body.appendChild(wrap);
    wrap.querySelector('button')?.addEventListener('click',()=>wrap.remove());
    wrap.addEventListener('click',event=>{if(event.target===wrap)wrap.remove()});
  }

  async function requestInstall(){
    if(isStandalone())return;
    if(installPrompt){
      installPrompt.prompt();
      try{await installPrompt.userChoice}catch{}
      installPrompt=null;
      return;
    }
    sheet();
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
  });

  window.addEventListener('appinstalled',()=>{
    installPrompt=null;
    document.documentElement.classList.add('fmb-pwa-installed');
  });

  document.addEventListener('fmb:install-request',requestInstall);
  window.FMB_PWA_INSTALL=requestInstall;

  addStyles();
  registerServiceWorker();
  if(isStandalone())document.documentElement.classList.add('fmb-pwa-installed');
})();
