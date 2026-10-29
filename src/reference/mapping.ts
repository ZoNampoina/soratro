import type {ReferenceAudio} from './types.ts';
import type {Project} from '../music/model.ts';
import {secondsBetween,measureAt,type LoopRegion} from '../music/timeline.ts';
function segment(r:ReferenceAudio,value:number,key:'beat'|'audioTime'){
 const anchors=r.anchors;let i=0;while(i<anchors.length-2&&anchors[i+1][key]<=value)i++;return [anchors[i],anchors[i+1]] as const;
}
/** Positive fine offset delays the clip on the musical timeline. */
export function beatToAudio(r:ReferenceAudio,beat:number){const [a,b]=segment(r,beat,'beat'),slope=b?(b.audioTime-a.audioTime)/(b.beat-a.beat):60/r.bpm;return a.audioTime+(beat-a.beat)*slope-r.offsetMs/1000;}
export function audioToBeat(r:ReferenceAudio,time:number){const shifted=time+r.offsetMs/1000,[a,b]=segment(r,shifted,'audioTime'),slope=b?(b.beat-a.beat)/(b.audioTime-a.audioTime):r.bpm/60;return a.beat+(shifted-a.audioTime)*slope;}
function loopSeconds(r:ReferenceAudio,beat:number,loop?:LoopRegion){
 if(!loop||beat<=loop.end)return beatToAudio(r,beat);
 const length=loop.end-loop.start,extra=beat-loop.end,cycles=Math.floor(extra/length);
 return beatToAudio(r,loop.end)+cycles*(beatToAudio(r,loop.end)-beatToAudio(r,loop.start))+beatToAudio(r,loop.start+extra%length)-beatToAudio(r,loop.start);
}
export function referenceSeconds(r:ReferenceAudio,start:number,end:number,loop?:LoopRegion){return loopSeconds(r,end,loop)-loopSeconds(r,start,loop);}
export function referenceBeat(r:ReferenceAudio,start:number,seconds:number,loop?:LoopRegion){
 const absolute=loopSeconds(r,start,loop)+seconds,end=loop?beatToAudio(r,loop.end):Infinity;
 if(!loop||absolute<=end)return audioToBeat(r,absolute);
 const duration=beatToAudio(r,loop.end)-beatToAudio(r,loop.start),remaining=absolute-end,cycles=Math.floor(remaining/duration);
 return loop.end+cycles*(loop.end-loop.start)+audioToBeat(r,beatToAudio(r,loop.start)+remaining%duration)-loop.start;
}
/** Rendering cuts at every tempo/anchor change; the mapping is affine in each piece. */
export function renderPieces(p:Project,speed:number){
 const r=p.referenceAudio!;const points=[0,r.duration];
 if(r.mode==='score'){for(const a of r.anchors)points.push(a.audioTime-r.offsetMs/1000);for(const t of p.tempoMap)points.push(beatToAudio(r,measureAt(p,t.measure).start));}
 const cuts=[...new Set(points.filter(t=>t>=0&&t<=r.duration))].sort((a,b)=>a-b);
 return cuts.slice(0,-1).map((start,i)=>{const end=cuts[i+1];return {start,end,duration:(r.mode==='audio'?end-start:secondsBetween(p,audioToBeat(r,start),audioToBeat(r,end)))/speed};});
}
