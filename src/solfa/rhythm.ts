import {noteStart,noteDuration,type Project} from '../music/model.ts';
import {measureAt,type Measure} from '../music/timeline.ts';

export interface RhythmBoundary {beat:number;kind:'pulse'|'half'|'quarter'|'third'|'subdivision';label:string}
export const sameBeat=(a:number,b:number)=>Math.abs(a-b)<1e-4;
/** Timeline units remain quarter notes. Only the displayed principal pulse changes. */
export function principalPulses(m:Measure,compound=true):number[]{
  const grouped=compound&&(m.compound||m.groups.length>1);
  if(grouped){let cursor=m.start;const starts=[cursor];for(const length of m.groups){cursor+=length*m.pulse;if(cursor<m.end-1e-7)starts.push(cursor);}return starts;}
  return Array.from({length:Math.ceil(m.barBeats/m.pulse)},(_,i)=>m.start+i*m.pulse).filter(b=>b<m.end-1e-7);
}
export function rhythmBoundaries(p:Project,number:number):RhythmBoundary[]{
  const m=measureAt(p,number),starts=principalPulses(m,p.layout.compoundPulse!==false),ends=[...starts.slice(1),m.end];
  const events=p.tracks.flatMap(t=>t.events),onsets=events.map(noteStart),grid=[...starts,m.end,...onsets];
  const releases=events.map(n=>noteStart(n)+noteDuration(n)).filter(b=>!grid.some(g=>g>=b&&g-b<.03125));
  const changes=[...onsets,...releases].filter(b=>b>m.start+1e-7&&b<m.end-1e-7);
  const result:RhythmBoundary[]=starts.slice(1).map(beat=>({beat,kind:'pulse',label:':'}));
  starts.forEach((start,i)=>{
    // A levée preserves the full pulse unit rather than stretching a fragment.
    const length=(i===starts.length-1&&m.number===1&&p.settings.pickupBeats>0)?(m.compound&&p.layout.compoundPulse!==false?3*m.pulse:m.pulse):ends[i]-start;
    const fractions=changes.filter(b=>b>start+1e-7&&b<ends[i]-1e-7).map(b=>(b-start)/length);
    const candidates=new Map<number,RhythmBoundary>();
    function add(f:number,kind:RhythmBoundary['kind'],label:string){const beat=start+f*length;if(beat<ends[i]-1e-7)candidates.set(Math.round(beat*1e6),{beat,kind,label});}
    if(fractions.some(f=>sameBeat(f,.5)||sameBeat(f,.25)||sameBeat(f,.75)))add(.5,'half','.');
    if(fractions.some(f=>sameBeat(f,.25)||sameBeat(f,.75))){add(.25,'quarter',',');add(.75,'quarter',',');}
    if(fractions.some(f=>sameBeat(f,1/3)||sameBeat(f,2/3))){add(1/3,'third','inverted-comma');add(2/3,'third','inverted-comma');}
    for(const f of fractions)if(![.25,.5,.75,1/3,2/3].some(v=>sameBeat(f,v)))add(f,'subdivision',',');
    result.push(...candidates.values());
  });
  return result.sort((a,b)=>a.beat-b.beat);
}
