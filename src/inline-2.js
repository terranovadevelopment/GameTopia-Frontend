
window.addEventListener('error',function(e){const el=document.getElementById('routeStatus');if(el)el.textContent='Game error: '+e.message;console.error('ARMAGEDDON initialization:',e.message);});
window.addEventListener('unhandledrejection',function(e){const el=document.getElementById('routeStatus');if(el)el.textContent='Game error: '+String(e.reason);});
