import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
test('L — built service worker precaches shell, serves a cold navigation and all assets with the network unavailable',async()=>{
  const listeners=new Map<string,(event:any)=>void>();const origin='https://soratro.test';let network=true;let fetchCalls=0;
  const files=new Map<string,Response>();function walk(path:string){for(const f of readdirSync(path,{withFileTypes:true})){const p=join(path,f.name);if(f.isDirectory())walk(p);else files.set('/'+p.slice(5),new Response(readFileSync(p)));}}walk('dist');
  const buckets=new Map<string,Map<string,Response>>();const cacheApi={async keys(){return [...buckets.keys()];},async delete(key:string){return buckets.delete(key);},async open(key:string){if(!buckets.has(key))buckets.set(key,new Map());const bucket=buckets.get(key)!;return {async addAll(urls:string[]){for(const url of urls){if(!network)throw new Error('Offline');const file=files.get(url);assert.ok(file,'Missing precache asset '+url);bucket.set(url,file.clone());}},async match(request:string|{url:string},{ignoreSearch=false}={}){const raw=typeof request==='string'?request:new URL(request.url).pathname;const key=ignoreSearch?raw.split('?')[0]:raw;return bucket.get(key)?.clone();}};}};
  const self={location:{origin},addEventListener:(name:string,fn:(e:any)=>void)=>listeners.set(name,fn),skipWaiting:async()=>{},clients:{claim:async()=>{}}};
  const context=vm.createContext({self,caches:cacheApi,Response,URL,fetch:async(req:{url:string})=>{fetchCalls++;if(!network)throw new TypeError('No network');return files.get(new URL(req.url).pathname)?.clone()??new Response('not found',{status:404});}});
  vm.runInContext(readFileSync('dist/sw.js','utf8'),context);
  let pending:Promise<unknown>=Promise.resolve();listeners.get('install')!({waitUntil(p:Promise<unknown>){pending=p;}});await pending;
  buckets.set('soratro-old',new Map());listeners.get('activate')!({waitUntil(p:Promise<unknown>){pending=p;}});await pending;assert.equal(buckets.has('soratro-old'),false);
  network=false;async function request(path:string,mode='cors'){let result:Promise<Response>|undefined;listeners.get('fetch')!({request:{method:'GET',url:origin+path,mode},respondWith(p:Promise<Response>){result=p;}});return await result!;}
  const response=await request('/?offline-check','navigate');assert.equal(response.status,200);const html=await response.text();assert.ok(html.includes('SORATRO'));const assetPaths=[...html.matchAll(/(?:src|href)="(\/[^\"]+)"/g)].map(x=>x[1]);for(const path of assetPaths){const r=await request(path);assert.equal(r.status,200);assert.ok((await r.arrayBuffer()).byteLength>0);}assert.equal(fetchCalls,0,'An offline restart must not depend on a server');const missing=await request('/uncached-resource');assert.equal(missing.status,503);
});
test('PWA identity and local-only assets are correctly declared',()=>{const manifest=JSON.parse(readFileSync('dist/manifest.webmanifest','utf8'));assert.equal(manifest.name,'SORATRO');assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'/');assert.ok(manifest.icons.some((i:any)=>i.purpose==='maskable'));for(const icon of manifest.icons)assert.ok(readFileSync('dist'+icon.src).length>0);const html=readFileSync('dist/index.html','utf8');assert.ok(!html.includes('fonts.googleapis'));assert.ok(!html.match(/src="https?:/));});
