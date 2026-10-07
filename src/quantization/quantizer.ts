import type { NoteEvent,Project } from '../music/model.ts';
import { measureForBeat } from '../music/timeline.ts';
export type Grid=Project['settings']['quantization'];
export const GRID_OPTIONS:{value:Grid;label:string}[]=[{value:'none',label:'Libre'},{value:'1/2',label:'1/2'},{value:'1/4',label:'1/4'},{value:'1/8',label:'1/8'},{value:'1/16',label:'1/16'},{value:'1/32',label:'1/32'},{value:'triplet-quarter',label:'Triolet ♩'},{value:'triplet-eighth',label:'Triolet ♪'},{value:'triplet-sixteenth',label:'Triolet 1/16'},{value:'compound',label:'Composé 6/8'},{value:'auto',label:'Auto'}];
const STEPS:Record<Exclude<Grid,'auto'>,number>={none:0,'1/2':2,'1/4':1,'1/8':.5,'1/16':.25,'1/32':.125,'triplet-quarter':2/3,'triplet-eighth':1/3,'triplet-sixteenth':1/6,compound:.5};
export function gridStep(grid:Grid,events:NoteEvent[]=[],originForBeat:(beat:number)=>number=()=>0) {
  if(grid!=='auto')return STEPS[grid];if(!events.length)return .5;
  // Prefer the coarsest credible rhythmic model. Penalize spurious subdivisions and outliers.
  const choices=[2,1,2/3,.5,1/3,.25,1/6,.125];
  let best=.5,bestScore=Infinity;
  for(const step of choices){let loss=0;for(const n of events){const start=n.editStart??n.originalStart,duration=n.editDuration??n.originalDuration;const relative=start-originForBeat(start),placement=Math.abs(relative-Math.round(relative/step)*step);const value=Math.abs(duration-Math.max(1,Math.round(duration/step))*step);loss+=Math.min(.2,placement)+Math.min(.2,value)*.6;}const score=loss/events.length+.012/step;if(score<bestScore){bestScore=score;best=step;}}
  return best;
}
export function quantize(events:NoteEvent[],grid:Grid,strength:number,originForBeat:(beat:number)=>number=()=>0):NoteEvent[]{const step=gridStep(grid,events,originForBeat);if(!step)return restoreOriginal(events);const force=Math.max(0,Math.min(1,strength/100));return events.map(n=>{const start=n.editStart??n.originalStart,duration=n.editDuration??n.originalDuration;return {...n,quantizedStart:Math.max(0,start+(Math.round((start-originForBeat(start))/step)*step+originForBeat(start)-start)*force),quantizedDuration:Math.max(.03125,duration+(Math.max(step,Math.round(duration/step)*step)-duration)*force)};});}
export function restoreOriginal(events:NoteEvent[]) {return events.map(n=>{const {quantizedStart,quantizedDuration,...original}=n;return original;});}

export function quantizeForProject(p:Project,events:NoteEvent[],grid:Grid,strength:number){return quantize(events,grid,strength,beat=>measureForBeat(p,beat).start);}
