import { id, type NoteEvent, type TrackId } from '../music/model.ts';
export class Recorder {
  private pending=new Map<string,{pitch:number;velocity:number;beat:number;time:number}>();
  private track:TrackId='soprano';private tempo=72;private startTime=0;
  private onNote:(note:NoteEvent)=>void;
  constructor(onNote:(note:NoteEvent)=>void){this.onNote=onNote;}
  begin(track:TrackId,tempo:number,startTime:number){this.pending.clear();this.track=track;this.tempo=tempo;this.startTime=startTime;}
  on(key:string,pitch:number,velocity:number,beat:number,time:number){if(beat>=0&&!this.pending.has(key))this.pending.set(key,{pitch,velocity,beat,time});}
  off(key:string,beat:number,time:number){const p=this.pending.get(key);if(!p)return;this.pending.delete(key);const duration=Math.max(.02,time-p.time);this.onNote({id:id(),trackId:this.track,midiPitch:p.pitch,velocity:p.velocity,originalStart:Math.max(0,p.beat),originalDuration:Math.max(.03125,beat-p.beat),startTime:p.time-this.startTime,endTime:time-this.startTime,duration,recordedTempo:this.tempo});}
  finish(beat:number,time:number){for(const key of [...this.pending.keys()])this.off(key,beat,time);}
  get activeCount(){return this.pending.size;}
}
