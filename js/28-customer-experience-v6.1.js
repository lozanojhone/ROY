/* ROY Enterprise PRO 6.1 - experiencia de compra, validacion y analitica anonima */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const uid=()=> 'evt-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
const sessionKey='roy_analytics_session';
let sessionId=sessionStorage.getItem(sessionKey);
if(!sessionId){sessionId='ses-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);sessionStorage.setItem(sessionKey,sessionId);}

function addCheckoutFields(){
 const phone=$('#checkoutPhone');
 if(!phone||$('#checkoutDni'))return;
 phone.setAttribute('autocomplete','tel');phone.setAttribute('inputmode','tel');
 $('#checkoutName')?.setAttribute('autocomplete','name');
 const phoneGroup=phone.closest('.form-group');
 const dni=document.createElement('div');dni.className='form-group';
 dni.innerHTML='<label>DNI</label><input class="field" id="checkoutDni" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="8 digitos"><div class="roy-field-error" data-error-for="checkoutDni"></div>';
 phoneGroup?.after(dni);
 const address=$('#checkoutAddress');
 if(address&&!$('#checkoutReference')){
   const group=document.createElement('div');group.className='form-group full';
   group.innerHTML='<label>Referencia (opcional)</label><input class="field" id="checkoutReference" autocomplete="street-address" placeholder="Ej.: frente al parque, puerta negra"><div class="roy-field-error" data-error-for="checkoutReference"></div>';
   address.closest('.form-group')?.after(group);
 }
 const grid=$('#checkoutName')?.closest('.form-grid');
 if(grid&&!$('#royCheckoutAlert')){const a=document.createElement('div');a.id='royCheckoutAlert';a.className='roy-checkout-alert';a.textContent='Revisa los campos marcados antes de continuar.';grid.prepend(a);}
 ['checkoutName','checkoutPhone','checkoutCity','checkoutAddress'].forEach(id=>{const el=$('#'+id);if(el&&!document.querySelector(`[data-error-for="${id}"]`)){const e=document.createElement('div');e.className='roy-field-error';e.dataset.errorFor=id;el.after(e);}});
 const p=JSON.parse(localStorage.getItem('roy_profile')||'{}');
 if($('#checkoutDni'))$('#checkoutDni').value=p.dni||'';
 if($('#checkoutReference'))$('#checkoutReference').value=p.reference||'';
}
function clearError(id){const el=$('#'+id),msg=document.querySelector(`[data-error-for="${id}"]`);el?.classList.remove('roy-invalid');msg?.classList.remove('show');if(msg)msg.textContent='';}
function setError(id,text){const el=$('#'+id),msg=document.querySelector(`[data-error-for="${id}"]`);el?.classList.add('roy-invalid');if(msg){msg.textContent=text;msg.classList.add('show');}}
function validateCheckout(){
 addCheckoutFields();
 ['checkoutName','checkoutDni','checkoutPhone','checkoutCity','checkoutAddress'].forEach(clearError);
 $('#royCheckoutAlert')?.classList.remove('show');
 const delivery=$('#checkoutDelivery')?.value||'pickup';
 const name=$('#checkoutName')?.value.trim()||'',dni=($('#checkoutDni')?.value||'').replace(/\D/g,''),phone=($('#checkoutPhone')?.value||'').replace(/\D/g,''),city=$('#checkoutCity')?.value.trim()||'',address=$('#checkoutAddress')?.value.trim()||'';
 let first='';
 if(name.length<3){setError('checkoutName','Escribe el nombre completo.');first||='checkoutName';}
 if(dni.length!==8){setError('checkoutDni','El DNI debe tener exactamente 8 digitos.');first||='checkoutDni';}
 if(phone.length<9){setError('checkoutPhone','Escribe un celular valido de al menos 9 digitos.');first||='checkoutPhone';}
 if(delivery==='delivery'&&city.length<2){setError('checkoutCity','Indica la ciudad o distrito de entrega.');first||='checkoutCity';}
 if(delivery==='delivery'&&address.length<5){setError('checkoutAddress','Escribe la direccion exacta para el envio.');first||='checkoutAddress';}
 if(first){$('#royCheckoutAlert')?.classList.add('show');const el=$('#'+first);el?.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>el?.focus(),250);return false;}
 const profile={...(JSON.parse(localStorage.getItem('roy_profile')||'{}')),name,phone:$('#checkoutPhone').value.trim(),dni,reference:$('#checkoutReference')?.value.trim()||'',city,address};
 localStorage.setItem('roy_profile',JSON.stringify(profile));
 if(typeof state!=='undefined')state.profile={...(state.profile||{}),...profile};
 return true;
}


const previousPutRecord=window.putRecord;
window.putRecord=async function(name,record){
 if(name==='orders'&&record&&typeof record==='object'){
   const p=JSON.parse(localStorage.getItem('roy_profile')||'{}');
   record.client={...(record.client||{}),dni:p.dni||'',reference:p.reference||''};
 }
 return previousPutRecord.apply(this,arguments);
};
const previousBuildMessage=window.buildWhatsAppOrder;
window.buildWhatsAppOrder=function(order){
 const base=previousBuildMessage.apply(this,arguments),p=JSON.parse(localStorage.getItem('roy_profile')||'{}');
 const extra=`\nDNI: ${p.dni||'No indicado'}${p.reference?`\nReferencia: ${p.reference}`:''}`;
 return base.replace(/(WhatsApp:[^\n]*)/,`$1${extra}`);
};
const previousFinish=window.finishOrder;
window.finishOrder=async function(){if(!validateCheckout())return;track('checkout_submit');return previousFinish.apply(this,arguments);};
const previousOpen=window.openCheckout;
window.openCheckout=function(){const r=previousOpen.apply(this,arguments);setTimeout(()=>{addCheckoutFields();track('checkout_open');},30);return r;};
const previousQuick=window.openQuick;
window.openQuick=function(id){track('product_view',{productId:String(id||'')});return previousQuick.apply(this,arguments);};
const previousAdd=window.addToCart;
window.addToCart=function(productId,color,size,qty){const r=previousAdd.apply(this,arguments);track('add_to_cart',{productId:String(productId||''),qty:Number(qty||1)});return r;};

function track(type,extra={}){
 const allowed=['session_start','product_view','add_to_cart','checkout_open','checkout_submit'];if(!allowed.includes(type))return;
 const payload={id:uid(),type,sessionId,createdAt:new Date().toISOString(),page:location.hash||'#inicio',...extra};
 try{const local=JSON.parse(localStorage.getItem('roy_store_events_pending')||'[]');local.push(payload);localStorage.setItem('roy_store_events_pending',JSON.stringify(local.slice(-100)));}catch(_){ }
 flushEvents();
}
async function flushEvents(){
 if(!window._firebaseReady||!window._db||!window._fb?.setDoc)return;
 let pending=[];try{pending=JSON.parse(localStorage.getItem('roy_store_events_pending')||'[]');}catch(_){return;}
 if(!pending.length)return;
 const keep=[];
 for(const event of pending.slice(0,15)){
  try{await window._fb.setDoc(window._fb.doc(window._db,'roy_store_events',event.id),event);}catch(_){keep.push(event);}
 }
 const rest=pending.slice(15);localStorage.setItem('roy_store_events_pending',JSON.stringify([...keep,...rest].slice(-100)));
}

function shortenReminder(){
 const reminder=$('#royCartReminder');if(!reminder||reminder.dataset.pro61)return;reminder.dataset.pro61='1';
 const observer=new MutationObserver(()=>{if(reminder.classList.contains('show')){clearTimeout(reminder._proTimer);reminder._proTimer=setTimeout(()=>reminder.classList.remove('show'),1400);}});observer.observe(reminder,{attributes:true,attributeFilter:['class']});
}

document.addEventListener('input',e=>{if(e.target?.id?.startsWith('checkout'))clearError(e.target.id);});
document.addEventListener('DOMContentLoaded',()=>{setTimeout(shortenReminder,800);track('session_start');setInterval(flushEvents,20000);});
window.addEventListener('firebase-ready',flushEvents);
})();
