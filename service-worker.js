const CACHE='roy-enterprise-4-4-pwa-install';
const CORE=[
  './','./index.html','./admin.html','./offline.html','./manifest.webmanifest',
  './css/app.css','./css/payment-admin-v3.1.css','./css/payment-checkout-v3.2.css',
  './css/form-controls-v3.3.css','./css/navigation-builder-v4.0.css','./css/product-gallery-v4.1.css',
  './css/user-security-v4.1.css','./css/account-security-v4.9.css','./css/roy-refinements-v4.2.css','./css/pwa-install-v4.4.css',
  './js/01-firebase.js','./js/02-app-02.js','./js/13-users-v3.js','./js/14-payments-qr-v3.1.js',
  './js/15-payments-checkout-v3.2.js','./js/16-navigation-builder-v4.0.js','./js/17-product-gallery-v4.1.js',
  './js/17-user-security-audit-v4.1.js','./js/20-account-security-v4.9.js','./js/21-owner-controls-refinements-v4.2.js','./js/22-critical-fixes-v4.3.js','./js/23-pwa-install-v4.4.js',
  './assets/logo-roy-verde-blanco.png','./assets/icons/roy-app-192.png','./assets/icons/roy-app-512.png'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html').then(home=>home||caches.match('./offline.html')))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok&&new URL(event.request.url).origin===location.origin){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response})));
});
