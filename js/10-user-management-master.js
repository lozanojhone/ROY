(function(){
'use strict';
const OWNER_UID='A39oqjxvtLWOJdya7ldpkLDghtA3';
const Q=s=>document.querySelector(s);
const PERMISSIONS=[
 ['dashboard','Dashboard'],['catalog','Catálogo'],['gallery','Galería'],['inventory','Inventario'],
 ['orders','Pedidos'],['clients','Clientes'],['sales','Ventas'],['promotions','Promociones'],
 ['shipping','Envíos'],['payments','Pagos'],['messages','Mensajes'],['reviews','Opiniones'],
 ['users','Usuarios'],['reports','Reportes'],['settings','Configuración']
];
const ROLE_MAP={
 'Administrador':['*'],
 'Ventas':['dashboard','orders','clients','sales','payments','shipping','messages'],
 'Inventario':['dashboard','catalog','inventory','orders'],
 'Contenido':['dashboard','catalog','gallery','promotions','settings'],
 'Atención al cliente':['dashboard','orders','clients','messages','reviews'],
 'Personalizado':[]
};
const safeId=u=>String(u?.id||u?.uid||u?.email||u?.username||'').trim();
const esc2=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function timeout(p,ms=25000){return Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(Object.assign(new Error('La operación tardó demasiado.'),{code:'timeout'})),ms))])}
function isOwnerRecord(u){return safeId(u)===OWNER_UID||u?.uid===OWNER_UID||String(u?.role||'').toLowerCase()==='propietario'}
function canManageUsers(){
 const currentUid=window._auth?.currentUser?.uid||window._firebaseUser?.uid||'';
 return currentUid===OWNER_UID || (window._firebasePermissions||[]).includes('*') || String(window._firebaseRole||'').toLowerCase()==='admin';
}
function setUserStatus(message,type='info'){
 const el=Q('#userSaveStatus'); if(!el)return;
 el.textContent=message; el.dataset.type=type;
 el.style.color=type==='error'?'#ff6b6b':type==='success'?'#9cff00':'#d7d7d7';
}
function getSelectedPermissions(){
 const values=[...document.querySelectorAll('#userPermissionGrid input:checked')].map(x=>x.value);
 return values.includes('*')?['*']:values;
}
function drawPermissionGrid(selected=[]){
 const box=Q('#userPermissionGrid');if(!box)return;
 const all=selected.includes('*');
 box.innerHTML=PERMISSIONS.map(([id,label])=>`<label class="permission-item"><input type="checkbox" value="${id}" ${all||selected.includes(id)?'checked':''}>${label}</label>`).join('');
 box.querySelectorAll('input').forEach(i=>i.addEventListener('change',()=>{if(Q('#userRole')?.value!=='Personalizado')Q('#userRole').value='Personalizado'}));
}
window.syncRolePermissions=function(){const role=Q('#userRole')?.value||'Ventas';drawPermissionGrid(ROLE_MAP[role]||[])};
window.openUserForm=function(id=''){
 const u=(window.state?.users||[]).find(x=>safeId(x)===String(id))||{};
 if(isOwnerRecord(u)){showToast('La cuenta propietaria está protegida y no puede modificarse aquí.');return}
 Q('#userId').value=safeId(u);Q('#userName').value=u.name||'';Q('#userEmail').value=u.email||'';Q('#userEmail').disabled=!!safeId(u);
 Q('#userPassword').value='';Q('#userPasswordGroup').style.display=safeId(u)?'none':'';
 const role=u.role&&ROLE_MAP[u.role]?u.role:'Personalizado';Q('#userRole').value=role;Q('#userActive').value=String(u.active!==false);
 drawPermissionGrid(Array.isArray(u.permissions)&&u.permissions.length?u.permissions:(ROLE_MAP[role]||[]));
 Q('#userModalTitle').textContent=safeId(u)?'EDITAR USUARIO Y ROL':'AGREGAR USUARIO';Q('#userSaveStatus').textContent='';openModal('userModal');
};
window.saveSystemUser=async function(){
 const status=Q('#userSaveStatus'),btn=Q('#saveUserBtn');
 try{
  if(!canManageUsers())throw Object.assign(new Error('Solo el propietario o un administrador puede gestionar usuarios.'),{code:'not-owner'});
  const originalId=Q('#userId').value.trim(),name=Q('#userName').value.trim(),email=Q('#userEmail').value.trim().toLowerCase(),pass=Q('#userPassword').value,role=Q('#userRole').value,active=Q('#userActive').value==='true';
  const permissions=role==='Administrador'?['*']:getSelectedPermissions();
  if(!name)throw new Error('Completa el nombre del usuario.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Escribe un correo válido.');
  if(!originalId&&pass.length<6)throw new Error('La contraseña temporal debe tener al menos 6 caracteres.');
  if(!permissions.length)throw new Error('Selecciona al menos un permiso.');
  if(!window._firebaseReady||!window._db||!window._auth)throw new Error('No hay conexión con el sistema.');
  btn.disabled=true;setUserStatus(originalId?'Actualizando rol y permisos...':'Creando cuenta y asignando rol...','info');
  let docId=originalId,uid='',secondary=null,createdAuth=false;
  if(!originalId){
   try{
    secondary=window._firebaseInitializeApp(window._firebaseConfig,'roy-staff-'+Date.now());
    const secondaryAuth=window._firebaseGetAuth(secondary);
    const cred=await timeout(window._fb.createUserWithEmailAndPassword(secondaryAuth,email,pass));
    uid=cred.user.uid;docId=uid;createdAuth=true;await window._fb.signOut(secondaryAuth).catch(()=>{});
   }catch(e){
    if(e?.code==='auth/email-already-in-use'){docId=email;setUserStatus('La cuenta ya existe. Asignando rol y permisos...','info')}else throw e;
   }finally{if(secondary)await window._firebaseDeleteApp(secondary).catch(()=>{})}
  }
  const old=(window.state?.users||[]).find(x=>safeId(x)===originalId)||{};
  if(isOwnerRecord(old)||docId===OWNER_UID)throw new Error('La cuenta propietaria no puede modificarse.');
  const record={id:docId,uid:uid||old.uid||'',name,email,role,active,permissions,updatedAt:new Date().toISOString(),createdAt:old.createdAt||new Date().toISOString()};
  await timeout(window._fb.setDoc(window._fb.doc(window._db,'roy_users',docId),record,{merge:true}));
  const verify=await timeout(window._fb.getDoc(window._fb.doc(window._db,'roy_users',docId)),12000);
  if(!verify.exists())throw new Error('El sistema no confirmó el registro.');
  const saved={id:verify.id,...verify.data()};
  const list=window.state.users||[];const idx=list.findIndex(x=>safeId(x)===originalId||safeId(x)===docId||String(x.email||'').toLowerCase()===email);
  if(idx>=0)list[idx]=saved;else list.unshift(saved);saveLocal('users',list);window.renderUsers();
  setUserStatus('Usuario, rol y permisos guardados correctamente.','success');showToast(createdAuth?'Usuario creado correctamente.':'Rol y permisos actualizados correctamente.');setTimeout(()=>closeModal('userModal'),650);
 }catch(e){console.error(e);const map={'auth/operation-not-allowed':'Activa el acceso por correo y contraseña en Firebase Authentication.','auth/weak-password':'La contraseña debe tener al menos 6 caracteres.','auth/invalid-email':'El correo no es válido.','auth/network-request-failed':'No se pudo conectar. Revisa Internet.','permission-denied':'No tienes permiso para administrar usuarios. Publica las reglas incluidas.','firestore/permission-denied':'No tienes permiso para administrar usuarios. Publica las reglas incluidas.','timeout':'La operación tardó demasiado. Inténtalo nuevamente.','not-owner':'Solo la cuenta propietaria puede administrar usuarios.'};setUserStatus('NO SE GUARDÓ: '+(map[e?.code]||e?.message||'Error desconocido.'),'error');
 }finally{btn.disabled=false}
};
window.renderUsers=function(){
 const box=Q('#usersList');if(!box)return;const list=(window.state?.users||[]).filter(u=>!isOwnerRecord(u));
 box.innerHTML=list.length?list.map(u=>{const id=safeId(u),active=u.active!==false,perms=Array.isArray(u.permissions)?u.permissions:[];return `<div class="order-card"><div class="order-top"><div><b>${esc2(u.name||'Usuario sin nombre')}</b><div class="muted" style="font-size:10px;margin-top:4px">${esc2(u.email||u.username||'Correo pendiente de configurar')}</div></div><span class="role-badge">${esc2(u.role||'Personalizado')}</span></div><div class="muted" style="font-size:10px;margin-top:7px"><b class="${active?'user-state-active':'user-state-inactive'}">${active?'ACTIVO':'DESACTIVADO'}</b> · ${perms.includes('*')?'Control total':esc2(perms.join(', ')||'Sin permisos')}</div><div class="user-actions"><button class="btn btn-secondary btn-sm" onclick="openUserForm('${esc2(id)}')">Editar rol</button><button class="btn btn-warning btn-sm" onclick="toggleSystemUser('${esc2(id)}')">${active?'Desactivar':'Activar'}</button><button class="btn btn-secondary btn-sm" onclick="resetSystemUserPassword('${esc2(id)}')">Restablecer clave</button><button class="btn btn-danger btn-sm" onclick="deleteSystemUser('${esc2(id)}')">Eliminar acceso</button></div></div>`}).join(''):'<div class="empty">No hay usuarios adicionales.</div>';
};
window.toggleSystemUser=async function(id){
 const u=(window.state?.users||[]).find(x=>safeId(x)===String(id));if(!u||isOwnerRecord(u))return;
 const next=u.active===false;if(!confirm(next?'¿Activar nuevamente este usuario?':'¿Desactivar el acceso de este usuario?'))return;
 try{await timeout(window._fb.setDoc(window._fb.doc(window._db,'roy_users',safeId(u)),{active:next,updatedAt:new Date().toISOString()},{merge:true}),15000);u.active=next;saveLocal('users',window.state.users);window.renderUsers();showToast(next?'Usuario activado.':'Usuario desactivado.');}catch(e){showToast('No se pudo cambiar el estado del usuario.')}
};
window.resetSystemUserPassword=async function(id){
 const u=(window.state?.users||[]).find(x=>safeId(x)===String(id));if(!u?.email)return showToast('Este usuario no tiene un correo válido.');
 if(!confirm('¿Enviar un enlace para restablecer la contraseña a '+u.email+'?'))return;
 try{await window._fb.sendPasswordResetEmail(window._auth,u.email);showToast('Enlace de recuperación enviado.');}catch(e){showToast('No se pudo enviar el enlace de recuperación.')}
};
window.deleteSystemUser=async function(id){
 const u=(window.state?.users||[]).find(x=>safeId(x)===String(id));if(!u||isOwnerRecord(u))return showToast('La cuenta propietaria está protegida.');
 if(!confirm('¿Eliminar el acceso de '+(u.name||'este usuario')+'? Se borrarán sus roles y permisos de la tienda. La cuenta de Authentication solo puede borrarse desde Firebase.'))return;
 try{const key=safeId(u);if(key)await timeout(window._fb.deleteDoc(window._fb.doc(window._db,'roy_users',key)),15000);window.state.users=window.state.users.filter(x=>safeId(x)!==key);saveLocal('users',window.state.users);window.renderUsers();showToast('Acceso, rol y permisos eliminados correctamente.');}catch(e){showToast('No se pudo eliminar el usuario.')}
};
window.disableAllStaffUsers=async function(){
 if(!canManageUsers())return showToast('Solo el propietario puede realizar esta acción.');
 const list=(window.state?.users||[]).filter(u=>!isOwnerRecord(u)&&u.active!==false);
 if(!list.length)return showToast('No hay usuarios activos para deshabilitar.');
 if(!confirm('¿Deshabilitar a todos los usuarios adicionales?'))return;
 let ok=0,fail=0;
 for(const u of list){try{await timeout(window._fb.setDoc(window._fb.doc(window._db,'roy_users',safeId(u)),{active:false,updatedAt:new Date().toISOString()},{merge:true}),15000);u.active=false;ok++;}catch(e){fail++;}}
 saveLocal('users',window.state.users);window.renderUsers();showToast(fail?`Deshabilitados: ${ok}. Fallaron: ${fail}.`:`${ok} usuarios deshabilitados.`);
};
window.cleanLegacyUsers=async function(){
 if(!canManageUsers())return showToast('Solo el propietario puede realizar esta acción.');
 const legacy=(window.state?.users||[]).filter(u=>!isOwnerRecord(u)&&(!u.email||!String(u.email).includes('@')));
 if(!legacy.length)return showToast('No hay usuarios antiguos o demostrativos.');
 if(!confirm(`¿Eliminar ${legacy.length} usuarios antiguos sin correo real?`))return;
 let ok=0,fail=0;
 for(const u of legacy){try{const key=safeId(u);if(key&&window._firebaseReady)await timeout(window._fb.deleteDoc(window._fb.doc(window._db,'roy_users',key)),12000).catch(()=>{});window.state.users=window.state.users.filter(x=>safeId(x)!==key);ok++;}catch(e){fail++;}}
 saveLocal('users',window.state.users);window.renderUsers();showToast(fail?`Eliminados: ${ok}. Fallaron: ${fail}.`:`${ok} usuarios antiguos eliminados.`);
};
function addMasterButtons(){
 const panel=Q('#usersList')?.parentElement;if(!panel||Q('#userMasterActions'))return;
 const bar=document.createElement('div');bar.id='userMasterActions';bar.className='user-master-actions';bar.innerHTML='<button class="btn btn-secondary btn-sm" onclick="disableAllStaffUsers()">Deshabilitar todos</button><button class="btn btn-danger btn-sm" onclick="cleanLegacyUsers()">Eliminar usuarios antiguos</button>';
 panel.insertBefore(bar,Q('#usersList'));
}
function boot(){drawPermissionGrid(ROLE_MAP.Ventas);setTimeout(()=>{addMasterButtons();window.renderUsers?.()},500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
