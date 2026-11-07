import {readFileSync} from 'node:fs';
import {translate, ui, spaPageCopy} from './translations.mjs';
import {socials} from './socials.mjs';

const read = name => JSON.parse(readFileSync(new URL(`./content/${name}`,import.meta.url),'utf8'));
export const copy = read('copy.json');
export const menu = read('menu-catalog.json').categories;
export const assets = read('asset-manifest.json');
export const gallery = read('gallery-catalog.json');
export const locales=['ru','en','es'];
export {origin} from './deployment.mjs';
export const contact={
  phone:'+1 829 771 5555',whatsapp:'https://wa.me/18297715555',email:'Arteenergy501@gmail.com',instagram:socials.instagram,
  address:'Calle Kiev 35, Bávaro, Punta Cana, Dominican Republic',
  map:'https://www.google.com/maps/dir/?api=1&destination=Calle+Kiev+35,+Punta+Cana,+Dominican+Republic',
  mapSearch:'https://www.google.com/maps/search/?api=1&query=Calle+Kiev+35%2C+B%C3%A1varo%2C+Punta+Cana%2C+Dominican+Republic',
  mapEmbed:'https://www.google.com/maps?q=Calle%20Kiev%2035%2C%20Punta%20Cana%2C%20Dominican%20Republic&output=embed',
};
export {translate,ui};

const eventSlugs={
  ru:{0:'den-rozhdeniya',1:'detskiy-prazdnik',2:'svadba',3:'yubiley',4:'korporativ',6:'vecherinka'},
  en:{0:'birthday',1:'kids-party',2:'wedding',3:'milestone-birthday',4:'team-gathering',6:'party-with-friends'},
  es:{0:'cumpleanos',1:'fiesta-infantil',2:'boda',3:'cumpleanos-especial',4:'evento-empresa',6:'fiesta-amigos'},
};
export const events=copy.events.tiles.map(([name,image],i)=>({key:`event-${i}`,name,image,index:i,summary:copy.events.summaries[i]})).filter(event=>copy.events.home_groups.some(group=>group.eventKey===event.key));
export const rooms=copy.stay.choices.map((room,i)=>({...room,key:`room-${i}`,index:i}));
export const spaServices=copy.bath.services.map((service,i)=>({...service,key:`spa-${i}`,index:i}));

export function pathFor(key='home',locale='ru') {
  const prefix=locale==='ru'?'':`/${locale}`;
  if(key==='home') return prefix+'/';
  if(key==='venue')return prefix+({ru:'/ploshchadka/',en:'/venue/',es:'/espacio/'}[locale]);
  if(key==='events')return prefix+({ru:'/sobytiya/',en:'/events/',es:'/eventos/'}[locale]);
  if(key==='stay')return prefix+({ru:'/prozhivanie/',en:'/stays/',es:'/alojamiento/'}[locale]);
  if(key==='menu') return prefix+'/menu/';
  if(key==='contacts') return prefix+({ru:'/kontakty/',en:'/contact/',es:'/contacto/'}[locale]);
  if(key==='spa')return prefix+'/spa/';
  if(key==='spa-treatments')return prefix+({ru:'/spa-procedury/',en:'/spa-treatments/',es:'/tratamientos-spa/'}[locale]);
  if(key.startsWith('spa-')) {
    return prefix+'/spa/#'+(['banya','hammam'][Number(key.slice(4))]);
  }
  if(key.startsWith('event-')) {
    const i=Number(key.slice(6));
    if(!eventSlugs[locale][i])throw new Error('Unknown event: '+key);
    return prefix+({ru:'/sobytiya/',en:'/events/',es:'/eventos/'}[locale])+eventSlugs[locale][i]+'/';
  }
  if(key.startsWith('room-')) {
    const i=Number(key.slice(5));
    return pathFor('stay',locale)+'#'+['bungalow','apartments'][i];
  }
  return prefix+'/404.html';
}

export function legacySpaPath(index,locale='ru'){
  return (locale==='ru'?'':`/${locale}`)+'/spa/'+({ru:['banya','hammam'],en:['sauna','hammam'],es:['sauna','hammam']}[locale][index])+'/';
}

export function whatsapp(locale='ru',kind='general',name='') {
  const u=ui[locale];
  const treatment={ru:'Здравствуйте! Хочу записаться на процедуру в ArtEnergy: ',en:'Hello! I would like to book a treatment at ArtEnergy: ',es:'¡Hola! Quisiera reservar un tratamiento en ArtEnergy: '}[locale];
  const treatments={ru:'Здравствуйте! Хочу записаться на SPA-процедуры в ArtEnergy.\nПроцедуры: \nДата: \nКоличество гостей: ',en:'Hello! I would like to book SPA treatments at ArtEnergy.\nTreatments: \nDate: \nNumber of guests: ',es:'¡Hola! Quisiera reservar tratamientos de spa en ArtEnergy.\nTratamientos: \nFecha: \nNúmero de personas: '}[locale];
  const message=kind==='spa-treatment'?treatment+name:kind==='spa-treatments'?treatments:kind==='spa-service'?spaPageCopy[locale].waService+translate(name,locale):kind==='bath'?u.waBath:kind==='event'?u.waEvent+translate(name,locale):kind==='room'?u.waStay+translate(name,locale):kind==='menu'?u.waMenu:kind==='organizers'?u.waOrg:kind==='visit'?u.waVisit:u.waHello;
  return contact.whatsapp+'?text='+encodeURIComponent(message);
}

const altText={
  spa_treatment_hero:['Принадлежности для SPA','SPA accessories','Accesorios de spa'],
  spa_massage:['Массаж спины','Back massage','Masaje de espalda'],
  spa_peeling:['Пилинг тела','Body peeling','Exfoliación corporal'],
  organizers_yoga:['Практика йоги у бассейна','Yoga practice by the pool','Práctica de yoga junto a la piscina'],
  organizers_meditation:['Группа на практике медитации у бассейна','A group meditating by the pool','Un grupo meditando junto a la piscina'],
  organizers_aqua:['Групповое занятие в бассейне','A group activity in the pool','Una actividad en grupo en la piscina'],
  hero:['Бассейн и постройки ArtEnergy','Pool and buildings at ArtEnergy','Piscina y construcciones de ArtEnergy'],
  hero_mobile:['Бассейн и пальмы ArtEnergy','Pool and palm trees at ArtEnergy','Piscina y palmeras de ArtEnergy'],
  pool:['Бассейны и деревянная дорожка','Pools and wooden walkway','Piscinas y camino de madera'],
  covered:['Крытая зона с диванами','Covered lounge with sofas','Zona cubierta con sofás'],
  grounds:['Дорожка и зелень на территории','Path and greenery on the grounds','Camino y vegetación del espacio'],
  events:['Общий вид территории вечером','Evening view of the venue','Vista del espacio al atardecer'],
  bar:['Бар ArtEnergy','ArtEnergy bar','Bar de ArtEnergy'],
  grill:['Шашлык на мангале','Skewers on the grill','Brochetas a la parrilla'],
  drink:['Напитки у бассейна','Drinks by the pool','Bebidas junto a la piscina'],
  bungalow:['Спальное место в открытом бунгало','Sleeping area in the open-air bungalow','Zona de descanso en el bungaló abierto'],
  apartment:['Интерьер апартаментов','Apartment interior','Interior del apartamento'],
  organizers:['Крытое пространство с креслами и столами','Covered space with armchairs and tables','Espacio cubierto con sillones y mesas'],
  contact:['Крытая зона у бассейна вечером','Covered poolside lounge in the evening','Zona cubierta junto a la piscina por la noche'],
  overview_day:['Общий вид ArtEnergy днём','Daytime view of ArtEnergy','Vista de ArtEnergy de día'],
  sauna:['Парная с деревянными полками','Steam room with wooden benches','Sauna con bancos de madera'],
  hammam:['Хаммам ArtEnergy с мозаичным потолком','ArtEnergy hammam with a mosaic ceiling','Hammam de ArtEnergy con techo de mosaico'],
  terrace_night:['Вечерний вид с террасы','Evening view from the terrace','Vista nocturna desde la terraza'],
  lawn:['Лужайка и места для отдыха','Lawn and lounge areas','Césped y zonas de descanso'],
  cabana:['Крытая зона с вечерним освещением','Covered lounge with evening lighting','Zona cubierta con iluminación nocturna'],
  bar_hall:['Бар и крытое помещение','Bar and covered room','Bar y sala cubierta'],
  pool_night:['Бассейн вечером','Pool in the evening','Piscina por la noche'],
};
export function altFor(key,locale='ru') {
  if(key.startsWith('occasion_')) {
    const event=events.find(item=>item.image===key);
    return translate('Иллюстрация',locale)+': '+translate(event?.name||'',locale);
  }
  if(key==='hammam_illustration')return translate('Иллюстрация хаммама',locale);
  if(key==='kitchen_table')return translate('Иллюстрация блюд: шашлык и салат',locale);
  if(key==='kitchen_dumplings')return translate('Иллюстрация блюда: пельмени',locale);
  if(altText[key]) return altText[key][locales.indexOf(locale)];
  const extra=key.match(/^gallery-extra-(\d+)$/);
  return extra?translate(gallery.expand_in_place[Number(extra[1])-1][1],locale):'ArtEnergy';
}
