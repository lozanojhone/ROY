(function(){
 'use strict';
 const Q=s=>document.querySelector(s);
 const OWNER_UID='A39oqjxvtLWOJdya7ldpkLDghtA3';
 const rolePermissions={
  'Administrador':['*'],
  'Ventas':['dashboard','orders','clients','sales','payments','shipping','messages'],
  'Inventario':['dashboard','catalog','inventory','orders'],
  'Contenido':['dashboard','catalog','gallery','promotions','settings'],
  'Atención al cliente':['dashboard','orders','clients','messages','reviews']
 };
 function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
 async function waitFirebaseReady(limit=12000){
  const start=Date.now();
  while(!window._firebaseReady||!window._auth||!window._fb||!window._db){
   if(Date.now()-start>limit)throw new Error('No se pudo conectar con Firebase. Actualiza la página e inténtalo nuevamente.');
   await sleep(120);
  }
 }
 function authError(e){
  const code=String(e?.code||'');
  const map={
   'auth/email-already-in-use':'Este correo ya tiene una cuenta. Usa otro correo o edita el usuario existente.',
   'auth/invalid-email':'El correo ingresado no es válido.',
   'auth/weak-password':'La contraseña debe tener al menos 6 caracteres.',
   'auth/operation-not-allowed':'Activa Email/Contraseña en Firebase → Autenticación → Método de acceso.',
   'auth/network-request-failed':'No se pudo conectar. Revisa tu internet.',
   'auth/unauthorized-domain':'Autoriza este dominio en Firebase → Autenticación → Configuración → Dominios autorizados.',
   'permission-denied':'Tu cuenta principal no tiene permiso para registrar usuarios. Publica las reglas incluidas en esta versión.'
  };
  return map[code]||map[e?.message]||e?.message||'No se pudo completar la operación.';
 }

 // ENVÍO GRATIS PARA TODAS LAS COMPRAS.
 window.calcCheckout=function(){
  const subtotal=cartSubtotal();
  const discount=state.coupon?subtotal*(Number(state.coupon.discount)/100):0;
  return {subtotal,shipping:0,discount,total:Math.max(0,subtotal-discount)};
 };
 const oldRenderShipping=window.renderShipping;
 window.renderShipping=function(){
  if(typeof oldRenderShipping==='function')oldRenderShipping();
  const local=Q('#shipLocal'),national=Q('#shipNational');
  if(local){local.value='0';local.disabled=true;local.title='El envío está configurado como gratis';}
  if(national){national.value='0';national.disabled=true;national.title='El envío está configurado como gratis';}
  const panel=Q('#shippingSettings');
  if(panel&&!panel.querySelector('.roy-free-shipping-note')){
   const note=document.createElement('div');note.className='admin-alert roy-free-shipping-note';note.innerHTML='<b>Envío gratis activado:</b> todos los pedidos tendrán costo de envío S/ 0.00, tanto para recojo como para envío a domicilio.';panel.prepend(note);
  }
 };
 const oldSaveShipping=window.saveShippingSettings;
 window.saveShippingSettings=async function(){
  if(Q('#shipLocal'))Q('#shipLocal').value='0';
  if(Q('#shipNational'))Q('#shipNational').value='0';
  const result=await oldSaveShipping.apply(this,arguments);
  const cfg=getShippingConfig();cfg.local=0;cfg.national=0;cfg.freeShipping=true;
  localStorage.setItem('roy_shipping_config',JSON.stringify(cfg));
  state.settings.freeShipping=0;
  return result;
 };

 // USUARIOS: creación real en Authentication + registro verificado en Firestore.
 window.saveSystemUser=async function(){
  const id=Q('#userId')?.value.trim()||'';
  const name=Q('#userName')?.value.trim()||'';
  const email=Q('#userEmail')?.value.trim().toLowerCase()||'';
  const pass=Q('#userPassword')?.value||'';
  const role=Q('#userRole')?.value||'Ventas';
  const active=Q('#userActive')?.value==='true';
  const btn=Q('#saveUserBtn'),status=Q('#userSaveStatus');
  const setStatus=(text,ok=false)=>{if(status){status.textContent=text;status.style.color=ok?'#8dff00':'#ffd35a';}};
  if(!name||!email)return setStatus('Completa el nombre y el correo.');
  if(!/^\S+@\S+\.\S+$/.test(email))return setStatus('Ingresa un correo válido.');
  if(!id&&pass.length<6)return setStatus('La contraseña temporal debe tener al menos 6 caracteres.');
  if(btn?.disabled)return;
  btn.disabled=true;setStatus(id?'Actualizando usuario...':'Creando cuenta de inicio de sesión...');
  let secondaryApp=null;
  try{
   await waitFirebaseReady();
   const currentUid=window._auth.currentUser?.uid;
   if(!currentUid)throw new Error('Tu sesión expiró. Cierra e inicia sesión nuevamente.');
   if(currentUid!==OWNER_UID&&!((window._firebasePermissions||[]).includes('*')))throw new Error('Solo el propietario puede registrar usuarios.');
   let uidValue=id;
   if(!id){
    const appName='roy-staff-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    secondaryApp=window._firebaseInitializeApp(window._firebaseConfig,appName);
    const secondaryAuth=window._firebaseGetAuth(secondaryApp);
    const credential=await window._fb.createUserWithEmailAndPassword(secondaryAuth,email,pass);
    uidValue=credential.user.uid;
    await window._fb.signOut(secondaryAuth);
   }
   const previous=(state.users||[]).find(x=>x.id===uidValue)||{};
   const record={...previous,id:uidValue,uid:uidValue,name,email,role,active,permissions:rolePermissions[role]||[],createdAt:previous.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
   await window._fb.setDoc(window._fb.doc(window._db,'roy_users',uidValue),record,{merge:true});
   const verify=await window._fb.getDoc(window._fb.doc(window._db,'roy_users',uidValue));
   if(!verify.exists())throw new Error('Firebase no confirmó el registro del usuario.');
   state.users=Array.isArray(state.users)?state.users:[];
   const index=state.users.findIndex(x=>x.id===uidValue);
   if(index>=0)state.users[index]=record;else state.users.unshift(record);
   saveLocal('users',state.users);renderUsers();
   setStatus(id?'Usuario actualizado correctamente.':'Usuario creado correctamente y listo para iniciar sesión.',true);
   showToast(id?'Usuario actualizado correctamente.':'Usuario registrado correctamente.');
   setTimeout(()=>closeModal('userModal'),650);
  }catch(e){console.error('Registro de usuario:',e);setStatus('NO SE GUARDÓ: '+authError(e));}
  finally{
   if(secondaryApp){try{await window._firebaseDeleteApp(secondaryApp)}catch{}}
   if(btn)btn.disabled=false;
  }
 };

 // VIDEOS: normaliza enlaces y genera reproductores internos.
 window.mediaEmbed=function(value){
  let raw=String(value||'').trim();
  if(!raw)return{type:'invalid',src:'',platform:''};
  if(!/^https?:\/\//i.test(raw))raw='https://'+raw;
  try{
   const u=new URL(raw),host=u.hostname.replace(/^www\./,'').toLowerCase();
   if(host==='youtu.be'){
    const id=u.pathname.split('/').filter(Boolean)[0];
    return id?{type:'iframe',src:`https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`,platform:'youtube'}:{type:'invalid',src:'',platform:'youtube'};
   }
   if(host.includes('youtube.com')){
    const parts=u.pathname.split('/').filter(Boolean);
    let id=u.searchParams.get('v');
    if(!id&&['shorts','embed','live'].includes(parts[0]))id=parts[1];
    return id?{type:'iframe',src:`https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`,platform:'youtube'}:{type:'invalid',src:'',platform:'youtube'};
   }
   if(host.includes('vimeo.com')){
    const id=u.pathname.split('/').find(x=>/^\d+$/.test(x));
    return id?{type:'iframe',src:`https://player.vimeo.com/video/${id}?dnt=1`,platform:'vimeo'}:{type:'invalid',src:'',platform:'vimeo'};
   }
   if(host.includes('tiktok.com')){
    const id=u.pathname.match(/\/video\/(\d+)/)?.[1];
    return id?{type:'iframe',src:`https://www.tiktok.com/player/v1/${id}?autoplay=0&loop=0&controls=1`,platform:'tiktok'}:{type:'invalid',src:'',platform:'tiktok',message:'Usa el enlace completo que contiene /video/ y el número del video.'};
   }
   if(host.includes('instagram.com')){
    const m=u.pathname.match(/\/(reel|reels|p|tv)\/([^/?#]+)/i);
    if(m){const kind=m[1].toLowerCase()==='reels'?'reel':m[1].toLowerCase();return{type:'iframe',src:`https://www.instagram.com/${kind}/${m[2]}/embed/`,platform:'instagram'};}
    return{type:'invalid',src:'',platform:'instagram'};
   }
   if(host==='fb.watch'||host.includes('facebook.com'))return{type:'iframe',src:'https://www.facebook.com/plugins/video.php?href='+encodeURIComponent(raw)+'&show_text=false&width=720',platform:'facebook'};
   if(/\.(mp4|webm|ogg)(\?.*)?$/i.test(raw))return{type:'video',src:raw,platform:'directo'};
  }catch{}
  return{type:'invalid',src:'',platform:''};
 };
 window.videoMarkup=function(url,title='Video'){
  const m=window.mediaEmbed(url);
  if(m.type==='iframe')return `<div class="roy-video-frame"><iframe class="social-embed" src="${esc(m.src)}" title="${esc(title)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
  if(m.type==='video')return `<div class="roy-video-frame"><video controls playsinline preload="metadata" src="${esc(m.src)}"></video></div>`;
  return `<div class="media-error">No se pudo generar el reproductor. Usa el enlace público completo del video.</div>`;
 };
 const originalSaveMedia=window.saveMedia;
 window.saveMedia=async function(){
  const type=Q('#mediaType')?.value;
  const url=Q('#mediaUrl')?.value.trim();
  if(type==='video'){
   const parsed=window.mediaEmbed(url);
   if(parsed.type==='invalid')return showToast(parsed.message||'Enlace no compatible. Usa el enlace público completo de YouTube, Vimeo, TikTok, Instagram o Facebook.');
  }
  return originalSaveMedia.apply(this,arguments);
 };

 // Refresco visual inmediato.
 document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{renderShipping();renderGallery();renderAdminMedia();},500)});
})();
