(function(){
'use strict';
let deferredPrompt=null;
let installed=false;
const DISMISS_KEY='roy_pwa_install_dismissed_at';
const DAY=86400000;
function q(id){return document.getElementById(id)}
function isStandalone(){return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true||document.referrer.startsWith('android-app://')}
function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent)}
function isAndroid(){return /android/i.test(navigator.userAgent)}
function isSecure(){return location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'}
function setStatus(text,type){const el=q('royInstallStatus');if(!el)return;el.textContent=text;el.className='roy-install-status'+(type?' '+type:'')}
function updateUI(){
 installed=isStandalone();
 document.querySelectorAll('.roy-install-entry').forEach(el=>{el.hidden=installed;el.setAttribute('aria-hidden',installed?'true':'false')});
 document.querySelectorAll('.roy-install-icon-btn').forEach(el=>el.classList.toggle('is-installed',installed));
 if(installed){hideBanner();setStatus('ROY ya esta instalada en este dispositivo.','success')}
}
function openModal(){
 const modal=q('royInstallModal'); if(!modal)return;
 modal.classList.add('open'); modal.classList.remove('hidden'); document.body.classList.add('no-scroll');
 renderInstructions();
}
function closeModal(){const modal=q('royInstallModal');if(!modal)return;modal.classList.remove('open');document.body.classList.remove('no-scroll')}
function renderInstructions(){
 const steps=q('royInstallSteps'); const action=q('royInstallAction'); if(!steps||!action)return;
 if(installed){steps.innerHTML='';action.hidden=true;setStatus('ROY ya esta instalada y lista para usar.','success');return}
 action.hidden=false;
 if(!isSecure()){
  steps.innerHTML='<div class="roy-install-step"><strong>!</strong><div><b>Publica el sitio con HTTPS</b><span>La instalacion solo funciona desde Firebase Hosting o un dominio seguro.</span></div></div>';
  action.hidden=true;setStatus('Abre la direccion publicada de ROY, no un archivo local.','warning');return;
 }
 if(isIOS()){
  steps.innerHTML='<div class="roy-install-step"><strong>1</strong><div><b>Abre ROY en Safari</b><span>En iPhone o iPad usa Safari para instalarla.</span></div></div><div class="roy-install-step"><strong>2</strong><div><b>Toca Compartir</b><span>Es el icono del cuadrado con una flecha hacia arriba.</span></div></div><div class="roy-install-step"><strong>3</strong><div><b>Selecciona “Agregar a inicio”</b><span>Luego pulsa Agregar. El logo ROY aparecera en tu pantalla.</span></div></div>';
  action.textContent='ENTENDIDO';action.onclick=closeModal;setStatus('Apple no permite abrir automaticamente la ventana de instalacion. Estos tres pasos son los oficiales.');return;
 }
 if(deferredPrompt){
  steps.innerHTML='<div class="roy-install-step"><strong>1</strong><div><b>Pulsa “Instalar ahora”</b><span>Se abrira la confirmacion segura del navegador.</span></div></div><div class="roy-install-step"><strong>2</strong><div><b>Confirma la instalacion</b><span>ROY se agregara como aplicacion sin descargar un APK.</span></div></div>';
  action.textContent='INSTALAR AHORA';action.onclick=promptInstall;setStatus('Instalacion disponible en este dispositivo.','success');return;
 }
 const browser=isAndroid()?'Chrome':'Chrome, Edge o Safari';
 steps.innerHTML='<div class="roy-install-step"><strong>1</strong><div><b>Abre el menu del navegador</b><span>Usa '+browser+' y toca el menu de tres puntos.</span></div></div><div class="roy-install-step"><strong>2</strong><div><b>Elige “Instalar aplicacion”</b><span>Tambien puede aparecer como “Agregar a pantalla principal”.</span></div></div>';
 action.textContent='VOLVER A INTENTAR';action.onclick=function(){location.reload()};setStatus('El navegador aun no habilito la instalacion automatica. Puede tardar unos segundos o requerir una segunda visita.');
}
async function promptInstall(){
 if(installed){updateUI();return}
 if(!deferredPrompt){openModal();return}
 try{
  deferredPrompt.prompt();
  const choice=await deferredPrompt.userChoice;
  if(choice&&choice.outcome==='accepted')setStatus('Instalando ROY...','success');
  else setStatus('Instalacion cancelada. Puedes intentarlo nuevamente cuando quieras.','warning');
 }catch(err){console.warn('ROY PWA install:',err);setStatus('No se pudo abrir la instalacion. Usa el menu del navegador.','warning')}
 deferredPrompt=null;
}
function showBanner(force){
 if(installed)return;
 const last=Number(localStorage.getItem(DISMISS_KEY)||0);
 if(!force&&Date.now()-last<7*DAY)return;
 const banner=q('royPwaBanner');if(banner)setTimeout(()=>banner.classList.add('show'),force?0:1400)
}
function hideBanner(remember){const banner=q('royPwaBanner');if(banner)banner.classList.remove('show');if(remember)localStorage.setItem(DISMISS_KEY,String(Date.now()))}
window.openRoyInstall=openModal;
window.closeRoyInstall=closeModal;
window.installRoyApp=promptInstall;
window.dismissRoyInstall=function(){hideBanner(true)};
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredPrompt=e;updateUI();showBanner(false)});
window.addEventListener('appinstalled',function(){installed=true;deferredPrompt=null;updateUI();setStatus('ROY se instalo correctamente. Ya puedes abrirla desde tu pantalla de inicio.','success')});
window.addEventListener('DOMContentLoaded',function(){updateUI();if(!installed){showBanner(false)};const modal=q('royInstallModal');if(modal)modal.addEventListener('click',e=>{if(e.target===modal)closeModal()})});
window.addEventListener('pageshow',updateUI);
})();
