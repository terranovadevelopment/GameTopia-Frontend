/* ARMAGEDDON Prototype M1 — temporary fictional test scenario. */
(function(global){
  const params=new URLSearchParams(window.location.search);
  const sizeName=['small','medium','large','huge'].includes(params.get('size'))?params.get('size'):'medium';
  const dimensions={small:[30,20],medium:[42,28],large:[60,40],huge:[72,48]};
  const cw=Number(params.get('customWidth')),ch=Number(params.get('customHeight'));
  const [cols,rows]=(Number.isInteger(cw)&&Number.isInteger(ch)&&cw>=12&&cw<=200&&ch>=12&&ch<=150)?[cw,ch]:dimensions[sizeName];
  const scenario={id:'m6-229-deployment',title:'National Border and Deployment',cols,rows,divisions:[]};
  const mobilized=params.get('deployment')!=='unmobilized';
  const mapSeed=String(params.get('seed')||'0');
  let seedValue=2166136261;for(const ch of mapSeed){seedValue=Math.imul(seedValue^ch.charCodeAt(0),16777619)>>>0;}
  const playerSide=params.get('playerSide')==='Red'?'Red':'Blue';
  const handicap={Blue:{units:Math.max(0,Math.min(300,Number(params.get('blueUnits') ?? 100))),rp:Math.max(0,Math.min(9999,Number(params.get('blueRP'))||0))},Red:{units:Math.max(0,Math.min(300,Number(params.get('redUnits') ?? 100))),rp:Math.max(0,Math.min(9999,Number(params.get('redRP'))||0))}};
  global.ARMAGEDDON_PLAYER_SIDE=playerSide;
  const replacementRates={Blue:Math.max(0,Math.min(100,Number(params.get('blueReplacementRate') ?? 100))),Red:Math.max(0,Math.min(100,Number(params.get('redReplacementRate') ?? 100)))};
  global.ARMAGEDDON_SETUP={replacementRates,size:sizeName,deployment:mobilized?'mobilized':'unmobilized',seed:mapSeed,playerSide,handicap};
  const cityIncomeRates={Blue:Math.max(0,Math.min(500,Number(params.get('blueCityRP')??100))),Red:Math.max(0,Math.min(500,Number(params.get('redCityRP')??100)))};
  global.ARMAGEDDON_SETUP.cityIncomeRates=cityIncomeRates;
  scenario.resourcePointsPerCity={Blue:cityIncomeRates.Blue/100,Red:cityIncomeRates.Red/100};
  // M3.22: explicit urban hex clusters; each side has one 3-hex capital.
  // Remaining cities follow a deterministic 70/20/10 distribution (1/2/3 hexes).
  const hash=(a,b)=>{let x=Math.imul(a+173+(seedValue&65535),374761393)^Math.imul(b+91+(seedValue>>>16),668265263);x=Math.imul(x^(x>>>13),1274126177);return ((x^(x>>>16))>>>0)/4294967296;};
  const centers={Urban:[],Forest:[],Lake:[],Swamp:[],Hills:[],Mountains:[]};
  const urbanCells=new Set();
  const key=(c,r)=>c+','+r;
  const inBounds=(c,r)=>c>=0&&r>=0&&c<scenario.cols&&r<scenario.rows;
  // Each settlement is an independent 1-, 2-, or 3-hex cluster.
  // Reserve a one-hex buffer so neighboring settlements can never merge into a 4+ hex city.
  const neighbors=(c,r)=>{const a=(r&1)?[[1,0],[-1,0],[0,-1],[1,-1],[0,1],[1,1]]:[[1,0],[-1,0],[-1,-1],[0,-1],[-1,1],[0,1]];return a.map(([dc,dr])=>[c+dc,r+dr]);};
  const reserved=new Set();
  // Bounded flood fill: never enqueue the same hex twice. Previous duplicate
  // frontier expansion could grow exponentially and freeze map generation.
  const findCityCells=(c,r,size)=>{
    if(!inBounds(c,r)||reserved.has(key(c,r)))return null;
    const chosen=[],queue=[[c,r]],seen=new Set([key(c,r)]);
    for(let i=0;i<queue.length&&chosen.length<size;i++){
      const [x,y]=queue[i];if(reserved.has(key(x,y)))continue;
      chosen.push([x,y]);
      for(const [nx,ny] of neighbors(x,y)){
        const k=key(nx,ny);
        if(inBounds(nx,ny)&&!seen.has(k)&&!reserved.has(k)){
          seen.add(k);queue.push([nx,ny]);
        }
      }
    }
    return chosen.length===size?chosen:null;
  };
  const addCity=(c,r,size)=>{
    const chosen=findCityCells(c,r,size);if(!chosen)return false;
    for(const [x,y] of chosen){urbanCells.add(key(x,y));reserved.add(key(x,y));}
    for(const [x,y] of chosen)for(const [nx,ny] of neighbors(x,y))reserved.add(key(nx,ny));
    centers.Urban.push({c,r,rad:0.5,size,side:r>=border[c]?'Blue':'Red',name:null,isCapital:false});return true;
  };
  // Map setup levels are applied only on a new scenario. Both sides get identical city counts and sizes.
  const allowed=['off','low','normal','high'];
  const density={};
  for(const type of ['cities','forest','hills','mountains','swamp','lakes','rivers','streams']){
    const v=params.get(type);density[type]=allowed.includes(v)?v:((type==='rivers'||type==='streams')?'high':'normal');
  }
  global.ARMAGEDDON_DENSITY=density;
  // North (Red) and South (Blue) get precisely half of the 1176 hexes.
  // Each column contributes boundary[c] Red hexes; paired columns cancel.
  const half=rows/2,border=[];
  for(let c=0;c<cols/2;c++){
    const wave=Math.round(1.4*Math.sin(c*.24)+0.6*Math.sin(c*.11+1.4));
    const delta=Math.max(-2,Math.min(2,wave));
    border[c]=half+delta;border[cols-1-c]=half-delta;
  }
  global.ARMAGEDDON_BORDER=border;
  global.ARMAGEDDON_BORDER_COUNTS={Red:border.reduce((a,b)=>a+b,0),Blue:cols*rows-border.reduce((a,b)=>a+b,0)};
  const multiplier={off:0,low:.5,normal:1,high:2};
  // Terrain coverage is proportional to playable hex area (medium = 42 x 28).
  const areaScale=(cols*rows)/(42*28);
  // One city hex per division on each side, regardless of mobilization.
  const scale={small:2/3,medium:1,large:2,huge:3}[sizeName];
  const unitsPerSide=Math.round(21*scale);
  const targetCityHexes=unitsPerSide;
  // M4.31: roughly the same number of urban hexes per side, but randomized
  // independent settlement positions and approximately 65/25/10% 1/2/3-hex cities.
  // Each side retains exactly one three-hex capital.
  const canPlace=(c,r,size,side)=>{
    const cells=findCityCells(c,r,size);
    return !!cells&&cells.every(([x,y])=>side==='Red'?y<border[x]:y>=border[x]);
  };
  // Capitals are random but strongly favor the geographic center of each nation's
  // territory, horizontally and vertically. The seeded hash preserves reproducibility.
  // Search several weighted candidates before falling back to a full legal scan.
  const chooseCapital=(side)=>{
    const centerCol=(cols-1)/2;
    const centerRow=side==='Red'?(rows-1)/4:3*(rows-1)/4;
    const spreadCol=Math.max(2,cols*.17),spreadRow=Math.max(1.5,rows*.105);
    for(let attempt=0;attempt<600;attempt++){
      // Triangular offsets strongly favor the center while allowing variation.
      const dx=(hash(attempt*41+(side==='Red'?101:503),77)+hash(attempt*47+(side==='Red'?109:509),79)-1)*spreadCol;
      const dy=(hash(attempt*53+(side==='Red'?113:521),83)+hash(attempt*59+(side==='Red'?127:523),89)-1)*spreadRow;
      const c=Math.max(1,Math.min(cols-2,Math.round(centerCol+dx)));
      const r=Math.max(1,Math.min(rows-2,Math.round(centerRow+dy)));
      if(canPlace(c,r,3,side)&&addCity(c,r,3)){
        centers.Urban[centers.Urban.length-1].isCapital=true;
        return;
      }
    }
    // Deterministic fallback, still ordered by closeness to national center.
    const candidates=[];
    for(let r=1;r<rows-1;r++)for(let c=1;c<cols-1;c++)if(canPlace(c,r,3,side))
      candidates.push({c,r,score:Math.abs(c-centerCol)/cols+Math.abs(r-centerRow)/rows});
    candidates.sort((a,b)=>a.score-b.score);
    if(candidates.length&&addCity(candidates[0].c,candidates[0].r,3))
      centers.Urban[centers.Urban.length-1].isCapital=true;
  };
  chooseCapital('Red');
  chooseCapital('Blue');
  // City DENSITY scales the NONCAPITAL CITY COUNT, not just terrain.
  // Each nation always has one 3-hex capital so the victory and supply rules work.
  // Low = 50%, Medium/Normal = 100%, High = 200% of the baseline
  // noncapital settlements. None/off yields no noncapital settlements.
  // Keep the existing roughly 65/25/10 distribution of 1/2/3-hex towns.
  const otherHexTarget=Math.max(0,targetCityHexes-3);
  const baselineCityCount=Math.max(1,Math.round(otherHexTarget/1.47));
  const cityCount=Math.max(0,Math.round(baselineCityCount*multiplier[density.cities]));
  let n3=Math.round(cityCount*.10),n2=Math.round(cityCount*.25),n1=cityCount-n3-n2;
  const citySizes=[...Array(n1).fill(1),...Array(n2).fill(2),...Array(n3).fill(3)];
  // Shuffle sizes reproducibly so clusters do not follow a fixed pattern.
  for(let i=citySizes.length-1;i>0;i--){const j=Math.floor(hash(i*37,947)* (i+1));[citySizes[i],citySizes[j]]=[citySizes[j],citySizes[i]];}
  for(const side of ['Red','Blue']){
    for(let i=0;i<citySizes.length;i++){
      const size=citySizes[i];let placed=false;
      for(let attempt=0;attempt<6500;attempt++){
        const c=1+Math.floor(hash(i*131+attempt*17+(side==='Blue'?991:0),31)*(cols-2));
        const r=1+Math.floor(hash(i*89+attempt*37+(side==='Blue'?1103:0),79)*(rows-2));
        if(!canPlace(c,r,size,side))continue;
        if(addCity(c,r,size)){placed=true;break;}
      }
      if(!placed)console.warn('Unable to place city',side,size,i);
    }
  }
  // Small scattered clusters: maintain gaps, with multiple adjacent hexes in a patch.
  // A deterministic seed makes the same setup reproducible.
  const specs=[['Forest',29,1.12],['Lake',10,0.96],['Swamp',12,1.08],['Hills',25,1.08],['Mountains',13,1.02]];
  const densityKey={Forest:'forest',Lake:'lakes',Swamp:'swamp',Hills:'hills',Mountains:'mountains'};
  const centersPlaced=[];
  for(const [type,baseCount,baseRadius] of specs){
    const count=Math.round(baseCount*areaScale*multiplier[density[densityKey[type]]]);
    for(let i=0;i<count;i++){
      let best=null;
      for(let attempt=0;attempt<50;attempt++){
        const c=1+Math.floor(hash(i*127+attempt*23+type.length*41,63)*(cols-2));
        const r=1+Math.floor(hash(i*71+attempt*19+type.length*97,53)*(rows-2));
        const separation=centersPlaced.reduce((m,p)=>Math.min(m,Math.hypot(c-p.c,(r-p.r)*1.12)),99);
        if(!best||separation>best.separation)best={c,r,separation};
        if(separation>=2.15)break;
      }
      const rad=baseRadius*(.48+.85*hash(i*43+type.length*17,7));
      centers[type].push({c:best.c,r:best.r,rad});
      centersPlaced.push({c:best.c,r:best.r});
    }
  }
  // M3.50: one seed-dependent drainage graph, not independently intersecting splines.
  // Trunks occupy separate drainage corridors. Tributaries join their own trunk.
  // Every river has a connected downstream path to a map edge.
  const riverCount=Math.round(2*multiplier[density.rivers]*cols/42);
  const trunkCount=Math.min(riverCount,Math.max(1,Math.round(2*cols/42)));
  const waterways=[],trunkPaths=[];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const heightAt=(c,r)=>{
    const ridge=Math.sin(c*.23+hash(101,7)*6.28)*.25+Math.cos(r*.19+hash(107,9)*6.28)*.19;
    const local=(hash(Math.floor(c*1.5)+400,Math.floor(r*1.5)+700)-.5)*.13;
    return 1-r/(rows-1)+ridge+local;
  };
  // Use a continuous downstream north-to-south direction, with separate, seeded
  // longitudinal corridors; natural bends are damped at the edge outlets.
  for(let i=0;i<trunkCount;i++){
    const lane=(i+.5)/trunkCount;
    const base=(cols-1)*(.12+.76*lane);
    const phase=hash(i+307,19)*Math.PI*2;
    const amplitude=Math.min(2.1,(cols-1)*.09);
    const path=[];
    for(let j=-8;j<=rows*6+8;j++){
      const t=j/(rows*6),r=t*(rows-1);
      const bend=amplitude*(.68*Math.sin(t*7.1+phase)+.32*Math.sin(t*13.9+phase*.7));
      const c=clamp(base+bend,1,cols-2);
      path.push({col:c,row:r});
    }
    waterways.push(path);trunkPaths.push(path);
  }
  // Tributaries originate at the edge of their own catchment and meet the trunk
  // at a shared vertex. No two independent river trunks intersect.
  for(let i=trunkCount;i<riverCount;i++){
    const index=(i-trunkCount)%trunkCount,trunk=trunkPaths[index];
    const t=.26+.47*hash(i+511,33);
    const joinIndex=8+Math.round(t*rows*6),join=trunk[joinIndex];
    const side=(i-trunkCount)%2===0?-1:1;
    const laneWidth=(cols-1)/trunkCount;
    const startCol=clamp(join.col+side*laneWidth*.38,0,cols-1);
    const startRow=-1.8; // upper map edge is a valid upstream source
    const path=[];const steps=80,phase=hash(i+603,77)*6.28;
    for(let j=0;j<=steps;j++){
      const u=j/steps;
      const wiggle=Math.sin(Math.PI*u)*.65*Math.sin(u*12+phase);
      path.push({col:startCol+(join.col-startCol)*u+wiggle,row:startRow+(join.row-startRow)*u});
    }
    path[steps]={...join};waterways.push(path);
  }
  // M6.228: a seeded drainage axis. Earlier every river flowed north-to-south.
  // Transform whole river networks (including tributary joins) together, so
  // lakes, bridges and hex-edge crossings still use the same geometry below.
  const drainageAxis=['north-south','west-east','northwest-southeast','northeast-southwest'][Math.floor(hash(1773,987)*4)];
  if(drainageAxis!=='north-south'){
    const shapeRiver=p=>{
      const along=p.row/(rows-1),lateral=p.col/(cols-1)-.5;
      if(drainageAxis==='west-east')return {col:along*(cols-1),row:(.5-lateral)*(rows-1)};
      if(drainageAxis==='northwest-southeast')return {
        col:(along+.62*lateral)*(cols-1),row:(along-.62*lateral)*(rows-1)};
      return {col:(1-along+.62*lateral)*(cols-1),row:(along+.62*lateral)*(rows-1)};
    };
    for(const path of waterways)for(let i=0;i<path.length;i++)path[i]=shapeRiver(path[i]);
  }
  global.ARMAGEDDON_RIVER_DIRECTION=drainageAxis;
  // Build the actual hex-side graph. Vertex keys are quantized coordinates;
  // therefore neighboring hexes share precisely the same graph edges.
  const streamEdges=[],streamKeys=new Set(),edgeGraph=new Map(),vertexPositions=new Map();
  const streamVertexUsage=new Map();
  const hexCenter=(c,r)=>({x:Math.sqrt(3)*(c+(r%2)*.5),y:1.5*r});
  const vKey=p=>Math.round(p.x*10000)+','+Math.round(p.y*10000);
  const addGraphEdge=(a,b,c,r)=>{
    const ak=vKey(a),bk=vKey(b),ek=[ak,bk].sort().join('|');
    vertexPositions.set(ak,a);vertexPositions.set(bk,b);
    if(!edgeGraph.has(ak))edgeGraph.set(ak,[]);
    if(!edgeGraph.has(bk))edgeGraph.set(bk,[]);
    if(!edgeGraph.get(ak).some(e=>e.key===ek))edgeGraph.get(ak).push({to:bk,key:ek,c,r});
    if(!edgeGraph.get(bk).some(e=>e.key===ek))edgeGraph.get(bk).push({to:ak,key:ek,c,r});
  };
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const center=hexCenter(c,r);
    const vv=Array.from({length:6},(_,j)=>({x:center.x+Math.cos((j*60-90)*Math.PI/180),y:center.y+Math.sin((j*60-90)*Math.PI/180)}));
    for(let j=0;j<6;j++)addGraphEdge(vv[j],vv[(j+1)%6],c,r);
  }
  // Streams are vertex-to-vertex walks. Each segment is a real hex side, not a
  // center-to-center line. Each reaches the boundary or a main river bank.
  const streamCount=Math.round(19*multiplier[density.streams]*areaScale);
  const vertexList=[...vertexPositions.keys()];
  const nearRiver=(v)=>{
    if(!waterways.length)return false;
    const p=vertexPositions.get(v);
    return waterways.some(path=>path.some((w,j)=>j%5===0&&Math.hypot(p.x-hexCenter(Math.floor(w.col),Math.floor(w.row)).x,p.y-1.5*w.row)<1.25));
  };
  const riverVertices=waterways.length?vertexList.filter(nearRiver):[];
  const boundaryVertices=vertexList.filter(k=>{const p=vertexPositions.get(k);return p.y<-.45||p.y>1.5*(rows-1)+.45||p.x<-.4||p.x>Math.sqrt(3)*(cols-.15);});
  // M6.229: streams usually originate in the interior and drain into a
  // river, rather than appearing as arbitrary border-to-border channels.
  const uplandSources=vertexList.filter(k=>{
    const p=vertexPositions.get(k),approxCol=p.x/Math.sqrt(3),approxRow=p.y/1.5;
    return approxCol>2&&approxCol<cols-3&&approxRow>2&&approxRow<rows-3&&!nearRiver(k);
  }).sort((a,b)=>{
    const av=vertexPositions.get(a),bv=vertexPositions.get(b);
    const ah=heightAt(av.x/Math.sqrt(3),av.y/1.5),bh=heightAt(bv.x/Math.sqrt(3),bv.y/1.5);
    return bh-ah||a.localeCompare(b);
  });
  // A* over the vertex graph, directed toward a guaranteed terminal vertex.
  const routeVertex=(start,goal,maxSteps)=>{
    const goalP=vertexPositions.get(goal),seen=new Set([start]),came=new Map(),queue=[start];
    for(let head=0;head<queue.length&&head<maxSteps;head++){
      const v=queue[head];if(v===goal){const path=[v];while(came.has(path[0]))path.unshift(came.get(path[0]));return path;}
      const adjacent=(edgeGraph.get(v)||[]).slice().sort((a,b)=>{
        const ap=vertexPositions.get(a.to),bp=vertexPositions.get(b.to);
        return Math.hypot(ap.x-goalP.x,ap.y-goalP.y)-Math.hypot(bp.x-goalP.x,bp.y-goalP.y);
      });
      for(const e of adjacent)if(!seen.has(e.to)){seen.add(e.to);came.set(e.to,v);queue.push(e.to);}
    }
    return null;
  };
  for(let i=0;i<streamCount;i++){
    const terminals=riverVertices.length?riverVertices:boundaryVertices;
    if(!terminals.length||!boundaryVertices.length)break;
    const sources=riverVertices.length&&uplandSources.length?uplandSources:boundaryVertices;
    const start=sources[Math.floor(hash(i+721,41)*Math.min(sources.length,Math.max(100,streamCount*40)))];
    const startP=vertexPositions.get(start);
    // Prefer river outlets nearby, but allow edge outlets if there is no river.
    const sorted=terminals.map(k=>({k,d:Math.hypot(vertexPositions.get(k).x-startP.x,vertexPositions.get(k).y-startP.y)})).filter(o=>o.d>5).sort((a,b)=>a.d-b.d);
    const goal=sorted[Math.min(sorted.length-1,Math.floor(hash(i+839,27)*Math.min(5,sorted.length)))]?.k;
    if(!goal)continue;
    const path=routeVertex(start,goal,vertexList.length);
    // Avoid excessively long, overlapping, dense stream tangles.
    if(path && path.length>Math.max(18,Math.round((cols+rows)*.26)))continue;
    if(path && path.slice(1,-1).some(v=>(streamVertexUsage.get(v)||0)>=2))continue;
    if(!path||path.length<5)continue;
    for(const v of path)streamVertexUsage.set(v,(streamVertexUsage.get(v)||0)+1);
    for(let j=1;j<path.length;j++){
      const a=vertexPositions.get(path[j-1]),b=vertexPositions.get(path[j]);
      const ekey=[path[j-1],path[j]].sort().join('|');
      if(streamKeys.has(ekey))continue;
      streamKeys.add(ekey);
      streamEdges.push([{x:a.x,y:a.y},{x:b.x,y:b.y}]);
    }
  }
  // Snap all major rivers to the SAME shared-hex-side graph as streams.
  // A* connects successive river samples; no river segment crosses a hex interior.
  const riverEdges=[],riverEdgeKeys=new Set();
  const nearestVertex=(p)=>{
    const center=hexCenter(p.col,p.row);let best=null,dist=Infinity;
    const rr=Math.round(p.row);
    for(let r=Math.max(0,rr-3);r<=Math.min(rows-1,rr+3);r++){
      const cc=Math.round(p.col-(r%2)*.5+(p.row%2)*.5);
      for(let c=Math.max(0,cc-3);c<=Math.min(cols-1,cc+3);c++){
        const hc=hexCenter(c,r);
        for(let j=0;j<6;j++){
          const a=(j*60-90)*Math.PI/180;
          const x=hc.x+Math.cos(a),y=hc.y+Math.sin(a);
          const d=(x-center.x)**2+(y-center.y)**2;
          if(d<dist){dist=d;best=vKey({x,y});}
        }
      }
    }
    return best;
  };
  const routeRiver=(start,goal)=>{
    if(!start||!goal)return null;if(start===goal)return [start];
    const target=vertexPositions.get(goal),heur=k=>{const p=vertexPositions.get(k);return Math.hypot(p.x-target.x,p.y-target.y);};
    const open=[{k:start,f:heur(start)}],scores=new Map([[start,0]]),prev=new Map(),closed=new Set();
    let steps=0;
    while(open.length&&steps++<15000){
      // Each waypoint is local (normally only a few hexes), so sorting is inexpensive.
      open.sort((a,b)=>b.f-a.f);const current=open.pop().k;
      if(closed.has(current))continue;if(current===goal){const path=[goal];while(prev.has(path[0]))path.unshift(prev.get(path[0]));return path;}
      closed.add(current);
      for(const e of edgeGraph.get(current)||[]){if(closed.has(e.to))continue;
        const tentative=scores.get(current)+1;
        if(tentative<(scores.get(e.to)??Infinity)){scores.set(e.to,tentative);prev.set(e.to,current);open.push({k:e.to,f:tentative+heur(e.to)});}
      }
    }
    return null;
  };
  for(const river of waterways){
    const samples=[];
    for(let j=0;j<river.length;j+=Math.max(1,Math.floor(river.length/65)))samples.push(river[j]);
    samples.push(river[river.length-1]);
    const vertices=samples.map(nearestVertex).filter(Boolean);
    for(let j=1;j<vertices.length;j++){
      const path=routeRiver(vertices[j-1],vertices[j]);if(!path)continue;
      for(let k=1;k<path.length;k++){
        const ek=[path[k-1],path[k]].sort().join('|');if(riverEdgeKeys.has(ek))continue;
        riverEdgeKeys.add(ek);
        riverEdges.push([{...vertexPositions.get(path[k-1])},{...vertexPositions.get(path[k])}]);
      }
    }
  }
  // Eliminate dangling inland one-edge branches introduced by snapping curves
  // to the shared hex-edge graph. Only genuine map-edge endpoints survive.
  const vertexId=p=>vKey(p);
  let pruned=true;
  while(pruned){
    pruned=false;
    const degree=new Map();
    for(const [a,b] of riverEdges){for(const p of [a,b])degree.set(vertexId(p),(degree.get(vertexId(p))||0)+1);}
    for(let i=riverEdges.length-1;i>=0;i--){
      const [a,b]=riverEdges[i];
      const outside=p=>p.y<0.9||p.y>1.5*(rows-1)-0.9||p.x<0.9||p.x>Math.sqrt(3)*(cols-.25);
      if((degree.get(vertexId(a))===1&&!outside(a))||(degree.get(vertexId(b))===1&&!outside(b))){riverEdges.splice(i,1);pruned=true;}
    }
  }
  // M5.07: Match a water segment to the EXACT hex edge by its two vertices.
  // Previous nearest-hex-center inference could assign a river crossing to a
  // neighboring clear-to-clear move, particularly near bends and junctions.
  const sideOwners=new Map();
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const center=hexCenter(c,r);
    const vertices=Array.from({length:6},(_,j)=>({x:center.x+Math.cos((j*60-90)*Math.PI/180),y:center.y+Math.sin((j*60-90)*Math.PI/180)}));
    for(let j=0;j<6;j++){
      const ek=[vKey(vertices[j]),vKey(vertices[(j+1)%6])].sort().join('|');
      if(!sideOwners.has(ek))sideOwners.set(ek,[]);
      sideOwners.get(ek).push(key(c,r));
    }
  }
  const exactCrossings=edges=>{
    const result=new Set();
    for(const [a,b] of edges){
      const ek=[vKey(a),vKey(b)].sort().join('|');
      const owners=sideOwners.get(ek)||[];
      if(owners.length===2)result.add(owners.slice().sort().join('|'));
    }
    return result;
  };
  // M5.11: A lake owns its entire shoreline. Do not draw river/stream
  // hexside graphics against a lake, and do not charge a water crossing there.
  // Keep the displayed edges and crossing-key sets derived from identical lists.
  const touchesLake=([a,b])=>{
    const edge=[vKey(a),vKey(b)].sort().join('|');
    const owners=sideOwners.get(edge)||[];
    return owners.some(cell=>{
      const [c,r]=cell.split(',').map(Number);
      return terrainAt(c,r)==='Lake';
    });
  };
  const visibleRiverEdges=riverEdges.filter(edge=>!touchesLake(edge));
  const visibleStreamEdges=streamEdges.filter(edge=>!touchesLake(edge));
  global.ARMAGEDDON_RIVER_EDGES=visibleRiverEdges;
  const crossingKeys=exactCrossings(visibleStreamEdges);
  global.ARMAGEDDON_DRAINAGE={trunks:trunkCount,tributaries:Math.max(0,riverCount-trunkCount),outlets:'map edges or main river',seed:mapSeed,model:'connected-drainage-graph',direction:drainageAxis};
  global.ARMAGEDDON_WATERWAYS=waterways;
  global.ARMAGEDDON_STREAM_EDGES=visibleStreamEdges;
  global.ARMAGEDDON_STREAM_KEYS=crossingKeys;
  global.ARMAGEDDON_RIVER_KEYS=exactCrossings(visibleRiverEdges);
  function terrainAt(col,row){
    if(urbanCells.has(key(col,row)))return 'Urban';
    for(const type of ['Lake','Swamp','Mountains','Hills','Forest']){
      for(const a of centers[type]){
        const dx=(col-a.c)/a.rad,dy=(row-a.r)/(a.rad*.9);
        if(dx*dx+dy*dy<1)return type;
      }
    }
    if(waterways.some(path=>path.some((p,i)=>i%3===0&&Math.hypot(col-p.col,row-p.row)<.48)))return 'River';
    return 'Plains';
  }
  // Generate a name bank five times larger than the number of cities,
  // and draw distinct names reproducibly from that bank for each nation.
  const blueRoots=['Eisen','Falken','Wolfs','Berg','Alten','Grün','Kron','Rosen','Stein','Hohen','Linden','Wald','Silber','Ritter','Nord','Felsen','Sonnen','Tannen','Brücken','Adler'];
  const blueEnds=['burg','heim','dorf','stadt','feld','wald','berg','bruck','fels','hafen','tal','furt','kirchen','brunn','hausen'];
  const redRoots=['Novo','Belo','Drago','Zelen','Vost','Rado','Kras','Miro','Bori','Ostro','Veli','Slavo','Dubro','Malo','Taro','Zoro','Kiro','Soko','Brest','Doro'];
  const redEnds=['grad','vsk','mir','ka','rov','slav','in','pol','gor','sk','ovo','ino','ets','nik','ava'];
  function nameBank(roots,ends,count,salt){
    const all=[];for(const root of roots)for(const end of ends)all.push(root+end);
    for(let i=all.length-1;i>0;i--){const j=Math.floor(hash(i*47+salt,29)*(i+1));[all[i],all[j]]=[all[j],all[i]];}
    return all.slice(0,Math.min(all.length,count));
  }
  const countBlue=centers.Urban.filter(c=>c.side==='Blue').length,countRed=centers.Urban.filter(c=>c.side==='Red').length;
  const blueNames=nameBank(blueRoots,blueEnds,countBlue*5,1101),redNames=nameBank(redRoots,redEnds,countRed*5,2202);
  let bi=0,ri=0;for(const city of centers.Urban)city.name=city.side==='Blue'?blueNames[bi++]:redNames[ri++];
  global.ARMAGEDDON_CITY_NAME_BANK={Blue:blueNames,Red:redNames};
  global.ARMAGEDDON_CITIES=centers.Urban;

  // Force composition is per side. City-hex figures are scenario targets, not extra units.
  const forceTypes=[['Infantry',12],['Motorized',3],['Mechanized',3],['Armored',3]];
  const hexDistance=(a,b)=>{const aq=a.col-Math.floor(a.row/2),bq=b.col-Math.floor(b.row/2),dr=a.row-b.row,dq=aq-bq;return Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr));};
  const used=new Set();
  const cityHexes=Array.from(urbanCells).map(k=>{const [col,row]=k.split(',').map(Number);return {col,row};});
  const isSide=(p,side)=>side==='Red'?p.row<border[p.col]:p.row>=border[p.col];
  const allCells=[];for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)allCells.push({col,row});
  function shuffled(items,seed){return items.slice().sort((a,b)=>hash(a.col*17+a.row*131,seed)-hash(b.col*17+b.row*131,seed));}
  // Exact distance to enemy-controlled territory using the six-sided hex graph.
  const enemyDistance={};
  for(const side of ['Blue','Red']){
    const distances=new Map(),queue=[];
    for(const p of allCells)if(!isSide(p,side)){
      distances.set(key(p.col,p.row),0);queue.push(p);
    }
    for(let i=0;i<queue.length;i++){
      const p=queue[i],d=distances.get(key(p.col,p.row));
      if(d>=6)continue;
      for(const [c,r] of neighbors(p.col,p.row)){
        const k=key(c,r);
        if(inBounds(c,r)&&!distances.has(k)){
          distances.set(k,d+1);queue.push({col:c,row:r});
        }
      }
    }
    enemyDistance[side]=distances;
  }
  for(const side of ['Blue','Red']){
    // Only exact counts embedded in this new game's query may override the percent setting.
    // Never inherit an earlier scenario's sessionStorage counts.
    const exact={};
    const types=forceTypes.flatMap(([type,count])=>{const k=side.toLowerCase()+type;const requested=params.get(k)??exact[k];const n=requested!==undefined?Math.max(0,Math.min(500,Math.floor(Number(requested)||0))):Math.round(count*scale*handicap[side].units/100);return Array.from({length:n},()=>type);});
    const friendlyCities=shuffled(cityHexes.filter(p=>isSide(p,side)),side==='Blue'?9:19);
    const adjacent=shuffled(allCells.filter(p=>isSide(p,side)&&terrainAt(p.col,p.row)!=='Lake'&&!urbanCells.has(key(p.col,p.row))&&friendlyCities.some(city=>hexDistance(p,city)===1)),side==='Blue'?27:37);
    // Very low city density (especially None) cannot accommodate every division
    // in urban hexes or the first ring. Use the nearest available second ring
    // before allowing any broader, friendly-territory fallback; never stack units.
    const adjacentKeys=new Set(adjacent.map(p=>key(p.col,p.row)));
    const cityOverflow=shuffled(allCells.filter(p=>isSide(p,side)&&terrainAt(p.col,p.row)!=='Lake'&&!urbanCells.has(key(p.col,p.row))&&!adjacentKeys.has(key(p.col,p.row))),side==='Blue'?29:39);
    const cityOverflowDist=new Map(cityOverflow.map(p=>[key(p.col,p.row),Math.min(...friendlyCities.map(c=>hexDistance(p,c)))]));
    cityOverflow.sort((a,b)=>cityOverflowDist.get(key(a.col,a.row))-cityOverflowDist.get(key(b.col,b.row)));
    // The frontline is the nearest enemy-national hex (distance 0 on the
    // opposite side); mobilized forward divisions stand exactly 3 or 4 hexes
    // from it. All random choices are deterministically seeded for replay.
    const nearBorder=shuffled(allCells.filter(p=>isSide(p,side)&&!urbanCells.has(key(p.col,p.row))&&terrainAt(p.col,p.row)!=='Lake'&&[3,4].includes(enemyDistance[side].get(key(p.col,p.row)))),side==='Blue'?47:57);
    const forwardOverflow=shuffled(allCells.filter(p=>isSide(p,side)&&terrainAt(p.col,p.row)!=='Lake'),side==='Blue'?49:59)
      .sort((a,b)=>Math.abs((enemyDistance[side].get(key(a.col,a.row))||5)-3.5)-Math.abs((enemyDistance[side].get(key(b.col,b.row))||5)-3.5));
    // 20% of a mobilized force remains in random urban hexes behind the front.
    // Prefer genuinely rearward city hexes, with a stable random order within
    // distance tiers. Exclude frontline urban hexes when a rear city exists.
    const rearCities=shuffled(friendlyCities,side==='Blue'?107:117)
      .sort((a,b)=>(enemyDistance[side].get(key(b.col,b.row))||0)-(enemyDistance[side].get(key(a.col,a.row))||0));
    const mobilizedCityCount=mobilized?Math.round(types.length*.20):types.length;
    const pick=(pool)=>pool.find(p=>!used.has(key(p.col,p.row)));
    // Select which 20% of divisions serve as rear-city garrisons randomly;
    // do not always assign the first (often infantry) types to the rear.
    const rearUnitIds=new Set(mobilized?shuffled(types.map((_,index)=>({col:index,row:0,index})),side==='Blue'?137:147)
      .slice(0,mobilizedCityCount).map(p=>p.index):types.map((_,index)=>index));
    for(let i=0;i<types.length;i++){
      const rearCityUnit=rearUnitIds.has(i);
      const spot=mobilized
        ?(rearCityUnit?(pick(rearCities)||pick(adjacent)||pick(cityOverflow)): (pick(nearBorder)||pick(forwardOverflow)))
        :(pick(friendlyCities)||pick(adjacent)||pick(cityOverflow));
      if(!spot)throw Error('Not enough valid '+(mobilized?'mobilized':'unmobilized')+' deployment hexes for '+side);
      used.add(key(spot.col,spot.row));
      const type=types[i],n=i+1;
      scenario.divisions.push({id:(side==='Blue'?'B':'R')+'-'+String(n).padStart(2,'0'),side,name:n+'th '+type,type,strength:10000,experience:90,supply:1,col:spot.col,row:spot.row});
    }
  }
  global.ARMAGEDDON_FORCE_COUNTS={size:sizeName,scale,perSide:unitsPerSide,cityHexTarget:targetCityHexes,actualCityHexesPerSide:{Blue:cityHexes.filter(p=>isSide(p,'Blue')).length,Red:cityHexes.filter(p=>isSide(p,'Red')).length},mobilizedCityUnits:mobilized?Math.round(unitsPerSide*.20):unitsPerSide,handicap};
  global.ARMAGEDDON_DATA={scenario,terrainAt};
})(window);
