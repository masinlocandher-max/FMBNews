(()=>{
  if(!window.matchMedia('(max-width:699px)').matches)return;
  document.documentElement.setAttribute('data-fmb-mobile-app','true');
  const path=location.pathname.replace(/\/+$/,'')||'/';
  if(path==='/news'&&!new URLSearchParams(location.search).has('publication')){
    const target=new URL('/news/archive/',location.origin);
    const params=new URLSearchParams(location.search);
    params.delete('publication');
    for(const [k,v] of params)target.searchParams.append(k,v);
    location.replace(target.pathname+target.search+location.hash);
  }
})();
