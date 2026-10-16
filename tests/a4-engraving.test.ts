import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,makeNote,type Signature} from '../src/music/model.ts';
import {engraveProject,pageSVG,PX_PER_MM} from '../src/score/engraving.ts';
import {measureAt} from '../src/music/timeline.ts';
import {validateProject,migrateProject} from '../src/storage/migrations.ts';
import {encodeProject,decodeProject} from '../src/storage/project-file.ts';
import {temporalGeometry} from '../src/score/temporal-grid.ts';
import {DEFAULT_SOLFA} from '../src/score/display.ts';
import {punctuationHalfWidth} from '../src/score/punctuation.ts';
import {solfaNoteMetrics} from '../src/score/solfa-metrics.ts';
import {rhythmicScore} from './fixtures/rhythmic-score.ts';
import {pdfBytes} from '../src/score/export.ts';

const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function fixture(signature:Signature='4/4',voices=4,bars=19){
 const p=createProject({tonic:'C',timeSignature:signature});p.tracks=p.tracks.slice(0,voices);p.settings.measureCount=bars;
 p.tracks.forEach(t=>{t.events=Array.from({length:bars},(_,i)=>{const m=measureAt(p,i+1);return makeNote(t.id,60,m.start,m.barBeats,p.tempo);});});
 return p;
}
for(const signature of ['2/4','3/4','4/4','6/8'] as const)for(const voices of [1,4])test(`A4 ${signature}, ${voices} voices: exact paper, full rows and unchanged incomplete columns`,()=>{
 const p=fixture(signature,voices),original=structuredClone(p);
 for(const orientation of ['portrait','landscape'] as const)for(const density of [.7,1,1.5])for(const margin of [5,20])for(const labels of ['always','never'] as const){
  Object.assign(p.layout,{orientation,horizontalDensity:density,margin,voiceLabels:labels});const doc=engraveProject(p),ref=doc.systems[0];
  assert.deepEqual(doc.warnings,[]);for(const page of doc.pages){assert.equal(page.widthMm,orientation==='portrait'?210:297);assert.equal(page.heightMm,orientation==='portrait'?297:210);}
  close(ref.measures.at(-1)!.x+ref.measures.at(-1)!.width,doc.pages[0].width-margin*PX_PER_MM);
  for(const s of doc.systems)for(const [i,m] of s.measures.entries()){close(m.x,ref.measures[i].x);close(m.width,ref.measures[i].width);}
  assert.equal(doc.systems.at(-1)!.measures.length,3);assert.equal(doc.systems.flatMap(s=>s.measures).length,19);
  assert.ok(doc.pages.flatMap(p=>p.ops).filter(o=>o.role==='note').every(o=>o.kind==='text'&&o.size===17));
 }
 assert.deepEqual(p.tracks,original.tracks);assert.deepEqual(p.settings,original.settings);
});
test('Horizontal density changes only whitespace; Auto chooses a stable, denser column count',()=>{
 const p=fixture('4/4',1,20);p.layout.systemAlignment='natural';p.layout.horizontalDensity=.7;const airy=engraveProject(p),wide=temporalGeometry(p,1,DEFAULT_SOLFA);
 p.layout.horizontalDensity=1.5;const compact=engraveProject(p),tight=temporalGeometry(p,1,DEFAULT_SOLFA);
 assert.ok(compact.systems[0].measures[0].width<airy.systems[0].measures[0].width);assert.ok(tight.minimumWidth!<wide.minimumWidth!);
 p.layout.measuresPerSystem=0;p.layout.systemAlignment='auto';p.layout.horizontalDensity=.7;const sparse=engraveProject(p);p.layout.horizontalDensity=1.5;const dense=engraveProject(p);
 assert.ok(dense.systems[0].measures.length>sparse.systems[0].measures.length);
 for(const s of dense.systems)for(const [i,m] of s.measures.entries())close(m.x,dense.systems[0].measures[i].x);
});
for(const mode of ['grid','independent','adaptive'] as const)test(`An incomplete row inherits the full row columns in ${mode}, including a score with no full row`,()=>{
 const p=rhythmicScore();p.layout.measureAlignment=mode;const doc=engraveProject(p),reference=doc.systems[0];
 for(const [i,m] of doc.systems[1].measures.entries()){close(m.x,reference.measures[i].x);close(m.width,reference.measures[i].width);}
 const short=fixture('4/4',1,3);short.layout.measureAlignment=mode;const partial=engraveProject(short,{first:1,last:3}),last=partial.systems[0].measures.at(-1)!;
 assert.ok(last.x+last.width<partial.pages[0].width-short.layout.margin*PX_PER_MM-1);
});
test('Round dots and descending commas share exact SATB anchors without colliding with full note ink',()=>{
 const p=rhythmicScore();p.layout.measuresPerSystem=1;
 for(const density of [.7,1,1.5])for(const size of [12,17,24]){
  Object.assign(p.layout,{horizontalDensity:density,noteSize:size});const doc=engraveProject(p),s=doc.systems[0],baseline=new Map(p.tracks.map(t=>[t.id,s.ops.find(o=>o.role==='note'&&o.trackId===t.id)!.y]));
  for(const op of s.ops.filter(o=>o.role==='rhythm')){
   const y=baseline.get(op.trackId!)!;
   if(op.kind==='circle'){close(op.x,op.timeX!);close(op.y+op.radius,y);assert.ok(op.radius>.5);}
   if(op.kind==='curve'){assert.ok(op.y<y);assert.ok(op.y2>y);assert.ok(op.cy2>y);}
   const sign=s.measures[0].geometry.rhythmByTrack![op.trackId!].find(b=>Math.abs(b.beat-op.beat!)<1e-7)!,half=punctuationHalfWidth(sign,p.layout);
   for(const n of s.ops.filter(o=>o.kind==='text'&&o.noteIds?.length&&o.trackId===op.trackId))if(n.kind==='text'){
    const note=p.tracks.flatMap(t=>t.events).find(e=>e.id===n.noteIds![0])!,bounds=solfaNoteMetrics(note.midiPitch,p,size);
    assert.ok(n.x+bounds.right<=op.timeX!-half+1e-7||n.x+bounds.left>=op.timeX!+half-1e-7);
   }
  }
  const svg=pageSVG(doc.pages[0]);assert.match(svg,/<circle[^>]+data-rhythm-kind="half"/);assert.match(svg,/<path[^>]+data-rhythm-kind="third"/);
 }
});
test('Long lyric constraints are reported before any overflowing page can be rendered; source remains exact',()=>{
 const p=fixture('4/4',1,7);p.lyrics=[{id:'long-text',trackId:'soprano',text:'Une très longue syllabe',syllables:[{text:'Antananarivorenivohitr’iMadagasikara',noteId:p.tracks[0].events[0].id}]}];
 const before=structuredClone(p);assert.throws(()=>engraveProject(p),/mm nécessaires.*mm disponibles/);assert.deepEqual(p,before);
 p.layout.measuresPerSystem=1;p.layout.orientation='landscape';const doc=engraveProject(p);assert.deepEqual(doc.warnings,[]);for(const s of doc.systems)assert.ok(s.x+s.width<=doc.pages[s.page].width-p.layout.margin*PX_PER_MM+1e-7);
});
test('Old projects and density settings round-trip exactly with the existing schema',async()=>{
 const legacy=fixture();delete legacy.layout.horizontalDensity;const before=structuredClone(legacy);assert.deepEqual(migrateProject(legacy),before);assert.deepEqual(await decodeProject(await encodeProject(legacy)),before);
 for(const density of [.7,1,1.5]){const p=structuredClone(legacy);p.layout.horizontalDensity=density;validateProject(p);assert.deepEqual(await decodeProject(await encodeProject(p)),p);}
 for(const density of [.69,1.51,NaN,Infinity]){const p=structuredClone(legacy);p.layout.horizontalDensity=density;assert.throws(()=>validateProject(p),/Densité horizontale/);}
 legacy.layout.measuresPerSystem=32;validateProject(legacy);legacy.layout.measuresPerSystem=2.5;assert.throws(()=>validateProject(legacy),/Nombre de mesures/);
});
test('An incompatible fixed count keeps every note editable on safe A4 pages and blocks provisional PDF export',async()=>{
 const p=fixture('4/4',4,19);p.layout.measuresPerSystem=16;const before=structuredClone(p),doc=engraveProject(p);
 assert.equal(doc.warnings!.length,1);assert.match(doc.warnings![0].message,/Aperçu provisoire/);assert.deepEqual(p,before);
 assert.equal(new Set(doc.pages.flatMap(p=>p.ops.flatMap(o=>o.kind==='text'?o.noteIds??[]:[]))).size,76);
 for(const s of doc.systems)assert.ok(s.x+s.width<=doc.pages[s.page].width-p.layout.margin*PX_PER_MM+1e-7);
 await assert.rejects(pdfBytes(doc,{},p),/aperçu provisoire/i);
});
