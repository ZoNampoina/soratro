import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

for(const base of ['/','/soratro/'])test('L — cold offline restart and precached resources at '+base,async()=>{
  const listeners=new Map<string,(event:any)=>void>();const origin='https://zonampoina.github.io';let network=true;let fetchCalls=0;
  const files=new Map<string,Response>();function walk(path:string){for(const f of readdirSync(path,{withFileTypes:true})){const p=join(path,f.name);if(f.isDirectory())walk(p);else files.set(origin+base+p.slice(5),new Response(readFileSync(p)));}}walk('dist');
  const keyOf=(request:string|{url:string},ignoreSearch=false)=>{const url=new URL(typeof request==='string'?request:request.url,origin+base);if(ignoreSearch)url.search='';return url.href;};
  const buckets=new Map<string,Map<string,Response>>();const cacheApi={async keys(){return [...buckets.keys()];},async delete(key:string){return buckets.delete(key);},async open(key:string){if(!buckets.has(key))buckets.set(key,new Map());const bucket=buckets.get(key)!;return {async addAll(urls:string[]){for(const url of urls){if(!network)throw new Error('Offline');const file=files.get(keyOf(url));assert.ok(file,'Missing precache asset '+url);bucket.set(keyOf(url),file.clone());}},async match(request:string|{url:string},{ignoreSearch=false}={}){return bucket.get(keyOf(request,ignoreSearch))?.clone();}};}};
  let skipped=0;const self={location:{origin,href:origin+base+'sw.js'},addEventListener:(name:string,fn:(e:any)=>void)=>listeners.set(name,fn),skipWaiting:async()=>{skipped++;},clients:{claim:async()=>{}}};
  const context=vm.createContext({self,caches:cacheApi,Response,URL,fetch:async(req:{url:string})=>{fetchCalls++;if(!network)throw new TypeError('No network');return files.get(keyOf(req))?.clone()??new Response('not found',{status:404});}});
  vm.runInContext(readFileSync('dist/sw.js','utf8'),context);
  let pending:Promise<unknown>=Promise.resolve();listeners.get('install')!({waitUntil(p:Promise<unknown>){pending=p;}});await pending;
  assert.equal(skipped,0,'An update must wait for a saved, explicit activation');listeners.get('message')!({data:{type:'SKIP_WAITING'},waitUntil(p:Promise<unknown>){pending=p;}});await pending;assert.equal(skipped,1);
  const old='soratro-'+encodeURIComponent(base)+'-old';const other='soratro-'+encodeURIComponent('/diart/')+'-existing';buckets.set(old,new Map([[origin+base+'assets/old-lazy.js',new Response('old lazy bundle')]]));const obsolete=old+'-obsolete';buckets.set(obsolete,new Map());const previous=buckets.get(old)!;buckets.delete(old);buckets.set(old,previous);buckets.set(other,new Map());listeners.get('activate')!({waitUntil(p:Promise<unknown>){pending=p;}});await pending;assert.equal(buckets.has(obsolete),false);assert.equal(buckets.has(old),true,'Previous cache stays available for tabs running the older bundle');assert.equal(buckets.has(other),true,'Another application’s cache must be preserved');
  network=false;async function request(path:string,mode='cors'){let result:Promise<Response>|undefined;listeners.get('fetch')!({request:{method:'GET',url:origin+path,mode},respondWith(p:Promise<Response>){result=p;}});return result?await result:undefined;}
  assert.equal(await (await request(base+'assets/old-lazy.js'))!.text(),'old lazy bundle');
  const response=await request(base+'?offline-check','navigate');assert.equal(response?.status,200);assert.ok((await response!.text()).includes('SORATRO'));
  for(const url of files.keys()){if(url.endsWith('/sw.js'))continue;const r=await request(new URL(url).pathname+'?cache-check');assert.equal(r?.status,200,'Missing offline asset '+url);assert.ok((await r!.arrayBuffer()).byteLength>0);}
  assert.equal(fetchCalls,0,'An offline restart must not depend on a server');assert.equal((await request(base+'uncached-resource'))?.status,503);
  if(base!=='/')assert.equal(await request('/diart/','navigate'),undefined,'The worker must not intercept another GitHub Pages project');
});

test('PWA identity, icons and navigation remain inside the application directory',()=>{
  const manifest=JSON.parse(readFileSync('dist/manifest.webmanifest','utf8'));assert.equal(manifest.name,'SORATRO');assert.equal(manifest.display,'standalone');assert.equal(manifest.id,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.ok(manifest.icons.some((i:any)=>i.purpose==='maskable'));for(const icon of manifest.icons){assert.ok(icon.src.startsWith('./'));assert.ok(readFileSync(join('dist',icon.src)).length>0);}
  const html=readFileSync('dist/index.html','utf8');const base=html.match(/href="([^"]*)manifest\.webmanifest"/)?.[1];assert.ok(base==='/'||base==='/soratro/');for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){assert.ok(match[1].startsWith(base!),'Asset escapes deployment directory: '+match[1]);assert.ok(readFileSync(join('dist',match[1].slice(base!.length))).length>0);}
  assert.ok(!html.includes('fonts.googleapis'));assert.ok(!html.match(/src="https?:/));
});
