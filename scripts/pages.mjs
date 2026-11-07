import {spawnSync} from 'node:child_process';
import {cp,lstat,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const docs=path.resolve(root,'docs');
const env={...process.env,SITE_URL:process.env.SITE_URL||'https://imperil03.github.io/artenergy/',SITE_NOINDEX:process.env.SITE_NOINDEX||'1'};
for(const script of ['build.mjs','check.mjs','test.mjs']){
  const result=spawnSync(process.execPath,[path.join(root,'scripts',script)],{cwd:root,env,stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
}
if(docs!==path.join(root,'docs')||!docs.startsWith(root+path.sep))throw new Error('Unsafe Pages output');
if((await lstat(docs).catch(()=>null))?.isSymbolicLink())throw new Error('Refusing to replace a linked Pages folder');
await rm(docs,{recursive:true,force:true});
await cp(path.join(root,'dist'),docs,{recursive:true});
console.log(`GitHub Pages output: ${docs}`);
