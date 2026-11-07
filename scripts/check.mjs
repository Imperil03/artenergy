import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Script} from 'node:vm';
import {root,output} from './build.mjs';
import {pathFor} from '../src/model.mjs';
import {workingHoursCopy} from '../src/translations.mjs';
import {resourcePaths} from './resource-urls.mjs';
const manifest=JSON.parse(await readFile(path.join(root,'build-manifest.json'),'utf8'));
const origin=manifest.siteUrl||'https://artenergy.do';
const basePath=manifest.basePath||'';
const docs=new Map();
assert.ok(!manifest.pages.some(page=>page.key.startsWith('room-')),'No separate lodging pages or redirect aliases');
assert.ok(!manifest.pages.some(page=>['event-5','event-7'].includes(page.key)),'Retired event pages are absent');
for(const page of manifest.pages){
  const file=page.path.endsWith('/')?page.path.slice(1)+'index.html':page.path.slice(1);
  docs.set(page.path,await readFile(path.join(output,file),'utf8'));
  assert.equal(createHash('sha256').update(docs.get(page.path)).digest('hex'),page.sha256,`${page.path}: fresh HTML matches build manifest`);
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
    assert.equal((desktopNav.match(/data-nav-primary/g)||[]).length,6,`${page.path}: six primary sections without visit item`);
    assert.equal((desktopNav.match(/data-event-link/g)||[]).length,6,`${page.path}: six event submenu links`);
    assert.equal((desktopNav.match(/data-spa-link/g)||[]).length,2,`${page.path}: two SPA destinations`);
    for(const kind of ['events','spa'])for(const surface of ['desktop','mobile'])assert.ok(pageHeader.includes(`id="nav-submenu-${kind}-${surface}"`),`${page.path}: unique ${surface} ${kind} submenu`);
    assert.ok(pageHeader.includes(`href="${basePath+pathFor('spa-treatments',page.lang)}"`),`${page.path}: treatments in SPA navigation`);
    const suggestion=html.match(/<aside class="language-suggestion"[\s\S]*?<\/aside>/g)||[];
    assert.equal(suggestion.length,page.key==='404'?0:1,`${page.path}: one language suggestion on content pages`);
    if(suggestion.length){
      assert.match(suggestion[0],/data-language-suggestion[^>]* hidden>/,`${page.path}: suggestion starts hidden`);
      for(const control of ['message','accept','dismiss'])assert.ok(suggestion[0].includes(`data-language-${control}`),`${page.path}: language suggestion ${control}`);
      assert.ok(!/role="(?:dialog|alertdialog)"|autofocus/.test(suggestion[0]),`${page.path}: nonmodal suggestion without focus stealing`);
    }
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
    assert.ok(html.includes(workingHoursCopy[page.lang].visit),`${page.path}: supplied advance-booking opening hours`);
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
  if(page.key==='venue'){
    assert.equal((html.match(/data-gallery="venue"/g)||[]).length,16,`${page.path}: venue gallery`);
    assert.ok(!html.includes('id="venue-more"')&&!html.includes('data-gallery-toggle'),`${page.path}: all venue photos visible without expansion`);
    const venue=html.slice(html.indexOf('id="gallery"'),html.indexOf('class="venue-visit-cta"'));
    assert.equal((venue.match(/loading="eager"/g)||[]).length,1,`${page.path}: only the first gallery image loads eagerly`);
    assert.equal((venue.match(/loading="lazy"/g)||[]).length,15,`${page.path}: remaining gallery images load lazily`);
    assert.equal((venue.match(/fetchpriority="high"/g)||[]).length,1,`${page.path}: one primary image priority`);
    assert.ok(html.includes('class="venue-visit-cta"')&&!html.includes('section-hub-related'),`${page.path}: closing visit CTA replaces old related links`);
    if(page.lang==='ru'){
      assert.ok(html.includes('<h1>Площадка ArtEnergy в Пунта-Кане</h1>'),`${page.path}: requested venue H1`);
      assert.ok(html.includes('<title>Площадка ArtEnergy в Пунта-Кане — фото бассейнов и территории</title>'),`${page.path}: exact venue title`);
      assert.ok(html.includes('content="Фотографии территории ArtEnergy в Баваро, Пунта-Кана. Два бассейна, крытые зоны отдыха, бар и тропический сад. Посмотрите площадку днём и вечером."'),`${page.path}: exact venue description`);
    }
  }
  if(page.key==='events'){
    assert.equal((html.match(/class="event-card"/g)||[]).length,6,`${page.path}: event catalog`);
    assert.equal((html.match(/<h2 class="event-card-title"/g)||[]).length,6,`${page.path}: event heading hierarchy`);
  }
  if(['event-0','event-1','event-2','event-3','event-4','event-6'].includes(page.key)){
    assert.ok(html.includes('class="birthday-page"'),`${page.path}: dedicated birthday page`);
    assert.equal((html.match(/data-gallery="birthday-venue"/g)||[]).length,3,`${page.path}: preserved venue gallery`);
    assert.ok(!/class="room-card"|class="room-grid"|class="rates-table"|class="dish-row"/.test(html),`${page.path}: no accommodation catalog or full pricing/dish tables`);
    assert.ok(!html.includes('150 USD'),`${page.path}: lodging is a short teaser only`);
    assert.ok(html.includes('class="birthday-stay-link"')&&html.includes('class="birthday-booking"'),`${page.path}: short stay addition and closing CTA`);
    if(page.key!=='event-2')assert.ok(html.includes('1 000 DOP'),`${page.path}: approved evening amount`);
    if(!['event-2','event-6'].includes(page.key))assert.ok(html.includes('500 DOP'),`${page.path}: approved daytime amount`);
    if(page.key==='event-6')assert.ok(html.includes('class="birthday-pricing-list"'),`${page.path}: two supplied night periods`);
    if(page.lang==='ru'&&page.key==='event-0'){
      assert.ok(html.includes('<h1>День рождения в Пунта-Кане</h1>'),`${page.path}: requested H1`);
      assert.ok(html.includes('<title>День рождения в Пунта-Кане — праздник у бассейна | ArtEnergy</title>'),`${page.path}: exact title`);
      assert.ok(html.includes('content="Где отметить день рождения в Пунта-Кане? ArtEnergy в Баваро — площадка с двумя бассейнами, зонами отдыха, кухней и баром. Фотографии и условия проведения праздника."'),`${page.path}: exact description`);
    }
    if(page.lang==='ru'&&page.key==='event-1'){
      assert.ok(html.includes('<h1>Детский праздник в Пунта-Кане</h1>'),`${page.path}: child party H1`);
      assert.ok(html.includes('<title>Детский день рождения и праздники в Пунта-Кане | ArtEnergy</title>'),`${page.path}: exact child party title`);
      assert.ok(html.includes('content="Детский праздник в ArtEnergy, Баваро, Пунта-Кана. Площадка с бассейнами, зонами отдыха, детским меню и праздничными тортами. Фото, условия проведения и бронирование."'),`${page.path}: exact child party description`);
      assert.ok(html.includes('Дети должны постоянно находиться под присмотром взрослых. Прыжки и ныряние в бассейны запрещены.'),`${page.path}: latest supplied child supervision and pool rules`);
      assert.ok(html.includes('Условия посещения для детей уточняются отдельно.'),`${page.path}: approved child pricing text`);
    }
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
    assert.ok(html.includes(workingHoursCopy[page.lang].contact),`${page.path}: supplied appointment-based opening hours`);
  }
  if(page.key==='spa'){
    assert.equal((html.match(/class="spa-service(?: spa-service--reverse)?"/g)||[]).length,2,`${page.path}: two full SPA sections`);
    assert.equal((html.match(/class="spa-rest-item"/g)||[]).length,3,`${page.path}: three related rest blocks`);
    for(const id of ['banya','hammam'])assert.ok(html.includes(`id="${id}"`),`${page.path}: direct service anchor`);
    for(const price of ['6 000 DOP','2 000 DOP'])assert.ok(html.includes(price),`${page.path}: service prices`);
    assert.ok(html.includes('class="spa-booking"'),`${page.path}: compact booking section`);
    assert.ok(!/spa-editorial|spa-before|spa-offer-caption|class="faq-list"/.test(html),`${page.path}: no retired text/FAQ or price overlays`);
    if(page.lang==='ru'){
      assert.ok(html.includes('Минимальная продолжительность бронирования — 3 часа.'),`${page.path}: minimum bath duration`);
      assert.ok(html.includes('<title>Баня и хаммам в Пунта-Кане — фото, цены | ArtEnergy</title>'),`${page.path}: requested title`);
      assert.ok(html.includes('content="Баня и хаммам в ArtEnergy, Баваро, Пунта-Кана. Баня — 6 000 DOP за 3 часа, хаммам — 2 000 DOP за час. Фотографии, условия и запись через WhatsApp."'),`${page.path}: requested description`);
    }
    assert.ok(!html.includes('image-note'),`${page.path}: no removed visible illustration badge`);
  }
}
const sitemap=await readFile(path.join(output,'sitemap.xml'),'utf8');
for(const page of manifest.pages)if(page.redirectTo)assert.ok(!sitemap.includes(`<loc>${origin+page.path}</loc>`),`${page.path}: alias excluded from sitemap`);
const js=await readFile(path.join(output,'app.js'),'utf8');
new Script(js,{filename:'app.js'});
assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(js),'No hidden submission/tracking network requests');
const css=await readFile(path.join(output,'styles.css'),'utf8');
for(const route of resourcePaths(manifest.pages.map(page=>({html:docs.get(page.path)})),css,origin,basePath)){
  if(docs.has(route))continue;
  const file=path.resolve(output,'.'+route);
  assert.ok(file.startsWith(output+path.sep),`Resource remains inside build output: ${route}`);
  assert.ok((await stat(file).catch(()=>null))?.isFile(),`Missing srcset, poster, CSS or metadata resource: ${route}`);
}
assert.ok(Array.isArray(manifest.assetFiles)&&Array.isArray(manifest.bundles),'Fresh build manifest includes media and bundle integrity');
for(const asset of [...manifest.assetFiles,...manifest.bundles]){
  const file=path.resolve(output,'.'+asset.path);
  assert.ok(file.startsWith(output+path.sep));
  const data=await readFile(file);
  assert.equal(data.length,asset.bytes,`${asset.path}: asset size matches manifest`);
  assert.equal(createHash('sha256').update(data).digest('hex'),asset.sha256,`${asset.path}: asset content matches manifest`);
}
console.log(`PASS: ${manifest.pages.length} pages, ${links} local links/assets, ${images} image tags; locales, prices, 16-photo galleries, 68-item menus and no forms/development copy.`);
