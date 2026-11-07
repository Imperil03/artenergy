import {origin,assets,contact,copy,rooms,spaServices,spaTreatmentCatalog,pathFor,translate,locales} from './model.mjs';
import {workingHoursCopy} from './translations.mjs';
import {configuredSocialLinks} from './social-links.mjs';
import {lodgingPageCopy} from './lodging-copy.mjs';
import {spaEditorialCopy} from './spa-copy.mjs';
import {spaProceduresCopy} from './spa-procedures-copy.mjs';

const businessId=origin+'/#business';
const websiteId=origin+'/#website';
const ref=id=>({'@id':id});
const absolute=url=>/^https?:\/\//.test(url)?url:origin+url;
const text=html=>html.replace(/<[^>]*>/g,'').replace(/&(amp|lt|gt|quot|#39);/g,entity=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[entity])).replace(/\s+/g,' ').trim();
const firstParagraph=html=>text(html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)?.[1]||'');
const localized=(value,lang)=>typeof value==='string'?value:value?.[lang]||'';

function businessNode(lang,key){
  return {
    '@type':'LocalBusiness','@id':businessId,name:'ArtEnergy',url:origin+'/',
    telephone:contact.phone.replace(/[^+\d]/g,''),email:contact.email,
    address:{'@type':'PostalAddress',streetAddress:'Calle Kiev 35',addressLocality:'Bávaro, Punta Cana',addressCountry:'DO'},
    image:absolute(assets.hero.src),sameAs:configuredSocialLinks().map(([,url])=>url),hasMap:contact.mapSearch,
    description:workingHoursCopy[lang][key==='contacts'?'contact':'visit'],
    openingHoursSpecification:{
      '@type':'OpeningHoursSpecification',
      dayOfWeek:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day=>'https://schema.org/'+day),
      opens:'00:00',closes:'23:59',
    },
  };
}

function breadcrumbNode(body,canonical,heading){
  const nav=body.match(/<nav class="breadcrumbs"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  if(!nav)return null;
  const items=[...nav.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
    .map(([,href,label])=>({name:text(label),item:absolute(href)}));
  const tail=[...nav.matchAll(/<span\b([^>]*)>([\s\S]*?)<\/span>/g)]
    .filter(([,attributes])=>!attributes.includes('aria-hidden')).map(([, ,label])=>text(label)).at(-1);
  if(items.at(-1)?.item!==canonical)items.push({name:tail||heading,item:canonical});
  return {'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,...item}))};
}

function primaryImage(body,canonical){
  const src=body.match(/<img\b[^>]*\bsrc="([^"]+)"/)?.[1];
  if(!src)return null;
  const asset=Object.values(assets).find(asset=>asset.src===src||asset.variants.some(variant=>variant.url===src));
  const dimensions=asset?.variants.find(variant=>variant.url===src)||asset;
  return {'@type':'ImageObject','@id':canonical+'#primaryimage',contentUrl:absolute(src),url:absolute(src),
    ...(dimensions?{width:dimensions.width,height:dimensions.height}:{}),};
}

function money(value){
  const match=value?.match(/^([\d\s\u00a0]+(?:[.,]\d+)?)\s+([A-Z]{3})$/);
  return match?{price:Number(match[1].replace(/[\s\u00a0]/g,'').replace(',','.')),priceCurrency:match[2]}:null;
}

function addService(graph,canonical,{id,name,description,image,url=canonical,price='',priceDescription='',serviceType=name}){
  const service={'@type':'Service','@id':canonical+'#service'+(id?'-'+id:''),name,description,url,
    provider:ref(businessId),mainEntityOfPage:ref(canonical+'#webpage'),serviceType,
    ...(image?{image:typeof image==='string'?absolute(assets[image].src):image}:{}),};
  const tariff=money(price);
  if(tariff){
    const offerId=canonical+'#offer-'+id;
    service.offers=ref(offerId);
    graph.push({'@type':'Offer','@id':offerId,url,...tariff,description:priceDescription||description,
      itemOffered:ref(service['@id']),seller:ref(businessId)});
  }
  graph.push(service);
  return ref(service['@id']);
}

function pageServices(graph,key,lang,canonical,heading,body){
  if(key.startsWith('event-'))return [addService(graph,canonical,{
    name:heading,description:firstParagraph(body),serviceType:translate('Площадка',lang),image:ref(canonical+'#primaryimage'),
  })];
  if(key==='stay')return rooms.map(room=>{
    const id=['bungalow','apartments'][room.index],option=lodgingPageCopy[lang].options[id];
    return addService(graph,canonical,{id,name:translate(room.title,lang),description:option.paragraphs.join(' '),
      image:room.image,url:canonical+'#'+id,price:room.unit?room.price:'',priceDescription:option.price});
  });
  if(key==='spa')return spaServices.map(service=>{
    const id=['banya','hammam'][service.index],option=spaEditorialCopy[lang].options[id];
    return addService(graph,canonical,{id,name:translate(service.title,lang),description:option.paragraphs.join(' '),
      image:service.image,url:canonical+'#'+id,price:service.price,
      priceDescription:[translate(service.unit,lang),option.detail].filter(Boolean).join('. ')});
  });
  if(key==='spa-treatments')return spaTreatmentCatalog.services.map(service=>{
    const option=spaProceduresCopy[lang].options[service.id];
    return addService(graph,canonical,{id:service.id,name:option.heading,description:option.paragraphs.join(' '),
      image:service.image,url:canonical+'#'+service.id,price:localized(service.price,lang)});
  });
  return [];
}

export function pageSchema({key,lang,title,description,body,status=200}){
  if(status!==200||key==='404')return null;
  const canonical=origin+pathFor(key,lang),heading=text(body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]||title);
  const page={'@type':key==='contacts'?'ContactPage':key==='events'?'CollectionPage':'WebPage',
    '@id':canonical+'#webpage',url:canonical,name:heading,description:description.trim(),inLanguage:lang,
    isPartOf:ref(websiteId),about:ref(businessId)};
  const graph=[{'@type':'WebSite','@id':websiteId,name:'ArtEnergy',url:origin+'/',inLanguage:locales,publisher:ref(businessId)},page];
  if(key==='home'||key==='contacts'){graph.push(businessNode(lang,key));page.mainEntity=ref(businessId);}
  const image=primaryImage(body,canonical);
  if(image){graph.push(image);page.primaryImageOfPage=ref(image['@id']);}
  if(key!=='home'){
    const crumbs=breadcrumbNode(body,canonical,heading);
    if(crumbs){graph.push(crumbs);page.breadcrumb=ref(crumbs['@id']);}
  }
  const services=pageServices(graph,key,lang,canonical,heading,body);
  if(services.length)page.mainEntity=services.length===1?services[0]:services;
  if(key==='events'){
    const list={'@type':'ItemList','@id':canonical+'#event-pages',numberOfItems:copy.events.home_groups.length,
      itemListElement:copy.events.home_groups.map((group,index)=>({'@type':'ListItem',position:index+1,
        name:translate(group.title,lang),item:ref(origin+pathFor(group.eventKey,lang)+'#webpage')}))};
    graph.push(list);page.mainEntity=ref(list['@id']);
  }
  return {'@context':'https://schema.org','@graph':graph};
}

export function schemaScript(data){
  return data?`<script type="application/ld+json">${JSON.stringify(data).replace(/</g,'\\u003c')}</script>`:'';
}
