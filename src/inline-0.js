
/* M6.30: local file copies must never attempt to register server games. */
if(location.protocol==='file:') {
 document.addEventListener('DOMContentLoaded',()=>{
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;z-index:999999;background:#0d2031;color:#f1f7ff;display:flex;align-items:center;justify-content:center;font:17px Arial,sans-serif;padding:20px;text-align:center';
  overlay.innerHTML='<div style="max-width:580px"><h1>Open Armageddon through its server</h1><p>This copy was opened directly from a folder. Multiplayer games require the Armageddon server.</p><p>Double-click <strong>PLAY_ARMAGEDDON.bat</strong> in the extracted game folder. It will start the server and open the correct Chrome address.</p><p><a href="http://localhost:8081/" style="color:#9bd0ff">Open http://localhost:8081</a> if the server is already running.</p><p id="armLocalStatus" style="font-size:13px;color:#aac1d4">Checking whether the server is available…</p></div>';
  document.body.appendChild(overlay);
  fetch('http://localhost:8081/api/health',{signal:AbortSignal.timeout(2500)}).then(r=>r.json()).then(j=>{if(j.ok)location.replace('http://localhost:8081/');}).catch(()=>{const el=document.getElementById('armLocalStatus');if(el)el.textContent='Server not detected. Launch PLAY_ARMAGEDDON.bat first.';});
 });
}
