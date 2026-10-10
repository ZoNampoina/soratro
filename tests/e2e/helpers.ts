import {expect,type Page} from '@playwright/test';
import type {Project} from '../../src/music/model';
import {encodeProject} from '../../src/storage/project-file';
export async function loadScore(page:Page,project:Project){
  await page.goto('./');
  await page.locator('input[type=file]').setInputFiles({name:'qa.soratro',mimeType:'application/json',buffer:Buffer.from(await encodeProject(project))});
  await expect(page.locator('.project-title')).toContainText(project.title);
  await expect(page.locator('.save-state')).toContainText('Sauvegardé');
}

export async function currentProject(page:Page){
  await expect(page.locator('.save-state')).toContainText('Sauvegardé');
  return page.evaluate(()=>new Promise<any>((resolve,reject)=>{const request=indexedDB.open('soratro',2);request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,read=db.transaction('projects').objectStore('projects').get(decodeURIComponent(location.hash.slice(9)));read.onsuccess=()=>{resolve(read.result);db.close();};read.onerror=()=>reject(read.error);};}));
}
