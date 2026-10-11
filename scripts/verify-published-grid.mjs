import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,expect} from '@playwright/test';
import {rhythmicScore} from '../tests/fixtures/rhythmic-score.ts';
import {encodeProject} from '../src/storage/project-file.ts';
import {engraveProject} from '../src/score/engraving.ts';

const [commit,folder='tmp/published-v07']=process.argv.slice(2);if(!commit)throw Error('Usage: node --experimental-strip-types scripts/verify-published-grid.mjs deployed-commit [output]');
const output=resolve(folder),url='https://zonampoina.github.io/soratro/';await mkdir(output,{recursive:true});
const proxyUrl=process.env.HTTPS_PROXY||process.env.https_proxy;let proxy;if(proxyUrl){const p=new URL(proxyUrl);proxy={server:p.protocol+'//'+p.host,...(p.username?{username:decodeURIComponent(p.username),password:decodeURIComponent(p.password)}:{})};}
const browser=await chromium.launch({executablePath:process.env.SORATRO_CHROMIUM_PATH||undefined,args:['--no-sandbox','--ignore-certificate-errors'],...(proxy?{proxy}:{})});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,acceptDownloads:true,ignoreHTTPSErrors:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{timeout:30000});const version=await page.evaluate(async()=>await(await fetch('version.json',{cache:'no-store'})).json());assert.equal(version.version,'0.7.0');assert.equal(version.commit,commit);
 const p=rhythmicScore();p.layout.punctuation={style:'custom',size:1.05,contrast:.95,weight:1.65,gap:2.25};const document=engraveProject(p);assert.deepEqual(document.warnings,[]);
 await page.locator('input[type=file]').setInputFiles({name:'published-grid.soratro',mimeType:'application/json',buffer:Buffer.from(await encodeProject(p))});await expect(page.locator('.save-state')).toContainText('Sauvegardé');await page.getByRole('button',{name:'Partition',exact:true}).click();
 const root=page.locator('.composition'),notes=root.locator('text[data-note-id]');await expect(notes).toHaveCount(116);assert.deepEqual(await notes.evaluateAll(nodes=>[...new Set(nodes.map(n=>n.getAttribute('font-size')))]),['20']);
 const columns=await root.locator('rect[aria-label^="Mesure "]').evaluateAll(nodes=>nodes.map(n=>({measure:+n.getAttribute('data-measure'),x:+n.getAttribute('x'),width:+n.getAttribute('width')})));assert.equal(columns.length,7);for(let i=4;i<7;i++){assert.equal(columns[i].x,columns[i-4].x);assert.equal(columns[i].width,columns[i-4].width);}
 const actual=await root.locator('[data-score-role="rhythm"]').evaluateAll(async nodes=>{await document.fonts.ready;const bounds={':':[240/2048,451/2048],'.':[219/2048,430/2048],',':[158/2048,451/2048]};return nodes.map(el=>{const a=+el.getAttribute('data-time-x'),size=+el.getAttribute('font-size'),b=bounds[el.textContent],box=el.getBBox();return {track:el.getAttribute('data-track-id'),beat:+el.getAttribute('data-score-beat'),kind:el.getAttribute('data-rhythm-kind'),x:a,center:b?+el.getAttribute('x')+(b[0]+b[1])*size/2:box.x+box.width/2};});});
 const expected=document.pages.flatMap(p=>p.ops).filter(o=>o.role==='rhythm');assert.equal(actual.length,expected.length);actual.forEach((o,i)=>{assert.equal(o.track,expected[i].trackId);assert.equal(o.beat,expected[i].beat);assert.ok(Math.abs(o.x-expected[i].timeX)<.001);assert.ok(Math.abs(o.center-o.x)<.002);});for(const beat of [1,2,3])assert.equal(new Set(actual.filter(o=>o.beat===beat&&o.kind==='pulse').map(o=>o.x)).size,1);
 const stored=()=>page.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.open('soratro',2);request.onsuccess=()=>{const db=request.result,tx=db.transaction('projects'),read=tx.objectStore('projects').getAll();tx.oncomplete=()=>{resolve(read.result);db.close();};tx.onerror=()=>reject(tx.error);};request.onerror=()=>reject(request.error);}));
 const before=await stored();await root.getByLabel('Zoom de la partition (%)').fill('150');assert.deepEqual(await stored(),before);
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller),{timeout:30000}).toBeTruthy();
 await page.getByRole('button',{name:'PDF / Export',exact:true}).click();const dialog=page.locator('dialog');
 for(const format of ['PDF','SVG','PNG']){const waiting=page.waitForEvent('download');await dialog.getByRole('button',{name:format==='PDF'?'Exporter PDF':format,exact:true}).click();await(await waiting).saveAs(resolve(output,'published-grid.'+format.toLowerCase()));}
 await page.screenshot({path:resolve(output,'published-mobile-export.png')});await dialog.getByRole('button',{name:'Annuler',exact:true}).click();
 await context.setOffline(true);await page.reload();await expect(page.locator('.save-state')).toContainText('Sauvegardé');assert.deepEqual(await stored(),before);await expect(page.locator('.editor-footer')).toContainText('0.7.0');
 await page.getByRole('button',{name:'PDF / Export',exact:true}).click();const waiting=page.waitForEvent('download');await page.locator('dialog').getByRole('button',{name:'Exporter PDF',exact:true}).click();await(await waiting).saveAs(resolve(output,'published-offline.pdf'));assert.equal((await readFile(resolve(output,'published-offline.pdf'))).subarray(0,5).toString(),'%PDF-');await page.locator('dialog').getByRole('button',{name:'Annuler',exact:true}).click();
 await page.getByRole('tab',{name:'Mise en page de la partition'}).click();await page.screenshot({path:resolve(output,'published-mobile-layout.png')});assert.deepEqual(errors,[]);
 const report={url,version,measures:7,notes:116,noteSize:20,punctuation:p.layout.punctuation,columns,sharedPulseAnchors:true,exactHalvesQuartersThirds:true,maxSerializedAnchorErrorPx:Math.max(...actual.map((o,i)=>Math.abs(o.x-expected[i].timeX))),screenZoomDoesNotChangeProject:true,publicPdf:true,publicSvg:true,publicPng:true,publicColdOfflineReload:true,publicOfflinePdf:true,cacheNames:await page.evaluate(()=>caches.keys()),pageErrors:errors};await writeFile(resolve(output,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));await context.close();
}finally{await browser.close();}
