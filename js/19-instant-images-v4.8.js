'use strict';
/* ROY 4.8 - La miniatura principal vive en roy_products para evitar una segunda lectura. */
(()=>{
  const valid=v=>typeof v==='string'&&v.length>30&&(v.startsWith('data:image/')||v.startsWith('https://')||v.startsWith('http://')||v.startsWith('blob:'));
  const running=new Map();

  function paint(product,src){
    if(!product||!valid(src))return false;
    product.image=src;
    product._mainFull=true;
    const id=String(product.id||'');
    document.querySelectorAll(`img[data-product-image="${CSS.escape(id)}"],#img-${CSS.escape(id)}`).forEach(img=>{
      if(img.getAttribute('src')!==src)img.setAttribute('src',src);
      img.loading='eager';
      img.decoding='sync';
      try{img.fetchPriority='high'}catch(_){ }
    });
    return true;
  }

  async function resolve(product,persist=false){
    if(!product)return false;
    if((product._mainFull||product.imageOriginalVersion>=52)&&valid(product.image))return paint(product,product.image);
    if(!product.imageAssetId||!window._firebaseReady||!window._db||!window._fb?.getDoc)return false;
    if(running.has(product.id))return running.get(product.id);
    const job=(async()=>{
      const ref=window._fb.doc(window._db,'roy_product_images',product.imageAssetId);
      const snap=await window._fb.getDoc(ref);
      if(!snap.exists())return false;
      const row=snap.data()||{};
      const src=row.data||'';
      if(!paint(product,src))return false;
      // Solo personal autorizado migra el producto antiguo. Luego todos los clientes
      // reciben la miniatura en la misma lectura del catálogo.
      if(persist&&window._firebaseAdmin){
        await window._fb.setDoc(window._fb.doc(window._db,'roy_products',String(product.id)),{
          image:src,
          imageOriginalVersion:52,
          imageEmbeddedVersion:52,
          imageEmbeddedAt:new Date().toISOString()
        },{merge:true});
      }
      return true;
    })().catch(err=>{console.warn('ROY 4.8 imagen principal:',err?.message||err);return false}).finally(()=>running.delete(product.id));
    running.set(product.id,job);
    return job;
  }

  async function migrateAll(){
    const products=Array.isArray(window.state?.products)?window.state.products:[];
    const missing=products.filter(p=>p.imageAssetId&&!(p._mainFull||p.imageOriginalVersion>=52));
    if(!missing.length){
      products.forEach(p=>paint(p,p.image));
      return;
    }
    // Descarga paralela inmediata, sin esperas escalonadas.
    let cursor=0;
    const workers=Array.from({length:Math.min(8,missing.length)},async()=>{
      while(cursor<missing.length){const p=missing[cursor++];await resolve(p,true)}
    });
    await Promise.all(workers);
    try{window.saveLocal?.('products',products)}catch(_){ }
    window.renderFeatured?.();
    window.renderStore?.();
    window.renderSale?.();
  }

  function prioritizeVisible(){
    document.querySelectorAll('.product-card img[data-product-image]').forEach((img,index)=>{
      img.loading=index<12?'eager':'lazy';
      img.decoding=index<12?'sync':'async';
      try{img.fetchPriority=index<6?'high':'auto'}catch(_){ }
    });
  }

  const observer=new MutationObserver(()=>prioritizeVisible());
  document.addEventListener('DOMContentLoaded',()=>{
    prioritizeVisible();
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(migrateAll,0);
  });
  window.addEventListener('roy-realtime-ready',()=>setTimeout(migrateAll,0));
  window.addEventListener('firebase-ready',()=>setTimeout(migrateAll,0));
  window.addEventListener('firebase-auth-changed',()=>setTimeout(migrateAll,0));
  window.royMigrateInstantImages=migrateAll;
})();
