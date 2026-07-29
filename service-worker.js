const CACHE='roy-enterprise-v5-0-lts';
const CORE=[
  './','./index.html','./admin.html','./offline.html','./manifest.webmanifest',
  './css/app.css','./css/payment-admin-v3.1.css','./css/payment-checkout-v3.2.css',
  './css/form-controls-v3.3.css','./css/navigation-builder-v4.0.css','./css/user-security-v4.1.css','./css/account-security-v5.0.css',
  './js/01-firebase.js','./js/02-app-02.js','./js/14-payments-qr-v3.1.js',
  './js/15-payments-checkout-v3.2.js','./js/16-navigation-builder-v4.0.js',
  './js/17-user-security-audit-v4.1.js','./js/18-realtime-catalog-v4.3.js','./js/20-account-security-v5.0.js',
  './js/21-lts-integrity-v5.0.js',
  './assets/logo-roy-verde-blanco.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  const sameOrigin=url.origin===self.location.origin;
  const freshAsset=sameOrigin&&(/\.(?:js|css)$/i.test(url.pathname));
  if(event.request.mode==='navigate'||freshAsset){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
      return response;
    }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html').then(home=>home||caches.match('./offline.html')))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response.ok&&sameOrigin){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  })));
});
