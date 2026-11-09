
document.addEventListener('DOMContentLoaded',function(){
 const header=document.querySelector('.topbar'),phase=document.getElementById('phaseLabel');
 if(!header)return;
 const actions=document.createElement('div');actions.id='headerActions';header.insertBefore(actions,phase);
 // Relocate the live RP counters to the top header; retain original IDs so city.js updates work.
 const rpHeader=document.getElementById('headerRp');
 for(const id of ['blueRpGroup','redRpGroup']){const node=document.getElementById(id);if(node&&rpHeader)rpHeader.appendChild(node);}

 // Put the support link after every other toolbar item, at the far right.
 const coffee=header.querySelector('.coffee-support');
 if(coffee)header.appendChild(coffee);
 for(const id of ['gameClock','tiLabel','replayTurnButton','saveGameButton','gameSpeedWrap','readyButton','dayReportButton','mapSetupToggle']){
  const button=document.getElementById(id);if(button)actions.appendChild(button);
 }
 // Overlay menu uses the existing overlay toggle buttons so keyboard shortcuts
 // and all current overlay behavior remain authoritative.
 const overlayMenu=document.createElement('div');
 overlayMenu.id='overlaysMenu';
 overlayMenu.className='overlays-menu';
 const overlayTrigger=document.createElement('button');
 overlayTrigger.id='overlaysDropdown';
 overlayTrigger.className='text-button';
 overlayTrigger.type='button';
 overlayTrigger.setAttribute('aria-haspopup','true');
 overlayTrigger.setAttribute('aria-expanded','false');
 overlayTrigger.textContent='Options ▾';
 const overlayList=document.createElement('div');
 overlayList.className='overlays-list';
 overlayList.hidden=true;
 const entries=[
  ['unitSymbolsToggle','NATO / Silhouettes',''],
  ['replacementToggle','Replacements','R'],
  ['endPositionsToggle','End Positions','E'],
  ['zocToggle','Zones of Control','Z'],
  ['citiesOverlayToggle','Cities','C'],
  ['supplyOverlayToggle','Supply','S'],
  ['hexControlToggle','Hex Control','H'],
  ['mapControlsToggle','Map Controls','M'],
  ['soundToggle','Sound Effects','V'],
  ['battleMusicToggle','Music','U']
 ];
 const updateLabels=()=>{
  for(const [id,label,key] of entries){
   const source=document.getElementById(id);
   const item=overlayList.querySelector('[data-overlay-id="'+id+'"]');
   if(!source||!item)continue;
   const pressed=source.getAttribute('aria-pressed')==='true';
   if(id==='battleMusicToggle'){const m=window.ARMAGEDDON_MARCH;const on=!!m?.battleEnabled;item.textContent='Music: '+(on?'On':'Off')+' (U)';item.setAttribute('aria-checked',String(on));continue;}
   if(id==='unitSymbolsToggle'){item.textContent='Unit symbols: '+(pressed?'Silhouettes':'NATO');item.setAttribute('aria-checked',String(pressed));continue;}
   if(id==='soundToggle'){const on=!!window.ARMAGEDDON_SOUND?.enabled;item.textContent='Sound Effects: '+(on?'On':'Off')+' (V)';item.setAttribute('aria-checked',String(on));continue;}
   const visible=id==='mapControlsToggle'?!document.getElementById('mapControlsOverlay')?.hidden:pressed;
   item.textContent=(visible?'☑ ':'☐ ')+label+' ('+key+')';
   item.setAttribute('aria-checked',String(visible));
  }
 };
 for(const [id,label,key] of entries){
  const item=document.createElement('button');
  item.type='button';item.className='overlays-option';item.dataset.overlayId=id;
  item.setAttribute('role','menuitemcheckbox');
  item.addEventListener('click',()=>{
   document.getElementById(id)?.click();
   updateLabels();
  });
  overlayList.appendChild(item);
  document.getElementById(id)?.addEventListener('click',()=>setTimeout(updateLabels,0));
 }
 overlayMenu.append(overlayTrigger,overlayList);
 const dayReport=document.getElementById('dayReportButton');
 if(dayReport)actions.insertBefore(overlayMenu,dayReport);else actions.appendChild(overlayMenu);
 function closeOverlaysMenu(){overlayList.hidden=true;overlayTrigger.setAttribute('aria-expanded','false');}
 overlayTrigger.addEventListener('click',()=>{
  const opening=overlayList.hidden;
  overlayList.hidden=!opening;
  overlayTrigger.setAttribute('aria-expanded',String(opening));
  if(opening)updateLabels();
 });
 document.addEventListener('click',e=>{if(!overlayMenu.contains(e.target))closeOverlaysMenu();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeOverlaysMenu();});
 updateLabels();
 const deploy=document.getElementById('deployReinforcement');if(deploy){deploy.style.display='none';deploy.title='Deploy reinforcements (D)';}
 for(const id of ['soundToggle','battleMusicToggle','unitSymbolsToggle','replacementToggle','endPositionsToggle','zocToggle','citiesOverlayToggle','hexControlToggle','mapControlsToggle']){
  const button=document.getElementById(id);if(button)button.style.display='none';
 }
});
