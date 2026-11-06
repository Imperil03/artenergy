import {copy,events,rooms,pathFor,translate,ui} from './model.mjs';
import {shell,gallerySection,eventCard,roomCard,wa,local,esc} from './templates.mjs';

const venueTitles={
  ru:'Площадка ArtEnergy',
  en:'The ArtEnergy venue',
  es:'El espacio ArtEnergy',
};

function breadcrumbs(key,lang){
  const label=translate({venue:'Площадка',events:'Праздники',stay:'Проживание'}[key],lang);
  return `<nav class="breadcrumbs" aria-label="${esc(ui[lang].navigation)}"><a href="${pathFor('home',lang)}">${esc(ui[lang].home)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(label)}</span></nav>`;
}

function venuePage(lang){
  const t=value=>translate(value,lang);
  const body=`<article class="section-hub section-hub--venue"><div class="wrap">${breadcrumbs('venue',lang)}</div>${gallerySection(lang,{standalone:true})}<nav class="wrap section-hub-related" aria-label="${esc(ui[lang].navigation)}">${local(pathFor('menu',lang),t(copy.kitchen.cta))}${local(pathFor('stay',lang),t('Проживание'))}${local(pathFor('spa',lang),t(copy.bath.title))}</nav></article>`;
  return shell({key:'venue',lang,title:venueTitles[lang],description:t(copy.gallery.body),body});
}

function eventsPage(lang){
  const t=value=>translate(value,lang);
  const cards=copy.events.home_groups.map(group=>{
    const event=events.find(item=>item.key===group.eventKey);
    if(!event)throw new Error('Missing event for section hub: '+group.eventKey);
    return eventCard({...event,name:group.title,summary:group.body},lang,'h2');
  }).join('');
  const body=`<article class="section-hub section-hub--events"><div class="wrap">${breadcrumbs('events',lang)}<header class="section-hub-heading"><h1>${esc(t(copy.events.title))}</h1><p class="section-lead">${esc(t(copy.events.body))}</p></header><div class="event-grid">${cards}</div><div class="section-hub-contact">${wa(lang,t(copy.events.cta),'event','','button')}</div></div></article>`;
  return shell({key:'events',lang,title:t(copy.events.title)+' · ArtEnergy',description:t(copy.events.body),body});
}

function staysPage(lang){
  const t=value=>translate(value,lang);
  const body=`<article class="section-hub section-hub--stay"><div class="wrap">${breadcrumbs('stay',lang)}<header class="section-hub-heading"><h1>${esc(t(copy.stay.title))}</h1><p class="section-lead">${esc(t(copy.stay.intro))}</p></header><div class="room-grid">${rooms.map(room=>roomCard(room,lang,false,'h2')).join('')}</div><div class="section-hub-contact">${wa(lang,t(copy.stay.cta),'room',copy.stay.title,'button')}</div></div></article>`;
  return shell({key:'stay',lang,title:t(copy.stay.title)+' · ArtEnergy',description:t(copy.stay.intro),body});
}

export function sectionPage(key,lang){
  const render={venue:venuePage,events:eventsPage,stay:staysPage}[key];
  if(!render)throw new Error('Unknown section page: '+key);
  return render(lang);
}
