import {memo,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {Music2,Minus,Plus,ChevronLeft,ChevronRight,Navigation,List,Maximize2} from 'lucide-react';
import {noteDuration,noteStart,type NoteEvent,type Project} from '../music/model';
import {engraveProject,pageSVG,type ScoreDocument} from '../score/engraving';
import {beatToScoreX} from '../score/layout';
import {textWidth} from '../score/font-metrics';
import {measureAt,measureForBeat} from '../music/timeline';
import {DEFAULT_SOLFA,type SolfaDisplay} from '../score/display';
import {selectionIds,type Selection} from '../music/note-editing';
import {DEFAULT_SCORE,normalizeScore,clamp,type ScoreFit} from '../storage/ui-preferences';
import {usePreference} from './usePreference';
import {useScoreGestures} from './useScoreGestures';
import {ScoreDensityWarning} from './ScoreDensityWarning';
export interface FocusRequest {id:number;beat:number;noteId?:string}
export interface EditorialTarget {role:'header'|'footer'|'number'|'system'|'symbol';objectId?:string;measure?:number}
export interface MusicalPosition {measure:number;beat:number}
interface Props {
  project:Project;beat:number;running:boolean;compact?:boolean;visible?:boolean;
  display?:SolfaDisplay;follow?:boolean;document?:ScoreDocument;preferenceKey?:string;preview?:boolean;
  selected?:Selection|null;focusRequest?:FocusRequest;onFullscreen?:()=>void;
  onNoteClick?:(note:NoteEvent,modifiers:{add:boolean;range:boolean})=>void;
  onMeasureClick?:(number:number)=>void;onObjectClick?:(id:string)=>void;
  seek?:(beat:number)=>void;
  editorial?:boolean;onEditorialClick?:(target:EditorialTarget)=>void;
  placement?:boolean;onPlace?:(position:MusicalPosition)=>void;onMoveObject?:(id:string,position:MusicalPosition)=>void;
}
const Paper=memo(function Paper({html,width,height}:{html:string;width:number;height:number}){
  return <div className="engraved-content" style={{width,height}} dangerouslySetInnerHTML={{__html:html}}/>;
});
export function SolfaScore({project,beat,running,compact,visible=true,display=DEFAULT_SOLFA,follow=true,document:provided,preferenceKey,preview=false,selected,focusRequest,onFullscreen,onNoteClick,seek,onMeasureClick,onObjectClick,editorial=false,onEditorialClick,placement=false,onPlace,onMoveObject}:Props){
  const ref=useRef<HTMLDivElement>(null);
  const dragObject=useRef<{id:string;x:number;y:number}|null>(null),ignoreClick=useRef(false);
  const [viewport,setViewport,ready]=usePreference(preferenceKey??'score:'+project.id,DEFAULT_SCORE,normalizeScore);
  const [bounds,setBounds]=useState({width:0,height:0}),[suspended,setSuspended]=useState(false),[measure,setMeasure]=useState(1),[multi,setMulti]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),appliedFocus=useRef(-1);
  const pendingScroll=useRef<{left:number;top:number}|null>(null);
  const previousZoom=useRef(1);
  const result=useMemo(()=>{try{return {doc:provided??engraveProject(project,undefined,display),error:''};}catch(e){return {doc:null,error:e instanceof Error?e.message:'Rendu indisponible.'};}},[project,provided,display]);
  const doc=result.doc,current=measureForBeat(project,beat).number,system=doc?.systems.find(s=>s.first<=current&&s.last>=current),position=system?.measures.find(m=>m.number===current);
  const pages=useMemo(()=>doc?.pages.map(p=>pageSVG(p,undefined,!preview||editorial))??[],[doc,preview,editorial]);
  const noteIndex=useMemo(()=>new Map(project.tracks.flatMap(t=>t.events.map(n=>[n.id,n] as const))),[project.tracks]);
  const chosen=selectionIds(selected??null),paper=doc?.pages[clamp(viewport.page,0,(doc?.pages.length??1)-1)]??doc?.pages[0];
  const fitWidth=paper?(bounds.width-32)/paper.width:1,fitHeight=paper?(bounds.height-32)/paper.height:1;
  const zoom=viewport.fit==='manual'||!bounds.width?viewport.zoom:clamp(viewport.fit==='width'?fitWidth:viewport.fit==='height'?fitHeight:viewport.fit==='two'?Math.min(fitWidth,((bounds.height-52)/2)/(paper?.height??1)):Math.min(fitWidth,fitHeight),.1,3);
  const suppressTouch=useScoreGestures(ref,zoom,changeZoom,()=>changeZoom('width'),()=>{dragObject.current=null;ignoreClick.current=true;});
  const pageNumber=Math.min(viewport.page,Math.max(0,(doc?.pages.length??1)-1));
  useEffect(()=>{
    const el=ref.current;if(!el||!visible)return;
    const read=()=>setBounds({width:el.clientWidth,height:el.clientHeight});read();
    if(typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(read);observer.observe(el);return ()=>observer.disconnect();
  },[visible]);
  useLayoutEffect(()=>{
    if(visible&&ready&&ref.current){
      if(!pendingScroll.current&&(viewport.fit==='page'||viewport.fit==='two')&&previousZoom.current!==zoom)goPage(viewport.page);
      else{const target=pendingScroll.current??viewport;ref.current.scrollTop=target.top;ref.current.scrollLeft=target.left;}
      pendingScroll.current=null;
    }
    previousZoom.current=zoom;
  },[visible,ready,zoom,viewport.fit]);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  function suspend(){if(!running)return;setSuspended(true);clearTimeout(timer.current);timer.current=setTimeout(()=>setSuspended(false),4000);}
  function navigate(number:number,behavior:ScrollBehavior='auto'){
    const target=doc?.systems.find(s=>s.first<=number&&s.last>=number);if(!target||!ref.current)return;
    const el=ref.current.querySelector<HTMLElement>('[data-page="'+target.page+'"]');
    if(el){ref.current.scrollTo({top:el.offsetTop+target.y*zoom-24,behavior});setViewport(v=>({...v,page:target.page}));}
  }
  useEffect(()=>{if(visible&&running&&follow&&!suspended)navigate(current);},[current,running,visible,follow,suspended,zoom,doc]);
  useEffect(()=>{
    if(visible&&focusRequest&&appliedFocus.current!==focusRequest.id){navigate(measureForBeat(project,focusRequest.beat).number);appliedFocus.current=focusRequest.id;}
  },[focusRequest?.id,visible,doc,zoom]);
  function changeZoom(value:number|ScoreFit,point?:{x:number;y:number}){
    const el=ref.current;
    if(typeof value==='number'){
      const next=clamp(value,.1,3);
      if(el){const x=point?.x??el.clientWidth/2,y=point?.y??el.clientHeight/2;pendingScroll.current={left:Math.max(0,(el.scrollLeft+x)*next/zoom-x),top:Math.max(0,(el.scrollTop+y)*next/zoom-y)};}
      setViewport(v=>({...v,zoom:next,fit:'manual'}));
    }else setViewport(v=>({...v,fit:value}));
  }
  function goPage(index:number){
    const next=clamp(index,0,(doc?.pages.length??1)-1),el=ref.current?.querySelector<HTMLElement>('[data-page="'+next+'"]');
    if(el)ref.current!.scrollTo({top:el.offsetTop-12,behavior:'auto'});
    setViewport(v=>({...v,page:next}));
  }
  function selectElement(el:Element,modifiers:{add:boolean;range:boolean}){
    if(ignoreClick.current){ignoreClick.current=false;return;}
    if(editorial){const op=el.closest('[data-score-role]'),role=op?.getAttribute('data-score-role'),number=el.closest('[data-measure]')?.getAttribute('data-measure');if(role&&['header','footer','number','system','symbol'].includes(role)){onEditorialClick?.({role:role as EditorialTarget['role'],objectId:op?.getAttribute('data-object-id')??undefined,measure:number?+number:undefined});return;}if(number){const s=doc?.systems.find(s=>s.first<=+number&&s.last>=+number);onEditorialClick?.({role:'system',measure:s?.first??+number});return;}return;}
    const key=el.closest('[data-note-id]')?.getAttribute('data-note-id');
    if(key){const note=noteIndex.get(key);if(note)onNoteClick?.(note,modifiers);return;}const object=el.closest('[data-object-id][data-score-role="symbol"]')?.getAttribute('data-object-id');if(object){onObjectClick?.(object);return;}const number=el.closest('[data-measure]')?.getAttribute('data-measure');if(number)onMeasureClick?.(+number);
  }
  function positionAt(index:number,e:{clientX:number;clientY:number;currentTarget:HTMLElement}):MusicalPosition|undefined{
    const page=doc?.pages[index];if(!page)return;const rect=e.currentTarget.getBoundingClientRect(),x=(e.clientX-rect.left)/zoom,y=(e.clientY-rect.top)/zoom,sys=page.systems.find(s=>y>=s.y&&y<=s.y+s.height);if(!sys)return;const m=sys.measures.find(m=>x>=m.x&&x<=m.x+m.width);if(!m)return;const local=Math.max(0,Math.min(m.geometry.width,(x-m.x-m.inset)/m.scale)),points=[...m.geometry.anchors,{beat:m.geometry.end,x:m.geometry.width}],right=points.findIndex(a=>a.x>=local),b=points[Math.max(0,right)],a=points[Math.max(0,right-1)],absolute=a.beat+(b.beat-a.beat)*(b.x===a.x?0:(local-a.x)/(b.x-a.x)),metric=measureAt(project,m.number);return {measure:m.number,beat:Math.max(0,Math.min(metric.barBeats-.001,Math.round((absolute-metric.start)*8)/8))};
  }
  return <section hidden={!visible} className={'score-panel '+(compact?'compact-score':'')+(preview?' export-score':'')+(editorial?' editorial-score':'')+(placement?' placing-symbol':'')} aria-label={preview?'Aperçu de l’export':'Partition Solfa'}>
    <div className="panel-bar score-bar"><span className="panel-eyebrow"><Music2 size={14}/>{preview?'APERÇU':'PARTITION SOLFA'}</span>
      <div className="score-zoom"><button aria-label="Réduire la partition" onClick={()=>changeZoom(zoom/1.2)}><Minus size={14}/></button><label className="score-zoom-input"><input aria-label="Zoom de la partition (%)" type="number" min={10} max={300} value={Math.round(zoom*100)} onChange={e=>{const n=+e.target.value;if(n>=10&&n<=300)changeZoom(n/100);}}/> %</label><button aria-label="Agrandir la partition" onClick={()=>changeZoom(zoom*1.2)}><Plus size={14}/></button>
        <select aria-label="Cadrage de la partition" value={viewport.fit} onChange={e=>e.target.value==='manual'?changeZoom(1):changeZoom(e.target.value as ScoreFit)}><option value="width">Largeur</option><option value="height">Hauteur</option><option value="page">Page entière</option><option value="two">Deux pages</option><option value="manual">Zoom manuel</option></select>
        <div className="score-page-controls"><button aria-label="Page précédente" disabled={pageNumber===0} onClick={()=>goPage(pageNumber-1)}><ChevronLeft size={15}/></button><span className="page-count">Page {pageNumber+1} / {doc?.pages.length??0}</span><button aria-label="Page suivante" disabled={!doc||pageNumber>=doc.pages.length-1} onClick={()=>goPage(pageNumber+1)}><ChevronRight size={15}/></button></div>
        {!preview&&<><button aria-label="Sélection multiple Solfa" aria-pressed={multi} className={multi?'active':''} onClick={()=>setMulti(!multi)}>Multi</button><button aria-label="Navigateur de partition" aria-pressed={viewport.navigator} onClick={()=>setViewport(v=>({...v,navigator:!v.navigator}))}><List size={15}/></button><button aria-label="Revenir à la lecture" title={suspended?'Suivi suspendu : revenir à la lecture':'Revenir à la lecture'} className={suspended?'follow-suspended':''} onClick={()=>{clearTimeout(timer.current);setSuspended(false);navigate(current);}}><Navigation size={15}/></button>{onFullscreen&&<button aria-label="Partition plein écran" onClick={onFullscreen}><Maximize2 size={15}/></button>}</>}
      </div>
    </div>
    {!preview&&viewport.navigator&&doc&&<nav className="score-navigator" aria-label="Navigation de partition">
      <div className="score-page-list">{doc.pages.map((page,i)=><button key={i} className={pageNumber===i?'active':''} onClick={()=>goPage(i)} aria-label={'Aller à la page '+(i+1)}><svg width={38} height={50} viewBox={'0 0 '+page.width+' '+page.height} aria-hidden="true"><rect width={page.width} height={page.height} fill="white"/>{page.systems.map(s=><rect key={s.index} x={s.x} y={s.y} width={s.width} height={s.height} fill="#a593f540"/>) }{page.systems.flatMap(s=>project.tracks.map((t,ti)=><rect key={s.index+':'+t.id} x={s.x} y={s.y+ti*s.height/project.tracks.length} width={s.width} height={s.height/project.tracks.length} fill={t.color} opacity={.5}/>))}</svg><span>{i+1}</span><small>{page.systems[0]?.first}–{page.systems.at(-1)?.last}</small></button>)}</div>
      <div className="score-navigation-fields"><label>Aller à la mesure<input type="number" min={1} max={doc.measureCount} value={measure} onChange={e=>setMeasure(clamp(+e.target.value,1,doc.measureCount))}/></label><button onClick={()=>{navigate(measure);seek?.(measureAt(project,measure).start);}}>Aller</button><select aria-label="Aller à un système" value="" onChange={e=>navigate(+e.target.value)}><option value="" disabled>Système</option>{doc.systems.map(s=><option key={s.index} value={s.first}>{s.index+1} · mesures {s.first}–{s.last}</option>)}</select><select aria-label="Aller à un repère" value="" onChange={e=>navigate(+e.target.value)}><option value="" disabled>Repère</option>{project.markers.map(m=><option key={m.id} value={m.measure}>{m.label} · {m.measure}</option>)}</select><span>Lecture : mesure {current}</span></div>
    </nav>}
    <ScoreDensityWarning document={doc} layout={project.layout}/>
    <div className="score-viewport engraved-viewport" ref={ref} onWheel={suspend} onTouchStart={suspend} onPointerDown={e=>{if(e.target===e.currentTarget)suspend();}} onScroll={e=>{
      if(!visible||!ready)return;const el=e.currentTarget;let index=0;
      for(const page of Array.from(el.querySelectorAll<HTMLElement>('[data-page]'))){if(page.offsetTop<=el.scrollTop+el.clientHeight*.35)index=Number(page.dataset.page);}
      setViewport(v=>({...v,top:el.scrollTop,left:el.scrollLeft,page:index}));
    }}>{result.error&&<p role="alert" className="score-error">{result.error}</p>}{doc?.pages.map((page,index)=><div className="engraved-page" data-page={index} key={index} style={{width:Math.max(page.width,...page.systems.map(s=>s.x+s.width+project.layout.margin*96/25.4))*zoom,height:page.height*zoom,contentVisibility:'auto',containIntrinsicSize:(page.width*zoom)+'px '+(page.height*zoom)+'px'}}
      onPointerDown={e=>{const id=(e.target as Element).closest('[data-score-role="symbol"][data-object-id]')?.getAttribute('data-object-id');if(id&&onMoveObject&&!placement){dragObject.current={id,x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}}
      onPointerCancel={()=>{dragObject.current=null;}}
      onPointerUp={e=>{const drag=dragObject.current;dragObject.current=null;if(drag&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7){const position=positionAt(index,e);if(position){ignoreClick.current=true;onMoveObject?.(drag.id,position);}}else if(drag){ignoreClick.current=true;if(editorial)onEditorialClick?.({role:'symbol',objectId:drag.id});else onObjectClick?.(drag.id);}}}
      onClick={e=>{if(suppressTouch.current){ignoreClick.current=false;return;}if(placement){const op=(e.target as Element).closest('[data-score-beat][data-measure]'),bar=op?.getAttribute('data-measure'),at=op?.getAttribute('data-score-beat'),position=bar&&at?{measure:+bar,beat:Math.max(0,+at-measureAt(project,+bar).start)}:positionAt(index,e);if(position)onPlace?.(position);return;}selectElement(e.target as Element,{add:e.ctrlKey||e.metaKey||multi,range:e.shiftKey});}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(placement){const number=(e.target as Element).closest('[data-measure]')?.getAttribute('data-measure');if(number)onPlace?.({measure:+number,beat:0});}else selectElement(e.target as Element,{add:e.ctrlKey||e.metaKey||multi,range:e.shiftKey});}}}>
      <div className="engraved-scale" style={{width:page.width,height:page.height,transform:'scale('+zoom+')'}}><Paper html={pages[index]} width={page.width} height={page.height}/>
        {!preview&&<svg className="score-cursor" width={page.width} height={page.height} aria-hidden="true">
          {page.ops.filter(op=>op.kind==='text'&&op.noteIds?.some(key=>chosen.has(key)||running&&noteIndex.has(key)&&noteStart(noteIndex.get(key)!)<=beat&&noteStart(noteIndex.get(key)!)+noteDuration(noteIndex.get(key)!)>beat)).map((op,i)=>op.kind==='text'?<rect key={i} data-selected-note={op.noteIds?.find(key=>chosen.has(key))} x={op.x-3} y={op.y-op.size} width={textWidth(op.text,op.size)+6} height={op.size+5} rx={3} fill={op.noteIds?.some(key=>chosen.has(key))?'#8063cd25':'#60b59f25'} stroke={project.tracks.find(t=>t.id===noteIndex.get(op.noteIds?.[0]??'')?.trackId)?.color??'#8063cd'} strokeWidth={1.2}/>:null)}
          {running&&system?.page===index&&position&&<><rect x={position.x} y={position.y-4} width={position.width} height={position.height+8} fill="#ab94e617"/><line x1={position.x+position.inset+beatToScoreX(position.geometry,beat)*position.scale} x2={position.x+position.inset+beatToScoreX(position.geometry,beat)*position.scale} y1={position.y-4} y2={position.y+position.height+4} stroke="#a184dc" strokeWidth={2}/></>}
        </svg>}
      </div>
    </div>)}</div>
  </section>;
}
