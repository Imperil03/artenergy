function initGallery(motion){
  const galleryMore=document.querySelector('#venue-more');
  const galleryToggles=[...document.querySelectorAll('[data-gallery-toggle]')];
  if(galleryMore&&galleryToggles.length){
    galleryMore.dataset.enhanced='true';
    const renderGallery=()=>galleryToggles.forEach(button=>{
      button.hidden=false;
      button.setAttribute('aria-expanded',String(galleryMore.open));
      button.querySelector('span').textContent=galleryMore.open?button.dataset.closeLabel:button.dataset.openLabel;
    });
    galleryToggles.forEach(button=>button.addEventListener('click',()=>{
      galleryMore.open=!galleryMore.open;
      renderGallery();
      if(galleryMore.open){
        galleryMore.querySelectorAll('.venue-photo').forEach((photo,i)=>{
          const frames=motion.reduced?[{opacity:.8},{opacity:1}]:[{opacity:.75,clipPath:'inset(0 0 8% 0 round 8px)'},{opacity:1,clipPath:'inset(0 0 0 0 round 8px)'}];
          motion.run(photo,frames,{duration:motion.timings.state,delay:motion.reduced?0:Math.min(i*24,168)});
        });
        const firstPhoto=galleryMore.querySelector('a[data-gallery]');
        firstPhoto?.focus({preventScroll:true});
        firstPhoto?.scrollIntoView({block:'start',behavior:motion.reduced?'instant':'smooth'});
      }else{
        galleryMore.querySelectorAll('.venue-photo').forEach(photo=>motion.cancel(photo));
        button.focus({preventScroll:true});
        button.scrollIntoView({block:'center',behavior:'instant'});
      }
    }));
    galleryMore.addEventListener('toggle',renderGallery);
    renderGallery();
  }
}
