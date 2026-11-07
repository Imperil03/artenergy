import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {root,output} from './build.mjs';
import {pathFor} from '../src/model.mjs';
const manifest=JSON.parse(await readFile(path.join(root,'build-manifest.json'),'utf8'));
const origin=manifest.siteUrl||'https://artenergy.do';
const basePath=manifest.basePath||'';
const docs=new Map();
assert.ok(!manifest.pages.some(page=>page.key.startsWith('room-')),'No separate lodging pages or redirect aliases');
for(const page of manifest.pages){
  const file=page.path.endsWith('/')?page.path.slice(1)+'index.html':page.path.slice(1);
  docs.set(page.path,await readFile(path.join(output,file),'utf8'));
}
let links=0,images=0;
for(const page of manifest.pages){
  const html=docs.get(page.path);
  assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,`${page.path}: one H1`);
  assert.match(html,new RegExp(`<html lang="${page.lang}">`));
  assert.match(html,/<title>[^<]+<\/title>/);
  assert.ok(!/<form(?:\s|>)/i.test(html),`${page.path}: no booking forms`);
  assert.ok(!/Цены указаны в доминиканских|Нужны фотографии|Место для фото в макете|заявка отправлена|booksy\.com|fresha\.com/.test(html),`${page.path}: no old/unsupported copy`);
  assert.ok(!/C:\\Users|\.env|sourceSha|approvalText|Direction contract/.test(html),`${page.path}: no development metadata`);
  const contactPath=basePath+{ru:'/kontakty/',en:'/en/contact/',es:'/es/contacto/'}[page.lang];
  const pageHeader=html.match(/<header class="site-header[\s\S]*?<\/header>/)?.[0]||'';
  if(!page.redirectTo){
    assert.ok(pageHeader.includes(`href="${contactPath}"`),`${page.path}: contacts in site navigation`);
    const spaPath=basePath+(page.lang==='ru'?'':`/${page.lang}`)+'/spa/';
    assert.ok(pageHeader.includes(`href="${spaPath}"`),`${page.path}: direct SPA page in navigation`);
    for(const key of ['venue','events','menu','stay','spa','contacts'])assert.ok(pageHeader.includes(`href="${basePath+pathFor(key,page.lang)}"`),`${page.path}: section ${key} in header`);
    assert.ok(!/href="[^\"]*#/.test(pageHeader),`${page.path}: header links point to pages`);
    const desktopNav=pageHeader.match(/<nav class="desktop-nav"[\s\S]*?<\/nav>/)?.[0]||'';
    assert.equal((desktopNav.match(/<a /g)||[]).length,6,`${page.path}: six sections without visit item`);
  }
  if(page.lang!=='ru')assert.ok(!/[А-Яа-яЁё]/.test(html),`${page.path}: no untranslated Cyrillic`);
  if(page.key!=='404'&&!page.redirectTo){
    assert.ok(html.includes(`href="${origin}${page.path}"`),`${page.path}: canonical`);
    for(const lang of ['ru','en','es'])assert.ok(html.includes(`hreflang="${lang}"`),`${page.path}: language alternative`);
  }
  if(page.redirectTo){
    const canonical=origin+pathFor('spa',page.lang);
    assert.ok(html.includes(`rel="canonical" href="${canonical}"`),`${page.path}: alias canonical without fragment`);
    assert.ok(html.includes(`content="0;url=${basePath+page.redirectTo}"`),`${page.path}: same-site deployment-aware redirect`);
    assert.ok(html.includes('content="noindex, follow"'),`${page.path}: aliases not indexable`);
  }
  const ids=new Set();
  for(const match of html.matchAll(/\bid="([^"]+)"/g)){assert.ok(!ids.has(match[1]),`${page.path}: duplicate id ${match[1]}`);ids.add(match[1]);}
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
    const raw=match[1].replaceAll('&amp;','&');
    if(!raw.startsWith('/')&&!raw.startsWith('#'))continue;
    const url=new URL(raw,origin+page.path);
    assert.ok(!basePath||url.pathname.startsWith(basePath+'/'),`${page.path}: missing deployment prefix ${raw}`);
    const route=url.pathname.slice(basePath.length)||'/';
    links++;
    if(docs.has(route)){
      if(url.hash){const target=docs.get(route);assert.ok(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),`${page.path}: broken fragment ${raw}`);}
    }else{
      const file=path.resolve(output,'.'+decodeURIComponent(route));
      assert.ok(file.startsWith(output+path.sep));
      assert.ok((await stat(file).catch(()=>null))?.isFile(),`${page.path}: missing file ${raw}`);
    }
  }
  for(const match of html.matchAll(/<img\b[^>]*>/g)){images++;assert.match(match[0],/\balt="[^"]*"/);}
  if(page.key==='home'){
    assert.ok(!html.includes('Кухня · Напитки · Бар · Детское меню · Торты'),`${page.path}: no removed category enumeration`);
    assert.equal((html.match(/data-gallery="venue"/g)||[]).length,16);
    assert.equal((html.match(/class="event-card"/g)||[]).length,6);
    assert.equal((html.match(/class="room-card"/g)||[]).length,2);
    assert.ok(!/data-hero-video|data-video-toggle|class="wrap visit-formats"/.test(html),`${page.path}: photo hero and no format strip`);
    assert.equal((html.match(/class="photo-link mosaic-photo /g)||[]).length,4,`${page.path}: four-photo mosaic`);
    const venue=html.slice(html.indexOf('id="gallery"'),html.indexOf('id="events"'));
    assert.equal((venue.slice(0,venue.indexOf('<details')).match(/data-gallery="venue"/g)||[]).length,8,`${page.path}: eight venue photos before expansion`);
    assert.equal((venue.match(/data-gallery-toggle /g)||[]).length,1,`${page.path}: one gallery action`);
    assert.ok(venue.indexOf('data-gallery-toggle ')>venue.indexOf('</details>'),`${page.path}: gallery action below the photos`);
    assert.ok(html.includes(`<a class="hero-overview" href="${basePath}/video/overview.mp4" data-overview>`));
    const overview=html.match(/<video data-overview-video[^>]*>/)?.[0];
    assert.ok(overview&&overview.includes('controls')&&overview.includes('preload="none"')&&!/\ssrc=|autoplay|loop/.test(overview),`${page.path}: user-initiated overview with no eager video source`);
    assert.ok(!/Основной — примерно|main pool is approximately|principal mide aproximadamente/.test(html),`${page.path}: approved pool dimensions`);
    assert.ok(html.includes('id="bath"'),`${page.path}: bath section`);
    const bath=html.slice(html.indexOf('id="bath"'),html.indexOf('id="organizers"'));
    assert.ok(bath.includes('6 000 DOP')&&bath.includes('2 000 DOP'),`${page.path}: bath rates`);
    assert.ok(bath.includes({ru:'Минимальное время — 3 часа',en:'Minimum booking — 3 hours',es:'Tiempo mínimo — 3 horas'}[page.lang]),`${page.path}: minimum bath booking`);
    assert.ok(!/до 6 человек|up to 6|hasta 6|500 DOP/.test(bath),`${page.path}: no unconfirmed bath capacity or surcharge`);
    for(const value of ['500 DOP','1 000 DOP','3 000 DOP','150 USD','6 000 DOP','2 000 DOP'])assert.ok(html.includes(value));
  }
  assert.ok(!/DOP — (?:доминиканские песо|Dominican pesos|pesos dominicanos)/i.test(html),`${page.path}: no currency explanation`);
  if(page.key==='menu'){
    assert.equal((html.match(/class="dish-row"/g)||[]).length,68,`${page.path}: full menu`);
    assert.equal((html.match(/data-menu-panel=/g)||[]).length,5);
  }
  if(page.key==='venue')assert.equal((html.match(/data-gallery="venue"/g)||[]).length,16,`${page.path}: venue gallery`);
  if(page.key==='events'){
    assert.equal((html.match(/class="event-card"/g)||[]).length,6,`${page.path}: event catalog`);
    assert.equal((html.match(/<h2 class="event-card-title"/g)||[]).length,6,`${page.path}: event heading hierarchy`);
  }
  if(page.key==='stay'){
    for(const id of ['bungalow','apartments'])assert.ok(html.includes(`id="${id}"`),`${page.path}: independent accommodation section`);
    assert.equal((html.match(/class="lodging-offer(?: lodging-offer--reverse)?"/g)||[]).length,2,`${page.path}: two full accommodation sections`);
    assert.ok(html.includes('150 USD'),`${page.path}: confirmed bungalow price`);
    assert.ok(!html.includes('class="room-card"'),`${page.path}: no intermediate catalog`);
    assert.equal((html.match(/class="lodging-rest-item"/g)||[]).length,3,`${page.path}: three photographic rest blocks`);
    assert.ok(html.includes('class="lodging-scenery"')&&html.includes('class="lodging-booking"'),`${page.path}: scenery and compact booking`);
    assert.ok(!html.includes('lodging-conditions')&&!html.includes('class="faq-list"'),`${page.path}: no retired FAQ block`);
    if(page.lang==='ru'){
      assert.ok(html.includes('<title>Проживание в Пунта-Кане — бунгало и апартаменты | ArtEnergy</title>'),`${page.path}: exact requested title`);
      assert.ok(html.includes('content="Бунгало и апартаменты в ArtEnergy, Баваро, Пунта-Кана. Фото, условия проживания и стоимость. Эко-бунгало — 150 USD за 24 часа. Бронирование через WhatsApp."'),`${page.path}: exact requested description`);
    }
    if(page.lang==='ru')assert.ok(html.includes('<h1>Проживание в Пунта-Кане — бунгало и апартаменты</h1>'),`${page.path}: requested H1`);
  }
  if(page.key==='contacts'){
    assert.ok(html.includes('href="tel:+18297715555"'),`${page.path}: callable phone`);
    assert.ok(html.includes('href="mailto:Arteenergy501@gmail.com"'),`${page.path}: email action`);
    assert.ok(html.includes('https://wa.me/18297715555?text='),`${page.path}: direct WhatsApp`);
    assert.ok(html.includes('data-copy-address=')&&html.includes('data-copy-label'),`${page.path}: copy address enhancement`);
    assert.ok(/<iframe\b[^>]*title="[^"]+"[^>]*src="https:\/\/www\.google\.com\/maps\?/.test(html),`${page.path}: named location map`);
    assert.ok(html.includes('class="contacts-footer"')&&!html.includes('class="contact-section"'),`${page.path}: no duplicate contact footer`);
    assert.ok(html.includes('"@type":"ContactPage"'),`${page.path}: contact page semantics`);
    assert.ok(!/24\/7|24×7|around the clock|круглосуточно/.test(html),`${page.path}: no unconfirmed opening hours`);
  }
  if(page.key==='spa'){
    assert.equal((html.match(/class="spa-offer"/g)||[]).length,2,`${page.path}: both options together`);
    for(const id of ['banya','hammam'])assert.ok(html.includes(`id="${id}"`),`${page.path}: direct service anchor`);
    for(const price of ['6 000 DOP','2 000 DOP'])assert.ok(html.includes(price),`${page.path}: service prices`);
    assert.ok(html.includes({ru:'Минимальное время — 3 часа',en:'Minimum booking — 3 hours',es:'Tiempo mínimo — 3 horas'}[page.lang]),`${page.path}: minimum bath duration`);
    assert.ok(!html.includes('image-note'),`${page.path}: no removed visible illustration badge`);
  }
}
const sitemap=await readFile(path.join(output,'sitemap.xml'),'utf8');
for(const page of manifest.pages)if(page.redirectTo)assert.ok(!sitemap.includes(`<loc>${origin+page.path}</loc>`),`${page.path}: alias excluded from sitemap`);
const js=await readFile(path.join(output,'app.js'),'utf8');
assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|localStorage\.setItem/.test(js),'No hidden submission/tracking');
console.log(`PASS: ${manifest.pages.length} pages, ${links} local links/assets, ${images} image tags; locales, prices, 16-photo galleries, 68-item menus and no forms/development copy.`);
