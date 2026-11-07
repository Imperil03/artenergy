import {mkdir,readFile,writeFile,rm,cp,lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {homePage,menuPage,contactsPage,eventPage,spaRedirect,errorPage} from '../src/templates.mjs';
import {spaPage} from '../src/spa-page.mjs';
import {spaProceduresPage} from '../src/spa-procedures-page.mjs';
import {birthdayPage} from '../src/birthday-page.mjs';
import {childrenPartyPage} from '../src/children-page.mjs';
import {editorialEventKeys,editorialEventPage} from '../src/event-editorial-pages.mjs';
import {sectionPage} from '../src/section-pages.mjs';
import {locales,events,spaServices,pathFor,legacySpaPath,origin} from '../src/model.mjs';
import {basePath,noIndex,publishHtml,publishCss} from '../src/deployment.mjs';
import {stylesheets,clientScripts} from './client-files.mjs';
import {resourcePaths} from './resource-urls.mjs';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const output=path.resolve(root,'dist');
const buildDate='2026-11-07';
function renderEvent(event,lang){
  if(event.key==='event-0')return birthdayPage(lang);
  if(event.key==='event-1')return childrenPartyPage(lang);
  if(editorialEventKeys.includes(event.key))return editorialEventPage(event.key,lang);
  return eventPage(event,lang);
}
export async function build(){
  const pages=[];
  for(const lang of locales){
    pages.push({path:pathFor('home',lang),lang,key:'home',html:homePage(lang)});
    for(const key of ['venue','events','stay'])pages.push({path:pathFor(key,lang),lang,key,html:sectionPage(key,lang)});
    pages.push({path:pathFor('menu',lang),lang,key:'menu',html:menuPage(lang)});
    pages.push({path:pathFor('contacts',lang),lang,key:'contacts',html:contactsPage(lang)});
    for(const event of events)pages.push({path:pathFor(event.key,lang),lang,key:event.key,html:renderEvent(event,lang)});
    pages.push({path:pathFor('spa',lang),lang,key:'spa',html:spaPage(lang)});
    pages.push({path:pathFor('spa-treatments',lang),lang,key:'spa-treatments',html:spaProceduresPage(lang)});
    for(const service of spaServices)pages.push({path:legacySpaPath(service.index,lang),lang,key:service.key,redirectTo:pathFor(service.key,lang),html:spaRedirect(service,lang)});
    pages.push({path:pathFor('404',lang),lang,key:'404',html:errorPage(lang)});
  }
  for(const page of pages)page.html=publishHtml(page.html);
  // Only the generated dist directory inside this app is ever removed.
  if(output!==path.join(root,'dist')||!output.startsWith(root+path.sep))throw new Error('Unsafe output path');
  const outputInfo=await lstat(output).catch(()=>null);
  if(outputInfo?.isSymbolicLink())throw new Error('Refusing to replace a symlinked dist directory');
  await rm(output,{recursive:true,force:true});
  await mkdir(output,{recursive:true});
  const styles=await Promise.all(stylesheets.map(file=>readFile(path.join(root,'src/client',file),'utf8')));
  const css=publishCss(styles.join('\n'));
  const publicRoot=path.join(root,'public');
  const resources=resourcePaths(pages,css,origin,basePath);
  resources.add('/fonts/OFL.txt');
  const assetFiles=[];
  for(const route of [...resources].sort()){
    const source=path.resolve(publicRoot,'.'+route);
    if(!source.startsWith(publicRoot+path.sep)||source.endsWith('.webp.json'))continue;
    if(!(await lstat(source).catch(()=>null))?.isFile())continue;
    const target=path.resolve(output,'.'+route);
    if(!target.startsWith(output+path.sep))throw new Error('Unsafe resource path');
    await mkdir(path.dirname(target),{recursive:true});
    await cp(source,target);
    const data=await readFile(source);
    assetFiles.push({path:route,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
  }
  await writeFile(path.join(output,'styles.css'),css);
  const scripts=await Promise.all(clientScripts.map(file=>readFile(path.join(root,'src/client',file),'utf8')));
  const javascript=scripts.join('\n\n');
  await writeFile(path.join(output,'app.js'),javascript);
  const bundles=[['/styles.css',css],['/app.js',javascript]].map(([path,content])=>({path,bytes:Buffer.byteLength(content),sha256:createHash('sha256').update(content).digest('hex')}));
  for(const page of pages){
    const relative=page.path.endsWith('/')?page.path.slice(1)+'index.html':page.path.slice(1);
    const target=path.resolve(output,relative);
    if(!target.startsWith(output+path.sep))throw new Error('Unsafe page path');
    await mkdir(path.dirname(target),{recursive:true});
    await writeFile(target,page.html,'utf8');
  }
  const livePages=pages.filter(p=>p.key!=='404'&&!p.redirectTo);
  const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${livePages.map(p=>`\n<url><loc>${origin+p.path}</loc><lastmod>${buildDate}</lastmod>${locales.map(l=>`<xhtml:link rel="alternate" hreflang="${l}" href="${origin+pathFor(p.key,l)}"/>`).join('')}</url>`).join('')}\n</urlset>\n`;
  await writeFile(path.join(output,'sitemap.xml'),sitemap);
  await writeFile(path.join(output,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
  const manifests=pages.map(({path,lang,key,redirectTo,html})=>({path,lang,key,...(redirectTo?{redirectTo}:{}),sha256:createHash('sha256').update(html).digest('hex')}));
  await writeFile(path.join(output,'.nojekyll'),'');
  await writeFile(path.join(root,'build-manifest.json'),JSON.stringify({builtAt:new Date().toISOString(),siteUrl:origin,basePath,noIndex,assetFiles,bundles,pages:manifests},null,2));
  console.log(`Built ${pages.length} HTML pages (${locales.join(', ')}) to ${output}`);
  return pages;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build();
