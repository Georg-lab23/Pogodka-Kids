const CACHE_NAME='pogodka-kids-v1-10-1-visual-consistency';
const CORE=['./','./index.html','./app.css','./app.js','./manifest.webmanifest','./v1.9.js','./v1.10.js','./v1.10.1.js','./assets/avatar_boy_school.png','./assets/avatar_boy_toddler.png','./assets/avatar_girl_school.png','./assets/avatar_girl_toddler.png','./assets/layer_boots.png','./assets/layer_cap.png','./assets/layer_demi_jacket.png','./assets/layer_fleece.png','./assets/layer_gloves.png','./assets/layer_hat.png','./assets/layer_longshirt.png','./assets/layer_pants.png','./assets/layer_shorts.png','./assets/layer_sneakers.png','./assets/layer_tshirt.png','./assets/layer_windbreaker.png','./assets/layer_winter_jacket.png'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return; // weather API stays online
  event.respondWith(
    fetch(event.request).then(resp=>{
      const copy=resp.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
      return resp;
    }).catch(()=>caches.match(event.request))
  );
});
