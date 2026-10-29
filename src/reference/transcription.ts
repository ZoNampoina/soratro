import {LocalPitchDetector} from '../vocal/pitch.ts';
import {VocalSegmenter} from '../vocal/segmenter.ts';
import {vocalSettings} from '../vocal/types.ts';
import {id,makeNote,type Project,type NoteEvent} from '../music/model.ts';
import {audioToBeat} from './mapping.ts';
import {quantizeForProject} from '../quantization/quantizer.ts';
export interface AnalysisOptions {instrument:'sax'|'voice'|'mono';quality:'fast'|'detailed';gateDb:number;confidence:number;minimumMs:number;mergeMs:number;minMidi:number;maxMidi:number;octave:number}
export interface DetectedNote {id:string;pitch:number;start:number;end:number;confidence:number;meanMidi:number;spread:number;uncertain:boolean}
export const DEFAULT_ANALYSIS:AnalysisOptions={instrument:'sax',quality:'fast',gateDb:-42,confidence:.85,minimumMs:90,mergeMs:50,minMidi:45,maxMidi:93,octave:0};
/** Offline monophonic analysis reuses the live McLeod detector and segmenter. */
export function analyzeMono(input:Float32Array,sampleRate:number,offset:number,options:AnalysisOptions,onProgress:(p:number)=>void=()=>{}):DetectedNote[]{
 if(sampleRate<8000||!input.length)throw new Error('Aucun échantillon audio dans cette région.');
 const rate=Math.min(sampleRate,options.quality==='detailed'?22050:16000),samples=new Float32Array(Math.floor(input.length*rate/sampleRate));
 for(let i=0;i<samples.length;i++){const from=Math.floor(i*sampleRate/rate),to=Math.max(from+1,Math.floor((i+1)*sampleRate/rate));let sum=0;for(let j=from;j<to&&j<input.length;j++)sum+=input[j];samples[i]=sum/(to-from);}
 const size=options.quality==='detailed'?2048:1024,hop=Math.round(rate*.01),frame=new Float32Array(size),detector=new LocalPitchDetector(size),notes:DetectedNote[]=[];
 const settings=vocalSettings({gateDb:options.gateDb,clarity:options.confidence,minimumMs:options.minimumMs,stabilityMs:options.instrument==='voice'?55:35,releaseMs:35,minMidi:options.minMidi,maxMidi:options.maxMidi,pitchMode:'stabilized'});
 const segmenter=new VocalSegmenter(n=>{const pitch=n.pitch+12*options.octave;if(pitch<0||pitch>127)return;const note:DetectedNote={id:id(),pitch,start:Math.max(offset,n.startTime),end:Math.min(offset+input.length/sampleRate,n.endTime),confidence:n.confidence,meanMidi:n.meanMidi,spread:n.spread,uncertain:n.uncertain};const previous=notes.at(-1);if(previous&&previous.pitch===pitch&&note.start-previous.end<=options.mergeMs/1000){previous.end=note.end;previous.uncertain||=note.uncertain;previous.confidence=Math.min(previous.confidence,note.confidence);}else if(note.end>note.start)notes.push(note);},settings);
 let nextProgress=0;
 for(let at=0;at<samples.length;at+=hop){frame.fill(0);frame.set(samples.subarray(at,Math.min(samples.length,at+size)));const time=offset+Math.min(samples.length,at+size/2)/rate;segmenter.push(detector.analyze(frame,rate,time,settings));if(at>=nextProgress){onProgress(at/samples.length);nextProgress=at+rate/4;}}
 segmenter.flush(offset+input.length/sampleRate);onProgress(1);return notes;
}
export interface TempoEstimate {bpm:number;confidence:number;firstBeat:number;pulses:number[];intervals:number[]}
/** Onset envelope and autocorrelation; downbeat is a proposal, never a claim. */
export function estimateTempo(samples:Float32Array,rate:number,offset=0):TempoEstimate{
 const hop=Math.max(1,Math.floor(rate/100)),energy:number[]=[],onsets:number[]=[];
 for(let i=0;i<samples.length;i+=hop){let sum=0;for(let j=i;j<Math.min(samples.length,i+hop);j++)sum+=samples[j]*samples[j];energy.push(Math.sqrt(sum/hop));}
 for(let i=0;i<energy.length;i++)onsets.push(Math.max(0,energy[i]-(energy[i-1]??0)));
 let best=-1,bestLag=50;for(let lag=25;lag<=100;lag++){let score=0;for(let i=lag;i<onsets.length;i++)score+=onsets[i]*onsets[i-lag];if(score>best){best=score;bestLag=lag;}}
 const peak=Math.max(0,...onsets),candidates:number[]=[];for(let i=1;i<onsets.length-1;i++)if(onsets[i]>.15*peak&&onsets[i]>=onsets[i-1]&&onsets[i]>onsets[i+1]&&(!candidates.length||i-candidates.at(-1)!>12))candidates.push(i);
 if(candidates.length<3||best<=1e-8)throw new Error('Pulsation insuffisamment nette. Saisissez le BPM ou utilisez le Tap Tempo et des ancrages manuels.');
 let phase=0,max=-1;for(let k=0;k<bestLag;k++){let score=0;for(let i=k;i<onsets.length;i+=bestLag)score+=onsets[i];if(score>max){max=score;phase=k;}}
 const pulses:number[]=[];for(let i=phase;i<onsets.length;i+=bestLag){let chosen=i;for(let j=Math.max(0,i-8);j<=Math.min(onsets.length-1,i+8);j++)if(onsets[j]>onsets[chosen])chosen=j;if(onsets[chosen]>.12*peak)pulses.push(offset+chosen*hop/rate);}
 const intervals=pulses.slice(1).map((p,i)=>p-pulses[i]),firstBeat=pulses[0]??offset+phase*hop/rate,confidence=Math.min(1,pulses.length/Math.max(1,candidates.length));
 return {bpm:60*rate/(bestLag*hop),confidence,firstBeat,pulses,intervals};
}
export function detectedNotes(p:Project,notes:DetectedNote[],trackId:string,transpose=0,quantize=false):NoteEvent[]{
 if(!p.referenceAudio)throw new Error('Audio de référence absent.');
 const result=notes.flatMap(d=>{const start=Math.max(0,audioToBeat(p.referenceAudio!,d.start)),end=audioToBeat(p.referenceAudio!,d.end),pitch=d.pitch+transpose;if(end<=start||pitch<0||pitch>127)return [];
  const n=makeNote(trackId,pitch,start,end-start,p.tempo);n.startTime=d.start;n.endTime=d.end;n.duration=d.end-d.start;n.audioDetection={referenceId:p.referenceAudio!.id,concertPitch:d.pitch,confidence:d.confidence,uncertain:d.uncertain};return [n];});
 return quantize?quantizeForProject(p,result,p.settings.quantization,p.settings.quantizationStrength):result;
}
/** Providers return the same editable proposals. Heavy polyphonic/separation
 * providers must be explicitly installed and authorized before remote work. */
export interface TranscriptionProvider {id:string;polyphonic:boolean;local:boolean;analyze(samples:Float32Array,rate:number,options:AnalysisOptions,signal:AbortSignal):Promise<DetectedNote[]>}
export interface SourceSeparator {id:string;local:boolean;separate(source:Blob,signal:AbortSignal):Promise<{name:string;blob:Blob}[]>}
