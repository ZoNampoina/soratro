import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,makeNote,id} from '../src/music/model.ts';
import {measureAt} from '../src/music/timeline.ts';
import {beatAtCursorAddress,cursorAddress,cursorLabel,moveCursor,snapCursor,cursorStep} from '../src/music/cursor.ts';
import {normalizeNavigation} from '../src/storage/ui-preferences.ts';
import {playbackChunks,playbackMeasureOrder,playbackSongBeat,playbackBeat,playbackSeconds} from '../src/music/repeats.ts';
import {AudioEngine} from '../src/audio/engine.ts';

function fixture(){const p=createProject({timeSignature:'4/4',tempo:60,tonic:'C'});p.settings.measureCount=24;p.settings.quantization='1/8';return p;}
test('Measure 7 time 3 and measure 12 second half of time 3 have exact independent addresses',()=>{
 const p=fixture(),a={measure:7,time:3,division:1,part:1},b={measure:12,time:3,division:2,part:2};
 assert.equal(beatAtCursorAddress(p,a),26);assert.equal(beatAtCursorAddress(p,b),46.5);assert.deepEqual(cursorAddress(p,46.5),b);assert.equal(cursorLabel(p,26),'Mesure 7 — Temps 3');
 assert.throws(()=>beatAtCursorAddress(p,{...a,time:5}),/dépasse/);assert.throws(()=>beatAtCursorAddress(p,{...a,measure:25}),/invalide/);
});
test('Cursor addresses and keys follow pickups, signature changes and exact thirds',()=>{
 const p=fixture();p.settings.pickupBeats=.5;p.signatureMap=[{measure:3,signature:'6/8'}];p.settings.quantization='triplet-eighth';
 assert.equal(measureAt(p,2).start,.5);assert.equal(beatAtCursorAddress(p,{measure:3,time:2,division:3,part:2}),4.5+.5+.5/3);
 assert.equal(moveCursor(p,0,'next-measure'),.5);assert.equal(moveCursor(p,.5,'previous-time'),0);assert.equal(moveCursor(p,4.5,'previous-time'),3.5);
 assert.ok(Math.abs(moveCursor(p,4.5,'next-subdivision')-(4.5+1/3))<1e-12);assert.equal(cursorStep(p),1/3);
});
test('Snapping includes the active grid and real irregular attacks without altering notes',()=>{
 const p=fixture();p.tracks[0].events=[makeNote('soprano',60,.37,.2,60)];const before=structuredClone(p);
 assert.equal(snapCursor(p,.371),.37);assert.equal(snapCursor(p,26.48),26.5);assert.equal(moveCursor(p,26.5,'previous-subdivision'),26);assert.equal(moveCursor(p,26.5,'next-time'),27);assert.deepEqual(p,before);
});
test('Navigation restores a finite work cursor separately from selection and ignores damaged preferences',()=>{
 const selected={id:'note',trackId:'alto'},value=normalizeNavigation({mode:'partition',cursorBeat:26.5,selected});
 assert.equal(value.cursorBeat,26.5);assert.equal(value.selected?.id,'note');assert.equal(normalizeNavigation({cursorBeat:Infinity}).cursorBeat,0);assert.equal(normalizeNavigation({cursorBeat:-10}).cursorBeat,0);assert.equal(normalizeNavigation({}).cursorBeat,0);
});
test('A mid-piece repeat path starts there, skips preceding sections initially and keeps future written returns',()=>{
 const p=fixture();p.settings.measureCount=8;p.tempoMap=[{measure:7,bpm:120}];p.repeats=[{id:id(),startMeasure:1,endMeasure:2,times:2},{id:id(),startMeasure:6,endMeasure:7,times:2}];
 assert.deepEqual(playbackMeasureOrder(p,7),[7,6,7,8]);const from=26.5,chunks=playbackChunks(p,from);assert.equal(chunks[0].songStart,26.5);assert.equal(playbackSongBeat(p,0,from),26.5);
 assert.equal(playbackSongBeat(p,1.5,from),20);assert.equal(playbackSeconds(p,0,1.5,from),.75);
 for(let raw=0;raw<=chunks.at(-1)!.rawEnd;raw+=.23)assert.ok(Math.abs(playbackBeat(p,0,playbackSeconds(p,0,raw,from),from)-raw)<1e-7);
});
test('Starting after an earlier Fine still reaches the requested measure, with later navigation evaluated afresh',()=>{
 const p=fixture();p.settings.measureCount=8;p.indications=[{id:id(),kind:'navigation',symbol:'fine',measure:2,text:'Fine'}];
 assert.deepEqual(playbackMeasureOrder(p),[1,2]);assert.deepEqual(playbackMeasureOrder(p,7),[7,8]);assert.equal(playbackSongBeat(p,0,26.5),26.5);
});
test('Audio starts on the chosen beat and resumes the same repeat occurrence after pause',async()=>{
 const p=fixture();p.settings.measureCount=8;p.repeats=[{id:id(),startMeasure:6,endMeasure:7,times:2}];
 const engine=new AudioEngine(),internal=engine as any;internal.project=p;internal.context={currentTime:10};internal.init=async()=>internal.context;internal.stopInternal=()=>{};internal.startScheduler=()=>{};internal.scheduleHeldNotes=()=>{};
 await engine.play(26.5);assert.equal(engine.position(),26.5);assert.equal(engine.rawBeat(),0);
 internal.context.currentTime=12.04;assert.ok(Math.abs(engine.position()-20.5)<1e-8);engine.pause();assert.ok(Math.abs(engine.position()-20.5)<1e-8);await engine.play();assert.ok(Math.abs(engine.position()-20.5)<1e-8);assert.ok(Math.abs(engine.rawBeat()-2)<1e-8);
});
test('Metronome next pulse is calculated in the song measure when the repeat clock starts at raw zero',async()=>{
 const p=fixture();p.repeats=[{id:id(),startMeasure:6,endMeasure:7,times:2}];const engine=new AudioEngine(),internal=engine as any;
 internal.project=p;internal.context={currentTime:10};internal.init=async()=>internal.context;internal.stopInternal=()=>{};internal.tick=()=>{};internal.scheduleHeldNotes=()=>{};
 const frame=globalThis.requestAnimationFrame;globalThis.requestAnimationFrame=()=>0;
 try{await engine.play(26.5);assert.equal(internal.nextClick,.5);assert.equal(engine.position(),26.5);}finally{clearInterval(internal.timer);globalThis.requestAnimationFrame=frame;}
});

test('The cursor cannot enter a phantom measure after the score or during its last keyboard step',()=>{
 const p=fixture();assert.equal(moveCursor(p,95.5,'next-time'),95.5);assert.equal(moveCursor(p,95.5,'next-measure'),95.5);assert.equal(moveCursor(p,95.5,'next-subdivision'),95.5);
});
