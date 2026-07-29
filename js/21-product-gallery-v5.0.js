'use strict';
/* ROY Enterprise 5.0 - Galeria movil vertical, variantes por color y carga sin pantalla vacia. */
(()=>{
  const imageCache=new Map();
  let renderToken=0;

  const unique=list=>[...new Set((list||[]).filter(Boolean))];
  const currentProduct=()=>state.products.find(p=>String(p.id)===String(currentQuickId));
  const safeImages=(p,color='')=>{
    if(!p)return [];
    const main=((p._mainFull||p.imageOriginalVersion>=52||!p.imageAssetId)&&p.image)?p.image:'';
    const general=unique([main,...(Array.isArray(p.gallery)?p.gallery:[])]);
    if(!color)return general;
    const own=unique(normalizeColorImages(p.colorImages||{})[color]||[]);
    return own.length?own:general;
  };

  function loadImage(src){
    if(!src)return Promise.reject(new Error('Imagen vacia'));
    if(imageCache.has(src))return imageCache.get(src);
    const task=new Promise((resolve,reject)=>{
      const img=new Image();
      img.decoding='async';
      img.onload=async()=>{try{await img.decode?.()}catch(_){ } resolve(src)};
      img.onerror=()=>reject(new Error('No se pudo cargar la imagen'));
      img.src=src;
    }).catch(err=>{imageCache.delete(src);throw err});
    imageCache.set(src,task);
    return task;
  }

  function setMainImage(src,index=0){
    const img=document.getElementById('quickImage');
    if(!img)return;
    const previous=img.currentSrc||img.src||'';
    img.classList.add('roy-image-switching');
    loadImage(src).then(valid=>{
      img.onload=()=>img.classList.remove('roy-image-switching');
      img.onerror=()=>{img.onerror=null;if(previous)img.src=previous;else img.removeAttribute('src');img.classList.remove('roy-image-switching');img.closest('.quick-main-image')?.classList.add('roy-original-error')};
      img.src=valid;
      quickImageIndex=index;
    }).catch(()=>{
      if(!img.src&&previous)img.src=previous;
      img.classList.remove('roy-image-switching');
    });
  }

  function thumbMarkup(src,i,context){
    return `<button type="button" class="quick-thumb ${i===quickImageIndex?'active':''}" onclick="chooseQuickImage(${i},this)" aria-label="${esc(context)} vista ${i+1}"><img loading="${i<3?'eager':'lazy'}" decoding="async" src="${esc(src)}" alt="${esc(context)} · vista ${i+1}" onerror="this.closest('.quick-thumb')?.classList.add('roy-original-error');this.remove()"></button>`;
  }

  window.renderQuickGallery=function(p,color=''){
    const token=++renderToken;
    quickImageList=safeImages(p,color);
    quickImageIndex=0;
    const context=color?`Color ${color}`:'Fotos generales';
    const thumbs=document.getElementById('quickThumbs');
    if(thumbs)thumbs.innerHTML=quickImageList.map((src,i)=>thumbMarkup(src,i,context)).join('');
    if(quickImageList.length)setMainImage(quickImageList[0],0);else{const img=document.getElementById('quickImage');img?.removeAttribute('src');img?.closest('.quick-main-image')?.classList.add('roy-original-error');if(thumbs)thumbs.innerHTML='<div class="roy-original-gallery-loading"><small>No se encontró la imagen original.</small></div>'}
    quickImageList.slice(1,4).forEach(src=>loadImage(src).catch(()=>{}));
    requestAnimationFrame(()=>{
      if(token!==renderToken)return;
      document.querySelector('#quickThumbs .quick-thumb')?.scrollIntoView({block:'nearest',inline:'nearest'});
    });
  };

  window.chooseQuickImage=function(index,el){
    const src=quickImageList[index]||quickImageList[0];if(!src)return;
    document.querySelectorAll('#quickThumbs .quick-thumb').forEach(x=>x.classList.remove('active'));
    el?.classList.add('active');
    setMainImage(src,index);
  };

  window.navigateQuickImage=function(dir){
    if(!quickImageList.length)return;
    const index=(quickImageIndex+dir+quickImageList.length)%quickImageList.length;
    chooseQuickImage(index,document.querySelectorAll('#quickThumbs .quick-thumb')[index]);
  };

  function colorButton(name,index,p){
    const own=normalizeColorImages(p.colorImages||{})[name]||[];
    const available=own.length||p.colorImageAssetIds?.[name]?.length;
    return `<button type="button" class="color-photo-option" title="Ver color ${esc(name)}" onclick="chooseQuick('color',${index},this)" aria-pressed="false" data-has-images="${available?'true':'false'}"><span>${esc(name)}</span></button>`;
  }

  function renderColorSelectors(p){
    const box=document.getElementById('quickColors');
    if(!box)return;
    box.className='color-photo-options';
    box.innerHTML=`<button type="button" class="color-photo-option general-photo-option active" onclick="showGeneralProductPhotos(this)" aria-pressed="true"><i class="fa-regular fa-images"></i><span>Generales</span></button>`+
      (p.colors||['Único']).map((name,i)=>colorButton(name,i,p)).join('');
  }

  window.showGeneralProductPhotos=function(el){
    const p=currentProduct();if(!p)return;
    quickColor='';
    document.getElementById('quickColorLabel').textContent='Fotos generales';
    document.querySelectorAll('#quickColors .color-photo-option').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false')});
    el?.classList.add('active');el?.setAttribute('aria-pressed','true');
    renderQuickGallery(p,'');
    setupProductZoom();
  };

  window.chooseQuick=async function(type,index,el){
    let p=currentProduct();if(!p)return;
    if(type!=='color')return;
    quickColor=(p.colors||['Único'])[index];
    document.getElementById('quickColorLabel').textContent=quickColor;
    document.querySelectorAll('#quickColors .color-photo-option').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false')});
    el?.classList.add('active');el?.setAttribute('aria-pressed','true');

    // Conserva la fotografia visible mientras llegan las imagenes completas del color.
    const before=safeImages(p,quickColor);
    if(before.length)renderQuickGallery(p,quickColor);
    try{
      if(window.royEnsureProductImages)p=await window.royEnsureProductImages(currentQuickId,'color',quickColor)||p;
    }catch(error){console.warn('ROY galeria color:',error)}
    if(String(currentQuickId)!==String(p.id)||quickColor!==(p.colors||['Único'])[index])return;
    renderQuickGallery(p,quickColor);
    document.getElementById('quickStock').textContent=p.stock>0?'Disponible para compra':'Producto agotado';
    setupProductZoom();
  };

  window.openQuick=async function(id){
    let p=state.products.find(x=>String(x.id)===String(id));if(!p)return;
    currentQuickId=id;quickQty=1;quickColor='';quickImageIndex=0;
    openModal('quickModal');

    // Muestra un cargador oscuro mientras se recupera la fotografia original.
    const initialImage=document.getElementById('quickImage');
    initialImage?.removeAttribute('src');
    initialImage?.closest('.quick-main-image')?.classList.add('roy-original-loading');
    const initialThumbs=document.getElementById('quickThumbs');
    if(initialThumbs)initialThumbs.innerHTML='<div class="roy-original-gallery-loading"><span></span><small>Cargando fotos originales...</small></div>';
    const sizes=displaySizes(p);quickSize=sizes[0]||'Única';
    document.getElementById('quickSku').textContent='SKU: '+(p.sku||'—');
    document.getElementById('quickBrand').textContent=p.brand||'ROY';
    document.getElementById('quickName').textContent=p.name;
    document.getElementById('quickPrice').textContent=money(p.price);
    document.getElementById('quickOldPrice').textContent=p.oldPrice&&p.oldPrice>p.price?money(p.oldPrice):'';
    const discount=p.oldPrice>p.price?Math.round((1-p.price/p.oldPrice)*100):0;
    document.getElementById('quickDiscount').textContent=discount?'-'+discount+'%':'';
    document.getElementById('quickDiscount').classList.toggle('hidden',!discount);
    document.getElementById('quickDescription').textContent=p.description||'';
    document.getElementById('quickColorLabel').textContent='Fotos generales';
    renderColorSelectors(p);
    document.getElementById('quickSizes').innerHTML=sizes.map((x,i)=>`<button class="chip ${i===0?'active':''}" onclick="chooseQuickSize('${esc(x)}',this)">${esc(x)}</button>`).join('');
    document.getElementById('quickQty').textContent='1';
    document.getElementById('quickStock').textContent=p.stock>0?'Disponible para compra · selecciona un color':'Producto agotado';
    document.getElementById('quickAddBtn').disabled=p.stock<=0;
    document.getElementById('quickAddBtn').style.opacity=p.stock<=0?'.45':'1';
    setupProductZoom();

    // Completa la galeria en segundo plano sin bloquear la ficha.
    try{
      if(window.royEnsureProductImages)p=await window.royEnsureProductImages(id,'detail')||p;
    }catch(error){console.warn('ROY galeria general:',error)}
    if(String(currentQuickId)!==String(id)||quickColor)return;
    initialImage?.closest('.quick-main-image')?.classList.remove('roy-original-loading');
    renderQuickGallery(p,'');
    renderColorSelectors(p);
    setupProductZoom();
  };

  function installSwipe(){
    const frame=document.querySelector('#quickModal .quick-main-image');
    if(!frame||frame.dataset.roySwipe)return;
    frame.dataset.roySwipe='1';let startX=0,startY=0;
    frame.addEventListener('touchstart',e=>{startX=e.touches[0].clientX;startY=e.touches[0].clientY},{passive:true});
    frame.addEventListener('touchend',e=>{
      const dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY;
      if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.25)navigateQuickImage(dx<0?1:-1);
    },{passive:true});
  }

  document.addEventListener('DOMContentLoaded',installSwipe);
  setTimeout(installSwipe,0);
})();
