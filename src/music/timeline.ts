import { noteDuration,noteStart,signatureInfo,type Project,type Signature,type TempoUnit } from './model.ts';
export interface Measure {index:number;number:number;start:number;end:number;signature:Signature;numerator:number;pulse:number;barBeats:number;compound:boolean;groups:number[]}
const measureCache=new WeakMap<Project,Measure[]>();
export function invalidateTimeline(project:Project){measureCache.delete(project);}
export function measures(project:Project,count:number):Measure[]{
  let rows=measureCache.get(project);if(!rows){rows=[];measureCache.set(project,rows);}count=Math.min(100000,Math.max(1,Math.ceil(count)));
  while(rows.length<count){const number=rows.length+1;const change=project.signatureMap.filter(c=>c.measure<=number).sort((a,b)=>a.measure-b.measure).at(-1);const signature=change?.signature??project.timeSignature,info=signatureInfo(signature),start=rows.at(-1)?.end??0;const pickup=number===1?project.settings.pickupBeats:0;
    const requested=change?.groups??project.settings.beatGroups;const valid=requested.length&&requested.reduce((a,b)=>a+b,0)===info.numerator;
    const groups=valid?requested:info.compound?Array(info.numerator/3).fill(3):[info.numerator];const barBeats=pickup>0&&pickup<info.barBeats?pickup:info.barBeats;
    rows.push({index:number-1,number,start,end:start+barBeats,signature,...info,barBeats,groups});
  }return rows.slice(0,count);
}
export function measureAt(project:Project,number:number){return measures(project,number)[Math.max(0,Math.ceil(number)-1)];}
export function measureForBeat(project:Project,beat:number):Measure{let rows=measures(project,1);while(rows.at(-1)!.end<=beat+1e-8&&rows.length<100000)rows=measures(project,Math.max(rows.length+1,rows.length*2));let lo=0,hi=rows.length-1;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(rows[mid].end<=beat+1e-8)lo=mid+1;else hi=mid;}return rows[lo];}
export function measureCount(project:Project){let end=0;for(const t of project.tracks)for(const n of t.events)end=Math.max(end,noteStart(n)+noteDuration(n));const musical=measureForBeat(project,Math.max(0,end-1e-6)).number;return Math.max(4,musical,...project.markers.map(m=>m.measure),...project.indications.map(m=>m.measure),...project.repeats.map(r=>r.secondEndingEnd??r.endMeasure),project.settings.measureCount??0);}
export function musicEnd(project:Project){return measureAt(project,measureCount(project)).end;}
export const unitBeats=(unit:TempoUnit)=>unit==='dotted-quarter'?1.5:unit==='eighth'?.5:1;
export const tempoLabel=(unit:TempoUnit)=>unit==='dotted-quarter'?'♩.':unit==='eighth'?'♪':'♩';
export const displayedTempo=(p:Project)=>p.tempo/unitBeats(p.settings.tempoUnit);
function tempoChanges(p:Project){return [{beat:0,bpm:p.tempo},...p.tempoMap.map(t=>({beat:measureAt(p,t.measure).start,bpm:t.bpm}))].sort((a,b)=>a.beat-b.beat);}
export function tempoAt(p:Project,beat:number){return tempoChanges(p).filter(t=>t.beat<=beat).at(-1)?.bpm??p.tempo;}
export function secondsBetween(p:Project,start:number,end:number):number{if(end<start)return -secondsBetween(p,end,start);const points=tempoChanges(p);let elapsed=0,cursor=start,bpm=tempoAt(p,start);for(const point of points){if(point.beat<=start)continue;if(point.beat>=end)break;elapsed+=(point.beat-cursor)*60/bpm;cursor=point.beat;bpm=point.bpm;}return elapsed+(end-cursor)*60/bpm;}
export function beatAfterSeconds(p:Project,start:number,seconds:number):number{if(seconds<0){let cursor=start,remaining=-seconds;const points=tempoChanges(p).filter(t=>t.beat<start).reverse();for(const point of points){const bpm=tempoAt(p,cursor-1e-8),span=(cursor-point.beat)*60/bpm;if(remaining<=span)return cursor-remaining*bpm/60;remaining-=span;cursor=point.beat;}return cursor-remaining*p.tempo/60;}const points=tempoChanges(p);let cursor=start,bpm=tempoAt(p,start),remaining=seconds;for(const point of points){if(point.beat<=start)continue;const span=(point.beat-cursor)*60/bpm;if(remaining<span)return cursor+remaining*bpm/60;remaining-=span;cursor=point.beat;bpm=point.bpm;}return cursor+remaining*bpm/60;}
export interface LoopRegion {start:number;end:number}
export function mapLoopBeat(raw:number,loop?:LoopRegion){if(!loop||raw<loop.end)return raw;return loop.start+(raw-loop.end)%(loop.end-loop.start);}
function rawSeconds(p:Project,raw:number,loop?:LoopRegion){if(!loop||raw<=loop.end)return secondsBetween(p,0,raw);const length=loop.end-loop.start,offset=raw-loop.end,cycles=Math.floor(offset/length);return secondsBetween(p,0,loop.end)+cycles*secondsBetween(p,loop.start,loop.end)+secondsBetween(p,loop.start,loop.start+offset%length);}
export function transportSeconds(p:Project,start:number,end:number,loop?:LoopRegion){return rawSeconds(p,end,loop)-rawSeconds(p,start,loop);}
export function transportBeat(p:Project,start:number,seconds:number,loop?:LoopRegion){const absolute=rawSeconds(p,start,loop)+seconds;if(!loop||absolute<=secondsBetween(p,0,loop.end))return beatAfterSeconds(p,0,absolute);const period=secondsBetween(p,loop.start,loop.end),remaining=absolute-secondsBetween(p,0,loop.end),cycles=Math.floor(remaining/period);return loop.end+cycles*(loop.end-loop.start)+beatAfterSeconds(p,loop.start,remaining%period)-loop.start;}
