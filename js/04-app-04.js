
(function(){
 const V17={mainExisting:'',mainFile:null,galleryExisting:[],galleryFiles:[],colors:[]};
 const q=s=>document.querySelector(s);
 const esc2=v=>String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 function status(msg,type='loading'){const e=q('#v17SaveStatus');if(!e)return;e.textContent=msg;e.className='show v17-'+type}
 function mediaHost(){return q('#productModal .admin-form')}
 function ensureUI(){
  if(q('#productMediaV17'))return;
  const host=mediaHost(); if(!host)return;
  const box=document.createElement('div');box.id='productMediaV17';box.className='product-media-v17';
  box.innerHTML=`<h3>Imágenes del producto</h3><p class="media-note">Todo está reunido aquí. La imagen principal es obligatoria. Las imágenes adicionales y los colores son opcionales; puedes agregar una, cinco o más.</p>
  <div class="v17-main-upload"><img id="v17MainPreview" src="https://placehold.co/500x600/202020/888?text=Principal"><div><b>Imagen principal</b><p class="media-note">Esta será la primera imagen que verá el cliente.</p><label class="btn btn-secondary btn-sm v17-upload-btn"><i class="fa-solid fa-upload"></i> Seleccionar imagen principal<input id="v17MainFile" type="file" accept="image/*" hidden></label><input id="v17MainUrl" class="field" placeholder="O pega una URL" style="margin-top:10px"></div></div>
  <div style="margin-top:18px"><b>Imágenes adicionales</b><p class="media-note">Selecciona varias imágenes de una sola vez.</p><label class="btn btn-secondary btn-sm v17-upload-btn"><i class="fa-regular fa-images"></i> Agregar imágenes<input id="v17GalleryFiles" type="file" accept="image/*" multiple hidden></label><div id="v17GalleryGrid" class="v17-gallery-grid"></div></div>
  <div style="margin-top:20px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><b>Colores de la prenda (opcional)</b><p class="media-note">Cada color puede tener una o varias imágenes propias.</p></div><button type="button" class="btn btn-secondary btn-sm" id="v17AddColor">＋ Agregar color</button></div><div id="v17Colors"></div></div>
  <div id="v17SaveStatus"></div>`;
  const saveGroup=[...host.querySelectorAll('.form-group.full')].find(x=>x.querySelector('button[onclick="saveProduct()"]'));
  host.insertBefore(box,saveGroup||null);
  q('#v17MainFile').addEventListener('change',e=>{V17.mainFile=e.target.files[0]||null;if(V17.mainFile)q('#v17MainPreview').src=URL.createObjectURL(V17.mainFile)});
  q('#v17MainUrl').addEventListener('input',e=>{if(e.target.value.trim()){V17.mainExisting=e.target.value.trim();V17.mainFile=null;q('#v17MainPreview').src=V17.mainExisting}});
  q('#v17GalleryFiles').addEventListener('change',e=>{V17.galleryFiles.push(...e.target.files);renderGallery()});
  q('#v17AddColor').addEventListener('click',()=>{V17.colors.push({name:'',existing:[],files:[]});renderColors()});
 }
 function renderGallery(){const box=q('#v17GalleryGrid');if(!box)return;const items=[...V17.galleryExisting.map((url,i)=>({url,kind:'existing',i})),...V17.galleryFiles.map((f,i)=>({url:URL.createObjectURL(f),kind:'file',i}))];box.innerHTML=items.map(x=>`<div class="v17-image-card"><button type="button" data-kind="${x.kind}" data-i="${x.i}">✕</button><img src="${esc2(x.url)}"></div>`).join('');box.querySelectorAll('button').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(b.dataset.kind==='existing')V17.galleryExisting.splice(i,1);else V17.galleryFiles.splice(i,1);renderGallery()})}
 function renderColors(){const box=q('#v17Colors');if(!box)return;box.innerHTML=V17.colors.map((c,idx)=>`<div class="v17-color-row" data-idx="${idx}"><div class="v17-color-head"><input class="field v17-color-name" value="${esc2(c.name)}" placeholder="Ejemplo: Negro, Blanco, Azul"><label class="btn btn-secondary btn-sm">Agregar fotos<input class="v17-color-files" type="file" accept="image/*" multiple hidden></label><button type="button" class="btn btn-danger btn-sm v17-remove-color">Eliminar color</button></div><div class="v17-color-images">${[...c.existing.map((u,i)=>({u,k:'existing',i})),...c.files.map((f,i)=>({u:URL.createObjectURL(f),k:'file',i}))].map(x=>`<div class="v17-image-card"><button type="button" class="v17-remove-color-image" data-k="${x.k}" data-i="${x.i}">✕</button><img src="${esc2(x.u)}"></div>`).join('')}</div></div>`).join('');
  box.querySelectorAll('.v17-color-row').forEach(row=>{const idx=+row.dataset.idx;row.querySelector('.v17-color-name').oninput=e=>V17.colors[idx].name=e.target.value;row.querySelector('.v17-color-files').onchange=e=>{V17.colors[idx].files.push(...e.target.files);renderColors()};row.querySelector('.v17-remove-color').onclick=()=>{V17.colors.splice(idx,1);renderColors()};row.querySelectorAll('.v17-remove-color-image').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(b.dataset.k==='existing')V17.colors[idx].existing.splice(i,1);else V17.colors[idx].files.splice(i,1);renderColors()})})
 }
 function loadDraft(p){ensureUI();V17.mainExisting=p?.image||'';V17.mainFile=null;V17.galleryExisting=[...(p?.gallery||[])];V17.galleryFiles=[];const map=typeof normalizeColorImages==='function'?normalizeColorImages(p?.colorImages||{}):(p?.colorImages||{});V17.colors=Object.entries(map).map(([name,existing])=>({name,existing:[...(existing||[])],files:[]}));q('#v17MainPreview').src=V17.mainExisting||'https://placehold.co/500x600/202020/888?text=Principal';q('#v17MainUrl').value=V17.mainExisting&&!V17.mainExisting.startsWith('data:')?V17.mainExisting:'';q('#v17MainFile').value='';q('#v17GalleryFiles').value='';renderGallery();renderColors();status('', 'loading');q('#v17SaveStatus').className=''}
 const originalOpen=window.openProductForm;window.openProductForm=function(){originalOpen.apply(this,arguments);setTimeout(()=>loadDraft(null),0)};
 const originalEdit=window.editProduct;window.editProduct=function(id){originalEdit.call(this,id);setTimeout(()=>loadDraft(state.products.find(p=>p.id===id)),0)};
 function timeout(p,ms,label){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error(label+' excedió el tiempo permitido.')),ms))])}
 async function compressUploadImage(file){
  if(!file||!file.type.startsWith('image/'))return file;
  if(file.size<=700*1024)return file;
  const bitmap=await createImageBitmap(file),max=1800,ratio=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
  canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('No se pudo comprimir la imagen.')),'image/jpeg',.84));
  return new File([blob],(file.name.replace(/\.[^.]+$/,'')||'imagen')+'.jpg',{type:'image/jpeg',lastModified:Date.now()});
 }
 async function uploadToRef(storageRef,file,label){
  return await new Promise((resolve,reject)=>{
   const task=window._fb.uploadBytesResumable(storageRef,file,{contentType:file.type||'image/jpeg',customMetadata:{app:'ROY'}});
   const timer=setTimeout(()=>{task.cancel();reject(new Error(label+' no respondió. Revisa las reglas y el bucket de Storage.'));},90000);
   task.on('state_changed',snap=>{const pct=Math.round((snap.bytesTransferred/snap.totalBytes)*100);status(label+' '+pct+'%','loading')},err=>{clearTimeout(timer);reject(err)},async()=>{clearTimeout(timer);try{resolve(await window._fb.getDownloadURL(task.snapshot.ref))}catch(e){reject(e)}})
  })
 }
 async function upload(file,path,label='Subiendo imagen'){
  if(!file)return'';
  if(!window._firebaseReady||!window._firebaseAdmin||!window._storage||!window._fb)throw new Error('Firebase Storage no está disponible o la sesión no es administradora.');
  const optimized=await compressUploadImage(file);
  try{return await uploadToRef(window._fb.ref(window._storage,path),optimized,label)}
  catch(e){
   const code=e?.code||'';
   if(code==='storage/unauthorized')throw new Error('Storage rechazó la subida. Publica las reglas V18 y vuelve a iniciar sesión.');
   if(code==='storage/bucket-not-found')throw new Error('El bucket configurado no existe. Revisa storageBucket en Firebase.');
   if(code==='storage/canceled')throw new Error('La subida fue cancelada por tiempo de espera.');
   throw new Error('Storage: '+(e?.message||code||'error desconocido'));
  }
 }
 window.saveProduct=async function(){
  ensureUI();const btn=q('#productModal button[onclick="saveProduct()"]');if(btn?.disabled)return;
  const id=q('#productId').value.trim()||uid('prd'),old=state.products.find(x=>x.id===id)||{};const name=q('#pName').value.trim(),category=q('#pCategory').value.trim(),price=Number(q('#pPrice').value),stock=Number(q('#pStock').value);
  if(!adminSessionValid())return status('No se guardó: la sesión administrativa expiró.','error');if(!name||!category)return status('No se guardó: completa nombre y categoría.','error');if(!Number.isFinite(price)||price<=0)return status('No se guardó: ingresa un precio válido.','error');if(!Number.isFinite(stock)||stock<0)return status('No se guardó: el stock no puede ser negativo.','error');
  if(btn){btn.disabled=true;btn.dataset.old=btn.innerHTML;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'}
  try{
   status('Preparando imágenes...','loading');let image=V17.mainExisting||old.image||'';if(V17.mainFile)image=await upload(V17.mainFile,`roy/products/${id}/main_${Date.now()}_${V17.mainFile.name.replace(/[^a-z0-9.]/gi,'_')}`,'Imagen principal');if(!image)throw new Error('Selecciona una imagen principal.');
   const gallery=[...V17.galleryExisting];for(let i=0;i<V17.galleryFiles.length;i++){status(`Subiendo imagen adicional ${i+1} de ${V17.galleryFiles.length}...`,'loading');gallery.push(await upload(V17.galleryFiles[i],`roy/products/${id}/gallery/${Date.now()}_${i}_${V17.galleryFiles[i].name.replace(/[^a-z0-9.]/gi,'_')}`,`Imagen adicional ${i+1}`))}
   const colorImages={};for(let c=0;c<V17.colors.length;c++){const item=V17.colors[c],color=item.name.trim();if(!color)continue;const urls=[...item.existing];for(let i=0;i<item.files.length;i++){status(`Subiendo ${color}: imagen ${i+1} de ${item.files.length}...`,'loading');urls.push(await upload(item.files[i],`roy/products/${id}/colors/${slug(color)}/${Date.now()}_${i}_${item.files[i].name.replace(/[^a-z0-9.]/gi,'_')}`,`${color} ${i+1}`))}if(urls.length)colorImages[color]=urls}
   status('Guardando producto en Firestore...','loading');const colors=V17.colors.map(x=>x.name.trim()).filter(Boolean);const sizes=parseList(q('#pSizes').value);const p={...old,id,name,sku:q('#pSku').value.trim()||'ROY-'+Date.now().toString().slice(-6),category,brand:q('#pBrand').value.trim()||'ROY',price,oldPrice:Number(q('#pOldPrice').value||0),stock,tags:parseList(q('#pTags').value),colors,sizes:sizes.length?sizes:['Única'],description:q('#pDescription').value.trim(),image,gallery:[...new Set(gallery)].filter(x=>x&&x!==image),colorImages,material:q('#pMaterial')?.value.trim()||'',composition:q('#pComposition')?.value.trim()||'',fit:q('#pFit')?.value.trim()||'',rise:q('#pRise')?.value.trim()||'',gender:q('#pGender')?.value||'Unisex',model:q('#pModel')?.value.trim()||'',createdAt:old.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),updatedBy:window._firebaseUser?.uid||''};
   await timeout(putRecord('products',p,{requireFirebase:true}),20000,'Firestore');const verify=await timeout(window._fb.getDoc(window._fb.doc(window._db,'roy_products',id)),15000,'La verificación');if(!verify.exists())throw new Error('Firebase no confirmó el registro.');await reloadProductsFromFirebase();renderEverything();status(old.id?'Producto actualizado correctamente.':'Producto guardado correctamente.','ok');setTimeout(()=>closeModal('productModal'),900)
  }catch(e){console.error(e);status('NO SE GUARDÓ: '+(e.message||e),'error')}
  finally{if(btn){btn.disabled=false;btn.innerHTML=btn.dataset.old||'Guardar producto'}}
 };
 document.addEventListener('DOMContentLoaded',ensureUI);setTimeout(ensureUI,1000);
})();
