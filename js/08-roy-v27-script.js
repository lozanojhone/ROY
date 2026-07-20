
(function(){
 const Q=s=>document.querySelector(s), QA=s=>[...document.querySelectorAll(s)];
 const rolePermissions={
  'Administrador':['*'],
  'Ventas':['dashboard','orders','clients','sales','payments','shipping','messages'],
  'Inventario':['dashboard','catalog','inventory','orders'],
  'Contenido':['dashboard','catalog','gallery','promotions','settings'],
  'Atención al cliente':['dashboard','orders','clients','messages','reviews']
 };
 function canView(view){const p=window._firebasePermissions||[];return p.includes('*')||p.includes(view)}
 window.canView=canView;
 const originalRefresh=window.refreshFirebaseAdminSession;
 window.refreshFirebaseAdminSession=async function(){
  if(!window._firebaseReady||!window._auth?.currentUser){window._firebaseAdmin=false;return false}
  try{
   const uid=window._auth.currentUser.uid;
   const adminSnap=await window._fb.getDoc(window._fb.doc(window._db,'roy_admins',uid));
   const admin=adminSnap.exists()?adminSnap.data():null;
   if(admin?.active===true&&admin.role==='admin'){window._firebaseAdmin=true;window._firebaseRole='Administrador';window._firebasePermissions=['*'];return true}
   const staffSnap=await window._fb.getDoc(window._fb.doc(window._db,'roy_users',uid));
   const staff=staffSnap.exists()?staffSnap.data():null;
   if(staff?.active===true){window._firebaseAdmin=true;window._firebaseRole=staff.role||'Empleado';window._firebasePermissions=Array.isArray(staff.permissions)&&staff.permissions.length?staff.permissions:(rolePermissions[staff.role]||[]);return true}
   window._firebaseAdmin=false;window._firebaseRole=null;window._firebasePermissions=[];return false;
  }catch(e){console.warn(e);window._firebaseAdmin=false;return false}
 };
 const oldShowAdminView=window.showAdminView;
 window.showAdminView=function(name,btn){if(!canView(name)){showToast('Tu rol no tiene permiso para abrir esta sección.');return}return oldShowAdminView.call(this,name,btn)};
 function applyRoleMenu(){QA('#adminMenu button[data-view]').forEach(b=>b.style.display=canView(b.dataset.view)?'':'none');const label=Q('#syncLabel');if(label&&window._firebaseRole)label.textContent='Firebase activo · '+window._firebaseRole}
 const oldShowAdminApp=window.showAdminApp;
 window.showAdminApp=async function(){
  if(!adminSessionValid())return showAdminLoginError('Sesión no autorizada.');
  Q('#adminLogin').classList.add('hidden');Q('#adminApp').classList.remove('hidden');
  renderAllAdmin();applyRoleMenu();setSyncLabel(true);
  reloadProtectedAdminData().then(()=>{renderAllAdmin();applyRoleMenu();setSyncLabel(true)}).catch(console.warn);
 };
 window.openUserForm=function(id=''){
  const u=state.users.find(x=>x.id===id)||{};Q('#userId').value=u.id||'';Q('#userName').value=u.name||'';Q('#userEmail').value=u.email||'';Q('#userEmail').disabled=!!u.id;Q('#userPassword').value='';Q('#userPassword').closest('.form-group').style.display=u.id?'none':'';Q('#userRole').value=u.role||'Ventas';Q('#userActive').value=String(u.active!==false);Q('#userModalTitle').textContent=u.id?'EDITAR USUARIO':'AGREGAR USUARIO';Q('#userSaveStatus').textContent='';openModal('userModal')
 };
 window.saveSystemUser=async function(){
  if(!canView('users'))return showToast('No tienes permiso para administrar usuarios.');
  const id=Q('#userId').value.trim(),name=Q('#userName').value.trim(),email=Q('#userEmail').value.trim().toLowerCase(),pass=Q('#userPassword').value,role=Q('#userRole').value,active=Q('#userActive').value==='true',btn=Q('#saveUserBtn'),status=Q('#userSaveStatus');
  if(!name||!email)return status.textContent='Completa nombre y correo.';
  if(!id&&pass.length<6)return status.textContent='La contraseña debe tener al menos 6 caracteres.';
  btn.disabled=true;btn.classList.add('v27-saving');status.textContent='Creando cuenta y asignando permisos...';
  try{
   let uidValue=id;
   if(!id){
    const secondary=window._firebaseInitializeApp(window._firebaseConfig,'roy-user-'+Date.now());const secondaryAuth=window._firebaseGetAuth(secondary);
    try{const cred=await window._fb.createUserWithEmailAndPassword(secondaryAuth,email,pass);uidValue=cred.user.uid;await window._fb.signOut(secondaryAuth)}finally{await window._firebaseDeleteApp(secondary)}
   }
   const record={id:uidValue,uid:uidValue,name,email,role,active,permissions:rolePermissions[role]||[],updatedAt:new Date().toISOString(),createdAt:state.users.find(x=>x.id===uidValue)?.createdAt||new Date().toISOString()};
   await window._fb.setDoc(window._fb.doc(window._db,'roy_users',uidValue),record,{merge:true});
   const i=state.users.findIndex(x=>x.id===uidValue);if(i>=0)state.users[i]=record;else state.users.unshift(record);saveLocal('users',state.users);renderUsers();closeModal('userModal');showToast(id?'Usuario actualizado correctamente.':'Usuario creado con inicio de sesión real.');
  }catch(e){console.error(e);status.textContent='NO SE GUARDÓ: '+firebaseAuthErrorText(e)}finally{btn.disabled=false;btn.classList.remove('v27-saving')}
 };
 window.renderUsers=function(){const box=Q('#usersList');if(!box)return;box.innerHTML=state.users.length?state.users.map(u=>`<div class="order-card"><div class="order-top"><div><b>${esc(u.name)}</b><div class="muted" style="font-size:10px;margin-top:4px">${esc(u.email||u.username||'Sin correo')}</div></div><span class="role-badge">${esc(u.role||'Empleado')}</span></div><div class="muted" style="font-size:9px">${u.active!==false?'Cuenta activa':'Cuenta inactiva'} · Acceso: ${(u.permissions||[]).includes('*')?'Todo el sistema':esc((u.permissions||[]).join(', ')||'Según rol')}</div><div class="user-actions"><button class="btn btn-secondary btn-sm" onclick="openUserForm('${u.id}')">Editar</button><button class="btn btn-secondary btn-sm" onclick="toggleSystemUser('${u.id}')">${u.active!==false?'Desactivar':'Activar'}</button><button class="btn btn-danger btn-sm" onclick="deleteSystemUser('${u.id}')">Eliminar acceso</button></div></div>`).join(''):'<div class="empty">No hay usuarios adicionales.</div>'};
 window.toggleSystemUser=async function(id){const u=state.users.find(x=>x.id===id);if(!u)return;u.active=u.active===false;u.updatedAt=new Date().toISOString();await window._fb.setDoc(window._fb.doc(window._db,'roy_users',id),u,{merge:true});saveLocal('users',state.users);renderUsers();showToast(u.active?'Usuario activado.':'Usuario desactivado.')};
 window.deleteSystemUser=async function(id){if(!confirm('¿Eliminar el acceso de este usuario? La cuenta de Authentication permanecerá, pero ya no podrá entrar al sistema.'))return;await window._fb.deleteDoc(window._fb.doc(window._db,'roy_users',id));state.users=state.users.filter(x=>x.id!==id);saveLocal('users',state.users);renderUsers();showToast('Acceso eliminado correctamente.')};
 window.renderPayments=function(){const pending=state.orders.filter(o=>o.paymentStatus!=='Confirmado'),confirmed=state.orders.filter(o=>o.paymentStatus==='Confirmado'),totalPending=pending.reduce((s,o)=>s+Number(o.total||0),0);if(Q('#paymentKpis'))Q('#paymentKpis').innerHTML=kpi('Pagos pendientes',pending.length,money(totalPending))+kpi('Pagos confirmados',confirmed.length,money(confirmed.reduce((s,o)=>s+Number(o.total||0),0)))+kpi('Yape',state.orders.filter(o=>o.payment==='Yape').length,'Pedidos')+kpi('Plin',state.orders.filter(o=>o.payment==='Plin').length,'Pedidos');if(Q('#paymentsBody'))Q('#paymentsBody').innerHTML=state.orders.length?state.orders.map(o=>`<tr><td><b>${esc(o.id)}</b></td><td>${esc(o.client?.name)}</td><td>${esc(o.payment)}</td><td class="orange"><b>${money(o.total)}</b></td><td><span class="status ${o.paymentStatus==='Confirmado'?'confirmado':'pendiente'}">${esc(o.paymentStatus||'Pendiente')}</span></td><td>${dateText(o.createdAt)}</td><td><div class="payment-actions">${o.paymentStatus==='Confirmado'?'<span class="status confirmado">Pago confirmado</span>':`<button class="btn btn-primary btn-sm" onclick="confirmPayment('${o.id}')">Confirmar pago</button><button class="btn btn-danger btn-sm" onclick="deletePendingPayment('${o.id}')">Eliminar pendiente</button>`}</div></td></tr>`).join(''):'<tr><td colspan="7" class="muted">Sin pagos.</td></tr>'};
 window.confirmPayment=async function(id){const o=state.orders.find(x=>x.id===id);if(!o||o.paymentStatus==='Confirmado')return;o.paymentStatus='Confirmado';if(o.status==='Pendiente')o.status='Confirmado';o.paymentConfirmedAt=new Date().toISOString();await putRecord('orders',o);saveLocal('orders',state.orders);renderEverything();showToast('Pago confirmado correctamente.')};
 window.deletePendingPayment=async function(id){const o=state.orders.find(x=>x.id===id);if(!o||o.paymentStatus==='Confirmado')return;if(!confirm('¿Eliminar este pago pendiente y su pedido? Esta acción no se puede deshacer.'))return;await removeRecord('orders',id);state.orders=state.orders.filter(x=>x.id!==id);saveLocal('orders',state.orders);renderEverything();showToast('Pago pendiente eliminado.')};
 // Refuerzo de historial: mantiene una barrera interna y vuelve a Inicio antes de abandonar.
 function pageNow(){return QA('.page.active')[0]?.id?.replace('page-','')||'inicio'}
 function ensureGuard(){const base=location.href.split('#')[0];if(!history.state?.royV27){history.replaceState({royV27:true,royPage:'inicio'},'',base+'#inicio');history.pushState({royV27:true,royPage:pageNow()},'',base+'#'+pageNow())}}
 ensureGuard();window.addEventListener('pageshow',ensureGuard);window.addEventListener('popstate',function(e){if(e.state?.royV27)return;showPage('inicio',{fromPop:true});history.pushState({royV27:true,royPage:'inicio'},'',location.href.split('#')[0]+'#inicio')},true);
 document.addEventListener('DOMContentLoaded',()=>{ensureGuard();setTimeout(applyRoleMenu,300)});
})();
