import {copy,spaServices,pathFor,translate,ui} from './model.mjs';
import {shell,photoLink,wa,local,esc} from './templates.mjs';
import {spaEditorialCopy} from './spa-copy.mjs';

const serviceIds=['banya','hammam'];

function serviceSection(service,lang){
  const t=value=>translate(value,lang),id=serviceIds[service.index],c=spaEditorialCopy[lang].options[id];
  return `<section class="spa-service${service.index===1?' spa-service--reverse':''}" id="${id}" aria-labelledby="${id}-title"><div class="spa-service-media">${photoLink(service.image,t(service.title),lang,'spa','(max-width: 760px) calc(100vw - 48px), (max-width: 1050px) calc(100vw - 80px), 690px',{eager:service.index===0})}</div><div class="spa-service-copy"><h2 id="${id}-title">${esc(t(service.title))}</h2>${c.paragraphs.map(paragraph=>`<p class="spa-service-description">${esc(paragraph)}</p>`).join('')}<p class="spa-service-price">${esc(t(service.price))} <span>${esc(t(service.unit))}</span></p>${c.detail?`<p class="spa-service-rate-details">${esc(c.detail)}</p>`:''}<div class="spa-service-action">${wa(lang,c.cta,'spa-service',service.title,'button')}</div></div></section>`;
}

function restSection(lang){
  const c=spaEditorialCopy[lang],t=value=>translate(value,lang);
  const items=[['pool','pool','Бассейны','venue'],['kitchen','bar','Бар','menu'],['massage','covered','Крытые зоны отдыха',null]];
  return `<section class="spa-rest section--paper" aria-labelledby="spa-rest-title"><div class="wrap"><header class="spa-rest-heading"><h2 id="spa-rest-title">${esc(c.restHeading)}</h2><p class="section-lead">${esc(c.restIntro)}</p></header><div class="spa-rest-grid">${items.map(([key,asset,caption,page])=>`<article class="spa-rest-item">${photoLink(asset,t(caption),lang,'spa-rest','(max-width: 760px) calc(100vw - 48px), 380px')}<h3>${esc(c.rest[key].title)}</h3><p>${esc(c.rest[key].body)}</p>${page?local(pathFor(page,lang),c.rest[key].link):''}</article>`).join('')}</div></div></section>`;
}

export function spaPage(lang){
  const c=spaEditorialCopy[lang],u=ui[lang],t=value=>translate(value,lang);
  const body=`<article class="spa-service-page"><div class="wrap"><nav class="breadcrumbs" aria-label="${esc(u.navigation)}"><a href="${pathFor('home',lang)}">${esc(u.home)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(t(copy.bath.title))}</span></nav><header class="spa-service-intro"><h1>${esc(c.heading)}</h1><p class="section-lead">${esc(c.intro)}</p></header><div class="spa-services">${spaServices.map(service=>serviceSection(service,lang)).join('')}</div></div>${restSection(lang)}<section class="spa-booking" aria-labelledby="spa-booking-title"><div class="wrap spa-booking-inner"><div class="spa-booking-copy"><h2 id="spa-booking-title">${esc(c.bookingHeading)}</h2><p>${esc(c.bookingBody)}</p></div>${wa(lang,c.bookingCta,'bath','','button')}</div></section></article>`;
  return shell({key:'spa',lang,title:c.title,description:c.description,body});
}
