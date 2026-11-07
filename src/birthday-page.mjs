import {events,eventText,pathFor,translate,ui,altFor} from './model.mjs';
import {shell,photoLink,image,icon,wa,local,esc} from './templates.mjs';
import {birthdayPageCopy} from './birthday-copy.mjs';

const event=events.find(item=>item.key==='event-0');

function gallery(lang){
  const c=birthdayPageCopy[lang],photos=eventText[lang][event.index].gallery;
  return `<section class="birthday-gallery" aria-labelledby="birthday-gallery-title"><div class="birthday-wrap"><h2 id="birthday-gallery-title">${esc(c.galleryTitle)}</h2><div class="birthday-gallery-grid">${photos.map((key,i)=>photoLink(key,altFor(key,lang),lang,'birthday-venue',i===0?'(max-width: 760px) calc(100vw - 48px), 680px':'(max-width: 760px) calc((100vw - 64px) / 2), 420px',{eager:i===0})).join('')}</div></div></section>`;
}

function priceParagraph(text){
  return esc(text).replaceAll('500 DOP','<strong class="birthday-price-value">500 DOP</strong>').replaceAll('1 000 DOP','<strong class="birthday-price-value">1 000 DOP</strong>');
}

function pricingSection(lang){
  const c=birthdayPageCopy[lang];
  const paragraphs=c.pricingParagraphs.map((paragraph,i)=>`<p>${priceParagraph(paragraph)}</p>${i===1?`<p class="birthday-practical-note">${esc(c.periodNote)}</p>`:''}`).join('');
  return `<section class="birthday-pricing section--paper" aria-labelledby="birthday-pricing-title"><div class="birthday-reading"><h2 id="birthday-pricing-title">${esc(c.pricingTitle)}</h2>${paragraphs}${local(pathFor('home',lang)+'#visit',c.visitLink)}</div></section>`;
}

export function birthdayPage(lang){
  const c=birthdayPageCopy[lang],u=ui[lang],t=value=>translate(value,lang);
  const body=`<article class="birthday-page"><div class="birthday-wrap"><nav class="breadcrumbs" aria-label="${esc(u.navigation)}"><a href="${pathFor('home',lang)}">${esc(u.home)}</a><span aria-hidden="true">/</span><a href="${pathFor('events',lang)}">${esc(t('Праздники'))}</a></nav><header class="birthday-intro"><h1>${esc(c.heading)}</h1><p class="section-lead">${esc(c.intro)}</p>${wa(lang,c.heroCta,'event',event.name,'button')}</header></div>${gallery(lang)}<section class="birthday-feature birthday-feature--plan birthday-wrap" aria-labelledby="birthday-plan-title"><div class="birthday-feature-copy"><h2 id="birthday-plan-title">${esc(c.planTitle)}</h2>${c.planParagraphs.map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}<p class="birthday-practical-note">${esc(u.musicRule)}</p></div><div class="birthday-feature-media">${photoLink('organizers',altFor('organizers',lang),lang,'birthday-covered','(max-width: 760px) calc(100vw - 48px), 550px')}</div></section><section class="birthday-feature birthday-feature--food birthday-wrap" aria-labelledby="birthday-food-title"><div class="birthday-feature-media">${photoLink('kitchen_table',altFor('kitchen_table',lang),lang,'birthday-food','(max-width: 760px) calc(100vw - 48px), 550px')}</div><div class="birthday-feature-copy"><h2 id="birthday-food-title">${esc(c.foodTitle)}</h2>${c.foodParagraphs.map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}${local(pathFor('menu',lang),c.menuLink)}</div></section>${pricingSection(lang)}<section class="birthday-stay birthday-wrap" aria-labelledby="birthday-stay-title"><a class="birthday-stay-link" href="${pathFor('stay',lang)}" aria-label="${esc(c.stayLink)}"><span class="birthday-stay-photo">${image('bungalow',lang,{sizes:'(max-width: 760px) calc(100vw - 48px), 320px'})}</span><div class="birthday-stay-copy"><h2 id="birthday-stay-title">${esc(c.stayTitle)}</h2><p>${esc(c.stayBody)}</p><span class="text-link birthday-stay-action">${esc(c.stayLink)}${icon()}</span></div></a></section><section class="birthday-booking" aria-labelledby="birthday-booking-title"><div class="birthday-wrap birthday-booking-inner"><div><h2 id="birthday-booking-title">${esc(c.bookingTitle)}</h2><p>${esc(c.bookingBody)}</p></div>${wa(lang,c.bookingCta,'event',event.name,'button')}</div></section></article>`;
  return shell({key:event.key,lang,title:c.title,description:c.description,body});
}
