import { audio,type AudioEngine } from '../audio/engine.ts';
import { store,type ProjectStore } from '../storage/store.ts';
import { Recorder } from './recorder.ts';
import { id,noteStart,type NoteEvent,type Project,type TrackId } from '../music/model.ts';
import { cleanLyrics,removeRange } from '../music/editing.ts';
import { measureAt,measureForBeat,tempoAt,beatAfterSeconds } from '../music/timeline.ts';
import { chooseTake } from './takes.ts';
export class RecordingSession {
  trackId:TrackId='soprano';private held=new Map<string,{pitch:number;velocity:number;track:TrackId}>();private pending=new Set<string>();private cancelled=new Set<string>();private recording=false;private armed=false;private baseline:Project|null=null;private start=0;private end=Infinity;private takeId:string|null=null;private newTakes:string[]=[];private captured:NoteEvent[]=[];private recorder:Recorder;
  private engine:AudioEngine;private projects:ProjectStore;
  constructor(engine:AudioEngine=audio,projects:ProjectStore=store){this.engine=engine;this.projects=projects;this.recorder=new Recorder(n=>this.capture(n));engine.onStop=()=>this.finish();engine.onRecordingStart=()=>this.begin();engine.onRecordLoop=(_raw,time)=>this.nextCycle(time);}
  async record(countIn:number){const p=this.projects.getSnapshot().project;if(!p)return;this.releaseAll();this.baseline=structuredClone(p);this.captured=[];this.newTakes=[];this.takeId=null;this.projects.beginTake();this.armed=true;
    const loop=p.settings.loopRecording,punch=p.settings.punchEnabled;this.start=punch?p.settings.punchStart:loop?p.settings.loopStart:this.engine.position();this.end=punch?p.settings.punchEnd:loop?p.settings.loopEnd:Infinity;
    const startMeasure=measureForBeat(p,this.start).number,preRollStart=punch||loop?measureAt(p,Math.max(1,startMeasure-p.settings.preRoll)).start:this.start;
    try{await this.engine.record(this.start,countIn,{start:this.start,end:this.end,preRollStart,loop,trackId:this.trackId});}catch(e){this.armed=false;this.projects.endTake();throw e;}
  }
  private begin(){if(!this.armed||!this.baseline)return;this.recording=true;this.startRecorder(this.engine.recordingOriginTime);}
  private startRecorder(time:number){const p=this.baseline!;this.recorder.begin(this.trackId,tempoAt(p,this.start),time,p.settings.latencyCompensationMs,{start:this.start,end:this.end},beat=>beatAfterSeconds(p,beat,p.settings.latencyCompensationMs/1000));if(p.settings.loopRecording){const key=id();this.takeId=key;this.newTakes.push(key);this.projects.update(current=>{current.takes.push({id:key,name:'Take '+(current.takes.filter(t=>t.trackId===this.trackId).length+1),trackId:this.trackId,startBeat:this.start,endBeat:this.end,createdAt:new Date().toISOString(),events:[],selected:false,mode:p.settings.recordMode});},false);}
    for(const [key,n] of this.held)this.recorder.on(key,n.pitch,n.velocity,this.start,time);
  }
  private capture(n:NoteEvent){this.captured.push(n);this.projects.update(p=>{if(this.takeId)p.takes.find(t=>t.id===this.takeId)?.events.push(n);else p.tracks.find(t=>t.id===n.trackId)?.events.push(n);},false);}
  private nextCycle(time:number){if(!this.recording)return;this.recorder.finish(this.end,time);this.startRecorder(time);}
  async noteOn(key:string,pitch:number,velocity=90){if(this.held.has(key)||this.pending.has(key))return;this.pending.add(key);try{await this.engine.init();this.engine.synchronizeInput?.();if(this.cancelled.delete(key))return;const track=this.trackId;this.held.set(key,{pitch,velocity,track});this.engine.noteOn(key,pitch,velocity,track);if(this.engine.status==='recording')this.recorder.on(key,pitch,velocity,this.engine.position(),this.engine.now);}finally{this.pending.delete(key);}}
  noteOff(key:string){this.engine.synchronizeInput?.();if(this.pending.has(key))this.cancelled.add(key);if(this.held.has(key)){if(this.engine.status==='recording')this.recorder.off(key,this.engine.position(),this.engine.now);this.engine.noteOff(key);this.held.delete(key);}}
  releaseAll(){for(const key of this.pending)this.cancelled.add(key);for(const key of [...this.held.keys()])this.noteOff(key);this.engine.allNotesOff();}
  private finish(){if(!this.armed){this.releaseAll();return;}if(this.recording){const at=Math.min(this.end,Math.max(this.start,this.engine.position()));this.recorder.finish(at,this.engine.now);const baseline=this.baseline!,capturedIds=new Set(this.captured.map(n=>n.id));this.projects.update(p=>{if(baseline.settings.loopRecording){const newIds=new Set(this.newTakes);p.takes=p.takes.filter(t=>!newIds.has(t.id)||t.events.length>0);const first=p.takes.find(t=>newIds.has(t.id)&&t.events.length>0);if(first)chooseTake(p,first.id);}else if(baseline.settings.recordMode==='replace'&&at>this.start){const track=p.tracks.find(t=>t.id===this.trackId)!;const existing=track.events.filter(n=>!capturedIds.has(n.id));track.events=[...removeRange(existing,this.start,at),...track.events.filter(n=>capturedIds.has(n.id))];cleanLyrics(p);}},false);}
    this.armed=false;this.recording=false;this.takeId=null;this.projects.endTake();this.releaseAll();
  }
}
export const session=new RecordingSession();
