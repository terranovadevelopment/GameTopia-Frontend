/* GameTopia — How to Play popup, for splash and ARMAGEDDON game screens. */
(function () {
  'use strict';
  if (document.getElementById('gametopia-howto-button')) return;
  const css = `
    #gametopia-howto-button{position:fixed;top:12px;right:12px;z-index:2147483000;appearance:none;border:2px solid #e2c581;border-radius:8px;padding:10px 16px;background:#152f52;color:#fff;font:700 15px system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 12px #0009}
    #gametopia-howto-button:hover,#gametopia-howto-button:focus-visible{background:#28517d;outline:2px solid #fff;outline-offset:2px}
    #gametopia-howto-dialog{position:fixed;inset:0;z-index:2147483001;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px}
    #gametopia-howto-dialog[hidden]{display:none!important}
    #gametopia-howto-panel{width:min(760px,100%);max-height:90vh;display:flex;flex-direction:column;background:#101f34;border:2px solid #d6ba76;border-radius:12px;color:#fff;box-shadow:0 12px 45px #000c}
    #gametopia-howto-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #60728e}
    #gametopia-howto-head h2{font:700 22px system-ui,sans-serif;margin:0;color:#ffe5a3}
    #gametopia-howto-close{background:#294568;border:1px solid #b9ccde;border-radius:6px;color:white;cursor:pointer;font:600 15px system-ui,sans-serif;padding:8px 14px}
    #gametopia-howto-content{overflow:auto;overscroll-behavior:contain;padding:18px;white-space:pre-wrap;overflow-wrap:anywhere;font:15px/1.55 system-ui,sans-serif;margin:0}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  const button = document.createElement('button'); button.type = 'button'; button.id = 'gametopia-howto-button'; button.textContent = 'How to Play';
  const dialog = document.createElement('div'); dialog.id = 'gametopia-howto-dialog'; dialog.hidden = true;
  dialog.setAttribute('role', 'presentation');
  dialog.innerHTML = '<section id="gametopia-howto-panel" role="dialog" aria-modal="true" aria-labelledby="gametopia-howto-title"><header id="gametopia-howto-head"><h2 id="gametopia-howto-title">How to Play ARMAGEDDON</h2><button type="button" id="gametopia-howto-close">Close</button></header><pre id="gametopia-howto-content">Loading instructions…</pre></section>';
  document.body.append(button, dialog);
  const close = dialog.querySelector('#gametopia-howto-close');
  const content = dialog.querySelector('#gametopia-howto-content');
  let previouslyFocused = null;
  function hide() { dialog.hidden = true; if (previouslyFocused && previouslyFocused.isConnected) previouslyFocused.focus(); }
  button.addEventListener('click', async function () {
    previouslyFocused = document.activeElement;
    dialog.hidden = false;
    content.textContent = 'Loading instructions…';
    close.focus();
    try {
      const response = await fetch('README.txt', {cache:'no-cache'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      content.textContent = await response.text();
    } catch (error) {
      content.textContent = 'The new-player guide could not be loaded. Make sure README.txt is in the same folder as index.html and armageddon.html.\n\n' + error.message;
    }
  });
  close.addEventListener('click', hide);
  dialog.addEventListener('click', e => { if (e.target === dialog) hide(); });
  document.addEventListener('keydown', e => {
    if (dialog.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); hide(); }
    if (e.key === 'Tab') { e.preventDefault(); close.focus(); }
  }, true);
})();
