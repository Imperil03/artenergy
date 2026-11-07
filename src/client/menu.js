function initMenu(motion){
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
      syncLanguageLinks(`menu-${key}`);
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
}
