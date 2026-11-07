
(function(){
 function finishSetupLayout(){
  const width=document.getElementById('customWidth')?.closest('label');
  const height=document.getElementById('customHeight')?.closest('label');
  if(width&&height&&width.parentElement&&height.previousElementSibling!==width){
    width.insertAdjacentElement('afterend',height);
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',finishSetupLayout);
 else finishSetupLayout();
})();
