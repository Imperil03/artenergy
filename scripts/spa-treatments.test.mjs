import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {spaProceduresPage} from '../src/spa-procedures-page.mjs';
import {spaPage} from '../src/spa-page.mjs';
import {lodgingPage} from '../src/lodging-page.mjs';
import {sectionPage} from '../src/section-pages.mjs';
import {homePage,contactsPage} from '../src/templates.mjs';
import {assets,pathFor,origin} from '../src/model.mjs';
import {socials} from '../src/socials.mjs';
import {socialLinks} from '../src/social-links.mjs';

const decode=value=>value.replace(/&(?:amp|quot|#39|lt|gt);/g,entity=>({'&amp;':'&','&quot;':'"','&#39;':"'",'&lt;':'<','&gt;':'>'}[entity]));
const text=html=>decode(html.replace(/<[^>]+>/g,'')).trim();
const main=html=>html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1]??assert.fail('Missing main');
const footer=html=>html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)?.[1]??assert.fail('Missing footer');
const section=(html,id)=>html.match(new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)<\\/section>`))?.[1]??assert.fail('Missing section '+id);
const paragraphs=html=>[...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(match=>text(match[1]));
const anchors=html=>[...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([,attributes,body])=>({attributes,href:decode(attributes.match(/\bhref="([^"]*)"/)?.[1]??''),label:text(body)}));
const whatsapp=html=>anchors(html).filter(a=>a.href.startsWith('https://wa.me/')).map(a=>{
 const url=new URL(a.href);assert.equal(url.pathname,'/18297715555');
 const message=url.searchParams.get('text');assert(message,'WhatsApp message must not be empty');
 return {...a,message};
});
const hasLink=(html,href)=>assert(anchors(html).some(a=>a.href===href),'Missing link '+href);

// Literal approved revision: no dependency on an external attachment or the renderer's copy object.
const approvedRu={
  "heading": "SPA и массаж в Пунта-Кане",
  "intro": "В ArtEnergy в районе Баваро можно записаться на массаж, пилинг тела или пропарку. Выберите отдельную процедуру или совместите несколько услуг с посещением бани и хаммама. Мы заранее согласуем программу, продолжительность и время вашего визита.",
  "priceHeading": "SPA-процедуры и цены",
  "priceColumns": [
    "Процедура",
    "Описание",
    "Стоимость"
  ],
  "priceRows": [
    [
      "Массаж",
      "Работа с мышцами и мягкими тканями тела",
      "2 500 DOP"
    ],
    [
      "Пилинг тела",
      "Очищение кожи с помощью отшелушивающих средств",
      "1 500 DOP"
    ],
    [
      "Пропарка",
      "Банная процедура с прогревом и паром",
      "2 000 DOP"
    ]
  ],
  "priceNote": "Продолжительность и условия каждой процедуры согласуются при записи. Баня, хаммам и дополнительные услуги оплачиваются отдельно.",
  "options": {
    "massage": {
      "heading": "Массаж",
      "paragraphs": [
        "Во время массажа специалист работает с мышцами и мягкими тканями тела. Перед сеансом можно обсудить, каким зонам уделить больше внимания и какую интенсивность воздействия вы предпочитаете.",
        "Доступные техники и продолжительность сеанса согласуются при записи."
      ],
      "cta": "Записаться на массаж"
    },
    "body-peeling": {
      "heading": "Пилинг тела",
      "paragraphs": [
        "Пилинг помогает удалить ороговевшие клетки с поверхности кожи. Во время процедуры используют отшелушивающий состав, которым обрабатывают кожу, после чего средство удаляют.",
        "Конкретный вид пилинга, состав средства и участки обработки подбираются с учётом особенностей кожи."
      ],
      "cta": "Записаться на пилинг"
    },
    "steam-treatment": {
      "heading": "Пропарка",
      "paragraphs": [
        "Пропарка — отдельная банная процедура, во время которой тело прогревают в парной с использованием пара. В отличие от обычного самостоятельного посещения сауны, здесь предусмотрена дополнительная процедура прогрева.",
        "Пропарку можно заказать вместе с баней. Продолжительность, порядок проведения и необходимые принадлежности согласуются до посещения."
      ],
      "cta": "Заказать пропарку"
    }
  },
  "restHeading": "Дополните SPA отдыхом в ArtEnergy",
  "restIntro": "На территории ArtEnergy есть баня с деревянной парной, хаммам, два бассейна и крытые зоны отдыха. Вы можете запланировать SPA-процедуры вместе с другими услугами комплекса.",
  "rest": {
    "bath": {
      "heading": "Баня и хаммам",
      "body": "Выберите традиционную парную с деревянными полками или хаммам с влажным паром. Посещение бронируется отдельно, а SPA-процедуры можно согласовать на ту же дату.",
      "link": "Баня и хаммам — условия и цены"
    },
    "pool": {
      "heading": "Бассейны и зоны отдыха",
      "body": "После процедур можно провести время на территории ArtEnergy, отдохнуть у бассейна или заказать еду и напитки из меню. Условия доступа к бассейнам и другим зонам согласуются при бронировании.",
      "link": "Посмотреть площадку"
    }
  },
  "bookingHeading": "Как записаться на SPA-процедуры",
  "bookingBody": "Напишите нам в WhatsApp, укажите, какие процедуры вас интересуют, желаемую дату и количество гостей. Мы уточним доступное время, состав услуг и общую стоимость.",
  "bookingCta": "Записаться в SPA"
};
const metadataRu={title:'Массаж и SPA-процедуры в Пунта-Кане (Баваро) | ArtEnergy',description:'Массаж, пилинг тела и пропарка в ArtEnergy, Баваро, Пунта-Кана. SPA-процедуры, возможность совместить их с баней и хаммамом, запись через WhatsApp.'};
const routes={ru:'/spa-procedury/',en:'/en/spa-treatments/',es:'/es/tratamientos-spa/'};
const ids=['massage','body-peeling','steam-treatment'];
const titles={ru:['Массаж','Пилинг тела','Пропарка'],en:['Massage','Body peeling','Steam treatment'],es:['Masaje','Exfoliación corporal','Sesión de vapor']};
const captions={ru:['Массаж спины','Пилинг тела','Парная с деревянными полками'],en:['Back massage','Body peeling','Steam room with wooden benches'],es:['Masaje de espalda','Exfoliación corporal','Sauna con bancos de madera']};
const data=JSON.parse(readFileSync(new URL('../src/content/spa-procedures.json',import.meta.url),'utf8'));
assert.deepEqual(data.services.map(s=>s.id),ids);
assert.deepEqual(data.services.map(s=>s.image),['spa_massage','spa_peeling','sauna']);
assert.equal(data.heroImage,'spa_treatment_hero');
assert.deepEqual(data.services.map(s=>s.price),approvedRu.priceRows.map(row=>row[2]));
assert(data.services.every(s=>s.duration===null),'No invented session duration');

for(const lang of ['ru','en','es']){
 const html=spaProceduresPage(lang),body=main(html),messages=[];
 assert.equal(pathFor('spa-treatments',lang),routes[lang]);
 assert(html.includes(`<link rel="canonical" href="${origin+routes[lang]}">`));
 for(const [locale,route] of Object.entries(routes))assert(html.includes(`<link rel="alternate" hreflang="${locale}" href="${origin+route}">`));
 assert.equal((body.match(/<h1\b/g)||[]).length,1);
 assert.equal((body.match(/<h2\b/g)||[]).length,6);
 assert.equal((body.match(/<h3\b/g)||[]).length,2);
 assert.equal(paragraphs(body).length,12,'No unsolicited copy or duration paragraphs');
 assert(!/<(?:form|details)\b|FAQPage|class="spa-service-rate-details"/i.test(body));
 const hero=body.match(/<header class="spa-treatments-hero">([\s\S]*?)<\/header>/)?.[1];
 assert(hero,'Missing compact hero');assert.equal(whatsapp(hero).length,0,'Hero must not hide quick price access behind a CTA');
 assert(hero.includes(`src="${assets[data.heroImage].src}"`));
 assert.equal((body.match(/fetchpriority="high"/g)||[]).length,1,'Only the first-screen image is high priority');
 const table=body.match(/<table\b[^>]*>([\s\S]*?)<\/table>/)?.[1];assert(table,'Missing accessible tariff table');
 const rows=[...table.match(/<tbody>([\s\S]*?)<\/tbody>/)[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(row=>[...row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/g)].map(cell=>text(cell[1])));
 assert.equal(rows.length,3);
 assert.deepEqual(rows.map(row=>row[0]),titles[lang]);
 assert.deepEqual(rows.map(row=>row[2]),data.services.map(s=>s.price));
 assert(body.indexOf('spa-treatments-pricing')<body.indexOf('id="massage"'),'Prices must precede the long service descriptions');
 for(const [index,id] of ids.entries()){
  const offer=section(body,id),asset=assets[data.services[index].image];
  assert.equal(text(offer.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)[1]),titles[lang][index]);
  assert(offer.indexOf('<img ')<offer.indexOf('<h2'),'Mobile source order puts the photograph before its description');
  assert(offer.includes('loading="lazy"'),'Below-price detail photos must remain lazy');
  assert(offer.includes(`data-caption="${captions[lang][index]}"`));assert(offer.includes(`alt="${captions[lang][index]}"`));
  assert(offer.includes(`src="${asset.src}"`));assert(existsSync(new URL('../public'+asset.src,import.meta.url)));
  assert(!text(offer).includes('DOP'),'Do not repeat the tariff table in every description');
  const [link,...extra]=whatsapp(offer);assert(link&&!extra.length);
  assert(link.message.includes(titles[lang][index]));assert(link.message.includes('ArtEnergy'));messages.push(link.message);
  if(lang==='ru'){assert.deepEqual(paragraphs(offer),approvedRu.options[id].paragraphs);assert.equal(link.label,approvedRu.options[id].cta);}
 }
 assert.equal(new Set(messages).size,3);
 const actions=whatsapp(body);assert.equal(actions.length,4);const booking=actions.at(-1);
 assert(/spa/i.test(booking.message));
 for(const field of {ru:['Дата:','Количество гостей:'],en:['Date:','Number of guests:'],es:['Fecha:','Número de personas:']}[lang])assert(booking.message.includes(field));
 for(const title of titles[lang])assert(!booking.message.includes(title));
 hasLink(body,pathFor('spa',lang));hasLink(body,pathFor('venue',lang));
 if(lang==='ru'){
  assert.equal(text(html.match(/<title>([\s\S]*?)<\/title>/)[1]),metadataRu.title);
  assert.equal(decode(html.match(/<meta name="description" content="([^"]*)">/)[1]),metadataRu.description);
  assert.equal(text(body.match(/<h1>([\s\S]*?)<\/h1>/)[1]),approvedRu.heading);
  assert.equal(paragraphs(hero)[0],approvedRu.intro);
  assert.deepEqual(rows,approvedRu.priceRows);
  assert.deepEqual([...table.matchAll(/<th scope="col">([\s\S]*?)<\/th>/g)].map(m=>text(m[1])),approvedRu.priceColumns);
  assert.deepEqual([...body.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map(m=>text(m[1])),[approvedRu.priceHeading,...titles.ru,approvedRu.restHeading,approvedRu.bookingHeading]);
  const allParagraphs=paragraphs(body);
  for(const exact of [approvedRu.priceNote,approvedRu.restIntro,...Object.values(approvedRu.rest).map(item=>item.body),approvedRu.bookingBody])assert(allParagraphs.includes(exact));
  assert.deepEqual([...body.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)].map(m=>text(m[1])),Object.values(approvedRu.rest).map(item=>item.heading));
  for(const item of Object.values(approvedRu.rest))assert(anchors(body).some(a=>a.label===item.link));
  assert.equal(booking.label,approvedRu.bookingCta);
 }
 const home=homePage(lang),bath=section(main(home),'bath');
 assert.equal((bath.match(/class="spa-card"/g)||[]).length,2);
 for(const fragment of ['#banya','#hammam'])hasLink(bath,pathFor('spa',lang)+fragment);
 hasLink(bath,routes[lang]);
 if(lang==='ru')for(const exact of ['Массаж и SPA-процедуры','В ArtEnergy можно записаться на массаж, пилинг тела и пропарку. Процедуры доступны по предварительному согласованию.','Посмотреть SPA-процедуры'])assert(text(bath).includes(exact));
 const related=[spaPage(lang),lodgingPage(lang),sectionPage('venue',lang)];for(const page of related)hasLink(main(page),routes[lang]);
 for(const page of [html,home,...related,contactsPage(lang)]){
  hasLink(footer(page),routes[lang]);
  assert(!/(?:более|больше) шести/i.test(text(main(page))));
  const social=anchors(page).filter(a=>/\bclass="[^"]*\bsocial-link\b/.test(a.attributes));assert(social.length);
  for(const link of social)assert.equal(link.href,'https://www.instagram.com/artenergydr/');
 }
 console.log(`SPA ${lang}: supplied tariffs, approved copy, composition, photographs, WhatsApp and links PASS`);
}
assert.equal(socials.instagram,'https://www.instagram.com/artenergydr/');
for(const key of ['tiktok','youtube','telegram','facebook'])assert.equal(socials[key],null);
assert(!/href="(?:|#|null|undefined|javascript:[^"]*)"/.test(socialLinks('ru')));
console.log('SPA supplied tariffs and content checks PASS');
