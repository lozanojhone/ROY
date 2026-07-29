/* ROY Enterprise 5.3 - galeria estable, sin blancos y con retorno a Generales. */
(function(){
  'use strict';

  const imageCache=new Map();
  const valid=src=>typeof src==='string'&&src.trim()&&!/placehold\.co|logo-roy/i.test(src);
  function preload(src){
    if(!valid(src))return Promise.resolve(false);
    if(imageCache.has(src))return imageCache.get(src);
    const task=new Promise(resolve=>{
      const im=new Image();
      im.decoding='async';
      im.onload=()=>{if(im.decode)im.decode().catch(()=>{}).finally(()=>resolve(true));else resolve(true)};
      im.onerror=()=>resolve(false);
      im.src=src;
      if(im.complete&&im.naturalWidth)resolve(true);
    });
    imageCache.set(src,task);
    return task;
  }
  function warm(list){[...new Set((list||[]).filter(valid))].forEach(preload)}
  function productNow(){return window.state?.products?.find(x=>x.id===window.currentQuickId||x.id===currentQuickId)}
  function generalGallery(p){
    const list=typeof baseProductGallery==='function'?baseProductGallery(p):[p.image,...(p.gallery||[])];
    return [...new Set(list.filter(valid))];
  }
  function selectedGallery(p,color){
    if(!color)return generalGallery(p);
    const list=typeof colorGallery==='function'?colorGallery(p,color):((p.colorImages||{})[color]||[]);
    return [...new Set((list||[]).filter(valid))];
  }
  async function safeMainSwap(src){
    const img=document.getElementById('quickImage');
    if(!img||!valid(src))return false;
    const ok=await preload(src);
    if(!ok)return false;
    // Solo sustituye cuando la nueva foto ya esta completamente lista.
    img.classList.add('roy-image-changing');
    img.src=src;
    requestAnimationFrame(()=>img.classList.remove('roy-image-changing'));
    return true;
  }
  function thumbMarkup(src,i,context){
    return `<button class="quick-thumb ${i===0?'active':''}" onclick="chooseQuickImage(${i},this)" aria-label="${esc(context)} vista ${i+1}"><img src="${esc(src)}" alt="${esc(context)} · vista ${i+1}" loading="eager" decoding="async"></button>`;
  }

  window.renderQuickGallery=renderQuickGallery=function(p,color=''){
    const next=selectedGallery(p,color);
    if(!next.length){
      // Nunca vaciar la galeria: conserva la ultima foto valida visible.
      const visible=document.getElementById('quickImage')?.src||'';
      if(valid(visible))next.push(visible);
      else if(valid(p.imageThumb))next.push(p.imageThumb);
      else if(valid(p.image))next.push(p.image);
    }
    quickImageList=next;
    quickImageIndex=0;
    const context=color?`Color ${color}`:'Fotos generales';
    const thumbs=document.getElementById('quickThumbs');
    if(thumbs&&next.length)thumbs.innerHTML=next.map((src,i)=>thumbMarkup(src,i,context)).join('');
    warm(next);
    if(next[0])safeMainSwap(next[0]);
  };

  window.chooseQuickImage=chooseQuickImage=function(index,el){
    const src=quickImageList[index]||quickImageList[0];
    if(!src)return;
    quickImageIndex=index;
    document.querySelectorAll('#quickThumbs .quick-thumb').forEach(x=>x.classList.remove('active'));
    el?.classList.add('active');
    safeMainSwap(src);
  };

  function renderColorOptions(p){
    const colors=p.colors||[];
    const general=generalGallery(p);
    const generalPreview=general[0]||p.imageThumb||p.image||'';
    const generalButton=`<button class="color-photo-option active general-photo-option" title="Fotos generales" onclick="chooseQuick('general',0,this)" aria-pressed="true"><span class="general-photo-icon">▣</span><span>Generales</span></button>`;
    const colorButtons=colors.map((x,i)=>{
      const own=normalizeColorImages(p.colorImages||{})[x]||[];
      const preview=own.find(valid)||generalPreview;
      return `<button class="color-photo-option" title="${esc(x)}" onclick="chooseQuick('color',${i},this)" aria-pressed="false"><img src="${esc(preview)}" alt="${esc(x)}" loading="eager" decoding="async"><span>${esc(x)}</span></button>`;
    }).join('');
    const box=document.getElementById('quickColors');
    if(box){box.className='color-photo-options';box.innerHTML=generalButton+colorButtons}
    warm(colors.flatMap(c=>(normalizeColorImages(p.colorImages||{})[c]||[])));
  }

  window.openQuick=openQuick=async function(id){
    let p=state.products.find(x=>x.id===id);if(!p)return;
    currentQuickId=id;quickQty=1;quickColor='';
    openModal('quickModal');
    renderQuickGallery(p,'');
    const sizes=displaySizes(p);quickSize=sizes[0]||'Única';
    const paint=()=>{
      $('#quickSku').textContent='SKU: '+(p.sku||'—');$('#quickBrand').textContent=p.brand||'ROY';$('#quickName').textContent=p.name;
      $('#quickPrice').textContent=money(p.price);$('#quickOldPrice').textContent=p.oldPrice&&p.oldPrice>p.price?money(p.oldPrice):'';
      const discount=p.oldPrice>p.price?Math.round((1-p.price/p.oldPrice)*100):0;$('#quickDiscount').textContent=discount?'-'+discount+'%':'';$('#quickDiscount').classList.toggle('hidden',!discount);
      $('#quickDescription').textContent=p.description||'';$('#quickColorLabel').textContent='Fotos generales';renderColorOptions(p);
      $('#quickSizes').innerHTML=sizes.map((x,i)=>`<button class="chip ${i===0?'active':''}" onclick="chooseQuickSize('${esc(x)}',this)">${esc(x)}</button>`).join('');
      $('#quickQty').textContent='1';$('#quickStock').textContent=p.stock>0?'Disponible para compra · selecciona un color':'Producto agotado';$('#quickAddBtn').disabled=p.stock<=0;$('#quickAddBtn').style.opacity=p.stock<=0?'.45':'1';
    };
    paint();setupProductZoom();
    // Descarga originales de inmediato, sin ocultar la foto ligera que ya esta visible.
    try{
      if(window.royEnsureProductImages){
        const loaded=await window.royEnsureProductImages(id,'detail');
        if(loaded)p=loaded;
        if(currentQuickId!==id)return;
        renderQuickGallery(p,'');paint();setupProductZoom();
      }
    }catch(e){console.warn('ROY: se mantuvo la ultima foto valida.',e)}
    // Precarga las fotos originales de cada color en segundo plano.
    (p.colors||[]).forEach(color=>window.royEnsureProductImages?.(id,'color',color).then(pp=>{
      if(pp)warm(selectedGallery(pp,color));
    }).catch(()=>{}));
  };

  window.chooseQuick=chooseQuick=async function(type,index,el){
    let p=state.products.find(x=>x.id===currentQuickId);if(!p)return;
    document.querySelectorAll('#quickColors .color-photo-option').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false')});
    el?.classList.add('active');el?.setAttribute('aria-pressed','true');
    if(type==='general'){
      quickColor='';
      $('#quickColorLabel').textContent='Fotos generales';
      renderQuickGallery(p,'');setupProductZoom();
      try{if(window.royEnsureProductImages){p=await window.royEnsureProductImages(currentQuickId,'detail')||p;if(!quickColor){renderQuickGallery(p,'');setupProductZoom()}}}catch(_){ }
      $('#quickStock').textContent=p.stock>0?'Disponible para compra · selecciona un color':'Producto agotado';
      return;
    }
    if(type==='color'){
      quickColor=(p.colors||[])[index]||'';
      $('#quickColorLabel').textContent=quickColor||'Fotos generales';
      const available=selectedGallery(p,quickColor);
      // Si aun no llego la foto del color, conserva la actual hasta tener una valida.
      if(available.length)renderQuickGallery(p,quickColor);
      setupProductZoom();
      try{
        if(window.royEnsureProductImages){
          p=await window.royEnsureProductImages(currentQuickId,'color',quickColor)||p;
          if(quickColor===(p.colors||[])[index]){
            const originals=selectedGallery(p,quickColor);
            if(originals.length)renderQuickGallery(p,quickColor);
            setupProductZoom();
          }
        }
      }catch(e){console.warn('ROY: no se dejo la galeria en blanco.',e)}
      $('#quickStock').textContent=p.stock>0?'Disponible para compra':'Producto agotado';
    }
  };
})();
