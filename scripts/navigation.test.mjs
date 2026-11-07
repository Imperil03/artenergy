// Actual navigation feature in a small bubbling DOM fixture; not a browser emulator.
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=await readFile(new URL('../src/client/navigation.js',import.meta.url),'utf8');
const actualBlock=source+'\ninitNavigation();';

function fixture(){
  let document;
  function matches(node,selector){
    return selector.split(',').some(part=>{
      const value=part.trim();
      if(value===':focus-visible')return node.focusVisible;
      if(/^[a-z]+$/i.test(value))return node.tagName===value.toUpperCase();
      if(value.startsWith('.'))return node.classes.has(value.slice(1));
      const attr=/^\[([^\]]+)\]$/.exec(value);
      return Boolean(attr&&Object.hasOwn(node.attrs,attr[1]));
    });
  }
  class Element{
    constructor(tag,classes=''){
      this.tagName=tag.toUpperCase();this.classes=new Set(classes.split(' ').filter(Boolean));
      this.children=[];this.parentElement=null;this.attrs={};this.dataset={};this.listeners=new Map();
      this.hidden=false;this._open=false;this.focusVisible=false;
    }
    append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}return this;}
    addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);}
    setAttribute(name,value){this.attrs[name]=String(value);}
    getAttribute(name){return Object.hasOwn(this.attrs,name)?this.attrs[name]:null;}
    contains(node){for(let item=node;item;item=item.parentElement)if(item===this)return true;return false;}
    closest(selector){for(let item=this;item;item=item.parentElement)if(matches(item,selector))return item;return null;}
    matches(selector){return matches(this,selector);}
    querySelectorAll(selector){const result=[];for(const child of this.children){if(matches(child,selector))result.push(child);result.push(...child.querySelectorAll(selector));}return result;}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
    focus(options={}){
      const previous=document.activeElement;this.focusVisible=options.keyboard!==false;document.activeElement=this;
      if(previous&&previous!==this)emit(previous,'focusout',{relatedTarget:this});
    }
    get open(){return this._open;}
    set open(value){const next=Boolean(value);if(next===this._open)return;this._open=next;emit(this,'toggle',{bubbles:false});}
  }
  function emit(target,type,properties={}){
    const event={type,target,currentTarget:null,defaultPrevented:false,bubbles:!['pointerenter','pointerleave','toggle'].includes(type),preventDefault(){this.defaultPrevented=true;},...properties};
    for(let node=target;node;node=event.bubbles?node.parentElement:null){event.currentTarget=node;for(const callback of node.listeners.get(type)||[])callback(event);}
    return event;
  }
  const element=(tag,classes='')=>new Element(tag,classes);
  document=element('document');const body=element('body');document.append(body);document.activeElement=body;
  const mobile=element('details','mobile-nav'),mobileSummary=element('summary');mobile.append(mobileSummary);
  const language=element('details','language-picker'),languageSummary=element('summary');language.append(languageSummary);
  const outside=element('a');body.append(language,mobile,outside);
  function dropdown(surface,parent){
    const root=element('div','events-dropdown');root.attrs['data-events-dropdown']='';root.dataset.eventsSurface=surface;
    const row=element('div'),primary=element('a'),button=element('button'),svg=element('svg'),svgPath=element('path'),panel=element('div');
    primary.attrs['data-nav-primary']='';button.attrs['data-events-toggle']='';panel.attrs['data-events-submenu']='';
    button.dataset={openLabel:'Open '+surface,closeLabel:'Close '+surface};button.attrs['aria-expanded']='false';button.attrs['aria-label']=button.dataset.openLabel;
    button.hidden=true;panel.hidden=true;button.append(svg.append(svgPath));row.append(primary,button);root.append(row,panel);parent.append(root);
    const links=Array.from({length:6},()=>element('a'));panel.append(...links);
    return {root,row,primary,button,svgPath,panel,links};
  }
  const desktop=dropdown('desktop',body),small=dropdown('mobile',mobile);
  const media=new Map();
  function matchMedia(query){
    if(!media.has(query)){
      const item={matches:true,listeners:[],addEventListener(type,fn){if(type==='change')this.listeners.push(fn);},set(value){this.matches=value;for(const listener of this.listeners)listener({matches:value});}};
      media.set(query,item);
    }
    return media.get(query);
  }
  let clock=0,nextTimer=0;const timers=new Map();
  function advance(ms){clock+=ms;let due;while((due=[...timers].find(([,timer])=>timer.at<=clock))){timers.delete(due[0]);due[1].fn();}}
  const context={document,window:{matchMedia},setTimeout(fn,delay){const id=++nextTimer;timers.set(id,{at:clock+delay,fn});return id;},clearTimeout(id){timers.delete(id);}};
  vm.runInNewContext(actualBlock,context,{filename:'actual-navigation-block.js'});
  const click=target=>{const button=target.closest('[data-events-toggle]');button?.focus({keyboard:false});return emit(target,'click');};
  return {document,body,mobile,mobileSummary,language,languageSummary,outside,desktop,small,emit,click,advance,media,context};
}

const results=[];
function check(name,run){const f=fixture();run(f);results.push({name,status:'passed'});}

check('enhancement exposes both toggles with initially hidden panels',f=>{
  for(const menu of [f.desktop,f.small]){assert.equal(menu.button.hidden,false);assert.equal(menu.panel.hidden,true);assert.equal(menu.button.getAttribute('aria-expanded'),'false');}
});
check('SVG toggle click opens and a second click closes',f=>{
  f.click(f.desktop.svgPath);assert.equal(f.desktop.panel.hidden,false);assert.equal(f.desktop.button.getAttribute('aria-expanded'),'true');assert.equal(f.desktop.button.getAttribute('aria-label'),'Close desktop');
  f.click(f.desktop.svgPath);assert.equal(f.desktop.panel.hidden,true);assert.equal(f.desktop.button.getAttribute('aria-label'),'Open desktop');
});
check('main celebrations link closes the submenu without preventing navigation',f=>{
  f.click(f.desktop.button);const event=f.click(f.desktop.primary);assert.equal(f.desktop.panel.hidden,true);assert.equal(event.defaultPrevented,false);
});
check('outside click closes an open submenu',f=>{f.click(f.desktop.button);f.click(f.outside);assert.equal(f.desktop.panel.hidden,true);});
check('ArrowDown opens from the primary link and focuses the first occasion',f=>{
  f.desktop.primary.focus();const event=f.emit(f.desktop.primary,'keydown',{key:'ArrowDown'});assert.equal(event.defaultPrevented,true);assert.equal(f.desktop.panel.hidden,false);assert.equal(f.document.activeElement,f.desktop.links[0]);
});
check('focus leaving the disclosure closes it without a focus trap',f=>{
  f.click(f.desktop.button);f.desktop.links[2].focus();f.outside.focus();assert.equal(f.desktop.panel.hidden,true);assert.equal(f.document.activeElement,f.outside);
});
check('Escape closes the disclosure and restores its toggle focus',f=>{
  f.click(f.desktop.button);f.desktop.links[0].focus();const event=f.emit(f.desktop.links[0],'keydown',{key:'Escape'});assert.equal(event.defaultPrevented,true);assert.equal(f.desktop.panel.hidden,true);assert.equal(f.document.activeElement,f.desktop.button);
});
check('mobile chevron opens inline and child navigation closes the burger',f=>{
  f.mobile.open=true;f.click(f.small.svgPath);assert.equal(f.small.panel.hidden,false);assert.equal(f.mobile.open,true);const event=f.click(f.small.links[3]);assert.equal(event.defaultPrevented,false);assert.equal(f.small.panel.hidden,true);assert.equal(f.mobile.open,false);
});
check('native burger closure resets the nested disclosure',f=>{
  f.mobile.open=true;f.click(f.small.button);f.mobile.open=false;assert.equal(f.small.panel.hidden,true);f.mobile.open=true;assert.equal(f.small.panel.hidden,true);
});
check('opening the language picker closes burger and nested disclosure',f=>{
  f.mobile.open=true;f.click(f.small.button);f.language.open=true;assert.equal(f.mobile.open,false);assert.equal(f.small.panel.hidden,true);assert.equal(f.language.open,true);
});
check('breakpoint changes reset desktop and mobile disclosure state',f=>{
  f.click(f.desktop.button);const breakpoint=f.media.get('(min-width:1201px)');breakpoint.set(false);assert.equal(f.desktop.panel.hidden,true);
  f.mobile.open=true;f.click(f.small.button);breakpoint.set(true);assert.equal(f.small.panel.hidden,true);assert.equal(f.mobile.open,false);
});
check('hover leave delay allows crossing the gap into the submenu',f=>{
  f.emit(f.desktop.root,'pointerenter',{pointerType:'mouse'});assert.equal(f.desktop.panel.hidden,false);f.emit(f.desktop.root,'pointerleave');f.advance(179);assert.equal(f.desktop.panel.hidden,false);
  f.emit(f.desktop.root,'pointerenter',{pointerType:'mouse'});f.advance(1000);assert.equal(f.desktop.panel.hidden,false);f.emit(f.desktop.root,'pointerleave');f.advance(180);assert.equal(f.desktop.panel.hidden,true);
});
check('keyboard focus inside prevents hover closure',f=>{
  f.emit(f.desktop.root,'pointerenter',{pointerType:'mouse'});f.desktop.links[1].focus();f.emit(f.desktop.root,'pointerleave');f.advance(500);assert.equal(f.desktop.panel.hidden,false);f.outside.focus();assert.equal(f.desktop.panel.hidden,true);
});
check('touch and non-hover input do not accidentally open desktop hover menu',f=>{
  f.emit(f.desktop.root,'pointerenter',{pointerType:'touch'});assert.equal(f.desktop.panel.hidden,true);f.media.get('(hover:hover) and (pointer:fine)').set(false);f.emit(f.desktop.root,'pointerenter',{pointerType:'mouse'});assert.equal(f.desktop.panel.hidden,true);
});
check('touch on a hover-capable hybrid opens once on its click',f=>{
  assert.equal(f.media.get('(hover:hover) and (pointer:fine)').matches,true);f.emit(f.desktop.root,'pointerenter',{pointerType:'touch'});assert.equal(f.desktop.panel.hidden,true);f.click(f.desktop.svgPath);assert.equal(f.desktop.panel.hidden,false);assert.equal(f.desktop.button.getAttribute('aria-expanded'),'true');
});
check('Escape first closes the nested menu, then closes the burger',f=>{
  f.mobile.open=true;f.click(f.small.button);f.small.links[0].focus();f.emit(f.small.links[0],'keydown',{key:'Escape'});assert.equal(f.mobile.open,true);assert.equal(f.small.panel.hidden,true);f.emit(f.small.button,'keydown',{key:'Escape'});assert.equal(f.mobile.open,false);assert.equal(f.document.activeElement,f.mobileSummary);
});
check('language picker Escape still closes and restores its summary focus',f=>{
  f.language.open=true;f.languageSummary.focus();f.emit(f.languageSummary,'keydown',{key:'Escape'});assert.equal(f.language.open,false);assert.equal(f.document.activeElement,f.languageSummary);
});

console.log(`PASS: ${results.length} actual navigation-handler checks.`);
