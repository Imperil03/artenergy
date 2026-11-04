import {copy,menu,assets,gallery,locales,origin,contact,events,rooms,spaServices,pathFor,whatsapp,translate,ui,eventText,altFor,roomText} from './model.mjs';

export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(name='arrow',size=20)=>{
  const paths={arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',pause:'<path d="M8 5v14M16 5v14"/>',play:'<path d="m8 5 11 7-11 7Z"/>',left:'<path d="m15 5-7 7 7 7"/>',right:'<path d="m9 5 7 7-7 7"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',wa:'<path d="m4 20 1.1-4A9 9 0 1 1 8 19.1L4 20Z"/><path d="M8 7c0 5 4 9 8 9l1-2-3-1-1 1c-2-1-3-2-3-4l1-1-1-2Z"/>'};
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]??paths.arrow}</svg>`;
};
const srcset=key=>assets[key].variants.map(v=>`${v.url} ${v.width}w`).join(', ');
function image(key,lang,{className='',sizes='(max-width: 760px) calc(100vw - 48px), 620px',eager=false,alt,style=''}={}){
  const asset=assets[key];
  if(!asset)throw new Error('Missing image: '+key);
  return `<img class="${esc(className)}" src="${asset.src}" srcset="${srcset(key)}" sizes="${esc(sizes)}" width="${asset.width}" height="${asset.height}" alt="${esc(alt??altFor(key,lang))}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}${style?` style="${esc(style)}"`:''}>`;
}
const external=(href,label,cls='text-link',withIcon=true)=>`<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}${withIcon?icon():''}</a>`;
const wa=(lang,label,kind='general',name='',cls='text-link')=>cls.includes('button')
  ? `<a class="${cls} whatsapp-button" href="${esc(whatsapp(lang,kind,name))}" target="_blank" rel="noopener noreferrer">${icon('wa',24)}<span>${esc(label)}</span>${icon()}</a>`
  : external(whatsapp(lang,kind,name),label,cls);
const local=(href,label,cls='text-link')=>`<a class="${cls}" href="${esc(href)}">${esc(label)}${icon()}</a>`;
const alias=id=>`<span class="anchor-alias" id="${id}" aria-hidden="true"></span>`;

function navLinks(lang){
  const t=s=>translate(s,lang);
  return [['Площадка','gallery'],['Праздники','events'],['Посещение','visit'],['Кухня и бар','kitchen'],['Проживание','stay'],['Баня и хаммам','bath']].map(([label,id])=>`<a href="${pathFor('home',lang)}#${id}">${esc(t(label))}</a>`).join('');
}
function languages(key,lang){
  return `<nav class="languages" aria-label="${esc(ui[lang].language)}">${locales.map(l=>`<a href="${pathFor(key,l)}" lang="${l}" hreflang="${l}"${lang===l?' aria-current="page"':''}>${l.toUpperCase()}</a>`).join('')}</nav>`;
}
function header(key,lang){
  const u=ui[lang];
  return `<a class="skip-link" href="#main">${esc(u.skip)}</a><header class="site-header${key==='home'?' site-header--home':''}"><div class="wrap header-inner"><a class="wordmark" href="${pathFor('home',lang)}" aria-label="ArtEnergy — ${esc(u.home)}">ArtEnergy</a><nav class="desktop-nav" aria-label="${esc(u.navigation)}">${navLinks(lang)}</nav>${languages(key,lang)}<details class="language-picker"><summary aria-label="${esc(u.language)}: ${lang.toUpperCase()}">${lang.toUpperCase()}${icon('down',14)}</summary>${languages(key,lang)}</details><details class="mobile-nav"><summary aria-label="${esc(u.openMenu)}">${icon('menu',26)}</summary><div class="mobile-nav-panel"><nav aria-label="${esc(u.navigation)}">${navLinks(lang)}</nav>${wa(lang,translate(copy.hero.primary,lang),'general','','button')}${languages(key,lang)}</div></details></div></header>`;
}
function lightbox(lang){
  const u=ui[lang];
  return `<dialog class="lightbox" data-lightbox aria-label="${esc(u.gallery)}"><div class="lightbox-shell"><button class="icon-button lightbox-close" type="button" data-lightbox-close aria-label="${esc(u.closePhoto)}">${icon('close',28)}</button><button class="icon-button lightbox-prev" type="button" data-lightbox-prev aria-label="${esc(u.previousPhoto)}">${icon('left',30)}</button><figure class="lightbox-figure"><img data-lightbox-image alt=""><figcaption><span data-lightbox-caption></span><span data-lightbox-count aria-live="polite"></span></figcaption></figure><button class="icon-button lightbox-next" type="button" data-lightbox-next aria-label="${esc(u.nextPhoto)}">${icon('right',30)}</button></div></dialog>`;
}
function overviewDialog(lang){
  const t=s=>translate(s,lang);
  return `<dialog class="overview-dialog" data-overview-dialog aria-labelledby="overview-title"><div class="overview-shell"><div class="overview-heading"><h2 id="overview-title">${esc(t('Видеообзор ArtEnergy'))}</h2><button class="icon-button" type="button" data-overview-close aria-label="${esc(t('Закрыть видео'))}">${icon('close',26)}</button></div><video data-overview-video controls playsinline preload="none" poster="${assets.hero_mobile.src}" aria-label="${esc(t('Видеообзор ArtEnergy'))}"></video><p class="overview-error" data-overview-error hidden>${esc(t('Не удалось загрузить видео.'))} <a href="/video/overview.mp4">${esc(t('Открыть видео отдельно'))}</a></p></div></dialog>`;
}
function photoLink(key,label,lang,group='venue',sizes){
  return `<a class="photo-link" href="${assets[key].src}" data-gallery="${group}" data-caption="${esc(label)}">${image(key,lang,{sizes})}<span class="photo-zoom" aria-hidden="true">${icon('arrow',20)}</span></a>`;
}
function figure(key,label,lang,group='venue',sizes,description='',showCaption=true){
  return `<figure class="venue-photo">${photoLink(key,label,lang,group,sizes)}${showCaption?`<figcaption><span>${esc(label)}</span>${description?`<p class="photo-description">${esc(description)}</p>`:''}</figcaption>`:''}</figure>`;
}

function hero(lang){
  const t=s=>translate(s,lang),u=ui[lang],hasVideo=copy.hero.media==='video';
  const video=hasVideo?`<video class="hero-video" autoplay muted loop playsinline preload="none" poster="${assets.hero.src}" data-hero-video data-desktop-src="/video/hero-desktop.mp4" data-mobile-src="/video/hero-mobile.mp4" aria-hidden="true" tabindex="-1"></video>`:'';
  const controls=hasVideo?`<div class="wrap hero-control-wrap"><button class="icon-button hero-video-toggle" data-video-toggle type="button" aria-label="${esc(u.pause)}" aria-pressed="false" data-pause-label="${esc(u.pause)}" data-play-label="${esc(u.play)}" hidden><span data-pause-icon>${icon('pause',22)}</span><span data-play-icon hidden>${icon('play',22)}</span></button></div>`:'';
  return `<section class="hero" id="hero"><picture class="hero-poster"><source media="(max-width: 760px)" srcset="${srcset('hero_mobile')}" sizes="100vw">${image('hero',lang,{eager:true,sizes:'100vw',alt:''})}</picture>${video}<div class="hero-shade"></div><div class="wrap hero-inner"><p class="hero-location">${esc(t(copy.hero.location))}</p><h1>${esc(t(copy.hero.title))}</h1><p class="hero-lead">${esc(t(copy.hero.body))}</p>${copy.hero.note?`<p class="hero-note">${esc(t(copy.hero.note))}</p>`:''}<div class="hero-actions">${wa(lang,t(copy.hero.primary),'general','','button button--hero')}<a class="hero-overview" href="/video/overview.mp4" data-overview><span class="overview-play" aria-hidden="true">${icon('play',22)}</span><span>${esc(t('Смотреть обзор'))}</span></a></div></div>${controls}</section>`;
}

function gallerySection(lang){
  const t=s=>translate(s,lang),items=copy.gallery.items;
  const more=gallery.expand_in_place.map(([,label],i)=>[`gallery-extra-${i+1}`,label]);
  const toggle=`<button class="gallery-toggle" type="button" data-gallery-toggle aria-controls="venue-more" aria-expanded="false" data-open-label="${esc(t('Все фотографии'))}" data-close-label="${esc(t('Свернуть галерею'))}" hidden><span>${esc(t('Все фотографии'))}</span>${icon('down',20)}</button>`;
  return `<section class="section venue-section" id="gallery">${alias('about')}<div class="wrap"><div class="gallery-heading"><h2>${esc(t(copy.gallery.title))}</h2><p class="section-lead">${esc(t(copy.gallery.body))}</p></div><div class="venue-mosaic">${items.slice(0,4).map(([key,label],i)=>`<a class="photo-link mosaic-photo mosaic-photo--${i+1}" href="${assets[key].src}" data-gallery="venue" data-caption="${esc(t(label)+(copy.gallery.descriptions[key]?' · '+t(copy.gallery.descriptions[key]):''))}">${image(key,lang,{sizes:i<2?'(max-width: 760px) calc(100vw - 48px), 670px':'(max-width: 760px) calc((100vw - 60px) / 2), 330px'})}<span class="mosaic-caption">${esc(t(label))}</span><span class="photo-zoom" aria-hidden="true">${icon('arrow',20)}</span></a>`).join('')}</div><div class="venue-preview-grid">${items.slice(4).map(([key,label])=>figure(key,t(label),lang,'venue','(max-width: 760px) calc((100vw - 60px) / 2), 286px','',false)).join('')}</div><details class="gallery-more" id="venue-more"><summary class="gallery-toggle"><span class="more-closed">${esc(t('Все фотографии'))}</span><span class="more-open">${esc(t('Свернуть галерею'))}</span>${icon('down')}</summary><div class="venue-extra-grid">${more.map(([key,label])=>figure(key,t(label),lang,'venue','(max-width: 760px) calc((100vw - 64px) / 2), 320px','',false)).join('')}</div></details>${toggle}</div></section>`;
}

function eventCard(event,lang){
  const t=value=>translate(value,lang);
  return `<a class="event-card" href="${pathFor(event.key,lang)}"><span class="event-card-image">${image(event.image,lang,{sizes:'(max-width: 760px) calc((100vw - 64px) / 2), (max-width: 1050px) 40vw, 290px'})}</span><div class="event-card-copy"><h3 class="event-card-title">${esc(t(event.name))}</h3><p class="event-card-summary">${esc(t(event.summary))}</p><span class="event-card-action">${esc(t('Подробнее'))}${icon()}</span></div></a>`;
}
function eventsSection(lang){
  const t=value=>translate(value,lang);
  return `<section class="section section--paper events-section" id="events">${alias('schedule')}<div class="wrap"><h2>${esc(t(copy.events.title))}</h2><p class="section-lead">${esc(t(copy.events.body))}</p><div class="event-grid">${copy.events.home_groups.map(group=>eventCard({...events.find(event=>event.key===group.eventKey),name:group.title,summary:group.body},lang)).join('')}</div></div>
    <div class="event-invitation">${image('events',lang,{className:'event-invitation-background',sizes:'100vw',alt:''})}<div class="wrap event-invitation-inner">${copy.events.invitation_body?`<div class="event-invitation-copy"><p>${esc(t(copy.events.invitation_body))}</p></div>`:''}${wa(lang,t(copy.events.cta),'event','','button button--light')}</div></div>
  </section>`;
}

function rates(lang){
  const t=s=>translate(s,lang);
  return `<table class="rates-table"><thead><tr><th scope="col">${esc(t(copy.pricing.headings[0]))}</th><th scope="col">${esc(t(copy.pricing.headings[1]))}</th></tr></thead><tbody>${copy.pricing.rows.map(([time,price])=>`<tr><th scope="row">${esc(t(time))}</th><td>${esc(t(price))}</td></tr>`).join('')}</tbody></table>`;
}
function visitSection(lang){
  const t=value=>translate(value,lang);
  return `<section class="section visit-section" id="visit">${alias('services')}${alias('cafe')}<div class="wrap wrap--reading"><h2>${esc(t(copy.pricing.title))}</h2><p class="section-lead">${esc(t(copy.pricing.body))}</p>${rates(lang)}<div class="rate-notes">${copy.pricing.notes.map(note=>`<p>${esc(t(note))}</p>`).join('')}</div><div class="visit-contact">${wa(lang,t(copy.pricing.cta),'visit','','button')}</div></div></section>`;
}

function dishRows(items,lang){
  const t=s=>translate(s,lang);
  return `<dl class="dish-list">${items.map(([name,portion,price])=>`<div class="dish-row"><dt>${esc(t(name))}${portion?`<small>${esc(t(portion))}</small>`:''}</dt><dd>${esc(t(price))}</dd></div>`).join('')}</dl>`;
}
function kitchenSection(lang){
  const t=value=>translate(value,lang);
  const photos=[['kitchen_table','С гриля','kitchen'],['kitchen_dumplings','Домашняя кухня','kitchen'],['drink','Бар','bar']];
  return `<section class="section kitchen-section" id="kitchen"><div class="wrap"><div class="kitchen-heading"><h2>${esc(t(copy.kitchen.title))}</h2><p class="section-lead">${esc(t(copy.kitchen.body))}</p></div><div class="kitchen-showcase">${photos.map(([key,label,category],i)=>`<a class="kitchen-feature kitchen-feature--${i+1}" href="${pathFor('menu',lang)}#menu-${category}">${image(key,lang,{sizes:i===0?'(max-width: 760px) calc(100vw - 48px), 800px':'(max-width: 760px) calc((100vw - 60px) / 2), 400px'})}<span>${esc(t(label))}${icon()}</span></a>`).join('')}</div><div class="kitchen-tasting">${dishRows(copy.kitchen.preview_items.slice(0,3),lang)}${dishRows(copy.kitchen.preview_items.slice(3),lang)}</div><div class="kitchen-footer">${local(pathFor('menu',lang),t(copy.kitchen.cta),'button')}<p>${esc(t(copy.kitchen.menu_categories))}</p></div></div></section>`;
}

function roomCard(room,lang,withContact=true){
  const t=s=>translate(s,lang);
  return `<article class="room-card"><a class="room-detail" href="${pathFor(room.key,lang)}" aria-label="${esc(t(room.title)+' — '+t('Подробнее'))}"><span class="room-photo">${image(room.image,lang,{sizes:'(max-width: 760px) calc(100vw - 48px), 620px'})}<span class="room-open">${esc(t('Подробнее'))}${icon()}</span></span><h3>${esc(t(room.title))}</h3></a><div class="room-facts">${room.facts.map(f=>`<p>${esc(t(f))}</p>`).join('')}</div><p class="room-price">${esc(t(room.price))}${room.unit?`<small>${esc(t(room.unit))}</small>`:''}</p>${room.mealNote?`<p class="room-meal-note">${esc(t(room.mealNote))}</p>`:''}${withContact?`<div class="room-actions">${wa(lang,t(room.contact),'room',room.title,'button button--outline')}</div>`:''}</article>`;
}
function staysSection(lang){
  const t=value=>translate(value,lang);
  return `<section class="section stays-section" id="stay">${alias('recovery')}<div class="wrap"><h2>${esc(t(copy.stay.title))}</h2><p class="section-lead">${esc(t(copy.stay.intro))}</p><div class="room-grid">${rooms.map(room=>roomCard(room,lang,false)).join('')}</div><div class="stay-contact">${wa(lang,t(copy.stay.cta),'room',copy.stay.title,'button')}</div></div></section>`;
}
function spaCard(service,lang){
  const t=value=>translate(value,lang);
  return `<a class="spa-card" href="${pathFor(service.key,lang)}"><span class="spa-card-photo">${image(service.image,lang,{sizes:'(max-width: 760px) calc(100vw - 48px), 580px'})}<span class="room-open">${esc(t('Подробнее'))}${icon()}</span></span><div class="spa-card-content"><h3 class="spa-card-heading">${esc(t(service.title))}</h3><span class="bath-price">${esc(t(service.price))}<small>${esc(t(service.unit))}</small></span>${service.detail?`<p class="spa-card-description">${esc(t(service.detail))}</p>`:''}</div></a>`;
}
function bathSection(lang){
  const t=value=>translate(value,lang);
  return `<section class="section section--paper bath-section" id="bath"><div class="wrap"><h2>${esc(t(copy.bath.title))}</h2><p class="section-lead">${esc(t(copy.bath.body))}</p><div class="spa-grid">${spaServices.map(service=>spaCard(service,lang)).join('')}</div></div></section>`;
}
function organizersSection(lang){
  const t=value=>translate(value,lang);
  return `<section class="section organizers-section" id="organizers">${image('hero',lang,{className:'organizers-background',sizes:'100vw',alt:''})}<div class="wrap organizers-inner"><div class="organizers-heading"><div><h2>${esc(t(copy.organizers.title))}</h2><div class="organizers-copy"><p>${esc(t(copy.organizers.intro))}</p><p>${esc(t(copy.organizers.body))}</p></div></div>${wa(lang,t(copy.organizers.cta),'organizers','','button button--light')}</div><div class="organizers-gallery">${copy.organizers.photos.map(key=>figure(key,altFor(key,lang),lang,'organizers','(max-width: 760px) calc(100vw - 48px), (max-width: 1050px) calc((100vw - 116px) / 3), 380px','',false)).join('')}</div></div></section>`;
}

function faqSection(lang){
  const t=s=>translate(s,lang);
  return `<section class="section section--paper faq-section" id="faq">${alias('info')}<div class="wrap wrap--reading"><h2>${esc(t(copy.faq.title))}</h2><div class="faq-list">${copy.faq.items.map(({q,a})=>`<details open><summary>${esc(t(q))}${icon('down')}</summary><p>${esc(t(a))}</p></details>`).join('')}</div></div></section>`;
}

function footer(lang,key='home'){
  const t=s=>translate(s,lang);
  return `<footer class="contact-section" id="contact">${alias('book')}${alias('booking')}${image('contact',lang,{className:'contact-background',sizes:'100vw',alt:''})}<div class="contact-shade"></div><div class="wrap contact-inner"><h2>${esc(t(copy.contact.title))}</h2><address><p>${esc(t(copy.contact.address))}</p><a href="tel:+18297715555">${esc(contact.phone)}</a></address><div class="contact-actions">${wa(lang,t(copy.contact.cta),'general','','button')}${external(contact.map,t(copy.contact.route),'text-link text-link--light')}</div><div class="footer-meta"><span>© 2026 ArtEnergy</span><a href="mailto:${contact.email}">${contact.email}</a><a href="${contact.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a>${key==='home'?'':local(pathFor('home',lang),ui[lang].back,'text-link text-link--light')}</div></div></footer>`;
}
function stickyContact(lang){return `<div class="mobile-contact" data-mobile-contact hidden>${wa(lang,translate(copy.hero.primary,lang),'general','','button')}</div>`;}

function shell({key,lang,title,description,body,home=false,status=200}){
  const canonical=origin+pathFor(key,lang);
  const schema=home?{'@context':'https://schema.org','@type':'LocalBusiness',name:'ArtEnergy',url:origin,telephone:contact.phone,email:contact.email,address:{'@type':'PostalAddress',streetAddress:'Calle Kiev 35',addressLocality:'Bávaro, Punta Cana',addressCountry:'DO'},image:origin+assets.hero.src,sameAs:[contact.instagram]}:null;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#153d2c">${status===404?'<meta name="robots" content="noindex">':`<link rel="canonical" href="${canonical}">${locales.map(l=>`<link rel="alternate" hreflang="${l}" href="${origin+pathFor(key,l)}">`).join('')}<link rel="alternate" hreflang="x-default" href="${origin+pathFor(key,'ru')}">`}<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin+assets.hero.src}"><meta property="og:locale" content="${{ru:'ru_RU',en:'en_US',es:'es_DO'}[lang]}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="preload" href="/fonts/GolosText-variable.ttf" as="font" type="font/ttf" crossorigin><link rel="stylesheet" href="/styles.css"><script src="/app.js" defer></script>${schema?`<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`:''}</head><body class="${home?'page-home':'page-inner'}" data-locale="${lang}" data-page="${key}">${header(key,lang)}<main id="main">${body}</main>${footer(lang,key)}${lightbox(lang)}${home?overviewDialog(lang)+stickyContact(lang):''}</body></html>`;
}

export function homePage(lang){
  return shell({key:'home',lang,title:translate(copy.hero.title,lang)+' · ArtEnergy',description:translate(copy.hero.body,lang)+' '+translate(copy.hero.note,lang),body:hero(lang)+gallerySection(lang)+eventsSection(lang)+visitSection(lang)+kitchenSection(lang)+staysSection(lang)+bathSection(lang)+organizersSection(lang)+faqSection(lang),home:true});
}
export function menuPage(lang){
  const u=ui[lang],t=s=>translate(s,lang);
  const body=`<section class="inner-page menu-page"><div class="wrap"><nav class="breadcrumbs" aria-label="${esc(u.navigation)}"><a href="${pathFor('home',lang)}">${esc(u.home)}</a><span aria-hidden="true">/</span><span>${esc(t('Меню'))}</span></nav><h1>${esc(t('Меню'))}</h1><nav class="menu-tabs" data-menu-tabs aria-label="${esc(u.menuCategories)}">${Object.entries(menu).map(([key,cat],i)=>`<a href="#menu-${key}" data-menu-tab="${key}"${i===0?' class="is-active"':''}>${esc(t(cat.label))}</a>`).join('')}</nav><div class="menu-panels">${Object.entries(menu).map(([key,cat],i)=>`<section class="menu-panel${i===0?' is-active':''}" id="menu-${key}" data-menu-panel="${key}"><div class="menu-group-grid">${cat.groups.map(group=>`<section class="menu-group"><h2>${esc(t(group.title))}</h2>${dishRows(group.items,lang)}</section>`).join('')}</div>${cat.note?`<p class="menu-condition">${esc(t(cat.note))}</p>`:''}</section>`).join('')}</div><div class="menu-contact">${wa(lang,t('Уточнить заказ в WhatsApp'),'menu')}</div></div></section>`;
  return shell({key:'menu',lang,title:u.menuTitle,description:u.menuDescription,body});
}

function breadcrumbs(lang,label,anchor){
  return `<nav class="breadcrumbs" aria-label="${esc(ui[lang].navigation)}"><a href="${pathFor('home',lang)}">${esc(ui[lang].home)}</a><span aria-hidden="true">/</span><a href="${pathFor('home',lang)}#${anchor}">${esc(label)}</a></nav>`;
}
export function eventPage(event,lang){
  const u=ui[lang],t=s=>translate(s,lang),content=eventText[lang][event.index];
  const body=`<article class="inner-page event-page"><div class="wrap">${breadcrumbs(lang,t(copy.events.title),'events')}<header class="detail-intro"><h1>${esc(content.title)}</h1><p class="section-lead">${esc(content.body)}</p>${wa(lang,t(copy.events.cta),'event',event.name,'button')}</header><div class="detail-photo-grid">${content.gallery.map((key,i)=>figure(key,altFor(key,lang),lang,event.key,i===0?'(max-width: 760px) calc(100vw - 48px), 850px':'(max-width: 760px) calc((100vw - 64px) / 2), 420px')).join('')}</div><div class="detail-info-grid"><section><h2>${esc(u.conditions)}</h2><p>${esc(u.visitRule)}</p>${content.highlights.map(k=>`<p>${esc(u[k])}</p>`).join('')}${local(pathFor('home',lang)+'#visit',u.seeVisit)}</section><section><h2>${esc(u.food)}</h2>${dishRows(copy.kitchen.preview_items.slice(0,3),lang)}${local(pathFor('menu',lang),u.seeMenu)}</section></div><section class="detail-stays"><h2>${esc(u.stays)}</h2><div class="room-grid">${rooms.map(r=>roomCard(r,lang)).join('')}</div></section><nav class="related-events" aria-label="${esc(u.allEvents)}"><h2>${esc(u.allEvents)}</h2><div>${events.filter(e=>e.key!==event.key).map(e=>local(pathFor(e.key,lang),t(e.name),'related-link')).join('')}</div></nav></div></article>`;
  return shell({key:event.key,lang,title:content.title+' · ArtEnergy',description:content.description,body});
}
export function roomPage(room,lang){
  const u=ui[lang],t=s=>translate(s,lang),meta=roomText(room,lang),other=rooms.find(r=>r.key!==room.key);
  const body=`<article class="inner-page accommodation-page"><div class="wrap">${breadcrumbs(lang,t(copy.stay.title),'stay')}<div class="accommodation-layout"><div class="accommodation-image">${photoLink(room.image,t(room.title),lang,room.key,'(max-width: 760px) calc(100vw - 48px), 800px')}</div><div class="accommodation-copy"><h1>${esc(t(room.title))}</h1>${room.facts.map(f=>`<p class="section-lead">${esc(t(f))}</p>`).join('')}<p class="room-price">${esc(t(room.price))}${room.unit?`<small>${esc(t(room.unit))}</small>`:''}</p>${room.mealNote?`<p>${esc(t(room.mealNote))}</p>`:''}<p>${esc(u.roomNote)}</p>${wa(lang,t(room.contact),'room',room.title,'button')}<p class="accommodation-menu-link">${local(pathFor('menu',lang),u.seeMenu)}</p></div></div><section class="alternative-stay"><h2>${esc(t(other.title))}</h2><div class="alternative-stay-inner">${image(other.image,lang,{sizes:'(max-width: 760px) calc(100vw - 48px), 420px'})}<div><p class="room-price">${esc(t(other.price))}${other.unit?`<small>${esc(t(other.unit))}</small>`:''}</p>${local(pathFor(other.key,lang),t(other.details))}</div></div></section></div></article>`;
  return shell({key:room.key,lang,title:meta.title,description:meta.description,body});
}
export function spaPage(service,lang){
  const t=value=>translate(value,lang),other=spaServices.find(item=>item.key!==service.key);
  const caption=service.illustration?t(service.title):t('Баня ArtEnergy');
  const title=t(service.title)+' · ArtEnergy';
  const body=`<article class="inner-page spa-page"><div class="wrap">${breadcrumbs(lang,t(copy.bath.title),'bath')}<div class="spa-detail-layout"><figure class="spa-detail-photo">${photoLink(service.image,caption,lang,service.key,'(max-width: 760px) calc(100vw - 48px), 680px')}</figure><div class="spa-detail-copy"><h1>${esc(t(service.title))}</h1><p class="section-lead">${esc(t(service.intro))}</p><p class="bath-price">${esc(t(service.price))}<small>${esc(t(service.unit))}</small></p>${service.detail?`<p>${esc(t(service.detail))}</p>`:''}${wa(lang,t(service.cta),'bath','','button')}</div></div><div class="spa-conditions"><section><h2>${esc(t('Условия посещения'))}</h2><p>${esc(t(copy.bath.note))}</p></section><section><h2>${esc(t('Выберите время'))}</h2><p>${esc(t('Напишите дату, число гостей и желаемую продолжительность. Администратор подтвердит возможность посещения и условия.'))}</p></section></div><section class="spa-alternative"><h2>${esc(t('Другой формат отдыха'))}</h2>${spaCard(other,lang)}</section></div></article>`;
  return shell({key:service.key,lang,title,description:t(service.intro)+' '+t(service.price)+' '+t(service.unit),body});
}

export function errorPage(lang='ru'){
  const u=ui[lang];
  return shell({key:'404',lang,title:u.notFound+' · ArtEnergy',description:u.notFoundText,status:404,body:`<section class="inner-page error-page"><div class="wrap wrap--reading"><h1>${esc(u.notFound)}</h1><p class="section-lead">${esc(u.notFoundText)}</p>${local(pathFor('home',lang),u.back,'button')}</div></section>`});
}
