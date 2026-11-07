import {copy,spaServices,translate} from './model.mjs';
import {shell} from './templates.mjs';
import {photoLink,wa,esc,breadcrumbs,paragraphs,restSection,bookingSection} from './components.mjs';
import {spaEditorialCopy} from './spa-copy.mjs';

const serviceIds=['banya','hammam'];

function serviceSection(service,lang){
  const t=value=>translate(value,lang),id=serviceIds[service.index],c=spaEditorialCopy[lang].options[id];
  return `<section class="spa-service${service.index===1?' spa-service--reverse':''}" id="${id}" aria-labelledby="${id}-title"><div class="spa-service-media">${photoLink(service.image,t(service.title),lang,'spa','(max-width: 760px) calc(100vw - 48px), (max-width: 1050px) calc(100vw - 80px), 690px',{eager:service.index===0})}</div><div class="spa-service-copy"><h2 id="${id}-title">${esc(t(service.title))}</h2>${paragraphs(c.paragraphs,'spa-service-description')}<p class="spa-service-price">${esc(t(service.price))} <span>${esc(t(service.unit))}</span></p>${c.detail?`<p class="spa-service-rate-details">${esc(c.detail)}</p>`:''}<div class="spa-service-action">${wa(lang,c.cta,'spa-service',service.title,'button')}</div></div></section>`;
}

export function spaPage(lang){
  const c=spaEditorialCopy[lang],t=value=>translate(value,lang);
  const body=`<article class="spa-service-page"><div class="wrap">${breadcrumbs(lang,t(copy.bath.title),{current:true})}<header class="spa-service-intro"><h1>${esc(c.heading)}</h1><p class="section-lead">${esc(c.intro)}</p></header><div class="spa-services">${spaServices.map(service=>serviceSection(service,lang)).join('')}</div></div>${restSection(lang,{prefix:'spa',content:c,items:[['pool','pool','Бассейны','venue'],['kitchen','bar','Бар','menu'],['massage','covered','Крытые зоны отдыха',null]],group:'spa-rest'})}${bookingSection(lang,{prefix:'spa',heading:c.bookingHeading,body:c.bookingBody,cta:c.bookingCta,kind:'bath'})}</article>`;
  return shell({key:'spa',lang,title:c.title,description:c.description,body});
}
