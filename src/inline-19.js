
(function(){
 function alignHandicaps(){
  const blue=document.getElementById('blueUnits')?.closest('fieldset');
  const red=document.getElementById('redUnits')?.closest('fieldset');
  if(!blue||!red)return;
  red.style.marginTop='0px';blue.style.marginTop='0px';
  const diff=blue.getBoundingClientRect().top-red.getBoundingClientRect().top;
  if(diff>1)red.style.marginTop=diff+'px';
  else if(diff< -1)blue.style.marginTop=(-diff)+'px';
 }
 window.addEventListener('load',()=>{setTimeout(alignHandicaps,150);setTimeout(alignHandicaps,450);setTimeout(alignHandicaps,900)});
 window.addEventListener('resize',()=>setTimeout(alignHandicaps,80));
})();
