/* M6.208 Issue #021: visible How to Play buttons are placeholders.
   A dedicated rules web page with a Return to Game action will be developed later.
   Do not open a README popup or navigate away from the current game. */
(function(){
  'use strict';
  function init(){
    const style=document.createElement('style');
    style.textContent='#gametopia-howto-battle{white-space:nowrap!important;min-height:32px;padding:6px 12px!important;border:1px solid #e2c581!important;background:#1d476c!important;color:white!important;font-weight:700!important;cursor:pointer!important}#gametopia-howto-battle:hover,#gametopia-howto-battle:focus-visible{background:#31648c!important;outline:2px solid white;outline-offset:2px}';
    document.head.appendChild(style);
    document.querySelectorAll('[data-gametopia-howto]').forEach(btn=>{
      btn.removeAttribute('title');
      btn.setAttribute('title','How to Play page is coming later');
      btn.setAttribute('aria-label','How to Play (page coming later)');
      btn.addEventListener('click',e=>{e.preventDefault();});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
