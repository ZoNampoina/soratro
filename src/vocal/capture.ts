import {audio,type AudioEngine} from '../audio/engine';
import {VocalSegmenter} from './segmenter';
import {vocalSettings,type VocalSettings,type PitchFrame,type VocalDraft,type VocalSegment} from './types';
import type {Tonic} from '../music/model';
export interface VocalState {active:boolean;starting:boolean;error:string;frame:PitchFrame|null;draft:VocalDraft|null;frames:PitchFrame[];recordingAudio:boolean;delayMs:number|null;deviceLabel:string}
export interface CapturedAudio {blob:Blob;duration:number;startTime:number}
export function microphoneError(error:unknown){const name=(error as {name?:string})?.name;if(name==='NotAllowedError'||name==='SecurityError')return 'Accès au microphone refusé. Autorisez le micro dans les réglages du navigateur ou d’Android, puis réessayez.';if(name==='NotFoundError')return 'Aucun microphone disponible.';if(name==='NotReadableError')return 'Microphone occupé ou indisponible. Fermez les applications qui l’utilisent.';if(name==='OverconstrainedError')return 'Ce microphone n’est plus disponible. Choisissez le microphone par défaut.';return error instanceof Error?error.message:'Capture vocale indisponible.';}
export class VocalCapture {
 private state:VocalState={active:false,starting:false,error:'',frame:null,draft:null,frames:[],recordingAudio:false,delayMs:null,deviceLabel:''};private listeners=new Set<()=>void>();
 private stream:MediaStream|null=null;private nodes:AudioNode[]=[];private worklet:AudioWorkletNode|null=null;private worker:Worker|null=null;private segmenter:VocalSegmenter|null=null;private settings=vocalSettings();private generation=0;private lastEmit=0;private recorder:MediaRecorder|null=null;private chunks:Blob[]=[];private recordStart=0;private limit:ReturnType<typeof setTimeout>|null=null;private busy=false;
 onSegment:(n:VocalSegment)=>void=()=>{};onLimit:()=>void=()=>{};
 constructor(private engine:AudioEngine=audio){}
 subscribe=(fn:()=>void)=>{this.listeners.add(fn);return ()=>this.listeners.delete(fn);};getSnapshot=()=>this.state;
 private emit(part:Partial<VocalState>){this.state={...this.state,...part};this.listeners.forEach(fn=>fn());}
 update(options:VocalSettings){this.settings=options;this.worker?.postMessage({settings:options});this.segmenter?.update(options);const gain=this.nodes.find(n=>n instanceof GainNode) as GainNode|undefined;if(gain)gain.gain.value=options.gain;}
 async start(options:VocalSettings,tonic:Tonic,record=false){if(this.state.starting)throw new Error('Le microphone est en cours d’activation.');if(this.state.active){this.update(options);this.segmenter=new VocalSegmenter(n=>this.onSegment(n),options,tonic);if(record)this.startAudio();return;}
  const generation=++this.generation;this.settings=options;this.emit({starting:true,error:''});
  try{if(!navigator.mediaDevices?.getUserMedia||!window.isSecureContext)throw new Error('Le microphone nécessite HTTPS ou l’application Android.');const context=await this.engine.init();if(!context.audioWorklet)throw new Error('AudioWorklet indisponible. Mettez le navigateur ou Android System WebView à jour.');
   const stream=await navigator.mediaDevices.getUserMedia({audio:{deviceId:options.deviceId?{exact:options.deviceId}:undefined,channelCount:1,echoCancellation:options.echoCancellation,noiseSuppression:options.noiseSuppression,autoGainControl:options.autoGainControl},video:false});
   if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}this.stream=stream;
   await context.audioWorklet.addModule(new URL('./capture.worklet.js',import.meta.url).href);if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
   const source=context.createMediaStreamSource(stream),gain=context.createGain(),high=context.createBiquadFilter(),low=context.createBiquadFilter(),sink=context.createGain();gain.gain.value=options.gain;high.type='highpass';high.frequency.value=40;low.type='lowpass';low.frequency.value=4000;low.Q.value=.707;sink.gain.value=0;
   const worklet=new AudioWorkletNode(context,'soratro-vocal-capture');this.worklet=worklet;this.nodes=[source,gain,high,low,worklet,sink];source.connect(gain).connect(high).connect(low).connect(worklet).connect(sink).connect(context.destination);
   this.worker=new Worker(new URL('./pitch.worker.ts',import.meta.url),{type:'module'});this.worker.postMessage({settings:options});this.busy=false;
   this.segmenter=new VocalSegmenter(n=>this.onSegment(n),options,tonic);worklet.port.onmessage=e=>{if(generation!==this.generation||this.busy||!this.worker||e.data.time<context.currentTime-.25)return;this.busy=true;this.worker.postMessage(e.data,[e.data.samples.buffer]);};
   this.worker.onmessage=e=>{this.busy=false;if(generation!==this.generation)return;if(e.data.error){this.emit({error:e.data.error});this.onLimit();return;}const frame:PitchFrame=e.data.frame;frame.delayMs=Math.max(0,(context.currentTime-frame.time)*1000);this.segmenter?.push(frame);if(context.currentTime-this.lastEmit>=.08){this.lastEmit=context.currentTime;this.emit({frame,draft:this.segmenter?.draft??null,frames:[...this.state.frames.slice(-79),frame],delayMs:Math.round(frame.delayMs)});}};
   this.worker.onerror=()=>{this.emit({error:'Analyse vocale interrompue. Réactivez le micro.'});this.onLimit();};
   stream.getAudioTracks()[0].onended=()=>{if(generation===this.generation){this.emit({error:'Le microphone a été déconnecté.'});this.onLimit();}};
   this.emit({active:true,starting:false,frame:null,draft:null,frames:[],deviceLabel:stream.getAudioTracks()[0].label});if(record)this.startAudio();
  }catch(e){await this.stop();this.emit({starting:false,error:microphoneError(e)});throw new Error(microphoneError(e));}
 }
 beginRecording(){if(this.limit)clearTimeout(this.limit);this.limit=setTimeout(()=>{this.emit({error:'Durée maximale atteinte ; la prise est conservée.'});this.onLimit();},this.settings.maxMinutes*60000);}
 private startAudio(){if(this.recorder||!this.stream)return;this.recordStart=this.engine.now;
  if(!this.settings.saveAudio)return;if(typeof MediaRecorder==='undefined'){this.emit({error:'Notes enregistrées ; conservation audio indisponible dans ce navigateur.'});return;}
  try{const mime=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));this.recorder=new MediaRecorder(this.stream,{...(mime?{mimeType:mime}:{}),audioBitsPerSecond:64000});this.chunks=[];this.recorder.ondataavailable=e=>{if(e.data.size)this.chunks.push(e.data);};this.recorder.start(500);this.emit({recordingAudio:true});}catch{this.recorder=null;this.emit({error:'Notes enregistrées ; le navigateur ne permet pas de conserver cet audio.'});}
 }
 flush(time=this.engine.now){this.segmenter?.flush(time);this.emit({draft:null});}
 async stop():Promise<CapturedAudio|null>{++this.generation;if(this.limit)clearTimeout(this.limit);this.limit=null;const duration=Math.max(0,this.engine.now-this.recordStart),startTime=this.recordStart,recorder=this.recorder;this.recorder=null;
  this.worklet?.port.postMessage('stop');this.worklet?.port.close();this.worklet=null;this.worker?.terminate();this.worker=null;this.nodes.forEach(n=>{try{n.disconnect();}catch{}});this.nodes=[];this.stream?.getTracks().forEach(t=>{t.onended=null;t.stop();});this.stream=null;this.segmenter?.reset();this.segmenter=null;this.emit({active:false,starting:false,frame:null,draft:null,recordingAudio:false});
  if(!recorder)return null;return new Promise(resolve=>{const finish=()=>{const blob=new Blob(this.chunks,{type:recorder.mimeType});this.chunks=[];resolve(blob.size?{blob,duration,startTime}:null);};recorder.onstop=finish;recorder.onerror=()=>{this.emit({error:'Audio original incomplet ; les notes restent conservées.'});finish();};if(recorder.state==='inactive')finish();else recorder.stop();});
 }
}
export const vocalCapture=new VocalCapture();
