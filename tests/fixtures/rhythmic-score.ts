import {createProject,makeNote} from '../../src/music/model.ts';

/** Seven real measures, with halves, quarters, thirds and a long bass in the first. */
export function rhythmicScore(){
 const p=createProject({title:'Grille rythmique SATB · SORATRO 0.7',tonic:'C',timeSignature:'4/4'});
 p.settings.measureCount=7;p.layout.orientation='landscape';p.layout.noteSize=20;p.layout.measuresPerSystem=4;
 const patterns=[[[0,1],[1,.5],[1.5,.5],[2,1],[3,1]],[[0,.5],[.5,.5],[1,.25],[1.25,.25],[1.5,.25],[1.75,.25],[2,1],[3,1]],[[0,1],[1,1],[2,1/3],[2+1/3,1/3],[2+2/3,1/3],[3,1]],[[0,4]]];
 p.tracks.forEach((t,i)=>t.events=[...patterns[i].map(([beat,duration])=>makeNote(t.id,i===1&&beat===3?84:[60,72,48,36][i],beat,duration,p.tempo)),...Array.from({length:24},(_,j)=>makeNote(t.id,[60,62,64,65][j%4],4+j,1,p.tempo))]);
 return p;
}
