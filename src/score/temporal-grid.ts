import {noteStart,type Project} from '../music/model.ts';
import {convertSolfa} from '../solfa/converter.ts';
import {textWidth} from './font-metrics.ts';
import {layoutMeasure,measureGeometry,SCORE_TIME_EPS,type MeasureGeometry} from './layout.ts';
import {punctuationHalfWidth,punctuationSettings} from './punctuation.ts';
import type {SolfaDisplay} from './display.ts';

export function solfaGlyphWidth(pitch:number,p:Project,size:number){const s=convertSolfa(pitch,p.tonic);return textWidth(s.syllable,size)+textWidth((s.octave>0?"'":',').repeat(Math.abs(s.octave)),size*.7);}

/** Fit measured glyphs around an affine time grid. Never alter a musical position or font size. */
export function temporalGeometry(p:Project,bar:number,display:SolfaDisplay):MeasureGeometry{
 const g=measureGeometry(p,bar-1,1,1,true),index=new Map(p.tracks.flatMap(t=>t.events).map(n=>[n.id,n])),gap=punctuationSettings(p.layout).gap;
 // Visibility preferences must not move any note or change document geometry.
 const rows=p.tracks.map((t,i)=>layoutMeasure(p,i,bar-1,1,g).map(c=>({beat:c.beat,width:c.kind==='note'?c.noteIds.reduce((sum,key)=>sum+solfaGlyphWidth(index.get(key)!.midiPitch,p,p.layout.noteSize),0)+Math.max(0,c.noteIds.length-1)*textWidth('/',p.layout.noteSize):textWidth(c.symbols.join('/').replaceAll('–','-'),p.layout.noteSize)})));
 const signs=p.tracks.map(t=>g.rhythmByTrack![t.id]);
 const half=Math.max(0,...signs.flatMap(row=>row.map(s=>punctuationHalfWidth(s,p.layout)))),glyph=Math.max(p.layout.noteSize*.64,...rows.flatMap(row=>row.map(c=>c.width)));
 // One offset for the whole measure; chords/letters never shift an individual time anchor.
 g.noteOffset=glyph/2+half+gap;g.leadingPadding=0;
 let rate=p.layout.noteSize*.8;
 const require=(duration:number,distance:number)=>{if(duration>SCORE_TIME_EPS)rate=Math.max(rate,distance/duration);};
 rows.forEach((row,i)=>{
  row.forEach((a,j)=>{
   const next=row[j+1];if(next)require(next.beat-a.beat,(a.width+next.width)/2+gap);
   for(const s of signs[i])if(s.beat>a.beat+SCORE_TIME_EPS)require(s.beat-a.beat,g.noteOffset!+a.width/2+punctuationHalfWidth(s,p.layout)+gap);
   require(g.end-a.beat,g.noteOffset!+a.width/2);
  });
  signs[i].forEach((a,j)=>{const b=signs[i][j+1];if(b)require(b.beat-a.beat,punctuationHalfWidth(a,p.layout)+punctuationHalfWidth(b,p.layout)+gap);});
 });
 // Each lyric line is its own collision lane, with the same musical coordinates as the notes.
 for(const line of p.lyrics){
  const words=line.syllables.flatMap(s=>{const linked=(s.noteIds??(s.noteId?[s.noteId]:[])).map(key=>index.get(key)).filter(n=>!!n);if(!linked.length)return [];const beat=Math.min(...linked.map(noteStart));return beat>=g.begin-SCORE_TIME_EPS&&beat<g.end-SCORE_TIME_EPS?[{beat,width:textWidth(s.text+(s.hyphenAfter?'-':''),p.layout.lyricSize)}]:[];}).sort((a,b)=>a.beat-b.beat);
  words.forEach((a,i)=>{const b=words[i+1];if(b)require(b.beat-a.beat,(a.width+b.width)/2+Math.max(3,gap));require(g.end-a.beat,g.noteOffset!+a.width/2);if(Math.abs(a.beat-g.begin)<SCORE_TIME_EPS)g.leadingPadding=Math.max(g.leadingPadding!,a.width/2-g.noteOffset!+gap-8);else require(a.beat-g.begin,a.width/2-g.noteOffset!+gap-8);});
 }
 const preferred=Math.max(rate,Math.max(p.layout.noteSize*1.55,rate+p.layout.noteSize*(p.layout.justification==='adaptive'?.18:.35))*display.spacing),duration=g.end-g.begin;
 g.minimumWidth=Math.max(40,duration*rate);g.width=Math.max(40,duration*preferred);g.anchors=g.anchors.map(a=>({...a,x:(a.beat-g.begin)/duration*g.width}));
 return g;
}
