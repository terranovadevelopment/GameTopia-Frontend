
(function(){
 function adjust(){
  const blue=document.getElementById('blueUnits')?.closest('fieldset');
  const red=document.getElementById('redUnits')?.closest('fieldset');
  const blueRate=document.getElementById('blueReplacementRate')?.closest('label');
  const redRate=document.getElementById('redReplacementRate')?.closest('label');
  if(blue&&blueRate)blue.appendChild(blueRate);
  if(red&&redRate)red.appendChild(redRate);
  // Position both handicap groups on matching rows, after the first three setup controls.
  const left=blue?.parentElement,right=red?.parentElement;
  if(left&&right){
    const blueNation=document.getElementById('playerSide')?.closest('label');
    const seed=document.getElementById('mapSeed')?.closest('label');
    if(blueNation)blueNation.insertAdjacentElement('afterend',blue);
    if(seed)seed.insertAdjacentElement('afterend',red);
  }
  const panel=document.getElementById('mapSetupPanel');
  for(const b of panel?.querySelectorAll('button')||[]){if(b.textContent.trim()==='Load Saved Game')b.dataset.loadGame='1';}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(adjust,0));else setTimeout(adjust,0);
})();
