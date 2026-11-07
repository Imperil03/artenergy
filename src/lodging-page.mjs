import {copy,rooms,pathFor,translate,ui,altFor} from './model.mjs';
import {shell,photoLink,wa,local,esc} from './templates.mjs';

const pageCopy={
  ru:{
    heading:'Проживание в Пунта-Кане — бунгало и апартаменты',
    intro:'Остановитесь в ArtEnergy в Баваро: выберите открытое эко-бунгало или апартаменты на территории.',
    title:'Проживание в Пунта-Кане: бунгало и апартаменты · ArtEnergy',
    description:'Проживание в ArtEnergy, Баваро, Пунта-Кана. Эко-бунгало — 150 USD за 24 часа, апартаменты — по запросу. Питание оплачивается отдельно.',
    cta:'Уточнить даты в WhatsApp',
    morePhotos:'Другие фотографии',
    conditions:'Перед бронированием',
    services:'Баня и хаммам оплачиваются отдельно от проживания.',
    questions:[
      {q:'Как организовано питание?',a:'Питание во время проживания согласуется заранее. Еда и напитки оплачиваются отдельно.',link:'menu'},
      {q:'Входит ли проживание в тариф посещения?',a:'Нет. Ночное и суточное посещение по минимальному заказу не включает проживание. Бунгало и апартаменты оплачиваются отдельно.',link:'visit'},
      {q:'Как узнать стоимость апартаментов и наличие?',a:'Напишите в WhatsApp, на какие даты вы планируете приехать. Уточним наличие, стоимость и условия выбранного варианта.'},
      {q:'Как согласовать проживание?',a:'Сообщите желаемые даты, число взрослых и детей, выбранный тип проживания и пожелания к питанию. Даты и условия согласуются в переписке.'},
    ],
  },
  en:{
    heading:'Stay in Punta Cana — eco-bungalow and apartments',
    intro:'Stay at ArtEnergy in Bávaro: choose an open-air eco-bungalow or an apartment on the grounds.',
    title:'Stay in Punta Cana: eco-bungalow and apartments · ArtEnergy',
    description:'Stay at ArtEnergy in Bávaro, Punta Cana. Eco-bungalow: 150 USD per 24 hours; apartment rates on request. Food and drinks are charged separately.',
    cta:'Check dates on WhatsApp',
    morePhotos:'More photos',
    conditions:'Before you book',
    services:'The steam bath and hammam are charged separately from accommodation.',
    questions:[
      {q:'How are meals arranged?',a:'Meals during your stay are arranged in advance. Food and drinks are charged separately.',link:'menu'},
      {q:'Does a visitor pass include accommodation?',a:'No. Overnight and 24-hour visits based on a minimum food and drink order do not include accommodation. The bungalow and apartments are charged separately.',link:'visit'},
      {q:'How do I check apartment rates and availability?',a:'Send us your preferred dates on WhatsApp. We will confirm availability, the price and arrangements for your chosen accommodation.'},
      {q:'How do I arrange a stay?',a:'Tell us your preferred dates, the number of adults and children, your chosen accommodation and any dining requests. Dates and arrangements are agreed in the chat.'},
    ],
  },
  es:{
    heading:'Alojamiento en Punta Cana — eco-bungaló y apartamentos',
    intro:'Alójate en ArtEnergy, en Bávaro: elige un eco-bungaló abierto o un apartamento dentro del recinto.',
    title:'Alojamiento en Punta Cana: bungaló y apartamentos · ArtEnergy',
    description:'Alojamiento en ArtEnergy, Bávaro, Punta Cana. Eco-bungaló: 150 USD por 24 horas; apartamentos con precio a consultar. Comida y bebidas aparte.',
    cta:'Consultar fechas por WhatsApp',
    morePhotos:'Más fotos',
    conditions:'Antes de reservar',
    services:'La sauna y el hammam se cobran aparte del alojamiento.',
    questions:[
      {q:'¿Cómo se organizan las comidas?',a:'Las comidas durante la estancia se acuerdan con antelación. La comida y las bebidas se cobran por separado.',link:'menu'},
      {q:'¿La tarifa de visita incluye alojamiento?',a:'No. Las visitas nocturnas y de 24 horas con consumo mínimo no incluyen alojamiento. El bungaló y los apartamentos se cobran por separado.',link:'visit'},
      {q:'¿Cómo consulto el precio de los apartamentos y la disponibilidad?',a:'Escríbenos por WhatsApp con las fechas en las que te gustaría venir. Confirmaremos la disponibilidad, el precio y las condiciones de la opción elegida.'},
      {q:'¿Cómo acuerdo mi estancia?',a:'Indica las fechas deseadas, el número de adultos y niños, el tipo de alojamiento y tus preferencias de comida. Las fechas y las condiciones se acuerdan en la conversación.'},
    ],
  },
};

// Only add keys for verified, distinct views of this accommodation type.
// Responsive variants and edits of the primary view are not additional photos.
const additionalPhotos={bungalow:[],apartments:[]};
const roomIds=['bungalow','apartments'];
const mainPhotoSizes='(max-width: 760px) calc(100vw - 48px), (max-width: 1050px) calc(100vw - 80px), 700px';
const downIcon='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

function roomSection(room,lang){
  const t=value=>translate(value,lang),c=pageCopy[lang],id=roomIds[room.index];
  const extra=additionalPhotos[id];
  const gallery=extra.length?`<div class="lodging-additional"><h3>${esc(c.morePhotos)}</h3><div class="lodging-gallery">${extra.map(key=>photoLink(key,altFor(key,lang),lang,'lodging-'+id,'(max-width: 760px) calc((100vw - 64px) / 2), 340px')).join('')}</div></div>`:'';
  return `<section class="lodging-offer${room.index===1?' lodging-offer--reverse':''}" id="${id}" aria-labelledby="${id}-title"><div class="lodging-media">${photoLink(room.image,t(room.title),lang,'lodging-'+id,mainPhotoSizes)}${gallery}</div><div class="lodging-copy"><h2 id="${id}-title">${esc(t(room.title))}</h2>${room.facts.map(fact=>`<p class="lodging-description">${esc(t(fact))}</p>`).join('')}<p class="lodging-price${room.unit?'':' lodging-price--request'}">${esc(t(room.price))}${room.unit?`<span>${esc(t(room.unit))}</span>`:''}</p><p class="lodging-meal-note">${esc(room.mealNote?t(room.mealNote):ui[lang].roomFood)}</p><div class="lodging-action">${wa(lang,c.cta,'room',room.title,'button')}</div></div></section>`;
}

export function lodgingPage(lang){
  const c=pageCopy[lang],u=ui[lang],t=value=>translate(value,lang);
  const questions=c.questions.map(item=>{
    const link=item.link==='menu'?local(pathFor('menu',lang),u.seeMenu):item.link==='visit'?local(pathFor('home',lang)+'#visit',u.seeVisit):'';
    return `<details open><summary>${esc(item.q)}${downIcon}</summary><p>${esc(item.a)}</p>${link?`<div class="lodging-condition-link">${link}</div>`:''}</details>`;
  }).join('');
  const body=`<article class="lodging-page"><div class="wrap"><nav class="breadcrumbs" aria-label="${esc(u.navigation)}"><a href="${pathFor('home',lang)}">${esc(u.home)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(t('Проживание'))}</span></nav><header class="lodging-intro"><h1>${esc(c.heading)}</h1><p class="section-lead">${esc(c.intro)}</p></header><div class="lodging-offers">${rooms.map(room=>roomSection(room,lang)).join('')}</div></div><section class="lodging-conditions section--paper" aria-labelledby="lodging-conditions-title"><div class="wrap wrap--reading"><h2 id="lodging-conditions-title">${esc(c.conditions)}</h2><p class="lodging-services-note">${esc(c.services)}</p><div class="lodging-spa-link">${local(pathFor('spa',lang),t(copy.bath.title))}</div><div class="faq-list">${questions}</div></div></section></article>`;
  return shell({key:'stay',lang,title:c.title,description:c.description,body});
}
