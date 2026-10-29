import {clickHeader} from './helpers';
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {createProject,makeNote} from '../../src/music/model';
import {loadScore,currentProject} from './helpers';

for(const mobile of [false,true])for(const voices of [1,4])test(`A4 density, exact paper and multipage PDF persist with ${voices} voices on ${mobile?'Android viewport':'desktop'}`,async({browser},info)=>{
 const viewport=mobile?{width:390,height:844}:{width:1440,height:1000},context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),p=createProject({title:'Gravure A4 '+voices,tonic:'C',timeSignature:'4/4'});
 p.tracks=p.tracks.slice(0,voices);p.settings.measureCount=31;p.tracks.forEach(t=>t.events=Array.from({length:124},(_,i)=>makeNote(t.id,60+i%4,i,1,p.tempo)));
 await loadScore(page,p);const before=await currentProject(page);await page.getByRole('button',{name:'Partition',exact:true}).click();await page.getByRole('tab',{name:'Mise en page de la partition'}).click();let d=page.locator('dialog');
 if(mobile)await d.getByRole('button',{name:'Paramètres de mise en page',exact:true}).click();
 await d.getByRole('button',{name:'Mesures et alignement',exact:true}).click();const density=d.getByRole('slider',{name:'Densité horizontale (%)'});await expect(density).toHaveValue('100');
 const music=()=>d.locator('[data-note-id]').evaluateAll(nodes=>nodes.map(n=>({text:n.textContent,x:n.getAttribute('x'),y:n.getAttribute('y'),size:n.getAttribute('font-size'),center:n.getAttribute('data-center-x')}))),initial=await music();await density.focus();await density.press('End');await expect(density).toHaveValue('150');expect(await music()).not.toEqual(initial);
 await d.getByLabel('Mesures par ligne',{exact:true}).fill('3');await d.getByRole('button',{name:'Document',exact:true}).click();await d.getByLabel('Marges (mm)',{exact:true}).fill('20');await d.getByLabel('Orientation',{exact:true}).selectOption('landscape');await d.getByLabel('Orientation',{exact:true}).selectOption('portrait');
 await d.getByRole('button',{name:'Voix et paroles',exact:true}).click();await d.getByLabel('Noms des voix').selectOption('never');expect(await currentProject(page)).toEqual(before);
 const preview=await music();const dimensions=await d.locator('.engraved-content > svg').first().evaluate(el=>({width:+el.getAttribute('width')!,height:+el.getAttribute('height')!}));expect(dimensions.width/dimensions.height).toBeCloseTo(210/297,5);
 const columns=await d.locator('rect[aria-label^="Mesure "]').evaluateAll(nodes=>nodes.map(n=>({bar:+n.getAttribute('data-measure')!,x:+n.getAttribute('x')!,width:+n.getAttribute('width')!})));expect(columns).toHaveLength(31);expect(columns[30].x).toBe(columns[0].x);expect(columns[30].width).toBe(columns[0].width);
 if(mobile)await d.getByRole('button',{name:'Fermer les paramètres de mise en page'}).click();await d.getByLabel('Zoom de la partition (%)').fill('150');expect(await music()).toEqual(preview);await page.screenshot({path:info.outputPath('a4-layout.png')});await d.getByRole('button',{name:'Appliquer la mise en page'}).click();
 let saved=await currentProject(page);expect(saved.layout.horizontalDensity).toBe(1.5);expect(saved.layout.measuresPerSystem).toBe(3);expect(saved.layout.margin).toBe(20);expect(saved.tracks).toEqual(before.tracks);expect(saved.settings).toEqual(before.settings);await page.reload();expect(await currentProject(page)).toEqual(saved);
 await clickHeader(page,'PDF / Export');d=page.locator('dialog');expect(await music()).toEqual(preview);if(mobile)await d.getByRole('button',{name:'Paramètres de l’export',exact:true}).click();await expect(d.getByRole('slider',{name:'Densité horizontale (%)'})).toHaveValue('150');if(mobile)await d.getByRole('button',{name:'Paramètres de l’export',exact:true}).click();
 const count=await d.locator('.engraved-page').count();expect(count).toBeGreaterThan(1);const downloading=page.waitForEvent('download');await d.getByRole('button',{name:'Exporter PDF',exact:true}).click();const download=await downloading,bytes=await readFile((await download.path())!);expect(bytes.subarray(0,5).toString()).toBe('%PDF-');expect(bytes.toString('latin1').match(/\/Type \/Page\b/g)).toHaveLength(count);expect(bytes.toString('latin1')).toMatch(/\/MediaBox \[0 0 595\.2756 841\.8898\]/);await download.saveAs(info.outputPath('a4-multipage.pdf'));
 saved=await currentProject(page);expect(saved.tracks).toEqual(before.tracks);expect(saved.settings).toEqual(before.settings);await context.close();
});
test('An impossible requested count uses a temporary editable A4 grid without saving or exporting it',async({page})=>{
 const p=createProject({title:'Grille provisoire',tonic:'C',timeSignature:'4/4'});p.settings.measureCount=19;p.tracks.forEach(t=>t.events=Array.from({length:76},(_,i)=>makeNote(t.id,60,i,1,p.tempo)));
 await loadScore(page,p);const before=await currentProject(page);await page.getByRole('button',{name:'Partition',exact:true}).click();await page.getByRole('tab',{name:'Mise en page de la partition'}).click();const d=page.locator('dialog');await d.getByLabel('Mesures par ligne',{exact:true}).fill('16');
 await expect(d.getByRole('button',{name:'Appliquer la mise en page'})).toBeDisabled();await expect(d.locator('aside [role=alert]')).toContainText('Aperçu provisoire');await expect(d.locator('[data-note-id]')).toHaveCount(304);expect(await currentProject(page)).toEqual(before);
 await d.getByLabel('Mesures par ligne',{exact:true}).fill('4');await expect(d.getByRole('button',{name:'Appliquer la mise en page'})).toBeEnabled();await d.getByRole('button',{name:'Annuler l’aperçu'}).click();expect(await currentProject(page)).toEqual(before);
});
