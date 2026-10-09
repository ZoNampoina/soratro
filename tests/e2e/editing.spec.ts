import {test,expect,type Page} from '@playwright/test';
import {createProject,makeNote,noteStart,noteDuration,type Project} from '../../src/music/model';
import {loadScore,currentProject} from './helpers';
function fixture(){const p=createProject({title:'Édition SATB',tonic:'Db',timeSignature:'4/4',tempo:120});p.tracks[0].events=Array.from({length:10},(_,i)=>makeNote('soprano',65+i%5,i*.5,.25,120));p.tracks[1].events=[makeNote('alto',57,0,1,120),makeNote('alto',58,4,1,120)];return p;}
const rollNote=(page:Page,id:string)=>page.locator('.roll-event[data-note-id="'+id+'"] .note-block');
const scoreNote=(page:Page,id:string)=>page.locator('.composition .engraved-content [data-note-id="'+id+'"]');
test('Real Ctrl gesture toggles 1/4/7, grouped drag and Undo preserve every other note and raw timing',async({page})=>{
  const p=fixture();await loadScore(page,p);const before=await currentProject(page);
  await page.getByRole('tab',{name:'Piano Roll',exact:true}).click();await page.getByLabel('Cadrage du Piano Roll').selectOption('all');
  for(const i of [0,3,6])await rollNote(page,p.tracks[0].events[i].id).click({modifiers:['Control']});
  await expect(page.locator('.roll-event.selected-note')).toHaveCount(3);
  await rollNote(page,p.tracks[0].events[3].id).click({modifiers:['Control']});await expect(page.locator('.roll-event.selected-note')).toHaveCount(2);
  await rollNote(page,p.tracks[0].events[3].id).click({modifiers:['Control']});
  const target=rollNote(page,p.tracks[0].events[0].id),box=(await target.boundingBox())!,zoom=Number(await page.locator('.roll-tools').innerText().then(s=>s.match(/(\d+) %/)![1]))/100*64;
  await page.mouse.move(box.x+3,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+3+zoom*.5,box.y-box.height/2-4,{steps:6});await page.mouse.up();
  const after=await currentProject(page);for(let i=0;i<10;i++){const n=after.tracks[0].events[i],original=before.tracks[0].events[i];if([0,3,6].includes(i)){expect(noteStart(n)).toBeCloseTo(noteStart(original)+.5,2);expect(n.midiPitch).toBe(original.midiPitch+1);}else expect(n).toEqual(original);expect(n.originalStart).toBe(original.originalStart);expect(n.startTime).toBe(original.startTime);expect(n.duration).toBe(original.duration);}
  await page.keyboard.press('Control+z');expect((await currentProject(page)).tracks).toEqual(before.tracks);
  await page.getByRole('button',{name:'Zoomer sur la sélection'}).click();for(const i of [0,3,6])await expect(rollNote(page,p.tracks[0].events[i].id)).toBeInViewport();
  await page.setViewportSize({width:1024,height:768});for(const i of [0,3,6])await expect(rollNote(page,p.tracks[0].events[i].id)).toBeInViewport();
});
test('Common selection, Solfa m→f in Db, MIDI/roll/playback source and atomic Undo/Redo',async({page},info)=>{
  const p=fixture(),id=p.tracks[0].events[0].id;await loadScore(page,p);await page.getByRole('tab',{name:'Piano Roll',exact:true}).click();await page.getByLabel('Cadrage du Piano Roll').selectOption('all');await rollNote(page,id).click();
  await page.getByRole('button',{name:'Partition',exact:true}).click();await expect(page.locator('[data-selected-note="'+id+'"]')).toBeVisible();await expect(scoreNote(page,id)).toHaveText('m');await scoreNote(page,id).click();
  await page.getByLabel('Degré Solfa').selectOption('4');await expect(scoreNote(page,id)).toHaveText('f');expect((await currentProject(page)).tracks[0].events[0].midiPitch).toBe(66);await expect(page.getByLabel('Hauteur de la note')).toHaveValue('66');
  await page.getByRole('button',{name:'Annuler',exact:true}).click();await expect(scoreNote(page,id)).toHaveText('m');await page.getByRole('button',{name:'Rétablir',exact:true}).click();await expect(scoreNote(page,id)).toHaveText('f');
  await scoreNote(page,p.tracks[1].events[0].id).click({modifiers:['Control']});await expect(page.locator('.composition [data-selected-note]')).toHaveCount(2);await page.getByLabel('Alignement intelligent').selectOption('ends');await page.getByRole('button',{name:'Appliquer l’alignement'}).click();
  const aligned=await currentProject(page);expect(noteStart(aligned.tracks[0].events[0])).toBe(.75);expect(aligned.tracks[0].events[0].midiPitch).toBe(66);await page.getByRole('button',{name:'Annuler',exact:true}).click();
  await page.getByRole('button',{name:'Composition',exact:true}).click();await expect(page.locator('.roll-event.selected-note')).toHaveCount(2);await expect(page.locator('.roll-event[data-note-id="'+id+'"]')).toHaveAttribute('data-pitch','66');
  await page.keyboard.press('Control+c');await page.getByRole('button',{name:'Partition',exact:true}).click();await page.keyboard.press('Control+v');expect((await currentProject(page)).tracks.flatMap((t:any)=>t.events).length).toBe(14);await page.getByRole('button',{name:'Annuler',exact:true}).click();expect((await currentProject(page)).tracks.flatMap((t:any)=>t.events).length).toBe(12);await page.getByRole('button',{name:'Composition',exact:true}).click();
  await page.getByRole('button',{name:'Mode clair'}).click();await page.screenshot({path:info.outputPath('edition-light.png')});
});
test('Locked Alto is readable and audible; arrows, delete, quantize, transpose and REC reject changes',async({page})=>{
  const p=fixture(),id=p.tracks[1].events[0].id;await loadScore(page,p);await page.getByRole('button',{name:'Verrouiller Alto',exact:true}).click();
  await page.getByRole('button',{name:'Partition',exact:true}).click();await scoreNote(page,id).click();await expect(page.getByLabel('Degré Solfa')).toBeDisabled();await expect(page.locator('.locked-note-message')).toContainText('Alto');const before=await currentProject(page);
  await scoreNote(page,id).focus();for(const key of ['ArrowUp','Delete']){await page.keyboard.press(key);await expect(page.locator('.toast')).toContainText('Piste verrouillée : Alto');expect((await currentProject(page)).tracks).toEqual(before.tracks);}
  await page.getByRole('button',{name:'Composition',exact:true}).click();await page.locator('.track-select').filter({hasText:'Alto'}).click();await page.getByRole('button',{name:'Quantifier',exact:true}).click();await expect(page.locator('.toast')).toContainText('Piste verrouillée');expect((await currentProject(page)).tracks).toEqual(before.tracks);
  await page.getByRole('button',{name:'Transposer',exact:true}).click();await page.getByLabel('Demi-tons',{exact:true}).fill('1');await page.getByRole('button',{name:'Transposer le morceau',exact:true}).click();await expect(page.locator('.toast')).toContainText('Piste verrouillée');await page.locator('dialog > header').getByRole('button',{name:'Fermer',exact:true}).click();
  await page.getByRole('button',{name:'Enregistrer',exact:true}).click();await expect(page.locator('.toast')).toContainText('Alto');await expect(page.getByRole('button',{name:'Arrêter l’enregistrement'})).toHaveCount(0);
  await page.getByRole('button',{name:'Mute Alto',exact:true}).click();const muted=await currentProject(page);expect(muted.tracks[1].mute).toBeTruthy();expect(muted.tracks[1].locked).toBeTruthy();expect(muted.tracks[1].events).toEqual(before.tracks[1].events);
});
test('Real prelisten plays the selected frequency, releases it and stays silent when disabled or Ctrl selecting',async({page})=>{
  await page.addInitScript(()=>{const original=AudioContext.prototype.createOscillator;(window as any).qaOscillators=[];AudioContext.prototype.createOscillator=function(){const o=original.call(this);(window as any).qaOscillators.push(o);return o;};});
  const p=fixture();await loadScore(page,p);await page.getByRole('button',{name:'Partition',exact:true}).click();await scoreNote(page,p.tracks[0].events[0].id).click();
  await expect.poll(()=>page.evaluate(()=>(window as any).qaOscillators.length)).toBe(2);expect(await page.evaluate(()=>(window as any).qaOscillators[0].frequency.value)).toBeCloseTo(440*2**((65-69)/12),3);await expect(page.locator('.piano-white.pressed,.piano-black.pressed')).toHaveCount(0);
  await scoreNote(page,p.tracks[0].events[3].id).click({modifiers:['Control']});expect(await page.evaluate(()=>(window as any).qaOscillators.length)).toBe(2);
  await page.getByRole('button',{name:'Paramètres',exact:true}).click();await page.getByLabel('Préécoute des notes').uncheck();await page.locator('dialog > header').getByRole('button',{name:'Fermer',exact:true}).click();await scoreNote(page,p.tracks[0].events[6].id).click();expect(await page.evaluate(()=>(window as any).qaOscillators.length)).toBe(2);
});
test('Fullscreen native and fallback restore the prior layout; manual follow suspension is reversible',async({page})=>{
  const p=fixture();p.settings.measureCount=70;p.tracks[0].events=Array.from({length:280},(_,i)=>makeNote('soprano',65,i,1,120));await loadScore(page,p);await page.getByRole('button',{name:'Partition',exact:true}).click();
  const before=await page.locator('.score-viewport').boundingBox();await page.getByRole('button',{name:'Partition plein écran'}).click();await expect(page.locator('.app')).toHaveAttribute('data-score-fullscreen','true');expect(await page.evaluate(()=>!!document.fullscreenElement)).toBeTruthy();await page.getByRole('button',{name:'Quitter le plein écran Partition'}).click();expect(await page.locator('.score-viewport').boundingBox()).toEqual(before);
  await page.evaluate(()=>{document.documentElement.requestFullscreen=async()=>{throw new Error('Unavailable');};});await page.getByRole('button',{name:'Partition plein écran'}).click();await expect(page.locator('.app')).toHaveAttribute('data-score-fullscreen','true');expect(await page.evaluate(()=>!!document.fullscreenElement)).toBeFalsy();await page.keyboard.press('Escape');expect(await page.locator('.score-viewport').boundingBox()).toEqual(before);
  await page.getByRole('button',{name:'Lecture',exact:true}).click();await page.locator('.score-viewport').hover();await page.mouse.wheel(0,1800);await expect(page.getByRole('button',{name:'Revenir à la lecture'})).toHaveClass(/follow-suspended/);const top=await page.locator('.score-viewport').evaluate(el=>el.scrollTop);await page.waitForTimeout(500);expect(await page.locator('.score-viewport').evaluate(el=>el.scrollTop)).toBeGreaterThanOrEqual(top-5);await page.getByRole('button',{name:'Revenir à la lecture'}).click();await expect.poll(()=>page.locator('.score-viewport').evaluate(el=>el.scrollTop)).toBeLessThan(top);await page.getByRole('button',{name:'Stop',exact:true}).click();
});
test('Touch multiple selection and direct Solfa editing work on a portrait phone',async({browser},info)=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();const p=fixture();await loadScore(page,p);await page.getByRole('tab',{name:'Piano Roll',exact:true}).click();await page.getByLabel('Cadrage du Piano Roll').selectOption('all');await page.getByRole('button',{name:'Sélection multiple tactile'}).click();
  for(const i of [0,3,6])await rollNote(page,p.tracks[0].events[i].id).tap();await expect(page.locator('.roll-event.selected-note')).toHaveCount(3);await page.getByRole('button',{name:'Partition',exact:true}).click();await page.getByRole('button',{name:'Sélection multiple Solfa'}).click();await scoreNote(page,p.tracks[0].events[0].id).tap();await expect(page.locator('.composition [data-selected-note]')).toHaveCount(2);await page.getByLabel('Durée de la note').fill('0.5');expect(noteDuration((await currentProject(page)).tracks[0].events[3])).toBe(.5);
  await page.screenshot({path:info.outputPath('solfa-mobile.png')});await context.close();
});
