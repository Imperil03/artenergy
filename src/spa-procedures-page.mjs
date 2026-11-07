import {readFileSync} from 'node:fs';
import {pathFor,altFor} from './model.mjs';
import {shell} from './templates.mjs';
import {breadcrumbs,esc,paragraphs,local,serviceOfferSection,bookingSection} from './components.mjs';
import {spaProceduresCopy} from './spa-procedures-copy.mjs';

const {services}=JSON.parse(readFileSync(new URL('./content/spa-procedures.json',import.meta.url),'utf8'));
const localized=(value,lang)=>typeof value==='string'?value:value?.[lang]??'';

export function spaProceduresPage(lang){
  const c=spaProceduresCopy[lang];
  const offers=services.map((service,index)=>{
    const option=c.options[service.id];
    return serviceOfferSection(lang,{
      id:service.id,
      title:option.heading,
      paragraphs:option.paragraphs,
      image:service.image,
      caption:altFor(service.image,lang),
      group:'spa-treatments',
      reverse:index%2===1,
      eager:index===0,
      price:localized(service.price,lang)||null,
      detail:localized(service.duration,lang),
      cta:option.cta,
      kind:'spa-treatment',
      name:option.heading,
    });
  }).join('');
  const body=`<article class="spa-service-page spa-procedures-page"><div class="wrap">${breadcrumbs(lang,c.navigation,{current:true})}<header class="spa-service-intro"><h1>${esc(c.heading)}</h1><p class="section-lead">${esc(c.intro)}</p></header><div class="spa-services">${offers}</div></div><section class="spa-procedures-bath" aria-labelledby="spa-procedures-bath-title"><div class="wrap wrap--reading spa-service-copy"><h2 id="spa-procedures-bath-title">${esc(c.bathHeading)}</h2>${paragraphs(c.bathParagraphs,'spa-service-description')}${local(pathFor('spa',lang),c.bathLink)}</div></section>${bookingSection(lang,{prefix:'spa',heading:c.bookingHeading,body:c.bookingBody,cta:c.bookingCta,kind:'spa-treatments'})}</article>`;
  return shell({key:'spa-treatments',lang,title:c.title,description:c.description,body});
}
