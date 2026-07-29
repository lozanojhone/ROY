'use strict';
/* ROY Enterprise 5.1 - Hotfix usuarios, edición de imágenes, carga inicial y regreso a tienda. */
(()=>{
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  let usersLoading=false;

  // Regresar siempre a la tienda, no a "Mi cuenta".
  window.closeAdmin=function(){
    $('#adminLogin')?.classList.add('hidden');
    $('#adminApp')?.classList.add('hidden');
    $('#storeApp')?.classList.remove('hidden');
    try{ window.showPage?.('tienda'); }catch(_){ }
    try{ history.replaceState({royPage:'tienda'},'',location.href.split('#')[0]+'#tienda'); }catch(_){ }
    window.scrollTo({top:0,behavior:'instant'});
  };

  async function refreshUsersSafe(showMessage=false){
    if(usersLoading)return;
    usersLoading=true;
    const box=$('#usersList');
    if(box&&!box.children.length)box.innerHTML='<div class="empty">Cargando usuarios...</div>';
    try{
      if(typeof window.syncUsersFromFirestore==='function'){
        await window.syncUsersFromFirestore(showMessage);
      }else if(typeof window.renderUsers==='function'){
        window.renderUsers();
      }
      if(typeof window.loadUserAudit==='function')await window.loadUserAudit(false);
    }catch(error){
      console.error('ROY 5.1 usuarios:',error);
      if(box)box.innerHTML='<div class="empty">No se pudieron cargar los usuarios. Verifica tu sesión y las reglas de Firebase.</div>';
      window.showToast?.('No se pudieron cargar los usuarios.');
    }finally{usersLoading=false}
  }

  // Evita que una excepción secundaria deje el botón Usuarios sin respuesta.
  const previousShowAdminView=window.showAdminView;
  window.showAdminView=function(name,btn){
    if(name!=='users')return previousShowAdminView?.call(this,name,btn);
    try{
      if(typeof window.adminSessionValid==='function'&&!window.adminSessionValid()){
        window.showToast?.('Tu sesión administrativa expiró.');
        return;
      }
      $$('.admin-view').forEach(x=>x.classList.remove('active'));
      $('#admin-users')?.classList.add('active');
      $$('#adminMenu button[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view==='users'));
      $('#adminSide')?.classList.remove('open');
      window.renderUsers?.();
      refreshUsersSafe(false);
      try{window.touchAdmin?.()}catch(_){ }
    }catch(error){
      console.error('ROY 5.1 abrir usuarios:',error);
      $('#admin-users')?.classList.add('active');
      refreshUsersSafe(false);
    }
  };

  // Antes de editar, recupera desde Firestore las fotografías antiguas guardadas por ID.
  const previousEditProduct=window.editProduct;
  window.editProduct=async function(id){
    const button=document.activeElement;
    if(button?.tagName==='BUTTON'){button.disabled=true;button.dataset.oldText=button.innerHTML;button.innerHTML='Cargando...'}
    try{
      let product=(window.state?.products||[]).find(p=>String(p.id)===String(id));
      if(product&&typeof window.royEnsureProductImages==='function'){
        product=await window.royEnsureProductImages(id,'detail')||product;
        const colors=Array.isArray(product.colors)?product.colors:[];
        await Promise.all(colors.map(c=>window.royEnsureProductImages(id,'color',c).catch(()=>null)));
      }
      return previousEditProduct?.call(this,id);
    }catch(error){
      console.error('ROY 5.1 editar producto:',error);
      window.showToast?.('Se abrió el producto, pero alguna imagen antigua no pudo recuperarse.');
      return previousEditProduct?.call(this,id);
    }finally{
      if(button?.tagName==='BUTTON'){button.disabled=false;button.innerHTML=button.dataset.oldText||'Editar';delete button.dataset.oldText}
    }
  };

  // Prioriza las imágenes principales de productos antiguos sin bloquear la interfaz.
  async function warmMainImages(){
    const products=Array.isArray(window.state?.products)?window.state.products:[];
    const pending=products.filter(p=>p?.imageAssetId&&!(p.imageThumb||p.image));
    let cursor=0;
    const workers=Array.from({length:Math.min(6,pending.length)},async()=>{
      while(cursor<pending.length){
        const p=pending[cursor++];
        try{await window.royEnsureProductImages?.(p.id,'main')}catch(_){ }
      }
    });
    await Promise.all(workers);
    window.renderFeatured?.();window.renderStore?.();window.renderSale?.();
  }

  function install(){
    const usersBtn=$('#adminMenu button[data-view="users"]');
    if(usersBtn&&!usersBtn.dataset.roy51){
      usersBtn.dataset.roy51='1';
      usersBtn.onclick=e=>{e.preventDefault();window.showAdminView('users',usersBtn)};
    }
    $$('button').filter(b=>/volver a la tienda|ver tienda/i.test(b.textContent||'')).forEach(b=>b.onclick=e=>{e.preventDefault();window.closeAdmin()});
  }

  document.addEventListener('DOMContentLoaded',()=>{install();setTimeout(warmMainImages,0)});
  window.addEventListener('firebase-ready',()=>setTimeout(warmMainImages,50));
  window.addEventListener('roy-realtime-ready',()=>setTimeout(warmMainImages,50));
  new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
})();
