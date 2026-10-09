import {createProject,makeNote} from '../../src/music/model.ts';
export function largeScore(){
  const p=createProject({title:'100 mesures SATB'});p.settings.measureCount=100;
  p.tracks.forEach((t,ti)=>t.events=Array.from({length:600},(_,i)=>makeNote(t.id,60+ti+i%5,i*.5,.5,72)));
  p.lyrics=p.tracks.flatMap(t=>[1,2].map(verse=>({id:t.id+'-'+verse,trackId:t.id,text:'Ry hira',verse,syllables:t.events.filter((_,i)=>i%3===0).map((n,i)=>({text:i%2?'hi-ra':'Ry',noteId:n.id,noteIds:[n.id]}))})));
  return p;
}
