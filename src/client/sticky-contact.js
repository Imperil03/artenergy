function initStickyContact(){
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
}
