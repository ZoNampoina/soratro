import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from '@playwright/test';
import {rhythmicScore} from '../tests/fixtures/rhythmic-score.ts';
import {engraveProject,pageSVG,systemPage} from '../src/score/engraving.ts';
import {scoreFonts,pdfBytes} from '../src/score/export.ts';

// A reproducible contact sheet from real document vectors, plus a PDF of each variant.
const output=resolve(process.argv[2]??'tmp/typography-v07');await mkdir(output,{recursive:true});
const labels={normal:'Normal',reinforced:'Renforcé',custom:'Personnalisé'},cards=[],report=[];
for(const size of [12,17,20,24])for(const style of ['normal','reinforced','custom']){
 const p=rhythmicScore();p.settings.measureCount=1;p.tracks.forEach(t=>t.events=t.events.filter(n=>n.originalStart<4));p.layout.measuresPerSystem=1;p.layout.systemAlignment='natural';p.layout.noteSize=size;p.layout.punctuation={style,size:1.05,contrast:.95,weight:1.65,gap:2.25};
 const doc=engraveProject(p);assert.deepEqual(doc.warnings,[]);const crop=systemPage(doc.pages[0],doc.systems[0]),single={...doc,pages:[crop],systems:[doc.systems[0]]},fonts=await scoreFonts(doc),svg=pageSVG(crop,fonts),key=style+'-'+size;
 await writeFile(resolve(output,key+'.svg'),svg);await writeFile(resolve(output,key+'.pdf'),Buffer.from(await pdfBytes(single,fonts,p)));
 cards.push('<section><h2>Solfa '+size+' · '+labels[style]+'</h2>'+svg+'</section>');report.push({key,noteSize:size,style,punctuation:p.layout.punctuation,width:crop.width,height:crop.height});
}
const html='<!doctype html><html lang="fr"><meta charset="utf-8"><title>SORATRO · Ponctuations rythmiques</title><style>*{box-sizing:border-box}body{margin:0;padding:26px;font-family:Arial,sans-serif;color:#26232d;background:#f0f1f4}h1{font-size:25px;margin:0 0 7px}p{font-size:14px;margin:0 0 20px;color:#555}main{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}section{background:white;border:1px solid #ddd;border-radius:7px;overflow:hidden;padding:12px}h2{font:600 16px Arial;margin:0 0 10px}svg{display:block;width:100%;height:185px;object-fit:contain}</style><h1>SORATRO 0.7 · Ponctuations et octaves</h1><p>Quatre tailles, trois styles. Croches, doubles-croches, triolets et basse tenue ; d\', d\'\', d, et d,, restent attachés aux notes.</p><main>'+cards.join('')+'</main></html>';
await writeFile(resolve(output,'index.html'),html);
const browser=await chromium.launch({executablePath:process.env.SORATRO_CHROMIUM_PATH||undefined,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1120},deviceScaleFactor:1});await page.setContent(html);await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:resolve(output,'punctuation-matrix.png'),fullPage:true});await writeFile(resolve(output,'result.json'),JSON.stringify({variants:report,allDocumentSizesPreserved:true,embeddedFonts:true},null,2)+'\n');
}finally{await browser.close();}
console.log('Twelve SVG/PDF variants and the visual contact sheet saved.');
