import {pathFor,altFor,spaTreatmentCatalog} from './model.mjs';
import {shell} from './templates.mjs';
import {breadcrumbs,esc,image,photoLink,paragraphs,wa,local,bookingSection} from './components.mjs';
import {spaProceduresCopy} from './spa-procedures-copy.mjs';

const {services,heroImage}=spaTreatmentCatalog;
const localized=(value,lang)=>typeof value==='string'?value:value?.[lang]??'';

function procedureSection(service,lang,primary=false){
  const option=spaProceduresCopy[lang].options[service.id],duration=localized(service.duration,lang);
  const sizes=primary?'(max-width: 760px) calc(100vw - 48px), 620px':'(max-width: 760px) calc(100vw - 48px), 580px';
  return `<section class="spa-treatments-service${primary?' spa-treatments-primary':''}" id="${service.id}" aria-labelledby="${service.id}-title"><div class="spa-treatments-service-media">${photoLink(service.image,altFor(service.image,lang),lang,'spa-treatments',sizes)}</div><div class="spa-treatments-service-copy"><h2 id="${service.id}-title">${esc(option.heading)}</h2>${paragraphs(option.paragraphs,'spa-service-description')}${duration?`<p class="spa-service-rate-details">${esc(duration)}</p>`:''}<div class="spa-treatments-service-action">${wa(lang,option.cta,'spa-treatment',option.heading,'button')}</div></div></section>`;
}

function pricingSection(lang){
  const c=spaProceduresCopy[lang];
  return `<section class="spa-treatments-pricing" aria-labelledby="spa-pricing-title"><h2 id="spa-pricing-title">${esc(c.priceHeading)}</h2><table class="spa-treatments-prices" role="table"><thead><tr>${c.priceColumns.map(label=>`<th scope="col">${esc(label)}</th>`).join('')}</tr></thead><tbody>${services.map((service,index)=>`<tr><th scope="row">${esc(c.priceRows[index][0])}</th><td class="spa-treatments-price-description">${esc(c.priceRows[index][1])}</td><td class="spa-treatments-price-value">${esc(localized(service.price,lang))}</td></tr>`).join('')}</tbody></table><p class="spa-treatments-price-note">${esc(c.priceNote)}</p></section>`;
}

function relatedRest(lang){
  const c=spaProceduresCopy[lang];
  return `<section class="spa-treatments-rest" aria-labelledby="spa-treatments-rest-title"><div class="wrap"><header class="spa-treatments-rest-heading"><h2 id="spa-treatments-rest-title">${esc(c.restHeading)}</h2><p>${esc(c.restIntro)}</p></header><div class="spa-treatments-rest-grid">${[['bath','sauna','spa'],['pool','pool','venue']].map(([key,asset,page])=>`<article class="spa-treatments-rest-item">${photoLink(asset,altFor(asset,lang),lang,'spa-treatments-rest','(max-width: 760px) calc(100vw - 48px), 580px')}<h3>${esc(c.rest[key].heading)}</h3><p>${esc(c.rest[key].body)}</p>${local(pathFor(page,lang),c.rest[key].link)}</article>`).join('')}</div></div></section>`;
}

export function spaProceduresPage(lang){
  const c=spaProceduresCopy[lang];
  const body=`<article class="spa-service-page spa-procedures-page"><div class="wrap">${breadcrumbs(lang,c.navigation,{current:true})}<header class="spa-treatments-hero"><div class="spa-treatments-hero-copy"><h1>${esc(c.heading)}</h1><p>${esc(c.intro)}</p></div><figure class="spa-treatments-hero-media">${image(heroImage,lang,{eager:true,sizes:'(max-width: 760px) calc(100vw - 48px), 640px'})}</figure></header>${pricingSection(lang)}<div class="spa-treatments-details">${procedureSection(services[0],lang,true)}<div class="spa-treatments-secondary">${services.slice(1).map(service=>procedureSection(service,lang)).join('')}</div></div></div>${relatedRest(lang)}${bookingSection(lang,{prefix:'spa',heading:c.bookingHeading,body:c.bookingBody,cta:c.bookingCta,kind:'spa-treatments'})}</article>`;
  return shell({key:'spa-treatments',lang,title:c.title,description:c.description,body});
}
