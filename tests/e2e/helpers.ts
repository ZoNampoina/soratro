import {expect,type Page} from '@playwright/test';
import type {Project} from '../../src/music/model';
import {encodeProject} from '../../src/storage/project-file';
export async function loadScore(page:Page,project:Project){
  await page.goto('./');
  await page.locator('.file-actions>input[type=file]').setInputFiles({name:'qa.soratro',mimeType:'application/json',buffer:Buffer.from(await encodeProject(project))});
  await expect(page.locator('.project-title')).toContainText(project.title);
  await expect(page.locator('.save-state')).toContainText('Sauvegardé');
}

export async function currentProject(page:Page){
  await expect(page.locator('.save-state')).toContainText('Sauvegardé');
  return page.evaluate(()=>new Promise<any>((resolve,reject)=>{const request=indexedDB.open('soratro',2);request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,read=db.transaction('projects').objectStore('projects').get(decodeURIComponent(location.hash.slice(9)));read.onsuccess=()=>{resolve(read.result);db.close();};read.onerror=()=>reject(read.error);};}));
}

/** Secondary project commands live in the compact header menu on small screens. */
export async function clickHeader(page:Page,name:string){
 const dialog=page.locator('dialog[open]');
 if(!await dialog.count()){
  const menu=page.locator('.header-project-menu');
  if(await menu.count()&&!await menu.evaluate(el=>el.hasAttribute('open')))await menu.locator('summary').click();
 }
 await page.getByRole('button',{name,exact:true}).click();
}
