function initContactActions(){
  const copyAddress=document.querySelector('[data-copy-address]');
  if(copyAddress){
    copyAddress.addEventListener('click',async()=>{
      const label=copyAddress.querySelector('[data-copy-label]');
      copyAddress.disabled=true;
      try{
        await navigator.clipboard.writeText(copyAddress.dataset.copyAddress);
        copyAddress.classList.add('is-copied');
        label.textContent=copyAddress.dataset.copySuccess;
      }catch{
        const address=document.getElementById(copyAddress.dataset.copyTarget),selection=window.getSelection();
        if(address&&selection){
          const range=document.createRange();range.selectNodeContents(address);
          selection.removeAllRanges();selection.addRange(range);
          label.textContent=copyAddress.dataset.copySelected;
        }else label.textContent=copyAddress.dataset.copyFailed;
      }finally{copyAddress.disabled=false;}
    });
    copyAddress.hidden=false;
  }
}
