import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {root,output} from './build.mjs';
const manifest=JSON.parse(await readFile(path.join(root,'build-manifest.json'),'utf8'));
const origin=manifest.siteUrl||'https://artenergy.do';
const basePath=manifest.basePath||'';
const docs=new Map();
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
  if(page.lang!=='ru')assert.ok(!/[А-Яа-яЁё]/.test(html),`${page.path}: no untranslated Cyrillic`);
  if(page.key!=='404'){
    assert.ok(html.includes(`href="${origin}${page.path}"`),`${page.path}: canonical`);
    for(const lang of ['ru','en','es'])assert.ok(html.includes(`hreflang="${lang}"`),`${page.path}: language alternative`);
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
    assert.equal((html.match(/data-gallery="venue"/g)||[]).length,16);
    assert.equal((html.match(/class="event-card"/g)||[]).length,6);
    assert.equal((html.match(/class="room-card"/g)||[]).length,2);
    assert.ok(!/data-hero-video|data-video-toggle|class="wrap visit-formats"/.test(html),`${page.path}: photo hero and no format strip`);
    assert.equal((html.match(/class="photo-link mosaic-photo /g)||[]).length,4,`${page.path}: four-photo mosaic`);
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
  if(page.key==='menu'){
    assert.equal((html.match(/class="dish-row"/g)||[]).length,68,`${page.path}: full menu`);
    assert.equal((html.match(/data-menu-panel=/g)||[]).length,5);
  }
}
const js=await readFile(path.join(output,'app.js'),'utf8');
assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|localStorage\.setItem/.test(js),'No hidden submission/tracking');
console.log(`PASS: ${manifest.pages.length} pages, ${links} local links/assets, ${images} image tags; locales, prices, 16-photo galleries, 68-item menus and no forms/development copy.`);
