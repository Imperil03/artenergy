// All language actions follow the selected category or service anchor.
function syncLanguageLinks(hash){
  document.querySelectorAll('.languages a,[data-language-accept]').forEach(link=>{
    const url=new URL(link.href);url.hash=hash;link.href=url.pathname+url.hash;
  });
}

function initServiceLanguageLinks(){
  const anchors={spa:['#banya','#hammam'],stay:['#bungalow','#apartments'],'spa-treatments':['#massage','#body-peeling','#steam-treatment']}[document.body.dataset.page];
  if(!anchors)return;
  const sync=()=>syncLanguageLinks(anchors.includes(location.hash)?location.hash:'');
  window.addEventListener('hashchange',sync);sync();
}
