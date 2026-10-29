import {useMemo,useRef,useState} from 'react';
import type {Project} from '../music/model';
import {measureAt,measureCount} from '../music/timeline';
import {audioToBeat,beatToAudio} from '../reference/mapping';
export function ReferenceWaveform({project,peaks,beat,locked,seek,region,move}:{project:Project;peaks:number[];beat:number;locked:boolean;seek:(beat:number)=>void;region:(start:number,end:number)=>void;move:(milliseconds:number)=>void}){
 const r=project.referenceAudio!,[zoom,setZoom]=useState(1),[select,setSelect]=useState(false),[draft,setDraft]=useState<{start:number;end:number}|null>(null),drag=useRef<{x:number;time:number;shift:boolean}|null>(null),viewport=useRef<HTMLDivElement>(null);
 const width=Math.max(720,(viewport.current?.clientWidth??720)*zoom),height=84;
 const path=useMemo(()=>peaks.map((peak,i)=>{const x=i*width/Math.max(1,peaks.length-1),h=Math.max(.6,peak*25);return `M${x.toFixed(1)} ${(45-h).toFixed(1)}v${(h*2).toFixed(1)}`;}).join(''),[peaks,width]);
 const ticks=useMemo(()=>{const result:{x:number;label:string}[]=[];let previous=-100;for(let n=1;n<=Math.min(10000,measureCount(project));n++){const m=measureAt(project,n),time=beatToAudio(r,m.start),x=time/r.duration*width;if(x<0||x>width||x-previous<48)continue;result.push({x,label:String(n)});previous=x;}return result;},[r,project.timeSignature,project.signatureMap,project.settings.pickupBeats,width]);
 const range=draft??r.region,timeAt=(e:React.PointerEvent<SVGSVGElement>)=>Math.max(0,Math.min(r.duration,(e.clientX-e.currentTarget.getBoundingClientRect().left)/width*r.duration));
 return <div className="reference-waveform"><div className="reference-wave-actions"><button aria-pressed={!select} onClick={()=>setSelect(false)}>Curseur</button><button aria-pressed={select} onClick={()=>setSelect(true)}>Sélectionner une région</button><button aria-label="Réduire la forme d’onde" onClick={()=>setZoom(z=>Math.max(1,z/1.5))}>−</button><span>{Math.round(zoom*100)} %</span><button aria-label="Agrandir la forme d’onde" onClick={()=>setZoom(z=>Math.min(16,z*1.5))}>+</button><span>Mesures en haut · secondes en bas</span></div>
  <div ref={viewport} className="reference-wave-scroll"><svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label="Forme d’onde de l’audio de référence" style={{touchAction:select?'none':'pan-x'}}
   onPointerDown={e=>{if(locked)return;const shift=e.altKey||!!(e.target as Element).closest('[data-shift]');drag.current={x:e.clientX,time:timeAt(e),shift};e.currentTarget.setPointerCapture(e.pointerId);if(select&&!shift)setDraft({start:timeAt(e),end:timeAt(e)});}}
   onPointerMove={e=>{if(!drag.current||!select||drag.current.shift)return;const time=timeAt(e);setDraft({start:Math.min(drag.current.time,time),end:Math.max(drag.current.time,time)});}}
   onPointerCancel={()=>{drag.current=null;setDraft(null);}}
   onPointerUp={e=>{const d=drag.current;if(!d)return;drag.current=null;if(d.shift){const delta=(e.clientX-d.x)/width*r.duration*1000;if(Math.abs(delta)>1)move(r.offsetMs+delta);}else if(select){const time=timeAt(e),start=Math.min(d.time,time),end=Math.max(d.time,time);if(end-start>.03)region(start,end);}else seek(Math.max(0,audioToBeat(r,timeAt(e))));setDraft(null);}}>
    <rect width={width} height={height} fill="var(--surface-2)"/>
    <rect x={range.start/r.duration*width} width={(range.end-range.start)/r.duration*width} height={height} fill="var(--accent-surface)"/>
    {ticks.map(t=><g key={t.x}><path d={`M${t.x} 15v53`} stroke="var(--border)"/><text x={t.x+3} y={12}>{t.label}</text></g>)}
    <path d={path} stroke="var(--accent)" strokeWidth={Math.max(.6,width/Math.max(1,peaks.length)*.7)} fill="none"/>
    {r.anchors.map(a=><g key={a.id} transform={`translate(${(a.audioTime-r.offsetMs/1000)/r.duration*width},0)`}><path d="M0 16v53" stroke="var(--danger)" strokeDasharray="3 2"/><text x={3} y={24} className="anchor-label">◆</text></g>)}
    {Array.from({length:11},(_,i)=><text key={i} x={i/10*(width-30)+3} y={81}>{(i/10*r.duration).toFixed(1)}</text>)}
    <path d={`M${beatToAudio(r,beat)/r.duration*width} 0v${height}`} stroke="var(--text)" strokeWidth={2}/>
    <g data-shift="true" className="reference-drag"><rect x={Math.max(0,Math.min(width-164,10))} y={55} width={164} height={17} rx={3} fill="var(--surface)"/><text x={16} y={67}>↔ Glisser pour décaler l’audio</text></g>
   </svg></div></div>;
}
