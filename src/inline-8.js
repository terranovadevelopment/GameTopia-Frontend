
/* M4.25 setup: two compact 25% settings columns and a 50% summary/terrain column. */
(function(){
 function layoutSetup(){
  const panel=document.getElementById('mapSetupPanel');
  if(!panel||panel.querySelector('#setupThreeColumns'))return;
  const field=id=>document.getElementById(id)?.closest('label');
  const row=id=>field(id)?.parentElement;
  const originalRows=['mapSize','customWidth','playerSide','blueUnits','blueReplacementRate'].map(row);
  const handicapRow=row('blueUnits');
  const left=document.createElement('div'),middle=document.createElement('div'),right=document.createElement('div');
  left.className='setup-quarter';middle.className='setup-quarter';right.className='setup-half';
  const grid=document.createElement('div');grid.id='setupThreeColumns';
  const put=(target,node)=>{if(node){target.appendChild(node);}};
  ['mapSize','customWidth','playerSide'].forEach(id=>put(left,field(id)));



  ['deployment','customHeight','unitSymbolStyle','mapSeed'].forEach(id=>put(middle,field(id)));
  // Preserve the original handicap fieldset and its six live input elements.
  // Earlier builds created a second empty table and deleted the original inputs.
  const handicap=document.getElementById('blueUnits')?.closest('fieldset');
  if(handicap){handicap.id='combinedHandicap';}
  /* Keep combined handicap outside the two settings columns. */

  const lower=document.createElement('div');lower.id='setupLower';
  const forces=document.getElementById('setupForceSummary');
  const densities=document.getElementById('densityFields');
  put(lower,forces);put(lower,densities);
  const actions=document.getElementById('applyMapSetup')?.parentElement;
  if(actions)lower.after(actions);
  for(const node of [...panel.children]){
    if(node.tagName==='P' && (node.textContent.includes('Replacement rates')||node.textContent.startsWith('Cities are balanced')))node.remove();
  }
  for(const old of originalRows)if(old&&old.parentElement===panel&&old.children.length===0)old.remove();
  const anchor=panel.querySelector('h2')?.nextElementSibling;
  if(anchor)anchor.after(grid);else panel.prepend(grid);
  grid.append(left,middle,right);
  if(handicap)grid.appendChild(handicap);
  grid.after(lower);
  if(actions){actions.style.display="flex";actions.style.justifyContent="flex-start";actions.style.gap="10px";actions.style.marginTop="14px";lower.after(actions);}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',layoutSetup);else layoutSetup();
})();
