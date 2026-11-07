import {copy,menu,assets,gallery,locales,origin,contact,events,rooms,spaServices,pathFor,translate,ui,altFor} from './model.mjs';
import {contactPageCopy,spaPageCopy,menuPageCopy,workingHoursCopy} from './translations.mjs';
import {basePath} from './deployment.mjs';
import {esc,icon,srcset,image,external,wa,local,alias,figure,breadcrumbs} from './components.mjs';
import {socialLinks,socialLabel} from './social-links.mjs';
import {pageSchema,schemaScript} from './schema.mjs';
import {spaPromotionCopy} from './spa-procedures-copy.mjs';

const spaNavigationCopy={
  ru:{label:'SPA и баня',treatments:'Массаж и SPA-процедуры',open:'Открыть подменю SPA',close:'Закрыть подменю SPA'},
  en:{label:'SPA & steam bath',treatments:'Massage and SPA treatments',open:'Open SPA submenu',close:'Close SPA submenu'},
  es:{label:'SPA y sauna',treatments:'Masajes y tratamientos SPA',open:'Abrir el submenú de SPA',close:'Cerrar el submenú de SPA'},
};

function navDropdown({kind,surface,link,children,labels}){
  const panelId='nav-submenu-'+kind+'-'+surface;
  return `<div class="nav-dropdown" data-nav-dropdown="${kind}" data-nav-surface="${surface}"><div class="nav-dropdown-row">${link}<button class="nav-dropdown-toggle" data-nav-toggle type="button" aria-expanded="false" aria-controls="${panelId}" aria-label="${esc(labels.open)}" data-open-label="${esc(labels.open)}" data-close-label="${esc(labels.close)}" hidden>${icon('down',16)}</button></div><div class="nav-submenu" data-nav-submenu id="${panelId}" hidden>${children}</div></div>`;
}

function navLinks(lang,key='home',surface='desktop'){
  const t=s=>translate(s,lang),spaCopy=spaNavigationCopy[lang];
  const sections=[[t('Площадка'),'venue'],[t('Праздники'),'events'],[t('Кухня и бар'),'menu'],[t('Проживание'),'stay'],[spaCopy.label,'spa'],[contactPageCopy[lang].title,'contacts']];
  const eventLabels={ru:{open:'Открыть подменю праздников',close:'Закрыть подменю праздников'},en:{open:'Open celebrations submenu',close:'Close celebrations submenu'},es:{open:'Abrir el submenú de celebraciones',close:'Cerrar el submenú de celebraciones'}}[lang];
  return sections.map(([label,page])=>{
    const items=page==='events'?copy.events.home_groups.map(group=>({key:group.eventKey,label:t(group.title)})):page==='spa'?[{key:'spa',label:t(copy.bath.title)},{key:'spa-treatments',label:spaCopy.treatments}]:null;
    const childCurrent=items?.some(item=>item.key===key);
    const parentCurrent=(page==='events'&&key.startsWith('event-'))||(page==='spa'&&(key==='spa'||key==='spa-treatments'));
    const link=`<a data-nav-primary href="${pathFor(page,lang)}"${key===page&&!childCurrent?' aria-current="page"':''}${parentCurrent?' class="nav-parent-current"':''}>${esc(label)}</a>`;
    if(!items)return link;
    const children=items.map(item=>`<a data-nav-child ${page==='events'?'data-event-link':'data-spa-link'} href="${pathFor(item.key,lang)}"${key===item.key?' aria-current="page"':''}>${esc(item.label)}</a>`).join('');
    return navDropdown({kind:page,surface,link,children,labels:page==='events'?eventLabels:spaCopy});
  }).join('');
}
function languages(key,lang){
  return `<nav class="languages" aria-label="${esc(ui[lang].language)}">${['es','en','ru'].map(l=>`<a href="${pathFor(key,l)}" lang="${l}" hreflang="${l}"${lang===l?' aria-current="page"':''}>${l.toUpperCase()}</a>`).join('')}</nav>`;
}
function header(key,lang){
  const u=ui[lang];
  return `<a class="skip-link" href="#main">${esc(u.skip)}</a><header class="site-header${key==='home'?' site-header--home':''}"><div class="wrap header-inner"><a class="wordmark" href="${pathFor('home',lang)}" aria-label="ArtEnergy — ${esc(u.home)}">ArtEnergy</a><nav class="desktop-nav" aria-label="${esc(u.navigation)}">${navLinks(lang,key)}</nav>${languages(key,lang)}<details class="language-picker"><summary aria-label="${esc(u.language)}: ${lang.toUpperCase()}">${lang.toUpperCase()}${icon('down',14)}</summary>${languages(key,lang)}</details><details class="mobile-nav"><summary aria-label="${esc(u.openMenu)}">${icon('menu',26)}</summary><div class="mobile-nav-panel"><nav aria-label="${esc(u.navigation)}">${navLinks(lang,key,'mobile')}</nav>${wa(lang,translate(copy.hero.primary,lang),'general','','button')}${languages(key,lang)}</div></details></div></header>`;
}
function lightbox(lang){
  const u=ui[lang];
  return `<dialog class="lightbox" data-lightbox aria-label="${esc(u.gallery)}"><div class="lightbox-shell"><button class="icon-button lightbox-close" type="button" data-lightbox-close aria-label="${esc(u.closePhoto)}">${icon('close',28)}</button><button class="icon-button lightbox-prev" type="button" data-lightbox-prev aria-label="${esc(u.previousPhoto)}">${icon('left',30)}</button><figure class="lightbox-figure"><img data-lightbox-image alt=""><figcaption><span data-lightbox-caption></span><span data-lightbox-count aria-live="polite"></span></figcaption></figure><button class="icon-button lightbox-next" type="button" data-lightbox-next aria-label="${esc(u.nextPhoto)}">${icon('right',30)}</button></div></dialog>`;
}
function overviewDialog(lang){
  const t=s=>translate(s,lang);
  return `<dialog class="overview-dialog" data-overview-dialog aria-labelledby="overview-title"><div class="overview-shell"><div class="overview-heading"><h2 id="overview-title">${esc(t('Видеообзор ArtEnergy'))}</h2><button class="icon-button" type="button" data-overview-close aria-label="${esc(t('Закрыть видео'))}">${icon('close',26)}</button></div><video data-overview-video controls playsinline preload="none" poster="${assets.hero_mobile.src}" aria-label="${esc(t('Видеообзор ArtEnergy'))}"></video><p class="overview-error" data-overview-error hidden>${esc(t('Не удалось загрузить видео.'))} <a href="/video/overview.mp4">${esc(t('Открыть видео отдельно'))}</a></p></div></dialog>`;
}
function hero(lang){
  const t=s=>translate(s,lang);
  return `<section class="hero" id="hero"><picture class="hero-poster"><source media="(max-width: 760px)" srcset="${srcset('hero_mobile')}" sizes="100vw">${image('hero',lang,{eager:true,sizes:'100vw',alt:''})}</picture><div class="hero-shade"></div><div class="wrap hero-inner"><p class="hero-location">${esc(t(copy.hero.location))}</p><h1>${esc(t(copy.hero.title))}</h1><p class="hero-lead">${esc(t(copy.hero.body))}</p>${copy.hero.note?`<p class="hero-note">${esc(t(copy.hero.note))}</p>`:''}<div class="hero-actions">${wa(lang,t(copy.hero.primary),'general','','button button--hero')}<a class="hero-overview" href="/video/overview.mp4" data-overview><span class="overview-play" aria-hidden="true">${icon('play',22)}</span><span>${esc(t('Смотреть обзор'))}</span></a></div></div></section>`;
}

function gallerySection(lang,{standalone=false,allVisible=false,headingText,introText,afterIntro=''}={}){
  const t=s=>translate(s,lang),items=copy.gallery.items;
  const heading=standalone?'h1':'h2',title=headingText??(standalone?{ru:'Площадка ArtEnergy',en:'The ArtEnergy grounds',es:'El espacio ArtEnergy'}[lang]:t(copy.gallery.title));
  const intro=introText??t(copy.gallery.body);
  const more=gallery.expand_in_place.map(([,label],i)=>[`gallery-extra-${i+1}`,label]);
  const toggle=`<button class="gallery-toggle" type="button" data-gallery-toggle aria-controls="venue-more" aria-expanded="false" data-open-label="${esc(t('Все фотографии'))}" data-close-label="${esc(t('Свернуть галерею'))}" hidden><span>${esc(t('Все фотографии'))}</span>${icon('down',20)}</button>`;
  const preview=allVisible?[...items.slice(4),...more]:items.slice(4);
  const expansion=allVisible?'':`<details class="gallery-more" id="venue-more"><summary class="gallery-toggle"><span class="more-closed">${esc(t('Все фотографии'))}</span><span class="more-open">${esc(t('Свернуть галерею'))}</span>${icon('down')}</summary><div class="venue-extra-grid">${more.map(([key,label])=>figure(key,t(label),lang,'venue','(max-width: 760px) calc((100vw - 64px) / 2), 320px','',false)).join('')}</div></details>${toggle}`;
  return `<section class="${standalone?'section-page-gallery':'section venue-section'}" id="gallery">${alias('about')}<div class="wrap"><div class="gallery-heading"><${heading}>${esc(title)}</${heading}><p class="section-lead">${esc(intro)}</p></div>${afterIntro}<div class="venue-mosaic">${items.slice(0,4).map(([key,label],i)=>`<a class="photo-link mosaic-photo mosaic-photo--${i+1}" href="${assets[key].src}" data-gallery="venue" data-caption="${esc(t(label)+(copy.gallery.descriptions[key]?' · '+t(copy.gallery.descriptions[key]):''))}">${image(key,lang,{sizes:i<2?'(max-width: 760px) calc(100vw - 48px), 670px':'(max-width: 760px) calc((100vw - 60px) / 2), 330px',eager:allVisible&&i===0})}<span class="mosaic-caption">${esc(t(label))}</span><span class="photo-zoom" aria-hidden="true">${icon('arrow',20)}</span></a>`).join('')}</div><div class="venue-preview-grid">${preview.map(([key,label])=>figure(key,t(label),lang,'venue','(max-width: 760px) calc((100vw - 60px) / 2), 286px','',false)).join('')}</div>${expansion}</div></section>`;
}

function eventCard(event,lang,headingTag='h3'){
  const t=value=>translate(value,lang);
  return `<a class="event-card" href="${pathFor(event.key,lang)}"><span class="event-card-image">${image(event.image,lang,{sizes:'(max-width: 760px) calc((100vw - 64px) / 2), (max-width: 1050px) 40vw, 290px'})}</span><div class="event-card-copy"><${headingTag} class="event-card-title">${esc(t(event.name))}</${headingTag}><p class="event-card-summary">${esc(t(event.summary))}</p><span class="event-card-action">${esc(t('Подробнее'))}${icon()}</span></div></a>`;
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
  return `<section class="section visit-section" id="visit">${alias('services')}${alias('cafe')}<div class="wrap wrap--reading"><h2>${esc(t(copy.pricing.title))}</h2><p class="section-lead">${esc(t(copy.pricing.body))}</p><p class="visit-hours">${esc(workingHoursCopy[lang].visit)}</p>${rates(lang)}<div class="rate-notes">${copy.pricing.notes.map(note=>`<p>${esc(t(note))}</p>`).join('')}</div><div class="visit-contact">${wa(lang,t(copy.pricing.cta),'visit','','button')}</div></div></section>`;
}

function dishRows(items,lang){
  const t=s=>translate(s,lang);
  return `<dl class="dish-list">${items.map(([name,portion,price])=>`<div class="dish-row"><dt>${esc(t(name))}${portion?`<small>${esc(t(portion))}</small>`:''}</dt><dd>${esc(t(price))}</dd></div>`).join('')}</dl>`;
}
function kitchenSection(lang){
  const t=value=>translate(value,lang);
  const photos=[['kitchen_table','С гриля','kitchen'],['kitchen_dumplings','Домашняя кухня','kitchen'],['drink','Бар','bar']];
  return `<section class="section kitchen-section" id="kitchen"><div class="wrap"><div class="kitchen-heading"><h2>${esc(t(copy.kitchen.title))}</h2><p class="section-lead">${esc(t(copy.kitchen.body))}</p></div><div class="kitchen-showcase">${photos.map(([key,label,category],i)=>`<a class="kitchen-feature kitchen-feature--${i+1}" href="${pathFor('menu',lang)}#menu-${category}">${image(key,lang,{sizes:i===0?'(max-width: 760px) calc(100vw - 48px), 800px':'(max-width: 760px) calc((100vw - 60px) / 2), 400px'})}<span>${esc(t(label))}${icon()}</span></a>`).join('')}</div><div class="kitchen-tasting">${dishRows(copy.kitchen.preview_items.slice(0,3),lang)}${dishRows(copy.kitchen.preview_items.slice(3),lang)}</div><div class="kitchen-footer">${local(pathFor('menu',lang),t(copy.kitchen.cta),'button')}</div></div></section>`;
}

function roomCard(room,lang,withContact=true,headingTag='h3'){
  const t=s=>translate(s,lang);
  return `<article class="room-card"><a class="room-detail" href="${pathFor(room.key,lang)}" aria-label="${esc(t(room.title))}"><span class="room-photo">${image(room.image,lang,{sizes:'(max-width: 760px) calc(100vw - 48px), 620px'})}</span><${headingTag} class="room-card-title">${esc(t(room.title))}</${headingTag}><div class="room-facts">${room.facts.map(f=>`<p>${esc(t(f))}</p>`).join('')}</div><p class="room-price">${esc(t(room.price))}${room.unit?`<small>${esc(t(room.unit))}</small>`:''}</p>${room.mealNote?`<p class="room-meal-note">${esc(t(room.mealNote))}</p>`:''}</a>${withContact?`<div class="room-actions">${wa(lang,t(room.contact),'room',room.title,'button button--outline')}</div>`:''}</article>`;
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
  const t=value=>translate(value,lang),promo=spaPromotionCopy[lang];
  return `<section class="section section--paper bath-section" id="bath"><div class="wrap"><h2>${esc(t(copy.bath.title))}</h2><p class="section-lead">${esc(t(copy.bath.body))}</p><div class="spa-grid">${spaServices.map(service=>spaCard(service,lang)).join('')}</div><div class="spa-teaser"><div><h3>${esc(promo.title)}</h3><p>${esc(promo.body)}</p></div>${local(pathFor('spa-treatments',lang),promo.link)}</div></div></section>`;
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
  if(key==='contacts')return `<footer class="contacts-footer"><div class="wrap"><a class="wordmark" href="${pathFor('home',lang)}">ArtEnergy</a><span>© 2026 ArtEnergy</span>${local(pathFor('spa-treatments',lang),spaNavigationCopy[lang].treatments,'text-link text-link--light footer-treatment-link')}${socialLinks(lang)}${local(pathFor('home',lang),ui[lang].back,'text-link text-link--light')}</div></footer>`;
  return `<footer class="contact-section" id="contact">${alias('book')}${alias('booking')}${image('contact',lang,{className:'contact-background',sizes:'100vw',alt:''})}<div class="contact-shade"></div><div class="wrap contact-inner"><h2>${esc(t(copy.contact.title))}</h2><address><p>${esc(t(copy.contact.address))}</p><a href="tel:+18297715555">${esc(contact.phone)}</a></address><div class="contact-actions">${wa(lang,t(copy.contact.cta),'general','','button')}${external(contact.map,t(copy.contact.route),'text-link text-link--light')}</div>${socialLinks(lang)}<div class="footer-meta"><span>© 2026 ArtEnergy</span><a href="mailto:${contact.email}">${contact.email}</a>${local(pathFor('spa-treatments',lang),spaNavigationCopy[lang].treatments,'text-link text-link--light footer-treatment-link')}${local(pathFor('contacts',lang),contactPageCopy[lang].title,'text-link text-link--light footer-contact-link')}${key==='home'?'':local(pathFor('home',lang),ui[lang].back,'text-link text-link--light')}</div></div></footer>`;
}
function stickyContact(lang){return `<div class="mobile-contact" data-mobile-contact hidden>${wa(lang,translate(copy.hero.primary,lang),'general','','button')}</div>`;}

function languageSuggestion(key,lang){
  const text={ru:{question:'Перейти на русскую версию сайта?',accept:'Перейти на русский',dismiss:'Закрыть предложение языка'},en:{question:'Would you prefer to view this page in English?',accept:'Continue in English',dismiss:'Dismiss language suggestion'},es:{question:'¿Prefieres ver esta página en español?',accept:'Continuar en español',dismiss:'Cerrar sugerencia de idioma'}}[lang];
  return `<aside class="language-suggestion" data-language-suggestion lang="${lang}" aria-labelledby="language-suggestion-title" hidden><div class="language-suggestion-content"><p id="language-suggestion-title" data-language-message>${esc(text.question)}</p><a class="language-suggestion-accept" data-language-accept href="${pathFor(key,lang)}">${esc(text.accept)}</a></div><button class="language-suggestion-dismiss" data-language-dismiss type="button" aria-label="${esc(text.dismiss)}">${icon('close',20)}</button></aside>`;
}

function shell({key,lang,title,description,body,home=false,status=200}){
  const canonical=origin+pathFor(key,lang);
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#153d2c">${status===404?'<meta name="robots" content="noindex">':`<link rel="canonical" href="${canonical}">${locales.map(l=>`<link rel="alternate" hreflang="${l}" href="${origin+pathFor(key,l)}">`).join('')}<link rel="alternate" hreflang="x-default" href="${origin+pathFor(key,'ru')}">`}<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin+assets.hero.src}"><meta property="og:locale" content="${{ru:'ru_RU',en:'en_US',es:'es_DO'}[lang]}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="preload" href="/fonts/GolosText-variable.ttf" as="font" type="font/ttf" crossorigin><link rel="stylesheet" href="/styles.css"><script src="/app.js" defer></script>${schemaScript(pageSchema({key,lang,title,description,body,status}))}</head><body class="${home?'page-home':'page-inner'}" data-locale="${lang}" data-page="${key}">${header(key,lang)}<main id="main">${body}</main>${footer(lang,key)}${status===200?languageSuggestion(key,lang):''}${lightbox(lang)}${home?overviewDialog(lang)+stickyContact(lang):''}</body></html>`;
}

export function homePage(lang){
  return shell({key:'home',lang,title:translate(copy.hero.title,lang)+' · ArtEnergy',description:translate(copy.hero.body,lang)+' '+translate(copy.hero.note,lang),body:hero(lang)+gallerySection(lang)+eventsSection(lang)+visitSection(lang)+kitchenSection(lang)+staysSection(lang)+bathSection(lang)+organizersSection(lang)+faqSection(lang),home:true});
}
export function contactsPage(lang){
  const c=contactPageCopy[lang];
  const body=`<article class="contacts-page" id="contact"><div class="wrap">${breadcrumbs(lang,c.title,{current:true,ariaLabel:c.breadcrumb})}<div class="contacts-grid"><section class="contacts-main"><h1>${esc(c.title)}</h1><p class="contacts-lead">${esc(c.intro)}</p><div class="contacts-actions">${wa(lang,c.whatsapp,'general','','button')}</div><dl class="contacts-methods"><div class="contacts-phone"><dt>${esc(c.phone)}</dt><dd><a href="tel:+18297715555">${esc(contact.phone)}</a></dd></div><div><dt>${esc(c.email)}</dt><dd><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></dd></div><div><dt>${esc(socialLabel(lang))}</dt><dd>${socialLinks(lang)}</dd></div></dl><p class="contacts-hours">${esc(workingHoursCopy[lang].contact)}</p></section><aside class="contacts-location"><figure class="contacts-photo">${image('overview_day',lang,{sizes:'(max-width: 900px) calc(100vw - 48px), 560px',eager:true})}</figure><address id="contact-address"><strong>Calle Kiev 35</strong><span>${esc(c.region)}</span><span>${esc(c.country)}</span></address><button class="copy-address" type="button" hidden data-copy-address="${esc(contact.address)}" data-copy-target="contact-address" data-copy-success="${esc(c.copied)}" data-copy-selected="${esc(c.selected)}" data-copy-failed="${esc(c.failed)}">${icon('copy',20)}<span data-copy-label aria-live="polite">${esc(c.copy)}</span></button></aside></div></div><section class="contacts-map-section" id="contact-map"><div class="wrap"><div class="contacts-map-heading"><h2>${esc(c.directions)}</h2>${external(contact.mapSearch,c.maps,'text-link')}</div><div class="contacts-map"><iframe title="${esc(c.mapTitle)}" src="${esc(contact.mapEmbed+'&hl='+lang)}" width="1200" height="420" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></div></section></article>`;
  return shell({key:'contacts',lang,title:c.title+' · ArtEnergy',description:c.description,body});
}
export function menuPage(lang){
  const u=ui[lang],t=s=>translate(s,lang),c=menuPageCopy[lang];
  const body=`<section class="inner-page menu-page"><div class="wrap">${breadcrumbs(lang,t('Меню'))}<h1>${esc(t('Меню'))}</h1><p class="section-lead menu-intro">${esc(c.intro)}</p><p class="menu-visit-note">${esc(c.minimum)}</p><nav class="menu-tabs" data-menu-tabs aria-label="${esc(u.menuCategories)}">${Object.entries(menu).map(([key,cat],i)=>`<a href="#menu-${key}" data-menu-tab="${key}"${i===0?' class="is-active"':''}>${esc(t(cat.label))}</a>`).join('')}</nav><div class="menu-panels">${Object.entries(menu).map(([key,cat],i)=>`<section class="menu-panel${i===0?' is-active':''}" id="menu-${key}" data-menu-panel="${key}"><div class="menu-group-grid">${cat.groups.map(group=>`<section class="menu-group"><h2>${esc(t(group.title))}</h2>${dishRows(group.items,lang)}</section>`).join('')}</div>${cat.note?`<p class="menu-condition">${esc(t(cat.note))}</p>`:''}</section>`).join('')}</div></div></section>`;
  return shell({key:'menu',lang,title:c.title,description:c.description,body});
}

export function spaRedirect(service,lang){
  const title=translate(copy.bath.title,lang),target=basePath+pathFor(service.key,lang),canonical=origin+pathFor('spa',lang);
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} · ArtEnergy</title><meta name="robots" content="noindex, follow"><link rel="canonical" href="${esc(canonical)}"><meta http-equiv="refresh" content="0;url=${esc(target)}"><script>location.replace(${JSON.stringify(target).replace(/</g,'\\u003c')})</script></head><body><h1>${esc(title)}</h1><p><a href="${pathFor(service.key,lang)}">${esc(spaPageCopy[lang].continue)}</a></p></body></html>`;
}

export function errorPage(lang='ru'){
  const u=ui[lang];
  return shell({key:'404',lang,title:u.notFound+' · ArtEnergy',description:u.notFoundText,status:404,body:`<section class="inner-page error-page"><div class="wrap wrap--reading"><h1>${esc(u.notFound)}</h1><p class="section-lead">${esc(u.notFoundText)}</p>${local(pathFor('home',lang),u.back,'button')}</div></section>`});
}

export {shell,gallerySection,eventCard};
