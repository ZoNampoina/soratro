import { readdirSync,readFileSync,writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);}
const files=walk('dist').filter(x=>!x.endsWith('sw.js'));
const revision=createHash('sha256').update(files.map(x=>createHash('sha256').update(readFileSync(x)).digest('hex')).join('')).digest('hex').slice(0,12);
const urls=files.map(f=>'./'+f.slice(5));
writeFileSync('dist/sw.js',`const BASE=new URL('./',self.location.href);const PREFIX='soratro-'+encodeURIComponent(BASE.pathname)+'-';const CACHE=PREFIX+'${revision}';const ASSETS=${JSON.stringify(urls)}.map(path=>new URL(path,BASE).href);const SHELL=new URL('index.html',BASE).href;
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;e.respondWith((async()=>{const cache=await caches.open(CACHE);if(e.request.mode==='navigate'){return (await cache.match(SHELL))||fetch(e.request);}const hit=await cache.match(e.request,{ignoreSearch:true});if(hit)return hit;try{return await fetch(e.request);}catch{return new Response('Indisponible hors ligne',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}})());});
`);
console.log('SORATRO offline shell: '+urls.length+' assets, revision '+revision);
