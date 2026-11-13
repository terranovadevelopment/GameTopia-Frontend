
(function(){
 const types=[['Infantry',12],['Motorized',3],['Mechanized',3],['Armored',3]];
 function refresh(){const b=Number(document.getElementById('blueUnits')?.value||100)/100,r=Number(document.getElementById('redUnits')?.value||100)/100;
 const rows=document.getElementById('setupForceRows');if(!rows)return;
 rows.innerHTML=types.map(([name,n])=>`<tr><td>${name}</td><td>${Math.round(n*b)}</td><td>${Math.round(n*r)}</td></tr>`).join('');
 document.getElementById('setupForceTotal').textContent=`${types.reduce((t,[,n])=>t+Math.round(n*b),0)} Blue / ${types.reduce((t,[,n])=>t+Math.round(n*r),0)} Red`;
 }
 document.addEventListener('change',e=>{if(e.target?.id==='blueUnits'||e.target?.id==='redUnits')refresh()});document.addEventListener('DOMContentLoaded',refresh);
})();
