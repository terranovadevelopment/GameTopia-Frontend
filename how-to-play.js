/* GameTopia M6.198 UI refresh — shared How to Play dialog. */
(function () {
  'use strict';
  function init() {
    if (document.getElementById('gametopia-howto-dialog')) return;
    const style = document.createElement('style');
    style.textContent = `
      #gametopia-howto-dialog{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}
      #gametopia-howto-dialog[hidden]{display:none!important}
      #gametopia-howto-panel{width:min(780px,100%);max-height:90vh;min-height:0;display:flex;flex-direction:column;background:#101f34;border:2px solid #d6ba76;border-radius:12px;color:#fff;box-shadow:0 12px 45px #000c;font-family:Arial,sans-serif;overflow:hidden}
      #gametopia-howto-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #60728e}
      #gametopia-howto-head h2{font:bold 22px Arial,sans-serif;margin:0;color:#ffe5a3}
      #gametopia-howto-close{background:#294568;border:1px solid #b9ccde;border-radius:6px;color:white;cursor:pointer;font:bold 15px Arial,sans-serif;padding:8px 14px}
      #gametopia-howto-content{display:block;flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:18px;white-space:pre-wrap;overflow-wrap:anywhere;font:15px/1.55 Arial,sans-serif;margin:0;color:#eff5fa}
      #gametopia-howto-battle{white-space:nowrap!important;min-height:32px;padding:6px 12px!important;border:1px solid #e2c581!important;background:#1d476c!important;color:white!important;font-weight:700!important;cursor:pointer!important}
      #gametopia-howto-battle:hover,#gametopia-howto-battle:focus-visible{background:#31648c!important;outline:2px solid white;outline-offset:2px}
    `;
    document.head.appendChild(style);
    const overlay = document.createElement('div');
    overlay.id='gametopia-howto-dialog';overlay.hidden=true;
    overlay.innerHTML='<section id="gametopia-howto-panel" role="dialog" aria-modal="true" aria-labelledby="gametopia-howto-title"><header id="gametopia-howto-head"><h2 id="gametopia-howto-title">How to Play ARMAGEDDON</h2><button id="gametopia-howto-close" type="button">Close</button></header><pre id="gametopia-howto-content" tabindex="0">Loading instructions…</pre></section>';
    document.body.appendChild(overlay);
    const closeButton=overlay.querySelector('#gametopia-howto-close');
    const content=overlay.querySelector('#gametopia-howto-content');
    let previousFocus=null;
    let requestCount=0;
    function close(){requestCount++;overlay.hidden=true;if(previousFocus&&previousFocus.isConnected)previousFocus.focus();}
    async function open(){
      previousFocus=document.activeElement;
      overlay.hidden=false;
      content.textContent='Loading instructions…';
      closeButton.focus();
      const thisRequest=++requestCount;
      try{
        const response=await fetch(new URL('README.txt',document.baseURI),{cache:'no-store'});
        if(!response.ok)throw new Error('HTTP '+response.status);
        const guide=await response.text();
        if(thisRequest===requestCount)content.textContent=guide;
      }catch(e){
        if(thisRequest===requestCount)content.textContent='Could not load README.txt. Verify the file is published beside index.html and armageddon.html.\n\n'+e.message;
      }
    }
    document.querySelectorAll('[data-gametopia-howto]').forEach(button=>button.addEventListener('click',open));
    closeButton.addEventListener('click',close);
    overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
    document.addEventListener('keydown',event=>{
      if(overlay.hidden)return;
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}
      if(event.key==='Tab'){
        // Keep keyboard focus inside the instructions popup.
        const focusables=[closeButton,content];
        const index=focusables.indexOf(document.activeElement);
        if(event.shiftKey&&index<=0){event.preventDefault();content.focus();}
        else if(!event.shiftKey&&index===focusables.length-1){event.preventDefault();closeButton.focus();}
      }
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
