import {assertTracksUnlocked} from './locks.ts';
import {id,noteStart,noteDuration,type Project,type NoteEvent,type MusicLink} from './model.ts';
export function addMusicLink(p:Project,kind:MusicLink['kind'],keys:string[]){
  const notes=p.tracks.flatMap(t=>t.events).filter(n=>keys.includes(n.id)).sort((a,b)=>noteStart(a)-noteStart(b));
  assertTracksUnlocked(p,notes.map(n=>n.trackId));
  if(notes.length<2||notes.some(n=>n.trackId!==notes[0].trackId))throw new Error('Choisissez au moins deux notes de la même voix.');
  if(kind==='tie'&&notes.some((n,i)=>n.midiPitch!==notes[0].midiPitch||i>0&&Math.abs(noteStart(n)-noteStart(notes[i-1])-noteDuration(notes[i-1]))>1e-4))throw new Error('Une liaison de durée relie des notes de même hauteur, contiguës.');
  cache.delete(p);p.links??=[];p.links.push({id:id(),kind,trackId:notes[0].trackId,noteIds:notes.map(n=>n.id)});
}
const cache=new WeakMap<Project,Map<string,NoteEvent[]>>();
export function playbackNotes(p:Project,trackId:string):NoteEvent[]{
  let tracks=cache.get(p);if(!tracks){tracks=new Map();cache.set(p,tracks);}const cached=tracks.get(trackId);if(cached)return cached;
  const notes=p.tracks.find(t=>t.id===trackId)?.events??[],removed=new Set<string>(),replacements=new Map<string,NoteEvent>();
  for(const link of p.links??[]){if(link.trackId!==trackId||link.kind!=='tie')continue;const group=link.noteIds.map(key=>notes.find(n=>n.id===key)).filter((n):n is NoteEvent=>!!n).sort((a,b)=>noteStart(a)-noteStart(b));
    if(group.length<2||group.some((n,i)=>removed.has(n.id)||n.midiPitch!==group[0].midiPitch||i>0&&Math.abs(noteStart(n)-noteStart(group[i-1])-noteDuration(group[i-1]))>1e-4))continue;
    const start=noteStart(group[0]),end=noteStart(group.at(-1)!)+noteDuration(group.at(-1)!);replacements.set(group[0].id,{...group[0],editDuration:end-start,quantizedDuration:end-start});group.slice(1).forEach(n=>removed.add(n.id));
  }const result=notes.filter(n=>!removed.has(n.id)).map(n=>replacements.get(n.id)??n);tracks.set(trackId,result);return result;
}

export function invalidatePlaybackNotes(p:Project){cache.delete(p);}
