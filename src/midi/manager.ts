interface MidiInput {id:string;name:string;manufacturer?:string;state:string;onmidimessage:((event:{data:Uint8Array})=>void)|null}
interface MidiAccess {inputs:Map<string,MidiInput>;onstatechange:(()=>void)|null}
export class MidiManager {
  private access:MidiAccess|null=null;private selected:string|null=null;
  supported=!!(navigator as Navigator&{requestMIDIAccess?:unknown}).requestMIDIAccess;
  inputs:{id:string;name:string;state:string}[]=[];
  onChange:()=>void=()=>{};onNoteOn:(key:string,pitch:number,velocity:number)=>void=()=>{};onNoteOff:(key:string)=>void=()=>{};onActivity:()=>void=()=>{};onDisconnect:()=>void=()=>{};
  async connect(){if(!this.supported)throw new Error('MIDI externe indisponible sur ce navigateur.');const n=navigator as unknown as {requestMIDIAccess:(options:{sysex:boolean})=>Promise<MidiAccess>};this.access=await n.requestMIDIAccess({sysex:false});this.access.onstatechange=()=>{this.refresh();if(this.selected&&!this.inputs.some(x=>x.id===this.selected&&x.state==='connected')){this.onDisconnect();this.select(null);}this.onChange();};this.refresh();if(this.inputs.length)this.select(this.inputs[0].id);}
  private refresh(){this.inputs=[...(this.access?.inputs.values()??[])].map(i=>({id:i.id,name:i.name||i.manufacturer||'Clavier MIDI',state:i.state}));this.onChange();}
  select(key:string|null){this.onDisconnect();for(const input of this.access?.inputs.values()??[])input.onmidimessage=null;this.selected=key;const input=key?this.access?.inputs.get(key):null;if(input)input.onmidimessage=event=>{const [status,pitch,velocity]=event.data;const type=status&0xf0;const id='midi:'+input.id+':'+(status&0x0f)+':'+pitch;this.onActivity();if(type===0x90&&velocity>0)this.onNoteOn(id,pitch,velocity);else if(type===0x80||(type===0x90&&velocity===0))this.onNoteOff(id);};this.onChange();}
  get selectedId(){return this.selected;}
}
export const midi=new MidiManager();
