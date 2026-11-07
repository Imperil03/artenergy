import {copy,spaServices,translate} from './model.mjs';
import {shell} from './templates.mjs';
import {esc,breadcrumbs,restSection,bookingSection,serviceOfferSection} from './components.mjs';
import {spaEditorialCopy} from './spa-copy.mjs';
import {spaPromotionCopy} from './spa-procedures-copy.mjs';

const serviceIds=['banya','hammam'];

function serviceSection(service,lang){
  const t=value=>translate(value,lang),id=serviceIds[service.index],c=spaEditorialCopy[lang].options[id];
  return serviceOfferSection(lang,{id,title:t(service.title),paragraphs:c.paragraphs,image:service.image,reverse:service.index===1,eager:service.index===0,price:t(service.price),unit:t(service.unit),detail:c.detail,cta:c.cta,kind:'spa-service',name:service.title});
}

export function spaPage(lang){
  const c=spaEditorialCopy[lang],t=value=>translate(value,lang);
  const restContent={...c,rest:{...c.rest,massage:{...c.rest.massage,link:spaPromotionCopy[lang].link}}};
  const body=`<article class="spa-service-page"><div class="wrap">${breadcrumbs(lang,t(copy.bath.title),{current:true})}<header class="spa-service-intro"><h1>${esc(c.heading)}</h1><p class="section-lead">${esc(c.intro)}</p></header><div class="spa-services">${spaServices.map(service=>serviceSection(service,lang)).join('')}</div></div>${restSection(lang,{prefix:'spa',content:restContent,items:[['pool','pool','Бассейны','venue'],['kitchen','bar','Бар','menu'],['massage','covered','Крытые зоны отдыха','spa-treatments']],group:'spa-rest'})}${bookingSection(lang,{prefix:'spa',heading:c.bookingHeading,body:c.bookingBody,cta:c.bookingCta,kind:'bath'})}</article>`;
  return shell({key:'spa',lang,title:c.title,description:c.description,body});
}
