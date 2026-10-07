import { AndroidMidi } from './native';
import type { MidiAccess,MidiInput } from '../midi/manager';
let access:MidiAccess|null=null;
/** The same MIDI decoder and sustain handling serve the browser and Android USB ports. */
export async function nativeMidiAccess():Promise<MidiAccess>{
  if(access)return access;
  const current:MidiAccess={inputs:new Map(),onstatechange:null};
  const refresh=async()=>{const devices=await AndroidMidi.list();const live=new Set(devices.inputs.map(i=>i.id));for(const input of current.inputs.values())input.state=live.has(input.id)?'connected':'disconnected';for(const device of devices.inputs){const old=current.inputs.get(device.id);if(old){Object.assign(old,device,{state:'connected'});}else{const input:MidiInput={...device,state:'connected',onmidimessage:null,open:()=>AndroidMidi.open({id:device.id})};current.inputs.set(input.id,input);}}current.onstatechange?.();};
  await AndroidMidi.addListener('data',packet=>{current.inputs.get(packet.id)?.onmidimessage?.({data:Uint8Array.from(packet.bytes)});});
  await AndroidMidi.addListener('devices',()=>void refresh());
  await refresh();access=current;return current;
}
