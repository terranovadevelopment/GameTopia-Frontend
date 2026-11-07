
(function(){
 function restore(){
  const grid=document.getElementById('setupThreeColumns');
  if(!grid||grid.classList.contains('m493-restored'))return;
  const label=id=>document.getElementById(id)?.closest('label');
  const left=document.createElement('div'),right=document.createElement('div');
  left.className='m493-column';right.className='m493-column';
  for(const id of ['mapSize','customWidth','playerSide']){const n=label(id);if(n)left.appendChild(n);}
  for(const id of ['deployment','customHeight','unitSymbolStyle','mapSeed']){const n=label(id);if(n)right.appendChild(n);}
  let handicap=document.getElementById('combinedHandicap');
  if(!handicap){
   handicap=document.createElement('fieldset');handicap.id='combinedHandicap';
   handicap.innerHTML='<legend>Nation handicaps</legend><table><thead><tr><th>Setting</th><th>Bluenstein</th><th>Redonia</th></tr></thead><tbody><tr><th>Starting reinforcement (%)</th><td id="blueUnitsCell"></td><td id="redUnitsCell"></td></tr><tr><th>Starting RP balance</th><td id="blueRPCell"></td><td id="redRPCell"></td></tr><tr><th>Replacements per city hex/day</th><td id="blueReplacementRateCell"></td><td id="redReplacementRateCell"></td></tr></tbody></table>';
  }
  for(const id of ['blueUnits','redUnits','blueRP','redRP','blueReplacementRate','redReplacementRate']){
   const el=document.getElementById(id),cell=handicap.querySelector('#'+id+'Cell');
   if(el&&cell){const lab=el.closest('label');cell.appendChild(lab||el);}
  }
  grid.replaceChildren(left,right,handicap);
  grid.classList.add('m493-restored');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(restore,100));
 else setTimeout(restore,100);
})();
