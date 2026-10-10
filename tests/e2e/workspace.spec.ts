import {test,expect,type Page} from '@playwright/test';
import {loadScore} from './helpers';
import {largeScore} from '../fixtures/large-score';

test('Twenty mode changes preserve Piano Roll, zoom, both scroll axes, track and selection',async({page})=>{
  await page.goto('./');await page.getByRole('button',{name:/^Ouvrir l’étude SATB/}).click();
  await page.getByRole('tab',{name:'Piano Roll',exact:true}).click();
  await page.getByRole('button',{name:'Augmenter le zoom horizontal'}).click();
  await page.locator('.roll-viewport').evaluate(el=>{el.scrollLeft=120;el.scrollTop=1200;});
  const initial=await page.locator('.roll-viewport').evaluate(el=>({top:el.scrollTop,left:el.scrollLeft}));
  const note=page.locator('.roll-event:not(.ghost-event)').first();
  await note.dispatchEvent('pointerdown',{pointerId:1,button:0,ctrlKey:true});
  const selected=await page.locator('.roll-event.selected-note').getAttribute('data-note-id');
  for(let i=0;i<20;i++){
    await page.getByRole('button',{name:i%2?'Répétition':'Partition',exact:true}).click();
    await page.getByRole('button',{name:'Composition',exact:true}).click();
    await expect(page.locator('.roll-viewport')).toBeVisible();
    expect(await page.locator('.roll-viewport').evaluate(el=>({top:el.scrollTop,left:el.scrollLeft}))).toEqual(initial);
    await expect(page.locator('.roll-tools')).toContainText('120 %');
    await expect(page.locator('.roll-event.selected-note')).toHaveAttribute('data-note-id',selected!);
  }
  expect((await page.locator('.roll-viewport').boundingBox())!.height).toBeGreaterThan(100);
});

test('Panel space, exact immersion restore, resizing and device preferences survive a reload',async({page})=>{
  await page.goto('./');await page.getByRole('button',{name:/^Ouvrir l’étude SATB/}).click();
  await page.getByRole('tab',{name:'Piano Roll',exact:true}).click();
  const height=(await page.locator('.roll-viewport').boundingBox())!.height;
  await page.getByRole('button',{name:'Masquer le clavier piano'}).click();
  expect((await page.locator('.roll-viewport').boundingBox())!.height).toBeGreaterThan(height+120);
  await page.getByRole('button',{name:'État du panneau des pistes'}).click();
  await expect(page.locator('.tracks-panel')).toHaveClass(/compact-tracks/);
  await page.getByRole('button',{name:'Rabattre le ruban'}).click();
  const before=await page.locator('.roll-viewport').boundingBox();
  await page.keyboard.press('F10');await expect(page.locator('.app')).toHaveAttribute('data-immersion','true');
  await page.keyboard.press('Escape');await expect(page.locator('.app')).toHaveAttribute('data-immersion','false');
  expect(await page.locator('.roll-viewport').boundingBox()).toEqual(before);
  await expect(page.locator('.piano-dock')).toBeHidden();await expect(page.locator('.tracks-panel')).toHaveClass(/compact-tracks/);
  await page.getByRole('button',{name:'État du panneau des pistes'}).click();
  await page.getByRole('button',{name:'Réafficher les pistes'}).click();
  const resize=page.getByRole('separator',{name:'Largeur des pistes'});await resize.focus();await page.keyboard.press('ArrowRight');
  const width=(await page.locator('.tracks-panel').boundingBox())!.width;
  await page.waitForTimeout(250);await page.reload();
  expect((await page.locator('.tracks-panel').boundingBox())!.width).toBe(width);
  await expect(page.locator('.piano-dock')).toBeHidden();
});

test('100-measure score: last page, responsive export, dynamic paper, page navigation and desktop resize',async({page},info)=>{
  const p=largeScore();const started=Date.now();
  await loadScore(page,p);await page.getByRole('button',{name:'Partition',exact:true}).click();
  const loadedMs=Date.now()-started,pages=await page.locator('.composition .engraved-page').count();expect(pages).toBeGreaterThanOrEqual(10);await info.attach('100-measures-performance',{body:JSON.stringify({loadedMs,notes:2400,pages}),contentType:'application/json'});
  await page.locator('.composition .score-viewport').evaluate(el=>{el.scrollTop=el.scrollHeight;});
  await expect(page.locator('.composition .engraved-page').last()).toBeInViewport();
  await page.getByRole('button',{name:'PDF / Export'}).click();
  const dialog=page.locator('dialog');const bounds=(await dialog.boundingBox())!;
  expect(bounds.width).toBeGreaterThan(900);expect(bounds.y).toBeGreaterThanOrEqual(12);expect(bounds.y+bounds.height).toBeLessThanOrEqual(948);
  const preview=dialog.locator('.export-preview');expect((await preview.boundingBox())!.width).toBeGreaterThan(500);
  await dialog.getByLabel('Orientation',{exact:true}).selectOption('landscape');
  let svg=dialog.locator('.engraved-content svg').first();expect(Number(await svg.getAttribute('width'))).toBeGreaterThan(Number(await svg.getAttribute('height')));
  await dialog.getByLabel('Papier',{exact:true}).selectOption('A5');await dialog.getByLabel('Marges (mm)').fill('10');await dialog.getByLabel('Mesures par ligne',{exact:true}).fill('2');
  await dialog.getByRole('button',{name:'Page suivante'}).click();await expect(dialog.locator('.page-count')).toContainText('Page 2');
  const waiting=page.waitForEvent('download');await dialog.getByRole('button',{name:'Exporter PDF'}).click();await (await waiting).saveAs(info.outputPath('100-mesures.pdf'));
  // Native CSS resize handles keep the footer outside both scrollable columns.
  const box=(await dialog.boundingBox())!;await page.mouse.move(box.x+box.width-3,box.y+box.height-3);await page.mouse.down();await page.mouse.move(box.x+760,box.y+540,{steps:8});await page.mouse.up();
  await expect(dialog.getByRole('button',{name:'Exporter PDF'})).toBeInViewport();await expect(dialog.getByRole('button',{name:'Annuler',exact:true})).toBeInViewport();
  const currentPaper=await dialog.locator('.engraved-page').nth(1).boundingBox(),visibleArea=await dialog.locator('.score-viewport').boundingBox();expect(currentPaper!.y).toBeGreaterThanOrEqual(visibleArea!.y);expect(currentPaper!.y+currentPaper!.height).toBeLessThanOrEqual(visibleArea!.y+visibleArea!.height+1);
  await page.screenshot({path:info.outputPath('export-desktop.png')});
  await dialog.getByRole('button',{name:'Fermer',exact:true}).click();await page.getByRole('button',{name:'PDF / Export'}).click();await expect(page.locator('dialog').getByLabel('Papier')).toHaveValue('A5');
});

for(const viewport of [{width:390,height:844},{width:740,height:390}])test('Export controls and settings remain accessible at '+viewport.width+'×'+viewport.height,async({browser},info)=>{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});const page=await context.newPage();
  await page.goto('http://127.0.0.1:4176/soratro/');await page.getByRole('button',{name:/^Ouvrir l’étude SATB/}).click();await page.getByRole('button',{name:'PDF / Export'}).click();
  const dialog=page.locator('dialog');await expect(dialog.getByRole('button',{name:'Exporter PDF'})).toBeInViewport();
  if(viewport.width<=760){await expect(dialog.locator('.export-preview')).toBeVisible();await dialog.getByRole('button',{name:'Paramètres de l’export'}).click();}
  await dialog.getByLabel('Papier').selectOption('A5');await dialog.getByLabel('Orientation').selectOption('landscape');
  await dialog.locator('.export-settings').evaluate(el=>{el.scrollTop=el.scrollHeight;});await expect(dialog.getByRole('button',{name:'Exporter PDF'})).toBeInViewport();
  if(viewport.width<=760)await dialog.getByRole('button',{name:'Paramètres de l’export'}).click();
  await page.screenshot({path:info.outputPath('export-mobile.png')});await context.close();
});


test('Vocal source keeps optional audio controls collapsed and the Piano Roll usable',async({page})=>{
  await page.setViewportSize({width:1440,height:800});
  await page.goto('./');
  await page.getByRole('button',{name:/^Ouvrir l’étude SATB/}).click();
  await page.getByLabel('Source d’enregistrement').selectOption('vocal');
  const extras=page.locator('.vocal-storage');
  await expect(extras).toBeVisible();
  await expect(extras).not.toHaveAttribute('open','');
  const roll=page.locator('.roll-viewport');
  await expect(roll).toBeVisible();
  expect((await roll.boundingBox())!.height).toBeGreaterThan(200);
  await page.locator('.vocal-storage > summary').click();
  await expect(page.getByLabel('Conserver l’audio original')).toBeVisible();
});
