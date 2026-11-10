
/* M6.27: editable exact starting forces for each side and type. */
(function(){
 const types=['Infantry','Motorized','Mechanized','Armored'];
 const defaults=[16,4,4,4];
 const params=new URLSearchParams(location.search);
 const values={};const manual=new Set();let writing=false;
 function draw(){
  const tbody=document.getElementById('setupForceRows');if(!tbody||writing)return;
  writing=true;tbody.replaceChildren();
  for(let i=0;i<types.length;i++){
   const tr=document.createElement('tr');const label=document.createElement('td');label.textContent=types[i];tr.append(label);
   for(const side of ['Blue','Red']){
    const key=side.toLowerCase()+types[i];const td=document.createElement('td'),input=document.createElement('input');
    input.type='number';input.min='0';input.max='500';input.step='1';input.style.cssText='width:76px;text-align:center;padding:4px';
    input.value=values[key]??params.get(key)??Math.round(defaults[i]*({small:.5,medium:1,large:2,huge:3}[document.getElementById('mapSize')?.value]||1)*(Number(document.getElementById(side.toLowerCase()+'Units')?.value||100)/100));
    values[key]=input.value;
    input.addEventListener('input',()=>{values[key]=input.value;manual.add(key);totals();});td.append(input);tr.append(td);
   }tbody.append(tr);
  }totals();writing=false;
 }
 function totals(){const sum=side=>types.reduce((n,type)=>n+Math.max(0,Number(values[side.toLowerCase()+type])||0),0);const el=document.getElementById('setupForceTotal');if(el)el.textContent=`${sum('Blue')} Blue / ${sum('Red')} Red`;}
 document.addEventListener('DOMContentLoaded',()=>{
  const tbody=document.getElementById('setupForceRows');if(!tbody)return;
  const observer=new MutationObserver(()=>{if(!writing&&tbody.querySelector('input')===null)draw();});observer.observe(tbody,{childList:true});draw();
  document.getElementById('mapSize')?.addEventListener('change',()=>{for(const k of Object.keys(values))delete values[k];manual.clear();setTimeout(draw,0)});
  for(const side of ['Blue','Red'])document.getElementById(side.toLowerCase()+'Units')?.addEventListener('input',()=>{
    const factor=Math.max(0,Number(document.getElementById(side.toLowerCase()+'Units').value)||0)/100;
    const scale={small:.5,medium:1,large:2,huge:3}[document.getElementById('mapSize')?.value]||1;
    for(let i=0;i<types.length;i++){const key=side.toLowerCase()+types[i];if(!manual.has(key))values[key]=String(Math.round(defaults[i]*scale*factor));}
    draw();
  });
  document.getElementById('applyMapSetup')?.addEventListener('click',()=>{
   const url=new URL(location.href);for(const [key,val] of Object.entries(values))url.searchParams.set(key,String(Math.max(0,Math.min(500,Math.floor(Number(val)||0)))));
   // setup submission may build a new URL; persist fields for its existing handler.
   // Exact overrides are scoped to this particular new game, not a later game.
   window.ARMAGEDDON_EXACT_FORCES_SELECTED=Object.fromEntries(Object.entries(values).map(([key,val])=>[key,Math.max(0,Math.min(500,Math.floor(Number(val)||0)))]));
   sessionStorage.removeItem('ARMAGEDDON_EXACT_FORCES');
  },true);
 });
})();
