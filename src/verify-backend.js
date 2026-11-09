/* GameTopia M6.187 website: requires matching M6.187 backend. */
(function(){
 'use strict';
 const EXPECTED='M6.187', ENDPOINT='https://gametopia-backend.onrender.com/api/health';
 const STYLE='position:fixed;inset:0;z-index:2147483647;background:rgba(5,15,29,.98);color:#fff;font:16px/1.5 system-ui,Arial,sans-serif;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box';
 let confirmed=false, busy=false, modal, message, details, retry, retryTimer=null;
 const AUTO_RETRY_MS=10000;
 function cancelAutoRetry(){if(retryTimer!==null){clearTimeout(retryTimer);retryTimer=null;}}
 function scheduleAutoRetry(){
  if(confirmed||retryTimer!==null)return;
  retryTimer=setTimeout(()=>{retryTimer=null;if(!confirmed)check(true);},AUTO_RETRY_MS);
 }
 // Freeze all page content until compatibility is established. This style is
 // inserted before other page scripts, before any game-creation controls exist.
 const freeze=document.createElement('style');
 freeze.textContent='body > :not(#gtVerifyOverlay){visibility:hidden!important}';
 document.head.appendChild(freeze);
 function render(){
  if(modal)return;
  modal=document.createElement('div');modal.id='gtVerifyOverlay';modal.style.cssText=STYLE;
  const panel=document.createElement('div');panel.style.cssText='max-width:580px;width:100%;background:#132b42;border:2px solid #a4c3df;border-radius:12px;padding:25px;box-shadow:0 16px 55px #000a';
  const heading=document.createElement('h2');heading.textContent='GameTopia — Backend Verification';heading.style.cssText='margin:0 0 16px;font-size:23px';
  message=document.createElement('p');message.setAttribute('role','alert');message.textContent='Checking GameTopia backend version…';
  details=document.createElement('pre');details.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;background:#071525;border-radius:6px;padding:12px;font:13px/1.5 monospace';
  retry=document.createElement('button');retry.type='button';retry.textContent='Retry Verification';retry.style.cssText='padding:12px 20px;border-radius:7px;border:1px solid #c9d9ef;background:#1467a7;color:white;font-weight:700;cursor:pointer';retry.onclick=()=>check(true);
  panel.append(heading,message,details,retry);modal.appendChild(panel);document.body.appendChild(modal);
 }
 async function check(showOverlay){
  if(busy)return false;
  cancelAutoRetry();
  busy=true;
  if(showOverlay){render();modal.hidden=false;modal.style.display='flex';freeze.disabled=false;message.textContent='Checking the running backend…';retry.disabled=true;}
  let actual='unavailable',commit='unavailable',mode='unknown';
  try{
   const controller=new AbortController();const abort=setTimeout(()=>controller.abort(),10000);
   let response;
   try{response=await fetch(ENDPOINT+'?verify='+encodeURIComponent(Date.now()),{cache:'no-store',mode:'cors',signal:controller.signal})}finally{clearTimeout(abort)}
   if(!response.ok)throw new Error('HTTP '+response.status);
   const info=await response.json();actual=String(info.version||'missing');commit=info.gitCommit||'not reported';mode=String(info.mode||'missing');
   if(info.ok!==true||actual!==EXPECTED||mode!=='sequential-player-ids-guest-enabled')throw new Error('Website and backend versions or modes do not match.');
   confirmed=true;cancelAutoRetry();freeze.disabled=true;if(modal){modal.hidden=true;modal.style.display='none';}
   window.GAMETOPIA_BACKEND_VERIFIED={version:actual,gitCommit:commit,verifiedAt:Date.now()};
   document.dispatchEvent(new CustomEvent('gametopia-backend-verified',{detail:window.GAMETOPIA_BACKEND_VERIFIED}));
   return true;
  }catch(e){
   confirmed=false;render();modal.hidden=false;modal.style.display='flex';freeze.disabled=false;
   message.textContent='Backend verification failed. Retrying automatically every 10 seconds. You can also select Retry Verification now.';
   details.textContent='Compatible backend required: '+EXPECTED+'\nRunning backend: '+actual+'\nBackend mode: '+mode+'\nGit commit: '+commit+'\nServer: '+ENDPOINT+'\nReason: '+e.message;
   return false;
  }finally{busy=false;if(retry)retry.disabled=false;if(!confirmed)scheduleAutoRetry();}
 }
 // Guard Ready at capture phase so another handler cannot send a Ready request
 // before a fresh backend check; re-dispatch once only after verification.
 let forwarding=false;
 document.addEventListener('click',function(e){
  if(forwarding||!e.isTrusted)return;
  const target=e.target.closest&&e.target.closest('#readyButton,#gtReadyToggle');
  if(!target)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(busy)return;
  check(true).then(ok=>{if(!ok||!target.isConnected)return;forwarding=true;try{target.click()}finally{forwarding=false;}});
 },true);
 document.addEventListener('DOMContentLoaded',()=>{render();check(true)}, {once:true});
 // Reverify whenever the tab is reentered after another deployment.
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&confirmed)check(true)});
 window.GameTopiaVerifyBackend=()=>check(true);
})();
