import {test,expect} from '@playwright/test';

test('20 retours de Partition et Répétition conservent le Piano Roll, notes, sélection, zoom et zone observée',async({page})=>{
  await page.goto('./');await page.getByRole('button',{name:/^Ouvrir l’étude SATB/}).click();
  await page.getByRole('tab',{name:'Piano Roll',exact:true}).click();
  const roll=page.locator('.roll-viewport'),notes=roll.locator('[data-note-id]');
  await expect(notes).toHaveCount(96);
  await page.getByRole('button',{name:'Augmenter le zoom horizontal'}).click();
  await roll.evaluate(el=>{el.scrollLeft=220;el.scrollTop=1234;(el as any).__identity='persistent';});
  await page.locator('.roll-panel').press('Control+a');
  const size=await notes.first().locator('rect').first().getAttribute('width');
  for(let i=0;i<20;i++){
    await page.getByRole('button',{name:i%2?'Répétition':'Partition',exact:true}).click();
    await expect(page.locator('.score-viewport').first()).toBeVisible();
    await page.getByRole('button',{name:'Composition',exact:true}).click();
    await expect(roll).toBeVisible();
    expect(await roll.evaluate(el=>(el as any).__identity)).toBe('persistent');
    expect(await roll.evaluate(el=>({left:el.scrollLeft,top:el.scrollTop}))).toEqual({left:220,top:1234});
    await expect(notes).toHaveCount(96);await expect(roll.locator('.selected-note')).toHaveCount(24);
    expect(await notes.first().locator('rect').first().getAttribute('width')).toBe(size);
  }
  await page.setViewportSize({width:1024,height:768});await expect(roll).toBeVisible();
  expect((await roll.boundingBox())!.height).toBeGreaterThan(80);
  await page.setViewportSize({width:740,height:390});await expect(roll).toBeVisible();
  expect((await roll.boundingBox())!.height).toBeGreaterThan(25);
});
