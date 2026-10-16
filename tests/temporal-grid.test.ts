import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,makeNote,type Project,type Signature,id} from '../src/music/model.ts';
import {engraveProject,pageSVG,systemPage,type DrawOp,PX_PER_MM} from '../src/score/engraving.ts';
import {solfaTextMetrics,solfaNoteMetrics} from '../src/score/solfa-metrics.ts';
import {textWidth} from '../src/score/font-metrics.ts';
import {measureAt} from '../src/music/timeline.ts';
import {punctuationMetrics,punctuationSettings} from '../src/score/punctuation.ts';
import {validateProject,migrateProject} from '../src/storage/migrations.ts';
import {encodeProject,decodeProject} from '../src/storage/project-file.ts';
import {pdfBytes} from '../src/score/export.ts';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
const EPS=1e-7; // Document coordinates in px; round-tripped SVG uses 3 decimals separately.
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<EPS,`${a} != ${b}`);
function fixture(signature:Signature='4/4'):Project{const p=createProject({tonic:'C',timeSignature:signature});p.settings.measureCount=7;p.layout.measuresPerSystem=1;return p;}
const inkBounds:Record<string,[number,number]>={':':[240/2048,451/2048],'.':[219/2048,430/2048],',':[158/2048,451/2048]}; // independently checked against the bundled font
function center(op:DrawOp){assert.equal(op.kind,'text');if(op.kind!=='text')throw Error('Expected text');const bounds=op.role==='rhythm'?inkBounds[op.text]:undefined;const glyph=solfaTextMetrics(op.baseText??op.text,op.size);return op.x+(bounds?(bounds[0]+bounds[1])*op.size/2:(glyph.left+glyph.right)/2);}
for(const mode of ['grid','independent','adaptive'] as const)test(`Note attacks retain affine distances with changing subdivisions in ${mode}`,()=>{
 const p=fixture();p.layout.measureAlignment=mode;p.tracks[0].events=[[0,1],[1,.5],[1.5,.5],[2,2]].map(([b,d])=>makeNote('soprano',60,b,d,72));const before=structuredClone(p),doc=engraveProject(p),ops=doc.systems[0].ops.filter(o=>o.kind==='text'&&o.noteIds?.length);
 close(ops[1].timeX!-ops[0].timeX!,2*(ops[2].timeX!-ops[1].timeX!));close(ops[3].timeX!-ops[0].timeX!,2*(ops[1].timeX!-ops[0].timeX!));const m=doc.systems[0].measures[0];[.5,1.25,1.75,2.5].forEach((b,i)=>close(center(ops[i]),m.x+m.inset+b/4*m.geometry.width*m.scale));assert.deepEqual(p,before);
});
test('Thirds retain their exact musical times and one third of the graphic pulse',()=>{
 const p=fixture();p.tracks.forEach(t=>t.events=[0,1/3,2/3,1].map(b=>makeNote(t.id,60,b,1/3,72)));const doc=engraveProject(p),m=doc.systems[0].measures[0],a=m.geometry.anchors;
 assert.ok(a.some(v=>Math.abs(v.beat-1/3)<1e-12));assert.ok(a.some(v=>Math.abs(v.beat-2/3)<1e-12));for(const v of a)close(v.x/m.geometry.width,(v.beat-m.geometry.begin)/(m.geometry.end-m.geometry.begin));
 const notes=doc.systems[0].ops.filter(o=>o.kind==='text'&&o.noteIds?.length&&o.trackId==='soprano');close(center(notes[1])-center(notes[0]),(center(notes[3])-center(notes[0]))/3);close(center(notes[2])-center(notes[0]),2*(center(notes[3])-center(notes[0]))/3);
});
test('Rounded and unquantized subdivision times keep their real anchors without artificial close cells',()=>{
 for(const [signature,beats] of [['4/4',[0,.3333,.6667]],['4/4',[0,.24998,.5,.74997]],['4/4',[0,.49996,1]],['6/8',[0,.5001,1.0002]]] as [Signature,number[]][]){
  const p=fixture(signature),end=measureAt(p,1).end;p.layout.orientation='landscape';p.tracks[0].events=beats.map((beat,i)=>makeNote('soprano',60,beat,(beats[i+1]??end)-beat,72));
  const before=structuredClone(p),doc=engraveProject(p),m=doc.systems[0].measures[0],notes=doc.systems[0].ops.filter(o=>o.kind==='text'&&o.noteIds?.length&&o.trackId==='soprano');
  assert.deepEqual(doc.warnings,[]);assert.deepEqual(notes.map(o=>o.beat),beats);for(const op of notes)close(op.timeX!,m.x+m.inset+op.beat!/end*m.geometry.width*m.scale);
  const cells=doc.systems[0].ops.filter(o=>o.role==='note'&&o.trackId==='soprano');for(const beat of beats)assert.equal(cells.filter(o=>Math.abs(o.beat!-beat)<1e-4).length,1);assert.deepEqual(p,before);
 }
});
test('Hiding every voice name frees its reserve while preserving shared columns',()=>{
 const p=fixture();p.layout.measuresPerSystem=4;const withLabels=engraveProject(p);p.layout.voiceLabels='never';const doc=engraveProject(p),margin=p.layout.margin*PX_PER_MM;
 assert.ok(doc.systems[0].measures[0].x<withLabels.systems[0].measures[0].x);close(doc.systems[0].measures[0].x,margin);close(doc.systems[0].measures.at(-1)!.x+doc.systems[0].measures.at(-1)!.width,doc.pages[0].width-margin);
 doc.systems.slice(1).forEach(s=>s.measures.forEach((m,i)=>close(m.x,doc.systems[0].measures[i].x)));
});
for(const signature of ['2/4','3/4','4/4','6/8','9/8','12/8'] as const)test(`Principal separators use one musical reference for different SATB rhythms in ${signature}`,()=>{
 const p=fixture(signature),metric=measureAt(p,1);p.tracks[0].events=[makeNote('soprano',60,0,metric.barBeats,72)];p.tracks[1].events=Array.from({length:metric.numerator},(_,i)=>makeNote('alto',62,i*metric.pulse,metric.pulse,72));p.tracks[2].events=[makeNote('tenor',64,metric.pulse/2,metric.pulse/2,72)];const doc=engraveProject(p),m=doc.systems[0].measures[0];
 const ops=doc.systems[0].ops.filter(o=>o.kind==='text'&&o.text===':'&&o.measure===1);const expected=metric.compound?metric.numerator/3-1:metric.numerator-1;assert.equal(ops.length,expected*4);
 for(const op of ops){close(center(op),m.x+m.inset+(op.beat!-metric.start)/metric.barBeats*(m.width-m.inset-(p.repeats.length?20:8)));for(const t of p.tracks)assert.ok(ops.some(other=>other.trackId===t.id&&other.beat===op.beat&&Math.abs(center(other)-center(op))<EPS));}
});

function mixed(){
 const p=fixture(),patterns=[[[0,1],[1,.5],[1.5,.5],[2,1],[3,1]],[[0,.5],[.5,.5],[1,.25],[1.25,.25],[1.5,.25],[1.75,.25],[2,1],[3,1]],[[0,1],[1,1],[2,1/3],[2+1/3,1/3],[2+2/3,1/3],[3,1]],[[0,4]]];
 p.layout.orientation='landscape';p.tracks.forEach((t,i)=>t.events=patterns[i].map(([b,d])=>makeNote(t.id,i===1&&b===3?84:[60,72,48,36][i],b,d,72)));return p;
}
function fullGlyphWidth(op:DrawOp){if(op.kind!=='text')throw Error('Expected text');return textWidth(op.baseText??op.text,op.size)+textWidth((op.octave!>0?"'":',').repeat(Math.abs(op.octave??0)),op.size*.7);}
for(const size of [12,17,20,24])for(const style of ['normal','reinforced','custom'] as const)test(`${style} punctuation at ${size} px keeps temporal fractions, octaves and collision-free lanes`,()=>{
 const p=mixed();p.layout.noteSize=size;p.layout.punctuation={style,size:1.1,contrast:.95,weight:1.6,gap:2.5};const before=structuredClone(p),doc=engraveProject(p),s=doc.systems[0],m=s.measures[0],metrics=punctuationMetrics(p.layout),settings=punctuationSettings(p.layout);
 assert.deepEqual(doc.warnings,[]);const notes=s.ops.filter(o=>o.kind==='text'&&o.role==='note'),signs=s.ops.filter(o=>o.role==='rhythm');
 for(const op of notes){assert.equal(op.kind==='text'?op.size:0,size);if(op.kind==='text'&&op.noteIds?.length){const pitch=p.tracks.flatMap(t=>t.events).find(n=>n.id===op.noteIds![0])!.midiPitch,ink=solfaNoteMetrics(pitch,p,size);close(op.x+(ink.left+ink.right)/2,op.centerX!);close(op.centerX!,m.x+m.inset+(op.beat!+op.cellEnd!)/8*m.geometry.width*m.scale);}}
 for(const op of signs){const expected=m.x+m.inset+op.beat!/4*(m.geometry.width*m.scale);close(op.timeX!,expected);if(op.kind==='text'){assert.equal(op.size,size*settings.size);close(center(op),expected);}else if(op.kind==='circle'){assert.equal(op.radius,metrics.dotRadius);close(op.x,expected);}else if(op.kind==='curve')assert.equal(op.width,metrics.thirdWidth);assert.equal(op.color,metrics.color);}
 const first=signs.find(o=>o.trackId==='soprano'&&o.rhythmKind==='half')!,quarter=signs.filter(o=>o.trackId==='alto'&&o.rhythmKind==='quarter'),third=signs.filter(o=>o.trackId==='tenor'&&o.rhythmKind==='third');
 close((first.timeX!-m.x-m.inset)/(m.geometry.width*m.scale),1.5/4);assert.deepEqual(quarter.map(o=>o.beat),[1.25,1.75]);assert.equal(third.length,2);close(third[0].beat!-2,1/3);close(third[1].beat!-2,2/3);
 assert.equal(signs.filter(o=>o.trackId==='bass'&&o.rhythmKind!=='pulse').length,0);assert.equal(notes.filter(o=>o.trackId==='bass').length,4); // one attack and the three principal continuations
 for(const track of p.tracks){const glyphs=notes.filter(o=>o.trackId===track.id),punctuation=signs.filter(o=>o.trackId===track.id);for(const a of glyphs)for(const b of punctuation)if(a.kind==='text'&&b.kind==='text'){const bounds=inkBounds[b.text],note=a.noteIds?.length?p.tracks.flatMap(t=>t.events).find(n=>n.id===a.noteIds![0]):undefined,glyph=note?solfaNoteMetrics(note.midiPitch,p,a.size):solfaTextMetrics(a.text,a.size),left=Math.max(a.x+glyph.left,b.x+bounds[0]*b.size-(b.strokeWidth??0)/2),right=Math.min(a.x+glyph.right,b.x+bounds[1]*b.size+(b.strokeWidth??0)/2);assert.ok(right-left<1e-6,`${track.id}: collision at ${a.beat}/${b.beat}`);}}
 const svg=pageSVG(doc.pages[0]);assert.ok(svg.includes('data-rhythm-kind="third"'));assert.match(svg,/<tspan font-size=/);for(const octave of [1,2,-1,-2])assert.ok(notes.some(o=>o.kind==='text'&&o.octave===octave));if(style==='reinforced'||style==='custom')assert.match(svg,/paint-order="stroke fill"/);assert.deepEqual(p,before);
});
test('Natural no-label grids center the complete reference row, leaving the incomplete row in its first columns',()=>{
 const p=fixture();p.layout.measuresPerSystem=4;p.layout.voiceLabels='never';p.layout.systemAlignment='natural';const doc=engraveProject(p),s=doc.systems[0],left=s.measures[0].x,right=s.measures.at(-1)!.x+s.measures.at(-1)!.width;close((left+right)/2,doc.pages[0].width/2);assert.equal(doc.systems[1].measures.length,3);doc.systems[1].measures.forEach((m,i)=>close(m.x,s.measures[i].x));
});
test('Long renamed labels, every label mode, lyrics and page breaks retain one origin and safe margins',()=>{
 const p=fixture();p.layout.measuresPerSystem=2;p.layout.pageBreaks=[2];p.tracks[0].shortName='SOPRANO';p.tracks.forEach(t=>t.events=Array.from({length:28},(_,i)=>makeNote(t.id,60,i,1,72)));p.lyrics=[{id:id(),trackId:'soprano',text:'Espérance',syllables:[{text:'Espérance',noteId:p.tracks[0].events[0].id}],verse:12}];
 for(const mode of ['first','page','always','never'] as const){p.layout.voiceLabels=mode;const doc=engraveProject(p),origin=doc.systems[0].measures[0].x;doc.systems.forEach(s=>close(s.measures[0].x,origin));for(const page of doc.pages)for(const op of page.ops)if(op.kind==='text'&&['voice','lyric'].includes(op.role??'')){assert.ok(op.x>=p.layout.margin*PX_PER_MM-1e-6);assert.ok(op.x+textWidth(op.text,op.size)<=page.width-p.layout.margin*PX_PER_MM+1e-6);}}
});
test('Compound secondary pulses, custom groups and a pickup preserve affine time',()=>{
 const p=fixture('6/8');p.layout.compoundPulse=false;let doc=engraveProject(p);assert.equal(doc.systems[0].ops.filter(o=>o.trackId==='soprano'&&o.rhythmKind==='pulse').length,5);
 p.timeSignature='5/8';p.settings.beatGroups=[3,2];p.layout.compoundPulse=true;doc=engraveProject({...p});const colon=doc.systems[0].ops.find(o=>o.trackId==='soprano'&&o.rhythmKind==='pulse')!,m=doc.systems[0].measures[0];close((colon.timeX!-m.x-m.inset)/(m.geometry.width*m.scale),3/5);
 const pickup=fixture();pickup.settings.pickupBeats=.5;pickup.tracks[0].events=[makeNote('soprano',60,0,.25,72),makeNote('soprano',62,.25,.25,72)];doc=engraveProject(pickup);assert.equal(doc.systems[0].ops.filter(o=>o.rhythmKind==='pulse').length,0);assert.equal(doc.systems[0].measures[0].geometry.end,.5);
});
test('Legacy layouts and customized punctuation round-trip without changing any musical field',async()=>{
 const p=mixed();delete p.layout.punctuation;const before=structuredClone(p);validateProject(p);engraveProject(p);assert.deepEqual(migrateProject(p),before);assert.deepEqual(await decodeProject(await encodeProject(p)),before);
 p.layout.punctuation={style:'custom',size:1.05,contrast:.9,weight:1.7,gap:3};p.layout.voiceLabels='never';const next=structuredClone(p);assert.deepEqual(await decodeProject(await encodeProject(p)),next);
 for(const patch of [{style:'bad'}, {size:1.31},{contrast:.39},{weight:.95},{gap:8.1},{size:NaN}]){const broken=structuredClone(p);Object.assign(broken.layout.punctuation!,patch);assert.throws(()=>validateProject(broken),/ponctuation/i);}
});
test('Vector PDF and cropped SVG keep the same strengthened punctuation, octave sizes and anchors',async()=>{
 const p=mixed();p.layout.noteSize=20;const doc=engraveProject(p),font=readFileSync('src/assets/ScoreFont.ttf').toString('base64'),bytes=Buffer.from(await pdfBytes(doc,font,p)),source=bytes.toString('latin1'),streams=[...source.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)].map(m=>{try{return inflateSync(Buffer.from(m[1],'latin1')).toString('latin1');}catch{return '';}}).join('\n');
 assert.match(streams,/15 Tf/);assert.match(streams,/10\.5 Tf/);assert.match(streams,/2 Tr/); // 20 px notes, 14 px octave marks, fill-and-stroke punctuation
 const crop=systemPage(doc.pages[0],doc.systems[0]),dx=20-doc.systems[0].x;for(const [i,op] of crop.ops.entries())if(op.timeX!==undefined)close(op.timeX,doc.systems[0].ops[i].timeX!+dx);
 const svg=pageSVG(doc.pages[0],font);assert.match(svg,/stroke-width="0\.28"/);mkdirSync('tmp/pdfs',{recursive:true});writeFileSync('tmp/pdfs/v07-rhythmic-grid.pdf',bytes);writeFileSync('tmp/pdfs/v07-rhythmic-grid.svg',svg);writeFileSync('tmp/pdfs/v07-rhythmic-grid.json',JSON.stringify(doc,null,2));
});
