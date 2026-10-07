import { MidiDecoder } from './decoder.ts';
import { isAndroid } from '../platform/native.ts';
export interface MidiInput {id:string;name:string;manufacturer?:string;state:string;onmidimessage:((event:{data:Uint8Array})=>void)|null;open?:()=>Promise<unknown>}
export interface MidiAccess {inputs:Map<string,MidiInput>;onstatechange:(()=>void)|null}
export class MidiManager {
  private access:MidiAccess|null=null;private selected:string|null=null;private preferred:string|null=null;private preferredName='';private active=new Map<string,string>();private sustain=new Set<string>();private deferred=new Map<string,string>();
  supported=isAndroid()||!!(navigator as Navigator&{requestMIDIAccess?:unknown}).requestMIDIAccess;
  inputs:{id:string;name:string;state:string}[]=[];
  onChange:()=>void=()=>{};onNoteOn:(key:string,pitch:number,velocity:number)=>void=()=>{};onNoteOff:(key:string)=>void=()=>{};onActivity:()=>void=()=>{};onDisconnect:()=>void=()=>{};onError:(message:string)=>void=()=>{};
  async connect(){if(!this.supported)throw new Error('MIDI externe indisponible sur ce navigateur.');const n=navigator as unknown as {requestMIDIAccess:(options:{sysex:boolean})=>Promise<MidiAccess>};this.access=isAndroid()?await (await import('../platform/midi')).nativeMidiAccess():await n.requestMIDIAccess({sysex:false});this.access.onstatechange=()=>{this.refresh();const connected=this.inputs.filter(i=>i.state==='connected');if(this.selected&&!connected.some(i=>i.id===this.selected)){this.panic();this.attach(null);}if(!this.selected){const restored=connected.find(i=>i.id===this.preferred)??connected.find(i=>i.name===this.preferredName);if(restored)this.select(restored.id);}this.onChange();};this.refresh();const chosen=this.inputs.find(i=>i.id===this.preferred&&i.state==='connected')??this.inputs.find(i=>i.state==='connected');if(chosen)this.select(chosen.id);}
  private refresh(){this.inputs=[...(this.access?.inputs.values()??[])].map(i=>({id:i.id,name:i.name||i.manufacturer||'Clavier MIDI',state:i.state}));this.onChange();}
  private receive(input:MidiInput,message:number[]){const [status,pitch,velocity]=message,type=status&0xf0,channel=input.id+':'+(status&0x0f),key='midi:'+channel+':'+pitch;this.onActivity();
    if(type===0x90&&velocity>0){if(this.active.has(key)||this.deferred.has(key))this.onNoteOff(key);this.deferred.delete(key);this.active.set(key,channel);this.onNoteOn(key,pitch,velocity);}else if(type===0x80||(type===0x90&&velocity===0)){this.active.delete(key);if(this.sustain.has(channel))this.deferred.set(key,channel);else this.onNoteOff(key);}else if(type===0xb0&&pitch===64){if(velocity>=64)this.sustain.add(channel);else{this.sustain.delete(channel);for(const [note,ch] of this.deferred)if(ch===channel){this.onNoteOff(note);this.deferred.delete(note);}}}else if(type===0xb0&&(pitch===120||pitch===123)){this.sustain.delete(channel);for(const [note,ch] of [...this.active,...this.deferred])if(ch===channel){this.onNoteOff(note);this.active.delete(note);this.deferred.delete(note);}}
  }
  private attach(key:string|null){for(const input of this.access?.inputs.values()??[])input.onmidimessage=null;this.selected=key;const input=key?this.access?.inputs.get(key):null;if(input){const decoder=new MidiDecoder(bytes=>this.receive(input,bytes));input.onmidimessage=event=>decoder.feed(event.data);void input.open?.().catch(()=>this.onError('Impossible d’ouvrir cette entrée MIDI.'));}this.onChange();}
  select(key:string|null){this.panic();this.preferred=key;this.preferredName=key?this.inputs.find(i=>i.id===key)?.name??'':'';this.attach(key);}
  panic(){const keys=new Set([...this.active.keys(),...this.deferred.keys()]);for(const key of keys)this.onNoteOff(key);this.active.clear();this.deferred.clear();this.sustain.clear();this.onDisconnect();}
  get selectedId(){return this.selected;}
}
export const midi=new MidiManager();
