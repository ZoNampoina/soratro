import {PitchDetector} from 'pitchy';
import {vocalSettings,type VocalSettings,type PitchFrame} from './types.ts';
/** McLeod/FFT, entirely local. The caller supplies AudioContext frame timestamps. */
export class LocalPitchDetector {
 private detector:PitchDetector<Float32Array>;private centered:Float32Array;
 constructor(size=2048){this.detector=PitchDetector.forFloat32Array(size);this.centered=new Float32Array(size);}
 analyze(samples:Float32Array,sampleRate:number,time:number,options:VocalSettings=vocalSettings()):PitchFrame{
  let sum=0,power=0;for(const x of samples)sum+=x;const mean=sum/samples.length;
  for(let i=0;i<samples.length;i++){const x=samples[i]-mean;this.centered[i]=x;power+=x*x;}const rms=Math.sqrt(power/samples.length);
  const [frequency,clarity]=rms>Math.pow(10,options.gateDb/20)?this.detector.findPitch(this.centered,sampleRate):[0,0];
  const midi=frequency>0?69+12*Math.log2(frequency/440):null,voiced=midi!==null&&Number.isFinite(midi)&&midi>=options.minMidi-.5&&midi<=options.maxMidi+.5&&clarity>=options.clarity;
  return {time,hz:voiced?frequency:null,midi:voiced?midi:null,confidence:Math.max(0,Math.min(1,clarity)),rms,voiced,wave:Array.from({length:48},(_,i)=>samples[Math.floor(i*samples.length/48)])};
 }
}
