self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?.json()||{}}catch{data={body:event.data?.text()||'A new FMB News update is available.'}}
  const title=data.title||'FMB News';
  const options={
    body:data.body||'A new FMB News update is available.',
    icon:data.icon||'/news/assets/images/brand/fmb-bulletin-emblem.svg',
    badge:data.badge||'/news/assets/images/brand/fmb-bulletin-emblem.svg',
    tag:data.tag||'fmb-news',
    renotify:Boolean(data.renotify),
    data:{url:data.url||'/news/archive/',audience:data.audience||'breaking'},
    timestamp:Date.now(),
    vibrate:[120,60,120]
  };
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||'/news/archive/',self.location.origin).href;
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