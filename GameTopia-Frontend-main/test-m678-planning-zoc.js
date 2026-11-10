const fs=require('fs'),vm=require('vm'),assert=require('assert');
const context={window:{ARMAGEDDON_VIEW_MODE:'Both',ARMAGEDDON_PLAYER_SIDE:'Blue',ARMAGEDDON_HEX:{axialFromOffset:(col,row)=>({q:col-Math.floor(row/2),r:row})},ARMAGEDDON_DATA:{terrainAt:()=> 'Plains'},ARMAGEDDON_MOVEMENT:{cost:()=>1},ARMAGEDDON_ZOC:{compute:()=>{throw Error('Planning must not compute ZOC')}}}};
vm.runInNewContext(fs.readFileSync(__dirname+'/src/routes.js','utf8'),context);
const scenario={cols:20,rows:20,divisions:[{id:'b',side:'Blue',col:2,row:2,strength:100},{id:'r',side:'Red',col:7,row:2,strength:100}]};
const planner=new context.window.ARMAGEDDON_ROUTES.RoutePlanner(scenario);
assert.equal(planner.plotTo('b',{col:6,row:2}).ok,true);
assert.equal(planner.plotTo('b',{col:7,row:2}).ok,true);
console.log('M6.78 planning ZOC and enemy destination tests passed');
