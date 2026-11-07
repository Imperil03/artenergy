function initOverview(motion,dialogMotion){
  const overview=document.querySelector('[data-overview-dialog]');
  const overviewLink=document.querySelector('[data-overview]');
  if(overview&&overviewLink&&typeof overview.showModal==='function'){
    const player=overview.querySelector('[data-overview-video]');
    const close=overview.querySelector('[data-overview-close]');
    const error=overview.querySelector('[data-overview-error]');
    const overviewMotion=dialogMotion(overview,()=>player.pause());
    overviewLink.setAttribute('aria-haspopup','dialog');
    overviewLink.addEventListener('click',event=>{
      if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      event.preventDefault();
      error.hidden=true;
      overview.showModal();
      motion.run(overview,[{opacity:.75},{opacity:1}]);
      document.body.classList.add('is-locked');
      player.src=overviewLink.href;
      player.play().catch(()=>{/* Native controls remain available if playback needs another gesture. */});
      close.focus();
    });
    close.addEventListener('click',overviewMotion.dismiss);
    overview.addEventListener('click',event=>{if(event.target===overview)overviewMotion.dismiss();});
    player.addEventListener('error',()=>{if(overview.open)error.hidden=false;});
    overview.addEventListener('close',()=>{
      player.pause();
      player.removeAttribute('src');
      player.load();
      document.body.classList.remove('is-locked');
      overviewLink.focus({preventScroll:true});
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();});
  }
}
