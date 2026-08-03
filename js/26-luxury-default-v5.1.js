/* ROY Luxury 5.1: migración visual segura sin modificar módulos funcionales. */
(function(){
 'use strict';
 const GOLD='#D4AF37',WHITE='#ffffff',BLACK='#080808',LOGO='assets/logo-roy-dorado-blanco.png';
 function isLegacyGreen(v){
  v=String(v||'').trim(); if(/green|verde|lime/i.test(v))return true;
  const m=v.match(/^#([0-9a-f]{6})$/i); if(!m)return false;
  const n=parseInt(m[1],16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  return g>r*1.18&&g>b*1.12&&g>95;
 }
 function enforce(){
  const root=document.documentElement;
  root.style.setProperty('--orange',GOLD);root.style.setProperty('--green',GOLD);
  root.style.setProperty('--bg',BLACK);root.style.setProperty('--white',WHITE);
  if(window.state&&state.settings){
   const s=state.settings;
   if(Number(s.brandVersion||0)<51||isLegacyGreen(s.primaryColor)){
    s.primaryColor=GOLD;s.secondaryColor=WHITE;s.backgroundColor=BLACK;s.textColor=WHITE;
    if(!s.logo||/verde-blanco|green|verde/i.test(String(s.logo)))s.logo=LOGO;
    s.brandVersion=51;
    try{localStorage.setItem('roy_brand_cache',JSON.stringify({storeName:s.storeName||'ROY',logo:s.logo,primaryColor:GOLD,secondaryColor:WHITE,backgroundColor:BLACK,textColor:WHITE,brandVersion:51}));}catch(e){}
   }
  }
  document.querySelectorAll('img[src*="logo-roy-verde-blanco"]').forEach(img=>img.src=LOGO+'?v=5.1.0');
  document.querySelectorAll('[style*="#95ff00"],[style*="#a8ff00"],[style*="#8cff00"]').forEach(el=>{
   el.style.cssText=el.style.cssText.replace(/#(?:95ff00|a8ff00|8cff00)/ig,GOLD);
  });
 }
 window.addEventListener('DOMContentLoaded',()=>{enforce();requestAnimationFrame(()=>document.body.classList.remove('roy-brand-loading'));});
 window.addEventListener('firebase-ready',()=>setTimeout(enforce,100));
 setTimeout(enforce,0);setTimeout(enforce,500);setTimeout(enforce,1600);
})();