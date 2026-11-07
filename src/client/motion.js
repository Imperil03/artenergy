function createMotion(){
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
  return {motion,dialogMotion};
}
