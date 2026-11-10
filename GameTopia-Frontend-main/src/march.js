/* M6.192: restore bundled GameTopia music after M6.132 disabled playback.
   Browsers may block play until the first user gesture; never force autoplay. */
(function(w){'use strict';
 const tracks=['music/exciting-trailer.mp3','music/at-launch.mp3','music/black-vortex.mp3','music/the-descent.mp3'];
 const battleTrack='music/five-armies.mp3';
 let page=0,enabled=true,battleEnabled=false,battlePhase='story',gameplay=false,active=false,lastError='';
 let element=null,currentFile='';
 // Respect a player-off choice, but a new session starts enabled for music diagnostics.
 // Each newly loaded game enables music; any explicit off selection applies to the current page only.
 function audio(){if(!element){element=new Audio();element.loop=true;element.preload='none';element.volume=.55;element.addEventListener('error',()=>{lastError='Music file error: '+(element?.error?.code||'unknown')+' at '+currentFile;active=false;});}return element;}
 function file(){return (battlePhase==='planning'||battlePhase==='execution')?battleTrack:tracks[Math.max(0,Math.min(3,page))];}
 function play(){if(gameplay){stop();return;}const source=file();lastError='';if(!enabled||!source||(battlePhase==='planning'&&!battleEnabled)){stop();return;}const a=audio();if(source!==currentFile){a.pause();a.src=source;currentFile=source;a.load();}if(active&&!a.paused)return;const result=a.play();if(result&&typeof result.then==='function')result.then(()=>{active=!a.paused;}).catch(err=>{active=false;lastError='Music playback failed: '+err.message;console.warn('GameTopia music',currentFile,lastError);});else active=!a.paused;}
 function stop(){if(element){element.pause();}active=false;}
 function setEnabled(value){enabled=!!value;if(enabled)play();else stop();}
 function selectPage(index){if(gameplay)return;page=Math.max(0,Math.min(3,Number(index)||0));battlePhase='story';if(active||enabled)play();}
 function setBattlePhase(phase){gameplay=true;battlePhase=phase==='execution'?'execution':'planning';battleEnabled=false;stop();}
 function setBattleEnabled(value){battleEnabled=!gameplay&&!!value;if(battleEnabled){enabled=true;play();}else stop();}
 async function test(){if(gameplay)throw Error('Background music is disabled during gameplay');enabled=true;battleEnabled=true;const a=audio();const source=file();if(source!==currentFile){a.pause();a.src=source;currentFile=source;a.load();}await a.play();active=true;lastError='';return {source,playing:!a.paused};}
 const music={start:play,stop,setEnabled,selectPage,setBattlePhase,unlockBattleMusic:play,setBattleEnabled,retry:play,test,
   get enabled(){return enabled},get active(){return active},get battleEnabled(){return battleEnabled},get battlePhase(){return battlePhase},get lastError(){return lastError}};
 w.ARMAGEDDON_MARCH=music;
 // A direct entry into an active battle must never start the story soundtrack.
 if(new URLSearchParams(w.location.search).has('size'))setBattlePhase('planning');
})(window);
