import test from 'node:test';import assert from 'node:assert/strict';
import {createProject,makeNote,type Project} from '../src/music/model.ts';
import {projectCredits,setDocumentLanguage,creditLines,syncLegacyCredits} from '../src/score/credits.ts';
import {decoration,decorationText} from '../src/score/decorations.ts';
import {engraveProject,pageSVG} from '../src/score/engraving.ts';
import {publicationProfiles,applyScoreStyle} from '../src/score/styles.ts';
import {encodeProject,decodeProject} from '../src/storage/project-file.ts';
import {validateProject} from '../src/storage/migrations.ts';
import {insertLibrarySymbol,SYMBOL_CHOICES,moveIndication} from '../src/score/symbol-library.ts';
import {musicalSymbol} from '../src/score/music-symbols.ts';
import {editMeasures} from '../src/music/editing.ts';
function score(bars=16):Project{const p=createProject({timeSignature:'4/4',title:'Publication',author:'Zo',composer:'Nampoina'});p.tracks.forEach(t=>{t.events=Array.from({length:bars*4},(_,i)=>makeNote(t.id,61+i%4,i,1,72));});return p;}
test('Credit languages and custom labels preserve contributor identities and group multiple names',async()=>{const p=score();assert.equal(creditLines(p,['author'])[0],'Paroles : Zo');setDocumentLanguage(p,'mg');assert.equal(creditLines(p,['composer'])[0],'Feony : Nampoina');p.credits!.labels.composer='A/C';p.credits!.contributors.push({id:'second',name:'Rabe',role:'author',label:'',visible:true,order:2},{id:'arr',name:'Rakoto',role:'arranger',label:'Fandrindrana',visible:true,order:3});syncLegacyCredits(p);assert.equal(p.author,'Zo');assert.equal(creditLines(p,['author'])[0],'Tonony : Zo, Rabe');setDocumentLanguage(p,'fr');assert.equal(creditLines(p,['composer'])[0],'A/C : Nampoina');assert.equal(decorationText(decoration('credits','left'),p,0,1),'Fandrindrana : Rakoto');const restored=await decodeProject(await encodeProject(p));assert.deepEqual(restored.credits,p.credits);assert.equal(restored.composer,'Nampoina');p.credits!.contributors.find(c=>c.id==='second')!.visible=false;assert.equal(creditLines(p,['author'])[0],'Paroles : Zo');});
test('New projects have four bars per line and system numbering; old settings still render',()=>{const p=score();assert.equal(p.layout.measuresPerSystem,4);assert.equal(p.layout.numbering!.mode,'system');let doc=engraveProject(p);assert.deepEqual(doc.systems.map(s=>s.last-s.first+1),[4,4,4,4]);assert.equal(doc.pages.flatMap(p=>p.ops).filter(op=>op.role==='number').length,4);delete p.layout.numbering;doc=engraveProject(p);assert.equal(doc.pages.flatMap(p=>p.ops).filter(op=>op.role==='number').length,16);});
test('All numbering modes remain correct after manual lines, pages, pickup and collection prefix',()=>{const p=score();p.layout.systemCounts={1:4,5:3,8:5,13:4};p.layout.pageBreaks=[7];for(const mode of ['measure','system','page','none'] as const){p.layout.numbering!.mode=mode;const doc=engraveProject(p),ops=doc.pages.flatMap(p=>p.ops).filter(op=>op.role==='number');assert.equal(ops.length,mode==='measure'?16:mode==='system'?doc.systems.length:mode==='page'?doc.pages.length:0);}p.settings.pickupBeats=1;p.layout.numbering!.mode='measure';p.layout.numbering!.prefix='II · ';const first=engraveProject(p).pages[0].ops.find(op=>op.role==='number');assert.ok(first?.kind==='text'&&first.text==='II · 0 · levée');p.layout.numbering!.position='below';p.layout.numbering!.size=14;p.layout.numbering!.color='#883355';assert.ok(pageSVG(engraveProject(p).pages[0]).includes('#883355'));});
test('Full, natural, centered and automatic systems keep all notes and SATB timing anchors',()=>{const p=score(8),total=p.tracks.reduce((n,t)=>n+t.events.length,0);for(const alignment of ['full','natural','center','auto'] as const){p.layout.systemAlignment=alignment;const doc=engraveProject(p),ids=new Set(doc.pages.flatMap(p=>p.ops).flatMap(op=>op.kind==='text'?op.noteIds??[]:[]));assert.equal(ids.size,total);for(const system of doc.systems)for(const m of system.measures){const noteOps=system.ops.filter(o=>o.role==='note'&&o.beat===m.geometry.begin);assert.equal(new Set(noteOps.map(o=>o.x)).size,1);assert.ok(m.width>0);}if(alignment==='center')assert.ok(doc.systems[0].x>p.layout.margin*96/25.4);}});
test('Publication profiles modify presentation only and remain independent copies',()=>{const p=score(),music=JSON.stringify([p.tracks,p.lyrics,p.tempo]),profiles=publicationProfiles();assert.equal(profiles.length,4);for(const profile of profiles){applyScoreStyle(p,profile);assert.equal(JSON.stringify([p.tracks,p.lyrics,p.tempo]),music);validateProject(p);engraveProject(p);}profiles[0].layout.margin=40;assert.notEqual(publicationProfiles()[0].layout.margin,40);});
test('Library vector thumbnails use the same printed Segno/Coda/Fermata shapes; insertion and movement are musical',()=>{const p=score(),choice=SYMBOL_CHOICES.find(c=>c.key==='segno')!;insertLibrarySymbol(p,choice,{measure:2,beat:1,text:'Segno',targetId:'',trackIds:[],end:3,times:2,firstEnding:0,secondEnding:0,bpm:100,span:1},[]);let doc=engraveProject(p),printed=doc.pages.flatMap(p=>p.ops).filter(op=>op.objectId===p.indications[0].id);assert.deepEqual(printed.map(op=>op.kind),musicalSymbol('segno',0,0).map(op=>op.kind));moveIndication(p,p.indications[0].id,4,2);assert.equal(p.indications[0].measure,4);assert.equal(p.indications[0].beat,2);assert.equal(p.tracks[0].events.length,64);for(const symbol of ['segno','coda','fermata','breath','repeat','crescendo','diminuendo'])assert.ok(musicalSymbol(symbol,0,0).some(op=>op.kind!=='text'));});
test('Presentation validation rejects invalid counts, numbering, labels and contributor identifiers before import',()=>{const p=score();for(const bad of [()=>{p.layout.measuresPerSystem=4.5;},()=>{p.layout.numbering!.start=-1;},()=>{p.credits=projectCredits(p);p.credits.contributors[1].id=p.credits.contributors[0].id;}]){const clone=structuredClone(p);bad();assert.throws(()=>validateProject(p));Object.assign(p,clone);}});
test('Local system alignments follow inserted/deleted measures without altering credit metadata',()=>{const p=score();p.layout.systemAlignments={5:'center'};p.credits=projectCredits(p);const credits=structuredClone(p.credits);editMeasures(p,'insert-before',2,2,'all');assert.equal(p.layout.systemAlignments[6],'center');editMeasures(p,'delete',2,2,'all');assert.equal(p.layout.systemAlignments[5],'center');assert.deepEqual(p.credits,credits);});


test('An explicit four measures per system cannot be reduced by natural widths',()=>{
  const p=score(16);
  // Deliberately exceed the natural page width: this used to wrap after 1-2 measures.
  p.layout.measuresPerSystem=4;
  p.layout.measureWidths={1:2.5,2:2.5,3:2.5,4:2.5};
  let doc=engraveProject(p);
  assert.equal(doc.systems[0].first,1);
  assert.equal(doc.systems[0].last,4);
  assert.equal(doc.systems[0].measures.length,4);
  // A per-system override must be just as authoritative when the global mode is Auto.
  p.layout.measuresPerSystem=0;
  p.layout.systemCounts={'1':4};
  doc=engraveProject(p);
  assert.equal(doc.systems[0].measures.length,4);
  // A deliberate manual break still takes precedence over the fixed count.
  p.layout.systemBreaks=[2];
  doc=engraveProject(p);
  assert.equal(doc.systems[0].last,2);
});
