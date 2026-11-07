
(function(){
 function placeSetupControls(){
  const panel=document.getElementById('mapSetupPanel');if(!panel)return;
  let footer=document.getElementById('gtSetupFooter');
  if(!footer){footer=document.createElement('div');footer.id='gtSetupFooter';footer.setAttribute('aria-label','Game setup controls');const main=document.createElement('div');main.className='gtSetupMainButtons';footer.appendChild(main);}
  // The setup panel is retained by stage.replaceChildren(panel,...).
  if(footer.parentElement!==panel)panel.appendChild(footer);
  const main=footer.querySelector('.gtSetupMainButtons');
  const start=document.getElementById('applyMapSetup');
  const load=document.querySelector('[data-load-game]')||[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Load Saved Game');
  const credits=document.getElementById('musicCreditsButton');
  const music=document.getElementById('setupMusicToggle');
  for(const button of [start,load,credits])if(button&&button.parentElement!==main)main.appendChild(button);
  if(music&&music.parentElement!==footer)footer.appendChild(music);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',placeSetupControls);else placeSetupControls();
 window.addEventListener('load',placeSetupControls);
})();
