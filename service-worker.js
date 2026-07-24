const CACHE='roy-enterprise-3-3-final';
const CORE=[
  './',
  './index.html',
  './admin.html',
  './css/app.css',
  './css/payment-admin-v3.1.css',
  './css/payment-checkout-v3.2.css',
  './css/form-controls-v3.3.css',
  './js/01-firebase.js',
  './js/02-app-02.js',
  './js/14-payments-qr-v3.1.js',
  './js/15-payments-checkout-v3.2.js',
  './offline.html',
  './manifest.webmanifest',
  './assets/logo-roy-verde-blanco.png',
  './assets/logo/roy-logo.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});
self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request)
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
          return response;
        })
        .catch(()=>caches.match(event.request)
          .then(cached=>cached||caches.match('./index.html')
            .then(home=>home||caches.match('./offline.html'))))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      if(response.ok&&new URL(event.request.url).origin===location.origin){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      }
      return response;
    }))
  );
});
