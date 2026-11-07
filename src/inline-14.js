
// M6.79 presence: each open player session sends a heartbeat every ten seconds.
(function(){
 const params=new URLSearchParams(location.search);
 const send=()=>{
  const gameId=params.get('gameId')||params.get('initLobby')||params.get('joinGame')||sessionStorage.getItem('armageddon_active_game');
  if(!gameId)return;
  let identity;try{identity=JSON.parse(sessionStorage.getItem('armageddon_identity_'+gameId)||'null');}catch(_){}
  if(!identity?.token)return;
  fetch('https://gametopia-backend.onrender.com/api/games/'+encodeURIComponent(gameId)+'/heartbeat',{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:identity.token}),cache:'no-store',keepalive:true
  }).catch(()=>{});
 };
 send();setInterval(send,10000);window.addEventListener('pageshow',send);
})();
window.armServerRequest=async function(path,options={}){
 const response=await fetch(path.startsWith('/api/')?'https://gametopia-backend.onrender.com'+path:path,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(result.error||('HTTP '+response.status));
 return result;
};
(function(){
 const lobby=document.getElementById('mpLobby'),panel=document.getElementById('mpLobbyPanel');
 const params=new URLSearchParams(location.search);
 if(params.has('size')||params.has('skipLobby')||params.has('returnSetup'))return;
 lobby.hidden=false;
 const api=window.armServerRequest;
 let lobbyWatch=null;
 function stopLobbyWatch(){if(lobbyWatch!==null){clearInterval(lobbyWatch);lobbyWatch=null;}if(initRefresh!==null){clearInterval(initRefresh);initRefresh=null;}}
 let initRefresh=null;function startInitiationRefresh(id){if(initRefresh!==null)clearInterval(initRefresh);initRefresh=setInterval(async()=>{if(document.hidden||!document.getElementById('gtInitiationMembers'))return;try{const games=await api('/api/games');const g=games.find(x=>x.id===id);const members=document.getElementById('gtInitiationMembers');if(!g||!members)return;members.replaceChildren();for(const p of g.players){const line=document.createElement('p');line.style.borderLeft='12px solid '+(p.color||'#777');line.style.paddingLeft='10px';line.append(document.createTextNode(p.name+' — '));const nation=document.createElement('strong');nation.textContent=p.side==='Blue'?'Bluenstein':'Redonia';nation.style.color=p.side==='Blue'?'#50a5ff':'#ff6565';line.append(nation,document.createTextNode(p.id===g.players[0]?.id?' · Host — waiting to start':' · Joined — waiting'));members.append(line);}}catch(e){}},1800);}
 function gameLaunchQuery(g,id){const q=new URLSearchParams(g.query);let me=null;try{me=JSON.parse(sessionStorage.getItem('armageddon_identity_'+id)||'null');}catch(_){}q.set('gameId',id);if(me?.side)q.set('playerSide',me.side);return '?'+q.toString();}
 function watchGameStart(id){stopLobbyWatch();let busy=false;const check=async()=>{if(busy||document.hidden)return;busy=true;try{const games=await api('/api/games');const g=games.find(x=>x.id===id);if(g&&g.status!=='lobby'){stopLobbyWatch();location.search=gameLaunchQuery(g,id);}}catch(e){const status=document.getElementById('gtLobbyWatchStatus');if(status)status.textContent='Connection interrupted; retrying automatically…';}finally{busy=false;}};lobbyWatch=setInterval(check,1500);check();}
 function btn(text,fn){const b=document.createElement('button');b.textContent=text;b.onclick=fn;return b;}
 function clear(title,note){panel.replaceChildren();const h=document.createElement('h1');h.textContent=title;panel.appendChild(h);if(note){const p=document.createElement('p');p.textContent=note;panel.appendChild(p);}}
 function error(e){const p=document.createElement('p');p.className='mp-error';p.textContent=e.message||String(e);panel.appendChild(p);}
 function home(){stopLobbyWatch();location.href='armageddon-lobby.html';}

 const palette=['#e53935','#f57c00','#fbc02d','#7cb342','#00897b','#00acc1','#1e88e5','#3949ab','#8e24aa','#d81b60','#6d4c41','#78909c','#b0bec5','#ffffff','#263238','#9ccc65'];
 function colorPicker(taken,callback){
  clear('Choose Your Unit Color','Available colors are selectable. An X marks colors already taken; each occupied color shows its player name.');
  const grid=document.createElement('div');grid.className='gt-colors';panel.append(grid);
  for(const color of palette){const occupant=taken.find(p=>p.color===color);const tile=document.createElement('button');tile.type='button';tile.className='gt-color';tile.style.background=color;tile.style.color=['#ffffff','#fbc02d','#b0bec5','#9ccc65'].includes(color)?'#111':'#fff';tile.title=occupant?occupant.name+' — taken':'Available';tile.setAttribute('aria-label',occupant?occupant.name+' — unavailable':'Choose '+color);
   if(occupant){tile.disabled=true;const x=document.createElement('span');x.className='gt-color-x';x.textContent='✕';const name=document.createElement('span');name.className='gt-color-name';name.textContent=occupant.name.length>10?occupant.name.slice(0,9)+'…':occupant.name;tile.append(x,name);}else{tile.onclick=()=>callback(color);}grid.append(tile);
  }
 }
 function create(){panel.innerHTML='<h1>Create a Game</h1><form id="mpCreateForm"><label>Your display name<input name="player" maxlength="50" required autocomplete="nickname"></label><label>Game name<input name="game" maxlength="90" required></label><label>Optional description<textarea name="description" maxlength="500" rows="3"></textarea></label><button type="submit">Continue to Game Setup</button><button type="button" id="mpBack">Back</button></form>';
 panel.querySelector('#mpBack').onclick=()=>{location.href='armageddon-lobby.html';};panel.querySelector('[name=player]').value=localStorage.getItem('armageddon_last_display_name')||'';panel.querySelector('[name=game]').value=localStorage.getItem('armageddon_last_game_name')||'';panel.querySelector('[name=description]').value=localStorage.getItem('armageddon_last_description')||'';
 panel.querySelector('form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const draft={player:String(f.get('player')),game:String(f.get('game')),description:String(f.get('description')||'')};localStorage.setItem('armageddon_last_display_name',draft.player);localStorage.setItem('armageddon_last_game_name',draft.game);localStorage.setItem('armageddon_last_description',draft.description);sessionStorage.setItem('armageddon_game_draft',JSON.stringify(draft));lobby.hidden=true;document.getElementById('storyStage').hidden=false;};
 }
 async function join(){clear('Join a Game','Games in Lobby or Planning');const list=document.createElement('div');list.className='mp-games';list.textContent='Loading…';panel.append(list,btn('Back',home));try{const games=await api('/api/games');list.replaceChildren();const open=games.filter(g=>g.status==='lobby'||g.status==='planning');if(!open.length)list.textContent='No games available during Lobby or Planning.';for(const g of open){const item=document.createElement('div');item.className='mp-game';const h=document.createElement('h2');h.textContent=g.name;const d=document.createElement('p');d.textContent='Host: '+g.creator+' · '+g.players.length+' player(s)';item.append(h,d,btn('Join Game',()=>joinColor(g)));list.append(item);}}catch(e){list.textContent='Server unavailable: '+e.message;}}
 async function joinColor(g){try{const games=await api('/api/games');const current=games.find(x=>x.id===g.id);if(!current)throw Error('Game no longer available');colorPicker(current.players||[],color=>joinName(g,color));panel.append(btn('Back',home));}catch(e){error(e);}}
 function joinName(g,color){clear('Join Game','Your personal color has been selected.');const form=document.createElement('form');form.innerHTML='<label>Player name<input name="name" required maxlength="50"></label><button type="submit">Continue to Initiation Screen</button>';panel.append(form,btn('Back',home));form.querySelector('input').value=localStorage.getItem('armageddon_last_display_name')||'';form.onsubmit=e=>{e.preventDefault();const name=form.querySelector('input').value.trim();if(!name)return;localStorage.setItem('armageddon_last_display_name',name);sessionStorage.setItem('gt_join_draft',JSON.stringify({gameId:g.id,color,name}));init(g.id);};}
 async function init(id){sessionStorage.setItem('armageddon_active_game',id);stopLobbyWatch();try{const games=await api('/api/games');const g=games.find(x=>x.id===id);if(!g)throw Error('Game not found');if(g.status!=='lobby'){const saved=sessionStorage.getItem('armageddon_identity_'+id);if(saved){location.search=gameLaunchQuery(g,id);return;}if(g.status!=='planning')throw Error('Joining is available during Planning only');}const identity=JSON.parse(sessionStorage.getItem('armageddon_identity_'+id)||'null');const joinDraft=JSON.parse(sessionStorage.getItem('gt_join_draft')||'null');const host=!!identity&&g.players[0]?.id===identity.playerId;clear('Game Initiation — '+g.name,g.status==='planning'?'Join the current Planning phase. Units and cities are received only by delegation.':'Waiting for the host to start. Players may join either side.');const members=document.createElement('div');members.className='mp-games';members.id='gtInitiationMembers';for(const p of g.players){const line=document.createElement('p');line.textContent=p.name+' — ';const nation=document.createElement('span');nation.textContent=p.side==='Blue'?'Bluenstein':p.side==='Red'?'Redonia':p.side;nation.style.color=p.side==='Blue'?'#50a5ff':'#ff6565';nation.style.fontWeight='bold';line.append(nation);const status=document.createElement('span');status.textContent=p.id===g.players[0]?.id?' · Host — waiting to start':' · Joined — waiting';status.style.cssText='font-size:13px;color:#b9cfe0';line.append(status);line.style.borderLeft='12px solid '+(p.color||'#777');line.style.paddingLeft='10px';members.append(line);}panel.append(members);
 if(!host&&!identity){const info=document.createElement('p');info.textContent='Choose the side you want to join:';panel.append(info);for(const side of ['Blue','Red'])panel.append(btn(side==='Blue'?'Join Bluenstein':'Join Redonia',async()=>{try{const r=await api('/api/games/'+encodeURIComponent(id)+'/join',{method:'POST',body:JSON.stringify({...joinDraft,side})});sessionStorage.setItem('armageddon_identity_'+id,JSON.stringify(r));sessionStorage.removeItem('gt_join_draft');if(g.status==='planning')location.search=gameLaunchQuery(g,id);else init(id);}catch(e){error(e);}}));panel.append(btn('Cancel',()=>{sessionStorage.removeItem('gt_join_draft');home();}));return;}
 if(host){panel.append(btn('Start Game',async()=>{try{await api('/api/games/'+encodeURIComponent(id)+'/start',{method:'POST',body:JSON.stringify({token:identity.token})});location.search=gameLaunchQuery(g,id);}catch(e){error(e);}}));panel.append(btn('Cancel Game',async()=>{if(!confirm('Cancel this game and return to Games Underway? All players waiting to join will be removed.'))return;try{await api('/api/games/'+encodeURIComponent(id)+'/cancel',{method:'POST',body:JSON.stringify({token:identity.token})});sessionStorage.removeItem('armageddon_identity_'+id);sessionStorage.removeItem('armageddon_active_game');stopLobbyWatch();location.href='armageddon-lobby.html';}catch(e){error(e);}}));startInitiationRefresh(id);}
 else{const watchStatus=document.createElement('p');watchStatus.id='gtLobbyWatchStatus';watchStatus.textContent='Waiting for host — automatically entering when game starts…';panel.append(watchStatus);panel.append(btn('Cancel Joining',async()=>{try{await api('/api/games/'+encodeURIComponent(id)+'/leave',{method:'POST',body:JSON.stringify({token:identity.token})});sessionStorage.removeItem('armageddon_identity_'+id);sessionStorage.removeItem('armageddon_active_game');stopLobbyWatch();join();}catch(e){error(e);}}));watchGameStart(id);}
 }catch(e){clear('Initiation Error');error(e);panel.append(btn('Back',home));}}
 async function hostColor(){
  const draft=JSON.parse(sessionStorage.getItem('armageddon_game_draft')||'null');
  const query=sessionStorage.getItem('armageddon_setup_query');
  if(!draft||!query){location.href='armageddon-lobby.html';return;}
  colorPicker([],async color=>{
    try{
      const response=await api('/api/games',{method:'POST',body:JSON.stringify({name:draft.game,creator:draft.player,description:draft.description||'',query,color})});
      sessionStorage.setItem('armageddon_identity_'+response.id,JSON.stringify({playerId:response.creatorId,token:response.creatorToken,side:'Blue'}));
      sessionStorage.removeItem('armageddon_game_draft');sessionStorage.removeItem('armageddon_setup_query');
      init(response.id);
    }catch(e){error(e);}
  });
  panel.append(btn('Back to Game Setup',()=>{location.search='?returnSetup=1';}));
 }
 if(params.has('chooseHostColor'))hostColor();else if(params.has('initLobby'))init(params.get('initLobby'));else if(params.has('createLobby'))create();else if(params.has('joinGame')){(async()=>{try{const games=await api('/api/games');const game=games.find(g=>g.id===params.get('joinGame'));if(!game)throw Error('Game no longer available');const identity=sessionStorage.getItem('armageddon_identity_'+game.id);if(identity)init(game.id);else joinColor(game);}catch(e){clear('Unable to Join Game');error(e);panel.append(btn('Back to Games',()=>location.href='armageddon-lobby.html'));}})();}else if(params.has('joinLobby'))home();else location.replace('armageddon-lobby.html');
})();
