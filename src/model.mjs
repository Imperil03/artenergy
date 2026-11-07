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
  ru:['den-rozhdeniya','detskiy-prazdnik','svadba','yubiley','korporativ','semeynaya-vstrecha','vecherinka','tematicheskaya-vecherinka'],
  en:['birthday','kids-party','wedding','milestone-birthday','team-gathering','family-gathering','party-with-friends','themed-party'],
  es:['cumpleanos','fiesta-infantil','boda','cumpleanos-especial','evento-empresa','reunion-familiar','fiesta-amigos','fiesta-tematica'],
};
export const events=copy.events.tiles.map(([name,image],i)=>({key:`event-${i}`,name,image,index:i,summary:copy.events.summaries[i]}));
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
  const treatment={ru:'Здравствуйте! Хочу уточнить процедуру в ArtEnergy: ',en:'Hello! I would like to ask about a treatment at ArtEnergy: ',es:'¡Hola! Quisiera consultar un tratamiento en ArtEnergy: '}[locale];
  const treatments={ru:'Здравствуйте! Хочу записаться на SPA-процедуру в ArtEnergy. Процедура: Дата: Время: ',en:'Hello! I would like to book a SPA treatment at ArtEnergy. Treatment: Date: Time: ',es:'¡Hola! Quisiera reservar un tratamiento de spa en ArtEnergy. Tratamiento: Fecha: Hora: '}[locale];
  const message=kind==='spa-treatment'?treatment+name:kind==='spa-treatments'?treatments:kind==='spa-service'?spaPageCopy[locale].waService+translate(name,locale):kind==='bath'?u.waBath:kind==='event'?u.waEvent+translate(name,locale):kind==='room'?u.waStay+translate(name,locale):kind==='menu'?u.waMenu:kind==='organizers'?u.waOrg:kind==='visit'?u.waVisit:u.waHello;
  return contact.whatsapp+'?text='+encodeURIComponent(message);
}

export const eventText={
  ru:[
    {title:'День рождения в ArtEnergy',description:'Бассейны, крытые зоны отдыха, кухня и бар для вашего дня рождения в Баваро.',body:'Соберите гостей в ArtEnergy и проведите праздник по своему сценарию. На территории есть бассейны, крытые зоны отдыха, кухня и бар.',highlights:['cakeRule','musicRule'],gallery:['events','covered','bar']},
    {title:'Детский праздник в ArtEnergy',description:'Площадка для детского праздника в Баваро: зоны отдыха, детское меню и торты на заказ.',body:'День рождения или встреча семей с детьми на территории ArtEnergy. Есть детское меню, а торт можно заказать заранее.',highlights:['childrenRule','cakeRule'],gallery:['lawn','covered','grounds']},
    {title:'Свадьба в ArtEnergy',description:'Площадка для свадебной встречи в Пунта-Кане. Фотографии пространства, питание и условия.',body:'Соберите гостей на свадебную встречу в ArtEnergy. Вы выбираете свой формат праздника; условия использования пространства согласуются отдельно.',highlights:['weddingCake','musicRule'],gallery:['cabana','events','bar']},
    {title:'Юбилей в ArtEnergy',description:'Площадка для юбилея с семьёй и друзьями в Баваро. Кухня, крытые зоны и бассейны.',body:'Проведите юбилей с семьёй и друзьями на территории ArtEnergy. Крытые зоны отдыха, кухня и бар доступны для обсуждения вашего формата.',highlights:['cakeRule','musicRule'],gallery:['organizers','covered','events']},
    {title:'Корпоратив в ArtEnergy',description:'Площадка для встречи команды в Баваро: бассейны, крытые зоны, кухня и бар.',body:'Встреча команды вне офиса: отдых у бассейнов, общение в крытых зонах и еда по меню. Для собственной программы можно обсудить пространство с администратором.',highlights:['programRule','musicRule'],gallery:['bar_hall','organizers','grounds']},
    {title:'Семейная встреча в ArtEnergy',description:'Место для семейной встречи в Баваро. Зоны отдыха, бассейны и меню для взрослых и детей.',body:'Соберитесь с семьёй в крытой зоне или у бассейнов ArtEnergy. В меню есть блюда для взрослых и детей; проживание можно обсудить отдельно.',highlights:['childrenRule','cakeRule'],gallery:['covered','grounds','bar']},
    {title:'Вечеринка с друзьями в ArtEnergy',description:'Площадка для встречи друзей в Пунта-Кане. Бассейны, бар и согласование своего плейлиста.',body:'Проведите время с друзьями у бассейнов и в зонах отдыха ArtEnergy. Еда и напитки — по меню; свой плейлист нужно согласовать с администратором.',highlights:['musicRule','roomFood'],gallery:['pool_night','drink','terrace_night']},
    {title:'Тематическая вечеринка в ArtEnergy',description:'Пространство для вечеринки по вашей теме в Баваро. Условия площадки и прямой WhatsApp.',body:'Проведите встречу по собственной теме и программе. ArtEnergy предоставляет пространство, кухню и бар; условия конкретного события обсуждаются отдельно.',highlights:['programRule','musicRule'],gallery:['pool_night','cabana','bar_hall']},
  ],
  en:[
    {title:'Celebrate your birthday at ArtEnergy',description:'Pools, covered lounge areas, a kitchen and bar for your birthday in Bávaro.',body:'Bring your guests to ArtEnergy and celebrate in your own way. The venue has pools, covered lounge areas, a kitchen and bar.',highlights:['cakeRule','musicRule'],gallery:['events','covered','bar']},
    {title:'A children’s party at ArtEnergy',description:'A venue for a children’s party in Bávaro, with lounge areas, a children’s menu and cakes to order.',body:'A birthday or a gathering of families with children at ArtEnergy. A children’s menu is available, and cakes can be ordered in advance.',highlights:['childrenRule','cakeRule'],gallery:['lawn','covered','grounds']},
    {title:'A wedding gathering at ArtEnergy',description:'A venue for a wedding gathering in Punta Cana. Explore the space, dining and arrangements.',body:'Gather your wedding guests at ArtEnergy. Choose your own celebration format; arrangements for using the space are agreed separately.',highlights:['weddingCake','musicRule'],gallery:['cabana','events','bar']},
    {title:'A milestone birthday at ArtEnergy',description:'A venue for a milestone birthday with family and friends in Bávaro. Dining, covered areas and pools.',body:'Celebrate a milestone birthday with family and friends at ArtEnergy. Discuss how the covered lounge areas, kitchen and bar can fit your gathering.',highlights:['cakeRule','musicRule'],gallery:['organizers','covered','events']},
    {title:'A team gathering at ArtEnergy',description:'A venue for your team in Bávaro: pools, covered areas, a kitchen and bar.',body:'Meet away from the office, spend time by the pools or in the covered lounges, and order from the menu. Discuss space for your own program with the administrator.',highlights:['programRule','musicRule'],gallery:['bar_hall','organizers','grounds']},
    {title:'A family gathering at ArtEnergy',description:'A place to meet family in Bávaro. Lounge areas, pools and food for adults and children.',body:'Get together with your family in the covered lounge or by the ArtEnergy pools. The menu includes food for adults and children; accommodation can be arranged separately.',highlights:['childrenRule','cakeRule'],gallery:['covered','grounds','bar']},
    {title:'A party with friends at ArtEnergy',description:'A place to meet friends in Punta Cana, with pools, a bar and the option to agree your own playlist.',body:'Spend time with friends by the pools and in the ArtEnergy lounges. Food and drinks are available from the menu; please agree your playlist with the administrator.',highlights:['musicRule','roomFood'],gallery:['pool_night','drink','terrace_night']},
    {title:'A themed party at ArtEnergy',description:'Space for your own themed gathering in Bávaro. Venue arrangements and direct WhatsApp contact.',body:'Bring your own theme and program. ArtEnergy provides the space, kitchen and bar; arrangements for your event are discussed separately.',highlights:['programRule','musicRule'],gallery:['pool_night','cabana','bar_hall']},
  ],
  es:[
    {title:'Celebra tu cumpleaños en ArtEnergy',description:'Piscinas, zonas cubiertas, cocina y bar para tu cumpleaños en Bávaro.',body:'Reúne a tus invitados en ArtEnergy y celebra a tu manera. El espacio cuenta con piscinas, zonas de descanso cubiertas, cocina y bar.',highlights:['cakeRule','musicRule'],gallery:['events','covered','bar']},
    {title:'Fiesta infantil en ArtEnergy',description:'Un espacio para fiestas infantiles en Bávaro, con zonas de descanso, menú infantil y tartas por encargo.',body:'Un cumpleaños o un encuentro de familias con niños en ArtEnergy. Hay menú infantil y puedes encargar una tarta con antelación.',highlights:['childrenRule','cakeRule'],gallery:['lawn','covered','grounds']},
    {title:'Celebra tu boda en ArtEnergy',description:'Un espacio para reunir a los invitados de tu boda en Punta Cana. Fotos, comida y condiciones.',body:'Reúne a los invitados de tu boda en ArtEnergy. Tú eliges el formato de la celebración; las condiciones de uso del espacio se acuerdan por separado.',highlights:['weddingCake','musicRule'],gallery:['cabana','events','bar']},
    {title:'Un cumpleaños especial en ArtEnergy',description:'Un espacio para celebrar con familiares y amigos en Bávaro. Comida, zonas cubiertas y piscinas.',body:'Celebra un cumpleaños especial con familiares y amigos en ArtEnergy. Consulta cómo las zonas cubiertas, la cocina y el bar pueden adaptarse a tu encuentro.',highlights:['cakeRule','musicRule'],gallery:['organizers','covered','events']},
    {title:'Encuentro de empresa en ArtEnergy',description:'Un espacio para tu equipo en Bávaro: piscinas, zonas cubiertas, cocina y bar.',body:'Reúne a tu equipo fuera de la oficina, disfruta de las piscinas y las zonas cubiertas, y pide del menú. Consulta con la administración el espacio para tu propio programa.',highlights:['programRule','musicRule'],gallery:['bar_hall','organizers','grounds']},
    {title:'Reunión familiar en ArtEnergy',description:'Un lugar para reunirse en familia en Bávaro. Zonas de descanso, piscinas y menú para adultos y niños.',body:'Reúnete con tu familia en una zona cubierta o junto a las piscinas de ArtEnergy. Hay platos para adultos y niños; el alojamiento se acuerda por separado.',highlights:['childrenRule','cakeRule'],gallery:['covered','grounds','bar']},
    {title:'Fiesta con amigos en ArtEnergy',description:'Un espacio para reunirse con amigos en Punta Cana, con piscinas, bar y música acordada con la administración.',body:'Disfruta con amigos de las piscinas y las zonas de descanso de ArtEnergy. La comida y las bebidas se piden del menú; acuerda tu lista de música con la administración.',highlights:['musicRule','roomFood'],gallery:['pool_night','drink','terrace_night']},
    {title:'Fiesta temática en ArtEnergy',description:'Un espacio para un encuentro con tu propia temática en Bávaro. Condiciones y contacto directo por WhatsApp.',body:'Desarrolla tu propia temática y programa. ArtEnergy proporciona el espacio, la cocina y el bar; las condiciones del evento se acuerdan por separado.',highlights:['programRule','musicRule'],gallery:['pool_night','cabana','bar_hall']},
  ],
};

const altText={
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
