import {copy,events,pathFor,translate,ui} from './model.mjs';
import {shell,gallerySection,eventCard} from './templates.mjs';
import {wa,local,esc,breadcrumbs} from './components.mjs';
import {lodgingPage} from './lodging-page.mjs';
import {venuePageCopy,venueFacts} from './venue-copy.mjs';
import {spaPromotionCopy} from './spa-procedures-copy.mjs';

function venueFactsBlock(lang){
  return `<dl class="venue-facts">${venueFacts.map(fact=>`<div><dt>${esc(fact.labels[lang])}</dt><dd><span class="venue-facts-value">${esc(fact.value)}</span> <span class="venue-facts-unit">${esc(fact.units[lang])}</span></dd></div>`).join('')}</dl>`;
}

function venuePage(lang){
  const c=venuePageCopy[lang];
  const body=`<article class="section-hub section-hub--venue"><div class="wrap">${breadcrumbs(lang,translate('Площадка',lang),{current:true})}</div>${gallerySection(lang,{standalone:true,allVisible:true,headingText:c.heading,introText:c.intro,afterIntro:venueFactsBlock(lang)})}<section class="venue-visit-cta" aria-labelledby="venue-visit-title"><div class="wrap venue-visit-cta-inner"><div class="venue-visit-cta-copy"><h2 id="venue-visit-title">${esc(c.ctaHeading)}</h2><p>${esc(c.ctaBody)}</p><nav class="venue-visit-cta-links" aria-label="${esc(ui[lang].navigation)}">${local(pathFor('home',lang)+'#visit',c.visitLink)}${local(pathFor('events',lang),c.eventsLink)}${local(pathFor('spa-treatments',lang),spaPromotionCopy[lang].title)}</nav></div>${wa(lang,c.cta,'general','','button')}</div></section></article>`;
  return shell({key:'venue',lang,title:c.title,description:c.description,body});
}

function eventsPage(lang){
  const t=value=>translate(value,lang);
  const cards=copy.events.home_groups.map(group=>{
    const event=events.find(item=>item.key===group.eventKey);
    if(!event)throw new Error('Missing event for section hub: '+group.eventKey);
    return eventCard({...event,name:group.title,summary:group.body},lang,'h2');
  }).join('');
  const body=`<article class="section-hub section-hub--events"><div class="wrap">${breadcrumbs(lang,translate('Праздники',lang),{current:true})}<header class="section-hub-heading"><h1>${esc(t(copy.events.title))}</h1><p class="section-lead">${esc(t(copy.events.body))}</p></header><div class="event-grid">${cards}</div><div class="section-hub-contact">${wa(lang,t(copy.events.cta),'event','','button')}</div></div></article>`;
  return shell({key:'events',lang,title:t(copy.events.title)+' · ArtEnergy',description:t(copy.events.body),body});
}

export function sectionPage(key,lang){
  const render={venue:venuePage,events:eventsPage,stay:lodgingPage}[key];
  if(!render)throw new Error('Unknown section page: '+key);
  return render(lang);
}
