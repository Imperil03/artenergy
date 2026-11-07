import {copy,events,pathFor,translate,ui} from './model.mjs';
import {shell,gallerySection,eventCard,wa,local,esc} from './templates.mjs';
import {lodgingPage} from './lodging-page.mjs';
import {venuePageCopy} from './venue-copy.mjs';

function breadcrumbs(key,lang){
  const label=translate({venue:'Площадка',events:'Праздники',stay:'Проживание'}[key],lang);
  return `<nav class="breadcrumbs" aria-label="${esc(ui[lang].navigation)}"><a href="${pathFor('home',lang)}">${esc(ui[lang].home)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(label)}</span></nav>`;
}

function venuePage(lang){
  const c=venuePageCopy[lang];
  const body=`<article class="section-hub section-hub--venue"><div class="wrap">${breadcrumbs('venue',lang)}</div>${gallerySection(lang,{standalone:true,allVisible:true,headingText:c.heading,introText:c.intro})}<section class="venue-visit-cta" aria-labelledby="venue-visit-title"><div class="wrap venue-visit-cta-inner"><div class="venue-visit-cta-copy"><h2 id="venue-visit-title">${esc(c.ctaHeading)}</h2><p>${esc(c.ctaBody)}</p><nav class="venue-visit-cta-links" aria-label="${esc(ui[lang].navigation)}">${local(pathFor('home',lang)+'#visit',c.visitLink)}${local(pathFor('events',lang),c.eventsLink)}</nav></div>${wa(lang,c.cta,'general','','button')}</div></section></article>`;
  return shell({key:'venue',lang,title:c.title,description:c.description,body});
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

export function sectionPage(key,lang){
  const render={venue:venuePage,events:eventsPage,stay:lodgingPage}[key];
  if(!render)throw new Error('Unknown section page: '+key);
  return render(lang);
}
