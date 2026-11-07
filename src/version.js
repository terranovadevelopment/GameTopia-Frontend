/* Canonical build label used on every GameTopia/ARMAGEDDON screen. */
(function () {
  'use strict';
  const VERSION='M6.180';
  window.GAMETOPIA_VERSION=VERSION;
  function showVersion() {
    if (!document.body) return;
    if (document.getElementById('gametopia-build-label')) return;
    const badge=document.createElement('div');
    badge.id='gametopia-build-label';
    badge.textContent='GameTopia '+VERSION;
    badge.setAttribute('aria-label','GameTopia software version '+VERSION);
    badge.style.cssText='position:fixed;bottom:8px;right:10px;z-index:2147483000;box-sizing:border-box;pointer-events:none;user-select:none;padding:4px 9px;border:1px solid rgba(243,196,119,.8);border-radius:6px;background:rgba(7,19,32,.92);color:#ffe3aa;font:700 12px/1.25 Arial,sans-serif;letter-spacing:.2px;box-shadow:0 2px 6px #0008;max-width:calc(100vw - 20px)';
    document.body.appendChild(badge);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',showVersion,{once:true});
  else showVersion();
})();
