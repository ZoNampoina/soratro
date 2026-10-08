import type { SolfaDisplay } from '../solfa/display.ts';
export type TrackId = string;
export type Signature = `${number}/${number}`;
export type Tonic = 'C' | 'Db' | 'D' | 'Eb' | 'E' | 'F' | 'F#' | 'G' | 'Ab' | 'A' | 'Bb' | 'B';
export const TONICS: Tonic[] = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
export const SIGNATURES: Signature[] = ['2/4','3/4','4/4','5/4','6/8','7/8','9/8','12/8'];
export const SCHEMA_VERSION = 2;
export const APP_VERSION = '0.2.0';
export type TempoUnit = 'quarter' | 'dotted-quarter' | 'eighth';
export type QuantizationGrid = 'none'|'1/2'|'1/4'|'1/8'|'1/16'|'1/32'|'triplet-quarter'|'triplet-eighth'|'triplet-sixteenth'|'compound'|'auto';
export type ChoirTemplate = 'Solo'|'Unisson'|'SA'|'SAB'|'SATB'|'SSA'|'SSAA'|'TTB'|'TTBB'|'Personnalisé';
export interface Syllable {id?:string;text:string;noteId?:string;noteIds?:string[];startBeat?:number;endBeat?:number;hyphenAfter?:boolean}
export interface Marker {id:string;measure:number;label:string}
export interface TempoChange {measure:number;bpm:number}
export interface SignatureChange {measure:number;signature:Signature;groups?:number[]}
export interface RepeatSection {id:string;startMeasure:number;endMeasure:number;times:number;firstEndingStart?:number;secondEndingEnd?:number}
export interface MusicalIndication {id:string;measure:number;trackId?:string;text:string;kind:'dynamic'|'text'|'fermata'|'breath'|'crescendo'|'diminuendo'}
export interface RecordingTake {id:string;name:string;trackId:TrackId;startBeat:number;endBeat:number;createdAt:string;events:NoteEvent[];selected:boolean;mode?:'overdub'|'replace'}
export interface PageSettings {paper:'A4'|'A5'|'Letter';orientation:'portrait'|'landscape';margin:number;measuresPerSystem:number;noteSize:number;lyricSize:number;voiceGap:number;systemGap:number;titleSize:number;pageNumbers:boolean;systemBreaks:number[]}
export interface NoteEvent {
  id: string; trackId: TrackId; midiPitch: number; velocity: number;
  originalStart: number; originalDuration: number;
  quantizedStart?: number; quantizedDuration?: number;
  startTime: number; endTime: number; duration: number; recordedTempo: number;
  rawStartBeat?:number;rawDurationBeats?:number;compensationMs?:number;
  editStart?:number;editDuration?:number;tieFrom?:string;tieTo?:string;phraseId?:string;
}
export interface Track {
  id: TrackId; name: string; shortName: string; color: string;
  volume: number; mute: boolean; solo: boolean; events: NoteEvent[];
  pan?:number;
}
export interface LyricLine {id:string;text:string;trackId:TrackId;syllables:Syllable[];verse?:number;section?:string;kind?:'verse'|'refrain'|'common'}
export interface Project {
  id: string; schemaVersion: 2; title: string; author: string; composer: string;
  tonic: Tonic; timeSignature: Signature; tempo: number;
  createdAt: string; updatedAt: string; tracks: Track[]; lyrics: LyricLine[];
  markers:Marker[];takes:RecordingTake[];tempoMap:TempoChange[];signatureMap:SignatureChange[];repeats:RepeatSection[];indications:MusicalIndication[];layout:PageSettings;
  notation?: SolfaDisplay;
  settings: {countIn:0|1|2|4;quantization:QuantizationGrid;quantizationStrength:number;loopStart:number;loopEnd:number;tempoUnit:TempoUnit;recordMode:'overdub'|'replace';punchEnabled:boolean;punchStart:number;punchEnd:number;preRoll:0|1|2|4;loopRecording:boolean;latencyCompensationMs:number;pickupBeats:number;choirTemplate:ChoirTemplate;beatGroups:number[];snap:boolean;instrument:'piano'|'soft-piano'|'organ'|'vocal';masterVolume:number;rehearsalSpeed:number;rehearsalVoice:TrackId;rehearsalMix:'ensemble'|'solo'|'dominant';loopRepeats:number;measureCount?:number};
}
export const id = () => {
  if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
  const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
};
export const noteStart = (n: NoteEvent) => n.quantizedStart ?? n.editStart ?? n.originalStart;
export const noteDuration = (n: NoteEvent) => n.quantizedDuration ?? n.editDuration ?? n.originalDuration;
export function signatureInfo(signature: Signature) {
  const [numerator,denominator] = signature.split('/').map(Number);
  return {numerator,denominator,pulse:4/denominator,barBeats:numerator*4/denominator,compound:denominator===8&&numerator%3===0};
}
export function noteName(midi: number) {return ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'][((midi%12)+12)%12]+(Math.floor(midi/12)-1);}
export function audibleTracks(tracks: Track[]) {const solo=tracks.some(t=>t.solo);return tracks.filter(t=>!t.mute&&(!solo||t.solo));}
export function projectEnd(project: Project) {const bar=signatureInfo(project.timeSignature).barBeats;return Math.max(bar,...project.tracks.flatMap(t=>t.events.map(n=>noteStart(n)+noteDuration(n))));}
export function createProject(values: Partial<Pick<Project,'title'|'author'|'composer'|'tonic'|'timeSignature'|'tempo'>> = {}): Project {
  const date=new Date().toISOString();
  return {id:id(),schemaVersion:2,title:values.title?.trim()||'Sans titre',author:values.author||'',composer:values.composer||'',tonic:values.tonic||'Db',timeSignature:values.timeSignature||'6/8',tempo:values.tempo||72,createdAt:date,updatedAt:date,lyrics:[],markers:[],takes:[],tempoMap:[],signatureMap:[],repeats:[],indications:[],
    layout:{paper:'A4',orientation:'portrait',margin:15,measuresPerSystem:4,noteSize:17,lyricSize:11,voiceGap:30,systemGap:24,titleSize:24,pageNumbers:true,systemBreaks:[]},
    tracks:[{id:'soprano',name:'Soprano',shortName:'S',color:'#b3a2ff'},{id:'alto',name:'Alto',shortName:'A',color:'#78cdc1'},{id:'tenor',name:'Ténor',shortName:'T',color:'#edbd7c'},{id:'bass',name:'Basse',shortName:'B',color:'#92b9ef'}].map(t=>({...t,id:t.id as TrackId,volume:0.72,mute:false,solo:false,events:[]})),
    settings:{countIn:1,quantization:'1/8',quantizationStrength:100,loopStart:0,loopEnd:12,tempoUnit:'quarter',recordMode:'overdub',punchEnabled:false,punchStart:0,punchEnd:12,preRoll:1,loopRecording:false,latencyCompensationMs:0,pickupBeats:0,choirTemplate:'SATB',beatGroups:[],snap:true,instrument:'piano',masterVolume:.72,rehearsalSpeed:100,rehearsalVoice:'soprano',rehearsalMix:'ensemble',loopRepeats:0}};
}
export function makeNote(trackId:TrackId,midiPitch:number,start:number,duration:number,tempo:number,velocity=90): NoteEvent {
  return {id:id(),trackId,midiPitch,velocity,originalStart:start,originalDuration:duration,startTime:start*60/tempo,endTime:(start+duration)*60/tempo,duration:duration*60/tempo,recordedTempo:tempo};
}
export function createDemo() {
  const p=createProject({title:'Étude SATB',author:'Démo SORATRO',composer:'',tonic:'Db',timeSignature:'6/8',tempo:72});
  const lines:number[][]=[[65,63,65,65,66,68,68,68,65,63,61,61,70,70,68,68,66,65,65,65,63,61,61,61],[61,58,61,61,63,65,65,65,63,61,61,61,65,65,65,65,63,61,61,61,58,61,61,61],[56,56,56,56,58,61,61,61,58,56,56,56,61,61,61,61,58,56,56,56,56,56,56,56],[49,49,49,49,56,61,61,61,56,53,53,53,53,53,53,53,51,49,49,49,49,49,49,49]];
  p.tracks.forEach((t,ti)=>{t.events=lines[ti].map((pitch,i)=>makeNote(t.id,pitch,i*.5,.48,p.tempo,ti===0?100:75));});
  p.lyrics=[{id:id(),trackId:'soprano',text:'Ry mpa-no-mpo tsa-ra, sa-dy ma-ha-to-ky',syllables:[]}];return p;
}
