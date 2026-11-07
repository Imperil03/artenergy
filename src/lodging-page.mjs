import {copy,rooms,pathFor,translate,ui,altFor} from './model.mjs';
import {shell,photoLink,wa,local,esc} from './templates.mjs';
import {lodgingPageCopy} from './lodging-copy.mjs';

// Additional room images must be distinct, verified views of this type.
const additionalPhotos={bungalow:[],apartments:[]};
const roomIds=['bungalow','apartments'];
const mainPhotoSizes='(max-width: 760px) calc(100vw - 48px), (max-width: 1050px) calc(100vw - 80px), 700px';

function roomSection(room,lang){
  const t=value=>translate(value,lang),c=lodgingPageCopy[lang],id=roomIds[room.index],option=c.options[id];
  const extra=additionalPhotos[id];
  const gallery=extra.length?`<div class="lodging-additional"><h3>${esc(ui[lang].gallery)}</h3><div class="lodging-gallery">${extra.map(key=>photoLink(key,altFor(key,lang),lang,'lodging-'+id,'(max-width: 760px) calc((100vw - 64px) / 2), 340px')).join('')}</div></div>`:'';
  return `<section class="lodging-offer${room.index===1?' lodging-offer--reverse':''}" id="${id}" aria-labelledby="${id}-title"><div class="lodging-media">${photoLink(room.image,t(room.title),lang,'lodging-'+id,mainPhotoSizes)}${gallery}</div><div class="lodging-copy"><h2 id="${id}-title">${esc(t(room.title))}</h2>${option.paragraphs.map(paragraph=>`<p class="lodging-description">${esc(paragraph)}</p>`).join('')}<p class="lodging-price${room.unit?'':' lodging-price--request'}">${esc(option.price)}</p><div class="lodging-action">${wa(lang,option.cta,'room',room.title,'button')}</div></div></section>`;
}

function restSection(lang){
  const c=lodgingPageCopy[lang],t=value=>translate(value,lang);
  const items=[['pool','pool','Бассейны',null],['kitchen','bar','Бар','menu'],['spa','sauna','Баня','spa']];
  return `<section class="lodging-rest section--paper" aria-labelledby="lodging-rest-title"><div class="wrap"><header class="lodging-rest-heading"><h2 id="lodging-rest-title">${esc(c.restHeading)}</h2><p class="section-lead">${esc(c.restIntro)}</p></header><div class="lodging-rest-grid">${items.map(([key,asset,caption,page])=>`<article class="lodging-rest-item">${photoLink(asset,t(caption),lang,'lodging-grounds','(max-width: 760px) calc(100vw - 48px), 380px')}<h3>${esc(c.rest[key].title)}</h3><p>${esc(c.rest[key].body)}</p>${page?local(pathFor(page,lang),c.rest[key].link):''}</article>`).join('')}</div></div></section>`;
}

export function lodgingPage(lang){
  const c=lodgingPageCopy[lang],u=ui[lang],t=value=>translate(value,lang);
  const body=`<article class="lodging-page"><div class="wrap"><nav class="breadcrumbs" aria-label="${esc(u.navigation)}"><a href="${pathFor('home',lang)}">${esc(u.home)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(t('Проживание'))}</span></nav><header class="lodging-intro"><h1>${esc(c.heading)}</h1><p class="section-lead">${esc(c.intro)}</p></header><div class="lodging-scenery">${photoLink('overview_day',t('Территория'),lang,'lodging-grounds','(max-width: 760px) calc(100vw - 48px), 1180px',{eager:true})}</div><div class="lodging-offers">${rooms.map(room=>roomSection(room,lang)).join('')}</div></div>${restSection(lang)}<section class="lodging-booking" aria-labelledby="lodging-booking-title"><div class="wrap lodging-booking-inner"><div class="lodging-booking-copy"><h2 id="lodging-booking-title">${esc(c.bookingHeading)}</h2><p>${esc(c.bookingBody)}</p></div>${wa(lang,c.bookingCta,'room',copy.stay.title,'button')}</div></section></article>`;
  return shell({key:'stay',lang,title:c.title,description:c.description,body});
}
