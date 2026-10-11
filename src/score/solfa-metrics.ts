import {convertSolfa} from '../solfa/converter.ts';
import type {Project} from '../music/model.ts';
import {textWidth} from './font-metrics.ts';

// Exact horizontal ink bounds from the bundled ScoreFont.ttf, in its 2048-unit em.
const INK:Record<string,[number,number]>={d:[113,1114],i:[193,377],r:[186,842],m:[186,1821],s:[111,967],f:[47,760],l:[193,377],t:[55,754],a:[123,1069],'/':[0,690],"'":[197,367],'0':[135,1167],',':[158,451],'-':[100,639]};
export interface GlyphMetrics {advance:number;left:number;right:number}
export function solfaTextMetrics(value:string,size:number):GlyphMetrics {
 let advance=0,left=Infinity,right=-Infinity;
 for(const char of value){const ink=INK[char];if(ink){left=Math.min(left,advance+ink[0]/2048*size);right=Math.max(right,advance+ink[1]/2048*size);}else{left=Math.min(left,advance);right=Math.max(right,advance+textWidth(char,size));}advance+=textWidth(char,size);}
 return {advance,left:Number.isFinite(left)?left:0,right:Number.isFinite(right)?right:0};
}
export function solfaNoteMetrics(pitch:number,p:Project,size:number):GlyphMetrics {
 const s=convertSolfa(pitch,p.tonic),base=solfaTextMetrics(s.syllable,size);
 if(!s.octave)return base;
 const octave=solfaTextMetrics((s.octave>0?"'":',').repeat(Math.abs(s.octave)),size*.7);
 return {advance:base.advance+octave.advance,left:Math.min(base.left,base.advance+octave.left),right:Math.max(base.right,base.advance+octave.right)};
}
export function combinedSolfaMetrics(notes:number[],p:Project,size:number):GlyphMetrics {
 let advance=0,left=Infinity,right=-Infinity;
 notes.forEach((pitch,i)=>{const m=solfaNoteMetrics(pitch,p,size);left=Math.min(left,advance+m.left);right=Math.max(right,advance+m.right);advance+=m.advance;if(i<notes.length-1){const slash=solfaTextMetrics('/',size);right=Math.max(right,advance+slash.right);advance+=slash.advance;}});
 return {advance,left:Number.isFinite(left)?left:0,right:Number.isFinite(right)?right:0};
}
