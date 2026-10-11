import {noteStart,type Project} from './model.ts';
import {measureAt,measureForBeat,measureCount,musicEnd} from './timeline.ts';
import {gridStep} from '../quantization/quantizer.ts';

const EPS=1e-7;
export interface CursorAddress {measure:number;time:number;division:number;part:number}
export type CursorMove='previous-time'|'next-time'|'previous-subdivision'|'next-subdivision'|'measure-start'|'next-measure';
export function clampCursor(p:Project,beat:number){const value=Math.max(0,Number.isFinite(beat)?beat:0),end=musicEnd(p);return value>=end?measureForBeat(p,end-1e-6).start:value;}
export function cursorStep(p:Project){return gridStep(p.settings.quantization,p.tracks.flatMap(t=>t.events),b=>measureForBeat(p,b).start)||.125;}
export function cursorPositions(p:Project,number:number){
 const m=measureAt(p,number),step=cursorStep(p),points=[m.start];
 for(let b=step;b<m.barBeats-EPS;b+=step)points.push(m.start+b);
 for(let b=m.pulse;b<m.barBeats-EPS;b+=m.pulse)points.push(m.start+b);
 for(const t of p.tracks)for(const n of t.events){const beat=noteStart(n);if(beat>=m.start&&beat<m.end-EPS)points.push(beat);}
 return points.sort((a,b)=>a-b).filter((b,i,a)=>i===0||b-a[i-1]>EPS);
}
export function snapCursor(p:Project,beat:number){
 const value=clampCursor(p,beat),m=measureForBeat(p,value),points=[...cursorPositions(p,m.number),...(m.number<measureCount(p)?[m.end]:[])];
 return points.reduce((a,b)=>Math.abs(b-value)<Math.abs(a-value)?b:a,points[0]);
}
export function cursorAddress(p:Project,beat:number):CursorAddress {
 const value=clampCursor(p,beat),m=measureForBeat(p,value),relative=(value-m.start)/m.pulse,time=Math.floor(relative+EPS)+1,fraction=relative-(time-1);
 for(const division of [1,2,3,4,6,8,12,16,24,32]){const part=Math.round(fraction*division);if(Math.abs(fraction-part/division)<EPS)return {measure:m.number,time,division,part:part+1};}
 return {measure:m.number,time,division:1000,part:Math.round(fraction*1000)+1};
}
export function cursorLabel(p:Project,beat:number){const a=cursorAddress(p,beat);return `Mesure ${a.measure} — Temps ${a.time}`+(a.division===1?'':` — ${a.part}/${a.division}`);}
export function beatAtCursorAddress(p:Project,a:CursorAddress){
 if(![a.measure,a.time,a.division,a.part].every(Number.isInteger)||a.measure<1||a.measure>measureCount(p)||a.time<1||a.division<1||a.division>1000||a.part<1||a.part>a.division)throw new Error('Position temporelle invalide.');
 const m=measureAt(p,a.measure),offset=(a.time-1+(a.part-1)/a.division)*m.pulse;
 if(offset>=m.barBeats-EPS)throw new Error('Ce temps dépasse la durée de cette mesure.');
 return m.start+offset;
}
export function moveCursor(p:Project,beat:number,move:CursorMove){
 const value=clampCursor(p,beat),m=measureForBeat(p,value),relative=(value-m.start)/m.pulse;
 if(move==='measure-start')return m.start;
 if(move==='next-measure')return m.number<measureCount(p)?m.end:value;
 if(move==='next-time'){const next=m.start+(Math.floor(relative+EPS)+1)*m.pulse;return next<musicEnd(p)-EPS?next:value;}
 if(move==='previous-time'){if(relative>EPS)return m.start+(Math.ceil(relative-EPS)-1)*m.pulse;if(m.number===1)return 0;const prev=measureAt(p,m.number-1);return prev.start+Math.floor((prev.barBeats-EPS)/prev.pulse)*prev.pulse;}
 const points=cursorPositions(p,m.number);
 if(move==='next-subdivision')return points.find(b=>b>value+EPS)??(m.number<measureCount(p)?m.end:value);
 return points.slice().reverse().find(b=>b<value-EPS)??(m.number>1?cursorPositions(p,m.number-1).at(-1)!:0);
}
