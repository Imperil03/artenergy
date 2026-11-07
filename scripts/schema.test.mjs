import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {schemaScript} from '../src/schema.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await readFile(path.join(root,'build-manifest.json'),'utf8'));
const site=manifest.siteUrl;
const businessId=site+'/#business';
const websiteId=site+'/#website';
const plain=value=>value.replace(/<[^>]*>/g,' ').replace(/&(amp|lt|gt|quot|#39);/g,entity=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[entity])).replace(/\s+/g,' ').trim();
const types=new Map();
const allNodes=new Map();
const documents=new Map();
const references=[];
const records=[];
const walk=(value,visit)=>{
  if(!value||typeof value!=='object')return;
  visit(value);
  for(const child of Object.values(value)){
    if(Array.isArray(child))child.forEach(item=>walk(item,visit));
    else walk(child,visit);
  }
};

for(const page of manifest.pages){
  const file=page.path.endsWith('/')?page.path.slice(1)+'index.html':page.path.slice(1);
  const html=await readFile(path.join(root,'dist',file),'utf8');
  const scripts=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const isContent=page.key!=='404'&&!page.redirectTo;
  assert.equal(scripts.length,isContent?1:0,`${page.path}: one initial JSON-LD graph only on canonical content`);
  if(!isContent)continue;
  const schema=JSON.parse(scripts[0][1]);
  assert.equal(schema['@context'],'https://schema.org');
  assert.ok(Array.isArray(schema['@graph']));
  assert.ok(!scripts[0][1].includes('<'),`${page.path}: safe script serialization`);
  const canonical=site+page.path;
  const nodes=new Map();
  for(const node of schema['@graph']){
    assert.ok(node['@id']?.startsWith(canonical)||[businessId,websiteId].includes(node['@id']),`${page.path}: stable deployment-aware node ID`);
    assert.ok(!nodes.has(node['@id']),`${page.path}: duplicate node ${node['@id']}`);
    nodes.set(node['@id'],node);allNodes.set(node['@id'],node);
    types.set(node['@type'],(types.get(node['@type'])||0)+1);
  }
  const body=html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/)[1];
  const visible=plain(body);
  const webpage=nodes.get(canonical+'#webpage');
  assert.equal(webpage['@type'],page.key==='contacts'?'ContactPage':page.key==='events'?'CollectionPage':'WebPage');
  assert.equal(webpage.name,plain(body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1]));
  assert.equal(webpage.description,plain(html.match(/<meta name="description" content="([^"]*)"/)[1]));
  assert.equal(webpage.url,canonical);assert.equal(webpage.inLanguage,page.lang);
  assert.equal(webpage.isPartOf['@id'],websiteId);assert.equal(webpage.about['@id'],businessId);
  const breadcrumbs=nodes.get(canonical+'#breadcrumb');
  assert.equal(Boolean(breadcrumbs),page.key!=='home',`${page.path}: internal-page breadcrumbs`);
  if(breadcrumbs){
    const items=breadcrumbs.itemListElement;
    assert.equal(items.length,page.key.startsWith('event-')?3:2);
    assert.equal(items.at(-1).item,canonical);
    items.forEach((item,index)=>{assert.equal(item.position,index+1);assert.ok(item.name);});
    if(page.key.startsWith('event-'))assert.equal(items[1].item,site+manifest.pages.find(candidate=>candidate.lang===page.lang&&candidate.key==='events').path);
  }
  const services=[...nodes.values()].filter(node=>node['@type']==='Service');
  assert.equal(services.length,page.key.startsWith('event-')?1:({stay:2,spa:2,'spa-treatments':3}[page.key]||0));
  for(const service of services){
    assert.ok(visible.includes(service.name),`${page.path}: service name is visible`);
    assert.ok(visible.includes(service.description),`${page.path}: service description matches visible copy`);
    assert.equal(service.provider['@id'],businessId);
    assert.equal(service.mainEntityOfPage['@id'],webpage['@id']);
    if(page.key.startsWith('event-'))assert.ok(!service.offers,'Food minimum spend is not an event rental price');
  }
  const expectedPrices=page.key==='stay'?{bungalow:[150,'USD']}:page.key==='spa'?{banya:[6000,'DOP'],hammam:[2000,'DOP']}:page.key==='spa-treatments'?{massage:[2500,'DOP'],'body-peeling':[1500,'DOP'],'steam-treatment':[2000,'DOP']}:{};
  const offers=[...nodes.values()].filter(node=>node['@type']==='Offer');
  assert.equal(offers.length,Object.keys(expectedPrices).length);
  for(const [id,[price,currency]] of Object.entries(expectedPrices)){
    const offer=nodes.get(canonical+'#offer-'+id);
    assert.equal(offer.price,price);assert.equal(offer.priceCurrency,currency);
    assert.equal(offer.seller['@id'],businessId);
    assert.equal(offer.itemOffered['@id'],canonical+'#service-'+id);
    assert.equal(nodes.get(offer.itemOffered['@id']).offers['@id'],offer['@id']);
    assert.ok(visible.includes(String(price).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' '+currency),`${page.path}: price is visible with its currency`);
  }
  if(page.key==='stay'){
    assert.ok(!nodes.get(canonical+'#service-apartments').offers,'No invented apartment price');
    assert.match(nodes.get(canonical+'#offer-bungalow').description,/24/);
  }
  if(page.key==='spa')assert.match(nodes.get(canonical+'#offer-banya').description,/3/,'Bath offer preserves the three-hour minimum');
  const business=nodes.get(businessId);
  assert.equal(Boolean(business),page.key==='home'||page.key==='contacts');
  if(business){
    assert.equal(business['@type'],'LocalBusiness');assert.equal(business.name,'ArtEnergy');
    assert.equal(business.telephone,'+18297715555');assert.equal(business.email,'Arteenergy501@gmail.com');
    assert.equal(business.address.streetAddress,'Calle Kiev 35');assert.equal(business.address.addressCountry,'DO');
    const hours=business.openingHoursSpecification;
    assert.deepEqual(hours.dayOfWeek,['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day=>'https://schema.org/'+day));
    assert.equal(hours.opens,'00:00');assert.equal(hours.closes,'23:59');
    assert.ok(visible.includes(business.description),`${page.path}: advance booking condition remains explicit`);
  }
  if(page.key==='events'){
    const list=nodes.get(canonical+'#event-pages');
    const events=manifest.pages.filter(candidate=>candidate.lang===page.lang&&candidate.key.startsWith('event-'));
    assert.equal(list.numberOfItems,6);assert.equal(list.itemListElement.length,6);
    assert.deepEqual(list.itemListElement.map(item=>item.item['@id']).sort(),events.map(event=>site+event.path+'#webpage').sort());
  }
  walk(schema,object=>{
    if(object['@id'])references.push(object['@id']);
    for(const property of ['url','contentUrl','item','image'])if(typeof object[property]==='string'){
      assert.match(object[property],/^https:\/\//,`${page.path}: absolute HTTPS ${property}`);
      const url=new URL(object[property]);
      if(url.origin===new URL(site).origin){
        assert.ok(url.pathname.startsWith(manifest.basePath+'/'),`${page.path}: deployment prefix`);
        records.push({url,page:page.path});
      }
    }
    for(const property of ['availability','aggregateRating','review','geo','duration','startDate','endDate'])assert.ok(!(property in object),`${page.path}: no invented ${property}`);
    assert.notEqual(object['@type'],'Event','Venue service pages are not scheduled events');
  });
  documents.set(canonical,{html,body});
}
for(const reference of references)assert.ok(allNodes.has(reference),`Unresolved entity reference: ${reference}`);
for(const {url,page} of records){
  const target=documents.get(url.origin+url.pathname);
  if(target){
    if(url.hash)assert.ok(target.body.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),`${page}: broken service URL ${url}`);
  }else{
    assert.equal(url.hash,'');
    const resource=path.resolve(root,'dist','.'+decodeURIComponent(url.pathname.slice(manifest.basePath.length)));
    assert.ok(resource.startsWith(path.join(root,'dist')+path.sep));
    assert.ok((await stat(resource).catch(()=>null))?.isFile(),`${page}: missing schema image ${url}`);
  }
}
assert.equal(documents.size,42);
assert.deepEqual(Object.fromEntries(types),{WebSite:42,WebPage:36,LocalBusiness:6,ImageObject:39,ContactPage:3,BreadcrumbList:39,Offer:18,Service:39,CollectionPage:3,ItemList:3});
const unsafe={'@context':'https://schema.org',name:'</script><script>alert("x")</script> & <b>текст</b>'};
const safe=schemaScript(unsafe);
assert.equal((safe.match(/<\/script>/g)||[]).length,1,'No executable tag can escape JSON-LD');
assert.deepEqual(JSON.parse(safe.slice(safe.indexOf('>')+1,-9)),unsafe,'Escaping preserves structured data');
assert.equal(schemaScript(null),'');
console.log(`PASS: JSON-LD on ${documents.size} canonical pages; breadcrumbs, entity links, visible services, exact tariffs, appointment-based hours, deployment paths and script escaping.`);
