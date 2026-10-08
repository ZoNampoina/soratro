import {noteStart,type NoteEvent,type Project} from './model.ts';
import {selectionIds,type Selection} from './note-editing.ts';

export type SelectionGesture = 'replace' | 'toggle' | 'range';
export function selectEvent(project:Project, current:Selection|null, note:NoteEvent, gesture:SelectionGesture):Selection|null {
  if (gesture==='replace') return {trackId:note.trackId,id:note.id,ids:[note.id]};
  const ids=selectionIds(current);
  if (gesture==='range') {
    const track=project.tracks.find(t=>t.id===note.trackId);
    const sorted=track?.events.slice().sort((a,b)=>noteStart(a)-noteStart(b)||a.midiPitch-b.midiPitch)??[];
    const anchor=sorted.findIndex(n=>n.id===current?.id),end=sorted.findIndex(n=>n.id===note.id);
    if (anchor<0) ids.add(note.id);
    else for (const n of sorted.slice(Math.min(anchor,end),Math.max(anchor,end)+1)) ids.add(n.id);
    return {trackId:current?.trackId??note.trackId,id:current?.id??note.id,ids:[...ids]};
  }
  if(ids.has(note.id)) ids.delete(note.id); else ids.add(note.id);
  if(!ids.size) return null;
  const primary=ids.has(note.id)?note:project.tracks.flatMap(t=>t.events).find(n=>n.id===(ids.has(current?.id??'')?current!.id:[...ids][0]));
  return primary?{trackId:primary.trackId,id:primary.id,ids:[...ids]}:null;
}
export function validSelection(project:Project, selection:Selection|null):Selection|null {
  const ids=selectionIds(selection),notes=project.tracks.flatMap(t=>t.events).filter(n=>ids.has(n.id));
  if(!notes.length)return null;
  const primary=notes.find(n=>n.id===selection?.id)??notes[0];
  return {trackId:primary.trackId,id:primary.id,ids:notes.map(n=>n.id)};
}
