import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {spaProceduresPage} from '../src/spa-procedures-page.mjs';
import {spaPage} from '../src/spa-page.mjs';
import {lodgingPage} from '../src/lodging-page.mjs';
import {sectionPage} from '../src/section-pages.mjs';
import {homePage,contactsPage} from '../src/templates.mjs';
import {serviceOfferSection} from '../src/components.mjs';
import {assets,pathFor,origin} from '../src/model.mjs';
import {socials} from '../src/socials.mjs';
import {socialLinks} from '../src/social-links.mjs';

const decode=text=>text.replace(/&(?:amp|quot|#39|lt|gt);/g,entity=>({'&amp;':'&','&quot;':'"','&#39;':"'",'&lt;':'<','&gt;':'>'}[entity]));
const text=html=>decode(html.replace(/<[^>]+>/g,'')).trim();
const main=html=>html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1]??assert.fail('Missing main');
const footer=html=>html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)?.[1]??assert.fail('Missing footer');
const section=(html,id)=>html.match(new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)<\\/section>`))?.[1]??assert.fail('Missing section '+id);
const sectionWithClass=(html,name)=>html.match(new RegExp(`<section\\b[^>]*\\bclass="[^\"]*\\b${name}\\b[^\"]*"[^>]*>([\\s\\S]*?)<\\/section>`))?.[1]??assert.fail('Missing section .'+name);
const paragraphs=html=>[...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(match=>text(match[1]));
const anchors=html=>[...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([,attributes,body])=>({attributes,href:decode(attributes.match(/\bhref="([^"]*)"/)?.[1]??''),label:text(body)}));
const whatsapp=html=>anchors(html).filter(a=>a.href.startsWith('https://wa.me/')).map(a=>{
  const url=new URL(a.href);
  assert.equal(url.pathname,'/18297715555');
  assert(url.searchParams.get('text'),'WhatsApp message must not be empty');
  return {...a,message:url.searchParams.get('text')};
});
const hasLink=(html,href)=>assert(anchors(html).some(a=>a.href===href),'Missing link '+href);

// Literal approved copy protects the supplied wording, rather than comparing a renderer to its own copy object.
const approvedRu={
  h1:'Массаж и SPA-процедуры в Пунта-Кане',
  title:'Массаж и SPA-процедуры в Пунта-Кане (Баваро) | ArtEnergy',
  description:'Массаж, пилинг тела и пропарка в ArtEnergy, Баваро, Пунта-Кана. SPA-процедуры, возможность совместить их с баней и хаммамом, запись через WhatsApp.',
  intro:'В ArtEnergy в районе Баваро можно записаться на массаж, пилинг тела или пропарку. Процедуры доступны по предварительной договорённости. Их можно совместить с посещением бани или хаммама.',
  offers:[
    {title:'Массаж',paragraphs:[
      'Массаж можно запланировать во время отдыха в ArtEnergy. При записи мы расскажем, какие виды массажа доступны, сколько длится сеанс и какова его стоимость.',
      'Если вы также собираетесь посетить баню или хаммам, все услуги можно согласовать на одну дату.',
    ],cta:'Уточнить массаж'},
    {title:'Пилинг тела',paragraphs:[
      'Пилинг тела — процедура ухода за кожей, направленная на её очищение. В ArtEnergy его можно включить в программу отдыха вместе с другими SPA-услугами.',
      'Доступные виды пилинга, используемые средства и продолжительность процедуры уточняются при записи.',
    ],cta:'Узнать о пилинге'},
    {title:'Пропарка',paragraphs:[
      'Пропарка — отдельная банная процедура с прогревом и паром. Её можно дополнительно заказать при посещении сауны.',
      'Продолжительность и порядок проведения процедуры согласуются заранее.',
    ],cta:'Уточнить пропарку'},
  ],
  bathTitle:'SPA-процедуры и отдых в бане',
  bathParagraphs:[
    'На территории ArtEnergy также есть баня с деревянной парной и хаммам с влажным паром.',
    'Если хотите совместить несколько услуг, можно согласовать их на одну дату. Баня, хаммам и SPA-процедуры оплачиваются отдельно.',
  ],
  bathLink:'Посмотреть баню и хаммам',
  bookingTitle:'Как записаться на SPA-процедуру',
  bookingBody:'Напишите нам в WhatsApp, укажите интересующую процедуру, дату и желаемое время. Мы уточним возможность записи, продолжительность и стоимость.',
  bookingCta:'Записаться через WhatsApp',
};

const routes={ru:'/spa-procedury/',en:'/en/spa-treatments/',es:'/es/tratamientos-spa/'};
const ids=['massage','body-peeling','steam-treatment'];
const titles={ru:['Массаж','Пилинг тела','Пропарка'],en:['Massage','Body peeling','Steam treatment'],es:['Masaje','Exfoliación corporal','Sesión de vapor']};
const captions={
  ru:['Крытая зона с диванами','Крытое пространство с креслами и столами','Парная с деревянными полками'],
  en:['Covered lounge with sofas','Covered space with armchairs and tables','Steam room with wooden benches'],
  es:['Zona cubierta con sofás','Espacio cubierto con sillones y mesas','Sauna con bancos de madera'],
};
const {services}=JSON.parse(readFileSync(new URL('../src/content/spa-procedures.json',import.meta.url),'utf8'));
assert.deepEqual(services.map(s=>s.id),ids);
assert.deepEqual(services.map(s=>s.image),['covered','organizers','sauna'],'Keep the three reviewed real-space photographs');
assert(services.every(s=>s.price===null&&s.duration===null),'Unconfirmed tariffs and durations must remain null');

for(const lang of ['ru','en','es']){
  const html=spaProceduresPage(lang),body=main(html),messages=[];
  assert.equal(pathFor('spa-treatments',lang),routes[lang]);
  assert(html.includes(`<link rel="canonical" href="${origin+routes[lang]}">`));
  for(const [locale,route] of Object.entries(routes))assert(html.includes(`<link rel="alternate" hreflang="${locale}" href="${origin+route}">`));
  assert.equal((body.match(/<h1\b/g)||[]).length,1);
  assert.equal((body.match(/<h2\b/g)||[]).length,5);
  assert.equal(paragraphs(body).length,10,'No unsolicited copy or tariff paragraphs');
  assert(!/<(?:form|details)\b|FAQPage|class="spa-service-(?:price|rate-details)"/i.test(body),'No form, FAQ, unconfirmed tariff or duration block');
  assert(!/\b(?:1 500|2 000|2 500) DOP\b/.test(text(body)),'Do not revive legacy prices');
  for(const [index,id] of ids.entries()){
    const offer=section(body,id),asset=assets[services[index].image];
    assert.equal(text(offer.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)[1]),titles[lang][index]);
    assert(offer.indexOf('<img ')<offer.indexOf('<h2'),'Mobile source order must put the real photo before its description');
    assert(offer.includes(`data-caption="${captions[lang][index]}"`));
    assert(offer.includes(`alt="${captions[lang][index]}"`));
    assert(offer.includes(`src="${asset.src}"`));
    assert(existsSync(new URL('../public'+asset.src,import.meta.url)),'Missing local photo '+asset.src);
    const [link,...extra]=whatsapp(offer);
    assert(link&&!extra.length,'Each service needs one direct WhatsApp action');
    assert(link.message.includes(titles[lang][index]),'WhatsApp must name the selected service');
    assert(link.message.includes('ArtEnergy'));
    messages.push(link.message);
    if(lang==='ru'){
      assert.deepEqual(paragraphs(offer),approvedRu.offers[index].paragraphs);
      assert.equal(link.label,approvedRu.offers[index].cta);
    }
  }
  assert.equal(new Set(messages).size,3,'The three service actions must open different messages');
  const pageActions=whatsapp(body);
  assert.equal(pageActions.length,4);
  const booking=pageActions.at(-1);
  assert(/spa/i.test(booking.message));
  for(const field of {ru:['Дата:','Время:'],en:['Date:','Time:'],es:['Fecha:','Hora:']}[lang])assert(booking.message.includes(field));
  for(const title of titles[lang])assert(!booking.message.includes(title),'Final booking must remain a general SPA enquiry');
  hasLink(body,pathFor('spa',lang));
  if(lang==='ru'){
    assert.equal(text(html.match(/<title>([\s\S]*?)<\/title>/)[1]),approvedRu.title);
    assert.equal(decode(html.match(/<meta name="description" content="([^"]*)">/)[1]),approvedRu.description);
    assert.equal(text(body.match(/<h1>([\s\S]*?)<\/h1>/)[1]),approvedRu.h1);
    assert.equal(paragraphs(body)[0],approvedRu.intro);
    assert.deepEqual([...body.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map(m=>text(m[1])),[...titles.ru,approvedRu.bathTitle,approvedRu.bookingTitle]);
    const bath=sectionWithClass(body,'spa-procedures-bath');
    assert.deepEqual(paragraphs(bath),approvedRu.bathParagraphs);
    assert(anchors(bath).some(a=>a.label===approvedRu.bathLink));
    assert.equal(paragraphs(body).at(-1),approvedRu.bookingBody);
    assert.equal(booking.label,approvedRu.bookingCta);
  }

  const home=homePage(lang),bath=section(main(home),'bath');
  assert.equal((bath.match(/class="spa-card"/g)||[]).length,2,'Keep both original banya and hammam cards');
  for(const fragment of ['#banya','#hammam'])hasLink(bath,pathFor('spa',lang)+fragment);
  hasLink(bath,routes[lang]);
  if(lang==='ru')for(const exact of ['Массаж и SPA-процедуры','В ArtEnergy можно записаться на массаж, пилинг тела и пропарку. Процедуры доступны по предварительному согласованию.','Посмотреть SPA-процедуры'])assert(text(bath).includes(exact),'Missing approved teaser copy');
  const related=[spaPage(lang),lodgingPage(lang),sectionPage('venue',lang)];
  for(const page of related)hasLink(main(page),routes[lang]);
  for(const page of [html,home,...related,contactsPage(lang)]){
    hasLink(footer(page),routes[lang]);
    assert(!/\b1[\s\u00a0]?700\s*(?:м²|m²)|\b8\s+(?:апартамент|apartments|apartamentos)|\b3\s+(?:бунгало|bungalows)|\b24\s*\/\s*7\b|(?:более|больше) шести/i.test(text(main(page))),'Unconfirmed legacy facts must not become current claims');
    const social=anchors(page).filter(a=>/\bclass="[^"]*\bsocial-link\b/.test(a.attributes));
    assert(social.length,'Confirmed Instagram should be visible');
    for(const link of social)assert.equal(link.href,'https://www.instagram.com/artenergydr/','Do not publish unconfirmed social accounts');
  }
  console.log(`SPA ${lang}: approved content, photos, contact actions, localized links and integrations PASS`);
}

const priced=serviceOfferSection('en',{id:'tariff-test',title:'Test',paragraphs:[],image:'covered',caption:captions.en[0],price:'CONFIRMED_PRICE',detail:'CONFIRMED_DURATION',cta:'Test',kind:'spa-treatment',name:'Test'});
assert(priced.includes('<p class="spa-service-price">CONFIRMED_PRICE</p>'));
assert(priced.includes('<p class="spa-service-rate-details">CONFIRMED_DURATION</p>'),'The shared renderer must accept future confirmed data without markup edits');
assert.equal(socials.instagram,'https://www.instagram.com/artenergydr/');
for(const key of ['tiktok','youtube','telegram','facebook'])assert.equal(socials[key],null,'Unconfirmed accounts stay disabled');
assert(!/href="(?:|#|null|undefined|javascript:[^"]*)"/.test(socialLinks('ru')));
console.log('SPA tariff availability and disabled social-account guards PASS');
