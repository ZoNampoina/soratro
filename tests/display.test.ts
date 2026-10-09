import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject,makeNote } from '../src/music/model.ts';
import { engraveProject } from '../src/score/engraving.ts';
import { DEFAULT_SOLFA } from '../src/score/display.ts';
import { selectNote,selectionIds } from '../src/music/note-editing.ts';

test('Hidden rests retain identical temporal geometry, note coordinates and musical data',()=>{
  const p=createProject();p.tracks[0].events=[makeNote('soprano',65,.5,.5,72)];
  const before=structuredClone(p),clean=engraveProject(p),detailed=engraveProject(p,undefined,{...DEFAULT_SOLFA,rests:true});
  assert.ok(detailed.pages.flatMap(p=>p.ops).some(op=>op.kind==='text'&&op.text==='0'));
  assert.ok(!clean.pages.flatMap(p=>p.ops).some(op=>op.kind==='text'&&op.text==='0'));
  assert.deepEqual(clean.systems.map(s=>s.measures),detailed.systems.map(s=>s.measures));
  assert.deepEqual(clean.pages.flatMap(p=>p.ops).filter(op=>op.kind==='text'&&op.noteIds?.length),detailed.pages.flatMap(p=>p.ops).filter(op=>op.kind==='text'&&op.noteIds?.length));
  assert.deepEqual(p,before);
});
test('Ctrl toggles arbitrary cross-track notes, removes the primary safely and Shift extends a temporal range',()=>{
  const p=createProject();p.tracks[0].events=Array.from({length:10},(_,i)=>makeNote('soprano',60+i,i,.5,72));
  const n=p.tracks[0].events;
  let s=selectNote(p,null,n[0]);s=selectNote(p,s,n[3],{add:true});s=selectNote(p,s,n[6],{add:true});
  assert.deepEqual([...selectionIds(s)],[n[0].id,n[3].id,n[6].id]);
  s=selectNote(p,s,n[6],{add:true});assert.equal(s?.id,n[0].id);
  s=selectNote(p,s,n[3],{range:true});assert.ok([0,1,2,3].every(i=>selectionIds(s).has(n[i].id)));
  const alto=makeNote('alto',61,1,1,72);p.tracks[1].events=[alto];
  s=selectNote(p,s,alto,{add:true});assert.ok(selectionIds(s).has(alto.id));
});
