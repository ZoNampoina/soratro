import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,makeNote,type Signature} from '../src/music/model.ts';
import {engraveProject,pageSVG} from '../src/score/engraving.ts';
import {solfaNoteMetrics,solfaTextMetrics} from '../src/score/solfa-metrics.ts';

const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const [name,starts,duration,centres] of [
 ['A: whole times',[0,1,2,3],1,[.5,1.5,2.5,3.5]],
 ['B: halves',[0,.5],.5,[.25,.75]],
 ['C: quarters',[0,.25,.5,.75],.25,[.125,.375,.625,.875]],
 ['D: thirds',[0,1/3,2/3],1/3,[1/6,.5,5/6]],
] as [string,number[],number,number[]][])test(`Cell centring ${name}`,()=>{
 const p=createProject({timeSignature:'4/4',tonic:'C'});p.layout.measuresPerSystem=1;p.tracks[0].events=starts.map(b=>makeNote('soprano',60,b,duration,60));const before=structuredClone(p),doc=engraveProject(p),m=doc.systems[0].measures[0],ops=doc.systems[0].ops.filter(o=>o.kind==='text'&&o.noteIds?.length&&o.measure===1);
 assert.equal(ops.length,starts.length);ops.forEach((op,i)=>{if(op.kind!=='text')return;const actualInkCenter=op.x+(113+1114)/4096*op.size,expected=m.x+m.inset+centres[i]/4*m.geometry.width*m.scale;close(actualInkCenter,expected);close(op.timeX!,m.x+m.inset+starts[i]/4*m.geometry.width*m.scale);});assert.deepEqual(p,before);
});
test('E: alterations and both octave directions remain attached, centred as complete ink shapes',()=>{
 const p=createProject({timeSignature:'4/4',tonic:'C'});p.layout.measuresPerSystem=1;p.tracks[0].events=[61,73,49,37].map((pitch,i)=>makeNote('soprano',pitch,i,1,60));const doc=engraveProject(p),m=doc.systems[0].measures[0];
 for(const op of doc.systems[0].ops)if(op.kind==='text'&&op.noteIds?.length&&op.measure===1){const note=p.tracks[0].events.find(n=>n.id===op.noteIds![0])!,ink=solfaNoteMetrics(note.midiPitch,p,op.size);close(op.x+(ink.left+ink.right)/2,m.x+m.inset+(note.originalStart+.5)/4*m.geometry.width*m.scale);assert.equal(op.baseText,'di');assert.equal(op.size,p.layout.noteSize);}
 const svg=pageSVG(doc.pages[0]);assert.match(svg,/<tspan font-size="11\.9"/);assert.match(svg,/font-kerning:none/);
});
test('Irregular attacks, holds, rests, compound cells and SATB subdivisions preserve each voice’s own space',()=>{
 for(const signature of ['4/4','6/8'] as Signature[]){const p=createProject({timeSignature:signature,tonic:'C'});p.layout.measuresPerSystem=1;p.tracks[0].events=[makeNote('soprano',60,.37,.21,60)];p.tracks[1].events=[0,.25,.5,.75].map(b=>makeNote('alto',60,b,.25,60));p.tracks[3].events=[makeNote('bass',60,0,3,60)];const doc=engraveProject(p),m=doc.systems[0].measures[0];for(const op of doc.systems[0].ops)if(op.kind==='text'&&op.role==='note'&&op.measure===1){const ink=op.noteIds?.length?solfaNoteMetrics(60,p,op.size):solfaTextMetrics(op.text,op.size);close(op.x+(ink.left+ink.right)/2,op.centerX!);}const irregular=doc.systems[0].ops.find(o=>o.noteIds?.includes(p.tracks[0].events[0].id))!;close(irregular.cellEnd!,.58);close(irregular.centerX!,m.x+m.inset+.475/(m.geometry.end-m.geometry.begin)*m.geometry.width*m.scale);const bass=doc.systems[0].ops.find(o=>o.trackId==='bass'&&o.noteIds?.length)!;close(bass.cellEnd!,signature==='6/8'?1.5:1);}
});

test('Chords centre the combined ink, while syllables follow a note with an irregular end near a pulse',()=>{
 const p=createProject({timeSignature:'4/4',tonic:'C'});p.layout.measuresPerSystem=1;p.tracks[0].events=[makeNote('soprano',60,0,.98,60),makeNote('soprano',73,0,.98,60)];p.lyrics=[{id:'line',trackId:'soprano',text:'Ry',syllables:[{text:'Ry',noteId:p.tracks[0].events[0].id}]}];const doc=engraveProject(p),ops=doc.systems[0].ops,notes=ops.filter(o=>o.kind==='text'&&o.trackId==='soprano'&&o.noteIds?.length);assert.equal(notes.length,2);const first=notes[0],last=notes[1];if(first.kind!=='text'||last.kind!=='text')throw Error('Expected notes');const a=solfaNoteMetrics(60,p,first.size),b=solfaNoteMetrics(73,p,last.size);close((first.x+a.left+last.x+b.right)/2,first.centerX!);const lyric=ops.find(o=>o.kind==='text'&&o.role==='lyric'&&o.text==='Ry')!;if(lyric.kind!=='text')throw Error('Expected lyric');const ink=solfaTextMetrics('Ry',lyric.size);close(lyric.x+ink.advance/2,first.centerX!);
});
