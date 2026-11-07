import {assets,pathFor,whatsapp,translate,ui,altFor} from './model.mjs';

export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const icon=(name='arrow',size=20)=>{
  const paths={arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',pause:'<path d="M8 5v14M16 5v14"/>',play:'<path d="m8 5 11 7-11 7Z"/>',left:'<path d="m15 5-7 7 7 7"/>',right:'<path d="m9 5 7 7-7 7"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',wa:'<path d="m4 20 1.1-4A9 9 0 1 1 8 19.1L4 20Z"/><path d="M8 7c0 5 4 9 8 9l1-2-3-1-1 1c-2-1-3-2-3-4l1-1-1-2Z"/>'};
  paths.copy='<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"/>';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]??paths.arrow}</svg>`;
};
export const srcset=key=>assets[key].variants.map(v=>`${v.url} ${v.width}w`).join(', ');
export function image(key,lang,{className='',sizes='(max-width: 760px) calc(100vw - 48px), 620px',eager=false,fetchPriority=eager?'high':'',alt,style=''}={}){
  const asset=assets[key];
  if(!asset)throw new Error('Missing image: '+key);
  return `<img class="${esc(className)}" src="${asset.src}" srcset="${srcset(key)}" sizes="${esc(sizes)}" width="${asset.width}" height="${asset.height}" alt="${esc(alt??altFor(key,lang))}" loading="${eager?'eager':'lazy'}" decoding="async"${fetchPriority?` fetchpriority="${esc(fetchPriority)}"`:''}${style?` style="${esc(style)}"`:''}>`;
}
export const external=(href,label,cls='text-link',withIcon=true)=>`<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}${withIcon?icon():''}</a>`;
export const wa=(lang,label,kind='general',name='',cls='text-link')=>cls.includes('button')
  ? `<a class="${cls} whatsapp-button" href="${esc(whatsapp(lang,kind,name))}" target="_blank" rel="noopener noreferrer">${icon('wa',24)}<span>${esc(label)}</span>${icon()}</a>`
  : external(whatsapp(lang,kind,name),label,cls);
export const local=(href,label,cls='text-link')=>`<a class="${cls}" href="${esc(href)}">${esc(label)}${icon()}</a>`;
export const alias=id=>`<span class="anchor-alias" id="${id}" aria-hidden="true"></span>`;

export function photoLink(key,label,lang,group='venue',sizes,imageOptions={}){
  return `<a class="photo-link" href="${assets[key].src}" data-gallery="${group}" data-caption="${esc(label)}">${image(key,lang,{sizes,...imageOptions})}<span class="photo-zoom" aria-hidden="true">${icon('arrow',20)}</span></a>`;
}
export function figure(key,label,lang,group='venue',sizes,description='',showCaption=true,imageOptions={}){
  return `<figure class="venue-photo">${photoLink(key,label,lang,group,sizes,imageOptions)}${showCaption?`<figcaption><span>${esc(label)}</span>${description?`<p class="photo-description">${esc(description)}</p>`:''}</figcaption>`:''}</figure>`;
}

// Shared markup stays byte-compatible with each page's established classes and labels.
export function breadcrumbs(lang,label,{href='',current=false,ariaLabel=ui[lang].navigation}={}){
  const tail=href?`<a href="${esc(href)}">${esc(label)}</a>`:`<span${current?' aria-current="page"':''}>${esc(label)}</span>`;
  return `<nav class="breadcrumbs" aria-label="${esc(ariaLabel)}"><a href="${pathFor('home',lang)}">${esc(ui[lang].home)}</a><span aria-hidden="true">/</span>${tail}</nav>`;
}

export function paragraphs(items,className=''){
  return items.map(paragraph=>`<p${className?` class="${esc(className)}"`:''}>${esc(paragraph)}</p>`).join('');
}

export function restSection(lang,{prefix,content,items,group}){
  const t=value=>translate(value,lang);
  return `<section class="${prefix}-rest section--paper" aria-labelledby="${prefix}-rest-title"><div class="wrap"><header class="${prefix}-rest-heading"><h2 id="${prefix}-rest-title">${esc(content.restHeading)}</h2><p class="section-lead">${esc(content.restIntro)}</p></header><div class="${prefix}-rest-grid">${items.map(([key,asset,caption,page,more=[]])=>`<article class="${prefix}-rest-item">${photoLink(asset,t(caption),lang,group,'(max-width: 760px) calc(100vw - 48px), 380px')}<h3>${esc(content.rest[key].title)}</h3><p>${esc(content.rest[key].body)}</p>${page?local(pathFor(page,lang),content.rest[key].link):''}${more.map(link=>local(pathFor(link.page,lang),link.label)).join('')}</article>`).join('')}</div></div></section>`;
}

export function bookingSection(lang,{prefix,heading,body,cta,kind='general',name=''}){
  return `<section class="${prefix}-booking" aria-labelledby="${prefix}-booking-title"><div class="wrap ${prefix}-booking-inner"><div class="${prefix}-booking-copy"><h2 id="${prefix}-booking-title">${esc(heading)}</h2><p>${esc(body)}</p></div>${wa(lang,cta,kind,name,'button')}</div></section>`;
}

export function serviceOfferSection(lang,{id,title,paragraphs:body,image,caption=title,group='spa',reverse=false,eager=false,price=null,unit='',detail='',cta,kind='general',name=''}){
  const tariff=price?`<p class="spa-service-price">${esc(price)}${unit?` <span>${esc(unit)}</span>`:''}</p>`:'';
  return `<section class="spa-service${reverse?' spa-service--reverse':''}" id="${esc(id)}" aria-labelledby="${esc(id)}-title"><div class="spa-service-media">${photoLink(image,caption,lang,group,'(max-width: 760px) calc(100vw - 48px), (max-width: 1050px) calc(100vw - 80px), 690px',{eager})}</div><div class="spa-service-copy"><h2 id="${esc(id)}-title">${esc(title)}</h2>${paragraphs(body,'spa-service-description')}${tariff}${detail?`<p class="spa-service-rate-details">${esc(detail)}</p>`:''}<div class="spa-service-action">${wa(lang,cta,kind,name,'button')}</div></div></section>`;
}
