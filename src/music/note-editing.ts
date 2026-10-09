import { id,noteDuration,noteStart,type NoteEvent,type Project } from './model.ts';
import { cleanLyrics,placeNote } from './editing.ts';
import { assertTracksUnlocked } from './locks.ts';
export interface Selection {trackId:string;id:string;ids?:string[]}
export interface NoteClipboard {notes:NoteEvent[];duration:number;origin:number}
export function selectionIds(selected:Selection|null){return new Set(selected?.ids??(selected?[selected.id]:[]));}
export function selectNote(p:Project, selected:Selection|null, note:NoteEvent, modifiers:{add?:boolean;range?:boolean}={}):Selection|null {
  if(modifiers.range&&selected){
    const anchor=p.tracks.flatMap(t=>t.events).find(n=>n.id===selected.id);
    if(anchor){
      const start=Math.min(noteStart(anchor),noteStart(note)),end=Math.max(noteStart(anchor),noteStart(note));
      const ids=p.tracks.find(t=>t.id===note.trackId)!.events.filter(n=>noteStart(n)>=start&&noteStart(n)<=end).map(n=>n.id);
      return {trackId:anchor.trackId,id:anchor.id,ids:[...new Set([...selectionIds(selected),...ids])]};
    }
  }
  if(modifiers.add){
    const ids=selectionIds(selected);ids.has(note.id)?ids.delete(note.id):ids.add(note.id);
    const primary=ids.has(note.id)?note:p.tracks.flatMap(t=>t.events).find(n=>ids.has(n.id));
    return primary?{trackId:primary.trackId,id:primary.id,ids:[...ids]}:null;
  }
  return {trackId:note.trackId,id:note.id,ids:[note.id]};
}
export function copyNotes(p:Project,selected:Selection|null):NoteClipboard|null {const ids=selectionIds(selected),notes=p.tracks.flatMap(t=>t.events).filter(n=>ids.has(n.id));if(!notes.length)return null;const origin=Math.min(...notes.map(noteStart)),end=Math.max(...notes.map(n=>noteStart(n)+noteDuration(n)));return {notes:structuredClone(notes),duration:end-origin,origin};}
export function pasteNotes(p:Project,clipboard:NoteClipboard,beat:number,trackId?:string):Selection|null {const ids:string[]=[];let primary='';const sourceTracks=new Set(clipboard.notes.map(n=>n.trackId));const destination=(n:NoteEvent)=>sourceTracks.size===1&&trackId?trackId:n.trackId;assertTracksUnlocked(p,clipboard.notes.map(destination));for(const n of clipboard.notes){const track=p.tracks.find(t=>t.id===destination(n));if(!track)continue;const key=id();track.events.push(placeNote({...n,id:key,trackId:track.id,tieFrom:undefined,tieTo:undefined},Math.max(0,beat)+noteStart(n)-clipboard.origin));ids.push(key);if(!primary)primary=track.id;}return ids.length?{trackId:primary,id:ids[0],ids}:null;}
export function deleteNotes(p:Project,selected:Selection|null){const ids=selectionIds(selected);assertTracksUnlocked(p,p.tracks.filter(t=>t.events.some(n=>ids.has(n.id))).map(t=>t.id));for(const track of p.tracks)track.events=track.events.filter(n=>!ids.has(n.id));cleanLyrics(p);}
