(function(global){
  // Approved production costs in RP and production times in turns.
  const specs={Infantry:{cost:6,turns:3},Motorized:{cost:8,turns:4},Mechanized:{cost:10,turns:5},Armored:{cost:12,turns:6}};
  function create(scenario,terrainAt,renderer){
    const cities=global.ARMAGEDDON_CITIES||[];
    const treasury={Blue:Number(global.ARMAGEDDON_SETUP?.handicap?.Blue?.rp)||0,Red:Number(global.ARMAGEDDON_SETUP?.handicap?.Red?.rp)||0};
    const reserves={Blue:[],Red:[]};let deployment=null;let serial=0;
    const onChange=()=>{const blue=document.getElementById("rpBlueTotal"),red=document.getElementById("rpRedTotal"),count=document.getElementById("reinforcementCount");if(blue)blue.textContent=treasury.Blue.toFixed(1);if(red)red.textContent=treasury.Red.toFixed(1);if(count)count.textContent=String(reserves.Blue.length+reserves.Red.length);};
    const state=cities.map(c=>({city:c,pacification:Math.max(0,Number(c.pacification)||0),production:null,productions:{},owner:c.side,occupier:null}));
    const panel=document.getElementById('cityPanel'),body=document.getElementById('cityBody'),title=document.getElementById('cityTitle');
    let active=null;
    // City sovereignty is independent of military hex control.
    const owner=s=>s.owner;
    // A city is occupied when the opposing side militarily controls its city-center
    // hex, even if the occupying division stands in an adjacent hex. The map
    // control overlay and city pacification must use the same control source.
    const occupation=s=>{
      const control=renderer.controlAt(s.city.c,s.city.r);
      return control==='Blue'||control==='Red'?control:null;
    };
    function updateOccupation(){
      for(const s of state){
        const occupying=occupation(s);
        if(occupying===s.owner){s.occupier=null;s.pacification=0;continue;}
        if(occupying!==s.occupier){s.occupier=occupying;s.pacification=0;}
        // Never destroy a pending production job when an enemy gains control.
        // Any pacification > 0 freezes it, preserving the owner's RP investment
        // and the opportunity to cancel for a full refund.
      }
    }
    function advancePacification(){
      // Refresh territorial control after all moves and combat have resolved.
      renderer.refreshHexControl();
      updateOccupation();
      for(const s of state){
        if(!s.occupier||s.occupier===s.owner)continue;
        s.pacification++;
        if(s.pacification>=5){s.owner=s.occupier;s.city.side=s.owner;s.occupier=null;s.pacification=0;}
      }
      render();renderer.render();
    }
    const cityForHex=(col,row)=>{
      if(terrainAt(col,row)!=='Urban')return null;
      let found=null,dist=Infinity;
      for(const s of state){const c=s.city;const d=Math.hypot(c.c-col,c.r-row);if(d<dist){dist=d;found=s;}}
      return found&&dist<3?found:null;
    };
    function cityHexCount(s){
      // Count urban cells belonging to the nearest city center, rather than a city's center alone.
      let n=0;for(let row=0;row<scenario.rows;row++)for(let col=0;col<scenario.cols;col++)if(cityForHex(col,row)===s)n++;
      return n;
    }
    const productionSlots=s=>{s.productions=s.productions||{};if(s.production){const k=s.city.c+','+s.city.r;s.productions[k]??=s.production;s.production=null;}return s.productions;};
    const productionHexes=s=>{const hexes=[];for(let row=0;row<scenario.rows;row++)for(let col=0;col<scenario.cols;col++)if(cityForHex(col,row)===s)hexes.push({col,row});return hexes;};
    const canManage=s=>!global.ARMAGEDDON_M3?.executing && (global.ARMAGEDDON_ASSET_CONTROL ? global.ARMAGEDDON_ASSET_CONTROL.owns('city',String(s.city.name)) : (global.ARMAGEDDON_PLAYER_SIDE===owner(s)||global.ARMAGEDDON_VIEW_MODE==='Both'));
    const showEnemyProduction=s=>owner(s)===global.ARMAGEDDON_PLAYER_SIDE || global.ARMAGEDDON_VIEW_MODE==='Both';
    function el(tag,content){const e=document.createElement(tag);if(content!==undefined)e.textContent=content;return e;}
    function line(k,v){const d=el('div');d.style.cssText='display:flex;justify-content:space-between;gap:12px;margin:9px 0';const a=el('span',k),b=el('strong',v);d.append(a,b);body.append(d);}
    function button(label,fn){const b=el('button',label);b.style.cssText='display:flex;align-items:center;justify-content:center;min-height:38px;width:100%;margin:7px 0;padding:9px;border:1px solid #9bb0c3;border-radius:6px;background:#294b61;color:#fff;cursor:pointer;text-align:center;box-sizing:border-box;line-height:1.2';b.onclick=fn;body.append(b);}
    async function sendProduction(cityName,action,type,hex){
      const gameId=new URLSearchParams(location.search).get('gameId');
      if(!gameId)return null; // Standalone local games retain their local rules.
      let ident;try{ident=JSON.parse(sessionStorage.getItem('armageddon_identity_'+gameId)||'null')}catch(_){}
      if(!ident?.token)throw Error('Multiplayer identity unavailable');
      return global.armServerRequest('/api/games/'+encodeURIComponent(gameId)+'/city-production',{
        method:'POST',body:JSON.stringify({token:ident.token,cityName,action,type,hex})});
    }
    function render(){onChange();if(!active||panel.hidden)return;const s=active,side=owner(s);title.textContent=s.city.name+(s.city.isCapital?' ★':'');title.style.color=side==='Blue'?'#64b0ff':'#ff7474';body.replaceChildren();const ownerId=global.ARMAGEDDON_ASSET_OWNERS?.['city:'+s.city.name];const ownerName=ownerId?global.ARMAGEDDON_PLAYER_NAMES?.[ownerId]:null;const controller=ownerName||((side==='Blue'?'Bluenstein':'Redonia')+' AI');line('Controlled by',controller);const controllerValue=body.lastElementChild?.querySelector('strong');if(controllerValue)controllerValue.style.color=global.ARMAGEDDON_PLAYER_COLORS?.[ownerId]||(side==='Blue'?'#64b0ff':'#ff7474');line('Pacification',s.occupier?`${s.pacification}/5 (${s.occupier} controlling)`:'None');if(canManage(s)&&!s.occupier)line('Resource Points (RP)',treasury[side].toFixed(1));line('City hexes',String(cityHexCount(s)));
      if(!showEnemyProduction(s)){line('Production','Unknown');}
      else {
        const paused=Number(s.pacification)>0||!!s.occupier;
        if(paused){const warning=el('p','PACIFICATION '+s.pacification+'/5 — production paused. Existing jobs will resume when pacification returns to 0. Cancel any job for a full RP refund.');warning.style.cssText='padding:10px;border:2px dashed #ffd34e;border-radius:6px;background:#5c3f1d;color:#fff3be;font-weight:bold';body.append(warning);}
        const slots=productionSlots(s),hexes=productionHexes(s);
        line('Production capacity',hexes.length+' city hexes');
        for(const hex of hexes){
          const key=hex.col+','+hex.row,prod=slots[key];
          const header=el('h3','Production slot '+(hexes.indexOf(hex)+1));header.style.cssText='font-size:13px;margin:13px 0 6px;border-top:1px solid #456078;padding-top:7px';body.append(header);
          if(prod){line(paused?'Paused production':'Producing',prod.type+' · '+prod.remaining+' turns remaining');
            if(canManage(s))button('Cancel production',async()=>{
              if(!window.confirm('Cancel '+prod.type+' production and refund '+prod.cost+' RP?'))return;
              try{const result=await sendProduction(s.city.name,'cancel',undefined,hex);
                if(result?.treasury)Object.assign(treasury,result.treasury);else treasury[side]+=prod.cost;
                delete slots[key];render();renderer.render();}catch(e){alert('Production cancellation failed: '+e.message)}
            });
          }else if(canManage(s)&&!paused){
            const types=Object.entries(specs).filter(([t,v])=>treasury[side]>=v.cost);
            for(const [type,v] of types)button(type+' · '+v.cost+' RP · '+v.turns+' turns',async()=>{
              try{const result=await sendProduction(s.city.name,'start',type,hex);
                if(result?.treasury)Object.assign(treasury,result.treasury);else treasury[side]-=v.cost;
                slots[key]=result?.production||{type,cost:v.cost,remaining:v.turns,side};render();renderer.render();
              }catch(e){alert('Production order failed: '+e.message)}
            });
          }
        }
      }
    }
    function open(s){global.ARMAGEDDON_CLOSE_DIVISION_PANEL?.();active=s;panel.hidden=false;render();}
    function close(){panel.hidden=true;active=null;}
    document.getElementById('cityClose').onclick=close;
    // RP upkeep per surviving division per day, charged before planning.
    // RP per soldier per game day; maintenance scales with actual manpower.
    const maintenanceRates={Infantry:0.000040,Motorized:0.000060,Mechanized:0.000080,Armored:0.000100};
    let lastMaintenance=null;
    function calculateMaintenance(){
      const totals={Blue:0,Red:0};
      for(const d of scenario.divisions){
        if(d.destroyed||d.strength<=0)continue;
        if(totals[d.side]!==undefined)totals[d.side]+=(maintenanceRates[d.type]||0)*d.strength;
      }
      // Divisions under production pay in proportion to completed turns.
      for(const s of state)for(const p of Object.values(productionSlots(s))){if(!p||s.occupier||Number(s.pacification)>0)continue;
        const spec=specs[p.type];if(!spec||totals[p.side]===undefined)continue;
        const elapsed=Math.max(0,Math.min(spec.turns,spec.turns-p.remaining));
        totals[p.side]+=(maintenanceRates[p.type]||0)*10000*elapsed/spec.turns;
      }
      return totals;
    }
    function chargeMaintenance(day){
      if(lastMaintenance&&lastMaintenance.day===day)return lastMaintenance;
      const totals=calculateMaintenance();
      for(const side of ['Blue','Red'])treasury[side]=Math.max(0,Math.round((treasury[side]-totals[side])*100)/100);
      lastMaintenance={day,totals};onChange();render();return lastMaintenance;
    }
    function awardTurn(){renderer.refreshHexControl();updateOccupation();for(const s of state){if(s.occupier||s.pacification>0)continue;const side=owner(s);if(side==='Blue'||side==='Red')treasury[side]+=cityHexCount(s);}onChange();render();}
    // Completed production deploys immediately: city, random adjacent, random open map hex.
    // Only water is impassable; mountains are valid division terrain.
    function autoDeploy(r){
      const city=r.city.city, side=r.side;
      const open=(col,row)=>col>=0&&row>=0&&col<scenario.cols&&row<scenario.rows
        &&terrainAt(col,row)!=='Lake'
        &&!scenario.divisions.some(d=>!d.destroyed&&d.strength>0&&d.col===col&&d.row===row);
      const choose=arr=>arr.length?arr[Math.floor(Math.random()*arr.length)]:null;
      const origin=r.origin||{col:city.c,row:city.r};let spot=open(origin.col,origin.row)?{...origin}:null;
      if(!spot){
        const q=origin.col-Math.floor(origin.row/2);
        const offsets=[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
        const adjacent=offsets.map(([dq,dr])=>{const row=origin.row+dr;return {col:q+dq+Math.floor(row/2),row};})
          .filter(p=>open(p.col,p.row));
        spot=choose(adjacent);
      }
      if(!spot){
        const candidates=[];
        for(let row=0;row<scenario.rows;row++)for(let col=0;col<scenario.cols;col++)
          if(open(col,row))candidates.push({col,row});
        // Prefer a friendly-controlled open hex, but do not hold production in reserve.
        const friendly=candidates.filter(p=>renderer.controlAt(p.col,p.row)===side);
        spot=choose(friendly.length?friendly:candidates);
      }
      if(!spot){console.error('No unoccupied land hex for completed reinforcement',r);return false;}
      const n=1+scenario.divisions.filter(d=>d.side===side).length;
      const id=side[0]+'-REINF-'+(++serial);
      scenario.divisions.push({id,side,name:n+'th '+r.type,type:r.type,
        strength:10000,effectiveness:100,experience:75,supply:1,tis:0,
        col:spot.col,row:spot.row});
      const location=spot.col===city.c&&spot.row===city.r?'in the city':'at hex '+spot.col+','+spot.row;
      const message=side+' '+r.type+' division produced at '+city.name+'; automatically deployed '+location+'.';
      const status=document.getElementById('routeStatus');if(status)status.textContent=message;
      // Keep the message in the persistent scrolling notification log if available.
      const log=document.getElementById('notificationLog');
      if(log){const item=document.createElement('div');item.textContent=message;log.appendChild(item);}
      return true;
    }
    function finishTurn(){
      advancePacification();
      for(const s of state)for(const [slot,prod] of Object.entries(productionSlots(s))){
        if(s.occupier||Number(s.pacification)>0)continue; // No progress or deployment during pacification.
        if(prod.remaining>0)prod.remaining--;
        if(prod.remaining===0){const [col,row]=slot.split(',').map(Number);
          const completed={type:prod.type,city:s,side:prod.side,origin:{col,row}};
          if(autoDeploy(completed))delete s.productions[slot];
        }
      }
      // Older saved games may contain reinforcements awaiting manual deployment.
      for(const side of ['Blue','Red']){
        for(const r of [...reserves[side]])if(autoDeploy(r))reserves[side].splice(reserves[side].indexOf(r),1);
      }
      onChange();render();renderer.render();
    }
    function beginDeployment(side){
      // Production deploys automatically; manual deployment is obsolete.
      return false;
      if(global.ARMAGEDDON_M3?.executing)return false;
      const list=reserves[side]||[];
      if(!list.length)return false;
      deployment=list[0];
      document.getElementById('routeStatus').textContent='Deploy '+deployment.type+' from '+deployment.city.city.name+': left-click an empty, friendly-controlled, passable hex of that city. Press Escape to cancel.';
      return true;
    }
    function planAIProduction(side){
      // One AI commander per side. Spend only available RP and use the normal production queue.
      const specs=global.ARMAGEDDON_CITY.specs;
      const count=type=>scenario.divisions.filter(d=>!d.destroyed&&d.strength>0&&d.side===side&&d.type===type).length;
      let ordered=0;
      for(const s of state){
        if(s.owner!==side||s.occupier||s.pacification>0)continue;
        if(renderer.controlAt(s.city.c,s.city.r)!==side)continue;
        // Prefer infantry to sustain a coherent front, then mobile support.
        const options=Object.keys(specs).filter(type=>treasury[side]>=specs[type].cost)
          .sort((a,b)=>(count(a)/(a==='Infantry'?4:1))-(count(b)/(b==='Infantry'?4:1)));
        for(const hex of productionHexes(s)){const slot=hex.col+','+hex.row;if(productionSlots(s)[slot])continue;
          const type=options.find(t=>treasury[side]>=specs[t].cost);if(!type)break;
          const {cost,turns}=specs[type];treasury[side]-=cost;
          s.productions[slot]={type,cost,remaining:turns,side};ordered++;
        }
      }
      if(ordered){onChange();render();renderer.render();}
      return ordered;
    }
    function deployAt(col,row){
      if(!deployment||global.ARMAGEDDON_M3?.executing)return false;
      const r=deployment,s=r.city;
      if(cityForHex(col,row)!==s||owner(s)!==r.side||s.occupier||s.pacification>0)return false;
      if(['Mountains','Lake'].includes(terrainAt(col,row)))return false;
      if(renderer.controlAt(col,row)!==r.side)return false;
      if(scenario.divisions.some(d=>!d.destroyed&&d.strength>0&&d.col===col&&d.row===row))return false;
      const n=1+scenario.divisions.filter(d=>d.side===r.side).length;
      scenario.divisions.push({id:r.side[0]+'-REINF-'+r.id,side:r.side,name:n+'th '+r.type,type:r.type,strength:10000,effectiveness:100,experience:75,supply:1,tis:0,col,row});
      reserves[r.side].splice(reserves[r.side].indexOf(r),1);
      deployment=null;onChange();render();renderer.render();
      document.getElementById('routeStatus').textContent='Reinforcement deployed. Select another unit or use Deploy Reinforcement for the next one.';
      return true;
    }
    function cancelDeployment(){deployment=null;}
    onChange();
    return {planAIProduction,cityForHex,cityHexCount,open,close,owner,updateOccupation,advancePacification,awardTurn,chargeMaintenance,maintenanceRates,setMaintenanceDay(day,totals){lastMaintenance={day,totals:totals&&Number.isFinite(totals.Blue)&&Number.isFinite(totals.Red)?{...totals}:calculateMaintenance()};},getMaintenance(){return lastMaintenance;},finishTurn,treasury,state,render,reserves,beginDeployment,deployAt,cancelDeployment,get deployment(){return deployment;},get activeCity(){return panel.hidden?null:active;}};
  }
  global.ARMAGEDDON_CITY={create,specs};
})(window);
