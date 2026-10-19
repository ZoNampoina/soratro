import test from 'node:test';import assert from 'node:assert/strict';
import {newScanSession,type ScanSession,type ScanRow} from '../src/recognition/types.ts';
import {parseMusicRow,convertScan,mergeScan,splitBars} from '../src/recognition/music.ts';
import {createProject,makeNote,noteStart,noteDuration,type Signature} from '../src/music/model.ts';
import {validateProject} from '../src/storage/migrations.ts';
import {encodeProject,decodeProject} from '../src/storage/project-file.ts';
import {engraveProject} from '../src/score/engraving.ts';
import {ScanHistory} from '../src/recognition/history.ts';
import {mergeScanRows,splitScanRow,manualScanRow} from '../src/recognition/editing.ts';
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function fixture(signature:Signature='4/4',text='|d:r.m:f,s,l:0|'){
 const s=newScanSession();Object.assign(s.hints,{title:'Scan QA',tonic:'Bb',signature,reviewed:true,voiceCount:1,choir:'Solo'});const r=manualScanRow('p',0,{x:0,y:0,width:500,height:40});Object.assign(r,{text,confirmed:true});s.rows=[r];return {s,r};
}
for(const [signature,text,durations] of [['2/4','|d:r.m|',[1,.5,.5]],['3/4','|d:r:m|',[1,1,1]],['4/4','|d:r.m:f,s,l:0|',[1,.5,.5,1/3,1/3,1/3]],['6/8','|d,r,m:f,s,l|',[.5,.5,.5,.5,.5,.5]]] as [Signature,string,number[]][])test(`Scan ${signature}: explicit halves, thirds and pitches survive native conversion`,async()=>{
 const {s,r}=fixture(signature,text),parsed=parseMusicRow(r,s);assert.deepEqual(parsed.issues,[]);const result=convertScan(s);assert.equal(result.importable,true,JSON.stringify(result.issues));assert.deepEqual(result.project.tracks[0].events.map(noteDuration),durations);assert.equal(result.project.tracks[0].events[0].midiPitch,70);assert.equal(result.project.settings.measureCount,1);validateProject(result.project);const round=await decodeProject(await encodeProject(result.project));assert.deepEqual(round.tracks,result.project.tracks);assert.ok(engraveProject(round).pages.length);
});
test('Scan refuses unknown key, signature, octave, subdivisions and unreviewed structure without fabricating notes',()=>{
 const {s,r}=fixture();s.hints.tonic='';assert.equal(convertScan(s).importable,false);s.hints.tonic='C';s.hints.reviewed=false;assert.equal(convertScan(s).importable,false);s.hints.reviewed=true;
 for(const value of ['|d:r|','|d,:r:m:f|','|?:r:m:f|','|d..r:r:m:f|','|dZ:r:m:f|']){r.text=value;const c=convertScan(s);assert.equal(c.importable,false,value);assert.equal(c.project.tracks[0].events.length,0,value);}
});
test('Scan 6/8 supports explicit six eighth pulses, pickup, lower octaves, alterations and chords',()=>{
 const {s,r}=fixture('6/8','|d:r:m:f:s:l|');s.hints.compoundPulse=false;const six=convertScan(s);assert.ok(six.importable);assert.deepEqual(six.project.tracks[0].events.map(noteDuration),Array(6).fill(.5));
 s.hints.signature='4/4';s.hints.pickupBeats=1;r.text='|di_1/m^1|d:-:0:s|';const c=convertScan(s);assert.ok(c.importable,JSON.stringify(c.issues));assert.equal(c.project.tracks[0].events[0].midiPitch,59);assert.equal(c.project.tracks[0].events[1].midiPitch,86);close(noteStart(c.project.tracks[0].events[2]),1);close(noteDuration(c.project.tracks[0].events[2]),2);
});
test('Scan prolongations cross zones, but a rejected row cannot mutate an earlier validated note',()=>{
 const {s,r}=fixture('2/4','|d:-|');const next={...structuredClone(r),id:'second',text:'|-:s|',firstMeasure:2};s.rows.push(next);let c=convertScan(s);assert.ok(c.importable);close(noteDuration(c.project.tracks[0].events[0]),3);next.text='|-:0|-:d|';c=convertScan(s);assert.equal(c.importable,false);close(noteDuration(c.project.tracks[0].events[0]),2);assert.equal(c.project.tracks[0].events.length,1);
});
test('Scan unknown rows stay in a separate draft; partial import marks omissions and never makes fake notes',()=>{
 const {s,r}=fixture('2/4','|d:r|');const bad={...structuredClone(r),id:'unknown',text:'|?:m|',firstMeasure:2,confirmed:false};s.rows.push(bad);const c=convertScan(s,{partial:true});assert.ok(c.importable);assert.equal(c.omittedRows,1);assert.equal(c.project.tracks[0].events.length,2);assert.ok(c.project.indications.some(i=>i.measure===2&&i.text?.includes('À vérifier')));assert.equal(bad.text,'|?:m|');
});
test('Scan keeps SATB aligned and rejects overlapping zones of the same voice',()=>{
 const {s,r}=fixture();Object.assign(s.hints,{choir:'SATB',voiceCount:4,voiceOctaves:[0,-1,-1,-2]});s.rows=Array.from({length:4},(_,voice)=>({...structuredClone(r),id:'v'+voice,voice}));const c=convertScan(s);assert.ok(c.importable);assert.deepEqual(c.project.tracks.map(t=>t.name),['Soprano','Alto','Ténor','Basse']);assert.deepEqual(c.project.tracks.map(t=>t.events[0].midiPitch),[70,58,58,46]);assert.ok(c.project.tracks.every(t=>noteStart(t.events[0])===0));s.rows.push({...r,id:'duplicate'});assert.equal(convertScan(s).importable,false);
});
test('Scan stale preparation blocks imports, while validated lyric melismas use native note links',()=>{
 const {s,r}=fixture('2/4','|d:r|');let c=convertScan(s);const ids=c.project.tracks[0].events.map(n=>n.id);s.rows.push({...manualScanRow('p',0,r.box),id:'words',kind:'lyrics',text:'Fitiavana',confirmed:true,lyricNotes:[ids]});c=convertScan(s);assert.ok(c.importable);assert.deepEqual(c.project.lyrics[0].syllables[0].noteIds,ids);close(c.project.lyrics[0].syllables[0].endBeat!,2);s.rows[1].lyricNotes=[['missing']];c=convertScan(s);assert.equal(c.project.lyrics.length,0);assert.ok(c.issues.some(i=>i.message.includes('liens syllabe')));
 s.pages.push({id:'p',sourceId:'a',rasterId:'b',name:'p',width:500,height:500,originalWidth:500,originalHeight:500,sourcePage:1,preparation:structuredClone((newScanSession()).pages[0]?.preparation??{quad:[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}],rotation:0,deskew:0,brightness:0,contrast:1,sharpness:0,noise:0,grayscale:true,adaptive:false,flatten:false,invert:false}),revision:1,regions:[]});assert.equal(convertScan(s).importable,false);
});
test('Scan imports use the existing measure engine, preserve target notes and support other choir formations',()=>{
 const {s}=fixture('2/4','|d:r|');s.hints.choir='SA';s.hints.voiceCount=2;const source=convertScan(s),target=createProject({timeSignature:'2/4'});target.tracks[0].events=[makeNote(target.tracks[0].id,60,0,1,72)];const before=structuredClone(target);mergeScan(target,source.project,{mode:'measures',afterMeasure:0,voiceMap:{'scan-voice-0':target.tracks[0].id,'scan-voice-1':'skip'}},1);assert.equal(source.project.tracks[0].name,'Soprano');assert.equal(noteStart(target.tracks[0].events.find(n=>n.id===before.tracks[0].events[0].id)!),2);validateProject(target);assert.deepEqual(before.tracks[0].events.map(n=>n.originalStart),[0]);
 const overlay=structuredClone(before);mergeScan(overlay,source.project,{mode:'voices',afterMeasure:0,voiceMap:{}},1);assert.deepEqual(overlay.tracks.slice(0,4),before.tracks);assert.equal(overlay.tracks.length,6);
 const locked=structuredClone(before);locked.tracks[0].locked=true;assert.throws(()=>mergeScan(locked,source.project,{mode:'measures',afterMeasure:0,voiceMap:{'scan-voice-0':'new'}},1),/verrouillée/);
});
test('Scan history includes regions and corrections, and textual splitting refuses invented image coordinates',()=>{
 const {s,r}=fixture('2/4','|d:r|m:f|'),h=new ScanHistory<ScanSession>();h.commit(s);s.rows[0].text='|s:l|';assert.equal(h.undo(s)!.rows[0].text,'|d:r|m:f|');assert.equal(h.redo(s)!.rows[0].text,'|s:l|');r.text='|d:r|m:f|';assert.throws(()=>splitScanRow(s,r.id,1),/barres/);assert.deepEqual(splitBars('|d:r|m:f|'),['d:r','m:f']);
});
test('Scan dot+comma preserves three-quarter/quarter durations without changing thirds or halves',()=>{
 const {s,r}=fixture('2/4',"|s.,d':s.,m|");const result=convertScan(s);assert.ok(result.importable,JSON.stringify(result.issues));assert.deepEqual(result.project.tracks[0].events.map(noteDuration),[.75,.25,.75,.25]);assert.deepEqual(result.project.tracks[0].events.map(noteStart),[0,.75,1,1.75]);assert.equal(result.project.tracks[0].events[1].midiPitch,82);
 s.hints.signature='4/4';s.hints.pulseBeats=2;const half=convertScan(s);assert.ok(half.importable);assert.deepEqual(half.project.tracks[0].events.map(noteDuration),[1.5,.5,1.5,.5]);
});
test('Scan partial conversion retains good measures around an unreadable measure with exact timeline positions',()=>{
 const {s,r}=fixture('2/4','|d:r|?:m|f:s|');assert.equal(convertScan(s).project.tracks[0].events.length,0);const partial=convertScan(s,{partial:true});assert.ok(partial.importable);assert.equal(partial.includedMeasures,2);assert.equal(partial.omittedMeasures,1);assert.deepEqual(partial.project.tracks[0].events.map(noteStart),[0,1,4,5]);assert.ok(partial.project.indications.some(i=>i.measure===2&&i.text?.includes('À vérifier')));assert.equal(r.text,'|d:r|?:m|f:s|');
});
test('Scan explicit draft can finish with zero notes and never invents music, while strict import stays blocked',async()=>{
 const {s,r}=fixture('4/4','|?:?:?:?|');r.confirmed=false;const before=structuredClone(s);assert.equal(convertScan(s).importable,false);assert.equal(convertScan(s,{partial:true}).importable,false);const draft=convertScan(s,{draft:true});assert.ok(draft.importable,JSON.stringify(draft.issues));assert.equal(draft.project.tracks.flatMap(t=>t.events).length,0);assert.match(draft.project.title,/Brouillon/);assert.ok(draft.project.indications.some(i=>i.text?.includes('À vérifier')));assert.deepEqual(s,before);assert.deepEqual((await decodeProject(await encodeProject(draft.project))).tracks,draft.project.tracks);
});
test('Scan draft preserves unreviewed proposals as flagged notes and keeps note IDs stable for existing lyric links',()=>{
 const {s,r}=fixture('2/4','|d:r|m:f|'),strict=convertScan(s);r.confirmed=false;const draft=convertScan(s,{draft:true});assert.ok(draft.importable);assert.deepEqual(draft.project.tracks[0].events,strict.project.tracks[0].events);assert.ok(draft.project.indications.some(i=>i.text?.includes('Proposition à vérifier')));
});
test('Scan missing metadata remains a real error even for a draft',()=>{const {s}=fixture();s.hints.tonic='';assert.equal(convertScan(s,{draft:true}).importable,false);});
test('Scan measure refinement preserves the entire original zone when precise bar coordinates are unavailable',async()=>{
 const {isolateScanMeasures}=await import('../src/recognition/editing.ts');const {s,r}=fixture('2/4','|d:r|?:m|f:s|'),before=structuredClone(s),history=new ScanHistory<ScanSession>();history.commit(s);const keys=isolateScanMeasures(s,r.id);assert.equal(keys.length,3);assert.deepEqual(s.rows.map(r=>r.firstMeasure),[1,2,3]);assert.deepEqual(s.rows.map(r=>r.text),['|d:r|','|?:m|','|f:s|']);assert.ok(s.rows.every(r=>JSON.stringify(r.box)===JSON.stringify(before.rows[0].box)));assert.deepEqual(history.undo(s),before);
});
