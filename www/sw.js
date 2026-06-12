const CACHE='feed-est-v4';
const PRECACHE=['./', './sw.js', './apple-touch-icon.png'];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>e.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>clients.claim())
));
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
      caches.open(CACHE).then(c=>c.put(e.request,res.clone()));
      return res;
    }).catch(()=>caches.match('./')))
  );
});
