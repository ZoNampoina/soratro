import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,makeNote} from '../src/music/model.ts';
import {selectEvent,validSelection} from '../src/music/selection.ts';
import {engraveProject} from '../src/score/engraving.ts';
import {DEFAULT_SOLFA_DISPLAY} from '../src/solfa/display.ts';

test('Hidden Solfa rests retain every time anchor, voice position, held note and source event',()=>{
  const p=createProject({timeSignature:'4/4'});
  p.tracks[0].events=[makeNote('soprano',60,1,2,p.tempo)];
  p.tracks[1].events=[makeNote('alto',55,0,.5,p.tempo),makeNote('alto',57,2,1,p.tempo)];
  const before=structuredClone(p),hidden=engraveProject(p);
  p.notation={...DEFAULT_SOLFA_DISPLAY,showRests:true};const shown=engraveProject(p);
  assert.ok(shown.pages.flatMap(p=>p.ops).some(op=>op.kind==='text'&&op.text==='0'));
  assert.ok(!hidden.pages.flatMap(p=>p.ops).some(op=>op.kind==='text'&&op.text==='0'));
  assert.deepEqual(hidden.systems.map(s=>s.measures),shown.systems.map(s=>s.measures));
  assert.deepEqual(hidden.pages.flatMap(p=>p.ops).filter(op=>op.kind==='text'&&op.noteIds?.length),shown.pages.flatMap(p=>p.ops).filter(op=>op.kind==='text'&&op.noteIds?.length));
  assert.deepEqual(p.tracks,before.tracks);assert.ok(hidden.pages.flatMap(p=>p.ops).some(op=>op.kind==='text'&&op.text==='-'));
});
test('Ctrl/Cmd toggle and Shift chronological range share stable IDs across voices and keep a valid primary',()=>{
  const p=createProject(),a=Array.from({length:5},(_,i)=>makeNote('soprano',60+i,i,.5,p.tempo)),b=makeNote('alto',55,1,.5,p.tempo);
  p.tracks[0].events=a.slice().reverse();p.tracks[1].events=[b];
  let s=selectEvent(p,null,a[1],'replace');s=selectEvent(p,s,a[4],'range');assert.deepEqual(new Set(s!.ids),new Set(a.slice(1).map(n=>n.id)));
  s=selectEvent(p,s,b,'toggle');assert.equal(s!.ids!.length,5);s=selectEvent(p,s,b,'toggle');assert.equal(s!.ids!.length,4);assert.equal(s!.trackId,'soprano');
  p.tracks[0].events=p.tracks[0].events.filter(n=>n.id!==s!.id);const remaining=validSelection(p,s);assert.equal(remaining!.ids!.length,3);assert.ok(p.tracks[0].events.some(n=>n.id===remaining!.id));
});
