/* ROY Enterprise PRO 6.1 - alertas, metricas, inventario inteligente y respaldo local */
(function(){
'use strict';
const $=s=>document.querySelector(s);
let orderUnsub=null,eventUnsub=null,knownOrders=new Set(),events=[];
function money(n){return 'S/ '+Number(n||0).toFixed(2)}
function injectDashboard(){
 const dashboard=$('#admin-dashboard');if(!dashboard||$('#royProIntelligence'))return;
 const box=document.createElement('div');box.id='royProIntelligence';box.className='panel';box.style.marginTop='16px';
 box.innerHTML='<div class="panel-head"><div><h3>Inteligencia comercial</h3><p class="admin-sub">Visitas, conversion, alertas de inventario y respaldo.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-secondary btn-sm" id="royEnableNotifications">Activar alertas</button><button class="btn btn-secondary btn-sm" id="royExportBackup">Descargar respaldo</button></div></div><div class="kpis" id="royProKpis"></div><div id="roySmartInventory"></div>';
 dashboard.appendChild(box);
 $('#royEnableNotifications').onclick=requestNotifications;$('#royExportBackup').onclick=exportBackup;renderPro();
}
function renderPro(){
 const box=$('#royProKpis');if(!box)return;
 const count=t=>events.filter(e=>e.type===t).length,sessions=new Set(events.map(e=>e.sessionId).filter(Boolean)).size,views=count('product_view'),adds=count('add_to_cart'),checkouts=count('checkout_open');
 const conversion=sessions?((checkouts/sessions)*100).toFixed(1):'0.0';
 box.innerHTML=[['Sesiones',sessions,'Visitas registradas'],['Vistas de producto',views,'Interes'],['Agregados al carrito',adds,'Intencion'],['Checkout',checkouts,conversion+'% conversion']].map(x=>`<div class="kpi"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join('');
 const low=((typeof state!=='undefined'&&state.products)||[]).filter(p=>Number(p.stock||0)<=5).sort((a,b)=>Number(a.stock||0)-Number(b.stock||0)).slice(0,8);
 const target=$('#roySmartInventory');if(target)target.innerHTML='<div class="panel-head" style="margin-top:14px"><h3>Inventario inteligente</h3></div>'+(low.length?low.map(p=>`<div class="order-card"><div class="order-top"><b>${String(p.name||'Producto')}</b><span class="status ${Number(p.stock||0)<=0?'cancelado':'pendiente'}">${Number(p.stock||0)<=0?'Agotado':'Stock '+p.stock}</span></div><small class="muted">SKU ${String(p.sku||'—')} · Reponer pronto</small></div>`).join(''):'<div class="empty">No hay productos con stock critico.</div>');
}
async function requestNotifications(){if(!('Notification'in window))return window.showToast?.('Este navegador no admite notificaciones.');const r=await Notification.requestPermission();window.showToast?.(r==='granted'?'Alertas activadas.':'No se concedio permiso.');}
function notifyOrder(order){const label=order?.id||'Nuevo pedido';window.showToast?.('Nuevo pedido recibido: '+label);if(Notification.permission==='granted'){try{new Notification('Nuevo pedido ROY',{body:`${order?.client?.name||'Cliente'} · ${money(order?.total)}`,icon:'assets/icons/roy-app-192.png'});}catch(_){}}
}
function startListeners(){
 if(!window._firebaseReady||!window._db||!window._fb?.onSnapshot||!window._firebaseAdmin)return;
 if(!orderUnsub){orderUnsub=window._fb.onSnapshot(window._fb.collection(window._db,'roy_orders'),snap=>{const current=new Set();snap.forEach(d=>{current.add(d.id);if(knownOrders.size&&!knownOrders.has(d.id))notifyOrder({id:d.id,...d.data()});});knownOrders=current;});}
 if(!eventUnsub){eventUnsub=window._fb.onSnapshot(window._fb.collection(window._db,'roy_store_events'),snap=>{events=[];snap.forEach(d=>events.push(d.data()));events=events.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,1000);renderPro();});}
}
function makeSnapshot(){return {version:'ROY-PRO-6.1',createdAt:new Date().toISOString(),products:(typeof state!=='undefined'?state.products:[])||[],orders:(typeof state!=='undefined'?state.orders:[])||[],categories:(typeof state!=='undefined'?state.categories:[])||[],promotions:(typeof state!=='undefined'?state.promotions:[])||[],inventory:(typeof state!=='undefined'?state.inventory:[])||[],media:(typeof state!=='undefined'?state.media:[])||[],settings:(typeof state!=='undefined'?state.settings:{})||{},users:(typeof state!=='undefined'?state.users:[])||[]};}
function localAutoBackup(){try{const last=Number(localStorage.getItem('roy_last_auto_backup')||0);if(Date.now()-last<86400000)return;localStorage.setItem('roy_auto_backup_latest',JSON.stringify(makeSnapshot()));localStorage.setItem('roy_last_auto_backup',String(Date.now()));}catch(_){}}
function exportBackup(){const blob=new Blob([JSON.stringify(makeSnapshot(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ROY_BACKUP_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
window.royExportBackup=exportBackup;
window.addEventListener('firebase-auth-changed',()=>setTimeout(startListeners,300));
document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{injectDashboard();localAutoBackup();startListeners();},1200);setInterval(localAutoBackup,3600000);});
})();
