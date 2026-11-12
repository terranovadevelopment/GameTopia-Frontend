/* M6.228 — Open the complete ARMAGEDDON guide in a separate tab.
   The game tab stays open, preserving its active battle and orders. */
(function(){'use strict';
 function ready(){
  document.querySelectorAll('[data-gametopia-howto]').forEach(button=>{
   button.title='Open complete How to Play guide';
   button.setAttribute('aria-label','Open complete How to Play guide');
   button.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    const url=new URL('how-to-play.html',location.href).href;
    const tab=window.open(url,'_blank');
    if(tab){try{tab.opener=null;}catch(_){}}
    else window.location.href=url;
   });
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
