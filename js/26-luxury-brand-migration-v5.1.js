(() => {
  'use strict';
  const GOLD='#D4AF37', WHITE='#FFFFFF', BLACK='#080808', LOGO='assets/logo-roy-dorado-blanco.png';
  const legacyColors=new Set(['#a8ff00','#8cff00','#84ff00','#95ff00','#9cff00','#72d900','#8ee600','#b7ff28','#91ff00','#93e600']);
  function migrateObject(obj){
    if(!obj||typeof obj!=='object')return false;
    let changed=false;
    const p=String(obj.primaryColor||'').toLowerCase();
    if(!p||legacyColors.has(p)){obj.primaryColor=GOLD;changed=true;}
    if(!obj.secondaryColor){obj.secondaryColor=WHITE;changed=true;}
    if(!obj.backgroundColor){obj.backgroundColor=BLACK;changed=true;}
    if(!obj.textColor){obj.textColor=WHITE;changed=true;}
    if(!obj.logo||String(obj.logo).includes('logo-roy-verde-blanco')){obj.logo=LOGO;changed=true;}
    return changed;
  }
  function migrate(){
    try{
      if(window.state?.settings && migrateObject(window.state.settings)){
        localStorage.setItem('roy_settings',JSON.stringify(window.state.settings));
      }
      ['roy_settings','settings'].forEach(key=>{
        const raw=localStorage.getItem(key);if(!raw)return;
        const data=JSON.parse(raw);if(migrateObject(data))localStorage.setItem(key,JSON.stringify(data));
      });
      document.documentElement.style.setProperty('--orange',GOLD);
      document.documentElement.style.setProperty('--green',GOLD);
      document.documentElement.style.setProperty('--brand-primary',GOLD);
      document.querySelectorAll('img[src*="logo-roy-verde-blanco"]').forEach(img=>img.src=LOGO);
      if(typeof window.applySettings==='function')window.applySettings();
    }catch(e){console.warn('Migración visual ROY Luxury:',e);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(migrate,50),{once:true});else setTimeout(migrate,50);
  window.addEventListener('firebase-ready',()=>setTimeout(migrate,150));
})();
