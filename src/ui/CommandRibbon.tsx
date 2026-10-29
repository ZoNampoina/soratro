import {useEffect,useRef,useState,type ReactNode} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';

export function RibbonGroup({label,children,className=''}:{label:string;children:ReactNode;className?:string}){
  return <div className={'ribbon-group '+className} role="group" aria-label={label}>
    <div className="ribbon-group-content">{children}</div>
    <span className="ribbon-group-label" aria-hidden="true">{label}</span>
  </div>;
}

/** Reuses editor commands in one bounded row; hiding the ribbon never unmounts them. */
export function CommandRibbon({tabs,utilities,transport,expanded,contextKey,children}:{tabs:ReactNode;utilities:ReactNode;transport?:ReactNode;expanded:boolean;contextKey:string;children:ReactNode}){
  const body=useRef<HTMLDivElement>(null),scroll=useRef<HTMLDivElement>(null),content=useRef<HTMLDivElement>(null);
  const [edges,setEdges]=useState({left:false,right:false});
  useEffect(()=>{
    const viewport=scroll.current,inner=content.current;
    if(!viewport||!inner)return;
    const measure=()=>{
      const next={left:viewport.scrollLeft>1,right:viewport.scrollLeft+viewport.clientWidth<viewport.scrollWidth-2};
      setEdges(previous=>previous.left===next.left&&previous.right===next.right?previous:next);
    };
    const observer=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(measure);
    observer?.observe(viewport);observer?.observe(inner);window.addEventListener('resize',measure);
    viewport.addEventListener('scroll',measure,{passive:true});measure();
    return ()=>{observer?.disconnect();window.removeEventListener('resize',measure);viewport.removeEventListener('scroll',measure);};
  },[]);
  useEffect(()=>{scroll.current?.scrollTo({left:0});body.current?.scrollTo({left:0});},[contextKey,expanded]);
  return <section className="command-ribbon" aria-label="Ruban de commandes" data-expanded={expanded}>
    <div className="ribbon-tabs-row">
      <nav className="ribbon-tabs" aria-label="Onglets de l’atelier">{tabs}</nav>
      <div className="ribbon-mobile-scroll" hidden={!expanded}>
        <button aria-label="Groupes précédents" title="Faire défiler le ruban vers la gauche" onClick={()=>body.current?.scrollBy({left:-280,behavior:'smooth'})}><ChevronLeft size={14}/></button>
        <button aria-label="Groupes suivants" title="Faire défiler le ruban vers la droite" onClick={()=>body.current?.scrollBy({left:280,behavior:'smooth'})}><ChevronRight size={14}/></button>
      </div>
      {utilities}
    </div>
    <div className="ribbon-body" ref={body}>
      {transport}
      <div className="ribbon-context" id="ribbon-context" hidden={!expanded}>
        <button className="ribbon-scroll-arrow" aria-label="Groupes précédents du ruban" disabled={!edges.left} onClick={()=>scroll.current?.scrollBy({left:-320,behavior:'smooth'})}><ChevronLeft size={15}/></button>
        <div className="ribbon-scroll" ref={scroll} tabIndex={0} aria-label="Groupes de commandes">
          <div className="ribbon-context-content" ref={content}>{children}</div>
        </div>
        <button className="ribbon-scroll-arrow" aria-label="Groupes suivants du ruban" disabled={!edges.right} onClick={()=>scroll.current?.scrollBy({left:320,behavior:'smooth'})}><ChevronRight size={15}/></button>
      </div>
    </div>
  </section>;
}
