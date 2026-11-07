/* URMM phase 1: planning-boundary export/import. Not a durable TI checkpoint. */
(function(root){
  'use strict';
  const FORMAT=1;
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function validate(state){
    if(!state||typeof state!=='object'||Array.isArray(state))throw Error('Recovery state must be an object');
    if(state.format!==FORMAT||state.kind!=='armageddon-planning')throw Error('Unsupported recovery state format');
    if(!state.payload||typeof state.payload!=='object')throw Error('Missing recovery payload');
    const s=state.payload;
    if(!Number.isInteger(s.day)||s.day<1||!Number.isInteger(s.ti)||s.ti<0||s.ti>10)throw Error('Invalid turn position');
    if(!Array.isArray(s.divisions)||!Array.isArray(s.routes)||!Array.isArray(s.cityState))throw Error('Missing game collections');
    if(!s.treasury||typeof s.treasury!=='object'||!s.reserves||typeof s.reserves!=='object')throw Error('Missing economy state');
    if(!s.replacementState)throw Error('Missing replacement state');
    if(s.divisions.some(d=>!d||d.id===undefined||!Number.isFinite(d.col)||!Number.isFinite(d.row)))throw Error('Invalid division');
    if(new Set(s.divisions.map(d=>String(d.id))).size!==s.divisions.length)throw Error('Duplicate division IDs');
    return true;
  }
  function wrap(snapshot){const state={format:FORMAT,kind:'armageddon-planning',payload:clone(snapshot)};validate(state);return state;}
  function unwrap(state){validate(state);return clone(state.payload);}
  const api=Object.freeze({format:FORMAT,wrap,unwrap,validate});
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ARMAGEDDON_RECOVERY_STATE=api;
})(typeof window!=='undefined'?window:globalThis);
