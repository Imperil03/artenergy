document.documentElement.classList.add('js');

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
window.matchMedia('(min-width:1051px)').addEventListener('change',event=>{if(event.matches)closeMenu();});

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
      const firstPhoto=galleryMore.querySelector('a[data-gallery]');
      firstPhoto?.focus({preventScroll:true});
      firstPhoto?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
    }else galleryToggles[0].focus({preventScroll:!galleryMore.contains(button)});
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
  overviewLink.setAttribute('aria-haspopup','dialog');
  overviewLink.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    error.hidden=true;
    overview.showModal();
    document.body.classList.add('is-locked');
    player.src=overviewLink.href;
    player.play().catch(()=>{/* Native controls remain available if playback needs another gesture. */});
    close.focus();
  });
  close.addEventListener('click',()=>overview.close());
  overview.addEventListener('click',event=>{if(event.target===overview)overview.close();});
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
  let collection=[],index=0,trigger=null;
  const update=()=>{
    const item=collection[index];
    image.src=item.href;
    image.alt=item.querySelector('img')?.alt||item.dataset.caption||'';
    caption.textContent=item.dataset.caption||image.alt;
    count.textContent=collection.length>1?`${index+1} / ${collection.length}`:'';
    previous.hidden=next.hidden=collection.length<2;
  };
  const step=delta=>{index=(index+delta+collection.length)%collection.length;update();};
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[data-gallery]');
    if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    trigger=link;
    collection=[...document.querySelectorAll('a[data-gallery]')].filter(a=>a.dataset.gallery===link.dataset.gallery);
    index=collection.indexOf(link);update();
    dialog.showModal();document.body.classList.add('is-locked');close.focus();
  });
  close.addEventListener('click',()=>dialog.close());
  previous.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
  dialog.addEventListener('click',event=>{if(event.target===dialog||event.target.classList.contains('lightbox-shell'))dialog.close();});
  dialog.addEventListener('keydown',event=>{
    if(event.key==='ArrowRight'&&collection.length>1){event.preventDefault();step(1);}
    if(event.key==='ArrowLeft'&&collection.length>1){event.preventDefault();step(-1);}
  });
  dialog.addEventListener('close',()=>{document.body.classList.remove('is-locked');image.removeAttribute('src');trigger?.focus({preventScroll:true});});
  let startX=0,startY=0;
  image.addEventListener('touchstart',event=>{if(event.touches.length===1){startX=event.touches[0].clientX;startY=event.touches[0].clientY;}},{passive:true});
  image.addEventListener('touchend',event=>{
    if(collection.length<2||event.changedTouches.length!==1)return;
    const dx=event.changedTouches[0].clientX-startX,dy=event.changedTouches[0].clientY-startY;
    if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)step(dx<0?1:-1);
  },{passive:true});
}

const tabs=document.querySelector('[data-menu-tabs]');
if(tabs){
  const links=[...tabs.querySelectorAll('[data-menu-tab]')];
  const panels=[...document.querySelectorAll('[data-menu-panel]')];
  tabs.setAttribute('role','tablist');
  links.forEach(link=>{const key=link.dataset.menuTab;link.id=`tab-${key}`;link.setAttribute('role','tab');link.setAttribute('aria-controls',`menu-${key}`);});
  panels.forEach(panel=>{panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',`tab-${panel.dataset.menuPanel}`);panel.tabIndex=0;});
  const select=(key,updateUrl=false)=>{
    if(!links.some(link=>link.dataset.menuTab===key))key=links[0].dataset.menuTab;
    links.forEach(link=>{const active=link.dataset.menuTab===key;link.classList.toggle('is-active',active);link.setAttribute('aria-selected',String(active));link.tabIndex=active?0:-1;});
    panels.forEach(panel=>{const active=panel.dataset.menuPanel===key;panel.hidden=!active;panel.classList.toggle('is-active',active);});
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
