import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {createProject,makeNote,id} from '../src/music/model.ts';
import {engraveProject,pageSVG,PX_PER_MM} from '../src/score/engraving.ts';
import {pdfBytes} from '../src/score/export.ts';
import {DEFAULT_SOLFA} from '../src/score/display.ts';
import {resetLineLayout} from '../src/score/styles.ts';
import {validateProject,migrateProject} from '../src/storage/migrations.ts';
import {checkScore} from '../src/score/checker.ts';
function fixture(bars:number,size=17){const p=createProject({timeSignature:'4/4',tonic:'C',title:'Grille Solfa'});p.settings.measureCount=bars;p.layout.noteSize=size;p.tracks.forEach(t=>{t.events=Array.from({length:bars*4},(_,i)=>makeNote(t.id,[60,62,64,65][i%4],i,1,72));});return p;}
for(const bars of [5,6,7,9,11,12])test(`${bars} bars on a four-column grid leave real blank slots and aligned boundaries`,()=>{
 const p=fixture(bars),before=structuredClone(p),doc=engraveProject(p),reference=doc.systems[0];
 assert.equal(doc.systems.length,Math.ceil(bars/4));assert.equal(doc.systems.flatMap(s=>s.measures).length,bars);assert.equal(doc.measureCount,bars);assert.deepEqual(doc.warnings,[]);
 for(const s of doc.systems)for(const [col,m] of s.measures.entries()){assert.ok(Math.abs(m.x-reference.measures[col].x)<1e-8);assert.ok(Math.abs(m.x+m.width-reference.measures[col].x-reference.measures[col].width)<1e-8);}
 const final=doc.systems.at(-1)!;assert.equal(final.measures.length,((bars-1)%4)+1);
 assert.ok(final.ops.every(op=>op.measure===undefined||op.measure<=bars));assert.ok(!pageSVG(doc.pages.at(-1)!).includes('data-measure="'+(bars+1)+'"'));assert.deepEqual(p,before);
});
for(const columns of [1,2,3,5,6,7,8,9,10,11,12])test(`Shared columns remain exact with ${columns} measures per line`,()=>{
 const bars=Math.max(5,columns*2-1),p=fixture(bars,12);p.layout.measuresPerSystem=columns;const doc=engraveProject(p);
 for(const s of doc.systems.slice(1))for(const [i,m] of s.measures.entries())assert.equal(m.x,doc.systems[0].measures[i].x);
 assert.equal(doc.systems.flatMap(s=>s.measures).length,bars);
});
test('Uneven density, lyrics, repeats, page breaks and local counts still share a reference grid',()=>{
 const p=fixture(11);p.tracks[0].events.push(makeNote('soprano',72,8.5,.5,72));p.lyrics=[{id:id(),trackId:'soprano',text:'Chœur',syllables:[{text:'Chœur',noteId:p.tracks[0].events[0].id}]}];p.layout.systemCounts={5:3};p.layout.pageBreaks=[7];p.repeats=[{id:id(),startMeasure:1,endMeasure:7,times:2}];const doc=engraveProject(p);
 assert.deepEqual(doc.systems.map(s=>[s.first,s.last]),[[1,4],[5,7],[8,11]]);assert.equal(doc.pages.length,2);
 for(const s of doc.systems.slice(1))for(const [i,m] of s.measures.entries())assert.equal(m.x,doc.systems[0].measures[i].x);
 for(const m of doc.systems.flatMap(s=>s.measures)){const a=m.geometry.anchors;for(let i=1;i<a.length;i++)assert.ok(Math.abs(a[i].x/m.geometry.width-(a[i].beat-m.geometry.begin)/(m.geometry.end-m.geometry.begin))<1e-7);}
});
for(const size of [12,17,20,24])test(`Document type stays ${size} px on all pages even when forced lines cannot fit`,()=>{
 const p=fixture(7,size);p.tracks.forEach(t=>t.events=Array.from({length:224},(_,i)=>makeNote(t.id,[60,72,48,84,36][i%5],i*.125,.125,72)));p.layout.paper='A5';
 const doc=engraveProject(p,undefined,{...DEFAULT_SOLFA,noteScale:.7});
 assert.ok(doc.warnings!.length>0);assert.equal(new Set(doc.pages.flatMap(p=>p.ops.filter(op=>op.kind==='text'&&op.role==='note').map(op=>op.kind==='text'?op.size:0))).size,1);
 assert.ok(doc.pages.flatMap(p=>p.ops).filter(op=>op.kind==='text'&&op.role==='note').every(op=>op.kind==='text'&&op.size===size));
 assert.equal(new Set(doc.pages.flatMap(p=>p.ops.flatMap(op=>op.kind==='text'?op.noteIds??[]:[]))).size,896);
 assert.ok(checkScore(p,doc).some(issue=>issue.message.includes('trop dense')));
});
test('Auto, independent and adaptive modes keep notes, octave signs and rhythmic thirds',()=>{
 const p=fixture(7);p.layout.measuresPerSystem=0;p.tracks[0].events=[0,1/3,2/3,1,1.5,1.75].map((b,i)=>makeNote('soprano',[60,72,48,84,36,62][i],b,1/3,72));
 for(const mode of ['grid','independent','adaptive'] as const){p.layout.measureAlignment=mode;const doc=engraveProject(p);assert.ok(doc.systems[0].ops.some(op=>op.role==='rhythm'&&op.kind==='curve'));assert.ok(doc.pages.flatMap(p=>p.ops).some(op=>op.kind==='text'&&op.octave===-2));assert.equal(doc.systems.flatMap(s=>s.measures).length,7);}
 const legacy=fixture(7);delete legacy.layout.measureAlignment;validateProject(legacy);assert.equal(migrateProject(legacy).layout.measuresPerSystem,4);assert.equal(engraveProject(legacy).systems[1].measures[0].x,engraveProject(legacy).systems[0].measures[0].x);
});
test('Reset one line preserves music, global settings and all exceptions outside that line',()=>{
 const p=fixture(12);Object.assign(p.layout,{systemBreaks:[3,7,11],pageBreaks:[7,11],systemCounts:{1:3,4:4,8:4},systemAlignments:{4:'center',8:'natural'},measureWidths:{5:2,9:1.5},systemGaps:{4:50,8:60}});
 const before=structuredClone(p),reset=resetLineLayout(p.layout,4,7);assert.equal(reset.measuresPerSystem,4);assert.deepEqual(reset.systemCounts,{1:3,8:4});assert.deepEqual(reset.systemBreaks,[3,11]);assert.deepEqual(reset.pageBreaks,[11]);assert.deepEqual(reset.measureWidths,{9:1.5});assert.deepEqual(reset.systemAlignments,{8:'natural'});assert.deepEqual(p,before);
});
test('SVG and vector PDF share exact columns and explicit pixel-to-point conversion',async()=>{
 const p=fixture(7,20),doc=engraveProject(p),font=readFileSync('src/assets/ScoreFont.ttf').toString('base64'),bytes=Buffer.from(await pdfBytes(doc,font,p));
 const source=bytes.toString('latin1'),streams=[...source.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)].map(m=>{try{return inflateSync(Buffer.from(m[1],'latin1')).toString('latin1');}catch{return m[1];}}).join('\n');
 assert.match(streams,/15 Tf/);assert.ok(doc.pages.flatMap(p=>p.ops.filter(op=>op.role==='note')).every(op=>op.kind==='text'&&op.size===20));
 assert.equal(doc.pages[0].width/PX_PER_MM,210);const svg=pageSVG(doc.pages[0],font);assert.match(svg,/font-size="20"/);
 mkdirSync('tmp/pdfs',{recursive:true});writeFileSync('tmp/pdfs/v06-seven-bars.pdf',bytes);writeFileSync('tmp/pdfs/v06-seven-bars.svg',svg);writeFileSync('tmp/pdfs/v06-seven-bars.json',JSON.stringify(doc,null,2));
});
