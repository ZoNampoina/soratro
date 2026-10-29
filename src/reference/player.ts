import type {Project} from '../music/model.ts';
import {secondsBetween} from '../music/timeline.ts';
import {audioRepository,MAX_AUDIO_BYTES} from '../storage/audio-repository.ts';
import {audioToBeat,beatToAudio,renderPieces} from './mapping.ts';
import {referenceJob} from './worker-client.ts';
export const MAX_DECODED_SAMPLES=32000000;
export interface ReferenceStatus {id:string;loading:boolean;progress:number;error:string;peaks:number[]}
export class ReferencePlayer {
 private buffer:AudioBuffer|null=null;private rendered:AudioBuffer|null=null;private key='';private loaded='';private generation=0;private controller:AbortController|null=null;
 private active=new Map<string,AudioBufferSourceNode>();private gain:GainNode|null=null;
 private state:ReferenceStatus={id:'',loading:false,progress:0,error:'',peaks:[]};private listeners=new Set<()=>void>();
 subscribe=(fn:()=>void)=>{this.listeners.add(fn);return ()=>this.listeners.delete(fn);};getSnapshot=()=>this.state;
 private emit(patch:Partial<ReferenceStatus>){this.state={...this.state,...patch};for(const fn of this.listeners)fn();}
 async decode(blob:Blob,context:AudioContext){if(!blob.size||blob.size>MAX_AUDIO_BYTES)throw new Error('Audio vide ou supérieur à 80 Mo.');let buffer:AudioBuffer;try{buffer=await context.decodeAudioData(await blob.arrayBuffer());}catch{throw new Error('Format audio non décodable sur ce navigateur. Essayez un fichier WAV ou MP3.');}if(buffer.duration>900||buffer.length*buffer.numberOfChannels>MAX_DECODED_SAMPLES)throw new Error('Audio trop long pour la mémoire disponible. Importez un extrait (15 minutes maximum, 32 millions d’échantillons).');return buffer;}
 async load(p:Project,context:AudioContext){const r=p.referenceAudio;if(!r){this.unload();return null;}if(this.loaded===r.id&&this.buffer)return this.buffer;
  const generation=++this.generation;this.emit({id:r.id,loading:true,progress:0,error:'',peaks:[]});
  try{const row=await audioRepository.get(r.id);if(!row)throw new Error('Audio manquant sur cet appareil. Rechargez le fichier source ou importez la sauvegarde Audio portable.');const buffer=await this.decode(row.blob,context);if(generation!==this.generation)return null;
   this.buffer=buffer;this.loaded=r.id;this.key='';this.rendered=null;const samples=buffer.getChannelData(0),bins=Math.min(1800,samples.length),peaks:number[]=[];
   for(let i=0;i<bins;i++){const start=Math.floor(i*samples.length/bins),end=Math.floor((i+1)*samples.length/bins);let peak=0;for(let k=start;k<end;k+=4)peak=Math.max(peak,Math.abs(samples[k]));peaks.push(peak);}this.emit({loading:false,peaks});return buffer;
  }catch(error){if(generation===this.generation)this.emit({loading:false,error:(error as Error).message});throw error;}
 }
 async prepare(p:Project,context:AudioContext,speed:number){const buffer=await this.load(p,context),r=p.referenceAudio;if(!buffer||!r)return;
  const key=JSON.stringify([r.id,r.mode,r.bpm,r.anchors,r.offsetMs,p.tempo,p.tempoMap,p.signatureMap,p.timeSignature,p.settings.pickupBeats,speed]);if(key===this.key)return;
  const pieces=renderPieces(p,speed);
  if(pieces.length===1&&Math.abs(pieces[0].duration-buffer.duration)<1/context.sampleRate){this.rendered=buffer;this.key=key;return;}
  this.controller?.abort();const controller=new AbortController();this.controller=controller;this.emit({loading:true,progress:0,error:''});
  try{const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i).slice()),output=await referenceJob<Float32Array[]>({kind:'render',channels,sampleRate:buffer.sampleRate,pieces},channels.map(c=>c.buffer),controller.signal,progress=>this.emit({progress}));
   if(controller!==this.controller)return;const rendered=context.createBuffer(output.length,output[0].length,buffer.sampleRate);output.forEach((c,i)=>rendered.copyToChannel(new Float32Array(c),i));this.rendered=rendered;this.key=key;this.emit({loading:false,progress:1});
  }catch(error){if(controller===this.controller)this.emit({loading:false,error:(error as Error).name==='AbortError'?'':(error as Error).message});throw error;}
 }
 mix(p:Project,context:AudioContext,destination:AudioNode){if(!this.gain){this.gain=context.createGain();this.gain.connect(destination);}const r=p.referenceAudio;this.gain.gain.setTargetAtTime(r&&!r.mute?r.volume:0,context.currentTime,.01);}
 schedule(key:string,p:Project,context:AudioContext,destination:AudioNode,speed:number,beat:number,time:number,duration:number){
  const r=p.referenceAudio,buffer=this.rendered;if(!r||!buffer||this.active.has(key))return;this.mix(p,context,destination);
  let offset=(r.mode==='audio'?beatToAudio(r,beat):secondsBetween(p,audioToBeat(r,0),beat))/speed;
  const late=Math.max(0,context.currentTime-time);offset+=late;duration-=late;if(offset<-.002||offset>=buffer.duration||duration<=0)return;
  const source=context.createBufferSource();source.buffer=buffer;source.connect(this.gain!);source.onended=()=>{source.disconnect();if(this.active.get(key)===source)this.active.delete(key);};this.active.set(key,source);
  source.start(Math.max(time,context.currentTime),Math.max(0,offset),Math.min(duration,buffer.duration-Math.max(0,offset)));
 }
 stop(){for(const source of this.active.values()){try{source.stop();}catch{}source.disconnect();}this.active.clear();}
 cancel(){this.controller?.abort();this.controller=null;this.emit({loading:false});}
 unload(){this.generation++;this.cancel();this.stop();this.buffer=null;this.rendered=null;this.loaded='';this.key='';this.emit({id:'',loading:false,error:'',peaks:[]});}
 mono(start:number,end:number){const b=this.buffer;if(!b)throw new Error('Chargez d’abord l’audio.');const lo=Math.max(0,Math.floor(start*b.sampleRate)),hi=Math.min(b.length,Math.ceil(end*b.sampleRate)),samples=new Float32Array(Math.max(0,hi-lo));for(let c=0;c<b.numberOfChannels;c++){const data=b.getChannelData(c);for(let i=0;i<samples.length;i++)samples[i]+=data[lo+i]/b.numberOfChannels;}return {samples,sampleRate:b.sampleRate,offset:lo/b.sampleRate};}
}
