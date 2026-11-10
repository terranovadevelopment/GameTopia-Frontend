
(function(){
 const battleButton=document.getElementById('battleMusicToggle');
 if(battleButton){
   battleButton.addEventListener('click',()=>{
     const m=window.ARMAGEDDON_MARCH;if(!m)return;
     m.setBattleEnabled(!m.battleEnabled);
     battleButton.textContent='♫ Music On/Off';
     battleButton.setAttribute('aria-pressed',String(m.battleEnabled));
   });
   battleButton.textContent='♫ Music On/Off';
   // Browsers require a user gesture to unlock audible playback after loading a game.
   // This allows music to start on the player's first battlefield interaction.
   document.addEventListener('pointerdown',e=>{
     if(!document.getElementById('storyStage')?.hidden)return;
     if(e.target.closest('#battleMusicToggle'))return;
     window.ARMAGEDDON_MARCH?.unlockBattleMusic();
   },{once:true});
 }
 const setupMusic=document.getElementById('setupMusicToggle');
 if(setupMusic){
   setupMusic.addEventListener('click',()=>{
     const m=window.ARMAGEDDON_MARCH;if(!m)return;
     const next=!m.enabled;
     m.setEnabled(next);
     // Keep the game music preference consistent with the setup screen.
     m.setBattleEnabled(next);
     if(next && m.battlePhase)m.unlockBattleMusic();
     setupMusic.setAttribute('aria-pressed',String(next));
     if(battleButton)battleButton.setAttribute('aria-pressed',String(next));
   });
 }
 if(battleButton){battleButton.addEventListener('click',()=>{
   const m=window.ARMAGEDDON_MARCH;
   if(m){m.setEnabled(m.battleEnabled);setupMusic?.setAttribute('aria-pressed',String(m.battleEnabled));}
 });}
 const button=document.getElementById('musicCreditsButton');
 const dialog=document.getElementById('musicCreditsDialog');
 if(button && dialog){button.addEventListener('click',function(){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');});}
})();
