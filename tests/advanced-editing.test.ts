import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {createProject,makeNote,noteStart,noteDuration,TONICS} from '../src/music/model.ts';
import {selectNote,copyNotes,pasteNotes,deleteNotes,type Selection} from '../src/music/note-editing.ts';
import {alignSelected,moveSelected,durationSelected,transposeSelected,solfaToMidi,selectionBounds} from '../src/music/selection-editing.ts';
import {convertSolfa} from '../src/solfa/converter.ts';
import {ProjectStore} from '../src/storage/store.ts';
import {RecordingSession} from '../src/recording/session.ts';
import {AudioEngine} from '../src/audio/engine.ts';
import {encodeProject,decodeProject} from '../src/storage/project-file.ts';
import {engraveProject,pageSVG} from '../src/score/engraving.ts';
Object.assign(globalThis,{location:{hash:'',pathname:'/'},history:{replaceState(){}}});
function fixture(){const p=createProject({tonic:'Db',timeSignature:'7/8',tempo:84});p.tracks[0].events=Array.from({length:10},(_,i)=>makeNote('soprano',61+i,i*.5,.25,84));p.tracks[1].events=[makeNote('alto',56,2,1,84)];return p;}
const raw=(p:ReturnType<typeof fixture>)=>p.tracks.flatMap(t=>t.events.map(n=>({id:n.id,start:n.originalStart,duration:n.originalDuration,seconds:n.startTime,end:n.endTime,rawDuration:n.duration})));
test('Notes 1, 4, 7 move together, preserve raw performance and undo/redo in one transaction',async()=>{
  const store=new ProjectStore(),p=fixture();await store.add(p);const notes=p.tracks[0].events;
  let s=selectNote(p,null,notes[0]);s=selectNote(p,s,notes[3],{add:true});s=selectNote(p,s,notes[6],{add:true});
  const before=structuredClone(store.getSnapshot().project!);store.update(p=>moveSelected(p,s,1,2));
  const after=structuredClone(store.getSnapshot().project!);assert.equal(store.getSnapshot().undoCount,1);
  assert.deepEqual(after.tracks[0].events.map((n,i)=>noteStart(n)-noteStart(notes[i])),[1,0,0,1,0,0,1,0,0,0]);assert.deepEqual(raw(after),raw(before));
  store.undo();assert.deepEqual(store.getSnapshot().project!.tracks,before.tracks);store.redo();assert.deepEqual(store.getSnapshot().project!.tracks,after.tracks);await store.flush();
});
test('Every alignment preserves pitches and raw timing, and cross-voice edits remain one undo operation',async()=>{
  for(const kind of ['starts','ends','duration','spread','grid'] as const){
    const store=new ProjectStore(),p=fixture();const notes=[p.tracks[0].events[1],p.tracks[0].events[6],p.tracks[1].events[0]],s={trackId:notes[0].trackId,id:notes[0].id,ids:notes.map(n=>n.id)};
    await store.add(p);const before=structuredClone(store.getSnapshot().project!);store.update(p=>alignSelected(p,s,kind,.5));const after=store.getSnapshot().project!;
    assert.deepEqual(raw(after),raw(before));assert.deepEqual(after.tracks.map(t=>t.events.map(n=>n.midiPitch)),before.tracks.map(t=>t.events.map(n=>n.midiPitch)));assert.equal(store.getSnapshot().undoCount,1);
    const changed=after.tracks.flatMap(t=>t.events).filter(n=>s.ids.includes(n.id));
    if(kind==='starts')assert.equal(new Set(changed.map(noteStart)).size,1);if(kind==='ends')assert.equal(new Set(changed.map(n=>noteStart(n)+noteDuration(n))).size,1);if(kind==='duration')assert.equal(new Set(changed.map(noteDuration)).size,1);
    store.undo();assert.deepEqual(store.getSnapshot().project!.tracks,before.tracks);await store.flush();
  }
});
test('Locked tracks reject all grouped mutations, old tools, take changes and REC without partial history',async()=>{
  const store=new ProjectStore(),p=fixture();p.tracks[1].locked=true;await store.add(p);
  const s:Selection={trackId:'soprano',id:p.tracks[0].events[0].id,ids:[p.tracks[0].events[0].id,p.tracks[1].events[0].id]},before=structuredClone(store.getSnapshot().project!),copy=copyNotes(before,s)!;
  for(const fn of [(p:typeof before)=>moveSelected(p,s,1,1),(p:typeof before)=>durationSelected(p,s,2),(p:typeof before)=>transposeSelected(p,s,2),(p:typeof before)=>alignSelected(p,s,'starts',.5),(p:typeof before)=>deleteNotes(p,s),(p:typeof before)=>pasteNotes(p,copy,4),(p:typeof before)=>{p.tracks[1].events[0].midiPitch++;},(p:typeof before)=>{p.tracks[1].events=[];},(p:typeof before)=>{p.takes.push({id:'take',name:'Take',trackId:'alto',createdAt:p.createdAt,startBeat:0,endBeat:3,events:[],selected:false,mode:'overdub'});}]){
    assert.throws(()=>store.update(fn),/Piste verrouillée : Alto/);assert.deepEqual(store.getSnapshot().project,before);assert.equal(store.getSnapshot().undoCount,0);
  }
  const engine=new AudioEngine(),session=new RecordingSession(engine,store);session.trackId='alto';await assert.rejects(session.record(2),/Alto/);assert.equal(engine.status,'idle');assert.equal(store.getSnapshot().undoCount,0);
  store.update(p=>{p.tracks[1].mute=true;p.tracks[1].color='#123456';});assert.equal(store.getSnapshot().project!.tracks[1].locked,true);assert.ok(copyNotes(store.getSnapshot().project!,s));await store.flush();
});
test('Do mobile direct Solfa editing is reversible for every MIDI pitch and key; bounds reject invalid edits',()=>{
  for(const tonic of TONICS)for(let midi=0;midi<=127;midi++){const n=convertSolfa(midi,tonic);assert.equal(solfaToMidi(n.degree,n.alteration,n.octave,tonic),midi);}
  const p=fixture(),n=p.tracks[0].events[2],s={id:n.id,trackId:n.trackId};transposeSelected(p,s,solfaToMidi(4,0,0,'Db')-n.midiPitch);assert.equal(p.tracks[0].events[2].midiPitch,66);
  const before=structuredClone(p);assert.throws(()=>transposeSelected(p,s,128),/limites/);assert.deepEqual(p,before);assert.throws(()=>durationSelected(p,s,.001),/limites/);assert.deepEqual(p,before);assert.equal(selectionBounds(p,s)?.start,noteStart(n));
});
test('Portable old/new projects retain music, locks, colors and raw timing; chord notes have individual source IDs',async()=>{
  const p=fixture();p.tracks[0].locked=true;p.tracks[0].color='#123456';const copy=await decodeProject(await encodeProject(p));assert.deepEqual(copy,p);
  delete copy.tracks[0].locked;const legacy=await decodeProject(await encodeProject(copy));assert.deepEqual(legacy.tracks,copy.tracks);
  const chord=[makeNote('soprano',61,0,.5,84),makeNote('soprano',65,0,.5,84)];p.tracks[0].events=chord;
  const doc=engraveProject(p),svg=pageSVG(doc.pages[0],undefined,true);for(const n of chord)assert.ok(svg.includes('data-note-id="'+n.id+'"'));assert.equal((svg.match(/data-note-id="[^"]+" role="button"/g)??[]).length,doc.pages[0].ops.filter(op=>op.kind==='text'&&op.noteIds?.length).length);
});
test('A stopped or superseded async prelisten never starts a dangling note; playback suppresses it',async()=>{
  const engine=new AudioEngine();let resolve!:()=>void;engine.init=()=>new Promise(resolveInit=>{resolve=()=>resolveInit(null as any);});const starts:number[]=[];engine.noteOn=(_key,pitch)=>starts.push(pitch);engine.noteOff=()=>{};
  const pending=engine.previewNote(65,'soprano');engine.allNotesOff();resolve();await pending;assert.deepEqual(starts,[]);
  (engine as any).mode='playing';await engine.previewNote(70,'soprano');assert.deepEqual(starts,[]);
});
