import { noteDuration, noteStart, type Project } from '../music/model.ts';
import { measureAt } from '../music/timeline.ts';
import { midiToSolfa } from '../solfa/converter.ts';
import {rhythmBoundaries,principalPulses} from '../solfa/rhythm.ts';
export interface ScoreCell {beat:number;x:number;symbols:string[];kind:'note'|'hold'|'rest';noteIds:string[]}
export interface MeasureGeometry {begin:number;end:number;width:number;anchors:{beat:number;x:number}[];rhythm?:ReturnType<typeof rhythmBoundaries>}
export function measureGeometry(project:Project,barIndex:number,width=216,minGap=36,traditional=false):MeasureGeometry {
  const info=measureAt(project,barIndex+1),begin=info.start,end=info.end;
  const notes=project.tracks.flatMap(t=>t.events);const onsets=notes.map(noteStart).filter(b=>b>begin&&b<end);
  const rhythm=traditional?rhythmBoundaries(project,barIndex+1):undefined;
  const pulses=traditional?principalPulses(info,project.layout.compoundPulse!==false):Array.from({length:info.numerator},(_,i)=>begin+i*info.pulse);
  const basics=[...pulses,...(rhythm?.map(r=>r.beat)??[]),...onsets,end];
  const releases=notes.map(n=>noteStart(n)+noteDuration(n)).filter(b=>b>begin&&b<end&&!basics.some(next=>next>=b&&next-b<.03125));
  const positions=[...new Set([...basics.slice(0,-1),...releases].map(x=>Math.round(x*10000)/10000))].sort((a,b)=>a-b);
  const anchors:{beat:number;x:number}[]=[];let previousWidth=minGap;
  positions.forEach(beat=>{const x=anchors.length?Math.max((beat-begin)/info.barBeats*width,anchors[anchors.length-1].x+previousWidth):0;anchors.push({beat,x});const labels=project.tracks.map(t=>t.events.filter(n=>Math.abs(noteStart(n)-beat)<.0001).map(n=>midiToSolfa(n.midiPitch,project.tonic)).join('/'));previousWidth=Math.max(minGap,...labels.map(label=>label.length*minGap*.3+minGap*.5));});
  return {begin,end,width:Math.max(width,(anchors.at(-1)?.x??0)+previousWidth),anchors,...(rhythm?{rhythm}:{})};
}
export function beatToScoreX(geometry:MeasureGeometry,beat:number){const anchors=[...geometry.anchors,{beat:geometry.end,x:geometry.width}];for(let i=0;i<anchors.length-1;i++)if(beat>=anchors[i].beat&&beat<=anchors[i+1].beat){const a=anchors[i],b=anchors[i+1];return a.x+(beat-a.beat)/(b.beat-a.beat)*(b.x-a.x);}return beat<geometry.begin?0:geometry.width;}
export function layoutMeasure(project:Project,trackIndex:number,barIndex:number,width:number,geometry=measureGeometry(project,barIndex,width)):ScoreCell[]{
  const track=project.tracks[trackIndex];
  return geometry.anchors.map(({beat,x})=>{const notes=track.events.filter(n=>Math.abs(noteStart(n)-beat)<.0001);const held=track.events.filter(n=>noteStart(n)<beat-.0001&&noteStart(n)+noteDuration(n)>beat+.0001);return {beat,x,symbols:notes.length?notes.map(n=>midiToSolfa(n.midiPitch,project.tonic)):held.length?['–']:['0'],kind:notes.length?'note':held.length?'hold':'rest',noteIds:notes.map(n=>n.id)};});
}
