/* M6.180: restore bundled GameTopia music after M6.132 disabled playback.
   Browsers may block play until the first user gesture; never force autoplay. */
(function(w){'use strict';
 const tracks=['music/exciting-trailer.mp3','music/at-launch.mp3','music/black-vortex.mp3','music/the-descent.mp3'];
 const battleTrack='music/five-armies.mp3';
 let page=0,enabled=true,battleEnabled=true,battlePhase='planning',active=false,lastError='';
 let element=null,currentFile='';
 // Respect a player-off choice, but a new session starts enabled for music diagnostics.
 const previous=(()=>{try{return sessionStorage.getItem('gt_music_enabled')}catch(_){return null}})();
 if(previous==='false')enabled=battleEnabled=false;
 function audio(){if(!element){element=new Audio();element.loop=true;element.preload='none';element.volume=.3;element.addEventListener('error',()=>{lastError='Could not load game music. Check the bundled music files.';active=false;});}return element;}
 function file(){return (battlePhase==='planning'||battlePhase==='execution')?battleTrack:tracks[Math.max(0,Math.min(3,page))];}
 function play(){const source=file();if(!enabled||!source||(battlePhase==='planning'&&!battleEnabled)){stop();return;}const a=audio();if(source!==currentFile){a.pause();a.src=source;currentFile=source;a.load();}if(active&&!a.paused)return;const result=a.play();active=true;if(result&&typeof result.catch==='function')result.catch(err=>{active=false;lastError='Music playback failed: '+err.message;console.warn('GameTopia music',currentFile,lastError);});}
 function stop(){if(element){element.pause();}active=false;}
 function setEnabled(value){enabled=!!value;try{sessionStorage.setItem('gt_music_enabled',String(enabled))}catch(_){}if(enabled)play();else stop();}
 function selectPage(index){page=Math.max(0,Math.min(3,Number(index)||0));battlePhase='story';if(active||enabled)play();}
 function setBattlePhase(phase){battlePhase=phase==='execution'?'execution':'planning';if(enabled&&battleEnabled)play();}
 function setBattleEnabled(value){battleEnabled=!!value;if(battleEnabled){enabled=true;play();}else stop();}
 async function test(){enabled=true;battleEnabled=true;const a=audio();const source=file();if(source!==currentFile){a.pause();a.src=source;currentFile=source;a.load();}await a.play();active=true;lastError='';return {source,playing:!a.paused};}
 const music={start:play,stop,setEnabled,selectPage,setBattlePhase,unlockBattleMusic:play,setBattleEnabled,retry:play,test,
   get enabled(){return enabled},get active(){return active},get battleEnabled(){return battleEnabled},get battlePhase(){return battlePhase},get lastError(){return lastError}};
 w.ARMAGEDDON_MARCH=music;
})(window);
