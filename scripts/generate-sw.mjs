import { readdirSync,readFileSync,writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);}
const pkg=JSON.parse(readFileSync('package.json','utf8'));let commit=process.env.GITHUB_SHA;try{commit??=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{commit??='local';}writeFileSync('dist/version.json',JSON.stringify({version:pkg.version,schemaVersion:2,commit,builtAt:new Date().toISOString()}));
const files=walk('dist').filter(x=>!x.endsWith('sw.js'));
const revision=createHash('sha256').update(files.map(x=>createHash('sha256').update(readFileSync(x)).digest('hex')).join('')).digest('hex').slice(0,12);
const urls=files.map(f=>'./'+f.slice(5));
// Only the public precached app files are matched; transport headers must not hide them offline.
writeFileSync('dist/sw.js',`const BASE=new URL('./',self.location.href);const PREFIX='soratro-'+encodeURIComponent(BASE.pathname)+'-';const CACHE=PREFIX+'${revision}';const ASSETS=${JSON.stringify(urls)}.map(path=>new URL(path,BASE).href);const SHELL=new URL('index.html',BASE).href;
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(error=>caches.delete(CACHE).then(()=>{throw error;}))));
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')e.waitUntil(self.skipWaiting());});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>{const scoped=keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE);const keep=scoped.at(-1);return Promise.all(scoped.filter(k=>k!==keep).map(k=>caches.delete(k)));}).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;e.respondWith((async()=>{const cache=await caches.open(CACHE);if(e.request.mode==='navigate'){return (await cache.match(SHELL))||fetch(e.request);}const hit=await cache.match(e.request,{ignoreSearch:true,ignoreVary:true});if(hit)return hit;for(const name of (await caches.keys()).filter(k=>k.startsWith(PREFIX)&&k!==CACHE).reverse()){const previous=await (await caches.open(name)).match(e.request,{ignoreSearch:true,ignoreVary:true});if(previous)return previous;}try{return await fetch(e.request);}catch{return new Response('Indisponible hors ligne',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}})());});
`);
console.log('SORATRO offline shell: '+urls.length+' assets, revision '+revision);
