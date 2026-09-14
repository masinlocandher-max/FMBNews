(()=>{
  const STORAGE_KEY='fmbThemeModeV1';
  const MODES=['system','light','dark'];
  const media=window.matchMedia('(prefers-color-scheme: dark)');
  const root=document.documentElement;

  const icon=(mode)=>{
    if(mode==='light')return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>';
    if(mode==='dark')return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.6A8 8 0 0 1 8.4 4a8.2 8.2 0 1 0 11.6 11.6Z"></path></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="12" rx="2"></rect><path d="M9 21h6M12 17v4"></path></svg>';
  };

  const label=(mode)=>mode[0].toUpperCase()+mode.slice(1);
  const stored=()=>{
    try{
      const value=localStorage.getItem(STORAGE_KEY)||'system';
      return MODES.includes(value)?value:'system';
    }catch{return 'system'}
  };
  const resolved=(mode)=>mode==='system'?(media.matches?'dark':'light'):mode;

  function syncControls(mode){
    document.querySelectorAll('[data-fmb-theme-control]').forEach((button)=>{
      button.setAttribute('data-mode',mode);
      button.setAttribute('aria-label',`Appearance: ${label(mode)}. Activate to change.`);
      const iconTarget=button.querySelector('[data-fmb-theme-icon]');
      if(iconTarget)iconTarget.innerHTML=icon(mode);
      const text=button.querySelector('[data-fmb-theme-label]');
      if(text)text.textContent=label(mode);
    });
    // The mobile Menu control is a binary switch, not the three-way cycle. It
    // reports the theme actually in force, so in System mode it reads whatever
    // the device resolved to -- a switch that showed "System" while the screen
    // was plainly dark would be lying about its own state.
    const active=resolved(mode);
    document.querySelectorAll('[data-fmb-theme-menu]').forEach((button)=>{
      button.setAttribute('data-mode',mode);
      button.setAttribute('role','switch');
      button.setAttribute('aria-checked',active==='dark'?'true':'false');
      button.setAttribute('aria-label','Dark appearance');
      const iconTarget=button.querySelector('[data-fmb-theme-icon]');
      if(iconTarget)iconTarget.innerHTML=icon(active);
      const text=button.querySelector('[data-fmb-theme-label]');
      if(text)text.textContent=active==='dark'?'Dark':'Light';
    });
  }

  function apply(mode,{persist=true}={}){
    if(!MODES.includes(mode))mode='system';
    if(persist){try{localStorage.setItem(STORAGE_KEY,mode)}catch{}}
    root.setAttribute('data-fmb-theme-mode',mode);
    root.setAttribute('data-fmb-theme',resolved(mode));
    const themeColor=document.querySelector('meta[name="theme-color"]');
    // Brand values. This line previously wrote the retired plum pair at runtime,
    // overwriting the newsroom-black the build stamps into the document -- so the
    // approved theme-color survived exactly until the first theme apply. Not a
    // palette change: a palette regression, restored to what the build declares.
    if(themeColor)themeColor.setAttribute('content',resolved(mode)==='dark'?'#0A0A0A':'#F5F3EF');
    syncControls(mode);
    document.dispatchEvent(new CustomEvent('fmb:theme-change',{detail:{mode,resolved:resolved(mode)}}));
  }

  function cycle(){
    const current=root.getAttribute('data-fmb-theme-mode')||stored();
    const next=MODES[(MODES.indexOf(current)+1)%MODES.length];
    apply(next);
  }

  // Binary Light/Dark for the mobile Menu switch. System is preserved as a
  // supported internal mode -- it stays the default, it still follows the
  // device, and the desktop control still cycles to it -- but the first manual
  // flip of this switch resolves System into the explicit choice the reader
  // just made, rather than presenting a confusing third state on a two-state
  // control. From there the explicit choice persists.
  function toggleBinary(){
    const current=root.getAttribute('data-fmb-theme-mode')||stored();
    apply(resolved(current)==='dark'?'light':'dark');
  }

  function desktopControl(){
    if(document.querySelector('[data-fmb-theme-control]'))return;
    const host=document.querySelector('.publication-header-inner,.mast>.shell,.mast-row,.fnc-header-row,.nc-nav-shell,.brief-network-row');
    if(!host)return;
    const button=document.createElement('button');
    button.type='button';
    button.className='fmb-theme-toggle';
    button.setAttribute('data-fmb-theme-control','');
    button.innerHTML='<span data-fmb-theme-icon aria-hidden="true"></span><span data-fmb-theme-label>System</span>';
    button.addEventListener('click',cycle);
    host.append(button);
  }

  function enhanceMobileSheet(sheet){
    if(!(sheet instanceof HTMLElement)||sheet.querySelector('[data-fmb-theme-menu]'))return;
    const list=sheet.querySelector('.fmb-app-action-list');
    if(!list)return;
    const button=document.createElement('button');
    button.type='button';
    button.setAttribute('data-fmb-theme-menu','');
    button.setAttribute('role','switch');
    button.setAttribute('aria-checked','false');
    button.innerHTML='<span class="fmb-theme-menu-main"><span data-fmb-theme-icon aria-hidden="true"></span><span>Appearance</span></span><span class="fmb-theme-switch-group"><span data-fmb-theme-label>Light</span><span class="fmb-theme-switch" aria-hidden="true"><i></i></span></span>';
    button.addEventListener('click',toggleBinary);
    list.prepend(button);
    syncControls(root.getAttribute('data-fmb-theme-mode')||stored());
  }

  const observer=new MutationObserver((records)=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(!(node instanceof HTMLElement))continue;
        if(node.matches('.fmb-app-action-sheet'))enhanceMobileSheet(node);
        node.querySelectorAll?.('.fmb-app-action-sheet').forEach(enhanceMobileSheet);
      }
    }
  });

  media.addEventListener?.('change',()=>{
    if((root.getAttribute('data-fmb-theme-mode')||stored())==='system')apply('system',{persist:false});
  });

  document.addEventListener('fmb:theme-cycle',cycle);
  apply(root.getAttribute('data-fmb-theme-mode')||stored(),{persist:false});

  const init=()=>{
    desktopControl();
    document.querySelectorAll('.fmb-app-action-sheet').forEach(enhanceMobileSheet);
    observer.observe(document.body,{childList:true,subtree:true});
    syncControls(root.getAttribute('data-fmb-theme-mode')||stored());
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
