// Actual dialog/lightbox handlers with controlled events and time, not native touch.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const motionSource=await readFile(new URL('../src/client/motion.js',import.meta.url),'utf8');
const start=motionSource.indexOf('  function dialogMotion(');
const end=motionSource.indexOf('  return {motion,dialogMotion};',start);
assert.ok(start>=0&&end>start,'Dialog helper exists');
const actualHandlers=motionSource.slice(start,end)+'\n'+
  await readFile(new URL('../src/client/lightbox.js',import.meta.url),'utf8')+'\ninitLightbox(motion,dialogMotion);';

function fixture(){
  let now=1000,activeElement=null;
  class Element{
    constructor(tag,attributes={}){
      this.tagName=tag.toLowerCase();this.attributes=new Map();this.dataset={};
      this.children=[];this.parentElement=null;this.listeners=new Map();this.hidden=false;
      const classes=new Set();
      this.classList={add:(...names)=>names.forEach(name=>classes.add(name)),
        remove:(...names)=>names.forEach(name=>classes.delete(name)),contains:name=>classes.has(name)};
      const styles=new Map();
      this.style={setProperty:(name,value)=>styles.set(name,value),removeProperty:name=>styles.delete(name)};
      Object.entries(attributes).forEach(([name,value])=>this.setAttribute(name,value));
    }
    setAttribute(name,value){
      this.attributes.set(name,String(value));
      if(name.startsWith('data-'))this.dataset[name.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase())]=String(value);
    }
    getAttribute(name){return this.attributes.get(name)??null;}
    removeAttribute(name){this.attributes.delete(name);}
    get src(){return this.getAttribute('src')??'';}
    set src(value){this.setAttribute('src',value);}
    get href(){return this.getAttribute('href')??'';}
    set href(value){this.setAttribute('href',value);}
    append(...nodes){nodes.forEach(node=>{node.parentElement=this;this.children.push(node);});}
    matches(selector){
      return selector.split(',').some(part=>{
        const match=part.trim().match(/^([a-z]+)?(?:\[([^\]]+)\])?$/);
        return match&&(!match[1]||this.tagName===match[1])&&(!match[2]||this.attributes.has(match[2]));
      });
    }
    closest(selector){for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null;}
    querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
    querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
    addEventListener(type,listener){const listeners=this.listeners.get(type)??[];listeners.push(listener);this.listeners.set(type,listeners);}
    dispatch(type,properties={}){
      const event={type,target:this,bubbles:true,defaultPrevented:false,
        preventDefault(){this.defaultPrevented=true;},...properties};
      for(let node=this;node;node=event.bubbles?node.parentElement:null){
        event.currentTarget=node;
        for(const listener of node.listeners.get(type)??[])listener(event);
      }
      return event;
    }
    focus(){activeElement=this;}
    showModal(){this.open=true;}
    close(){this.open=false;this.dispatch('close',{bubbles:false});}
  }
  const make=(tag,data)=>new Element(tag,data);
  const document=make('document'),body=make('body');document.body=body;document.append(body);
  const dialog=make('dialog',{'data-lightbox':''});dialog.open=false;
  const shell=make('div'),image=make('img',{'data-lightbox-image':''});
  const caption=make('p',{'data-lightbox-caption':''}),count=make('span',{'data-lightbox-count':''});
  const previous=make('button',{'data-lightbox-prev':''}),next=make('button',{'data-lightbox-next':''});
  const close=make('button',{'data-lightbox-close':''});
  const nextSvg=make('svg'),nextPath=make('path');nextSvg.append(nextPath);next.append(nextSvg);
  const previousSvg=make('svg'),previousPath=make('path');previousSvg.append(previousPath);previous.append(previousSvg);
  const closeSvg=make('svg'),closePath=make('path');closeSvg.append(closePath);close.append(closeSvg);
  shell.append(image,caption,count,previous,next,close);dialog.append(shell);body.append(dialog);
  const links=[1,2].map(number=>{
    const url=`https://example.invalid/photo-${number}.jpg`;
    const link=make('a',{'href':url,'data-gallery':'fixture','data-caption':`Photo ${number}`});
    const thumb=make('img',{'src':url});thumb.alt=`Photo ${number}`;
    link.append(thumb);body.append(link);return link;
  });
  vm.runInNewContext(actualHandlers,{
    document,motion:{reduced:true,timings:{out:0},run:()=>null,cancel:()=>{}},
    performance:{now:()=>now},getComputedStyle:()=>({opacity:'1'}),
    // The fixture uses identical thumbnail/full URLs, avoiding the unrelated loader.
    Image:class{constructor(){throw new Error('Unexpected image-loader branch');}},
  },{filename:fileURLToPath(sourceUrl)});
  return {dialog,image,caption,count,shell,previous,next,close,nextSvg,nextPath,previousPath,closePath,
    body,links,advance:milliseconds=>{now+=milliseconds;},active:()=>activeElement,
    open:()=>{links[0].dispatch('click');assert.equal(dialog.open,true);assert.equal(count.textContent,'1 / 2');},
    touchStart:(x=180,y=100)=>image.dispatch('touchstart',{touches:[{clientX:x,clientY:y}]}),
    touchEnd:(x=70,y=105)=>image.dispatch('touchend',{changedTouches:[{clientX:x,clientY:y}]}),
  };
}

const checks=[];
function check(name,test){
  try{test();checks.push({name,status:'passed'});}
  catch(error){checks.push({name,status:'failed',error:error.message});}
}
const assertClosed=f=>{
  assert.equal(f.dialog.open,false);assert.equal(f.body.classList.contains('is-locked'),false);
  assert.equal(f.active(),f.links[0]);assert.equal(f.image.getAttribute('src'),null);
};

check('swipe suppresses delayed click; next deliberate touch closes',()=>{
  const f=fixture();f.open();f.touchStart();f.touchEnd();
  assert.equal(f.count.textContent,'2 / 2');f.advance(300);
  const click=f.image.dispatch('click');
  assert.equal(click.defaultPrevented,true);assert.equal(f.dialog.open,true);
  f.touchStart(100,100);f.touchEnd(100,100);f.image.dispatch('click');assertClosed(f);
});
check('next deliberate touch closes even without a synthetic swipe click',()=>{
  const f=fixture();f.open();f.touchStart();f.touchEnd();f.advance(50);
  f.touchStart(100,100);f.touchEnd(100,100);f.image.dispatch('click');assertClosed(f);
});
check('unconsumed swipe guard expires after 700 ms',()=>{
  const f=fixture();f.open();f.touchStart();f.touchEnd();f.advance(701);
  f.image.dispatch('click');assertClosed(f);
});
check('navigation SVG and path clicks change photo and remain open',()=>{
  const f=fixture();f.open();f.nextSvg.dispatch('click');
  assert.equal(f.count.textContent,'2 / 2');assert.equal(f.dialog.open,true);
  f.previousPath.dispatch('click');assert.equal(f.count.textContent,'1 / 2');assert.equal(f.dialog.open,true);
  f.nextPath.dispatch('click');assert.equal(f.count.textContent,'2 / 2');assert.equal(f.dialog.open,true);
});
for(const target of ['image','caption','count','shell','dialog'])check(`${target} click closes and restores focus/scroll`,()=>{
  const f=fixture();f.open();f[target].dispatch('click');assertClosed(f);
});
check('close icon path retains dismissal',()=>{
  const f=fixture();f.open();f.closePath.dispatch('click');assertClosed(f);
});
check('native dialog cancel retains Escape dismissal',()=>{
  const f=fixture();f.open();const event=f.dialog.dispatch('cancel',{bubbles:false});
  assert.equal(event.defaultPrevented,true);assertClosed(f);
});
check('dialog close resets outstanding swipe guard before reopen',()=>{
  const f=fixture();f.open();f.touchStart();f.touchEnd();f.close.dispatch('click');
  f.open();f.image.dispatch('click');assertClosed(f);
});

console.log(`PASS: ${checks.length} actual lightbox-handler checks.`);
