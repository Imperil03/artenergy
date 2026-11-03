import http from 'node:http';
import {createReadStream,watch} from 'node:fs';
import {stat,readFile} from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {build,root,output} from './build.mjs';
const run=promisify(execFile);

await build();
const portArg=process.argv.indexOf('--port');
const port=portArg>=0?Number(process.argv[portArg+1]):4173;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.mp4':'video/mp4','.ttf':'font/ttf','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  try{
    const url=new URL(req.url,'http://127.0.0.1');
    const pathname=decodeURIComponent(url.pathname);
    let file=path.resolve(output,'.'+pathname);
    if(file!==output&&!file.startsWith(output+path.sep)){res.writeHead(403);res.end();return;}
    let info=await stat(file).catch(()=>null);
    if(info?.isDirectory()){
      if(!pathname.endsWith('/')){res.writeHead(301,{Location:url.pathname+'/'+url.search});res.end();return;}
      file=path.join(file,'index.html');info=await stat(file).catch(()=>null);
    }
    if(!info?.isFile()){
      const locale=pathname.startsWith('/en/')?'en/':pathname.startsWith('/es/')?'es/':'';
      res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});
      res.end(req.method==='HEAD'?'':await readFile(path.join(output,locale+'404.html')));return;
    }
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.setHeader('Accept-Ranges','bytes');
    let start=0,end=info.size-1;
    const range=req.headers.range;
    if(range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(range);
      if(!match){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
      if(match[1]){start=Number(match[1]);end=match[2]?Number(match[2]):end;}
      else if(match[2])start=Math.max(0,info.size-Number(match[2]));
      if(start>end||start>=info.size||end>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
      res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${info.size}`);
    }
    res.setHeader('Content-Length',end-start+1);
    if(req.method==='HEAD'){res.end();return;}
    const stream=createReadStream(file,{start,end});
    stream.on('error',()=>{if(!res.headersSent)res.writeHead(500);res.end();});
    res.on('close',()=>stream.destroy());stream.pipe(res);
  }catch{if(!res.headersSent)res.writeHead(400);res.end();}
});
server.listen(port,'127.0.0.1',()=>console.log(`ArtEnergy preview: http://127.0.0.1:${port}/`));
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
let timer,building=false,queued=false;
async function rebuild(){
  if(building){queued=true;return;}
  building=true;
  try{const result=await run(process.execPath,[path.join(root,'scripts/build.mjs')],{cwd:root});process.stdout.write(result.stdout);}catch(error){console.error('Build failed:',error.stderr||error.message);}
  finally{building=false;if(queued){queued=false;await rebuild();}}
}
for(const directory of ['src','public'])watch(path.join(root,directory),{recursive:true},()=>{clearTimeout(timer);timer=setTimeout(rebuild,200);});
