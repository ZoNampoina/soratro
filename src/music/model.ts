export type TrackId = 'soprano' | 'alto' | 'tenor' | 'bass';
export type Signature = '2/4' | '3/4' | '4/4' | '6/8';
export type Tonic = 'C' | 'Db' | 'D' | 'Eb' | 'E' | 'F' | 'F#' | 'G' | 'Ab' | 'A' | 'Bb' | 'B';
export const TONICS: Tonic[] = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
export const SIGNATURES: Signature[] = ['2/4','3/4','4/4','6/8'];
export interface NoteEvent {
  id: string; trackId: TrackId; midiPitch: number; velocity: number;
  originalStart: number; originalDuration: number;
  quantizedStart?: number; quantizedDuration?: number;
  startTime: number; endTime: number; duration: number; recordedTempo: number;
}
export interface Track {
  id: TrackId; name: string; shortName: string; color: string;
  volume: number; mute: boolean; solo: boolean; events: NoteEvent[];
}
export interface LyricLine { id: string; text: string; trackId: TrackId; syllables: {text:string;noteId?:string}[] }
export interface Project {
  id: string; schemaVersion: 1; title: string; author: string; composer: string;
  tonic: Tonic; timeSignature: Signature; tempo: number;
  createdAt: string; updatedAt: string; tracks: Track[]; lyrics: LyricLine[];
  settings: {countIn:0|1|2;quantization:'none'|'1/4'|'1/8'|'1/16'|'auto';quantizationStrength:number;loopStart:number;loopEnd:number};
}
export const id = () => {
  if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
  const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
};
export const noteStart = (n: NoteEvent) => n.quantizedStart ?? n.originalStart;
export const noteDuration = (n: NoteEvent) => n.quantizedDuration ?? n.originalDuration;
export function signatureInfo(signature: Signature) {
  const [numerator,denominator] = signature.split('/').map(Number);
  return {numerator,denominator,pulse:4/denominator,barBeats:numerator*4/denominator,compound:denominator===8&&numerator%3===0};
}
export function noteName(midi: number) {return ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'][((midi%12)+12)%12]+(Math.floor(midi/12)-1);}
export function audibleTracks(tracks: Track[]) {const solo=tracks.some(t=>t.solo);return tracks.filter(t=>!t.mute&&(!solo||t.solo));}
export function projectEnd(project: Project) {const bar=signatureInfo(project.timeSignature).barBeats;return Math.max(bar,...project.tracks.flatMap(t=>t.events.map(n=>noteStart(n)+noteDuration(n))));}
export function createProject(values: Partial<Pick<Project,'title'|'author'|'composer'|'tonic'|'timeSignature'|'tempo'>> = {}): Project {
  const date=new Date().toISOString();
  return {id:id(),schemaVersion:1,title:values.title?.trim()||'Sans titre',author:values.author||'',composer:values.composer||'',tonic:values.tonic||'Db',timeSignature:values.timeSignature||'6/8',tempo:values.tempo||72,createdAt:date,updatedAt:date,lyrics:[],
    tracks:[{id:'soprano',name:'Soprano',shortName:'S',color:'#b3a2ff'},{id:'alto',name:'Alto',shortName:'A',color:'#78cdc1'},{id:'tenor',name:'Ténor',shortName:'T',color:'#edbd7c'},{id:'bass',name:'Basse',shortName:'B',color:'#92b9ef'}].map(t=>({...t,id:t.id as TrackId,volume:0.72,mute:false,solo:false,events:[]})),
    settings:{countIn:1,quantization:'1/8',quantizationStrength:100,loopStart:0,loopEnd:12}};
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
