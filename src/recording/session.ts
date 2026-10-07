import { audio } from '../audio/engine';
import { store } from '../storage/store';
import { Recorder } from './recorder';
import type { TrackId } from '../music/model';
export class RecordingSession {
  trackId:TrackId='soprano';private held=new Map<string,{pitch:number;track:TrackId}>();private pending=new Set<string>();private cancelled=new Set<string>();private recording=false;
  private recorder=new Recorder(n=>store.update(p=>{p.tracks.find(t=>t.id===n.trackId)!.events.push(n);},false));
  constructor(){audio.onStop=()=>this.finish();}
  async record(countIn:number){const p=store.getSnapshot().project;if(!p)return;this.releaseAll();store.beginTake();await audio.record(audio.position(),countIn);this.recorder.begin(this.trackId,p.tempo,audio.recordingOriginTime);this.recording=true;}
  async noteOn(key:string,pitch:number,velocity=90){if(this.held.has(key)||this.pending.has(key))return;this.pending.add(key);try{await audio.init();if(this.cancelled.delete(key))return;const track=this.trackId;this.held.set(key,{pitch,track});audio.noteOn(key,pitch,velocity,track);if(audio.status==='recording')this.recorder.on(key,pitch,velocity,audio.rawBeat(),audio.now);}finally{this.pending.delete(key);}}
  noteOff(key:string){if(this.pending.has(key))this.cancelled.add(key);if(this.held.has(key)){if(audio.status==='recording')this.recorder.off(key,audio.rawBeat(),audio.now);audio.noteOff(key);this.held.delete(key);}}
  releaseAll(){for(const key of this.pending)this.cancelled.add(key);for(const key of [...this.held.keys()])this.noteOff(key);audio.allNotesOff();}
  private finish(){if(this.recording){this.recorder.finish(Math.max(0,audio.rawBeat()),audio.now);store.endTake();this.recording=false;}this.releaseAll();}
}
export const session=new RecordingSession();
