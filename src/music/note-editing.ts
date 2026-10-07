import { id,noteDuration,noteStart,type NoteEvent,type Project } from './model.ts';
import { cleanLyrics,placeNote } from './editing.ts';
export interface Selection {trackId:string;id:string;ids?:string[]}
export interface NoteClipboard {notes:NoteEvent[];duration:number;origin:number}
export function selectionIds(selected:Selection|null){return new Set(selected?.ids??(selected?[selected.id]:[]));}
export function copyNotes(p:Project,selected:Selection|null):NoteClipboard|null {const ids=selectionIds(selected),notes=p.tracks.flatMap(t=>t.events).filter(n=>ids.has(n.id));if(!notes.length)return null;const origin=Math.min(...notes.map(noteStart)),end=Math.max(...notes.map(n=>noteStart(n)+noteDuration(n)));return {notes:structuredClone(notes),duration:end-origin,origin};}
export function pasteNotes(p:Project,clipboard:NoteClipboard,beat:number,trackId?:string):Selection|null {const ids:string[]=[];let primary='';const sourceTracks=new Set(clipboard.notes.map(n=>n.trackId));for(const n of clipboard.notes){const track=p.tracks.find(t=>t.id===(sourceTracks.size===1&&trackId?trackId:n.trackId));if(!track)continue;const key=id();track.events.push(placeNote({...n,id:key,trackId:track.id,tieFrom:undefined,tieTo:undefined},Math.max(0,beat)+noteStart(n)-clipboard.origin));ids.push(key);primary=track.id;}return ids.length?{trackId:primary,id:ids[0],ids}:null;}
export function deleteNotes(p:Project,selected:Selection|null){const ids=selectionIds(selected);for(const track of p.tracks)track.events=track.events.filter(n=>!ids.has(n.id));cleanLyrics(p);}
