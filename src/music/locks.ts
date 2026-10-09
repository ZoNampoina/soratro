import type {Project,TrackId} from './model.ts';
export class TrackLockedError extends Error {}
export function assertTracksUnlocked(project:Project,ids:Iterable<TrackId>){
  const chosen=new Set(ids),tracks=project.tracks.filter(t=>t.locked&&chosen.has(t.id));
  if(tracks.length)throw new TrackLockedError('Piste verrouillée : '+tracks.map(t=>t.name).join(', ')+'. Déverrouillez-la avant de modifier ses notes.');
}
/** Protect every entry point, including old tools, imports of takes and structural edits. */
export function assertLockedTracksUnchanged(before:Project,after:Project){
  for(const track of before.tracks.filter(t=>t.locked)){
    const next=after.tracks.find(t=>t.id===track.id);
    if(!next||JSON.stringify(track.events)!==JSON.stringify(next.events)||JSON.stringify(before.takes.filter(t=>t.trackId===track.id))!==JSON.stringify(after.takes.filter(t=>t.trackId===track.id))){
      assertTracksUnlocked(before,[track.id]);
    }
  }
}
