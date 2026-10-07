import { id,type NoteEvent,type TrackId } from '../music/model.ts';
export class Recorder {
  private pending=new Map<string,{pitch:number;velocity:number;beat:number;time:number}>();private track:TrackId='soprano';private tempo=72;private startTime=0;private compensation=0;private gate={start:0,end:Infinity};private compensate:((beat:number)=>number)|undefined;private onNote:(note:NoteEvent)=>void;
  constructor(onNote:(note:NoteEvent)=>void){this.onNote=onNote;}
  begin(track:TrackId,tempo:number,startTime:number,compensationMs=0,gate={start:0,end:Infinity},compensate?:(beat:number)=>number){this.pending.clear();this.track=track;this.tempo=tempo;this.startTime=startTime;this.compensation=compensationMs;this.gate=gate;this.compensate=compensate;}
  on(key:string,pitch:number,velocity:number,beat:number,time:number){if(beat>=0&&!this.pending.has(key))this.pending.set(key,{pitch,velocity,beat,time});}
  off(key:string,beat:number,time:number){const p=this.pending.get(key);if(!p)return;this.pending.delete(key);const shift=this.compensation*this.tempo/60000,start=Math.max(this.gate.start,this.compensate?.(p.beat)??p.beat+shift),end=Math.min(this.gate.end,this.compensate?.(beat)??beat+shift);if(start>=this.gate.end||end<=start)return;const duration=Math.max(0,time-p.time);
    this.onNote({id:id(),trackId:this.track,midiPitch:p.pitch,velocity:p.velocity,originalStart:Math.max(0,start),originalDuration:Math.min(this.gate.end-start,Math.max(.03125,end-start)),startTime:p.time-this.startTime,endTime:time-this.startTime,duration,recordedTempo:this.tempo,rawStartBeat:p.beat,rawDurationBeats:Math.max(0,beat-p.beat),compensationMs:this.compensation});
  }
  finish(beat:number,time:number){for(const key of [...this.pending.keys()])this.off(key,beat,time);}
  get activeCount(){return this.pending.size;}
}
