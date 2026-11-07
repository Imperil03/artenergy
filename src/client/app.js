document.documentElement.classList.add('js');

// One photographic transition, with short supporting feedback and no scroll reveals.
const motionPreference=window.matchMedia('(prefers-reduced-motion:reduce)');
const forcedStill=new URLSearchParams(location.search).get('motion')==='off';
const motionAnimations=new Set();
const elementMotion=new WeakMap();
const motion={
  reduced:false,timings:{},
  run(element,frames,{duration=motion.timings.state,delay=0}={}){
    elementMotion.get(element)?.cancel();
    if(!element||typeof element.animate!=='function'||!duration||document.hidden)return null;
    const animation=element.animate(frames,{duration,delay,easing:'cubic-bezier(0.16, 1, 0.3, 1)'});
    motionAnimations.add(animation);elementMotion.set(element,animation);
    const release=()=>{motionAnimations.delete(animation);if(elementMotion.get(element)===animation)elementMotion.delete(element);};
    animation.finished.then(release,release);
    return animation;
  },
  cancel(element){elementMotion.get(element)?.cancel();},
  cancelAll(){for(const animation of motionAnimations)animation.cancel();},
};
const syncMotion=()=>{
  motion.reduced=motionPreference.matches||forcedStill||Boolean(navigator.connection?.saveData);
  document.documentElement.dataset.motion=motion.reduced?'reduce':'full';
  const style=getComputedStyle(document.documentElement);
  motion.timings=Object.fromEntries(['fast','state','photo','out'].map(key=>[key,parseFloat(style.getPropertyValue(`--motion-${key}`))||0]));
  motion.cancelAll();
};
motionPreference.addEventListener('change',syncMotion);
document.addEventListener('visibilitychange',()=>{if(document.hidden)motion.cancelAll();});
window.addEventListener('resize',()=>motion.cancelAll(),{passive:true});
syncMotion();

function dialogMotion(surface,onDismiss=()=>{}){
  let exiting=false,animation=null;
  const dismiss=()=>{
    if(!surface.open||exiting)return;
    const opacity=getComputedStyle(surface).opacity;
    const backdropOpacity=getComputedStyle(surface,'::backdrop').opacity;
    exiting=true;onDismiss();surface.style.setProperty('--backdrop-exit-opacity',backdropOpacity);surface.classList.add('is-closing');
    animation=motion.run(surface,[{opacity},{opacity:0}],{duration:motion.timings.out});
    const finish=()=>{if(surface.open)surface.close();};
    if(animation)animation.finished.then(finish,finish);else finish();
  };
  surface.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
  surface.addEventListener('close',()=>{exiting=false;surface.classList.remove('is-closing');surface.style.removeProperty('--backdrop-exit-opacity');animation?.cancel();animation=null;});
  return {dismiss,get exiting(){return exiting;}};
}

// Native details continue to work when JavaScript is unavailable.
const mobileMenu=document.querySelector('.mobile-nav');
const mobileSummary=mobileMenu?.querySelector('summary');
const languageMenu=document.querySelector('.language-picker');
const closeMenu=(restore=false)=>{
  if(!mobileMenu?.open)return;
  mobileMenu.open=false;
  if(restore)mobileSummary?.focus();
};
mobileMenu?.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
mobileMenu?.addEventListener('toggle',()=>{if(mobileMenu.open&&languageMenu)languageMenu.open=false;});
languageMenu?.addEventListener('toggle',()=>{if(languageMenu.open)closeMenu();});
document.addEventListener('click',event=>{if(mobileMenu?.open&&!mobileMenu.contains(event.target))closeMenu();if(languageMenu?.open&&!languageMenu.contains(event.target))languageMenu.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mobileMenu?.open){event.preventDefault();closeMenu(true);}else if(event.key==='Escape'&&languageMenu?.open){event.preventDefault();languageMenu.open=false;languageMenu.querySelector('summary')?.focus();}});
window.matchMedia('(min-width:1201px)').addEventListener('change',event=>{if(event.matches)closeMenu();});

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

const video=document.querySelector('[data-hero-video]');
const videoToggle=document.querySelector('[data-video-toggle]');
if(video&&videoToggle){
  const reduceMotion=window.matchMedia('(prefers-reduced-motion:reduce)');
  const narrow=window.matchMedia('(max-width:760px)');
  const saveData=Boolean(navigator.connection?.saveData);
  // A URL preference makes the same static-poster state available for visual review.
  const posterMode=new URLSearchParams(location.search).get('motion')==='off';
  let manualPause=reduceMotion.matches||saveData||posterMode;
  let inView=true;
  let failed=false;
  const renderState=()=>{
    const paused=video.paused;
    videoToggle.setAttribute('aria-label',paused?videoToggle.dataset.playLabel:videoToggle.dataset.pauseLabel);
    videoToggle.setAttribute('aria-pressed',String(paused));
    videoToggle.querySelector('[data-pause-icon]').hidden=paused;
    videoToggle.querySelector('[data-play-icon]').hidden=!paused;
  };
  const load=()=>{
    const wanted=narrow.matches?video.dataset.mobileSrc:video.dataset.desktopSrc;
    if(video.getAttribute('src')!==wanted){video.src=wanted;video.load();}
    video.muted=true;
  };
  const play=async()=>{
    if(failed||!inView||document.hidden)return;
    load();
    try{await video.play();}catch{renderState();}
  };
  videoToggle.hidden=false;
  video.addEventListener('playing',()=>{video.classList.add('is-playing');renderState();});
  video.addEventListener('pause',renderState);
  video.addEventListener('error',()=>{failed=true;video.classList.remove('is-playing');videoToggle.hidden=true;});
  videoToggle.addEventListener('click',()=>{
    if(video.paused){manualPause=false;play();}else{manualPause=true;video.pause();}
  });
  new IntersectionObserver(entries=>{
    inView=entries[0].isIntersecting;
    if(!inView)video.pause();else if(!manualPause)play();
  },{threshold:0}).observe(document.querySelector('.hero'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(!manualPause)play();});
  reduceMotion.addEventListener('change',event=>{if(event.matches){manualPause=true;video.pause();video.classList.remove('is-playing');}});
  narrow.addEventListener('change',()=>{if(video.hasAttribute('src')){load();if(!manualPause)play();}});
  renderState();
  if(!manualPause)play();
}

const sticky=document.querySelector('[data-mobile-contact]');
const hero=document.querySelector('.hero');
const footer=document.querySelector('.contact-section');
if(sticky&&hero&&footer){
  let heroVisible=true,footerVisible=false;
  const renderSticky=()=>{
    const show=!heroVisible&&!footerVisible&&window.matchMedia('(max-width:760px)').matches;
    sticky.hidden=!show;
    document.body.classList.toggle('has-mobile-contact',show);
  };
  new IntersectionObserver(([entry])=>{heroVisible=entry.isIntersecting;renderSticky();}).observe(hero);
  new IntersectionObserver(([entry])=>{footerVisible=entry.isIntersecting;renderSticky();},{threshold:0.05}).observe(footer);
  window.addEventListener('resize',renderSticky,{passive:true});
}

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

const tabs=document.querySelector('[data-menu-tabs]');
if(tabs){
  const links=[...tabs.querySelectorAll('[data-menu-tab]')];
  const panels=[...document.querySelectorAll('[data-menu-panel]')];
  let selectedMenu=null;
  tabs.setAttribute('role','tablist');
  links.forEach(link=>{const key=link.dataset.menuTab;link.id=`tab-${key}`;link.setAttribute('role','tab');link.setAttribute('aria-controls',`menu-${key}`);});
  panels.forEach(panel=>{panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',`tab-${panel.dataset.menuPanel}`);panel.tabIndex=0;});
  const select=(key,updateUrl=false)=>{
    if(!links.some(link=>link.dataset.menuTab===key))key=links[0].dataset.menuTab;
    links.forEach(link=>{const active=link.dataset.menuTab===key;link.classList.toggle('is-active',active);link.setAttribute('aria-selected',String(active));link.tabIndex=active?0:-1;});
    panels.forEach(panel=>{const active=panel.dataset.menuPanel===key;panel.hidden=!active;panel.classList.toggle('is-active',active);if(active&&selectedMenu!==null&&selectedMenu!==key)motion.run(panel,[{opacity:.7},{opacity:1}]);});
    selectedMenu=key;
    document.querySelectorAll('.languages a').forEach(link=>{const url=new URL(link.href);url.hash=`menu-${key}`;link.href=url.pathname+url.hash;});
    if(updateUrl)history.replaceState(null,'',`#menu-${key}`);
  };
  const hashKey=()=>location.hash.startsWith('#menu-')?location.hash.slice(6):links[0].dataset.menuTab;
  links.forEach((link,i)=>{
    link.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey)return;event.preventDefault();select(link.dataset.menuTab,true);});
    link.addEventListener('keydown',event=>{
      let target;
      if(event.key==='ArrowRight')target=(i+1)%links.length;
      if(event.key==='ArrowLeft')target=(i-1+links.length)%links.length;
      if(event.key==='Home')target=0;
      if(event.key==='End')target=links.length-1;
      if(target!==undefined){event.preventDefault();links[target].focus();select(links[target].dataset.menuTab,true);}
    });
  });
  window.addEventListener('hashchange',()=>select(hashKey()));
  select(hashKey());
}

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

// Keep the selected option when switching languages on a shared service page.
const serviceAnchors={spa:['#banya','#hammam'],stay:['#bungalow','#apartments']}[document.body.dataset.page];
if(serviceAnchors){
  const syncServiceLanguage=()=>document.querySelectorAll('.languages a').forEach(link=>{
    const url=new URL(link.href);url.hash=serviceAnchors.includes(location.hash)?location.hash:'';link.href=url.pathname+url.hash;
  });
  window.addEventListener('hashchange',syncServiceLanguage);syncServiceLanguage();
}
