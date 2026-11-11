
/* M6.67: draggable player status and separate voice communications UI. */
(function(){
 const id=new URLSearchParams(location.search).get('gameId');if(!id)return;
 let ident;try{ident=JSON.parse(sessionStorage.getItem('armageddon_identity_'+id)||'null')}catch(_){}
 if(!ident?.token)return;
 const api=window.armServerRequest,base='/api/games/'+encodeURIComponent(id);
 const box=document.createElement('section');box.id='gtPlayersPanel';box.setAttribute('aria-label','Multiplayer player status');
 box.innerHTML='<div class="gt-drag" id="gtDragHandle"><span>Players · Planning</span><span title="Drag to move">⠿</span></div><div class="gt-body"><div id="gtTurnStatus">Connecting…</div><div id="gtPlayersList"></div><div class="gt-controls"><button id="gtReadyToggle" class="gt-notready">Planning</button><button id="gtCommToggle" title="Communications" aria-label="Communications">COMM</button></div><div class="gt-note" id="gtSyncNote">M6.119 combat engine: movement, firing, morale, retreats, surrenders, production, and maintenance.</div></div>';
 document.body.appendChild(box);
 // M6.192: Execution Trace is no longer a player-facing window or reopen control.
 function trace(step,data){ /* diagnostics intentionally hidden from the game interface */ }
 trace('diagnostic-initialized',{gameId:id,playerId:ident.playerId,version:'M6.119'});
 const handle=box.querySelector('#gtDragHandle');let drag=null;
 handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;const r=box.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};handle.setPointerCapture(e.pointerId);e.preventDefault()});
 handle.addEventListener('pointermove',e=>{if(!drag)return;box.style.left=Math.max(0,Math.min(innerWidth-box.offsetWidth,drag.left+e.clientX-drag.x))+'px';box.style.top=Math.max(0,Math.min(innerHeight-box.offsetHeight,drag.top+e.clientY-drag.y))+'px';box.style.bottom='auto'});
 for(const ev of ['pointerup','pointercancel'])handle.addEventListener(ev,()=>drag=null);
 const status=box.querySelector('#gtTurnStatus'),players=box.querySelector('#gtPlayersList'),ready=box.querySelector('#gtReadyToggle'),comm=box.querySelector('#gtCommToggle');let current=null;let lastEconomyRevision=-1;
 let lastSentRouteSignature=null,routePublishBusy=false,routePublishDay=null;
 // Receive production and maintenance RP changes without waiting for polling.
 let economyStream=null;
 if(typeof EventSource!=='undefined'){
   economyStream=new EventSource('https://gametopia-backend.onrender.com'+base+'/economy-events?token='+encodeURIComponent(ident.token));
   economyStream.addEventListener('economy',event=>{
     try{
       const value=JSON.parse(event.data),city=window.ARMAGEDDON_M3?.cities;
       if(!value.treasury||!city||Number(value.economyRevision)<lastEconomyRevision)return;
       lastEconomyRevision=Number(value.economyRevision)||0;
       Object.assign(city.treasury,value.treasury);city.render?.();
       document.dispatchEvent(new CustomEvent('gametopia:economy-updated',{detail:value}));
     }catch(e){console.warn('Economy stream:',e);}
   });
   window.addEventListener('pagehide',()=>economyStream?.close(),{once:true});
 }
 let lastAppliedDay=1;
 // Server-authored events are immutable. Playback changes only renderer.visualPositions.
 let replayBusy=false, replayPaused=false, replaySkip=false, replaySpeed=1;
 const replayBar=document.createElement('section');replayBar.id='gtMovementReplay';replayBar.hidden=true;
 replayBar.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:99997;background:#10283c;color:white;padding:10px 14px;border:2px solid #8abce4;border-radius:8px;font:13px Arial,sans-serif;box-shadow:0 5px 18px #000a';
 replayBar.innerHTML='<strong id="gtReplayStatus">Movement replay</strong> <button id="gtReplayPause" type="button">Pause</button> <button id="gtReplaySlow" type="button">Slow</button> <button id="gtReplayNormal" type="button">Normal</button> <button id="gtReplayFast" type="button">Fast</button> <button id="gtReplaySkip" type="button">Skip</button>';
 document.body.append(replayBar);
 replayBar.querySelectorAll('button').forEach(b=>{b.style.cssText='margin-left:5px;padding:5px 8px;color:white;background:#235c8b;border:1px solid #9abbd8;border-radius:4px;cursor:pointer'});
 replayBar.querySelector('#gtReplayPause').onclick=()=>{replayPaused=!replayPaused;replayBar.querySelector('#gtReplayPause').textContent=replayPaused?'Play':'Pause';trace('replay-pause',{paused:replayPaused})};
 replayBar.querySelector('#gtReplaySlow').onclick=()=>{replaySpeed=3;trace('replay-speed',{secondsPerTI:3})};
 replayBar.querySelector('#gtReplayNormal').onclick=()=>{replaySpeed=1;trace('replay-speed',{secondsPerTI:1})};
 replayBar.querySelector('#gtReplayFast').onclick=()=>{replaySpeed=.2;trace('replay-speed',{secondsPerTI:.2})};
 replayBar.querySelector('#gtReplaySkip').onclick=()=>{replaySkip=true;trace('replay-skip',{})};
 // M6.117: a movable, non-modal battle report, independently acknowledged by this viewer.
 const battleDialog=document.createElement('section');battleDialog.id='gtBattleReport';battleDialog.hidden=true;
 battleDialog.style.cssText='position:fixed;z-index:100001;width:min(445px,calc(100vw - 24px));max-height:72vh;overflow:auto;background:#10283c;color:#f4f8ff;border:2px solid #e2ad58;border-radius:10px;padding:12px;font:14px/1.4 Arial,sans-serif;box-shadow:0 12px 32px #000b';
 battleDialog.innerHTML='<div id="gtBattleDrag" style="cursor:move;touch-action:none;user-select:none;font:bold 17px Arial;border-bottom:1px solid #688da5;padding:5px 3px 12px">BATTLE SUMMARY · Drag to move</div><div id="gtBattleReportBody" style="padding:8px 0"></div><div id="gtBattleAnimationStatus" aria-live="polite" style="color:#b9d5ed;margin:8px 0">Preparing firing animation…</div><button type="button" id="gtBattleContinue" disabled style="display:flex;align-items:center;justify-content:center;margin:12px auto 2px;min-height:42px;padding:10px 18px;border:1px solid #c8daeb;border-radius:5px;background:#235c8b;color:white;cursor:pointer">Close — Continue Execution</button>';
 document.body.append(battleDialog);
 const battlePointer=document.createElementNS('http://www.w3.org/2000/svg','svg');
 battlePointer.setAttribute('viewBox','0 0 100 100');battlePointer.setAttribute('preserveAspectRatio','none');
 battlePointer.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:100000;pointer-events:none;display:none;overflow:visible';
 const arrow=document.createElementNS('http://www.w3.org/2000/svg','path');arrow.setAttribute('fill','none');arrow.setAttribute('stroke','#ffb322');arrow.setAttribute('stroke-width','3');arrow.setAttribute('stroke-linecap','round');
 const arrowHead=document.createElementNS('http://www.w3.org/2000/svg','polygon');arrowHead.setAttribute('fill','#ffb322');
 battlePointer.append(arrow,arrowHead);document.body.append(battlePointer);
 let battleTarget=null;
 function updateBattlePointer(){if(battleDialog.hidden||!battleTarget)return;
   const game=window.ARMAGEDDON_M2,renderer=game?.renderer,canvas=renderer?.canvas;if(!renderer||!canvas)return;
   const p=renderer.worldPixel(battleTarget.col,battleTarget.row),cr=canvas.getBoundingClientRect(),b=battleDialog.getBoundingClientRect();
   const tx=cr.left+p.x*cr.width/renderer.dims.w,ty=cr.top+p.y*cr.height/renderer.dims.h;
   const sx=(b.left+b.width/2<tx)?b.right:b.left,sy=Math.max(b.top+22,Math.min(b.bottom-22,ty));
   battlePointer.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);
   const angle=Math.atan2(ty-sy,tx-sx),ex=tx-15*Math.cos(angle),ey=ty-15*Math.sin(angle);
   arrow.setAttribute('d',`M ${sx} ${sy} Q ${(sx+ex)/2} ${sy} ${ex} ${ey}`);
   arrowHead.setAttribute('points',`${tx},${ty} ${tx-19*Math.cos(angle-.35)},${ty-19*Math.sin(angle-.35)} ${tx-19*Math.cos(angle+.35)},${ty-19*Math.sin(angle+.35)}`);
 }
 const battleHandle=battleDialog.querySelector('#gtBattleDrag');let draggingBattle=null;
 battleHandle.addEventListener('pointerdown',e=>{if(e.button!==0)return;const r=battleDialog.getBoundingClientRect();draggingBattle={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top};battleHandle.setPointerCapture(e.pointerId);e.preventDefault()});
 battleHandle.addEventListener('pointermove',e=>{if(!draggingBattle||draggingBattle.id!==e.pointerId)return;battleDialog.style.left=Math.max(4,Math.min(innerWidth-battleDialog.offsetWidth-4,draggingBattle.left+e.clientX-draggingBattle.x))+'px';battleDialog.style.top=Math.max(4,Math.min(innerHeight-battleDialog.offsetHeight-4,draggingBattle.top+e.clientY-draggingBattle.y))+'px';updateBattlePointer()});
 for(const t of ['pointerup','pointercancel','lostpointercapture'])battleHandle.addEventListener(t,()=>draggingBattle=null);
 addEventListener('resize',updateBattlePointer);
 async function centerCombat(renderer,point){
   const center=renderer.worldPixel(point.col,point.row),from={...renderer.pan};
   const aim={x:from.x+renderer.dims.w/2-center.x,y:from.y+renderer.dims.h/2-center.y};
   renderer.pan={...aim};renderer.clampPan();const to={...renderer.pan};renderer.pan={...from};
   const started=performance.now();while(true){const t=Math.min(1,(performance.now()-started)/850),ease=t*t*(3-2*t);renderer.pan.x=from.x+(to.x-from.x)*ease;renderer.pan.y=from.y+(to.y-from.y)*ease;renderer.render();if(t===1)break;await nextFrame();}
 }
 async function fireServerCombat(event,renderer,byId){
   const shots=event.shots||[],firing=[...new Set(shots.map(x=>String(x.sourceId)))];
   const sound=window.ARMAGEDDON_SOUND;
   trace('combat-replay-start',{shots:shots.length,sourceIds:firing,soundEnabled:sound?.enabled});
   // One division fires at a time, for two seconds. Audio follows its unit type.
   for(const id of firing){
     if(replaySkip)break;
     const shooter=byId.get(id),volley=shots.filter(x=>String(x.sourceId)===id);
     sound?.combat?.(shooter?.type||'Infantry',{duration:2});
     trace('combat-audio',{unit:id,type:shooter?.type||'Infantry',status:sound?.status?.()||'unknown'});
     const begin=performance.now();
     while(!replaySkip){
       const t=Math.min(1,(performance.now()-begin)/2000);renderer.render();const ctx=renderer.ctx;ctx.save();
       for(const shot of volley){
         const source=shot.from||byId.get(String(shot.sourceId));
         const target=shot.to||byId.get(String(shot.targetId));
         if(!source||!target)continue;
         const from=renderer.worldPixel(source.col,source.row),to=renderer.worldPixel(target.col,target.row),phase=(t*6)%1;
         ctx.strokeStyle=shooter?.side==='Blue'?'#ffe889':'#ff8759';ctx.lineWidth=Math.max(3,renderer.zoom*4);ctx.shadowColor='#ffb63d';ctx.shadowBlur=8;
         ctx.beginPath();ctx.moveTo(from.x+(to.x-from.x)*Math.max(0,phase-.2),from.y+(to.y-from.y)*Math.max(0,phase-.2));ctx.lineTo(from.x+(to.x-from.x)*phase,from.y+(to.y-from.y)*phase);ctx.stroke();
         ctx.fillStyle=`rgba(255,152,35,${Math.max(0,.7-(phase*.6))})`;ctx.beginPath();ctx.arc(to.x,to.y,renderer.size*(.1+.35*phase),0,Math.PI*2);ctx.fill();
       }
       ctx.restore();updateBattlePointer();if(t>=1)break;await nextFrame();
     }
   }
   renderer.render();
 }
 async function showBattleReport(event,day,byId,renderer){
   if(!event.hex||!Number.isFinite(event.hex.col)||!Number.isFinite(event.hex.row))return;
   await centerCombat(renderer,event.hex);battleTarget=event.hex;
   const body=battleDialog.querySelector('#gtBattleReportBody');body.replaceChildren();
   const heading=document.createElement('p');heading.textContent='Turn '+(day-1)+' · TI '+event.ti+' · Combat at '+event.hex.col+', '+event.hex.row;body.append(heading);
   const table=document.createElement('table');table.style.cssText='width:100%;border-collapse:collapse;text-align:left';
   const thead=document.createElement('thead');thead.innerHTML='<tr><th style="padding:6px;border-bottom:1px solid #a4bbce">Division</th><th style="padding:6px;border-bottom:1px solid #a4bbce;text-align:right">Casualties</th><th style="padding:6px;border-bottom:1px solid #a4bbce;text-align:right">Ending morale (E)</th></tr>';table.append(thead);
   const tbody=document.createElement('tbody');const ids=[...new Set([event.attackerId,event.defenderId,...(event.shots||[]).flatMap(x=>[x.sourceId,x.targetId]),...(event.participants||[])].filter(Boolean).map(String))];
   const colorOf=id=>byId.get(id)?.side||'Unknown';
   const casualties=id=>(event.losses||[]).find(l=>String(l.unitId)===id)?.casualties||0;
   const formatMorale=id=>{const loss=(event.losses||[]).find(l=>String(l.unitId)===id);const n=event.endingMorale?.[id]??loss?.endingMorale??loss?.effectiveness??byId.get(id)?.effectiveness;return Number.isFinite(Number(n))?Math.round(Number(n))+'%':'—';};
   const addRow=(id)=>{const unit=byId.get(id);const row=document.createElement('tr');const outcome=(event.surrenders||[]).find(x=>String(x.unitId)===id)?' · Surrendered':(event.retreats||[]).find(x=>String(x.unitId)===id&&x.advance)?' · Advanced after combat':(event.retreats||[]).find(x=>String(x.unitId)===id&&!x.advance)?' · Retreated':'';
     for(const [value,right] of [[(unit?.name||unit?.designation||id)+outcome,false],[String(casualties(id)),true],[formatMorale(id),true]]){const cell=document.createElement('td');cell.style.cssText='padding:6px;border-bottom:1px solid #385468'+(right?';text-align:right':'');if(!right){const link=document.createElement('button');link.type='button';link.dataset.battleUnitLink='true';link.textContent=value;link.title='Inspect this division without closing battle summary';link.style.cssText='border:0;background:transparent;color:#9cdbff;text-align:left;cursor:pointer;text-decoration:underline;font:inherit;padding:0';link.addEventListener('click',e=>{e.stopPropagation();const game=window.ARMAGEDDON_M2;if(game?.select){try{game.select(id);const u=byId.get(id);if(u&&game.renderer?.centerOnHex)game.renderer.centerOnHex(u.col,u.row);updateBattlePointer();trace('battle-division-selected',{id});}catch(error){trace('battle-division-select-error',{id,error:String(error)});}}});cell.append(link);}else cell.textContent=value;row.append(cell)}tbody.append(row);};
   const addTotal=(side,ids)=>{const row=document.createElement('tr');row.style.cssText='font-weight:700;background:#213e54';for(const [value,right] of [[side+' total',false],[String(ids.reduce((n,id)=>n+casualties(id),0)),true],['',true]]){const cell=document.createElement('td');cell.textContent=value;cell.style.cssText='padding:7px 6px'+(right?';text-align:right':'');row.append(cell);}tbody.append(row);};
   for(const side of ['Blue','Red']){const group=ids.filter(id=>colorOf(id)===side);for(const id of group)addRow(id);addTotal(side,group);}
   for(const id of ids.filter(id=>!['Blue','Red'].includes(colorOf(id))))addRow(id);
   table.append(tbody);body.append(table);
   
   const canvasRect=renderer.canvas.getBoundingClientRect(),battlePos=renderer.worldPixel(event.hex.col,event.hex.row);
   const bx=canvasRect.left+battlePos.x*canvasRect.width/renderer.dims.w;
   const by=canvasRect.top+battlePos.y*canvasRect.height/renderer.dims.h;
   battleDialog.hidden=false;battleDialog.style.transform='none';
   // Keep report close to battle (roughly a counter-width plus 60px), but
   // flip sides when there is insufficient screen room. Clamp after measuring.
   const reportW=battleDialog.offsetWidth,reportH=battleDialog.offsetHeight,gap=206;
   const right=bx+gap,left=bx-gap-reportW;
   const roomRight=innerWidth-right-12,roomLeft=left-12;
   const useRight=roomRight>=reportW||(roomRight>=0&&roomRight>=roomLeft);
   const reportX=useRight?right:left;
   battleDialog.style.left=Math.max(8,Math.min(innerWidth-reportW-8,reportX))+'px';
   battleDialog.style.top=Math.max(76,Math.min(innerHeight-reportH-12,by-reportH*.45))+'px';
   battlePointer.style.display='block';updateBattlePointer();
   const button=battleDialog.querySelector('#gtBattleContinue'),label=battleDialog.querySelector('#gtBattleAnimationStatus');button.hidden=true;label.hidden=true;
   try{await fireServerCombat(event,renderer,byId);}catch(error){trace('combat-animation-error',{error:String(error)});}
   // Clicking a division name opens its panel without dismissing the report.
   // All other ordinary left/right clicks dismiss it, except dragging the title bar.
   return new Promise(resolve=>{
     const dismiss=e=>{
       if(e.target.closest?.('#gtBattleDrag')||e.target.closest?.('[data-battle-unit-link]'))return;
       e.preventDefault();e.stopPropagation();
       document.removeEventListener('click',dismiss);document.removeEventListener('contextmenu',dismiss);
       battleDialog.hidden=true;battlePointer.style.display='none';battleTarget=null;resolve();
     };
     document.addEventListener('click',dismiss);document.addEventListener('contextmenu',dismiss);
   });
 }
 // Production notifications are per-viewer; a server production event must be
 // authored by the server to be synchronized reliably across teammates.
 async function showProductionReport(event,day,renderer){
   const mine=current?.players?.find(p=>p.id===ident.playerId);if(event.side!==mine?.side)return;
   if(event.hex)await centerCombat(renderer,event.hex);
   return new Promise(resolve=>{const panel=document.createElement('section');panel.style.cssText='position:fixed;z-index:100010;width:275px;max-width:calc(100vw - 20px);background:#10283c;border:2px solid #e2ad58;border-radius:10px;color:white;padding:14px;font:14px/1.4 Arial;box-shadow:0 12px 30px #0009';
   // Keep the report within roughly two screen inches (192 CSS px) of the city.
   const canvas=renderer.canvas,rect=canvas.getBoundingClientRect(),target=event.cityHex||event.hex;
   const pt=target&&renderer.worldPixel(target.col,target.row);
   const tx=pt?rect.left+(pt.x/renderer.dims.w)*rect.width:Math.min(innerWidth/2,300);
   const ty=pt?rect.top+(pt.y/renderer.dims.h)*rect.height:innerHeight/2;
   const px=Math.max(8,Math.min(innerWidth-310,tx+(tx<innerWidth/2?38:-300)));
   const py=Math.max(8,Math.min(innerHeight-195,ty-75));
   panel.style.left=px+'px';panel.style.top=py+'px';
   const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');arrow.setAttribute('viewBox','0 0 '+innerWidth+' '+innerHeight);arrow.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:100009;pointer-events:none';
   const marker=document.createElementNS('http://www.w3.org/2000/svg','path');marker.setAttribute('d','M '+(px+Math.min(275,innerWidth-px)/2)+' '+(py+70)+' L '+tx+' '+ty);marker.setAttribute('stroke','#ffd54a');marker.setAttribute('stroke-width','5');marker.setAttribute('stroke-linecap','round');marker.setAttribute('fill','none');arrow.appendChild(marker);document.body.append(arrow);
   const h=document.createElement('h2');h.textContent='New Division Produced';h.style.margin='0 0 8px';
   const desc=document.createElement('p');desc.textContent=(event.unitType||event.typeName||'Division')+' produced at '+(event.cityName||'city')+' · '+(event.controllerName||event.side||'Unknown controller')+' controls it.';
   const btn=document.createElement('button');btn.textContent='Acknowledge';btn.style.cssText='padding:10px 18px;background:#235c8b;color:white;border:1px solid #bfd1df;border-radius:5px';btn.onclick=()=>{panel.remove();arrow.remove();resolve()};panel.append(h,desc,btn);document.body.append(panel);});
 }
 function nextFrame(){return new Promise(resolve=>requestAnimationFrame(resolve))}
 async function playServerMovements(day,events){
   const game=window.ARMAGEDDON_M2,clock=window.ARMAGEDDON_M3;
   if(!game?.scenario?.divisions||!game?.renderer){trace('replay-no-game',{day});await applyServerPositions(day);return}
   // M6.88: execution replay must never display Planning route overlays.
   // Server orders were submitted before Ready; clearing this map affects visuals only.
   // Do not destroy planning routes when replay begins. Their remaining
   // waypoints are reconciled against the authoritative move events below.
   window.ARMAGEDDON_EXECUTION_HIDE_ROUTES=true;
   replayBusy=true;replayPaused=false;replaySkip=false;replaySpeed=1;
   replayBar.hidden=false;replayBar.querySelector('#gtReplayPause').textContent='Pause';
   const renderer=game.renderer, units=game.scenario.divisions;
   const byId=new Map(units.map(u=>[String(u.id),u]));
   // Hex offset coordinates are discrete: interpolate centers in pixels, never
   // fractional columns/rows (parity flips make diagonal moves jump sideways).
   const pixelTween=(from,to,f)=>{
     // Stable unpanned/unzoomed world positions. The renderer adds current camera
     // pan and zoom on every frame, including while the player drags the map.
     const base=renderer.baseSize, world=hex=>{const q=hex.col-Math.floor(hex.row/2);return {x:base*Math.sqrt(3)*(q+hex.row/2),y:base*1.5*hex.row}};
     const a=world(from),b=world(to);
     return {pixelX:a.x+(b.x-a.x)*f,pixelY:a.y+(b.y-a.y)*f};
   };
   const moves=(events||[]).filter(e=>e.type==='move'&&e.from&&e.to&&byId.has(String(e.unitId)));
   const retreats=(events||[]).filter(e=>(e.type==='retreat'||e.type==='advance')&&e.from&&e.to&&byId.has(String(e.unitId)));
   const surrenders=(events||[]).filter(e=>e.type==='surrender'&&byId.has(String(e.unitId)));
   const combats=(events||[]).filter(e=>e.type==='combat');const productions=(events||[]).filter(e=>e.type==='production');
   const start=new Map(units.map(u=>[String(u.id),{col:u.col,row:u.row}]));
   // If the local map was already synchronized to final positions, reconstruct
   // the initial positions using the first movement event for each division.
   for(const e of moves)if(!start.has('first:'+e.unitId)){start.set('first:'+e.unitId,true);start.set(String(e.unitId),{...e.from})}
   for(const u of units){const pos=start.get(String(u.id));if(pos)renderer.visualPositions.set(u.id,{col:pos.col,row:pos.row})}
   // Reconstruct actual starting locations before any visibility checks.
   // The server's snapshot may already contain final-turn coordinates.
   for(const u of units){const pos=start.get(String(u.id));if(pos){u.col=pos.col;u.row=pos.row;}}
   renderer.render();trace('replay-start',{day,moves:moves.length});
   try{
     for(let ti=1;ti<=10&&!replaySkip;ti++){
       const batch=moves.filter(e=>e.ti===ti);
       replayBar.querySelector('#gtReplayStatus').textContent='Day '+(day-1)+' · TI '+ti+'/10 · '+batch.length+' moves';
       const duration=()=>replaySpeed*1000;
       // Multiplayer replay is separate from the local movement engine: play a
       // movement recording for visible moves here, not just in app.js.
       const movingAudioUnits=batch.map(e=>byId.get(String(e.unitId))).filter(u=>u&&renderer.visibleDivision(u));
       if(movingAudioUnits.length&&!replaySkip){
         const types=[...new Set(movingAudioUnits.map(u=>u.type||'Infantry'))];
         // Simultaneous movement of different types is a genuine sound mix.
         for(const type of types)window.ARMAGEDDON_SOUND?.movement?.(type,{duration:duration()/1000});
         if(ti===1)trace('movement-audio',{status:window.ARMAGEDDON_SOUND?.status?.()||'unavailable',types});
       }
       let elapsed=0,previous=performance.now();
       while(elapsed<duration()&&!replaySkip){
         await nextFrame();const now=performance.now();if(replayPaused){previous=now;continue}
         elapsed+=Math.min(100,now-previous);previous=now;
         const fraction=Math.min(1,elapsed/duration());
         for(const e of batch){const u=byId.get(String(e.unitId));renderer.visualPositions.set(u.id,pixelTween(e.from,e.to,fraction))}
         renderer.render();
       }
       for(const e of batch){const u=byId.get(String(e.unitId));if(!u)continue;
         renderer.visualPositions.set(u.id,{...e.to});
         // Spotting checks in hex-map.js use actual unit coordinates. Update
         // after EACH resolved move so visible enemies appear/disappear now,
         // not only after the complete day finishes.
         u.col=e.to.col;u.row=e.to.row;
       }
       renderer.render();trace('replay-ti',{ti,moves:batch.length});
       for(const battle of combats.filter(e=>e.ti===ti)){if(replaySkip)break;await showBattleReport(battle,day,byId,renderer);}
       const retreatBatch=retreats.filter(e=>e.ti===ti);
       const advances=retreatBatch.filter(e=>e.type==='advance');
       if(advances.length){
         trace('advance-after-combat',{day:day-1,ti,advances:advances.map(e=>({unitId:e.unitId,from:e.from,to:e.to}))});
         replayBar.querySelector('#gtReplayStatus').textContent='ADVANCE AFTER COMBAT · '+advances.map(e=>byId.get(String(e.unitId))?.name||e.unitId).join(', ');
       }
       if(retreatBatch.length&&!replaySkip){
         if(retreatBatch.some(e=>e.type==='retreat'))window.ARMAGEDDON_SOUND?.retreat?.();
         const start=performance.now();
         while(!replaySkip){const f=Math.min(1,(performance.now()-start)/4000);
           for(const e of retreatBatch){const u=byId.get(String(e.unitId));if(u)renderer.visualPositions.set(u.id,pixelTween(e.from,e.to,f));}
           renderer.render();if(f>=1)break;await nextFrame();
         }
         for(const e of retreatBatch){const u=byId.get(String(e.unitId));if(u){renderer.visualPositions.set(u.id,{...e.to});u.col=e.to.col;u.row=e.to.row;}}
         renderer.render();
       }
       for(const e of surrenders.filter(e=>e.ti===ti)){window.ARMAGEDDON_SOUND?.surrender?.();const u=byId.get(String(e.unitId));if(u)u.destroyed=true;renderer.render();}
       for(const event of productions.filter(e=>e.ti===ti)){
         if(replaySkip)break;
         // Production is authoritative at TI 10, so place its counter at the
         // same moment the arrival notification is displayed.
         if(event.unitId&&!byId.has(String(event.unitId))&&event.hex){
           const fresh={id:event.unitId,name:event.unitType+' Reinforcement',side:event.side,type:event.unitType||'Infantry',
             col:event.hex.col,row:event.hex.row,strength:10000,effectiveness:100,experience:90,supply:1,tis:0};
           units.push(fresh);byId.set(String(fresh.id),fresh);renderer.render();
         }
         await showProductionReport(event,day,renderer);
       }
     }
   }finally{
     await applyServerPositions(day);renderer.visualPositions.clear();
     window.ARMAGEDDON_EXECUTION_HIDE_ROUTES=false;renderer.render();
     replayBar.hidden=true;replayBusy=false;trace('replay-complete',{day,skipped:replaySkip,moves:moves.length});if(current?.day===day)void acknowledgePacification(current);
   }
 }
 async function applyServerPositions(day){
   const game=window.ARMAGEDDON_M2,clock=window.ARMAGEDDON_M3;
   if(!game?.scenario?.divisions||!clock?.engine){trace('position-apply-blocked',{day,hasScenario:!!game?.scenario,hasDivisions:!!game?.scenario?.divisions,hasClock:!!clock?.engine});return;}
   const result=await api(base+'/positions?token='+encodeURIComponent(ident.token));
   trace('positions-response',{requestedDay:day,responseDay:result.day,divisions:result.divisions?.length});if(result.day!==day){trace('position-day-mismatch',{day,responseDay:result.day});return;}
   const byId=new Map(result.divisions.map(d=>[String(d.id),d]));
   // A completed production is created by the server; add new divisions before reconciliation.
   for(const updated of result.divisions||[])if(!game.scenario.divisions.some(u=>String(u.id)===String(updated.id)))
     game.scenario.divisions.push({...updated,type:updated.type||'Infantry',side:updated.side||'Blue',name:updated.name||String(updated.id)});
   for(const unit of game.scenario.divisions){const updated=byId.get(String(unit.id));if(!updated)continue;
     unit.col=updated.col;unit.row=updated.row;unit.tis=updated.tis;
     if(Number.isFinite(updated.supply))unit.supply=updated.supply;
     if(Number.isFinite(updated.experience))unit.experience=updated.experience;
     if(Number.isFinite(updated.replacementsOnWay))unit.replacementsOnWay=updated.replacementsOnWay;
     if(Number.isFinite(updated.totalReplacementsReceived))unit.totalReplacementsReceived=updated.totalReplacementsReceived;
     if(Number.isFinite(updated.strength))unit.strength=updated.strength;
     if(Number.isFinite(updated.effectiveness))unit.effectiveness=updated.effectiveness;
     if(Number.isFinite(updated.totalCasualties))unit.totalCasualties=updated.totalCasualties;
     unit.destroyed=!!updated.destroyed;
   }
   const cityState=window.ARMAGEDDON_M3?.cities;
   if(cityState?.state){
     for(const info of result.cities||[]){const entry=cityState.state.find(c=>c.city?.name===info.name);if(entry){entry.owner=info.owner;entry.city.side=info.owner;entry.pacification=info.pacification;entry.occupier=info.occupier;entry.production=info.production;entry.productions=info.productions||{};}}
     if(result.treasury)Object.assign(cityState.treasury,result.treasury);
     cityState.render?.();
   }
   clock.engine.day=day;clock.engine.ti=0;
   // M6.209: remove waypoints actually traversed, leaving the residual plot
   // visible in the next Planning phase. The server must independently retain
   // the authoritative route; local graphics cannot confer server orders.
   const events=current?.executionEvents||[];
   const unitMap=new Map(game.scenario.divisions.map(u=>[String(u.id),u]));
   for(const [routeId,waypoints] of [...game.planner.routes.entries()]){
     const moved=events.filter(e=>e.type==='move'&&String(e.unitId)===String(routeId));
     if(!Array.isArray(waypoints)||!waypoints.length)continue;
     const unit=unitMap.get(String(routeId));
     if(!unit||unit.destroyed){game.planner.routes.delete(routeId);continue;}
     let consumed=0;
     for(const ev of moved){
       const step=waypoints.findIndex((p,i)=>i>=consumed&&p.col===ev.to?.col&&p.row===ev.to?.row);
       if(step>=consumed)consumed=step+1;
     }
     if(consumed)game.planner.routes.set(routeId,waypoints.slice(consumed));
   }
   // Restore the original movement target association for positive credit.
   if(clock.engine.lastRouteHeads)for(const unit of game.scenario.divisions){
     const route=game.planner.get(unit.id);
     clock.engine.lastRouteHeads.set(unit.id,route?.length?route[0].col+','+route[0].row:null);
   }
   game.renderer.visualPositions?.clear();game.renderer.render();
   const label=document.getElementById('tiLabel');if(label)label.textContent='Day '+day+' · Planning';
   const gameClock=document.getElementById('gameClock');if(gameClock)gameClock.textContent='Turn '+day+' 7:00';
   lastAppliedDay=day;trace('positions-applied',{day,matched:game.scenario.divisions.filter(d=>byId.has(String(d.id))).length});
 }
 async function submitPlottedRoutes(){
   const game=window.ARMAGEDDON_M2;if(!game?.planner||!game?.scenario)throw Error('Battlefield not initialized in browser');
   const me=current.players.find(p=>p.id===ident.playerId);
   const ownership=current.assetOwners||window.ARMAGEDDON_ASSET_OWNERS||{};
   const orders=game.scenario.divisions.filter(d=>d.side===me.side&&!d.destroyed&&ownership['unit:'+String(d.id)]===ident.playerId&&game.planner.get(d.id).length)
     .map(d=>({type:'move',unitId:String(d.id),route:game.planner.get(d.id).map(x=>({col:x.col,row:x.row}))}));
   trace('submitting-orders',{count:orders.length,units:orders.slice(0,20).map(o=>({id:o.unitId,route:o.route}))});await api(base+'/orders',{method:'POST',body:JSON.stringify({token:ident.token,orders})});trace('orders-accepted',{count:orders.length});
 }
 let displayedPacificationTurn=0,seenRestoreEpoch=undefined;
 async function acknowledgePacification(st){
  const notices=st.pacificationNotices||[];
  if(!notices.length||st.pacificationAcknowledged||displayedPacificationTurn===st.day||replayBusy)return;
  displayedPacificationTurn=st.day;
  const blocker=document.createElement('div');blocker.id='gtPacificationNotice';blocker.style.cssText='position:fixed;inset:0;z-index:100030;background:#0008;display:flex;align-items:center;justify-content:center';
  const panel=document.createElement('section');panel.style.cssText='width:min(440px,92vw);max-height:75vh;overflow:auto;background:#10283c;border:2px solid #e9b04c;border-radius:9px;padding:20px;color:white;font:15px Arial,sans-serif;box-shadow:0 8px 36px #000a';
  const heading=document.createElement('h2');heading.textContent='Turn '+st.day+' — City Pacification';panel.append(heading);
  const label=document.createElement('p'),level=document.createElement('p');level.style.fontSize='20px';
  const ok=document.createElement('button');ok.style.cssText='padding:10px;background:#245b88;color:white;border:1px solid #aac;border-radius:5px';panel.append(label,level,ok);blocker.append(panel);document.body.append(blocker);
  const pointer=document.createElement('div');pointer.style.cssText='position:fixed;z-index:100031;pointer-events:none;color:#ffc144;font-size:40px;text-shadow:0 2px 4px #000';document.body.append(pointer);
  let index=0;
  function show(){const notice=notices[index];label.textContent='City '+(index+1)+' of '+notices.length+': '+notice.cityName+' · '+(notice.side==='Blue'?'Bluenstein':'Redonia');level.textContent='Pacification level '+notice.progress+'/5';ok.textContent=index===notices.length-1?'Acknowledge — Begin Planning':'Acknowledge — Next City';
   const renderer=window.ARMAGEDDON_M2?.renderer;
   if(renderer&&notice.hex){renderer.centerOnHex(notice.hex.col,notice.hex.row);const p=renderer.worldPixel(notice.hex.col,notice.hex.row),r=renderer.canvas.getBoundingClientRect();pointer.style.left=Math.max(4,r.left+p.x*r.width/renderer.dims.w-12)+'px';pointer.style.top=Math.max(4,r.top+p.y*r.height/renderer.dims.h-55)+'px';pointer.textContent='↓';}
  }
  ok.onclick=async()=>{if(++index<notices.length){show();return;}ok.disabled=true;try{await api(base+'/pacification-ack',{method:'POST',body:JSON.stringify({token:ident.token,turn:st.day})});blocker.remove();pointer.remove();await refresh()}catch(e){ok.disabled=false;index=notices.length-1;alert(e.message)}};
  show();
 }
 async function refresh(){try{const st=await api(base+'/state?token='+encodeURIComponent(ident.token));if(seenRestoreEpoch!==undefined&&st.restoreEpoch&&st.restoreEpoch!==seenRestoreEpoch){location.reload();return;}seenRestoreEpoch=st.restoreEpoch||null;current=st;
   const cityState=window.ARMAGEDDON_M3?.cities;
   if(cityState&&st.treasury&&Number(st.economyRevision)!==lastEconomyRevision){
     lastEconomyRevision=Number(st.economyRevision)||0;
     Object.assign(cityState.treasury,st.treasury);cityState.render?.();
   }
   // Render all allied human routes, without revealing opposing-side orders.
   const battlefield=window.ARMAGEDDON_M2;
   if(battlefield?.renderer){
     const allies=new Map();
     for(const order of st.allyOrders||[])if(order.type==='move'&&Array.isArray(order.route)){
       allies.set(String(order.unitId),order.route.map(p=>({col:p.col,row:p.row})));
     }
     battlefield.renderer.allyRoutes=allies;
     if(st.phase==='planning'&&!replayBusy)battlefield.renderer.render();
   }
   // Every new planning day begins with its own server-synchronization signature.
   if(routePublishDay!==st.day){routePublishDay=st.day;lastSentRouteSignature=null;}
   if(st.phase==='planning'&&!replayBusy){
     const mine=st.players.find(p=>p.id===ident.playerId);
     if(mine&&!mine.ready&&!routePublishBusy&&battlefield?.planner&&battlefield?.scenario){
       const owned=st.assetOwners||window.ARMAGEDDON_ASSET_OWNERS||{};
       const localOrders=battlefield.scenario.divisions.filter(d=>d.side===mine.side&&!d.destroyed&&owned['unit:'+String(d.id)]===ident.playerId&&battlefield.planner.get(d.id).length)
         .map(d=>({type:'move',unitId:String(d.id),route:battlefield.planner.get(d.id).map(p=>({col:p.col,row:p.row}))}));
       const signature=JSON.stringify(localOrders);
       // Do not erase server carryover orders before positions/routes load.
       if(lastSentRouteSignature===null&&st.myOrders?.length&&!localOrders.length){
         // Server holds a legitimate unfinished route; show it and preserve it.
         for(const o of st.myOrders)if(o.type==='move'&&o.route?.length&&owned['unit:'+String(o.unitId)]===ident.playerId)
           battlefield.planner.routes.set(String(o.unitId),o.route.map(x=>({col:x.col,row:x.row})));
         lastSentRouteSignature=JSON.stringify(st.myOrders.filter(o=>o.type==='move'));
         battlefield.renderer.render();
       }else if(signature!==lastSentRouteSignature){
         routePublishBusy=true;
         api(base+'/orders',{method:'POST',body:JSON.stringify({token:ident.token,orders:localOrders})})
           .then(()=>{lastSentRouteSignature=signature})
           .catch(e=>trace('live-route-publication-error',{error:e.message}))
           .finally(()=>{routePublishBusy=false});
       }
     }
   }
   if(st.day===lastAppliedDay&&!replayBusy)void acknowledgePacification(st);trace('server-state',{day:st.day,phase:st.phase,status:st.executionStatus,ready:st.players.filter(p=>p.role==='active'&&p.online&&p.ready).length,events:st.executionEvents?.length,trace:st.executionTrace?.slice(-5)});
   // Clear planned route overlays as soon as server leaves Planning.
   // Do not erase orders while waiting for other players to become Ready.
   if(st.phase!=='planning' && !replayBusy){window.ARMAGEDDON_EXECUTION_HIDE_ROUTES=true;window.ARMAGEDDON_M2?.renderer?.render();}
   if(st.phase==='planning'&&!replayBusy)window.ARMAGEDDON_EXECUTION_HIDE_ROUTES=false;
   if(st.day>lastAppliedDay&&!replayBusy){if(st.executionEvents?.some(e=>e.type==='move'||e.type==='combat'||e.type==='production'))playServerMovements(st.day,st.executionEvents).catch(e=>trace('replay-error',{error:e.message}));else await applyServerPositions(st.day);}
status.textContent='Day '+st.day+' · '+st.phase+' · '+st.players.filter(p=>p.role==='active'&&p.online&&p.ready).length+'/'+st.players.filter(p=>p.role==='active').length+' Ready' + (st.executionStatus==='paused-combat-required'?' · STOPPED: combat required (movement only)':st.executionStatus==='movement-completed'?' · Delegation and ownership day completed':st.executionStatus?.startsWith('movement-error')?' · '+st.executionStatus:'');if(st.phase==='planning'&&st.players.some(p=>p.role==='active'&&!p.online))status.textContent+=' · Offline players block execution until they reconnect and mark Ready, or are explicitly kicked by their side’s senior player';if(st.executionEvents?.length){status.textContent+=' · '+st.executionEvents.filter(e=>e.type==='move').length+' moves recorded';}players.replaceChildren();for(const p of st.players){const line=document.createElement('div');line.className='gt-member';const name=document.createElement('span');name.textContent='#'+p.seniority+' · '+p.name+' · ';name.style.borderLeft='5px solid '+(p.color||'#ccc');name.style.paddingLeft='6px';const side=document.createElement('strong');side.textContent=p.side==='Blue'?'Bluenstein':p.side==='Red'?'Redonia':p.side;side.style.color=p.side==='Blue'?'#65b0ff':'#ff7777';name.append(side);const state=document.createElement('strong');state.textContent=p.online?(p.ready?'Ready':'Not Ready'):'Offline · Not Ready';state.style.color=(p.online&&p.ready)?'#7de3a3':'#ffbd62';line.append(name,state);
 if(p.id!==ident.playerId&&p.role==='active'&&st.phase==='planning'&&st.players.filter(x=>x.role==='active'&&x.side===p.side).sort((a,b)=>a.seniority-b.seniority)[0]?.id===ident.playerId){
  const kick=document.createElement('button');kick.type='button';kick.textContent='Kick';kick.title='Explicitly kick this teammate and transfer their assets to the senior remaining teammate';kick.style.cssText='font-size:11px;margin-left:5px';
  kick.onclick=async()=>{if(!confirm('Remove '+p.name+' from this game? Their units will be reassigned to the senior player on their side.'))return;try{await api(base+'/kick',{method:'POST',body:JSON.stringify({token:ident.token,playerId:p.id})});await refresh()}catch(err){alert(err.message)}};line.append(kick);
 }
 players.append(line)}const me=st.players.find(p=>p.id===ident.playerId);ready.textContent=replayBusy?'Executing':st.phase!=='planning'?'Executing':me?.ready?'Waiting':'Planning';ready.className=(replayBusy||me?.ready)?'gt-ready':'gt-notready';ready.disabled=replayBusy||me?.role!=='active'||st.phase!=='planning';const toolbarReady=document.getElementById('readyButton');if(toolbarReady){toolbarReady.textContent=replayBusy?'READY · REPLAY':me?.ready?'READY':'NOT READY';toolbarReady.style.background=(replayBusy||me?.ready)?'#15803d':'#d97706';toolbarReady.style.color='#fff';toolbarReady.disabled=ready.disabled;toolbarReady.setAttribute('aria-pressed',String(!!me?.ready));}if(!voice.hidden)renderChannels();box.querySelector('.gt-drag span').textContent='Players · '+st.phase;}catch(e){trace('refresh-error',{error:e.message});status.textContent='Server: '+e.message}}
 ready.onclick=async()=>{try{if(!current||current.phase!=='planning')return;if((current.pacificationNotices||[]).length&&!current.pacificationAcknowledged){void acknowledgePacification(current);return;}window.ARMAGEDDON_SOUND?.unlock?.();window.ARMAGEDDON_SOUND?.unlockMedia?.();ready.disabled=true;const me=current?.players.find(p=>p.id===ident.playerId);trace('ready-click',{day:current.day,readyBefore:!!me?.ready});if(!me?.ready)await submitPlottedRoutes();trace('sending-ready',{ready:!me?.ready});if(!me?.ready){ready.textContent='Waiting';ready.className='gt-ready';const bar=document.getElementById('readyButton');if(bar){bar.textContent='READY';bar.style.background='#15803d';}}await api(base+'/ready',{method:'POST',body:JSON.stringify({token:ident.token,ready:!me?.ready})});trace('ready-accepted',{ready:!me?.ready});await refresh()}catch(e){trace('ready-error',{error:e.message});alert(e.message);await refresh()}};
 // Server turn-start autosaves: host can load one of the ten retained turns.
 const autoButton=document.createElement('button');autoButton.type='button';autoButton.textContent='Auto Saves';autoButton.className='text-button';autoButton.style.marginLeft='5px';
 document.getElementById('saveGameButton')?.after(autoButton);
 autoButton.onclick=async()=>{try{
  const saves=await api(base+'/autosaves?token='+encodeURIComponent(ident.token));
  const modal=document.createElement('section');modal.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100020;width:min(440px,94vw);max-height:80vh;overflow:auto;background:#10283c;color:white;padding:20px;border:2px solid #e9b04c;border-radius:10px';
  const title=document.createElement('h2');title.textContent='Turn-Start Auto Saves (last 10)';modal.append(title);
  const intro=document.createElement('p');intro.textContent='Loading discards all progress and orders within the selected turn. Only the game host can load.';modal.append(intro);
  for(const turn of saves.turns){const b=document.createElement('button');b.type='button';b.textContent='Load beginning of Turn '+turn;b.style.cssText='display:block;margin:8px 0;padding:8px 12px';b.onclick=async()=>{if(!confirm('Restart game from the beginning of Turn '+turn+'? All players will lose current turn progress.'))return;try{await api(base+'/autosaves/load',{method:'POST',body:JSON.stringify({token:ident.token,turn})});modal.remove();location.reload()}catch(e){alert(e.message)}};modal.append(b)}
  const close=document.createElement('button');close.textContent='Close';close.onclick=()=>modal.remove();modal.append(close);document.body.append(modal);
 }catch(e){alert('Autosave list unavailable: '+e.message)}};
 // Separate, movable voice-channel selection window. Voice transmission is deliberately
 // unavailable until a server-mediated WebRTC signaling/voice implementation exists.
 const voice=document.createElement('section');voice.id='gtVoiceWindow';voice.hidden=true;
 voice.innerHTML='<div id="gtVoiceDrag" class="gt-voice-title"><strong>Communications · Live Voice</strong><button type="button" id="gtVoiceClose" aria-label="Close communications">Close</button></div><div class="gt-voice-content"><p>Select a voice channel:</p><div id="gtVoiceChannels"></div><p id="gtVoiceSelection" aria-live="polite">No channel selected.</p><button type="button" id="gtVoicePTT" disabled>Push to Talk (unavailable)</button><p id="gtVoiceWarning">Live voice is not connected. The server needs WebRTC signaling and cross-team notification delivery before Push to Talk can be enabled.</p></div>';
 document.body.append(voice);
 const channels=voice.querySelector('#gtVoiceChannels'),selection=voice.querySelector('#gtVoiceSelection');
 let selectedChannel=null;
 function choose(label,kind,recipient){selectedChannel={kind,recipient};selection.textContent='Selected: '+label+'. Voice transmission is not yet available.';for(const b of channels.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.channel===kind+':'+(recipient||'')))}
 function renderChannels(){channels.replaceChildren();const me=current?.players?.find(p=>p.id===ident.playerId);if(!me)return;
  function add(label,kind,recipient,otherSide){const b=document.createElement('button');b.type='button';b.textContent=label+(otherSide?' · Opposing team':'');b.dataset.channel=kind+':'+(recipient||'');b.setAttribute('aria-pressed',String(selectedChannel?.kind===kind&&selectedChannel?.recipient===recipient));b.onclick=()=>choose(label,kind,recipient);channels.append(b)}
  add('Common — All Players','common',null,false);add('Team — '+(me.side==='Blue'?'Bluenstein':'Redonia'),'team',null,false);
  for(const p of current.players){if(p.id!==ident.playerId)add('Private — '+p.name,'private',p.id,p.side!==me.side)}
 }
 comm.onclick=()=>{voice.hidden=!voice.hidden;if(!voice.hidden)renderChannels()};
 voice.querySelector('#gtVoiceClose').onclick=()=>{voice.hidden=true};
 const voiceHandle=voice.querySelector('#gtVoiceDrag');let voiceDrag=null;
 voiceHandle.addEventListener('pointerdown',e=>{if(e.target.closest('button')||e.button!==0)return;const r=voice.getBoundingClientRect();voiceDrag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};voiceHandle.setPointerCapture(e.pointerId);e.preventDefault()});
 voiceHandle.addEventListener('pointermove',e=>{if(!voiceDrag)return;voice.style.left=Math.max(0,Math.min(innerWidth-voice.offsetWidth,voiceDrag.left+e.clientX-voiceDrag.x))+'px';voice.style.top=Math.max(0,Math.min(innerHeight-voice.offsetHeight,voiceDrag.top+e.clientY-voiceDrag.y))+'px'});
 for(const ev of ['pointerup','pointercancel'])voiceHandle.addEventListener(ev,()=>voiceDrag=null);
 document.getElementById('readyButton')?.addEventListener('click',e=>{e.stopImmediatePropagation();e.preventDefault();ready.click()},true);
 window.armageddonSubmitOrders=async orders=>api(base+'/orders',{method:'POST',body:JSON.stringify({token:ident.token,orders})});
 refresh();setInterval(refresh,1000);
})();
