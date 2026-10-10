import {audio,type AudioEngine} from '../audio/engine.ts';
import {store,type ProjectStore} from '../storage/store.ts';
import {Recorder} from './recorder.ts';
import {id,noteStart,noteDuration,type NoteEvent,type Project,type TrackId} from '../music/model.ts';
import {cleanLyrics,removeRange} from '../music/editing.ts';
import {measureAt,measureForBeat,tempoAt,beatAfterSeconds} from '../music/timeline.ts';
import {chooseTake} from './takes.ts';
import {assertTracksUnlocked} from '../music/locks.ts';
import {quantizeForProject} from '../quantization/quantizer.ts';
import type {InputSource,VocalSegment,VocalDraft} from '../vocal/types.ts';
export interface FinishedRecording {projectId:string;source:InputSource;takes:{id:string;startTime:number;endTime:number}[]}
export class RecordingSession {
 trackId:TrackId='soprano';private held=new Map<string,{pitch:number;velocity:number;track:TrackId}>();private pending=new Set<string>();private cancelled=new Set<string>();private recording=false;private armed=false;private baseline:Project|null=null;private start=0;private end=Infinity;private takeId:string|null=null;private newTakes:string[]=[];private captured:NoteEvent[]=[];private recorder:Recorder;private cycle=0;private cycleTakes=new Map<number,string>();private takeTimes=new Map<string,number>();private source:InputSource='keyboard';
 onBegan:()=>void=()=>{};onBeforeFinish:()=>void=()=>{};onFinished:(result:FinishedRecording|null)=>void=()=>{};
 private engine:AudioEngine;private projects:ProjectStore;
 constructor(engine:AudioEngine=audio,projects:ProjectStore=store){this.engine=engine;this.projects=projects;this.recorder=new Recorder(n=>this.capture(n));engine.onStop=()=>this.finish();engine.onRecordingStart=()=>this.begin();engine.onRecordLoop=(_raw,time)=>this.nextCycle(time);}
 async record(countIn:number){const p=this.projects.getSnapshot().project;if(!p)return;assertTracksUnlocked(p,[this.trackId]);this.releaseAll();this.baseline=structuredClone(p);this.source=p.settings.inputSource??'keyboard';this.captured=[];this.newTakes=[];this.cycle=0;this.cycleTakes.clear();this.takeTimes.clear();this.takeId=null;this.projects.beginTake();this.armed=true;
  const loop=p.settings.loopRecording,punch=p.settings.punchEnabled;this.start=loop?p.settings.loopStart:punch?p.settings.punchStart:this.engine.position();this.end=loop?p.settings.loopEnd:punch?p.settings.punchEnd:Infinity;
  const startMeasure=measureForBeat(p,this.start).number,preRollStart=punch||loop?measureAt(p,Math.max(1,startMeasure-p.settings.preRoll)).start:this.start;
  try{await this.engine.record(this.start,countIn,{start:this.start,end:this.end,preRollStart,loop,trackId:this.trackId});}catch(e){this.armed=false;this.projects.endTake();throw e;}
 }
 private begin(){if(!this.armed||!this.baseline||this.recording)return;this.recording=true;this.startRecorder(this.engine.recordingOriginTime);this.onBegan();}
 private startRecorder(time:number){const p=this.baseline!;this.recorder.begin(this.trackId,tempoAt(p,this.start),time,p.settings.latencyCompensationMs,{start:this.start,end:this.end},beat=>beatAfterSeconds(p,beat,p.settings.latencyCompensationMs/1000));
  const key=id();this.takeId=key;this.newTakes.push(key);this.cycleTakes.set(this.cycle,key);this.takeTimes.set(key,time);
  this.projects.update(current=>{current.takes.push({id:key,name:'Prise '+(current.takes.filter(t=>t.trackId===this.trackId).length+1),trackId:this.trackId,startBeat:this.start,endBeat:Number.isFinite(this.end)?this.end:1000000,createdAt:new Date().toISOString(),events:[],selected:false,mode:p.settings.recordMode,source:this.source});},false);
  for(const [key,n] of this.held)if(this.accepts(key))this.recorder.on(key,n.pitch,n.velocity,this.start,time);
 }
 private accepts(key:string){const source=this.baseline?.settings.inputSource;if(!source)return true;return source==='midi'?key.startsWith('midi:'):source==='keyboard'?!key.startsWith('midi:'):false;}
 private capture(n:NoteEvent,takeId=this.takeId){this.captured.push(n);this.projects.update(p=>{if(takeId)p.takes.find(t=>t.id===takeId)?.events.push(n);if(!this.baseline?.settings.loopRecording)p.tracks.find(t=>t.id===n.trackId)?.events.push(n);},false);}
 private nextCycle(time:number){if(!this.recording)return;this.recorder.finish(this.end,time);this.cycle++;this.startRecorder(time);}
 async noteOn(key:string,pitch:number,velocity=90){if(this.held.has(key)||this.pending.has(key)||this.armed&&!this.accepts(key))return;this.pending.add(key);try{await this.engine.init();this.engine.synchronizeInput?.();if(this.cancelled.delete(key))return;const track=this.trackId;this.held.set(key,{pitch,velocity,track});this.engine.noteOn(key,pitch,velocity,track);if(this.engine.status==='recording'&&this.accepts(key))this.recorder.on(key,pitch,velocity,this.engine.position(),this.engine.now);}finally{this.pending.delete(key);}}
 noteOff(key:string){this.engine.synchronizeInput?.();if(this.pending.has(key))this.cancelled.add(key);if(this.held.has(key)){if(this.engine.status==='recording')this.recorder.off(key,this.engine.position(),this.engine.now);this.engine.noteOff(key);this.held.delete(key);}}
 releaseAll(){for(const key of this.pending)this.cancelled.add(key);for(const key of [...this.held.keys()])this.noteOff(key);this.engine.allNotesOff();}
 /** Late analysis results retain their audio-frame clock and the loop cycle of the attack. */
 captureVocal(segment:VocalSegment){if(!this.armed||this.source!=='vocal'||!this.baseline)return;this.engine.synchronizeInput();if(!this.recording)return;const p=this.baseline,rawOn=this.engine.rawBeatAtTime(segment.startTime),rawOff=this.engine.rawBeatAtTime(segment.endTime),loop=p.settings.loopRecording,length=this.end-this.start;
  if(rawOff<=this.start||rawOff<=rawOn)return;const first=loop?Math.floor(Math.max(0,rawOn-this.start)/length):0,last=loop?Math.floor(Math.max(0,rawOff-this.start-1e-8)/length):0;
  for(let cycle=first;cycle<=last;cycle++){const offset=loop?cycle*length:0,on=Math.max(this.start+offset,rawOn),off=Math.min((loop?this.end+offset:this.end),rawOff),take=this.cycleTakes.get(cycle);if(!take||off<=on)continue;const atOn=this.engine.timeAtRawBeat(on),atOff=this.engine.timeAtRawBeat(off),recorder=new Recorder(n=>{n.vocal={source:'vocal',confidence:segment.confidence,meanMidi:segment.meanMidi,spread:segment.spread,uncertain:segment.uncertain,audioStartTime:atOn,audioEndTime:atOff,...(segment.suggestedPitch!==undefined?{suggestedPitch:segment.suggestedPitch}:{})};const quantized=quantizeForProject(p,[n],p.settings.quantization,p.settings.quantizationStrength)[0];if(quantized.quantizedStart!==undefined)quantized.quantizedStart=Math.max(this.start,Math.min(this.end-.00001,quantized.quantizedStart));if(quantized.quantizedDuration!==undefined)quantized.quantizedDuration=Math.min(quantized.quantizedDuration,this.end-(quantized.quantizedStart??quantized.originalStart));this.capture(quantized,take);});
   recorder.begin(this.trackId,tempoAt(p,on-offset),this.takeTimes.get(take)!,p.settings.latencyCompensationMs,{start:this.start,end:this.end},beat=>beatAfterSeconds(p,beat,p.settings.latencyCompensationMs/1000));recorder.on('vocal',segment.pitch,90,on-offset,atOn);recorder.off('vocal',off-offset,atOff);
  }
 }
 provisional(draft:VocalDraft|null):NoteEvent|null{if(!draft||!this.recording||this.source!=='vocal'||!this.baseline)return null;const p=this.baseline,raw=this.engine.rawBeatAtTime(draft.startTime),end=this.engine.rawBeatAtTime(draft.lastTime+.04);if(end<=this.start)return null;const offset=p.settings.loopRecording?Math.floor(Math.max(0,end-this.start-1e-8)/(this.end-this.start))*(this.end-this.start):0,start=Math.max(this.start,raw-offset),duration=Math.min(this.end,end-offset)-start;if(duration<=0)return null;return {id:'vocal-preview',trackId:this.trackId,midiPitch:draft.pitch,velocity:90,originalStart:start,originalDuration:duration,startTime:0,endTime:Math.max(0,draft.lastTime-draft.startTime),duration:Math.max(0,draft.lastTime-draft.startTime),recordedTempo:tempoAt(p,start)};}
 private finish(){this.onBeforeFinish();if(!this.armed){this.releaseAll();this.onFinished(null);return;}const report:FinishedRecording={projectId:this.baseline!.id,source:this.source,takes:[]};
  if(this.recording){const at=Math.min(this.end,Math.max(this.start,this.engine.position()));this.recorder.finish(at,this.engine.now);const baseline=this.baseline!,capturedIds=new Set(this.captured.map(n=>n.id));this.projects.update(p=>{const ids=new Set(this.newTakes);
   p.takes=p.takes.filter(t=>!ids.has(t.id)||t.events.length>0||this.source==='vocal'&&baseline.settings.vocal?.saveAudio);
   for(const t of p.takes.filter(t=>ids.has(t.id))){if(!baseline.settings.loopRecording)t.endBeat=Math.max(t.startBeat,at);if(t.mode==='replace'){t.replacedEvents=structuredClone(baseline.tracks.find(tr=>tr.id===t.trackId)!.events.filter(n=>noteStart(n)<t.endBeat&&noteStart(n)+noteDuration(n)>t.startBeat));t.replacedLyrics=structuredClone(baseline.lyrics.filter(l=>l.trackId===t.trackId));const originalIds=new Set(t.replacedEvents.map(n=>n.id));t.replacedLinks=structuredClone(baseline.links?.filter(l=>l.trackId===t.trackId&&l.noteIds.some(id=>originalIds.has(id)))??[]);}}
   if(baseline.settings.loopRecording){const first=p.takes.find(t=>ids.has(t.id)&&t.events.length>0);if(first)chooseTake(p,first.id);}else {if(baseline.settings.recordMode==='replace'&&at>this.start){const track=p.tracks.find(t=>t.id===this.trackId)!;const existing=track.events.filter(n=>!capturedIds.has(n.id));const take=p.takes.find(t=>t.id===this.takeId),priorIds=new Set(take?.replacedEvents?.map(n=>n.id));const kept=existing.flatMap(n=>{const parts=removeRange([n],this.start,at);if(priorIds.has(n.id)&&take){take.replacementFragments??=[];take.replacementFragments.push(...parts.map(n=>n.id));}return parts;});track.events=[...kept,...track.events.filter(n=>capturedIds.has(n.id))];cleanLyrics(p);}const take=p.takes.find(t=>t.id===this.takeId);if(take)take.selected=true;}
  },false);
  const remaining=this.projects.getSnapshot().project!.takes;for(const key of this.newTakes){if(!remaining.some(t=>t.id===key))continue;const start=this.takeTimes.get(key)!;report.takes.push({id:key,startTime:start,endTime:baseline.settings.loopRecording?Math.min(this.engine.now,(this.takeTimes.get(this.newTakes[this.newTakes.indexOf(key)+1])??this.engine.now)):this.engine.now});}
  }
  this.armed=false;this.recording=false;this.takeId=null;this.projects.endTake();this.releaseAll();this.onFinished(report);
 }
}
export const session=new RecordingSession();
