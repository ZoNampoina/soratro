import type {PageSettings,RhythmicPunctuation} from '../music/model.ts';
import type {RhythmBoundary} from '../solfa/rhythm.ts';
import {textWidth} from './font-metrics.ts';

export const PUNCTUATION_PRESETS:Record<'normal'|'reinforced',RhythmicPunctuation>={
 normal:{style:'normal',size:.85,contrast:.8,weight:1,gap:1.5},
 reinforced:{style:'reinforced',size:1,contrast:1,weight:1.35,gap:2},
};
/** Missing settings in a legacy project use the new default without mutating its layout. */
export function punctuationSettings(layout:PageSettings):RhythmicPunctuation{
 const value=layout.punctuation??PUNCTUATION_PRESETS.reinforced;
 return value.style==='custom'?value:PUNCTUATION_PRESETS[value.style];
}
// Actual ink bounds in ScoreFont.ttf (2048 units/em), distinct from character advance widths.
const ink:Record<string,[number,number]>={':':[240/2048,451/2048],'.':[219/2048,430/2048],',':[158/2048,451/2048]};
export function punctuationInkCenter(label:string,size:number){const bounds=ink[label];return bounds?(bounds[0]+bounds[1])*size/2:textWidth(label,size)/2;}
// The third-division comma is a local vector. Center its actual Bézier extent on the time boundary.
const raw=[.04,.12,.03,-.08];
function cubicBounds([a,b,c,d]:number[]){
 const qa=-a+3*b-3*c+d,qb=2*(a-2*b+c),qc=b-a,points=[0,1],disc=qb*qb-4*qa*qc;
 if(Math.abs(qa)<1e-12){if(Math.abs(qb)>1e-12)points.push(-qc/qb);}else if(disc>=0)points.push((-qb+Math.sqrt(disc))/(2*qa),(-qb-Math.sqrt(disc))/(2*qa));
 const values=points.filter(t=>t>=0&&t<=1).map(t=>a*(1-t)**3+3*b*t*(1-t)**2+3*c*t*t*(1-t)+d*t**3);
 return {min:Math.min(...values),max:Math.max(...values)};
}
const extent=cubicBounds(raw),shift=(extent.min+extent.max)/2,third=raw.map(x=>x-shift);
export function punctuationMetrics(layout:PageSettings){
 const settings=punctuationSettings(layout),size=layout.noteSize*settings.size,strokeWidth=size*.04*(settings.weight-1),addition=Math.round((1-settings.contrast)*120);
 const color='#'+[38,35,45].map(n=>(n+addition).toString(16).padStart(2,'0')).join('');
 return {settings,size,strokeWidth,color,thirdWidth:size*.06*settings.weight,dotRadius:size*(430-219)/4096+strokeWidth/2};
}
export function punctuationHalfWidth(boundary:RhythmBoundary,layout:PageSettings){
 const m=punctuationMetrics(layout);
 const bounds=ink[boundary.label];
 return boundary.kind==='third'?(extent.max-extent.min)*m.size/2+m.thirdWidth/2:boundary.label==='.'?m.dotRadius:(bounds?(bounds[1]-bounds[0])*m.size/2:textWidth(boundary.label,m.size)/2)+m.strokeWidth/2;
}
/** A round baseline dot, independent of font hinting or platform fallback. */
export function halfPunctuation(x:number,baseline:number,layout:PageSettings){
 const m=punctuationMetrics(layout);
 return {kind:'circle' as const,x,y:baseline-m.dotRadius,radius:m.dotRadius,color:m.color};
}
export function thirdPunctuation(x:number,baseline:number,layout:PageSettings){
 const m=punctuationMetrics(layout),s=m.size;
 // A comma head at the baseline with a descending tail; octave marks stay attached to notes.
 return {kind:'curve' as const,x:x+third[0]*s,y:baseline-s*.09,cx1:x+third[1]*s,cy1:baseline-s*.015,cx2:x+third[2]*s,cy2:baseline+s*.07,x2:x+third[3]*s,y2:baseline+s*.13,width:m.thirdWidth,color:m.color};
}
