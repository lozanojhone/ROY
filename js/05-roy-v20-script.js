
(function(){
 const Q=s=>document.querySelector(s), QA=s=>[...document.querySelectorAll(s)];
 const TAGS=['Nuevo','Oferta','Destacado','Más vendido','Edición limitada','Últimas unidades'];
 const CUSTOM_COLORS=JSON.parse(localStorage.getItem('roy_custom_colors')||'[]');
 const COLORS=[['Negro','#111111'],['Blanco','#f4f4f4'],['Gris','#777777'],['Azul','#2457a7'],['Celeste','#74bce8'],['Rojo','#d62f2f'],['Verde','#27824b'],['Beige','#d8c5a1'],['Marrón','#744b32'],['Rosado','#e899b5'],['Morado','#75449b'],['Amarillo','#efcf34'],['Naranja','#e97525'],...CUSTOM_COLORS.map(n=>[n,'#777777'])];
 const V={main:null,mainExisting:'',mainThumbExisting:'',mainAssetId:'',gallery:[],colors:{},tags:[]};
 function e(v){return String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
 function st(msg,type='loading'){const x=Q('#v20Status');if(!x)return;x.textContent=msg;x.className='show '+type}
 function nextProductId(){let max=0;(state.products||[]).forEach(p=>{const m=String(p.sku||p.id||'').match(/(\d{1,})$/);if(m)max=Math.max(max,+m[1])});return 'ROY-'+String(max+1).padStart(6,'0')}
 function hideOld(){['pSku','pTags','pColors'].forEach(id=>Q('#'+id)?.closest('.form-group')?.classList.add('hidden'));const p=Q('#pPrice')?.closest('.form-group');if(p)p.querySelector('label').textContent='Precio real o precio de venta';const op=Q('#pOldPrice')?.closest('.form-group');if(op)op.querySelector('label').textContent='Precio anterior (opcional)'}
 function ensure(){if(Q('#royV20'))return;hideOld();const form=Q('#productModal .admin-form');if(!form)return;
  const box=document.createElement('div');box.id='royV20';box.className='v20-box';box.innerHTML=`
  <h3>Registro simple del producto</h3><p class="v20-help">El código se crea automáticamente. Elige etiquetas y colores tocando las opciones. Las fotografías se comprimen y guardan directamente en Firestore, sin Firebase Storage.</p>
  <div class="admin-form" style="margin-bottom:14px"><div class="form-group"><label>ID automático del producto</label><input id="v20Sku" class="field v20-id" readonly></div><div class="form-group"><label>Etiquetas predefinidas</label><div id="v20Tags" class="v20-chipset"></div></div></div>
  <div class="v20-main"><img id="v20MainPreview" src="https://placehold.co/400x500/202020/888?text=Principal"><div><b>Imagen principal</b><p class="v20-help">Obligatoria. Se optimiza automáticamente para el plan gratuito.</p><label class="btn btn-secondary btn-sm">Seleccionar imagen<input id="v20Main" type="file" accept="image/*" hidden></label></div></div>
  <div style="margin-top:18px"><b>Imágenes adicionales</b><p class="v20-help">Opcionales. Puedes seleccionar varias de una sola vez.</p><label class="btn btn-secondary btn-sm">＋ Agregar imágenes<input id="v20Gallery" type="file" accept="image/*" multiple hidden></label><div id="v20GalleryGrid" class="v20-grid"></div></div>
  <div style="margin-top:20px"><b>Colores predefinidos (opcionales)</b><p class="v20-help">Selecciona uno o varios. Después podrás agregar fotografías propias para cada color.</p><div id="v20Colors" class="v20-chipset"></div><div class="v21-custom-row"><input id="v20CustomColor" class="field" placeholder="Agregar color personalizado"><button type="button" class="btn btn-secondary btn-sm" id="v20AddCustomColor">Agregar</button></div><div id="v20ColorBlocks"></div></div>
  <div id="v20Status"></div>`;
  const save=[...form.querySelectorAll('.form-group.full')].find(x=>x.querySelector('button[onclick="saveProduct()"]'));form.insertBefore(box,save||null);
  Q('#v20Main').onchange=ev=>{V.main=ev.target.files?.[0]||null;if(V.main)Q('#v20MainPreview').src=URL.createObjectURL(V.main)};
  Q('#v20Gallery').onchange=ev=>{[...ev.target.files].forEach(f=>V.gallery.push({file:f,url:URL.createObjectURL(f),assetId:''}));drawGallery()};
  drawTags();drawColors();
  Q('#v20AddCustomColor').onclick=()=>{const n=Q('#v20CustomColor').value.trim();if(!n)return;if(!COLORS.some(x=>x[0].toLowerCase()===n.toLowerCase())){COLORS.push([n,'#777777']);CUSTOM_COLORS.push(n);localStorage.setItem('roy_custom_colors',JSON.stringify(CUSTOM_COLORS))}V.colors[n]=V.colors[n]||[];Q('#v20CustomColor').value='';drawColors()};
 }
 function drawTags(){const b=Q('#v20Tags');if(!b)return;b.innerHTML=TAGS.map(t=>`<button type="button" class="v20-chip ${V.tags.includes(t)?'active':''}" data-t="${e(t)}">${e(t)}</button>`).join('');b.querySelectorAll('button').forEach(x=>x.onclick=()=>{const t=x.dataset.t;V.tags=V.tags.includes(t)?V.tags.filter(z=>z!==t):[...V.tags,t];drawTags()})}
 function drawColors(){const b=Q('#v20Colors');if(!b)return;b.innerHTML=COLORS.map(([n,h])=>`<button type="button" class="v20-chip v20-color-chip ${V.colors[n]?'active':''}" data-c="${e(n)}"><span class="v20-dot" style="background:${h}"></span>${e(n)}</button>`).join('');b.querySelectorAll('button').forEach(x=>x.onclick=()=>{const n=x.dataset.c;if(V.colors[n])delete V.colors[n];else V.colors[n]=[];drawColors();drawColorBlocks()});drawColorBlocks()}
 function drawGallery(){const b=Q('#v20GalleryGrid');if(!b)return;b.innerHTML=V.gallery.map((x,i)=>`<div class="v20-photo"><button type="button" data-i="${i}">✕</button><img src="${e(x.url)}"></div>`).join('');b.querySelectorAll('button').forEach(x=>x.onclick=()=>{V.gallery.splice(+x.dataset.i,1);drawGallery()})}
 function drawColorBlocks(){const b=Q('#v20ColorBlocks');if(!b)return;b.innerHTML=Object.entries(V.colors).map(([n,arr])=>`<div class="v20-color-block"><div class="v20-color-top"><b>${e(n)}</b><label class="btn btn-secondary btn-sm">Agregar fotos<input type="file" accept="image/*" multiple hidden data-color="${e(n)}"></label></div><div class="v20-grid">${arr.map((x,i)=>`<div class="v20-photo"><button type="button" data-color="${e(n)}" data-i="${i}">✕</button><img src="${e(x.url)}"></div>`).join('')}</div></div>`).join('');b.querySelectorAll('input[type=file]').forEach(inp=>inp.onchange=ev=>{const n=inp.dataset.color;[...ev.target.files].forEach(f=>V.colors[n].push({file:f,url:URL.createObjectURL(f),assetId:''}));drawColorBlocks()});b.querySelectorAll('.v20-photo button').forEach(x=>x.onclick=()=>{V.colors[x.dataset.color].splice(+x.dataset.i,1);drawColorBlocks()})}
 async function canvasData(canvas,quality,target){
  let q=quality,data='';
  for(let i=0;i<7;i++){data=canvas.toDataURL('image/jpeg',q);if(data.length<=target)break;q=Math.max(.38,q-.08)}
  return data;
 }
 async function compress(file){
  if(!file?.type?.startsWith('image/'))throw new Error('Selecciona un archivo de imagen válido.');
  const bmp=await createImageBitmap(file);
  const make=async(max,quality,target)=>{const scale=Math.min(1,max/Math.max(bmp.width,bmp.height)),w=Math.max(1,Math.round(bmp.width*scale)),h=Math.max(1,Math.round(bmp.height*scale));const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(bmp,0,0,w,h);return canvasData(c,quality,target)};
  const data=await make(1200,.72,360000);
  const thumbData=await make(360,.68,70000);
  bmp.close?.();
  if(data.length>=760000)throw new Error('La imagen sigue siendo demasiado pesada. Usa una fotografía de menor resolución.');
  return {data,thumbData};
 }
 const assetCache=new Map();
 async function putAsset(productId,kind,payload,color='',index=0,oldId=''){
  const id=oldId||('img_'+productId+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,7));
  const row={id,productId,kind,color,index,data:payload.data,thumbData:payload.thumbData||payload.data,updatedAt:new Date().toISOString(),version:2};
  await window._fb.setDoc(window._fb.doc(window._db,'roy_product_images',id),row);
  assetCache.set(id,row);
  return id;
 }
 async function getAsset(id){
  if(!id)return null;
  if(assetCache.has(id))return assetCache.get(id);
  if(!window._firebaseReady||!window._db)return null;
  const snap=await window._fb.getDoc(window._fb.doc(window._db,'roy_product_images',id));
  const row=snap.exists()?snap.data():null;
  if(row)assetCache.set(id,row);
  return row;
 }
 async function mapLimit(items,limit,worker){
  const result=new Array(items.length);let cursor=0;
  const runners=Array.from({length:Math.min(limit,items.length)},async()=>{while(cursor<items.length){const i=cursor++;try{result[i]=await worker(items[i],i)}catch(err){console.warn('ROY imagen:',err?.message||err)}}});
  await Promise.all(runners);return result;
 }
 const mainLoadJobs=new Map();
 function validImage(value){return typeof value==='string'&&value.length>20&&(value.startsWith('data:image/')||value.startsWith('http://')||value.startsWith('https://')||value.startsWith('blob:'))}
 function applyMainImage(p,src){
  if(!p||!validImage(src))return false;
  p.imageThumb=src;
  if(!validImage(p.image))p.image=src;
  document.querySelectorAll('#img-'+CSS.escape(String(p.id))+', img[data-product-image="'+CSS.escape(String(p.id))+'"], tr img[data-product-id="'+CSS.escape(String(p.id))+'"]').forEach(img=>{if(img.src!==src)img.src=src;img.classList.remove('roy-loading-image')});
  return true;
 }
 async function loadMainWithRetry(p,attempt=0){
  if(!p?.imageAssetId)return false;
  if(validImage(p.imageThumb)||validImage(p.image))return applyMainImage(p,p.imageThumb||p.image);
  if(mainLoadJobs.has(p.id))return mainLoadJobs.get(p.id);
  const job=(async()=>{
   const delays=[0,250,600,1200,2200,4000];
   for(let i=attempt;i<delays.length;i++){
    if(delays[i])await new Promise(r=>setTimeout(r,delays[i]));
    if(!window._firebaseReady||!window._db||!window._fb?.getDoc)continue;
    try{
     const row=await getAsset(p.imageAssetId);
     const src=row?.thumbData||row?.data||'';
     if(applyMainImage(p,src))return true;
    }catch(err){console.warn('ROY: reintento de imagen principal',p.id,err?.message||err)}
   }
   return false;
  })().finally(()=>mainLoadJobs.delete(p.id));
  mainLoadJobs.set(p.id,job);return job;
 }
 async function hydrateMain(products=state.products){
  const list=(products||[]).filter(p=>p.imageAssetId);
  if(!list.length)return;
  await mapLimit(list,3,p=>loadMainWithRetry(p));
  try{saveLocal('products',state.products)}catch(_){ }
  if(typeof renderStore==='function')renderStore();
  if(typeof renderFeatured==='function')renderFeatured();
  if(typeof renderSale==='function')renderSale();
  if(typeof renderCart==='function')renderCart();
 }
 async function ensureProductImages(productId,scope='detail',color=''){
  const p=state.products.find(x=>x.id===productId);if(!p)return null;
  if(p.imageAssetId&&!p._mainFull){const row=await getAsset(p.imageAssetId);if(row){p.image=row.data||row.thumbData||p.image;p.imageThumb=row.thumbData||row.data||p.imageThumb;p._mainFull=true;}}
  if(scope==='detail'&&!p._galleryFull){const ids=Array.isArray(p.galleryAssetIds)?p.galleryAssetIds:[];const rows=await mapLimit(ids,4,getAsset);p.gallery=rows.map(r=>r?.data||r?.thumbData||'').filter(Boolean);p._galleryFull=true;}
  if(scope==='color'&&color){p.colorImages=p.colorImages||{};p._colorsFull=p._colorsFull||{};if(!p._colorsFull[color]){const ids=p.colorImageAssetIds?.[color]||[];const rows=await mapLimit(ids,4,getAsset);p.colorImages[color]=rows.map(r=>r?.data||r?.thumbData||'').filter(Boolean);p._colorsFull[color]=true;}}
  return p;
 }
 async function hydrate(){return hydrateMain(state.products)}
 window.royHydrateMainImages=hydrateMain;
 window.royEnsureProductImages=ensureProductImages;
 function load(p){ensure();V.main=null;V.mainExisting=p?.image||p?.imageThumb||'';V.mainThumbExisting=p?.imageThumb||p?.image||'';V.mainAssetId=p?.imageAssetId||'';V.gallery=(p?.gallery||[]).map((url,i)=>({url,assetId:p?.galleryAssetIds?.[i]||'',file:null}));V.tags=[...(p?.tags||[])];V.colors={};const ci=p?.colorImages||{};Object.entries(ci).forEach(([n,urls])=>V.colors[n]=(urls||[]).map((url,i)=>({url,assetId:p?.colorImageAssetIds?.[n]?.[i]||'',file:null})));Q('#v20Sku').value=p?.sku||nextProductId();Q('#v20MainPreview').src=V.mainExisting||'https://placehold.co/400x500/202020/888?text=Principal';Q('#v20Main').value='';Q('#v20Gallery').value='';drawTags();drawColors();drawGallery();st('', 'loading');Q('#v20Status').className=''}
 const oldOpen=window.openProductForm;window.openProductForm=function(){oldOpen.apply(this,arguments);setTimeout(()=>load(null),30)};
 const oldEdit=window.editProduct;window.editProduct=function(id){oldEdit.call(this,id);setTimeout(()=>load(state.products.find(p=>p.id===id)),30)};
 window.saveProduct=async function(){ensure();const btn=Q('#productModal button[onclick="saveProduct()"]');if(btn?.disabled)return;const id=Q('#productId').value.trim()||uid('prd'),old=state.products.find(x=>x.id===id)||{},name=Q('#pName').value.trim(),category=Q('#pCategory').value.trim(),price=Number(Q('#pPrice').value),oldPrice=Number(Q('#pOldPrice').value||0),stock=Number(Q('#pStock').value);
  if(!adminSessionValid())return st('NO SE GUARDÓ: vuelve a iniciar sesión como administrador.','error');if(!name||!category)return st('NO SE GUARDÓ: completa nombre y categoría.','error');if(!Number.isFinite(price)||price<=0)return st('NO SE GUARDÓ: el precio real debe ser mayor que cero.','error');if(oldPrice&&oldPrice<=price)return st('NO SE GUARDÓ: el precio anterior debe ser mayor que el precio real.','error');if(!Number.isFinite(stock)||stock<0)return st('NO SE GUARDÓ: revisa el stock.','error');if(!V.main&&!V.mainExisting)return st('NO SE GUARDÓ: selecciona la imagen principal.','error');
  btn.disabled=true;const prev=btn.innerHTML;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Guardando';try{
   st('Comprimiendo y guardando imagen principal...','loading');let imageAssetId=V.mainAssetId,mainThumb=V.mainThumbExisting||V.mainExisting||old.imageThumb||old.image||'';if(V.main){const payload=await compress(V.main);imageAssetId=await putAsset(id,'main',payload,'',0,imageAssetId);mainThumb=payload.thumbData||payload.data||mainThumb}
   st('Procesando imágenes adicionales en paralelo...','loading');const galleryAssetIds=(await Promise.all(V.gallery.map(async(x,i)=>{let aid=x.assetId;if(x.file)aid=await putAsset(id,'gallery',await compress(x.file),'',i,aid);return aid||''}))).filter(Boolean);
   st('Procesando imágenes por color en paralelo...','loading');const colorImageAssetIds={};await Promise.all(Object.entries(V.colors).map(async([color,arr])=>{colorImageAssetIds[color]=(await Promise.all(arr.map(async(x,i)=>{let aid=x.assetId;if(x.file)aid=await putAsset(id,'color',await compress(x.file),color,i,aid);return aid||''}))).filter(Boolean)}));
   const sku=old.sku||Q('#v20Sku').value||nextProductId(),sizes=parseList(Q('#pSizes').value);const p={...old,id,sku,name,category,brand:Q('#pBrand').value.trim()||'ROY',price,oldPrice,stock,tags:V.tags,colors:Object.keys(V.colors),sizes:sizes.length?sizes:['Única'],description:Q('#pDescription').value.trim(),imageAssetId,galleryAssetIds,colorImageAssetIds,image:mainThumb,imageThumb:mainThumb,gallery:[],colorImages:{},material:Q('#pMaterial')?.value.trim()||'',composition:Q('#pComposition')?.value.trim()||'',fit:Q('#pFit')?.value.trim()||'',rise:Q('#pRise')?.value.trim()||'',gender:Q('#pGender')?.value||'Unisex',model:Q('#pModel')?.value.trim()||'',createdAt:old.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
   st('Guardando datos del producto...','loading');await window._fb.setDoc(window._fb.doc(window._db,'roy_products',id),p,{merge:true});const ver=await window._fb.getDoc(window._fb.doc(window._db,'roy_products',id));if(!ver.exists())throw new Error('Firestore no confirmó el producto.');await reloadProductsFromFirebase();await hydrate();st(old.id?'PRODUCTO ACTUALIZADO CORRECTAMENTE.':'PRODUCTO GUARDADO CORRECTAMENTE.','ok');setTimeout(()=>closeModal('productModal'),1100)
  }catch(err){console.error(err);st('NO SE GUARDÓ: '+(err.message||err),'error')}finally{btn.disabled=false;btn.innerHTML=prev}
 };
 // Botón Atrás: cierra modal o vuelve a la sección anterior sin salir del sitio.
 const nativeShow=window.showPage;let internalNav=false;window.showPage=function(name,opts={}){const current=QA('.page.active')[0]?.id?.replace('page-','')||'inicio';nativeShow.call(this,name);if(!opts.fromPop&&current!==name){history.pushState({royPage:name},'',location.href.split('#')[0]+'#'+name)}};
 const nativeOpenModal=window.openModal;window.openModal=function(id){nativeOpenModal.call(this,id);if(!internalNav)history.pushState({royModal:id,royPage:QA('.page.active')[0]?.id?.replace('page-','')||'inicio'},'',location.href)};
 window.addEventListener('popstate',ev=>{internalNav=true;const open=QA('.modal.show,.modal.active').pop();if(open){closeModal(open.id);internalNav=false;return}const page=ev.state?.royPage||location.hash.replace('#','')||'inicio';nativeShow.call(window,Q('#page-'+page)?page:'inicio');internalNav=false});
 document.addEventListener('DOMContentLoaded',()=>{ensure();if(!history.state)history.replaceState({royPage:QA('.page.active')[0]?.id?.replace('page-','')||'inicio'},'',location.href);setTimeout(hydrate,350)});setTimeout(()=>{ensure();hydrate()},120);
 window.addEventListener('roy-realtime-ready',()=>setTimeout(hydrate,80));
 window.addEventListener('firebase-ready',()=>setTimeout(hydrate,120));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(hydrate,80)});
 window.royHydrateProductImages=hydrate;
})();
