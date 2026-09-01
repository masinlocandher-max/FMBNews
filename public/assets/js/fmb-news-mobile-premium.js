(()=>{
  if(!window.matchMedia('(max-width:699px)').matches)return;
  document.documentElement.setAttribute('data-fmb-mobile-app','true');
  // Mobile /news/ is now a real app home on the same URL. Do not redirect it
  // to Archive. Desktop and mobile intentionally render different home
  // experiences from the same production page.
})();
