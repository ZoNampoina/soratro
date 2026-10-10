import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,expect} from '@playwright/test';

// Two real builds, one origin: exercise the existing Save & Update button, then cold offline restart.
const [oldBuild,newBuild,output='tmp/pwa-update']=process.argv.slice(2);
if(!oldBuild||!newBuild)throw new Error('Usage: node scripts/verify-pwa-update.mjs old-dist new-dist [output]');
const beforeRoot=resolve(oldBuild),afterRoot=resolve(newBuild),outputRoot=resolve(output);
await mkdir(outputRoot,{recursive:true});
let root=beforeRoot;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(!path.startsWith('/soratro/')){res.writeHead(404);res.end();return;}
  const relative=decodeURIComponent(path.slice('/soratro/'.length))||'index.html',file=resolve(root,relative);
  if(!file.startsWith(root+'/')){res.writeHead(404);res.end();return;}
  const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/soratro/';
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.SORATRO_CHROMIUM_PATH||undefined,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,acceptDownloads:true}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.getByRole('button',{name:/^Ouvrir l’étude SATB/}).click();
 await expect(page.locator('.save-state')).toContainText('Sauvegardé');
 await page.getByRole('tab',{name:'Piano Roll',exact:true}).click();await page.getByRole('button',{name:'Augmenter le zoom horizontal'}).click();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBeTruthy();
 await page.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.open('soratro',2);request.onsuccess=()=>{const db=request.result,tx=db.transaction('preferences','readwrite');tx.objectStore('preferences').put({value:'retained-through-update'},'qa-update-marker');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};request.onerror=()=>reject(request.error);}));
 const snapshot=()=>page.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.open('soratro',2);request.onsuccess=()=>{const db=request.result,tx=db.transaction(['projects','preferences']),projects=tx.objectStore('projects').getAll(),marker=tx.objectStore('preferences').get('qa-update-marker');tx.oncomplete=()=>{resolve({projects:projects.result,marker:marker.result});db.close();};tx.onerror=()=>reject(tx.error);};request.onerror=()=>reject(request.error);}));
 const before=await snapshot(),oldVersion=await page.evaluate(async()=>await (await fetch('version.json')).json()),oldCaches=await page.evaluate(()=>caches.keys());
 assert.equal(oldVersion.version,'0.5.0');assert.ok(before.projects[0].tracks.some(t=>t.events.length));
 root=afterRoot;
 await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update();});
 const update=page.getByRole('button',{name:'Sauvegarder & mettre à jour'});await expect(update).toBeVisible({timeout:20000});
 await page.screenshot({path:resolve(outputRoot,'update-ready.png')});
 await Promise.all([page.waitForNavigation(),update.click()]);
 await expect(page.locator('.save-state')).toContainText('Sauvegardé');
 await expect(page.locator('.editor-footer')).toContainText('0.6.0');
 const after=await snapshot();assert.deepEqual(after,before);
 const newVersion=await page.evaluate(async()=>await (await fetch('version.json')).json()),newCaches=await page.evaluate(()=>caches.keys());
 assert.equal(newVersion.version,'0.6.0');assert.ok(newCaches.some(key=>!oldCaches.includes(key)));
 await expect(page.locator('.roll-tools')).toContainText('120 %');
 await context.setOffline(true);await page.reload();await expect(page.locator('.save-state')).toContainText('Sauvegardé');
 assert.deepEqual(await snapshot(),before);assert.equal((await page.evaluate(async()=>await (await fetch('version.json')).json())).version,'0.6.0');
 await page.getByRole('button',{name:'PDF / Export',exact:true}).click();const dialog=page.locator('dialog');
 const downloading=page.waitForEvent('download');await dialog.getByRole('button',{name:'Exporter PDF',exact:true}).click();const pdf=await downloading;
 const file=resolve(outputRoot,'after-update-offline.pdf');await pdf.saveAs(file);assert.equal((await readFile(file)).subarray(0,5).toString(),'%PDF-');
 await page.screenshot({path:resolve(outputRoot,'after-update-offline.png')});assert.deepEqual(errors,[]);
 const report={from:oldVersion.version,to:newVersion.version,projectCount:before.projects.length,noteCount:before.projects.reduce((n,p)=>n+p.tracks.reduce((total,t)=>total+t.events.length,0),0),projectsAndMarkerPreserved:true,rollZoomPreserved:true,oldCaches,newCaches,coldOfflineRestart:true,offlinePdf:true,pageErrors:errors};
 await writeFile(resolve(outputRoot,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));await context.close();
}finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
