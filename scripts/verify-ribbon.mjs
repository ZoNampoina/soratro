import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,expect} from '@playwright/test';
import {rhythmicScore} from '../tests/fixtures/rhythmic-score.ts';
import {encodeProject} from '../src/storage/project-file.ts';

const [before,after,output='tmp/ribbon-comparison']=process.argv.slice(2);
if(!before||!after)throw Error('Usage: node --experimental-strip-types scripts/verify-ribbon.mjs old-dist new-dist [output]');
const folder=resolve(output);await mkdir(folder,{recursive:true});let root=resolve(before);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.ttf':'font/ttf','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const relative=new URL(req.url,'http://localhost').pathname.slice('/soratro/'.length)||'index.html',file=resolve(root,decodeURIComponent(relative));if(!file.startsWith(root+'/'))throw Error('Invalid path');const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/soratro/`;
const browser=await chromium.launch({executablePath:process.env.SORATRO_CHROMIUM_PATH||undefined,args:['--no-sandbox']}),report=[];
const project=rhythmicScore(),file={name:'ribbon.soratro',mimeType:'application/json',buffer:Buffer.from(await encodeProject(project))};
try{
 for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:390,height:844},{width:740,height:390}]){
  const row={viewport};let reference;
  for(const [label,build] of [['before',before],['after',after]]){
   root=resolve(build);const context=await browser.newContext({viewport,serviceWorkers:'block',isMobile:viewport.width<761,hasTouch:viewport.width<761}),page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.locator('input[type=file]').setInputFiles(file);await expect(page.locator('.save-state')).toContainText('Sauvegardé');
   await page.getByRole('button',{name:'Partition',exact:true}).click();await page.getByRole('button',{name:'Mode clair',exact:true}).click();
   const notation=await page.locator('.composition .engraved-content svg').evaluateAll(nodes=>nodes.map(svg=>[...svg.querySelectorAll('text[data-note-id], [data-score-role="rhythm"],rect[data-measure]')].map(el=>({tag:el.tagName,text:el.textContent,x:el.getAttribute('x'),y:el.getAttribute('y'),width:el.getAttribute('width'),size:el.getAttribute('font-size'),path:el.getAttribute('d')}))));
   if(reference)assert.deepEqual(notation,reference,'Ribbon must preserve the score geometry.');else reference=notation;
   row[label]={scoreTop:(await page.locator('.composition .score-viewport').boundingBox()).y,notationUnchanged:true};
   if(label==='after'){
    await expect(page.getByRole('button',{name:'Lecture',exact:true})).toBeInViewport();await expect(page.getByRole('button',{name:'Enregistrer',exact:true})).toBeInViewport();
    await page.screenshot({path:resolve(folder,`ribbon-${viewport.width}-expanded.png`)});
    await page.getByRole('button',{name:'Rabattre le ruban'}).click();row.after.collapsedTop=(await page.locator('.composition .score-viewport').boundingBox()).y;
    await page.screenshot({path:resolve(folder,`ribbon-${viewport.width}-collapsed.png`)});
    await page.getByRole('button',{name:'Afficher le ruban'}).click();await page.getByRole('button',{name:'Composition',exact:true}).click();await page.getByRole('tab',{name:'Piano Roll',exact:true}).click();
    if(viewport.width>760)await page.screenshot({path:resolve(folder,`ribbon-${viewport.width}-composition.png`)});
    else{await page.getByRole('button',{name:'Groupes suivants',exact:true}).click();await expect.poll(()=>page.locator('.ribbon-body').evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);}
   }else await page.screenshot({path:resolve(folder,`before-${viewport.width}.png`)});
   assert.deepEqual(errors,[]);await context.close();
  }
  row.savedPixels=row.before.scoreTop-row.after.scoreTop;row.savedPercent=Math.round(100*row.savedPixels/row.before.scoreTop);report.push(row);
 }
 await writeFile(resolve(folder,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
