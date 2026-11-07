function initLightbox(motion,dialogMotion){
  const dialog=document.querySelector('[data-lightbox]');
  if(dialog&&typeof dialog.showModal==='function'){
    const image=dialog.querySelector('[data-lightbox-image]');
    const caption=dialog.querySelector('[data-lightbox-caption]');
    const count=dialog.querySelector('[data-lightbox-count]');
    const previous=dialog.querySelector('[data-lightbox-prev]');
    const next=dialog.querySelector('[data-lightbox-next]');
    const close=dialog.querySelector('[data-lightbox-close]');
    let collection=[],index=0,trigger=null,imageVersion=0,flight=null,swipeClickUntil=0;
    const stopFlight=()=>{
      if(!flight)return;
      const current=flight;flight=null;
      current.animation?.cancel();current.layer.remove();image.style.removeProperty('opacity');
    };
    const viewerMotion=dialogMotion(dialog,()=>{stopFlight();motion.cancel(image);imageVersion++;});
    const update=(animate=false)=>{
      stopFlight();motion.cancel(image);
      const item=collection[index];
      const source=item.querySelector('img');
      const version=++imageVersion;
      image.src=source?.currentSrc||source?.src||item.href;
      image.alt=source?.alt||item.dataset.caption||'';
      caption.textContent=item.dataset.caption||image.alt;
      count.textContent=collection.length>1?`${index+1} / ${collection.length}`:'';
      previous.hidden=next.hidden=collection.length<2;
      if(animate)motion.run(image,[{opacity:.65},{opacity:1}]);
      // Keep the cached thumbnail visible until the full-size frame has loaded.
      if(image.getAttribute('src')!==item.href){
        const full=new Image();
        full.onload=()=>{if(version===imageVersion&&dialog.open&&!viewerMotion.exiting)image.src=item.href;};
        full.src=item.href;
      }
    };
    const openFromThumbnail=link=>{
      const source=link.querySelector('img');
      if(motion.reduced||!source?.complete||!source.naturalWidth){
        motion.run(image,[{opacity:.8},{opacity:1}]);return;
      }
      const from=link.getBoundingClientRect(),sourceBox=source.getBoundingClientRect(),box=image.getBoundingClientRect();
      const width=Number(source.getAttribute('width'))||source.naturalWidth;
      const height=Number(source.getAttribute('height'))||source.naturalHeight;
      const fit=Math.min(box.width/width,box.height/height);
      const target={width:width*fit,height:height*fit,left:box.left+(box.width-width*fit)/2,top:box.top+(box.height-height*fit)/2};
      if(!from.width||!from.height||!target.width||!target.height)return;
      const scale=Math.max(sourceBox.width/target.width,sourceBox.height/target.height);
      const position=getComputedStyle(source).objectPosition.split(' ').map(value=>value.endsWith('%')?Math.max(0,Math.min(1,parseFloat(value)/100)):.5);
      const originX=sourceBox.left-Math.max(0,target.width*scale-sourceBox.width)*position[0];
      const originY=sourceBox.top-Math.max(0,target.height*scale-sourceBox.height)*(position[1]??.5);
      const left=Math.max(0,from.left-originX),top=Math.max(0,from.top-originY);
      const right=Math.max(0,originX+target.width*scale-from.right),bottom=Math.max(0,originY+target.height*scale-from.bottom);
      const radius=parseFloat(getComputedStyle(link).borderTopLeftRadius)||0;
      const layer=document.createElement('div'),frame=document.createElement('img');
      layer.className='photo-flight-layer';layer.setAttribute('aria-hidden','true');
      frame.className='photo-flight';frame.alt='';frame.src=source.currentSrc||source.src;
      frame.style.width=`${target.width}px`;frame.style.height=`${target.height}px`;
      layer.append(frame);dialog.append(layer);
      const current={layer,animation:null};flight=current;
      try{
        current.animation=motion.run(frame,[
          {transform:`translate(${originX}px,${originY}px) scale(${scale})`,clipPath:`inset(${top/scale}px ${right/scale}px ${bottom/scale}px ${left/scale}px round ${radius/scale}px)`},
          {transform:`translate(${target.left}px,${target.top}px) scale(1)`,clipPath:'inset(0px 0px 0px 0px round 0px)'},
        ],{duration:motion.timings.photo});
        if(!current.animation){stopFlight();return;}
        image.style.opacity='0';
        const finish=()=>{if(flight===current)stopFlight();};
        current.animation.finished.then(finish,finish);
      }catch{stopFlight();}
    };
    const step=delta=>{if(viewerMotion.exiting)return;index=(index+delta+collection.length)%collection.length;update(true);};
    document.addEventListener('click',event=>{
      const link=event.target.closest('a[data-gallery]');
      if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      event.preventDefault();
      trigger=link;
      collection=[...document.querySelectorAll('a[data-gallery]')].filter(a=>a.dataset.gallery===link.dataset.gallery);
      index=collection.indexOf(link);update();
      dialog.showModal();document.body.classList.add('is-locked');close.focus();openFromThumbnail(link);
    });
    close.addEventListener('click',viewerMotion.dismiss);
    previous.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
    dialog.addEventListener('click',event=>{
      if(event.target.closest('[data-lightbox-close],[data-lightbox-prev],[data-lightbox-next]'))return;
      // A completed swipe can emit a delayed click on the same image.
      if(performance.now()<swipeClickUntil){event.preventDefault();swipeClickUntil=0;return;}
      viewerMotion.dismiss();
    });
    dialog.addEventListener('keydown',event=>{
      if(event.key==='ArrowRight'&&collection.length>1){event.preventDefault();step(1);}
      if(event.key==='ArrowLeft'&&collection.length>1){event.preventDefault();step(-1);}
    });
    dialog.addEventListener('close',()=>{stopFlight();motion.cancel(image);imageVersion++;swipeClickUntil=0;document.body.classList.remove('is-locked');image.removeAttribute('src');trigger?.focus({preventScroll:true});});
    let startX=0,startY=0;
    image.addEventListener('touchstart',event=>{swipeClickUntil=0;if(event.touches.length===1){startX=event.touches[0].clientX;startY=event.touches[0].clientY;}},{passive:true});
    image.addEventListener('touchend',event=>{
      if(collection.length<2||event.changedTouches.length!==1)return;
      const dx=event.changedTouches[0].clientX-startX,dy=event.changedTouches[0].clientY-startY;
      if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){swipeClickUntil=performance.now()+700;step(dx<0?1:-1);}
    },{passive:true});
  }
}
