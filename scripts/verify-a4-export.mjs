import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {rhythmicScore} from '../tests/fixtures/rhythmic-score.ts';
import {makeNote} from '../src/music/model.ts';
import {engraveProject,pageSVG} from '../src/score/engraving.ts';
import {scoreFonts,pdfBytes} from '../src/score/export.ts';

const output=resolve(process.argv[2]??'tmp/a4-export');await mkdir(output,{recursive:true});
const results=[];
for(const orientation of ['portrait','landscape']){
 const p=rhythmicScore();p.title='Gravure Solfa · A4';p.settings.measureCount=31;
 Object.assign(p.layout,{orientation,noteSize:17,horizontalDensity:1.2,margin:15,measuresPerSystem:4});
 p.tracks.forEach(t=>{for(let bar=7;bar<31;bar++)for(let beat=0;beat<4;beat++)t.events.push(makeNote(t.id,60+beat,bar*4+beat,1,p.tempo));});
 const original=structuredClone(p),doc=engraveProject(p);assert.deepEqual(doc.warnings,[]);assert.deepEqual(p,original);assert.ok(doc.pages.length>1);
 const fonts=await scoreFonts(doc);await writeFile(resolve(output,orientation+'.pdf'),Buffer.from(await pdfBytes(doc,fonts,p)));
 await writeFile(resolve(output,orientation+'.svg'),pageSVG(doc.pages[0],fonts));await writeFile(resolve(output,orientation+'.json'),JSON.stringify(doc));
 results.push({orientation,widthMm:doc.pages[0].widthMm,heightMm:doc.pages[0].heightMm,pages:doc.pages.length,systems:doc.systems.length,notes:p.tracks.reduce((n,t)=>n+t.events.length,0),noteSize:p.layout.noteSize,horizontalDensity:p.layout.horizontalDensity,lastLineMeasures:doc.systems.at(-1).measures.length});
}
await writeFile(resolve(output,'result.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
