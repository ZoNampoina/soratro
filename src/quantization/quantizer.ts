import type { NoteEvent, Project } from '../music/model.ts';
export type Grid = Project['settings']['quantization'];
export function gridStep(grid:Grid,events:NoteEvent[]=[]) {
  if(grid==='1/4')return 1;if(grid==='1/8')return .5;if(grid==='1/16')return .25;if(grid==='none')return 0;
  if(!events.length)return .5;
  const choices=[1,.5,.25];
  return choices.find(step=>events.every(n=>Math.abs(n.originalStart-Math.round(n.originalStart/step)*step)<step*.22&&Math.abs(n.originalDuration-Math.round(n.originalDuration/step)*step)<step*.22))??.25;
}
export function quantize(events:NoteEvent[],grid:Grid,strength:number): NoteEvent[] {
  const step=gridStep(grid,events);if(!step)return restoreOriginal(events);
  const force=Math.max(0,Math.min(1,strength/100));
  return events.map(n=>({...n,quantizedStart:Math.max(0,n.originalStart+(Math.round(n.originalStart/step)*step-n.originalStart)*force),quantizedDuration:Math.max(.03125,n.originalDuration+(Math.max(step,Math.round(n.originalDuration/step)*step)-n.originalDuration)*force)}));
}
export function restoreOriginal(events:NoteEvent[]) {return events.map(n=>{const {quantizedStart,quantizedDuration,...original}=n;return original;});}
