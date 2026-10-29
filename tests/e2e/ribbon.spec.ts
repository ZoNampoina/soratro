import {clickHeader} from './helpers';
import {test,expect} from '@playwright/test';
import {loadScore,currentProject} from './helpers';
import {rhythmicScore} from '../fixtures/rhythmic-score';

for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:390,height:844},{width:740,height:390}]){
  test(`Command ribbon leaves room for the score at ${viewport.width}×${viewport.height}`,async({page},info)=>{
    await page.setViewportSize(viewport);await loadScore(page,rhythmicScore());
    await page.getByRole('button',{name:'Partition',exact:true}).click();
    const ribbon=page.getByRole('region',{name:'Ruban de commandes'}),score=page.locator('.composition .score-viewport');
    await expect(ribbon).toBeVisible();
    const expanded=(await score.boundingBox())!;
    expect(expanded.y).toBeLessThanOrEqual(190);
    expect(expanded.height).toBeGreaterThan(viewport.height-240);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(viewport.width);
    await expect(page.getByRole('group',{name:'Partition',exact:true})).toBeVisible();
    // Offscreen groups stay reachable through the ribbon's own scroll area.
    await page.getByLabel('Source d’enregistrement').selectOption('midi');
    await page.getByLabel('Source d’enregistrement').selectOption('keyboard');
    await page.getByRole('button',{name:'Rabattre le ruban'}).click();
    await expect(page.locator('#ribbon-context')).toBeHidden();
    for(const name of ['Lecture','Stop','Enregistrer','Aller à…'])await expect(page.getByRole('button',{name,exact:true})).toBeInViewport();
    const collapsed=(await score.boundingBox())!;expect(collapsed.y).toBeLessThan(expanded.y-25);
    // A dialog opened from the compact ribbon keeps its original field typography.
    await page.getByRole('button',{name:'Aller à…',exact:true}).click();
    const cursor=page.getByRole('dialog');
    expect(await cursor.getByLabel('Mesure du curseur').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
    await cursor.getByRole('button',{name:'Annuler',exact:true}).click();
    await page.screenshot({path:info.outputPath('ribbon-collapsed.png')});
    await page.getByRole('button',{name:'Afficher le ruban'}).click();
    await page.getByRole('tab',{name:'Mise en page de la partition'}).click();
    await expect(page.getByRole('heading',{name:'Mise en page de la partition'})).toBeVisible();
    await page.getByRole('button',{name:'Fermer',exact:true}).first().click();
    await clickHeader(page,'Mode clair');
    await page.screenshot({path:info.outputPath('ribbon-expanded.png')});
  });
}

test('Ribbon groups keep commands, project contents and saved collapse preference',async({page})=>{
  await loadScore(page,rhythmicScore());const before=await currentProject(page);
  await page.getByRole('tab',{name:'Piano Roll',exact:true}).click();
  await page.getByRole('button',{name:'Mesures',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Éditeur de mesures'})).toBeVisible();await page.getByRole('button',{name:'Fermer',exact:true}).first().click();
  await page.getByRole('button',{name:'Partition',exact:true}).click();
  await page.getByRole('button',{name:'Symboles',exact:true}).click();await expect(page.locator('.symbol-dialog')).toBeVisible();await page.getByRole('button',{name:'Fermer',exact:true}).first().click();
  await page.getByRole('button',{name:'Répétition',exact:true}).click();await expect(page.getByLabel('Apprendre la voix')).toBeVisible();
  await page.getByRole('button',{name:'Partition',exact:true}).dblclick();await expect(page.locator('#ribbon-context')).toBeHidden();
  await page.waitForTimeout(250);await page.reload();await expect(page.getByRole('button',{name:'Afficher le ruban'})).toHaveAttribute('aria-expanded','false');
  expect((await currentProject(page)).tracks).toEqual(before.tracks);expect((await currentProject(page)).layout).toEqual(before.layout);
  await page.getByRole('button',{name:'Lecture',exact:true}).click();await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeVisible();await page.getByRole('button',{name:'Stop',exact:true}).click();
  await page.getByRole('button',{name:'Afficher le ruban'}).click();await expect(page.getByRole('tab',{name:'Édition de la partition'})).toBeVisible();
});
