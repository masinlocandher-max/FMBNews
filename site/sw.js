const VERSION='fmb-news-pwa-v2';
const SHELL_CACHE=`${VERSION}-shell`;
const RUNTIME_CACHE=`${VERSION}-runtime`;
const IMAGE_CACHE=`${VERSION}-images`;
const APP_SHELL=[
  '/news/',
  '/news/offline/',
  '/news/manifest.webmanifest',
  '/news/assets/images/icon-transparent.png',
  '/news/assets/images/brand/fmb-bulletin-emblem.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(SHELL_CACHE);
    await Promise.all(APP_SHELL.map(async url=>{
      try{await cache.add(new Request(url,{cache:'reload'}))}catch(error){console.warn('FMB News shell item not cached',url,error)}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keep=new Set([SHELL_CACHE,RUNTIME_CACHE,IMAGE_CACHE]);
    for(const key of await caches.keys())if(key.startsWith('fmb-news-pwa-')&&!keep.has(key))await caches.delete(key);
    await self.clients.claim();
  })());
});

async function navigationResponse(request){
  try{
    const response=await fetch(request);
    if(response&&response.ok){
      const cache=await caches.open(RUNTIME_CACHE);
      cache.put(request,response.clone()).catch(()=>{});
    }
    return response;
  }catch(error){
    const cached=await caches.match(request,{ignoreSearch:true});
    if(cached)return cached;
    const home=await caches.match('/news/');
    if(home&&new URL(request.url).pathname==='/news/')return home;
    return (await caches.match('/news/offline/'))||new Response('FMB News is temporarily offline.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }
}

async function staleWhileRevalidate(request,cacheName){
  const cache=await caches.open(cacheName);
  const cached=await cache.match(request);
  const network=fetch(request).then(response=>{
    if(response&&response.ok)cache.put(request,response.clone()).catch(()=>{});
    return response;
  }).catch(()=>null);
  return cached||(await network)||Response.error();
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(!url.pathname.startsWith('/news/'))return;

  if(request.mode==='navigate'){
    event.respondWith(navigationResponse(request));
    return;
  }

  if(url.pathname.startsWith('/news/assets/images/')){
    event.respondWith(staleWhileRevalidate(request,IMAGE_CACHE));
    return;
  }

  if(url.pathname.startsWith('/news/assets/')||url.pathname.endsWith('.webmanifest')){
    event.respondWith(staleWhileRevalidate(request,RUNTIME_CACHE));
  }
});

self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?.json()||{}}catch{data={body:event.data?.text()||'A new FMB News update is available.'}}
  const title=data.title||'FMB News';
  const options={
    body:data.body||'A new FMB News update is available.',
    icon:data.icon||'/news/assets/images/icon-transparent.png',
    badge:data.badge||'/news/assets/images/brand/fmb-bulletin-emblem.svg',
    tag:data.tag||'fmb-news',
    renotify:Boolean(data.renotify),
    data:{url:data.url||'/news/',audience:data.audience||'breaking'},
    timestamp:Date.now(),
    vibrate:[120,60,120]
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||'/news/',self.location.origin).href;
  event.waitUntil((async()=>{
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of clients){
      if(new URL(client.url).origin===self.location.origin){
        await client.navigate(target);
        return client.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
