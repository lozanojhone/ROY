'use strict';
/* ROY 4.3: sincronizacion inmediata del catalogo entre navegadores. */
(()=>{
  const unsubscribers=[];
  let started=false;
  let renderTimer=0;

  const normalizeProduct=p=>({
    ...p,
    gallery:Array.isArray(p.gallery)?p.gallery:[],
    colorImages:typeof normalizeColorImages==='function'?normalizeColorImages(p.colorImages||{}):(p.colorImages||{}),
    colors:Array.isArray(p.colors)&&p.colors.length?p.colors:['Único'],
    sizes:Array.isArray(p.sizes)&&p.sizes.length?p.sizes:['Única']
  });

  function scheduleRender(){
    clearTimeout(renderTimer);
    renderTimer=setTimeout(()=>{
      try{
        if(typeof renderEverything==='function')renderEverything();
        if(typeof applySettings==='function')applySettings();
        if(typeof setSyncLabel==='function')setSyncLabel(true);
      }catch(error){console.warn('ROY: no se pudo actualizar la vista en tiempo real.',error);}
    },40);
  }

  function subscribe(name,apply){
    const fb=window._fb;
    const db=window._db;
    if(!fb?.onSnapshot||!fb?.collection||!db)return;
    const stop=fb.onSnapshot(
      fb.collection(db,'roy_'+name),
      snapshot=>{
        const rows=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
        apply(rows);
        try{saveLocal(name,rows);}catch(_){/* copia local secundaria */}
        scheduleRender();
      },
      error=>{
        console.warn('ROY: escucha en tiempo real no disponible para '+name+':',error?.message||error);
        if(typeof setSyncLabel==='function')setSyncLabel(false);
      }
    );
    unsubscribers.push(stop);
  }

  function start(){
    if(started||!window._firebaseReady||!window._db||!window._fb?.onSnapshot)return;
    started=true;

    // La coleccion vacia tambien se aplica. Por eso, al eliminar el ultimo producto,
    // todos los navegadores muestran inmediatamente el catalogo vacio.
    subscribe('products',rows=>{state.products=rows.map(normalizeProduct);});
    subscribe('categories',rows=>{state.categories=rows;});
    subscribe('promotions',rows=>{state.promotions=rows;});
    subscribe('media',rows=>{state.media=rows;});
    subscribe('settings',rows=>{
      const main=rows.find(x=>x.id==='main')||rows[0];
      if(main)state.settings={...state.settings,...main};
    });

    window.dispatchEvent(new CustomEvent('roy-realtime-ready'));
  }

  window.addEventListener('firebase-ready',start);
  if(window._firebaseReady!==undefined)setTimeout(start,0);
  window.addEventListener('pagehide',()=>unsubscribers.splice(0).forEach(stop=>{try{stop();}catch(_){}}),{once:true});
})();
