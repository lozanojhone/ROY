'use strict';
/* ROY Enterprise 5.0 LTS: preserva proporciones y verifica módulos críticos. */
(()=>{
  const validImage=v=>typeof v==='string'&&v.length>30&&(/^(data:image\/|https?:\/\/|blob:)/).test(v);
  function normalizeImages(){
    document.querySelectorAll('.product-image img,.quick-image img,.quick-main-image img,.cart-item img,.checkout-product img,.v20-photo img,#v20MainPreview').forEach(img=>{
      img.style.objectFit='contain';
      img.style.objectPosition='center center';
      img.draggable=false;
      if(validImage(img.getAttribute('src')||'')) img.removeAttribute('aria-busy');
    });
  }
  function checkCritical(){
    const status={
      firebase:!!(window._fb&&window._auth&&window._db),
      products:Array.isArray(window.state?.products),
      users:Array.isArray(window.state?.users),
      passwordChange:typeof window.changeMyAdminPassword==='function',
      passwordReset:typeof window.sendUserPasswordReset==='function'
    };
    window.ROY_LTS_STATUS=status;
    const failed=Object.entries(status).filter(([,ok])=>!ok).map(([k])=>k);
    if(failed.length) console.warn('ROY 5.0: módulos pendientes al iniciar:',failed.join(', '));
    return status;
  }
  const observer=new MutationObserver(normalizeImages);
  document.addEventListener('DOMContentLoaded',()=>{
    normalizeImages();
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(checkCritical,800);
  });
  window.addEventListener('firebase-ready',()=>setTimeout(checkCritical,100));
  window.addEventListener('firebase-auth-changed',()=>setTimeout(checkCritical,100));
})();
