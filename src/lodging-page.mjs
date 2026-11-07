import {copy,rooms,translate,ui,altFor} from './model.mjs';
import {shell} from './templates.mjs';
import {photoLink,wa,esc,breadcrumbs,paragraphs,restSection,bookingSection} from './components.mjs';
import {lodgingPageCopy} from './lodging-copy.mjs';

// Additional room images must be distinct, verified views of this type.
const additionalPhotos={bungalow:[],apartments:[]};
const roomIds=['bungalow','apartments'];
const mainPhotoSizes='(max-width: 760px) calc(100vw - 48px), (max-width: 1050px) calc(100vw - 80px), 700px';

function roomSection(room,lang){
  const t=value=>translate(value,lang),c=lodgingPageCopy[lang],id=roomIds[room.index],option=c.options[id];
  const extra=additionalPhotos[id];
  const gallery=extra.length?`<div class="lodging-additional"><h3>${esc(ui[lang].gallery)}</h3><div class="lodging-gallery">${extra.map(key=>photoLink(key,altFor(key,lang),lang,'lodging-'+id,'(max-width: 760px) calc((100vw - 64px) / 2), 340px')).join('')}</div></div>`:'';
  return `<section class="lodging-offer${room.index===1?' lodging-offer--reverse':''}" id="${id}" aria-labelledby="${id}-title"><div class="lodging-media">${photoLink(room.image,t(room.title),lang,'lodging-'+id,mainPhotoSizes)}${gallery}</div><div class="lodging-copy"><h2 id="${id}-title">${esc(t(room.title))}</h2>${paragraphs(option.paragraphs,'lodging-description')}<p class="lodging-price${room.unit?'':' lodging-price--request'}">${esc(option.price)}</p><div class="lodging-action">${wa(lang,option.cta,'room',room.title,'button')}</div></div></section>`;
}

export function lodgingPage(lang){
  const c=lodgingPageCopy[lang],t=value=>translate(value,lang);
  const body=`<article class="lodging-page"><div class="wrap">${breadcrumbs(lang,t('Проживание'),{current:true})}<header class="lodging-intro"><h1>${esc(c.heading)}</h1><p class="section-lead">${esc(c.intro)}</p></header><div class="lodging-scenery">${photoLink('overview_day',t('Территория'),lang,'lodging-grounds','(max-width: 760px) calc(100vw - 48px), 1180px',{eager:true})}</div><div class="lodging-offers">${rooms.map(room=>roomSection(room,lang)).join('')}</div></div>${restSection(lang,{prefix:'lodging',content:c,items:[['pool','pool','Бассейны',null],['kitchen','bar','Бар','menu'],['spa','sauna','Баня','spa']],group:'lodging-grounds'})}${bookingSection(lang,{prefix:'lodging',heading:c.bookingHeading,body:c.bookingBody,cta:c.bookingCta,kind:'room',name:copy.stay.title})}</article>`;
  return shell({key:'stay',lang,title:c.title,description:c.description,body});
}
