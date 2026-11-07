function initNavigation(){
  // Native details continue to work when JavaScript is unavailable.
  const eventsDropdowns=[];
  function closeEventsDropdowns(restore=false,except=null){
    const focused=document.activeElement;
    let focusTarget=null,closed=false;
    for(const dropdown of eventsDropdowns){
      if(dropdown===except||!dropdown.open)continue;
      if(!focusTarget||dropdown.root.contains(focused))focusTarget=dropdown.button;
      dropdown.close();closed=true;
    }
    if(restore)focusTarget?.focus();
    return closed;
  }
  const mobileMenu=document.querySelector('.mobile-nav');
  const mobileSummary=mobileMenu?.querySelector('summary');
  const languageMenu=document.querySelector('.language-picker');
  const closeMenu=(restore=false)=>{
    closeEventsDropdowns();
    if(!mobileMenu?.open)return;
    mobileMenu.open=false;
    if(restore)mobileSummary?.focus();
  };
  mobileMenu?.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
  mobileMenu?.addEventListener('toggle',()=>{if(mobileMenu.open&&languageMenu)languageMenu.open=false;if(!mobileMenu.open)closeEventsDropdowns();});
  languageMenu?.addEventListener('toggle',()=>{if(languageMenu.open)closeMenu();});
  document.addEventListener('click',event=>{for(const dropdown of eventsDropdowns)if(!dropdown.root.contains(event.target))dropdown.close();if(mobileMenu?.open&&!mobileMenu.contains(event.target))closeMenu();if(languageMenu?.open&&!languageMenu.contains(event.target))languageMenu.open=false;});
  document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(closeEventsDropdowns(true)){event.preventDefault();return;}if(mobileMenu?.open){event.preventDefault();closeMenu(true);}else if(languageMenu?.open){event.preventDefault();languageMenu.open=false;languageMenu.querySelector('summary')?.focus();}});
  window.matchMedia('(min-width:1201px)').addEventListener('change',event=>{closeEventsDropdowns();if(event.matches)closeMenu();});

  const hoverNavigation=window.matchMedia('(hover:hover) and (pointer:fine)');
  document.querySelectorAll('[data-events-dropdown]').forEach(root=>{
    const button=root.querySelector('[data-events-toggle]'),panel=root.querySelector('[data-events-submenu]');
    if(!button||!panel)return;
    let leaveTimer=null;
    const clearLeave=()=>{if(leaveTimer!==null){clearTimeout(leaveTimer);leaveTimer=null;}};
    const keyboardFocusInside=()=>root.contains(document.activeElement)&&document.activeElement.matches(':focus-visible');
    const dropdown={
      root,button,panel,
      get open(){return !panel.hidden;},
      close(){clearLeave();panel.hidden=true;button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',button.dataset.openLabel);},
      show(focusFirst=false){closeEventsDropdowns(false,dropdown);clearLeave();panel.hidden=false;button.setAttribute('aria-expanded','true');button.setAttribute('aria-label',button.dataset.closeLabel);if(focusFirst)panel.querySelector('a')?.focus();},
    };
    eventsDropdowns.push(dropdown);button.hidden=false;
    button.addEventListener('click',()=>{if(dropdown.open)dropdown.close();else dropdown.show();});
    root.addEventListener('click',event=>{if(event.target.closest('a'))dropdown.close();});
    root.addEventListener('pointerenter',event=>{if(root.dataset.eventsSurface==='desktop'&&hoverNavigation.matches&&event.pointerType!=='touch')dropdown.show();});
    root.addEventListener('pointerleave',()=>{
      if(root.dataset.eventsSurface!=='desktop'||!dropdown.open||keyboardFocusInside())return;
      clearLeave();leaveTimer=setTimeout(()=>{leaveTimer=null;if(!keyboardFocusInside())dropdown.close();},180);
    });
    root.addEventListener('focusout',event=>{if(!root.contains(event.relatedTarget))dropdown.close();});
    root.addEventListener('keydown',event=>{if(event.key==='ArrowDown'&&event.target.closest('[data-nav-primary],[data-events-toggle]')){event.preventDefault();dropdown.show(true);}});
  });
}
