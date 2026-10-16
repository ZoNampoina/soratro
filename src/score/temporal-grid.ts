import {noteStart,type Project} from '../music/model.ts';
import {textWidth} from './font-metrics.ts';
import {layoutMeasure,measureGeometry,SCORE_TIME_EPS,type MeasureGeometry,type ScoreCell} from './layout.ts';
import {punctuationHalfWidth,punctuationSettings} from './punctuation.ts';
import {combinedSolfaMetrics,solfaNoteMetrics,solfaTextMetrics} from './solfa-metrics.ts';
import type {SolfaDisplay} from './display.ts';

export function solfaGlyphWidth(pitch:number,p:Project,size:number){return solfaNoteMetrics(pitch,p,size).advance;}
export function cellCenterBeat(cell:Pick<ScoreCell,'beat'|'endBeat'>){return (cell.beat+cell.endBeat)/2;}

/** Musical cell centres and measured ink constrain one affine grid; typography never changes time. */
export function temporalGeometry(p:Project,bar:number,display:SolfaDisplay):MeasureGeometry{
 const density=p.layout.horizontalDensity??1,g=measureGeometry(p,bar-1,1,1,true),index=new Map(p.tracks.flatMap(t=>t.events).map(n=>[n.id,n])),gap=punctuationSettings(p.layout).gap/density;
 // Include every potential rest, continuation and separator even when it is hidden.
 const rows=p.tracks.map((t,i)=>layoutMeasure(p,i,bar-1,1,g).map(c=>{const metrics=c.kind==='note'?combinedSolfaMetrics(c.noteIds.map(key=>index.get(key)!.midiPitch),p,p.layout.noteSize):solfaTextMetrics(c.symbols.join('/').replaceAll('–','-'),p.layout.noteSize);return {...c,center:cellCenterBeat(c),width:metrics.right-metrics.left};}));
 const signs=p.tracks.map(t=>g.rhythmByTrack![t.id]);g.noteOffset=0;g.leadingPadding=0;
 let rate=p.layout.noteSize*.8;
 const require=(duration:number,distance:number)=>{if(duration>SCORE_TIME_EPS)rate=Math.max(rate,distance/duration);};
 rows.forEach((row,i)=>{
  row.forEach((a,j)=>{
   const next=row[j+1];if(next)require(next.center-a.center,(a.width+next.width)/2+gap);
   for(const sign of signs[i])require(Math.abs(sign.beat-a.center),a.width/2+punctuationHalfWidth(sign,p.layout)+gap);
   require(a.center-g.begin,a.width/2+gap);require(g.end-a.center,a.width/2+gap);
  });
  signs[i].forEach((a,j)=>{const b=signs[i][j+1];if(b)require(b.beat-a.beat,punctuationHalfWidth(a,p.layout)+punctuationHalfWidth(b,p.layout)+gap);});
 });
 // Lyrics follow the centre of their first linked note, with a separate collision lane.
 for(const line of p.lyrics){
  const row=rows[p.tracks.findIndex(t=>t.id===line.trackId)];if(!row)continue;
  const words=line.syllables.flatMap(s=>{const linked=(s.noteIds??(s.noteId?[s.noteId]:[])).map(key=>index.get(key)).filter(n=>!!n);if(!linked.length)return [];const beat=Math.min(...linked.map(noteStart)),cell=row.find(c=>Math.abs(c.beat-beat)<SCORE_TIME_EPS);return cell?[{center:cell.center,width:textWidth(s.text+(s.hyphenAfter?'-':''),p.layout.lyricSize)}]:[];}).sort((a,b)=>a.center-b.center);
  words.forEach((a,i)=>{const b=words[i+1];if(b)require(b.center-a.center,(a.width+b.width)/2+Math.max(3,gap));require(a.center-g.begin,a.width/2+gap);require(g.end-a.center,a.width/2+gap);});
 }
 const preferred=Math.max(rate,Math.max(p.layout.noteSize*1.55,rate+p.layout.noteSize*(p.layout.justification==='adaptive'?.18:.35))*display.spacing/density),duration=g.end-g.begin;
 g.minimumWidth=Math.max(40,duration*rate);g.width=Math.max(40,duration*preferred);g.anchors=g.anchors.map(a=>({...a,x:(a.beat-g.begin)/duration*g.width}));return g;
}
