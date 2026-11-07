
document.getElementById('readyButton')?.addEventListener('click',function(){
  if(!window.ARMAGEDDON_READY_BOUND){const el=document.getElementById('routeStatus');if(el)el.textContent='Ready unavailable: game initialization failed. Check the displayed Game error and reload.';window.alert('Ready unavailable: the game did not initialize. Check Game error on the screen.');}
});
