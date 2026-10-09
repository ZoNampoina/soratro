import {noteDuration,noteStart,type NoteEvent,type Project,type Tonic,TONICS} from './model.ts';
import {selectionIds,type Selection} from './note-editing.ts';
import {placeNote} from './editing.ts';
import {assertTracksUnlocked} from './locks.ts';
import {snapForProject,quantizeForProject} from '../quantization/quantizer.ts';
export function selectedNotes(p:Project,s:Selection|null){const ids=selectionIds(s);return p.tracks.flatMap(t=>t.events).filter(n=>ids.has(n.id));}
export function selectionBounds(p:Project,s:Selection|null){
  const notes=selectedNotes(p,s);if(!notes.length)return null;
  return {start:Math.min(...notes.map(noteStart)),end:Math.max(...notes.map(n=>noteStart(n)+noteDuration(n))),low:Math.min(...notes.map(n=>n.midiPitch)),high:Math.max(...notes.map(n=>n.midiPitch))};
}
export function editSelection(p:Project,s:Selection|null,transform:(note:NoteEvent,index:number)=>NoteEvent){
  const notes=selectedNotes(p,s);assertTracksUnlocked(p,notes.map(n=>n.trackId));
  const changed=new Map(notes.map((n,i)=>[n.id,transform(n,i)]));
  for(const n of changed.values())if(!Number.isInteger(n.midiPitch)||n.midiPitch<0||n.midiPitch>127||!Number.isFinite(noteStart(n))||noteStart(n)<0||!Number.isFinite(noteDuration(n))||noteDuration(n)<.03125)throw new Error('La modification dépasse les limites de la partition.');
  for(const t of p.tracks)t.events=t.events.map(n=>changed.get(n.id)??n);
}
export function moveSelected(p:Project,s:Selection|null,delta:number,pitchDelta=0){
  const b=selectionBounds(p,s);if(!b)return;
  const dx=Math.max(delta,-b.start),dy=Math.max(-b.low,Math.min(127-b.high,pitchDelta));
  editSelection(p,s,n=>placeNote({...n,midiPitch:n.midiPitch+dy},noteStart(n)+dx));
}
export function transposeSelected(p:Project,s:Selection|null,amount:number){
  if(!Number.isInteger(amount))throw new Error('La hauteur doit être un nombre entier de demi-tons.');
  editSelection(p,s,n=>({...n,midiPitch:n.midiPitch+amount}));
}
export function durationSelected(p:Project,s:Selection|null,value:number,relative=false){
  editSelection(p,s,n=>placeNote(n,noteStart(n),relative?noteDuration(n)+value:value));
}
export type Alignment='starts'|'ends'|'duration'|'spread'|'grid';
export function alignSelected(p:Project,s:Selection|null,kind:Alignment,step:number){
  const notes=selectedNotes(p,s).sort((a,b)=>noteStart(a)-noteStart(b)||a.id.localeCompare(b.id));if(!notes.length)return;
  const start=noteStart(notes[0]),end=Math.max(...notes.map(n=>noteStart(n)+noteDuration(n))),duration=noteDuration(notes.find(n=>n.id===s?.id)??notes[0]),order=new Map(notes.map((n,i)=>[n.id,i]));
  if(kind==='grid'){
    const quantized=new Map(quantizeForProject(p,notes,p.settings.quantization,100).map(n=>[n.id,n]));
    editSelection(p,s,n=>placeNote(n,snapForProject(p,noteStart(n),step),noteDuration(quantized.get(n.id)!)));return;
  }
  editSelection(p,s,n=>kind==='starts'?placeNote(n,start):kind==='ends'?placeNote(n,end-noteDuration(n)):kind==='duration'?placeNote(n,noteStart(n),duration):placeNote(n,start+order.get(n.id)!*step));
}
export function solfaToMidi(degree:number,alteration:number,octave:number,tonic:Tonic){
  if(!Number.isInteger(degree)||degree<1||degree>7||!Number.isInteger(octave)||![-1,0,1].includes(alteration))throw new Error('Hauteur Solfa invalide.');
  const pitch=60+TONICS.indexOf(tonic)+[0,2,4,5,7,9,11][degree-1]+alteration+octave*12;
  if(pitch<0||pitch>127)throw new Error('Cette octave dépasse les hauteurs MIDI 0–127.');return pitch;
}
