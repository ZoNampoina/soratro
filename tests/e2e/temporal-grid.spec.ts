import {test,expect,type Locator,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {rhythmicScore} from '../fixtures/rhythmic-score';
import {engraveProject} from '../../src/score/engraving';
import {loadScore,currentProject} from './helpers';

async function layout(page:Page){await page.getByRole('button',{name:'Partition',exact:true}).click();await page.getByRole('tab',{name:'Mise en page de la partition'}).click();return page.locator('dialog');}
async function parameters(d:Locator,open:boolean,width:number){if(width<=760)await d.getByRole('button',{name:open?'Paramètres de mise en page':'Fermer les paramètres de mise en page',exact:true}).click();}
async function punctuationProof(root:Locator){
 return root.locator('[data-score-role="rhythm"]').evaluateAll(async nodes=>{
  await document.fonts.ready;
  const canvas=document.createElement('canvas'),context=canvas.getContext('2d')!;
  const bounds:Record<string,[number,number]>={':':[240/2048,451/2048],'.':[219/2048,430/2048],',':[158/2048,451/2048]};
  return nodes.map(node=>{
   const el=node as SVGGraphicsElement,anchor=+(el.getAttribute('data-time-x')!),box=el.getBBox(),text=el.textContent??'',size=+(el.getAttribute('font-size')??0);
   context.font=size+'px SoratroPrint';const measured=context.measureText(text);
   return {track:el.getAttribute('data-track-id'),beat:+el.getAttribute('data-score-beat')!,kind:el.getAttribute('data-rhythm-kind'),size,color:el.getAttribute('fill')??el.getAttribute('stroke'),anchor,
    center:bounds[text]?+el.getAttribute('x')!+(bounds[text][0]+bounds[text][1])*size/2:box.x+box.width/2,
    rasterCenter:bounds[text]?+el.getAttribute('x')!+(measured.actualBoundingBoxRight-measured.actualBoundingBoxLeft)/2:box.x+box.width/2,
    extent:box.width};
  });
 });
}
const sizes=[{width:360,height:640},{width:390,height:844},{width:412,height:915},{width:740,height:390},{width:800,height:1280},{width:1366,height:768},{width:1440,height:900},{width:1920,height:1080}];
for(const viewport of sizes)test(`Punctuation preferences, shared SATB anchors and margins at ${viewport.width}×${viewport.height}`,async({browser},info)=>{
 const context=await browser.newContext({viewport,hasTouch:viewport.width<=800,isMobile:viewport.width<=800}),page=await context.newPage(),errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));const p=rhythmicScore();expect(engraveProject(p).warnings).toEqual([]);await loadScore(page,p);const before=await currentProject(page),d=await layout(page);
 await d.getByLabel('Zoom de la partition (%)').fill('150');await parameters(d,true,viewport.width);await d.getByRole('button',{name:'Typographie',exact:true}).click();
 const style=d.getByLabel('Style des ponctuations');await expect(style).toHaveValue('reinforced');await expect(d.getByLabel('Taille relative des ponctuations (%)')).toBeHidden();
 await style.selectOption('normal');await expect(d.locator('[data-rhythm-kind="pulse"]').first()).toHaveAttribute('font-size','17');await style.selectOption('reinforced');await expect(d.locator('[data-rhythm-kind="pulse"]').first()).toHaveAttribute('font-size','20');
 await style.selectOption('custom');await d.getByLabel('Taille relative des ponctuations (%)').fill('105');await d.getByLabel('Contraste des ponctuations (%)').fill('95');
 const weight=d.getByLabel('Épaisseur des ponctuations');await weight.focus();await weight.press('ControlOrMeta+A');await weight.pressSequentially('1.65');await expect(weight).toHaveValue('1.65');
 await d.getByLabel('Espace de sécurité des ponctuations (px)').fill('2.25');await expect(d.locator('[data-rhythm-kind="pulse"]').first()).toHaveAttribute('font-size','21');
 await page.screenshot({path:info.outputPath('punctuation-settings.png')});await d.getByRole('button',{name:'Voix et paroles',exact:true}).click();
 const first=()=>d.locator('rect[aria-label="Mesure 1"]').getAttribute('x'),withNames=+(await first())!;await d.getByLabel('Noms des voix').selectOption('never');expect(+(await first())!).toBeLessThan(withNames);await d.getByLabel('Noms des voix').selectOption('first');expect(+(await first())!).toBeCloseTo(withNames,3);
 expect(await currentProject(page)).toEqual(before);await parameters(d,false,viewport.width);await expect(d.getByRole('button',{name:'Appliquer la mise en page'})).toBeInViewport();await expect(d.getByLabel('Zoom de la partition (%)')).toHaveValue('150');
 const proof=await punctuationProof(d);expect(proof.filter(o=>o.beat<4&&o.kind==='pulse')).toHaveLength(12);expect(proof.filter(o=>o.track==='bass'&&o.beat<4&&o.kind!=='pulse')).toHaveLength(0);
 for(const o of proof){expect(Math.abs(o.center-o.anchor)).toBeLessThan(.002);expect(Math.abs(o.rasterCenter-o.anchor)).toBeLessThan(.6);expect(o.extent).toBeGreaterThan(1);}
 for(const beat of [1,2,3])expect(new Set(proof.filter(o=>o.beat===beat&&o.kind==='pulse').map(o=>o.anchor)).size).toBe(1);
 const columns=await d.locator('rect[aria-label^="Mesure "]').evaluateAll(nodes=>nodes.map(n=>({bar:+n.getAttribute('data-measure')!,x:+n.getAttribute('x')!,width:+n.getAttribute('width')!})));
 expect(columns.map(v=>v.bar)).toEqual([1,2,3,4,5,6,7]);for(let i=4;i<7;i++){expect(columns[i].x).toBe(columns[i-4].x);expect(columns[i].width).toBe(columns[i-4].width);}
 const previewMusic=await d.locator('[data-note-id]').evaluateAll(nodes=>nodes.map(n=>({text:n.textContent,x:n.getAttribute('x'),time:n.getAttribute('data-time-x'),size:n.getAttribute('font-size')})));
 expect(previewMusic.every(n=>n.size==='20')).toBeTruthy();const centres=await d.locator('[data-note-id]').evaluateAll(async nodes=>{await document.fonts.ready;const c=document.createElement('canvas').getContext('2d')!;c.fontKerning='none';return nodes.map(n=>{const size=Number(n.getAttribute('font-size'));c.font=size+'px SoratroPrint';const base=c.measureText(n.childNodes[0]?.textContent??''),mark=n.querySelector('tspan');let left=-base.actualBoundingBoxLeft,right=base.actualBoundingBoxRight;if(mark){c.font=mark.getAttribute('font-size')+'px SoratroPrint';const m=c.measureText(mark.textContent??'');left=Math.min(left,base.width-m.actualBoundingBoxLeft);right=Math.max(right,base.width+m.actualBoundingBoxRight);}return Math.abs(Number(n.getAttribute('x'))+(left+right)/2-Number(n.getAttribute('data-center-x')));});});expect(Math.max(...centres)).toBeLessThan(.6);await page.screenshot({path:info.outputPath('rhythmic-layout.png')});await d.getByRole('button',{name:'Appliquer la mise en page'}).click();
 let saved=await currentProject(page);expect(saved.layout.punctuation).toEqual({style:'custom',size:1.05,contrast:.95,weight:1.65,gap:2.25});expect(saved.tracks).toEqual(before.tracks);expect(saved.settings).toEqual(before.settings);
 await page.getByRole('button',{name:'Annuler',exact:true}).click();expect({...await currentProject(page),updatedAt:before.updatedAt}).toEqual(before);await page.getByRole('button',{name:'Rétablir',exact:true}).click();const redone=await currentProject(page);expect({...redone,updatedAt:saved.updatedAt}).toEqual(saved);saved=redone;
 await page.reload();expect(await currentProject(page)).toEqual(saved);await page.getByRole('button',{name:'PDF / Export',exact:true}).click();const e=page.locator('dialog');
 expect(await e.locator('[data-note-id]').evaluateAll(nodes=>nodes.map(n=>({text:n.textContent,x:n.getAttribute('x'),time:n.getAttribute('data-time-x'),size:n.getAttribute('font-size')})))).toEqual(previewMusic);
 const wait=page.waitForEvent('download');await e.getByRole('button',{name:'SVG',exact:true}).click();const download=await wait,svg=await readFile((await download.path())!,'utf8');expect(svg).toContain('font-size="21"');expect(svg).toContain('data-rhythm-kind="third"');expect(svg).not.toContain('data-measure="8"');await download.saveAs(info.outputPath('rhythmic-grid.svg'));
 expect(errors).toEqual([]);await context.close();
});
test('Mixed rhythms export the same vector coordinates to SVG/PDF and a real PNG, with separate octaves',async({page},info)=>{
 const p=rhythmicScore();p.layout.punctuation={style:'custom',size:1.05,contrast:.95,weight:1.65,gap:2.25};await loadScore(page,p);await page.getByRole('button',{name:'PDF / Export',exact:true}).click();const d=page.locator('dialog'),before=await currentProject(page),proof=await punctuationProof(d);
 const vectors=()=>d.locator('[data-score-role="rhythm"],[data-note-id]').evaluateAll(nodes=>nodes.map(n=>n.outerHTML)),beforeZoom=await vectors();
 for(const o of proof)expect(Math.abs(o.center-o.anchor)).toBeLessThan(.002);
 await d.getByLabel('Zoom de la partition (%)').fill('150');expect(await vectors()).toEqual(beforeZoom); // browser hinting may change getBBox; the document vectors must remain identical
 for(const format of ['PDF','SVG','PNG']){const wait=page.waitForEvent('download');await d.getByRole('button',{name:format==='PDF'?'Exporter PDF':format,exact:true}).click();const download=await wait,bytes=await readFile((await download.path())!);if(format==='PDF')expect(bytes.subarray(0,5).toString()).toBe('%PDF-');if(format==='PNG')expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');if(format==='SVG'){expect(bytes.toString()).toContain('<tspan font-size="14"');expect(bytes.toString()).toContain('stroke-width="0.546"');expect(bytes.toString()).toContain('stroke-linecap="round"');}await download.saveAs(info.outputPath('mixed-rhythms.'+format.toLowerCase()));}
 expect(await currentProject(page)).toEqual(before);await page.screenshot({path:info.outputPath('mixed-rhythms-export.png')});
});
test('Legacy punctuation defaults preview immediately and cancel without migrating the composition',async({page})=>{
 const p=rhythmicScore();delete p.layout.punctuation;await loadScore(page,p);const before=await currentProject(page),d=await layout(page);await d.getByRole('button',{name:'Typographie',exact:true}).click();await expect(d.getByLabel('Style des ponctuations')).toHaveValue('reinforced');await d.getByLabel('Style des ponctuations').selectOption('normal');await expect(d.locator('[data-rhythm-kind="pulse"]').first()).toHaveAttribute('font-size','17');await d.getByRole('button',{name:'Annuler l’aperçu'}).click();expect(await currentProject(page)).toEqual(before);
});
