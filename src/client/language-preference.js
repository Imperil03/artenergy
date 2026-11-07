// Language suggestions never navigate automatically or change the language of a URL.
;(()=>{
  const preferenceKey='artenergy.language.v1';
  const dismissalKey='artenergy.language-suggestion-dismissed.v1';
  const supported=['es','en','ru'];
  const current=document.documentElement.lang;
  const suggestion=document.querySelector('[data-language-suggestion]');
  const languageLinks=Array.from(document.querySelectorAll('.languages a'));
  const valid=value=>supported.includes(value)?value:null;
  const read=(area,key)=>{try{return window[area].getItem(key);}catch{return undefined;}};
  const write=(area,key,value)=>{try{window[area].setItem(key,value);}catch{}};
  const remove=(area,key)=>{try{window[area].removeItem(key);}catch{}};
  let savedSnapshot=read('localStorage',preferenceKey);
  let dismissalSnapshot=read('sessionStorage',dismissalKey);
  let selected=valid(savedSnapshot);
  let dismissed=dismissalSnapshot==='1';

  const hide=(restoreFocus=false)=>{
    if(!suggestion)return;
    const needsFocus=restoreFocus&&suggestion.contains(document.activeElement);
    suggestion.hidden=true;
    if(needsFocus){
      const selector=window.matchMedia('(max-width:760px)').matches
        ?'.language-picker>summary':'.header-inner>.languages a[aria-current="page"]';
      const target=document.querySelector(selector)||document.querySelector('.wordmark');
      target?.focus({preventScroll:true});
    }
  };
  const remember=language=>{
    if(!valid(language))return;
    selected=language;
    write('localStorage',preferenceKey,language);
    dismissed=false;
    remove('sessionStorage',dismissalKey);
    hide(true);
  };
  languageLinks.forEach(link=>link.addEventListener('click',()=>remember(link.hreflang)));
  if(!suggestion)return;

  const accept=suggestion.querySelector('[data-language-accept]');
  const message=suggestion.querySelector('[data-language-message]');
  const close=suggestion.querySelector('[data-language-dismiss]');
  if(!accept||!message||!close)return;
  const labels={
    es:{message:'¿Prefieres español?',action:'Ver en español',close:'Cerrar sugerencia de idioma'},
    en:{message:'Prefer English?',action:'View in English',close:'Dismiss language suggestion'},
    ru:{message:'Удобнее на русском?',action:'Перейти на русский',close:'Закрыть предложение языка'},
  };
  const preferred=()=>{
    if(selected)return selected;
    let languages=[];
    try{languages=Array.from(navigator.languages||[]);}catch{}
    if(!languages.length){try{languages=[navigator.language];}catch{}}
    for(const tag of languages){
      if(typeof tag!=='string')continue;
      const language=valid(tag.trim().toLowerCase().split('-')[0]);
      if(language)return language;
    }
    return 'es';
  };
  const update=()=>{
    const language=preferred();
    const target=languageLinks.find(link=>link.hreflang===language);
    if(dismissed||language===current||!target){hide(true);return;}
    const copy=labels[language];
    suggestion.lang=language;
    message.textContent=copy.message;
    accept.textContent=copy.action;
    accept.href=target.href;
    accept.hreflang=language;
    accept.lang=language;
    close.setAttribute('aria-label',copy.close);
    suggestion.hidden=false;
  };
  const dismiss=()=>{
    dismissed=true;
    write('sessionStorage',dismissalKey,'1');
    hide(true);
  };
  accept.addEventListener('click',()=>remember(accept.hreflang));
  close.addEventListener('click',dismiss);
  suggestion.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!event.defaultPrevented){event.preventDefault();event.stopPropagation();dismiss();}
  });
  window.addEventListener('languagechange',update);
  window.addEventListener('storage',event=>{
    if(event.key!==preferenceKey&&event.key!==null)return;
    if(event.storageArea){try{if(event.storageArea!==window.localStorage)return;}catch{return;}}
    selected=valid(event.newValue);
    savedSnapshot=event.newValue;
    update();
  });
  window.addEventListener('pageshow',()=>{
    const saved=read('localStorage',preferenceKey);
    if(saved!==undefined&&saved!==savedSnapshot){selected=valid(saved);savedSnapshot=saved;}
    const closed=read('sessionStorage',dismissalKey);
    if(closed!==undefined&&closed!==dismissalSnapshot){dismissed=closed==='1';dismissalSnapshot=closed;}
    update();
  });
  update();
})();
