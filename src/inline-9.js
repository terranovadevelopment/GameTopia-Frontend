
(function(){
 function alignSetupButtons(){
  const start=document.getElementById('applyMapSetup');
  const panel=document.getElementById('mapSetupPanel');
  if(!start||!panel)return;
  const actions=start.parentElement;
  const load=[...panel.querySelectorAll('button')].find(b=>b.textContent.trim()==='Load Saved Game');
  if(load){actions.appendChild(load);load.style.cssText='display:inline-block;margin:0;padding:8px 15px;background:#315d6c;color:white;border-radius:6px;cursor:pointer';}
  actions.style.cssText='display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px';
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(alignSetupButtons,0));else setTimeout(alignSetupButtons,0);
})();
