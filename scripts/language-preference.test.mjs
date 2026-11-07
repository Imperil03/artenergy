import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../src/client/language-preference.js',import.meta.url),'utf8');
const preferenceKey='artenergy.language.v1',dismissalKey='artenergy.language-suggestion-dismissed.v1';
let passed=0;
function page({locale='ru',languages=['en-US'],language='en-US',saved,closed=false,mobile=false,denied,
  local=new Map(),session=new Map(),fragment='',prefix='/artenergy',hasSuggestion=true}={}){
  if(saved!==undefined)local.set(preferenceKey,saved);
  if(closed)session.set(dismissalKey,'1');
  const writes=[],focuses=[];
  const events=()=>({listeners:new Map(),addEventListener(type,handler){
    const list=this.listeners.get(type)||[];list.push(handler);this.listeners.set(type,list);
  },emit(type,extra={}){
    const event={key:'',defaultPrevented:false,propagationStopped:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.propagationStopped=true;},...extra};
    for(const listener of this.listeners.get(type)||[])listener(event);
    return event;
  }});
  const document={documentElement:{lang:locale},activeElement:null};
  const node=()=>({...events(),hidden:true,textContent:'',attributes:new Map(),
    setAttribute(name,value){this.attributes.set(name,value);},
    focus(){focuses.push(this);document.activeElement=this;}});
  const links=['es','en','ru'].map(lang=>Object.assign(node(),{hreflang:lang,lang,href:`https://example.test${prefix}/${lang}/menu/${fragment}`}));
  const accept=Object.assign(node(),{href:links.find(link=>link.lang===locale).href}),message=node(),close=node();
  const suggestion=Object.assign(node(),{contains:target=>[accept,message,close].includes(target),
    querySelector:selector=>({'[data-language-accept]':accept,'[data-language-message]':message,'[data-language-dismiss]':close}[selector])});
  const picker=node(),wordmark=node();
  document.querySelector=selector=>({
    '[data-language-suggestion]':hasSuggestion?suggestion:null,
    '.language-picker>summary':picker,
    '.header-inner>.languages a[aria-current="page"]':links.find(link=>link.lang===locale),
    '.wordmark':wordmark,
  }[selector]||null);
  document.querySelectorAll=selector=>selector==='.languages a'?links:[];
  const window={...events(),matchMedia:()=>({matches:mobile})};
  for(const [area,data] of [['localStorage',local],['sessionStorage',session]]){
    if(denied==='getter')Object.defineProperty(window,area,{get(){throw new Error('Storage denied');}});
    else window[area]={
      getItem(key){if(denied==='get')throw new Error('Read denied');return data.get(key)??null;},
      setItem(key,value){if(denied==='set')throw new Error('Write denied');writes.push([area,key,value]);data.set(key,value);},
      removeItem(key){if(denied==='remove')throw new Error('Removal denied');writes.push([area,key,null]);data.delete(key);},
    };
  }
  const navigator={languages,language};
  const context={document,window,navigator};
  Object.defineProperty(context,'location',{get(){throw new Error('Unexpected navigation access');}});
  vm.runInNewContext(source,context,{filename:'language-preference.js'});
  return {links,accept,message,close,suggestion,picker,wordmark,document,window,navigator,local,session,writes,focuses};
}
function check(name,run){run();passed++;console.log('PASS',name);}

check('Browser regional tag selects the matching translated page without startup writes or focus',()=>{
  const p=page({languages:['es-DO','en-US']});
  assert.equal(p.suggestion.hidden,false);assert.equal(p.suggestion.lang,'es');
  assert.equal(p.accept.href,'https://example.test/artenergy/es/menu/');
  assert.equal(p.message.textContent,'¿Prefieres español?');assert.deepEqual(p.writes,[]);assert.deepEqual(p.focuses,[]);
});
check('Stored manual selection takes precedence over browser languages',()=>{
  const p=page({saved:'en',languages:['es-DO']});assert.equal(p.accept.hreflang,'en');assert.equal(p.accept.lang,'en');
});
check('Matching current language needs no suggestion',()=>{
  assert.equal(page({saved:'ru',languages:['en-US']}).suggestion.hidden,true);
  assert.equal(page({locale:'en',languages:['en-GB','es']}).suggestion.hidden,true);
});
check('Language list uses the first supported entry, ignoring unsupported preferences',()=>{
  const p=page({languages:['de-DE','EN-gb','es-DO']});assert.equal(p.accept.hreflang,'en');
});
check('Unsupported browser list falls back to Spanish',()=>{
  assert.equal(page({languages:['de-DE','fr-FR']}).accept.hreflang,'es');
});
check('Single navigator.language works when language list is absent or empty',()=>{
  assert.equal(page({languages:null,language:'es-MX'}).accept.hreflang,'es');
  assert.equal(page({languages:[],language:'en-GB'}).accept.hreflang,'en');
});
check('Invalid stored data is ignored without cleaning or writing storage on startup',()=>{
  const p=page({saved:'{"lang":"en"}',languages:['es']});assert.equal(p.accept.hreflang,'es');assert.deepEqual(p.writes,[]);
});
check('Non-string language entries and unsupported codes are harmless',()=>{
  assert.equal(page({languages:[null,42,'ru_bad','ES-do']}).accept.hreflang,'es');
});
check('Explicit header language choice persists and keeps native navigation',()=>{
  const p=page();const event=p.links[0].emit('click',{ctrlKey:true});
  assert.equal(event.defaultPrevented,false);assert.equal(p.local.get(preferenceKey),'es');assert.equal(p.suggestion.hidden,true);
  assert.ok(p.writes.every(([,key])=>[preferenceKey,dismissalKey].includes(key)));
});
check('Suggestion acceptance persists the destination and preserves its fragment',()=>{
  const p=page({fragment:'#menu-bar'});const href=p.accept.href;
  const event=p.accept.emit('click');assert.equal(event.defaultPrevented,false);
  assert.equal(p.local.get(preferenceKey),'en');assert.equal(p.accept.href,href);assert.ok(href.endsWith('#menu-bar'));
});
check('Dismissal does not override saved language and lasts across pages in the same session',()=>{
  const p=page({saved:'es'});p.close.emit('click');
  assert.equal(p.local.get(preferenceKey),'es');assert.equal(p.session.get(dismissalKey),'1');
  const next=page({local:p.local,session:p.session});assert.equal(next.suggestion.hidden,true);
});
check('Manual selection clears a previous dismissal',()=>{
  const p=page({closed:true});p.links[1].emit('click');
  assert.equal(p.session.has(dismissalKey),false);assert.equal(p.local.get(preferenceKey),'en');
});
check('Desktop dismiss restores focus to current visible language control',()=>{
  const p=page();p.document.activeElement=p.close;p.close.emit('click');
  assert.equal(p.document.activeElement,p.links.find(link=>link.lang==='ru'));
});
check('Mobile dismiss restores focus to the visible language picker',()=>{
  const p=page({mobile:true});p.document.activeElement=p.close;p.close.emit('click');assert.equal(p.document.activeElement,p.picker);
});
check('Closing an unfocused notice does not move focus',()=>{
  const p=page();p.document.activeElement=p.wordmark;p.close.emit('click');assert.deepEqual(p.focuses,[]);
});
check('Escape within the notice closes it and leaves consumed Escape untouched',()=>{
  const p=page();p.document.activeElement=p.accept;
  p.suggestion.emit('keydown',{key:'Escape',defaultPrevented:true});assert.equal(p.suggestion.hidden,false);
  const event=p.suggestion.emit('keydown',{key:'Escape'});assert.equal(event.defaultPrevented,true);assert.equal(event.propagationStopped,true);assert.equal(p.suggestion.hidden,true);
});
for(const denied of ['getter','get','set','remove'])check(`Storage ${denied} failure does not break explicit selection or dismissal`,()=>{
  const p=page({denied});p.close.emit('click');assert.equal(p.suggestion.hidden,true);
  p.window.emit('languagechange');assert.equal(p.suggestion.hidden,true);
  p.links[0].emit('click');p.window.emit('languagechange');assert.equal(p.accept.hreflang,'es');
});
check('Storage getter denial keeps manual selection in document memory through pageshow',()=>{
  const p=page({denied:'getter'});p.links[0].emit('click');p.window.emit('pageshow');assert.equal(p.accept.hreflang,'es');
});
check('Saved choice is reflected on later pages',()=>{
  const p=page();p.links[0].emit('click');
  assert.equal(page({locale:'es',local:p.local,session:p.session,languages:['en']}).suggestion.hidden,true);
});
check('Cross-tab preference changes update the suggestion without navigation or writes',()=>{
  const p=page();p.window.emit('storage',{key:preferenceKey,newValue:'es'});assert.equal(p.accept.hreflang,'es');assert.deepEqual(p.writes,[]);
});
check('A page restored from history reloads preferences without changing URL',()=>{
  const p=page();p.local.set(preferenceKey,'es');p.window.emit('pageshow');assert.equal(p.accept.hreflang,'es');
});
check('Browser preference changes remain subordinate to an explicit selection',()=>{
  const p=page({saved:'es'});p.navigator.languages=['en'];p.window.emit('languagechange');assert.equal(p.accept.hreflang,'es');
});
check('The same behavior works without a deployment prefix',()=>{
  assert.equal(page({prefix:''}).accept.href,'https://example.test/en/menu/');
});
check('Pages without a suggestion still remember explicit header selection',()=>{
  const p=page({hasSuggestion:false});p.links[0].emit('click');assert.equal(p.local.get(preferenceKey),'es');
});
console.log(`PASS: ${passed} language preference scenarios; actual feature source executed in a VM with browser API stubs.`);
