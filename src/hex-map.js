/* Pointy-top axial hex geometry and canvas map renderer. */
(function(global){
  const SQRT3=Math.sqrt(3);
  function axialToPixel(q,r,size){return {x:size*SQRT3*(q+r/2),y:size*1.5*r};}
  function pixelToAxial(x,y,size){
    const qf=(SQRT3/3*x-y/3)/size, rf=(2/3*y)/size;
    return axialRound(qf,rf);
  }
  function axialRound(q,r){
    const x=q,z=r,y=-x-z;let rx=Math.round(x),ry=Math.round(y),rz=Math.round(z);
    const dx=Math.abs(rx-x),dy=Math.abs(ry-y),dz=Math.abs(rz-z);
    if(dx>dy&&dx>dz)rx=-ry-rz;else if(dy>dz)ry=-rx-rz;else rz=-rx-ry;
    return {q:rx,r:rz};
  }
  function hexPoints(cx,cy,size){const pts=[];for(let i=0;i<6;i++){const a=(Math.PI/180)*(60*i-90);pts.push({x:cx+size*Math.cos(a),y:cy+size*Math.sin(a)});}return pts;}
  function drawHex(ctx,cx,cy,size,fill,stroke,lineWidth){const pts=hexPoints(cx,cy,size);ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.lineWidth=lineWidth;ctx.strokeStyle=stroke;ctx.stroke();return pts;}
  function hexKey(col,row){return `${col},${row}`;}
  function axialFromOffset(col,row){return {q:col-Math.floor(row/2),r:row};}
  function offsetFromAxial(q,r){return {col:q+Math.floor(r/2),row:r};}
  function terrainStyle(name){return ({Plains:{fill:"#778e63",detail:"#91a777"},Forest:{fill:"#496c4c",detail:"#67865b"},Hills:{fill:"#938765",detail:"#b3a47c"},River:{fill:"#507e91",detail:"#7db0c0"}})[name]||{fill:"#778e63",detail:"#91a777"};}
  class HexMapRenderer{
    constructor(canvas,scenario,terrainAt){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.scenario=scenario;this.terrainAt=terrainAt;this.baseSize=35;this.zoom=1;this.pan={x:0,y:0};this.selectedId=null;this.unitSymbolStyle='nato';this.unitArt={};for(const side of ['blue','red'])for(const type of ['infantry','motorized','mechanized','armored']){const key=side+'_'+type,img=new Image();img.onload=()=>this.render();img.src='src/unit_'+key+'.png';this.unitArt[key]=img;}this.hoverCell=null;this.selectedCityHex=null;this.routes=null;this.allyRoutes=new Map();this.showZoc=false;this.showControl=false;this.showCities=false;this.showSupply=false;this.cityStates=null;this.showTerrainTypes=false;this.showWaterCrossings=false;this.playtest=false;this.visualPositions=new Map();this.spottingPositions=new Map();this.satelliteLayer=null;this.cityTexture=null;this.lakeTexture=null;this.extraTextures={};this.hillHexes=[];this.approvedTerrain={};this.terrainVariants={};for(const [name,ext] of [['clear','jpg'],['forest','jpg'],['rough','jpg'],['swamp','jpg'],['mountains','jpg'],['city','jpg'],['lake','png']]){this.terrainVariants[name]=Array.from({length:(name==='clear'||name==='forest'||name==='swamp'||name==='rough'||name==='mountains'||name==='city')?5:4},(_,i)=>{const im=new Image();im.onload=()=>{this.satelliteLayer=null;this.render();};im.src='src/'+name+'_'+(i+1)+'.'+ext+'?asset=m650';return im;});}

      const lakeImage=new Image();lakeImage.onload=()=>{this.lakeTexture=lakeImage;this.satelliteLayer=null;this.render();};lakeImage.src='src/lake_hex.png';for(const type of ['plains','hills','mountains']){const im=new Image();im.onload=()=>{this.extraTextures[type]=im;this.satelliteLayer=null;this.render();};im.src='src/'+type+'_texture.jpg';}for(let i=0;i<2;i++){const im=new Image();im.onload=()=>{this.hillHexes[i]=im;this.satelliteLayer=null;this.render();};im.src='src/hill_hex_'+(i?'b':'a')+'.png';}this.onSelect=()=>{};this.dpr=1;this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);this.resize();}
    resize(){const rect=this.canvas.getBoundingClientRect();this.dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));this.canvas.width=Math.max(1,Math.floor(rect.width*this.dpr));this.canvas.height=Math.max(1,Math.floor(rect.height*this.dpr));this.clampPan();this.render();}
    get size(){return this.baseSize*this.zoom;}
    get dims(){return {w:this.canvas.width/this.dpr,h:this.canvas.height/this.dpr};}
    // Exact map bounds, including the hex radius. Never expose more off-map area than necessary.
    mapBounds(){
      const r=this.size, cols=this.scenario.cols, rows=this.scenario.rows;
      let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
      for(const row of [0,rows-1])for(const col of [0,cols-1]){
        const a=axialFromOffset(col,row),p=axialToPixel(a.q,a.r,r);
        minX=Math.min(minX,p.x-r*SQRT3/2);maxX=Math.max(maxX,p.x+r*SQRT3/2);
        minY=Math.min(minY,p.y-r);maxY=Math.max(maxY,p.y+r);
      }
      return {minX,maxX,minY,maxY};
    }
    clampPan(){
      const b=this.mapBounds(),{w,h}=this.dims;
      const width=b.maxX-b.minX,height=b.maxY-b.minY;
      if(width<=w)this.pan.x=(w-width)/2-b.minX;
      else this.pan.x=Math.max(w-b.maxX,Math.min(-b.minX,this.pan.x));
      if(height<=h)this.pan.y=(h-height)/2-b.minY;
      else this.pan.y=Math.max(h-b.maxY,Math.min(-b.minY,this.pan.y));
    }
    centerMap(){const b=this.mapBounds(),{w,h}=this.dims;this.pan={x:w/2-(b.minX+b.maxX)/2,y:h/2-(b.minY+b.maxY)/2};this.clampPan();this.render();}
    centerOnHex(col,row){const p=this.worldPixel(col,row);this.pan.x+=this.dims.w/2-p.x;this.pan.y+=this.dims.h/2-p.y;this.clampPan();this.render();}
    targetNeedsTracking(col,row){const p=this.worldPixel(col,row),{w,h}=this.dims;return p.x<w*.10||p.x>w*.90||p.y<h*.10||p.y>h*.90;}
    resetView(){this.zoom=1;this.centerMap();}
    worldPixel(col,row){const a=axialFromOffset(col,row),p=axialToPixel(a.q,a.r,this.size);return {x:p.x+this.pan.x,y:p.y+this.pan.y};}
    screenToWorld(x,y){return {x:(x-this.pan.x)/this.size,y:(y-this.pan.y)/this.size};}
    hitTest(x,y){const w=this.screenToWorld(x,y),a=pixelToAxial(w.x,w.y,1),o=offsetFromAxial(a.q,a.r);if(o.col<0||o.row<0||o.col>=this.scenario.cols||o.row>=this.scenario.rows)return null;return o;}
    screenPointToHex(x,y){const w=this.screenToWorld(x,y),a=pixelToAxial(w.x,w.y,1),o=offsetFromAxial(a.q,a.r);return o.col>=0&&o.row>=0&&o.col<this.scenario.cols&&o.row<this.scenario.rows?o:null;}
    zoomAt(factor,x,y){const old=this.zoom,next=Math.max(.30,Math.min(1.8,old*factor));if(next===old)return;const worldX=(x-this.pan.x)/old,worldY=(y-this.pan.y)/old;this.zoom=next;this.pan.x=x-worldX*next;this.pan.y=y-worldY*next;this.clampPan();this.render();}
    setSelection(id){this.selectedId=id;this.render();}
    // M4.19: three-hex elevation-aware line of sight. Adjacent enemies are always spotted.
    // Cube-coordinate interpolation samples all intervening hexes, including hex-edge
    // ambiguities (both sides of an exact boundary) so obstruction cannot be bypassed.
    terrainElevation(col,row){
      const t=String(this.terrainAt(col,row)||'').toLowerCase();
      return t.includes('mountain')?3:(t.includes('hill')||t.includes('rough'))?2:1;
    }
    lineOfSight(observer,target){
      const hex=global.ARMAGEDDON_HEX;
      const a=hex.axialFromOffset(observer.col,observer.row),b=hex.axialFromOffset(target.col,target.row);
      const dx=b.q-a.q,dz=b.r-a.r,dy=-dx-dz;
      const range=Math.max(Math.abs(dx),Math.abs(dy),Math.abs(dz));
      if(range>3)return false;
      if(range<=1)return true;
      const e1=this.terrainElevation(observer.col,observer.row),e2=this.terrainElevation(target.col,target.row);
      if(e1===3||e2===3)return true;
      const blocks=(c,r)=>{
        if(c<0||r<0||c>=this.scenario.cols||r>=this.scenario.rows)return false;
        const t=String(this.terrainAt(c,r)||'').toLowerCase();
        if(e1===1&&e2===1)return t.includes('wood')||t.includes('forest')||t.includes('swamp')||t.includes('hill')||t.includes('rough')||t.includes('mountain');
        return t.includes('mountain');
      };
      for(let step=1;step<range;step++){
        const t=step/range;
        // Small cube-coordinate nudges resolve exact edge crossings conservatively.
        for(const epsilon of [-1e-6,1e-6]){
          const x=a.q+dx*t+epsilon,z=a.r+dz*t+epsilon,y=-x-z;
          let rx=Math.round(x),ry=Math.round(y),rz=Math.round(z);
          const ex=Math.abs(rx-x),ey=Math.abs(ry-y),ez=Math.abs(rz-z);
          if(ex>ey&&ex>ez)rx=-ry-rz;else if(ey>ez)ry=-rx-rz;else rz=-rx-ry;
          const cell=hex.offsetFromAxial?hex.offsetFromAxial(rx,rz):null;
          if(cell&&blocks(cell.col,cell.row))return false;
        }
      }
      return true;
    }
    // M5.22: normal single-player (None) always uses the player's intelligence.
    // All counter drawing, hit-testing and detail panels share this predicate.
    spottingDistance(a,b){
      const x=axialFromOffset(a.col,a.row),y=axialFromOffset(b.col,b.row);
      const dq=x.q-y.q,dr=x.r-y.r;
      return Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr));
    }
    spottingTerrain(d){
      return String(this.terrainAt(d.col,d.row)||'').trim().toLowerCase();
    }
    visibilityInfo(d){
      if(!d||d.destroyed||d.strength<=0)return {visible:false,reason:'inactive'};
      // Execution replay: temporary TI positions, not end-of-day scenario coordinates,
      // determine spotting. Never use the future final positions to reveal a unit.
      const at=unit=>this.spottingPositions?.get(String(unit.id))||unit;
      const target=at(d);
      const mode=window.ARMAGEDDON_VIEW_MODE||'None';
      if(mode==='Both')return {visible:true,reason:'both-playtest'};
      const side=mode==='Red'?'Red':mode==='Blue'?'Blue':(window.ARMAGEDDON_SETUP?.playerSide||'Blue');
      if(d.side===side)return {visible:true,reason:'friendly',side};
      // M6.192: civilian intelligence from controlled countryside. An enemy
      // division next to ANY hex controlled by the viewing nation is visible,
      // regardless of terrain or friendly division proximity. Enemy-controlled,
      // contested and out-of-bounds hexes never grant the viewer this sighting.
      // target is the current TI spotting position during replay.
      const neighbors=global.ARMAGEDDON_ZOC?.neighbors?.(target,this.scenario)||[];
      if(neighbors.some(n=>this.controlAt(n.col,n.row)===side))
        return {visible:true,reason:'adjacent-friendly-controlled-hex',side};
      const terrain=this.spottingTerrain(target);
      // Actual urban terrain is authoritative; also check the city's explicit
      // footprint if provided by the city controller (not just the city label).
      const urban=terrain==='urban'||terrain==='city'||Boolean(this.cityForHex?.(target.col,target.row));
      const concealed=urban||/forest|wood|swamp|mountain/.test(terrain);
      const maxRange=concealed?1:3;
      let nearest=Infinity;
      for(const f of this.scenario.divisions){
        if(f.side!==side||f.destroyed||f.strength<=0)continue;
        const distance=this.spottingDistance(at(f),target);
        nearest=Math.min(nearest,distance);
        if(distance===1)return {visible:true,reason:'adjacent-unit',terrain,urban,maxRange,nearest:distance,side};
        if(distance>1&&distance<=maxRange&&this.lineOfSight(at(f),target))return {visible:true,reason:'spotted-los',terrain,urban,maxRange,nearest:distance,side};
      }
      // M6.219: friendly fully controlled cities spot enemy divisions like a
      // friendly combat division; they have no omniscient sight in concealment.
      const friendlyCities=this.cityStates||[];
      for(const entry of friendlyCities){
        const c=entry.city||entry;
        const owner=entry.owner||c.side;
        if(owner!==side||Number(entry.pacification)>0||entry.occupier)continue;
        const station={col:c.c??c.col,row:c.r??c.row};
        if(!Number.isInteger(station.col)||!Number.isInteger(station.row))continue;
        const distance=this.spottingDistance(station,target);
        nearest=Math.min(nearest,distance);
        if(distance===1)return {visible:true,reason:'adjacent-friendly-city',terrain,urban,maxRange,nearest:distance,side};
        if(distance>1&&distance<=maxRange&&this.lineOfSight(station,target))return {visible:true,reason:'city-spotted-los',terrain,urban,maxRange,nearest:distance,side};
      }
      return {visible:false,reason:'out-of-range',terrain,urban,maxRange,nearest,side};
    }
    visibleDivision(d){return this.visibilityInfo(d).visible;}
    // Sovereignty persists where neither army currently projects control.
    // Occupation overrides all ZOCs; opposing adjacent ZOCs make an empty hex contested.
    refreshHexControl(){
      const cols=this.scenario.cols,rows=this.scenario.rows;
      if(!this.hexOwners || this.hexOwners.length!==cols*rows){
        this.hexOwners=Array.from({length:cols*rows},(_,i)=>{
          const col=i%cols,row=Math.floor(i/cols),border=window.ARMAGEDDON_BORDER;
          return border&&border[col]!==undefined?(row<border[col]?'Red':'Blue'):(row<rows/2?'Red':'Blue');
        });
      }
      const occupied=new Map(),zocs={Blue:new Set(),Red:new Set()};
      const zocApi=global.ARMAGEDDON_ZOC;
      for(const d of this.scenario.divisions){
        if(d.destroyed||d.strength<=0||!['Blue','Red'].includes(d.side))continue;
        // Prevent future final positions from altering control during replay.
        const pos=this.spottingPositions?.get(String(d.id))||d;
        occupied.set(`${pos.col},${pos.row}`,d.side);
        if(zocApi)for(const n of zocApi.neighbors(pos,this.scenario))zocs[d.side].add(`${n.col},${n.row}`);
      }
      for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
        const k=`${col},${row}`,i=row*cols+col;
        if(occupied.has(k)){this.hexOwners[i]=occupied.get(k);continue;}
        const blue=zocs.Blue.has(k),red=zocs.Red.has(k);
        if(blue&&red)this.hexOwners[i]='Contested';
        else if(blue)this.hexOwners[i]='Blue';
        else if(red)this.hexOwners[i]='Red';
        // No ZOC: retain prior territorial status.
      }
    }
    controlAt(col,row){
      if(!this.hexOwners)this.refreshHexControl();
      return this.hexOwners[row*this.scenario.cols+col];
    }
    render(){if(!this.ctx||!this.canvas.width)return;const ctx=this.ctx,{w,h}=this.dims;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle="#334a3a";ctx.fillRect(0,0,w,h);
      // M3.16: continuous satellite-inspired raster landscape with the hex grid drawn above it.
      if(!this.satelliteLayer)this.buildSatelliteLayer();
      if(this.satelliteLayer){const layer=this.satelliteLayer;ctx.drawImage(layer.canvas,layer.minX*this.zoom+this.pan.x,layer.minY*this.zoom+this.pan.y,layer.width*this.zoom,layer.height*this.zoom);}
      // Always-visible, prominent hex boundaries. Terrain is underneath, not hex-shaped tiles.
      ctx.save();ctx.lineWidth=Math.max(.65,.85*this.zoom);ctx.strokeStyle="rgba(17,34,29,.36)";
      for(let row=0;row<this.scenario.rows;row++)for(let col=0;col<this.scenario.cols;col++){
        const c=this.worldPixel(col,row);const pts=hexPoints(c.x,c.y,this.size);
        ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.closePath();ctx.stroke();
      }ctx.restore();
      // M5.09 diagnostic: visualize the exact hexsides charged as crossings.
      // This uses the SAME canonical keys read by movement.js, not river proximity.
      if(this.showWaterCrossings){
        ctx.save();ctx.lineWidth=Math.max(3,4*this.zoom);ctx.lineCap='round';
        for(const [keys,color] of [[window.ARMAGEDDON_RIVER_KEYS,'#ff4e43'],[window.ARMAGEDDON_STREAM_KEYS,'#f7dc42']]){
          if(!keys)continue;ctx.strokeStyle=color;
          for(const edge of keys){
            const parts=edge.split('|');if(parts.length!==2)continue;
            const [ac,ar]=parts[0].split(',').map(Number),[bc,br]=parts[1].split(',').map(Number);
            const a=this.worldPixel(ac,ar),b=this.worldPixel(bc,br);
            const va=hexPoints(a.x,a.y,this.size),vb=hexPoints(b.x,b.y,this.size);
            const shared=[];for(const v of va)for(const w of vb)if(Math.hypot(v.x-w.x,v.y-w.y)<.2)shared.push(v);
            if(shared.length!==2)continue;
            ctx.beginPath();ctx.moveTo(shared[0].x,shared[0].y);ctx.lineTo(shared[1].x,shared[1].y);ctx.stroke();
          }
        }
        ctx.restore();
      }
      // M6.45: hex coordinates and C1-C5 debug labels are intentionally never drawn.
      if(this.showZoc&&global.ARMAGEDDON_ZOC){
        const areas=global.ARMAGEDDON_ZOC.visualAreas({...this.scenario,divisions:this.scenario.divisions.filter(d=>this.visibleDivision(d))},1);
        for(let row=0;row<this.scenario.rows;row++)for(let col=0;col<this.scenario.cols;col++){
          const k=`${col},${row}`,bd=areas.Blue.get(k),rd=areas.Red.get(k);
          if(bd===undefined&&rd===undefined)continue;
          const c=this.worldPixel(col,row),both=bd!==undefined&&rd!==undefined;
          const near=Math.min(bd===undefined?2:bd,rd===undefined?2:rd);
          ctx.save();ctx.beginPath();const pts=hexPoints(c.x,c.y,this.size*.93);
          ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.closePath();
          ctx.fillStyle=both?`rgba(198,93,228,${.38+(1-near)*.11})`:bd!==undefined?`rgba(37,147,255,${.38+(1-near)*.11})`:`rgba(255,71,77,${.38+(1-near)*.11})`;
          ctx.fill();
          ctx.strokeStyle=both?'#ecb4ff':bd!==undefined?'#67baff':'#ff9292';
          ctx.lineWidth=Math.max(1.3,this.zoom*1.65);ctx.stroke();ctx.restore();
        }
      }
      // Dynamic ownership: refresh on every render, including movement and retreats.
      this.refreshHexControl();
      // High-contrast ownership overlay, with underlying terrain still legible.
      if(this.showControl){
        for(let row=0;row<this.scenario.rows;row++)for(let col=0;col<this.scenario.cols;col++){
          const side=this.controlAt(col,row),c=this.worldPixel(col,row),pts=hexPoints(c.x,c.y,this.size*.965);
          ctx.save();ctx.beginPath();pts.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();
          ctx.fillStyle=side==='Blue'?'rgba(22,93,248,.43)':side==='Red'?'rgba(239,33,48,.43)':'rgba(45,45,49,.76)';ctx.fill();
          ctx.lineWidth=Math.max(.8,this.zoom);ctx.strokeStyle=side==='Blue'?'rgba(140,206,255,.85)':side==='Red'?'rgba(255,170,174,.85)':'rgba(150,155,162,.95)';ctx.stroke();ctx.restore();
        }
      }
      // Optional terrain identification overlay; drawn above art, below orders and counters.
      if(this.showTerrainTypes){
        const icons={Plains:'·',Forest:'♠',Hills:'⌃',Mountains:'▲',Urban:'▦',Lake:'≈',Swamp:'♣',River:'≈'};
        for(let row=0;row<this.scenario.rows;row++)for(let col=0;col<this.scenario.cols;col++){
          const c=this.worldPixel(col,row),type=this.terrainAt(col,row);
          ctx.save();ctx.font=`bold ${Math.max(12,this.size*.37)}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.lineWidth=2.8;ctx.strokeStyle='rgba(0,0,0,.85)';ctx.fillStyle='#fff8d9';
          ctx.strokeText(icons[type]||'·',c.x,c.y);ctx.fillText(icons[type]||'·',c.x,c.y);ctx.restore();
        }
      }
      // Draw national frontier on exact shared hex sides, not through hex centers.
      // Alternating magenta frontier dashes leave waterway blue visible on shared hex sides.
      // The dark magenta halo keeps the frontier legible across both land and water.
      ctx.save();ctx.strokeStyle='#a735e8';ctx.lineWidth=Math.max(3,4*this.zoom);ctx.setLineDash([Math.max(9,12*this.zoom),Math.max(5,7*this.zoom)]);
      const borders=window.ARMAGEDDON_BORDER||[];
      const edgeIndex=new Set();
      for(let row=0;row<this.scenario.rows;row++)for(let col=0;col<this.scenario.cols;col++){
        const here=row<(borders[col]??this.scenario.rows/2)?'Red':'Blue';
        const c=this.worldPixel(col,row),points=hexPoints(c.x,c.y,this.size);
        for(let j=0;j<6;j++){
          const v=points[j],w=points[(j+1)%6];
          // Neighbor center is across the midpoint of this hex side.
          const mx=(v.x+w.x)/2,my=(v.y+w.y)/2;
          const nx=c.x+2*(mx-c.x),ny=c.y+2*(my-c.y);
          const cell=this.hitTest(nx,ny);
          if(!cell||cell.col===col&&cell.row===row)continue;
          const there=cell.row<(borders[cell.col]??this.scenario.rows/2)?'Red':'Blue';
          if(here===there)continue;
          const edge=[`${v.x.toFixed(2)},${v.y.toFixed(2)}`,`${w.x.toFixed(2)},${w.y.toFixed(2)}`].sort().join('|');
          if(edgeIndex.has(edge))continue;edgeIndex.add(edge);
          ctx.beginPath();ctx.moveTo(v.x,v.y);ctx.lineTo(w.x,w.y);ctx.stroke();
        }
      }
      ctx.restore();
      // City production overlay: center markers remain readable over terrain.
      if(this.showCities&&this.cityStates){
        ctx.save();
        for(const entry of this.cityStates){
          // M5.32: enemy city production/pacification is not public intelligence.
          // In normal single-player (None), use the player's side, as for unit spotting.
          const viewMode=window.ARMAGEDDON_VIEW_MODE||'None';
          const observer=viewMode==='Red'?'Red':viewMode==='Blue'?'Blue':(window.ARMAGEDDON_SETUP?.playerSide||window.ARMAGEDDON_PLAYER_SIDE||'Blue');
          if(viewMode!=='Both' && entry.owner!==observer)continue;
          const city=entry.city;
          // An individual city hex is red only while its own production slot is active.
          // Older saves may carry a legacy single production at the city center.
          const slots=Object.entries(entry.productions||{}).filter(([,job])=>Boolean(job));
          if(entry.production&&!slots.some(([key])=>key===city.c+','+city.r))slots.push([city.c+','+city.r,entry.production]);
          // Retain the existing orange indication for cities with no active production.
          if(!slots.length){
            const pt=this.worldPixel(city.c,city.r),verts=hexPoints(pt.x,pt.y,this.size*.995);
            ctx.beginPath();verts.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();
            ctx.fillStyle='rgba(255,152,15,.85)';ctx.fill();
            ctx.strokeStyle='#ffbf48';ctx.lineWidth=Math.max(2,2.6*this.zoom);ctx.stroke();
          }
          for(const [key] of slots){
            const [col,row]=key.split(',').map(Number);
            if(!Number.isInteger(col)||!Number.isInteger(row))continue;
            const pt=this.worldPixel(col,row),verts=hexPoints(pt.x,pt.y,this.size*.995);
            ctx.beginPath();verts.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();
            ctx.fillStyle='rgba(205,32,42,.84)';ctx.fill();
            ctx.strokeStyle='#ff4444';ctx.lineWidth=Math.max(2,2.6*this.zoom);ctx.stroke();
          }
          // M6.211: Pacification is distinct from normal city colors and
          // production overlays. Gold dashed ring = pacification; blue/red
          // center banner identifies WHICH sovereign city is being pacified.
          const level=Math.max(0,Math.min(5,Number(entry.pacification)||0));
          if(level>0){
            const col=city.c??city.col,row=city.r??city.row;
            if(Number.isInteger(col)&&Number.isInteger(row)){
              const pt=this.worldPixel(col,row),r=this.size*1.15;
              const affected=entry.owner==='Red'?'RED':'BLUE';
              const national=affected==='RED'?'#d52937':'#1877d4';
              const label=affected+' PAC '+level+'/5';
              ctx.save();
              ctx.beginPath();hexPoints(pt.x,pt.y,r).forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();
              ctx.fillStyle=affected==='RED'?'rgba(199,38,58,.20)':'rgba(23,113,205,.20)';ctx.fill();
              ctx.setLineDash([Math.max(5,7*this.zoom),Math.max(3,3*this.zoom)]);
              ctx.strokeStyle='#ffe36b';ctx.lineWidth=Math.max(4,4*this.zoom);ctx.stroke();ctx.setLineDash([]);
              const fontSize=Math.max(10,Math.min(16,11*this.zoom));ctx.font='bold '+fontSize+'px Arial';
              const w=ctx.measureText(label).width+12,x=pt.x-w/2,y=pt.y-r-7;
              ctx.fillStyle='#071827';ctx.fillRect(x-2,y-fontSize-5,w+4,fontSize+10);
              ctx.fillStyle=national;ctx.fillRect(x,y-fontSize-3,w,fontSize+6);
              ctx.strokeStyle='#ffe36b';ctx.lineWidth=1.5;ctx.strokeRect(x,y-fontSize-3,w,fontSize+6);
              ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(label,pt.x,y-fontSize/2+1);
              ctx.restore();
            }
          }
        }
        ctx.restore();
      }
      // M6.108: City sovereignty and player control are public even under fog of war.
      // Each exposed hex EDGE has three separated dashes. One half of every dash
      // is the national side color and the other half the controller's color.
      // Shared city-to-city edges have NO colored marks (the normal map grid remains).
      if(this.cityStates){
        const owners=window.ARMAGEDDON_ASSET_OWNERS||{};
        const colors=window.ARMAGEDDON_PLAYER_COLORS||{};
        const cityAt=this.cityForHex;
        const isCity=(col,row)=>this.terrainAt(col,row)==='Urban' &&
          (typeof cityAt==='function'?!!cityAt(col,row):this.cityStates.some(x=>x.city.c===col&&x.city.r===row));
        const national=side=>side==='Red'?'#e53935':'#1e88e5';
        ctx.save();ctx.lineCap='butt';ctx.lineJoin='round';
        for(let row=0;row<this.scenario.rows;row++)for(let col=0;col<this.scenario.cols;col++){
          if(!isCity(col,row))continue;
          const entry=typeof cityAt==='function'?cityAt(col,row):this.cityStates.find(x=>x.city.c===col&&x.city.r===row);
          if(!entry)continue;
          const sideColor=national(entry.owner||entry.city.side);
          const ownerId=owners['city:'+entry.city.name];
          const playerColor=colors[ownerId]||sideColor; // AI: same as its nation
          const pt=this.worldPixel(col,row),verts=hexPoints(pt.x,pt.y,this.size*.955);
          // M6.192: one X per city, on its center hex; repeated markers on adjoining urban hexes were redundant.
          if(col===entry.city.c&&row===entry.city.r){ctx.save();ctx.strokeStyle='#06111e';ctx.lineWidth=Math.max(6,6*this.zoom);ctx.lineCap='round';
          const d=Math.max(5,this.size*.20);ctx.beginPath();ctx.moveTo(pt.x-d,pt.y-d);ctx.lineTo(pt.x+d,pt.y+d);ctx.moveTo(pt.x+d,pt.y-d);ctx.lineTo(pt.x-d,pt.y+d);ctx.stroke();
          ctx.strokeStyle=playerColor;ctx.lineWidth=Math.max(3,3.6*this.zoom);ctx.stroke();ctx.restore();}
          for(let edge=0;edge<6;edge++){
            const p=verts[edge],q=verts[(edge+1)%6];
            const mx=(p.x+q.x)/2,my=(p.y+q.y)/2;
            // The next hex center lies past the midpoint of this hex side.
            const neighbor=this.hitTest(pt.x+(mx-pt.x)*2.095,pt.y+(my-pt.y)*2.095);
            if(neighbor&&isCity(neighbor.col,neighbor.row))continue;
            const dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy);
            if(!len)continue;
            const ux=dx/len,uy=dy/len,dashCount=3,dashLen=len/(dashCount*1.47);
            for(let i=0;i<dashCount;i++){
              const center=(i+.5)*len/dashCount;
              const from=center-dashLen/2,mid=center,to=center+dashLen/2;
              const drawHalf=(start,end,color)=>{
                ctx.beginPath();ctx.moveTo(p.x+ux*start,p.y+uy*start);
                ctx.lineTo(p.x+ux*end,p.y+uy*end);
                ctx.strokeStyle='#08121e';ctx.lineWidth=Math.max(5,5.6*this.zoom);ctx.stroke();
                ctx.strokeStyle=color;ctx.lineWidth=Math.max(3.3,3.8*this.zoom);ctx.stroke();
              };
              drawHalf(from,mid,sideColor);
              drawHalf(mid,to,playerColor);
            }
          }
        }
        ctx.restore();
      }
      // City names identify settlements and capitals without hiding unit counters.
      ctx.save();ctx.font=`bold ${Math.max(10,11*this.zoom)}px Arial`;ctx.textAlign='center';ctx.textBaseline='bottom';
      for(const city of (window.ARMAGEDDON_CITIES||[])){
        const pt=this.worldPixel(city.c,city.r);
        if(city.isCapital){
          // Gold star identifies the one three-hex capital of each nation.
          const x=pt.x,y=pt.y-this.size*.94,r=Math.max(13,this.size*.43);
          ctx.save();ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.46:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}ctx.closePath();ctx.fillStyle='#ffe747';ctx.strokeStyle='#0a1018';ctx.lineWidth=4;ctx.fill();ctx.stroke();ctx.restore();
        }
        ctx.lineWidth=3;ctx.strokeStyle='#111b1e';ctx.fillStyle=city.side==='Blue'?'#a8d9ff':'#ffd1cb';ctx.strokeText(city.name+(city.isCapital?' ★':''),pt.x,pt.y-this.size*.46);ctx.fillText(city.name+(city.isCapital?' ★':''),pt.x,pt.y-this.size*.46);
      }ctx.restore();
      if(this.showReplacements&&this.replacementPackets){
        ctx.save();
        for(const packet of this.replacementPackets){
          if(window.ARMAGEDDON_VIEW_MODE!=='Both'&&packet.side!==(window.ARMAGEDDON_PLAYER_SIDE||'Blue'))continue;
          const p=this.worldPixel(packet.col,packet.row);
          const target=this.scenario.divisions.find(d=>d.id===packet.targetId);
          if(target&&!target.destroyed){
            const q=this.worldPixel(target.col,target.row);
            ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);
            ctx.strokeStyle='#ffffffb8';ctx.lineWidth=Math.max(1.5,this.zoom*1.5);
            ctx.setLineDash([6,5]);ctx.stroke();ctx.setLineDash([]);
          }
          const type=(target?.type||'Infantry').toLowerCase();
          // White silhouettes: infantry soldier, motorized truck, mechanized halftrack, armored tank.
          const k=Math.max(0.55,this.size/35);
          ctx.save();ctx.translate(p.x,p.y);ctx.scale(k,k);
          ctx.shadowColor='#07121a';ctx.shadowBlur=5;ctx.shadowOffsetY=1;
          ctx.fillStyle=ctx.unitContrastColor||'#ffffff';ctx.strokeStyle=ctx.unitContrastColor||'#ffffff';ctx.lineWidth=2.6;ctx.lineCap='round';ctx.lineJoin='round';
          this.drawUnitSilhouette(ctx,type);
          ctx.restore();
        }
        ctx.restore();
      }
      if(this.showEndPositions)this.drawEndPositions(ctx);
      for(const d of this.scenario.divisions)if(this.visibleDivision(d))this.drawDivision(ctx,d);
      // Route markers and arrows must appear ABOVE all unit counters.
      this.drawRoutes(ctx);
      // City selection is an independent, persistent highlight, not an inspection popup.
      if(this.selectedCityHex){const c=this.worldPixel(this.selectedCityHex.col,this.selectedCityHex.row);ctx.save();ctx.setLineDash([6,3]);drawHex(ctx,c.x,c.y,this.size,"#f9d76818","#ffdf69",3.5);ctx.restore();}
      if(this.hoverCell){const c=this.worldPixel(this.hoverCell.col,this.hoverCell.row);drawHex(ctx,c.x,c.y,this.size,"#ffffff08","#fff8",2);}
    }
    buildSatelliteLayer(){
      const S=this.baseSize, cols=this.scenario.cols, rows=this.scenario.rows;
      const points=[];let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
        const a=axialFromOffset(c,r),p=axialToPixel(a.q,a.r,S);
        points.push({c,r,x:p.x,y:p.y,t:this.terrainAt(c,r)});
        minX=Math.min(minX,p.x-S);maxX=Math.max(maxX,p.x+S);
        minY=Math.min(minY,p.y-S);maxY=Math.max(maxY,p.y+S);
      }
      const scale=.85,W=Math.ceil((maxX-minX)*scale),H=Math.ceil((maxY-minY)*scale);
      const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
      const g=canvas.getContext('2d');g.scale(scale,scale);g.translate(-minX,-minY);
      const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7+18.91)*43758.5453;return n-Math.floor(n);};
      const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;};
      const colors={Plains:'#9eaa71',Forest:'#3b6542',Hills:'#88915c',Mountains:'#77766c',Urban:'#a7a59b',River:'#508aa5',Lake:'#427f9f',Swamp:'#387d83'};
      // Regions share edges but have coherent landforms rather than randomized tile types.
      for(const p of points){const verts=hexPoints(p.x,p.y,S+1);g.beginPath();verts.forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));g.closePath();g.fillStyle=colors[p.t==='River'?'Plains':p.t]||colors.Plains;g.fill();}
      // Fine aerial texture and elevation shading, confined to each hex's true terrain type.
      for(const p of points){
        g.save();g.beginPath();hexPoints(p.x,p.y,S).forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));g.closePath();g.clip();
        if(p.t==='Plains'||p.t==='River'){
          const shades=['#b9bb83','#a3b47a','#bfc08b','#a6b784'];
          for(let j=0;j<5;j++){const x=p.x+(hash(p.c*8+j,p.r)-.5)*S*2,y=p.y+(hash(p.c,p.r*9+j)-.5)*S*2;g.fillStyle=shades[Math.floor(hash(j+p.c,p.r)*4)];g.globalAlpha=.45;g.fillRect(x-S*.6,y-S*.3,S*1.2,S*.55);}
          g.globalAlpha=.3;g.strokeStyle='#4f6943';g.lineWidth=1.1;g.beginPath();g.moveTo(p.x-S,p.y-S*.22);g.lineTo(p.x+S,p.y+S*.25);g.stroke();
        }else if(p.t==='Forest'){
          for(let j=0;j<55;j++){const x=p.x+(hash(p.c*101+j,p.r)-.5)*S*2,y=p.y+(hash(p.c,p.r*89+j)-.5)*S*2,r=2+hash(j,p.c+p.r)*4;g.fillStyle=j%3===0?'#234b30':j%3===1?'#557b49':'#315c38';g.globalAlpha=.65;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}
        }else if(p.t==='Hills'){
          for(let j=0;j<7;j++){const y=p.y+(j-3)*S*.19;g.beginPath();g.moveTo(p.x-S,y+6);g.bezierCurveTo(p.x-S*.4,y-12,p.x+S*.3,y+11,p.x+S,y-5);g.strokeStyle=j%2?'#d5c58a':'#586f4c';g.globalAlpha=.55;g.lineWidth=2.3;g.stroke();}
        }else if(p.t==='Mountains'){
          g.fillStyle='#4d4e4c';g.globalAlpha=.85;g.beginPath();g.moveTo(p.x-S,p.y+S);g.lineTo(p.x-S*.2,p.y-S*.7);g.lineTo(p.x+S*.1,p.y-S*.3);g.lineTo(p.x+S*.6,p.y-S);g.lineTo(p.x+S,p.y+S);g.fill();
          g.fillStyle='#c2c1b5';g.globalAlpha=.8;g.beginPath();g.moveTo(p.x-S*.2,p.y-S*.7);g.lineTo(p.x+S*.1,p.y-S*.3);g.lineTo(p.x-S*.02,p.y+S*.45);g.fill();
          g.strokeStyle='#d4d2c7';g.lineWidth=2;g.beginPath();g.moveTo(p.x-S*.2,p.y-S*.7);g.lineTo(p.x+S*.1,p.y-S*.3);g.lineTo(p.x+S*.6,p.y-S);g.stroke();
        }else if(p.t==='Swamp'){
          for(let j=0;j<14;j++){const x=p.x+(hash(p.c+j,p.r)-.5)*S*1.6,y=p.y+(hash(p.c,p.r+j)-.5)*S*1.6;g.fillStyle=j%2?'#1e7f9c':'#3a9963';g.globalAlpha=.7;g.beginPath();g.ellipse(x,y,4+hash(j,p.c)*8,2+hash(j,p.r)*3,0,0,Math.PI*2);g.fill();}
        }else if(p.t==='Lake'){
          for(let j=0;j<5;j++){g.strokeStyle='#a1c9d1';g.globalAlpha=.3;g.lineWidth=1;g.beginPath();g.moveTo(p.x-S*.7,p.y+(j-2)*7);g.quadraticCurveTo(p.x,p.y+(j-2)*7-4,p.x+S*.7,p.y+(j-2)*7);g.stroke();}
        }
        g.restore();
      }
      const clearVariantCounts=[0,0,0,0,0];
      this.roughVariantCounts=[0,0,0,0,0];
      // Each clear hex displays the complete user-supplied hex artwork independently.
      // Do not use a continuous landscape texture or crop random farmland patches.
      for(const p of points){
        if(p.t==='Plains'||p.t==='River'){
          // Fixed per-hex variation, distributed across all five assets; independent of render timing.
          const variantIndex=Math.floor(hash(p.c*7+137,p.r*11+271)*5);clearVariantCounts[variantIndex]++;
          const chosen=this.terrainVariants?.clear?.[variantIndex];const im=chosen?.complete&&chosen.naturalWidth?chosen:null;
          if(!im){g.save();g.beginPath();hexPoints(p.x,p.y,S).forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));g.closePath();g.fillStyle='#d600dc';g.fill();g.restore();continue;}
          g.save();g.beginPath();hexPoints(p.x,p.y,S+.25).forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));g.closePath();g.clip();
          const halfW=S*Math.sqrt(3)/2;
          g.drawImage(im,p.x-halfW,p.y-S,halfW*2,S*2);
          
          g.restore();
          continue;
        }
        const name=({Hills:'rough',Mountains:'mountains',Swamp:'swamp',Forest:'forest',Urban:'city'})[p.t];
        // City art is drawn after roads, below. All other approved terrain is drawn here.
        if(!name||name==='city')continue;
        // Terrain selection is per hex, deterministic, and NEVER falls back to old artwork.
        // The five rough images must all be used rather than the legacy hills texture.
        const variants=this.terrainVariants?.[name]||[];
        const variantIndex=Math.floor(hash(p.c*7+137,p.r*11+271)*variants.length);
        const choice=variants[variantIndex];
        const im=choice?.complete&&choice.naturalWidth?choice:null;
        if(!im){
          // Make missing artwork visible rather than silently drawing an obsolete image.
          if(name==='rough'){
            g.save();g.beginPath();hexPoints(p.x,p.y,S).forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));
            g.closePath();g.fillStyle='#db23d7';g.fill();g.restore();
          }
          continue;
        }
        if(name==='rough'){
          this.roughVariantCounts=this.roughVariantCounts||[0,0,0,0,0];
          this.roughVariantCounts[variantIndex]++;
        }
        g.save();g.beginPath();hexPoints(p.x,p.y,S+.35).forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));g.closePath();g.clip();
        const halfW=S*Math.sqrt(3)/2;
        g.drawImage(im,p.x-halfW,p.y-S,halfW*2,S*2);
        // M6.169: darken mountain terrain artwork without hiding the clear hex grid.
        if(name==='mountains'){g.fillStyle='rgba(12,19,24,0.30)';g.fillRect(p.x-halfW,p.y-S,halfW*2,S*2);}
        g.restore();
      }
      window.ARMAGEDDON_CLEAR_VARIANT_COUNTS=clearVariantCounts;
      // M6.217: terrain color transitions only INSIDE the terrain's hex.
      // Forest/rough/swamp/mountain textures remain bounded by their own
      // hex classification; a narrow inner feather reduces the cut-out edge.
      const blendColors={Plains:'#87a653',River:'#87a653',Forest:'#365c34',Hills:'#a18c62',Mountains:'#7d8588',Swamp:'#266c70'};
      const byCoord=new Map(points.map(p=>[hexKey(p.c,p.r),p]));
      for(const p of points){
        if(!['Forest','Hills','Swamp','Mountains'].includes(p.t))continue;
        const verts=hexPoints(p.x,p.y,S-.35);
        g.save();g.beginPath();verts.forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));g.closePath();g.clip();
        for(let i=0;i<6;i++){
          const a=verts[i],b=verts[(i+1)%6],mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
          const ux=(mx-p.x)/Math.max(1,Math.hypot(mx-p.x,my-p.y));
          const uy=(my-p.y)/Math.max(1,Math.hypot(mx-p.x,my-p.y));
          const neighborAx=pixelToAxial(mx+ux*S*.68,my+uy*S*.68,S);
          const near=offsetFromAxial(neighborAx.q,neighborAx.r),other=byCoord.get(hexKey(near.col,near.row));
          if(!other||other.t===p.t||!blendColors[other.t])continue;
          const depth=S*.34; // M6.219: stronger inside-only transition band
          const grad=g.createLinearGradient(mx-ux*depth,my-uy*depth,mx+ux*.5,my+uy*.5);
          grad.addColorStop(0,'rgba(0,0,0,0)');
          grad.addColorStop(.70,blendColors[other.t]+'9c');
          grad.addColorStop(1,blendColors[other.t]+'b4');
          g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);
          g.lineTo(b.x-ux*depth,b.y-uy*depth);g.lineTo(a.x-ux*depth,a.y-uy*depth);g.closePath();
          g.fillStyle=grad;g.fill();
        }
        g.restore();
      }
      // M6.214: natural lake coasts. Keep water at the centre, but allow the
      // adjacent terrain's OWN image to intrude as an irregular land margin.
      // The canonical hex geometry / impassable lake / visible grid stay fixed.
      for(const p of points.filter(p=>p.t==='Lake')){
        const vertices=hexPoints(p.x,p.y,S+.25);
        g.save();g.beginPath();vertices.forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));g.closePath();g.clip();
        g.fillStyle='#126da4';g.fillRect(p.x-S*1.2,p.y-S*1.2,S*2.4,S*2.4);
        const shore={Plains:'#aeb784',Forest:'#466943',Hills:'#9a8c64',Mountains:'#817f77',Urban:'#a6a49a',Swamp:'#4b8275',River:'#9eb782'};
        const assetName={Plains:'clear',River:'clear',Forest:'forest',Hills:'rough',Mountains:'mountains',Urban:'city',Swamp:'swamp'};
        for(let i=0;i<6;i++){
          const a=vertices[i],b=vertices[(i+1)%6];
          const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
          const nx=(p.x-mid.x)/Math.max(1,Math.hypot(p.x-mid.x,p.y-mid.y));
          const ny=(p.y-mid.y)/Math.max(1,Math.hypot(p.x-mid.x,p.y-mid.y));
          const outer={x:mid.x-nx*S*.7,y:mid.y-ny*S*.7};
          const axial=pixelToAxial(outer.x,outer.y,S),off=offsetFromAxial(axial.q,axial.r);
          const terrain=byCoord.get(hexKey(off.col,off.row));
          if(!terrain||terrain.t==='Lake'||!shore[terrain.t])continue;
          const edge=[],pieces=24;
          // Smooth connected banks with gentle coves and peninsulas, not
          // square/hexagonal wedges. Terrain reaches into the water unevenly.
          const bendA=noise(p.c*3.18+i*5.2,p.r*2.71+i*.7)-.5;
          const bendB=noise(p.c*2.07-i*3.4,p.r*3.91+i*2.3)-.5;
          for(let j=0;j<=pieces;j++){
            const t=j/pieces;
            const low=Math.sin(Math.PI*t),wave=Math.sin(2*Math.PI*t)*bendA*.62+Math.sin(3*Math.PI*t)*bendB*.21;
            const fine=(noise(p.c*5.7+i*2.1+t*5.5,p.r*4.2-i+t*3.2)-.5)*.035;
            const margin=S*(.045+low*(.095+wave*.065+fine*.4)); // M6.219: slightly more prominent, curved, INSIDE-lake shore
            edge.push({x:a.x+(b.x-a.x)*t+nx*margin,y:a.y+(b.y-a.y)*t+ny*margin});
          }
          // A rounded shoreline interpolates each intermediate point; avoid
          // the former straight-line/jagged polygon land-water boundary.
          const smoothBank=()=>{
            g.moveTo(edge[0].x,edge[0].y);
            for(let j=1;j<edge.length;j++){
              const m={x:(edge[j-1].x+edge[j].x)/2,y:(edge[j-1].y+edge[j].y)/2};
              g.quadraticCurveTo(edge[j-1].x,edge[j-1].y,m.x,m.y);
            }
            const last=edge[edge.length-1];g.lineTo(last.x,last.y);
          };
          g.save();g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);
          for(let j=edge.length-1;j>=0;j--){const pt=edge[j];g.lineTo(pt.x,pt.y);}
          g.closePath();g.clip();
          g.fillStyle=shore[terrain.t];g.fillRect(p.x-S*1.4,p.y-S*1.4,S*2.8,S*2.8);
          const variants=this.terrainVariants?.[assetName[terrain.t]]||[];
          const idx=Math.floor(hash(terrain.c*7+137,terrain.r*11+271)*variants.length);
          const im=variants[idx];
          if(im?.complete&&im.naturalWidth){
            g.globalAlpha=.92;
            // Cover the entire land margin with the NEIGHBORING terrain image;
            // the old drawImage was centered on the neighbor and left a flat band.
            g.drawImage(im,p.x-S*1.6,p.y-S*1.6,S*3.2,S*3.2);
          }
          g.restore();
          // A thin translucent waterline softens the coast without obscuring
          // the clearly drawn hex boundaries over the entire map.
          g.save();g.beginPath();smoothBank();
          g.strokeStyle='rgba(155,198,172,.28)';g.lineWidth=Math.max(.6,S*.024);
          g.shadowColor='rgba(17,89,112,.18)';g.shadowBlur=S*.035;g.stroke();g.restore();
        }
        g.restore();
      }
      // M6.217: no exterior water wedges on adjacent land hexes. All lake
      // shoreline perturbation is clipped INSIDE each lake hex above, so
      // neighboring forests/mountains/swamps are never overpainted.
      // Draw smooth connected waterways and roads. Previously this helper was missing,
      // causing a ReferenceError midway through map generation (the all-green screen).
      const strokePath=(points,width,color)=>{
        if(!points||points.length<2)return;
        g.save();g.beginPath();g.moveTo(points[0].x,points[0].y);
        for(let i=1;i<points.length;i++)g.lineTo(points[i].x,points[i].y);
        g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.stroke();g.restore();
      };
      // Curved water texture stays anchored to the SAME canonical hex-side endpoints.
      // Curvature is purely visual: crossing keys and combat/movement rules are unchanged.
      const waterCurve=(a,b,width,color,seed)=>{
        const x=a.x*S,y=a.y*S,X=b.x*S,Y=b.y*S,dx=X-x,dy=Y-y,L=Math.hypot(dx,dy)||1;
        const side=Math.sin((x+X)*.043+(y+Y)*.037+seed)*.10*S;
        const nx=-dy/L,ny=dx/L;
        g.save();g.beginPath();g.moveTo(x,y);
        g.bezierCurveTo(x+dx*.32+nx*side,y+dy*.32+ny*side,
          x+dx*.68-nx*side*.7,y+dy*.68-ny*side*.7,X,Y);
        g.strokeStyle=color;g.lineWidth=width;g.lineJoin='round';g.lineCap='round';g.stroke();g.restore();
      };
      // M6.197: Group adjacent water edges into continuous polylines and smooth
      // turns through hex vertices, similar to roads. Original endpoints and
      // crossing-edge topology remain authoritative and unchanged.
      const connectedWaterPaths=(edges)=>{
        const key=p=>p.x.toFixed(5)+','+p.y.toFixed(5);
        const node=new Map(),unused=new Set();
        edges.forEach(([a,b],i)=>{unused.add(i);for(const p of [a,b]){const k=key(p);if(!node.has(k))node.set(k,[]);node.get(k).push(i)}});
        const paths=[];
        while(unused.size){
          const initial=unused.values().next().value;const [a,b]=edges[initial];unused.delete(initial);
          const pts=[a,b],grow=(front)=>{
            for(let guard=0;guard<edges.length;guard++){
              const current=front?pts[0]:pts[pts.length-1];const choices=(node.get(key(current))||[]).filter(i=>unused.has(i));
              if(choices.length!==1)break;
              const idx=choices[0],segment=edges[idx],next=key(segment[0])===key(current)?segment[1]:segment[0];
              unused.delete(idx);if(front)pts.unshift(next);else pts.push(next);
            }
          };
          grow(false);grow(true);paths.push(pts);
        }
        return paths;
      };
      const drawSmoothWater=(paths,width,color)=>{
        for(const pts of paths){if(pts.length<2)continue;
          g.save();g.beginPath();g.moveTo(pts[0].x*S,pts[0].y*S);
          for(let i=1;i<pts.length-1;i++){
            const p=pts[i],n=pts[i+1];
            g.quadraticCurveTo(p.x*S,p.y*S,(p.x+n.x)*S/2,(p.y+n.y)*S/2);
          }
          g.lineTo(pts[pts.length-1].x*S,pts[pts.length-1].y*S);
          g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.stroke();g.restore();
        }
      };
      const riverDensity=(window.ARMAGEDDON_DENSITY||{}).rivers||'normal';
      const riverWidth={low:7,normal:9,high:11}[riverDensity]||9;
      const riverPaths=connectedWaterPaths(window.ARMAGEDDON_RIVER_EDGES||[]);
      drawSmoothWater(riverPaths,riverWidth+3,'#234d67');
      drawSmoothWater(riverPaths,riverWidth,'#277ba9');
      drawSmoothWater(riverPaths,1.3,'#7fd2ee');
      const streamPaths=connectedWaterPaths(window.ARMAGEDDON_STREAM_EDGES||[]);
      drawSmoothWater(streamPaths,5.2,'#103b59');
      drawSmoothWater(streamPaths,3.2,'#05aee5');
      drawSmoothWater(streamPaths,1.15,'#c6f7ff');
      // Roads connect city centers, including bridges over the river.
      const cityCenters=(window.ARMAGEDDON_CITIES||[]).map(c=>[c.c,c.r]);
      const center=(c,r)=>{const a=axialFromOffset(c,r);return axialToPixel(a.q,a.r,S);};
      // Logical road graph: connect all cities with a minimum-spanning backbone,
      // then add short local connections. Avoid a spiderweb of long crossing roads.
      const sites=cityCenters.map(([c,r])=>center(c,r));
      const distance=(i,j)=>Math.hypot(sites[i].x-sites[j].x,sites[i].y-sites[j].y);
      const edgeSet=new Set(),edges=[];
      const addEdge=(i,j)=>{if(i===j)return;const k=[Math.min(i,j),Math.max(i,j)].join(':');if(!edgeSet.has(k)){edgeSet.add(k);edges.push([i,j]);}};
      if(sites.length){
        const connected=new Set([0]);
        while(connected.size<sites.length){let best=null;
          for(const i of connected)for(let j=0;j<sites.length;j++)if(!connected.has(j)){
            const d=distance(i,j);if(!best||d<best.d)best={i,j,d};
          }
          if(!best)break;addEdge(best.i,best.j);connected.add(best.j);
        }
        // Additional regional highways: join towns across longer distances,
        // including links between different local road clusters. Cap links to
        // avoid a dense spiderweb on large maps.
        const longLinks=Math.max(2,Math.round(sites.length/11));
        const candidates=[];
        for(let i=0;i<sites.length;i++){
          const ordered=sites.map((_,j)=>({j,d:distance(i,j)})).filter(v=>v.j!==i).sort((a,b)=>a.d-b.d);
          const near=ordered[0]?.d||1;
          for(const v of ordered.slice(3,Math.min(ordered.length,12))){
            if(i<v.j && v.d>near*2.0)candidates.push({i,j:v.j,d:v.d});
          }
        }
        candidates.sort((a,b)=>a.d-b.d);
        const degree=new Map();let added=0;
        for(const e of candidates){
          if(added>=longLinks)break;
          if((degree.get(e.i)||0)>=2||(degree.get(e.j)||0)>=2)continue;
          const key=[e.i,e.j].join(':');if(edgeSet.has(key))continue;
          addEdge(e.i,e.j);degree.set(e.i,(degree.get(e.i)||0)+1);
          degree.set(e.j,(degree.get(e.j)||0)+1);added++;
        }
        // A secondary connection for most towns, prioritizing nearby neighbors.
        for(let i=0;i<sites.length;i++){
          const near=sites.map((_,j)=>({j,d:distance(i,j)})).filter(v=>v.j!==i).sort((a,b)=>a.d-b.d);
          if(near.length){addEdge(i,near[0].j);if(near.length>1&&hash(i,51)>.32)addEdge(i,near[1].j);}
        }
        // M6.219: 50% more distinct city-to-city connections. This graph
        // shares actual roads/bridge keys with movement rules; not just ink.
        const existing=edges.length,goal=Math.ceil(existing*1.5);
        const extra=[];
        for(let i=0;i<sites.length;i++)for(let j=i+1;j<sites.length;j++){
          if(!edgeSet.has(i+':'+j))extra.push({i,j,d:distance(i,j)});
        }
        extra.sort((a,b)=>a.d-b.d||a.i-b.i||a.j-b.j);
        for(const link of extra){if(edges.length>=goal)break;addEdge(link.i,link.j);}
      }
      // Roads are sequences of adjacent hex CENTERS, never arbitrary splines.
      const offsetNeighbors=(c,r)=>((r&1)?[[1,0],[-1,0],[0,-1],[1,-1],[0,1],[1,1]]:[[1,0],[-1,0],[-1,-1],[0,-1],[-1,1],[0,1]]).map(([dc,dr])=>[c+dc,r+dr]).filter(([x,y])=>x>=0&&y>=0&&x<cols&&y<rows);
      const axialDist=(c,r,x,y)=>{const a=axialFromOffset(c,r),b=axialFromOffset(x,y),dq=a.q-b.q,dr=a.r-b.r;return Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr));};
      const routeRoad=(a,b)=>{const k=(c,r)=>c+','+r, start=k(...a),goal=k(...b),queue=[a],seen=new Set([start]),prev=new Map();
        while(queue.length){const [c,r]=queue.shift();if(k(c,r)===goal)break;const ns=offsetNeighbors(c,r).sort((u,v)=>axialDist(...u,...b)-axialDist(...v,...b));for(const [x,y] of ns){const key=k(x,y);if(seen.has(key)||this.terrainAt(x,y)==='Lake')continue;seen.add(key);prev.set(key,[c,r]);queue.push([x,y]);}}
        if(!seen.has(goal))return [];let cur=b,path=[cur];while(k(...cur)!==start){cur=prev.get(k(...cur));if(!cur)return [];path.push(cur);}return path.reverse().map(([c,r])=>center(c,r));};
      // Publish the exact road hex-to-hex connections for movement and route ETA.
      const roadKeys=new Set();
      const bridgeSegments=new Map();
      const waterSegments=[...(window.ARMAGEDDON_RIVER_EDGES||[]).map(e=>({edge:e,kind:'river'})),
        ...(window.ARMAGEDDON_STREAM_EDGES||[]).map(e=>({edge:e,kind:'stream'}))];
      const bridgeAt=(a,b)=>{
        const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
        let closest=null,dist=Infinity;
        for(const water of waterSegments){
          const [u,v]=water.edge,mx=(u.x+v.x)*S/2,my=(u.y+v.y)*S/2;
          const d=Math.hypot(cx-mx,cy-my);
          if(d<dist){dist=d;closest=water.kind;}
        }
        return dist<S*.17?closest:null;
      };
      const drawBridge=(a,b,kind)=>{
        const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,angle=Math.atan2(b.y-a.y,b.x-a.x);
        const length=(kind==='river'?riverWidth:5.2)+17,width=12;
        g.save();g.translate(cx,cy);g.rotate(angle);
        // Banks and parapets are visible against blue water, including at map zoom-out.
        g.fillStyle='#222426';g.fillRect(-length/2-2,-width/2-3,length+4,width+6);
        g.fillStyle='#d7bc8c';g.fillRect(-length/2,-width/2,length,width);
        g.strokeStyle='#fff0c5';g.lineWidth=2;
        for(const side of [-width/2+1,width/2-1]){g.beginPath();g.moveTo(-length/2-2,side);g.lineTo(length/2+2,side);g.stroke();}
        g.strokeStyle='#786146';g.lineWidth=1;
        for(let x=-length/2+4;x<length/2;x+=5){g.beginPath();g.moveTo(x,-width/2);g.lineTo(x,width/2);g.stroke();}
        g.restore();
      };
      for(const [i,j] of edges){
        const pts=routeRoad(cityCenters[i],cityCenters[j]);
        if(pts.length){
          for(let k=1;k<pts.length;k++){
            const a=pts[k-1],b=pts[k];
            const ca=window.ARMAGEDDON_HEX.offsetFromPixel?.(a.x,a.y,S);
            // Road graph uses the same center coordinates as the drawn line.
            const centerKey=p=>{
              const row=Math.round(p.y/(1.5*S));
              const col=Math.round(p.x/(Math.sqrt(3)*S)-(row%2)*.5);
              return `${col},${row}`;
            };
            const roadKey=[centerKey(a),centerKey(b)].sort().join('|');
            roadKeys.add(roadKey);
            const crossing=bridgeAt(a,b);
            if(crossing&&!bridgeSegments.has(roadKey))bridgeSegments.set(roadKey,{a,b,kind:crossing});
          }
          // Curved road appearance: each connection still follows the exact
          // passable hex-center route; gentle bends never alter the road graph.
          const curvedRoad=(width,color)=>{
            if(pts.length<2)return;
            g.save();g.beginPath();g.moveTo(pts[0].x,pts[0].y);
            // Rounded corners: quadratic curves steer toward the midpoint of the
            // next road segment; road legality still uses the original centers.
            for(let n=1;n<pts.length-1;n++){
              const p=pts[n],next=pts[n+1];
              const mx=(p.x+next.x)/2,my=(p.y+next.y)/2;
              g.quadraticCurveTo(p.x,p.y,mx,my);
            }
            g.lineTo(pts[pts.length-1].x,pts[pts.length-1].y);
            g.lineWidth=width;g.strokeStyle=color;g.lineJoin='round';g.lineCap='round';g.stroke();g.restore();
          };
          curvedRoad(7,'#101214');curvedRoad(1.1,'#616669');
        }
      }
      // City-to-city shared river/stream crossings are automatically bridged.
      // This is a crossing-edge rule; it does not make lakes passable.
      for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
        if(this.terrainAt(col,row)!=='Urban')continue;
        for(const [nc,nr] of offsetNeighbors(col,row)){
          if(this.terrainAt(nc,nr)!=='Urban')continue;
          const k=[`${col},${row}`,`${nc},${nr}`].sort().join('|');
          if(bridgeSegments.has(k))continue;
          const a=center(col,row),b=center(nc,nr),kind=bridgeAt(a,b);
          if(kind){roadKeys.add(k);bridgeSegments.set(k,{a,b,kind});}
        }
      }
      // Bridges are drawn LAST over the road and river, centered exactly on the
      // shared hex-side crossing, not offset toward either hex center.
      for(const crossing of bridgeSegments.values())drawBridge(crossing.a,crossing.b,crossing.kind);
      window.ARMAGEDDON_ROAD_KEYS=roadKeys;
      // User-supplied aerial city art, masked to Urban hexes. Hex borders are drawn later.
      // Each urban hex remains an independent terrain cell; the graphic does not alter rules.
      for(const p of points.filter(p=>p.t==='Urban')){
        g.save();g.beginPath();hexPoints(p.x,p.y,S+0.4).forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));g.closePath();g.clip();
        // Stable per-hex city variation. Never fall back to the obsolete city artwork.
        const variants=this.terrainVariants.city;
        const variantIndex=Math.floor(hash(p.c*7+137,p.r*11+271)*variants.length);
        const im=variants[variantIndex];
        if(im?.complete&&im.naturalWidth){
          const halfW=S*Math.sqrt(3)/2;g.drawImage(im,p.x-halfW,p.y-S,halfW*2,S*2);
        }else{
          g.fillStyle='#b526c8';g.fillRect(p.x-S,p.y-S,2*S,2*S);
        }
        g.restore();
      }
      this.satelliteLayer={canvas,minX,minY,width:W/scale,height:H/scale};
    }
    drawEndPositions(ctx){
      // One-turn (10 TI) read-only projection, with enemy destinations permitted.
      // A projected assault stops at the occupied hex; it does not assume victory.
      const movement=window.ARMAGEDDON_MOVEMENT;
      const terrainAt=window.ARMAGEDDON_DATA.terrainAt;
      const predicted=new Map();
      const divisions=this.scenario.divisions.filter(d=>!d.destroyed&&d.strength>0);
      const occupied=new Map(divisions.map(d=>[`${d.col},${d.row}`,d]));
      for(const d of divisions){
        const route=this.routes?.get(d.id)||[];
        // Preview only the current day's 10 execution hours, never the
        // complete plotted route. Carry forward accrued TIs for the first leg.
        let credit=Math.max(0,Number(d.tis)||0);
        let hours=10;
        let waiting=Math.max(0,Number(d.pauseTIs)||0);
        let from={col:d.col,row:d.row};
        for(const p of route){
          if(hours<=0)break;
          const occupant=occupied.get(`${p.col},${p.row}`);
          if(occupant&&occupant.id!==d.id&&occupant.side===d.side)break;
          const c=movement.cost(d,terrainAt(p.col,p.row),from,p,terrainAt,
            Boolean(occupant&&occupant.side!==d.side));
          if(!Number.isFinite(c))break;
          // Simulate hours accumulating movement TIs, including scheduled pauses.
          while(hours>0&&credit+1e-9<c){
            hours--;credit++;
            if(waiting>0)waiting--;
          }
          if(waiting>0){const n=Math.min(waiting,hours);hours-=n;waiting-=n;credit+=n;}
          if(credit+1e-9<c)break;
          // A funded entry is executed within this day's available hours.
          // A hostile destination represents an assault, not assumed capture.
          credit=Math.max(0,credit-c);
          occupied.delete(`${from.col},${from.row}`);
          if(!occupant)occupied.set(`${p.col},${p.row}`,d);
          from={col:p.col,row:p.row};
          if(occupant&&occupant.side!==d.side)break;
          waiting+=(p.pauseCount||0)+(p.pause?1:0);
        }
        predicted.set(d.id,from);
      }
      // When opposing divisions share a projected destination, offset both
      // counters horizontally to keep both visible.
      const groups=new Map();
      for(const d of divisions){const p=predicted.get(d.id)||d,k=`${p.col},${p.row}`;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(d);}
      for(const group of groups.values()){
        if(group.length<2||new Set(group.map(d=>d.side)).size<2)continue;
        const base=predicted.get(group[0].id);
        const pixel=this.worldPixel(base.col,base.row);
        for(const d of group){const p=predicted.get(d.id);predicted.set(d.id,{...p,previewOffsetX:d.side==='Blue'?-this.size*.33:this.size*.33});}
      }
      this.previewPositions=predicted;
      ctx.save();ctx.fillStyle='#061f2bdc';ctx.fillRect(8,8,360,30);
      ctx.fillStyle='#ffffff';ctx.font='bold 13px Arial';ctx.fillText('PROJECTED END OF CURRENT DAY — READ ONLY',17,28);ctx.restore();
    }
    drawRoutes(ctx){
      if(!this.routes || window.ARMAGEDDON_EXECUTION_HIDE_ROUTES)return;
      // Paint the selected gold route last, above every red route.
      const routeDrawOrder=[...this.scenario.divisions].sort((a,b)=>(a.id===this.selectedId?1:0)-(b.id===this.selectedId?1:0));
      for(const d of routeDrawOrder){
        if(d.destroyed||d.strength<=0)continue;
        if(d.side!==(window.ARMAGEDDON_PLAYER_SIDE||"Blue")&&window.ARMAGEDDON_VIEW_MODE!=="Both")continue;
        const allyRoute=this.allyRoutes?.has(String(d.id));
        const route=allyRoute?this.allyRoutes.get(String(d.id)):(this.routes.get(d.id)||this.routes.get(String(d.id)));
        if((d.pauseTIs||0)>0){
          const p=this.worldPixel(d.col,d.row);
          ctx.save();ctx.font='bold 15px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillStyle='#ffffff';ctx.strokeStyle='#182536';ctx.lineWidth=4;
          const label='Ⅱ'+d.pauseTIs;
          ctx.strokeText(label,p.x+this.size*.45,p.y-this.size*.5);
          ctx.fillText(label,p.x+this.size*.45,p.y-this.size*.5);ctx.restore();
        }
        if(!route?.length)continue;
        // On a new day the first waypoint shows hours STILL required for entry.
        // Example: a 13-hour entry with 10 hours credited reads 'NEXT 3h'.
        const first=route[0],unitTerrain=window.ARMAGEDDON_DATA.terrainAt;
        const firstCost=window.ARMAGEDDON_MOVEMENT.cost(d,unitTerrain(first.col,first.row),d,first,unitTerrain);
        const remainingFirst=Number.isFinite(firstCost)?Math.max(0,Math.ceil(firstCost-(Number(d.tis)||0)-1e-9)):Infinity;
        const anchor=this.worldPixel(d.col,d.row);
        ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 11px Arial';
        const nextLabel='NEXT '+(Number.isFinite(remainingFirst)?remainingFirst+'h':'∞');
        ctx.lineWidth=3;ctx.strokeStyle='#081c2a';ctx.fillStyle='#ffefad';
        ctx.strokeText(nextLabel,anchor.x,anchor.y+this.size*.77);
        ctx.fillText(nextLabel,anchor.x,anchor.y+this.size*.77);ctx.restore();
        const selected=!window.ARMAGEDDON_ROUTES_FROZEN&&(d.id===this.selectedId||d.id===window.ARMAGEDDON_READY_GOLD_ROUTE);
        ctx.save();
        // Ally plots are read-only and use their owner's personal player color.
        const owner=window.ARMAGEDDON_ASSET_OWNERS?.['unit:'+String(d.id)];
        const allyColor=window.ARMAGEDDON_PLAYER_COLORS?.[owner]||'#8fe3ff';
        ctx.strokeStyle=selected?'#ffffff':allyRoute?allyColor:'#f14b55';
        ctx.lineWidth=selected?4:allyRoute?3.4:3;
        ctx.lineCap="round";ctx.lineJoin="round";
        ctx.setLineDash([Math.max(7,11*this.zoom),Math.max(5,8*this.zoom)]);
        ctx.beginPath();
        const start=this.worldPixel(d.col,d.row);
        ctx.moveTo(start.x,start.y);
        for(const point of route){const p=this.worldPixel(point.col,point.row);ctx.lineTo(p.x,p.y);}
        ctx.stroke();ctx.setLineDash([]);
        // Estimated remaining TIs, rounded up, using the actual movement costs.
        const movement=window.ARMAGEDDON_MOVEMENT;
        const terrainAt=window.ARMAGEDDON_DATA.terrainAt;
        let total=0,previousCell={col:d.col,row:d.row};
        for(const point of route){total+=(point.pauseCount||0)+(point.pause?1:0);total+=movement.cost(d,terrainAt(point.col,point.row),previousCell,point,terrainAt);previousCell=point;}
        const eta=Math.max(0,Math.ceil(total-Math.max(0,d.tis||0)-1e-9));
        // Show only the number of hours remaining to reach each route hex.
        let elapsed=Math.max(0,d.pauseTIs||0)-Number(d.tis||0);
        // Current TIs are accumulated movement credit, not elapsed hours.
        let from={col:d.col,row:d.row};
        for(const point of route){
          const stepCost=movement.cost(d,terrainAt(point.col,point.row),from,point,terrainAt);
          elapsed+=stepCost;
          const arrivalTI=Math.max(1,Math.ceil(elapsed-1e-9)); // Hours from now, not unspent movement credit
          const frozen=window.ARMAGEDDON_ROUTES_FROZEN?window.ARMAGEDDON_FROZEN_LABELS?.get(d.id+':'+point.col+','+point.row):null;
          const p=this.worldPixel(point.col,point.row);
          const r=Math.max(10,Math.min(17,this.size*.32));
          const cx=p.x,cy=p.y-this.size*.57;
          ctx.beginPath();ctx.ellipse(cx,cy,r*1.24,r*1.24,0,0,Math.PI*2);
          ctx.fillStyle=selected?'#ffffff':'#ff7075';ctx.fill();
          ctx.strokeStyle='#172332';ctx.lineWidth=2;ctx.stroke();
          ctx.fillStyle='#111927';ctx.font=`bold ${Math.round(r*1.2)}px Arial`;
          const hour=frozen?frozen.hour:arrivalTI;
          ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(hour),cx,cy);
          elapsed+=(point.pauseCount||0)+(point.pause?1:0);
          from=point;
        }
        // Each route hex contains an arrow toward the NEXT route hex.
        // The last hex points along the incoming leg, so the endpoint is still directional.
        for(let i=0;i<route.length;i++){
          const point=route[i],p=this.worldPixel(point.col,point.row);
          const neighbor=i<route.length-1?route[i+1]:point;
          const previous=i<route.length-1?point:(i>0?route[i-1]:d);
          const a=this.worldPixel(previous.col,previous.row);
          const b=this.worldPixel(neighbor.col,neighbor.row);
          const angle=Math.atan2(b.y-a.y,b.x-a.x);
          const scale=Math.max(5,Math.min(11,this.size*.23));
          ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(scale*.95,0);
          ctx.lineTo(-scale*.55,-scale*.65);
          ctx.lineTo(-scale*.24,0);
          ctx.lineTo(-scale*.55,scale*.65);
          ctx.closePath();
          ctx.fillStyle=(point.pauseCount||point.pause)?"#ffffff":"#35e8ff";
          ctx.strokeStyle="#102b38";
          ctx.lineWidth=Math.max(1.2,this.zoom*1.4);
          ctx.fill();ctx.stroke();ctx.restore();
          // Preserve the approved pause marker, offset so it doesn't obscure direction.
          if((point.pauseCount||0)>0||point.pause){
            const count=(point.pauseCount||0)+(point.pause?1:0);
            const offset=Math.max(8,scale*.95);
            ctx.beginPath();ctx.arc(p.x+offset,p.y-offset,6,0,Math.PI*2);
            ctx.fillStyle="#ffffff";ctx.fill();ctx.strokeStyle="#252525";ctx.lineWidth=1.5;ctx.stroke();
            ctx.fillStyle="#252525";ctx.font="bold 9px Arial";
            ctx.textAlign="center";ctx.textBaseline="middle";
            ctx.fillText("Ⅱ"+count,p.x+offset,p.y-offset);
          }
        }
        ctx.restore();
      }
    }
    drawTerrainDetail(ctx,x,y,s,terrain,detail){ctx.save();ctx.globalAlpha=.45;if(terrain==="Forest"){for(const dx of [-.28,0,.28]){ctx.fillStyle="#263f30";ctx.beginPath();ctx.moveTo(x+dx*s,y-.16*s);ctx.lineTo(x+(dx-.13)*s,y+.13*s);ctx.lineTo(x+(dx+.13)*s,y+.13*s);ctx.closePath();ctx.fill();ctx.fillStyle=detail;ctx.fillRect(x+dx*s-s*.025,y+.1*s,s*.05,s*.13);}}else if(terrain==="Hills"){ctx.strokeStyle=detail;ctx.lineWidth=Math.max(1,s*.035);for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(x-s*.4,y+s*(i*.18));ctx.quadraticCurveTo(x-s*.1,y-s*.34+s*i*.16,x+s*.4,y+s*(i*.18));ctx.stroke();}}else if(terrain==="River"){ctx.strokeStyle=detail;ctx.lineWidth=Math.max(1,s*.055);ctx.beginPath();ctx.moveTo(x-s*.35,y-s*.25);ctx.quadraticCurveTo(x-s*.05,y,x+s*.05,y-s*.05);ctx.quadraticCurveTo(x+s*.2,y-s*.1,x+s*.35,y+s*.25);ctx.stroke();}else{ctx.strokeStyle=detail;ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x-s*.25+i*s*.12,y+s*.06);ctx.lineTo(x-s*.18+i*s*.12,y-s*.02);ctx.stroke();}}ctx.restore();}
    drawUnitSilhouette(ctx,type){
      type=String(type||'Infantry').toLowerCase();
      ctx.fillStyle=ctx.unitContrastColor||'#ffffff';ctx.strokeStyle=ctx.unitContrastColor||'#ffffff';ctx.lineWidth=2.6;ctx.lineCap='round';ctx.lineJoin='round';
      if(type.includes('inf')){
        ctx.beginPath();ctx.arc(0,-11,3.6,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(-2,3);ctx.moveTo(-1,-2);ctx.lineTo(-8,4);ctx.moveTo(0,-2);ctx.lineTo(7,2);ctx.moveTo(-2,3);ctx.lineTo(-8,12);ctx.moveTo(-2,3);ctx.lineTo(7,11);ctx.stroke();
      }else if(type.includes('mot')){
        ctx.fillRect(-13,-6,16,10);ctx.fillRect(3,-3,7,7);ctx.fillRect(6,-7,4,4);
        ctx.fillStyle=ctx.unitContrastColor||'#ffffff';for(const x of [-8,7]){ctx.beginPath();ctx.arc(x,6,3.5,0,Math.PI*2);ctx.fill();}
      }else if(type.includes('mech')){
        ctx.beginPath();ctx.moveTo(-14,-4);ctx.lineTo(10,-4);ctx.lineTo(14,3);ctx.lineTo(10,7);ctx.lineTo(-11,7);ctx.closePath();ctx.fill();
        ctx.fillRect(-7,-9,13,5);ctx.beginPath();ctx.moveTo(-7,7);ctx.lineTo(10,7);ctx.stroke();
        for(const x of [-8,-2,4,10]){ctx.beginPath();ctx.arc(x,8,2.2,0,Math.PI*2);ctx.fill();}
      }else{
        ctx.beginPath();ctx.moveTo(-15,1);ctx.lineTo(-11,-6);ctx.lineTo(9,-6);ctx.lineTo(15,1);ctx.lineTo(11,7);ctx.lineTo(-11,7);ctx.closePath();ctx.fill();
        ctx.fillRect(-5,-11,10,6);ctx.fillRect(3,-9,15,2.8);
        ctx.fillStyle=ctx.unitContrastColor||'#ffffff';for(const x of [-10,-4,2,8]){ctx.beginPath();ctx.arc(x,7,2.6,0,Math.PI*2);ctx.fill();}
      }
    }
    drawDivision(ctx,d){
      // Defense in depth: no animation or alternate drawing path can reveal an unspotted unit.
      if(!this.visibleDivision(d))return;
      const position=(this.showEndPositions&&this.previewPositions?.get(d.id))||this.visualPositions.get(d.id)||d;
      const c=position.pixelX!==undefined?{x:position.pixelX*this.zoom+this.pan.x,y:position.pixelY*this.zoom+this.pan.y}:this.worldPixel(position.col,position.row);
      if(this.showEndPositions&&position.previewOffsetX)c.x+=position.previewOffsetX;
      const s=this.size,blue=d.side==='Blue';
      // M5.62: Supply shortage is indicated by a large colored S, never by
      // recoloring the unit counter. Do not disclose enemy supply under fog of war.
      const friendly=d.side===(window.ARMAGEDDON_PLAYER_SIDE||'Blue')||window.ARMAGEDDON_VIEW_MODE==='Both';
      const rating=Number.isFinite(Number(d.supply))?Number(d.supply):1;
      // M6.104: spotted enemy divisions show the true controlling player color; hidden enemy divisions remain hidden.
      // Nation remains separate (side + a slim national-color inset stripe).
      // Mike's color is never used until the server records an explicit delegation.
      const ownerId=window.ARMAGEDDON_ASSET_OWNERS?.['unit:'+String(d.id)];
      const ownerColor=window.ARMAGEDDON_PLAYER_COLORS?.[ownerId];
      const nationalColor=blue?'#174e92':'#a71e29';
      const fill=ownerColor||nationalColor;
      const stroke=blue?'#1766d1':'#cf2530'; // National side outline; fill identifies the player or AI
      // M6.73: select black or white symbols from actual counter luminance.
      const rgb=/^#([0-9a-f]{6})$/i.exec(fill);const vals=rgb?[1,3,5].map(i=>parseInt(rgb[1].slice(i-1,i+1),16)/255):[.5,.5,.5];
      const lum=vals.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
      const symbolColor=(blue&&fill===nationalColor)?'#ffffff':(lum>.179?'#080b10':'#ffffff');
      const w=Math.max(26,s*1.14),h=Math.max(27,s*.88),top=c.y-h/2;
      ctx.save();ctx.shadowColor='#000b';ctx.shadowBlur=4;ctx.fillStyle=fill;ctx.strokeStyle=stroke;
      ctx.lineWidth=Math.max(2.2,this.zoom*2.2);ctx.beginPath();ctx.roundRect(c.x-w/2,top,w,h,3);ctx.fill();ctx.stroke();ctx.shadowBlur=0; // M6.198: player-color counter is sufficient; legacy owner corner dot removed.
      // The solid background alone identifies its owning player; no inset stripe
      // or left-hand separator is drawn on either NATO or silhouette counters.
      if(this.unitSymbolStyle==='silhouettes'){
        // White silhouettes cropped from the supplied Redonia/Blue unit artwork.
        const type=String(d.type).toLowerCase();
        const art=this.unitArt[(blue?'blue_':'red_')+type];
        if(art&&art.complete&&art.naturalWidth){
          const scale=Math.min(w*.89/art.naturalWidth,h*.82/art.naturalHeight);
          const iw=art.naturalWidth*scale,ih=art.naturalHeight*scale;
          ctx.save();ctx.filter=symbolColor==='#080b10'?'brightness(0)':'brightness(0) invert(1)';ctx.drawImage(art,c.x-iw/2,c.y-ih/2,iw,ih);ctx.restore();
        }else{
          const k=Math.min(w/35,h/31)*0.94;
          ctx.save();ctx.translate(c.x,c.y);ctx.scale(k,k);ctx.unitContrastColor=symbolColor;this.drawUnitSilhouette(ctx,d.type);delete ctx.unitContrastColor;ctx.restore();
        }
      }else{
      // NATO APP-6 style branch symbols: infantry crossed diagonals, motorized infantry
      // with wheels, mechanized infantry with tracks, armor as a horizontal oval.
      const symY=c.y,sw=w*.86,sh=h*.76;
      ctx.strokeStyle=symbolColor;ctx.lineWidth=Math.max(1.2,this.zoom*1.4);ctx.lineCap='round';
      ctx.strokeRect(c.x-sw/2,symY-sh/2,sw,sh);
      const type=d.type;
      if(type==='Infantry'||type==='Motorized'||type==='Mechanized'){
        ctx.beginPath();ctx.moveTo(c.x-sw/2,symY-sh/2);ctx.lineTo(c.x+sw/2,symY+sh/2);ctx.moveTo(c.x+sw/2,symY-sh/2);ctx.lineTo(c.x-sw/2,symY+sh/2);ctx.stroke();
      }
      if(type==='Armored'||type==='Mechanized'){
        ctx.beginPath();ctx.ellipse(c.x,symY,sw*.36,sh*.34,0,0,Math.PI*2);ctx.stroke();
      }
      if(type==='Motorized'){
        // Large, high-contrast filled wheels placed clear of the NATO box.
        const wheelR=Math.max(2.2,this.zoom*2.6);
        for(const x of [c.x-sw*.30,c.x+sw*.30]){
          ctx.beginPath();ctx.arc(x,symY+sh*.43,wheelR+1.1,0,Math.PI*2);
          ctx.fillStyle=symbolColor;ctx.fill();ctx.strokeStyle=symbolColor;ctx.lineWidth=Math.max(1.4,this.zoom*1.8);ctx.stroke();
          ctx.beginPath();ctx.arc(x,symY+sh*.43,Math.max(1.1,wheelR*.45),0,Math.PI*2);ctx.fillStyle=symbolColor;ctx.fill();
        }
      }
      }
      ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font=`bold ${Math.max(9,10*this.zoom)}px Arial`;
      // Show division number above its counter.
      const number=String(d.name||d.id).match(/\d+/)?.[0]||String(d.id).match(/\d+/)?.[0]||'';
      if(number){ctx.font=`bold ${Math.max(11,11*this.zoom)}px Arial`;ctx.textBaseline='bottom';ctx.lineWidth=3;ctx.strokeStyle='#101820';ctx.strokeText(number,c.x,top-3);ctx.fillStyle='#fff';ctx.fillText(number,c.x,top-3);ctx.textBaseline='middle';}
      // Consecutive morale-failure retreat turns: show the count, not an X.
      const retreatCount=Math.max(0,Number(d.moraleFailureStreak)||0);
      if(retreatCount>0){
        const r=Math.max(8,Math.min(14,w*.20)),bx=c.x+w/2-1,by=top+1;
        ctx.fillStyle='#d92332';ctx.strokeStyle='#fff';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(bx,by,r,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.font=`900 ${retreatCount>=10?Math.max(9,r*.95):Math.max(12,r*1.4)}px Arial`;
        ctx.fillText(String(retreatCount),bx,by+1);
      }
      // M6.134: morale overlay does not alter national/player counter colors.
      // Red is exclusively an actual recorded failed morale check.
      if(this.showMorale&&d.side===(window.ARMAGEDDON_PLAYER_SIDE||window.ARMAGEDDON_SETUP?.playerSide||window.ARMAGEDDON_VIEW_MODE||'Blue')){
        const failed=Number(d.moraleFailureStreak)>0||d.moraleState==='FAILING'||d.moraleStatus==='FAILING'||d.failedMorale===true;
        const e=Number(d.effectiveness);
        const color=failed?'#c72e36':e>=90?'#27834c':e>=70?'#e5bf35':'#e47a26';
        ctx.save();ctx.strokeStyle=color;ctx.lineWidth=Math.max(4,this.zoom*5);ctx.shadowColor=color;ctx.shadowBlur=7;
        ctx.strokeRect(c.x-w/2-4,top-4,w+8,h+8);
        ctx.fillStyle=color;ctx.beginPath();ctx.arc(c.x-w/2-6,top+h/2,Math.max(5,this.zoom*6),0,Math.PI*2);ctx.fill();ctx.restore();
      }
      // M6.169: visible, friendly-only supply overlay for ALL states, including normal supply.
      if(this.showSupply&&friendly){
        const connected=this.supplyAvailability?.get(d.id);
        const out=connected===false;
        const color=rating<=-6?'#ffffff':rating<=-3?'#ff351f':rating<0?'#ffdb00':out?'#c000ff':'#00d94e';
        ctx.save();ctx.shadowBlur=7;ctx.shadowColor=color;ctx.strokeStyle=color;
        ctx.lineWidth=Math.max(4,3*this.zoom);ctx.setLineDash([]);
        ctx.strokeRect(c.x-w/2-4,top-4,w+8,h+8);
        ctx.fillStyle='#091924';ctx.fillRect(c.x-w/2-6,top-16,Math.max(30,34*this.zoom),14);
        ctx.fillStyle=color;ctx.font='bold 11px Arial';ctx.textBaseline='middle';ctx.textAlign='left';
        ctx.fillText('SR '+(rating>0?'+':'')+rating,c.x-w/2-4,top-9);
        ctx.restore();
      }
      // Visible on the division counter regardless of the supply overlay toggle.
      // SR 0/+1 has no marker; -1/-2 yellow, -3..-5 orange, -6 and below white.
      if(friendly&&rating<0){
        const markerColor=rating>=-2?'#ffe044':rating>=-5?'#ff922e':'#ffffff';
        const fs=Math.max(17,Math.min(30,w*.56));
        const mx=c.x-w*.34,my=top+h*.70;
        ctx.font=`900 ${fs}px Arial`;
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.lineJoin='round';ctx.lineWidth=Math.max(3,fs*.24);
        ctx.strokeStyle='#101820';ctx.strokeText('S',mx,my);
        ctx.fillStyle=markerColor;ctx.fillText('S',mx,my);
      }
      if(this.selectedId===d.id){ctx.strokeStyle='#f5d77a';ctx.lineWidth=2.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.arc(c.x,c.y,s*.7,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
      ctx.restore();
    }
  }
  global.ARMAGEDDON_HEX={HexMapRenderer,axialToPixel,pixelToAxial,axialRound,hexPoints,axialFromOffset,offsetFromAxial,hexKey};
})(window);
