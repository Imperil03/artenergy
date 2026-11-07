import assert from 'node:assert/strict';
import {events,pathFor} from '../src/model.mjs';
import {homePage,contactsPage} from '../src/templates.mjs';
import {birthdayPage} from '../src/birthday-page.mjs';
import {childrenPartyPage} from '../src/children-page.mjs';
import {editorialEventPage} from '../src/event-editorial-pages.mjs';
import {sectionPage} from '../src/section-pages.mjs';

// Literal client copy protects the agreed text independently of the render data.
const programmes={
  "event-0": {
    "title": "Как провести день рождения в ArtEnergy",
    "paragraphs": [
      "На день рождения можно приехать днём, отдохнуть у бассейна, а затем собраться за праздничным столом. Формат встречи выбираете сами — от спокойного обеда с близкими до вечеринки с друзьями.",
      "Если хотите украсить место проведения, включить свою музыку или пригласить фотографа и ведущего, согласуйте эти детали заранее."
    ]
  },
  "event-1": {
    "title": "Как организовать детский праздник",
    "paragraphs": [
      "Для дня рождения ребёнка можно подготовить игры, поздравления и развлечения с учётом возраста гостей. Если планируете пригласить аниматора или оформить площадку в определённой тематике, заранее согласуйте возможность проведения такой программы.",
      "Дети должны постоянно находиться под присмотром взрослых. Прыжки и ныряние в бассейны запрещены."
    ]
  },
  "event-2": {
    "title": "Как организовать свадебное торжество",
    "paragraphs": [
      "В ArtEnergy можно устроить свадебный ужин, провести время с гостями и сделать фотографии на территории среди пальм. Для праздника подойдёт как небольшая встреча с близкими, так и мероприятие с собственной программой.",
      "Если вы планируете провести здесь свадебную церемонию, заранее обсудите возможность её организации, оформление площадки и работу приглашённых специалистов."
    ]
  },
  "event-3": {
    "title": "Праздничный ужин и поздравления",
    "paragraphs": [
      "Юбилей можно отметить за семейным обедом или устроить вечерний праздник с друзьями. Соберите близких за одним столом, подготовьте поздравления и проведите время вместе.",
      "Если планируете ведущего, музыкальную программу или оформление, согласуйте необходимые условия заранее."
    ]
  },
  "event-4": {
    "title": "Встреча команды и собственная программа",
    "paragraphs": [
      "Корпоратив можно провести как неформальную встречу с общим ужином или дополнить собственной программой: командными играми, конкурсами, выступлениями и награждением сотрудников.",
      "Если для мероприятия нужны микрофоны, колонки или другое оборудование, заранее уточните возможность их использования на площадке. Ведущих, диджеев и других специалистов можно пригласить по предварительному согласованию."
    ]
  },
  "event-6": {
    "title": "Вечер с друзьями в ArtEnergy",
    "paragraphs": [
      "Для встречи с друзьями необязательно готовить праздничную программу. Можно собраться за ужином, заказать напитки и провести вечер у бассейна.",
      "Если планируете танцы, собственный плейлист или выступление диджея, заранее согласуйте музыкальную программу и условия её проведения."
    ]
  }
};
const cards={
  "apartment": "Апартаменты для ночёвки или нескольких дней. Фотографии и условия размещения.",
  "event-1": "Детский день рождения с отдельным меню, праздничным тортом и возможностью провести свою программу.",
  "event-2": "Крытые зоны отдыха, кухня и бар для свадебного ужина или встречи с близкими.",
  "event-6": "Встреча с друзьями у бассейна, ужин или вечеринка со своей программой."
};

const text=value=>value.replace(/<[^>]*>/g,'').replaceAll('&amp;','&').replace(/\s+/g,' ').trim();
const block=(html,name)=>html.match(new RegExp('<section class="[^\"]*'+name+'[^\"]*"[^>]*>[\\s\\S]*?<\\/section>'))?.[0]||assert.fail('Missing section '+name);
const main=html=>html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
assert.deepEqual(events.map(event=>event.key),Object.keys(programmes));
for(const key of ['event-5','event-7'])for(const lang of ['ru','en','es'])assert.throws(()=>pathFor(key,lang),/Unknown event/);
for(const [key,copy] of Object.entries(programmes)){
  const html=key==='event-0'?birthdayPage('ru'):key==='event-1'?childrenPartyPage('ru'):editorialEventPage(key,'ru');
  const plan=block(html,'birthday-feature--plan');
  assert.equal(text(plan.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)[1]),copy.title);
  assert.deepEqual([...plan.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(match=>text(match[1])),copy.paragraphs);
}
for(const copy of Object.values(cards))assert(homePage('ru').includes(copy),'Home card: '+copy);
const expectedValues={ru:['≈ 1 700 м²','2 бассейна','8 апартаментов','3 бунгало'],en:['≈ 1 700 m²','2 pools','8 apartments','3 bungalows'],es:['≈ 1 700 m²','2 piscinas','8 apartamentos','3 bungalows']};
for(const lang of ['ru','en','es']){
  const venue=sectionPage('venue',lang),body=main(venue);
  const facts=body.match(/<dl class="venue-facts">[\s\S]*?<\/dl>/)?.[0]||assert.fail('Missing venue inventory');
  assert.deepEqual([...facts.matchAll(/<dd>([\s\S]*?)<\/dd>/g)].map(match=>text(match[1])),expectedValues[lang]);
  assert(!/свобод|available|disponible/i.test(text(facts)),'Inventory must not claim current availability');
  assert(body.indexOf('class="gallery-heading"')<body.indexOf('class="venue-facts"'));
  assert(body.indexOf('class="venue-facts"')<body.indexOf('class="venue-mosaic"'));
  const images=[...body.matchAll(/<img[^>]*>/g)].map(match=>match[0]).slice(0,16);
  assert.equal(images.length,16);
  assert(images[0].includes('loading="eager"')&&images[0].includes('fetchpriority="high"'));
  assert(images.slice(1).every(image=>image.includes('loading="lazy"')&&!image.includes('fetchpriority="high"')));
  if(lang==='ru'){
    assert(block(homePage(lang),'visit-section').includes('ArtEnergy работает круглосуточно по предварительному бронированию.'));
    assert(main(contactsPage(lang)).includes('Режим работы: круглосуточно, по предварительной записи.'));
  }
}
console.log('PASS: six supplied event programmes, four home cards, lazy gallery, venue inventory, visiting hours and retired route guards.');
