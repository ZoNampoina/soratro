import {vocalSettings,type VocalSettings,type PitchFrame,type VocalDraft,type VocalSegment} from './types.ts';
import {TONICS,type Tonic} from '../music/model.ts';
const median=(a:number[])=>{const b=[...a].sort((x,y)=>x-y);return b[Math.floor(b.length/2)];};
/** Stable attacks, pitch hysteresis and silence/reattack segmentation; no ASR. */
export class VocalSegmenter {
 private active:(VocalDraft&{midis:number[];confidences:number[];rms:number})|null=null;
 private candidate:{pitch:number;start:number;midis:number[];confidences:number[];rms:number}|null=null;
 private silence:number|null=null;private valley:number|null=null;private history:number[]=[];private last=-Infinity;
 private emit:(n:VocalSegment)=>void;private options:VocalSettings;private tonic:Tonic;
 constructor(emit:(n:VocalSegment)=>void,options:VocalSettings=vocalSettings(),tonic:Tonic='C'){this.emit=emit;this.options=options;this.tonic=tonic;}
 update(options:VocalSettings){this.options=options;}
 get draft():VocalDraft|null{return this.active?{pitch:this.active.pitch,startTime:this.active.startTime,lastTime:this.active.lastTime,confidence:median(this.active.confidences)}:null;}
 push(f:PitchFrame){if(!Number.isFinite(f.time)||f.time<=this.last)return;this.last=f.time;const s=this.options;
  if(!f.voiced||f.midi===null){this.candidate=null;this.history=[];if(this.silence===null)this.silence=f.time;if(this.active&&f.time-this.silence>=s.releaseMs/1000)this.close(this.silence);return;}
  this.silence=null;this.history.push(f.midi);if(this.history.length>3)this.history.shift();const midi=s.pitchMode==='raw'?f.midi:median(this.history),pitch=Math.max(0,Math.min(127,Math.round(midi)));
  const same=this.active&&Math.abs(midi-this.active.pitch)<.68;
  if(same&&this.active){this.candidate=null;this.active.lastTime=f.time;this.active.midis.push(midi);this.active.confidences.push(f.confidence);if(this.active.midis.length>1000){this.active.midis.shift();this.active.confidences.shift();}
   if(f.rms<this.active.rms*.55){this.valley??=f.time;}else if(this.valley!==null&&f.rms>this.active.rms*.8&&f.time-this.valley>=.02&&f.time-this.active.startTime>=s.minimumMs/1000){const at=this.valley;this.close(at);this.active={pitch,startTime:f.time,lastTime:f.time,confidence:f.confidence,midis:[midi],confidences:[f.confidence],rms:f.rms};this.valley=null;}else if(this.valley!==null&&f.time-this.valley>.2)this.valley=null;
   if(this.active)this.active.rms=this.active.rms*.97+f.rms*.03;return;
  }
  this.valley=null;
  if(!this.candidate||pitch!==this.candidate.pitch||Math.abs(midi-this.candidate.midis.at(-1)!)>.28)this.candidate={pitch,start:f.time,midis:[midi],confidences:[f.confidence],rms:f.rms};
  else {this.candidate.midis.push(midi);this.candidate.confidences.push(f.confidence);}
  if(Math.max(...this.candidate.midis)-Math.min(...this.candidate.midis)>.45)this.candidate={pitch,start:f.time,midis:[midi],confidences:[f.confidence],rms:f.rms};
  const c=this.candidate,span=Math.max(...c.midis)-Math.min(...c.midis);
  if(f.time-c.start>=s.stabilityMs/1000&&span<.45){this.close(c.start);this.active={pitch:c.pitch,startTime:c.start,lastTime:f.time,confidence:f.confidence,midis:c.midis,confidences:c.confidences,rms:c.rms};this.candidate=null;}
 }
 flush(time:number){if(this.active)this.close(Math.max(this.active.startTime,Math.min(time,this.silence??time)));this.candidate=null;this.silence=null;this.history=[];}
 reset(){this.active=null;this.candidate=null;this.silence=null;this.valley=null;this.history=[];this.last=-Infinity;}
 private close(end:number){const a=this.active;if(!a)return;this.active=null;this.valley=null;if(end-a.startTime<this.options.minimumMs/1000)return;
  const mean=a.midis.reduce((x,y)=>x+y,0)/a.midis.length,spread=Math.max(...a.midis)-Math.min(...a.midis),confidence=median(a.confidences),n:VocalSegment={pitch:a.pitch,startTime:a.startTime,endTime:end,confidence,meanMidi:mean,spread,uncertain:confidence<.9||spread>.65||Math.abs(mean-a.pitch)>.35};
  if(this.options.pitchMode==='musical'){const key=TONICS.indexOf(this.tonic),scale=[0,2,4,5,7,9,11];const candidates=[a.pitch-1,a.pitch,a.pitch+1].filter(x=>x>=this.options.minMidi&&x<=this.options.maxMidi&&x>=0&&x<=127&&scale.includes(((x-key)%12+12)%12));const suggested=candidates.sort((x,y)=>Math.abs(mean-x)-Math.abs(mean-y))[0];if(suggested!==undefined&&suggested!==a.pitch&&n.uncertain&&(Math.abs(mean-suggested)-Math.abs(mean-a.pitch))*100<=this.options.correctionCents){n.suggestedPitch=suggested;n.uncertain=true;}}
  this.emit(n);
 }
}
