import {noteStart,noteDuration,type NoteEvent,type RecordingTake} from '../music/model.ts';
import {removeRange} from '../music/editing.ts';
export interface ReplacementRange {start:number;end:number}
/** Union of the intervals actually played; silences never erase existing music. */
export function replacementRanges(events:NoteEvent[],punch?:ReplacementRange):ReplacementRange[]{
 const ranges=(punch?[punch]:events.map(n=>({start:noteStart(n),end:noteStart(n)+noteDuration(n)}))).filter(r=>r.end>r.start).sort((a,b)=>a.start-b.start);
 const merged:ReplacementRange[]=[];for(const r of ranges){const last=merged.at(-1);if(last&&r.start<=last.end+1e-8)last.end=Math.max(last.end,r.end);else merged.push({...r});}return merged;
}
export function takeRanges(take:RecordingTake):ReplacementRange[]{return take.replacementRanges??[{start:take.startBeat,end:take.endBeat}];}
export function overlapsRanges(note:NoteEvent,ranges:ReplacementRange[]){return ranges.some(r=>noteStart(note)<r.end&&noteStart(note)+noteDuration(note)>r.start);}
export function removeRanges(events:NoteEvent[],ranges:ReplacementRange[]){return ranges.reduce((notes,r)=>removeRange(notes,r.start,r.end),events);}
