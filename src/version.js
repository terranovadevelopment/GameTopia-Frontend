/* Canonical build label used on every GameTopia/ARMAGEDDON screen. */
(function () {
  'use strict';
  const VERSION='M6.250';
  window.GAMETOPIA_VERSION=VERSION;
  function showVersion() {
    if (!document.body) return;
    if (document.getElementById('gametopia-build-label')) return;
    const badge=document.createElement('div');
    badge.id='gametopia-build-label';
    badge.textContent='GameTopia '+VERSION;
    badge.setAttribute('aria-label','GameTopia software version '+VERSION);
    badge.style.cssText='position:fixed;top:8px;left:10px;z-index:2147483000;box-sizing:border-box;pointer-events:none;user-select:none;padding:4px 9px;border:1px solid rgba(243,196,119,.8);border-radius:6px;background:rgba(7,19,32,.92);color:#ffe3aa;font:700 12px/1.25 Arial,sans-serif;letter-spacing:.2px;box-shadow:0 2px 6px #0008;max-width:calc(100vw - 20px)';
    document.body.appendChild(badge);
    // Visible on all pregame screens; hidden from Day 1 Planning onward.
    const stage=document.getElementById('storyStage');
    const lobby=document.getElementById('mpLobby');
    if(stage&&lobby){
      const update=()=>{badge.hidden=!!(stage.hidden&&lobby.hidden);badge.style.display=badge.hidden?'none':'block';};
      new MutationObserver(update).observe(stage,{attributes:true,attributeFilter:['hidden']});
      new MutationObserver(update).observe(lobby,{attributes:true,attributeFilter:['hidden']});
      update();
    }
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',showVersion,{once:true});
  else showVersion();
})();
