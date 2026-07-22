(function(){
'use strict';
const Q=s=>document.querySelector(s);
const OWNER_UID='A39oqjxvtLWOJdya7ldpkLDghtA3';
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const keyOf=u=>String(u?.id||u?.uid||u?.email||'').trim();
const emailOf=u=>String(u?.email||u?.username||'').trim().toLowerCase();
const isOwner=u=>keyOf(u)===OWNER_UID||u?.uid===OWNER_UID||String(u?.role||'').toLowerCase()==='propietario';
const wait=(p,ms=15000)=>Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(Object.assign(new Error('La operación tardó demasiado.'),{code:'timeout'})),ms))]);

function normalizeUser(id,data={}){
 const permissions=Array.isArray(data.permissions)?data.permissions:(typeof data.permissions==='string'?data.permissions.split(',').map(x=>x.trim()).filter(Boolean):[]);
 return {
  id,
  uid:String(data.uid||(/^[A-Za-z0-9]{20,}$/.test(id)?id:'')).trim(),
  name:String(data.name||data.displayName||data.nombre||'Usuario').trim(),
  email:String(data.email||data.username||(/@/.test(id)?id:'')).trim().toLowerCase(),
  role:String(data.role||data.rol||'Personalizado').trim(),
  permissions,
  active:data.active!==false,
  createdAt:data.createdAt||'',
  updatedAt:data.updatedAt||''
 };
}

function mergeUsers(rows){
 const byEmail=new Map(),without=[];
 for(const row of rows){
  const email=emailOf(row);
  if(!email){without.push(row);continue}
  const old=byEmail.get(email);
  if(!old){byEmail.set(email,row);continue}
  const oldUid=!!old.uid, newUid=!!row.uid;
  const preferred=newUid&&!oldUid?row:old;
  const other=preferred===row?old:row;
  byEmail.set(email,{
   ...other,...preferred,
   role:preferred.role&&preferred.role!=='Personalizado'?preferred.role:other.role,
   permissions:preferred.permissions?.length?preferred.permissions:other.permissions,
   active:preferred.active!==false&&other.active!==false
  });
 }
 return [...byEmail.values(),...without].filter((u,i,a)=>a.findIndex(x=>keyOf(x)===keyOf(u))===i);
}

function setInline(message,type='info'){
 const el=Q('#userSaveStatus');
 if(el){el.textContent=message;el.style.color=type==='error'?'#ff6b6b':type==='success'?'#9cff00':'#ddd'}
 if(window.showToast)window.showToast(message);
}

async function refreshUsersFromFirestore(showMessage=false){
 if(!window._firebaseReady||!window._db||!window._fb) return window.state?.users||[];
 try{
  if(showMessage)setInline('Actualizando usuarios y roles...');
  const snap=await wait(window._fb.getDocs(window._fb.collection(window._db,'roy_users')),18000);
  const rows=snap.docs.map(d=>normalizeUser(d.id,d.data()));
  const merged=mergeUsers(rows);
  window.state.users=merged;
  if(window.saveLocal)window.saveLocal('users',merged);
  if(window.renderUsers)window.renderUsers();
  if(showMessage)setInline(`${merged.filter(u=>!isOwner(u)).length} usuario(s) sincronizados correctamente.`,'success');
  return merged;
 }catch(error){
  console.error('No se pudieron sincronizar usuarios:',error);
  if(showMessage)setInline('NO SE ACTUALIZÓ: '+(error?.message||'No se pudo consultar Firestore.'),'error');
  return window.state?.users||[];
 }
}
window.refreshUsersFromFirestore=refreshUsersFromFirestore;

const previousRenderAdminView=window.renderAdminView;
if(typeof previousRenderAdminView==='function'){
 window.renderAdminView=function(name){
  const result=previousRenderAdminView.apply(this,arguments);
  if(name==='users')setTimeout(()=>refreshUsersFromFirestore(false),50);
  return result;
 };
}

const previousShowAdminView=window.showAdminView;
if(typeof previousShowAdminView==='function'){
 window.showAdminView=function(name){
  const result=previousShowAdminView.apply(this,arguments);
  if(name==='users')setTimeout(()=>refreshUsersFromFirestore(false),50);
  return result;
 };
}

window.renderUsers=function(){
 const box=Q('#usersList');if(!box)return;
 const list=mergeUsers((window.state?.users||[]).map(u=>normalizeUser(keyOf(u),u))).filter(u=>!isOwner(u));
 box.innerHTML=list.length?list.map(u=>{
  const id=keyOf(u),active=u.active!==false,perms=u.permissions||[];
  return `<div class="order-card user-record-card"><div class="order-top"><div><b>${esc(u.name||'Usuario sin nombre')}</b><div class="muted user-email">${esc(u.email||'Correo no identificado')}</div></div><span class="role-badge">${esc(u.role||'Personalizado')}</span></div><div class="user-role-summary"><b class="${active?'user-state-active':'user-state-inactive'}">${active?'ACTIVO':'DESACTIVADO'}</b><span>${perms.includes('*')?'Control total':esc(perms.join(', ')||'Sin permisos asignados')}</span></div><div class="user-actions"><button class="btn btn-secondary btn-sm" onclick="openUserForm('${esc(id)}')">Editar rol</button><button class="btn btn-warning btn-sm" onclick="toggleSystemUser('${esc(id)}')">${active?'Desactivar':'Activar'}</button><button class="btn btn-secondary btn-sm" onclick="resetSystemUserPassword('${esc(id)}')">Restablecer clave</button><button class="btn btn-danger btn-sm" onclick="deleteSystemUser('${esc(id)}')">Eliminar acceso</button></div></div>`;
 }).join(''):'<div class="empty">No hay usuarios adicionales guardados.</div>';
};

const oldSave=window.saveSystemUser;
window.saveSystemUser=async function(){
 const btn=Q('#saveUserBtn');
 if(btn?.dataset.saving==='1')return;
 if(btn)btn.dataset.saving='1';
 try{
  await oldSave.apply(this,arguments);
  await new Promise(r=>setTimeout(r,250));
  const users=await refreshUsersFromFirestore(false);
  const email=String(Q('#userEmail')?.value||'').trim().toLowerCase();
  const saved=users.find(u=>emailOf(u)===email);
  if(saved){
   const expectedRole=String(Q('#userRole')?.value||'').trim();
   if(expectedRole&&saved.role!==expectedRole){
    throw new Error(`El usuario se creó, pero Firestore devolvió el rol “${saved.role}” en lugar de “${expectedRole}”.`);
   }
   setInline(`Usuario guardado correctamente con rol ${saved.role}.`,'success');
  }
 }catch(error){
  console.error(error);setInline('NO SE GUARDÓ EL ROL: '+(error?.message||'Error desconocido.'),'error');
 }finally{if(btn)delete btn.dataset.saving}
};

function autoplayUrl(url){
 const raw=String(url||'').trim();
 try{
  const u=new URL(raw),host=u.hostname.replace(/^www\./,'');
  if(host.includes('youtube.com')||host==='youtu.be'){
   let id=host==='youtu.be'?u.pathname.split('/').filter(Boolean)[0]:u.searchParams.get('v');
   if(!id){const m=u.pathname.match(/\/(shorts|embed|live)\/([^/?#]+)/);id=m?.[2]}
   return id?`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${id}`:raw;
  }
  if(host.includes('vimeo.com')){const id=u.pathname.split('/').find(x=>/^\d+$/.test(x));return id?`https://player.vimeo.com/video/${id}?autoplay=1&muted=1&playsinline=1&loop=1&background=0`:raw}
  if(host.includes('tiktok.com')){const id=u.pathname.match(/video\/(\d+)/)?.[1];return id?`https://www.tiktok.com/player/v1/${id}?autoplay=1&loop=1&music_info=0&description=0`:raw}
  if(host.includes('facebook.com')||host==='fb.watch')return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(raw)}&show_text=false&autoplay=true&mute=true&width=560`;
  if(host.includes('instagram.com')){const m=u.pathname.match(/\/(reel|reels|p|tv)\/([^/?#]+)/);return m?`https://www.instagram.com/${m[1]}/${m[2]}/embed/`:raw}
 }catch{}
 return raw;
}

window.videoMarkup=function(url,title='Video'){
 const raw=String(url||'').trim();
 if(/\.(mp4|webm|ogg)(\?.*)?$/i.test(raw)||raw.startsWith('data:video/'))return `<video class="roy-autoplay-video" autoplay muted loop playsinline controls preload="auto" src="${esc(raw)}"></video>`;
 const src=autoplayUrl(raw);
 if(src&&src!==raw || /youtube|vimeo|tiktok|facebook|instagram/i.test(raw))return `<iframe class="social-embed roy-mobile-video" loading="eager" src="${esc(src)}" title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
 return '<div class="media-error">Este enlace no permite reproducción integrada.</div>';
};

function addRefreshButton(){
 const list=Q('#usersList');if(!list||Q('#refreshUsersBtn'))return;
 const panel=list.parentElement;const btn=document.createElement('button');btn.id='refreshUsersBtn';btn.className='btn btn-secondary btn-sm';btn.textContent='Actualizar usuarios y roles';btn.onclick=()=>refreshUsersFromFirestore(true);
 const actions=Q('#userMasterActions');if(actions)actions.prepend(btn);else panel.insertBefore(btn,list);
}

function boot(){setTimeout(()=>{addRefreshButton();refreshUsersFromFirestore(false)},900)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
