(function(){
  'use strict';
  const friendly = 'No se pudo completar la operación. Revisa tu conexión e inténtalo nuevamente.';
  window.addEventListener('error', function(event){
    console.error('[ROY]', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', function(event){
    console.error('[ROY]', event.reason);
    const msg = String(event.reason?.message || event.reason || '');
    if (/permission-denied|unauthorized|network|offline|failed-precondition/i.test(msg) && typeof window.showToast === 'function') {
      window.showToast(friendly);
    }
  });
  window.ROY_VERSION = '2.0.0';
})();
