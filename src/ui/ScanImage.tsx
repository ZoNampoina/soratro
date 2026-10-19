import {useEffect,useRef,useState} from 'react';
import {Minus,Plus,Scan,Move,RotateCcw} from 'lucide-react';
import {useScoreGestures} from './useScoreGestures';
import {type ScanPage,type ScanRow,type Box,type Point,type Quad,type ScanGlyph} from '../recognition/types';
interface Props {url:string;width:number;height:number;page:ScanPage;rows:ScanRow[];raw:boolean;tool:'inspect'|'region'|'perspective';selectedRow?:string;selectedGlyph?:string;zoom:number;onZoom:(value:number)=>void;onSelect:(row:ScanRow,glyph?:ScanGlyph)=>void;onRegion:(box:Box)=>void;onQuad:(quad:Quad)=>void}
export function ScanImage({url,width,height,page,rows,raw,tool,selectedRow,selectedGlyph,zoom,onZoom,onSelect,onRegion,onQuad}:Props){
 const viewport=useRef<HTMLDivElement>(null),svg=useRef<SVGSVGElement>(null),drag=useRef<{point:Point;corner?:number;pointer:number}|null>(null);
 const [bounds,setBounds]=useState(500),[rectangle,setRectangle]=useState<Box|null>(null),[quad,setQuad]=useState<Quad|null>(null);
 const scale=Math.max(.05,(bounds-24)/width)*zoom;
 useEffect(()=>{const el=viewport.current;if(!el)return;const update=()=>setBounds(el.clientWidth);update();const observer=new ResizeObserver(update);observer.observe(el);return ()=>observer.disconnect();},[]);
 const touch=useScoreGestures(viewport,zoom,value=>onZoom(Math.min(8,Math.max(.3,value))),()=>onZoom(1),()=>{drag.current=null;setRectangle(null);});
 useEffect(()=>{const row=rows.find(r=>r.id===selectedRow),glyph=row?.glyphs.find(g=>g.id===selectedGlyph);if(!row||!viewport.current)return;let b=glyph?.box??row.box;if(raw&&glyph){const xs=glyph.sourceQuad.map(p=>p.x),ys=glyph.sourceQuad.map(p=>p.y);b={x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};}const el=viewport.current;el.scrollTo({left:Math.max(0,(b.x+b.width/2)*scale-el.clientWidth/2),top:Math.max(0,(b.y+b.height/2)*scale-el.clientHeight/2)});},[selectedRow,selectedGlyph,raw]);
 useEffect(()=>{drag.current=null;setRectangle(null);setQuad(null);},[page.id,tool]);
 function point(e:{clientX:number;clientY:number}){const r=svg.current!.getBoundingClientRect();return {x:Math.max(0,Math.min(width,(e.clientX-r.left)/r.width*width)),y:Math.max(0,Math.min(height,(e.clientY-r.top)/r.height*height))};}
 function keyCorner(index:number,e:React.KeyboardEvent){const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!direction)return;e.preventDefault();const next=structuredClone(page.preparation.quad),factor=e.shiftKey ? .02 : .005;next[index]={x:Math.max(0,Math.min(1,next[index].x+direction[0]*factor)),y:Math.max(0,Math.min(1,next[index].y+direction[1]*factor))};onQuad(next);}
 return <section className="scan-image-pane" aria-label={raw?'Document original':'Document préparé'}>
  <div className="scan-image-tools"><span>{raw?'Original':'Image préparée'} · {width} × {height}</span><button aria-label="Réduire le document" onClick={()=>onZoom(Math.max(.3,zoom/1.25))}><Minus size={15}/></button><output aria-label="Zoom du document">{Math.round(zoom*100)} %</output><button aria-label="Agrandir le document" onClick={()=>onZoom(Math.min(8,zoom*1.25))}><Plus size={15}/></button><button aria-label="Ajuster le document" onClick={()=>onZoom(1)}><RotateCcw size={15}/></button><small>{tool==='region'?<><Scan size={12}/>Tracer une zone</>:tool==='perspective'?'Déplacer les quatre coins':<><Move size={12}/>Défiler · pincer pour zoomer</>}</small></div>
  <div className="scan-image-viewport" ref={viewport}>
   <div className="scan-image-surface" style={{width:width*scale,height:height*scale}}>
    <img src={url} width={width*scale} height={height*scale} alt={'Page '+page.sourcePage+' · '+page.name} draggable={false}/>
    <svg ref={svg} className={'scan-image-overlay '+(tool!=='inspect'?'scan-drawing':'')} viewBox={`0 0 ${width} ${height}`} style={{touchAction:tool==='inspect'?'pan-x pan-y':'none'}}
     onPointerDown={e=>{if(tool==='inspect'||e.button!==0||touch.current)return;const p=point(e),corner=(e.target as Element).getAttribute('data-corner');drag.current={point:p,corner:corner===null?undefined:+corner,pointer:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId);if(tool==='perspective')setQuad(structuredClone(page.preparation.quad));}}
     onPointerMove={e=>{const d=drag.current;if(!d||touch.current||d.pointer!==e.pointerId)return;const p=point(e);if(tool==='region')setRectangle({x:Math.min(p.x,d.point.x),y:Math.min(p.y,d.point.y),width:Math.abs(p.x-d.point.x),height:Math.abs(p.y-d.point.y)});else if(d.corner!==undefined){const q=structuredClone(page.preparation.quad);q[d.corner]={x:p.x/width,y:p.y/height};setQuad(q);}}}
     onPointerUp={e=>{const d=drag.current;if(!d||d.pointer!==e.pointerId)return;drag.current=null;if(touch.current){setRectangle(null);return;}if(tool==='region'&&rectangle&&rectangle.width>8&&rectangle.height>5)onRegion(rectangle);if(tool==='perspective'&&quad)onQuad(quad);setRectangle(null);setQuad(null);}}
     onPointerCancel={()=>{drag.current=null;setRectangle(null);setQuad(null);}}>
      {tool==='perspective'&&<><polygon points={(quad??page.preparation.quad).map(p=>p.x*width+','+p.y*height).join(' ')} className="scan-perspective"/>{(quad??page.preparation.quad).map((p,i)=><circle key={i} data-corner={i} role="button" tabIndex={0} aria-label={'Coin '+(i+1)+' de perspective'} cx={p.x*width} cy={p.y*height} r={10/scale} onKeyDown={e=>keyCorner(i,e)}/>)}</>}
      {tool==='inspect'&&rows.filter(r=>r.pageId===page.id&&(raw||r.revision===page.revision)).map(row=><g key={row.id}>
       {!raw&&<rect x={row.box.x} y={row.box.y} width={row.box.width} height={row.box.height} className={'scan-row-hit '+(row.id===selectedRow?'selected':'')} role="button" tabIndex={0} aria-label={`Zone ${row.system}, voix ${row.voice+1}, mesure ${row.firstMeasure}`} onClick={e=>{e.stopPropagation();onSelect(row);}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();onSelect(row);}}}/>}
       {row.glyphs.map(g=><polygon key={g.id} points={(raw?g.sourceQuad:[{x:g.box.x,y:g.box.y},{x:g.box.x+g.box.width,y:g.box.y},{x:g.box.x+g.box.width,y:g.box.y+g.box.height},{x:g.box.x,y:g.box.y+g.box.height}]).map(p=>p.x+','+p.y).join(' ')} className={'scan-glyph '+g.state+(g.id===selectedGlyph?' selected':'')} role="button" tabIndex={g.id===selectedGlyph?0:-1} aria-label={'Signe '+g.label+(g.state==='unknown'?' indéterminé':'')} onClick={e=>{e.stopPropagation();onSelect(row,g);}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();onSelect(row,g);}}}/>)}</g>)}
      {tool==='region'&&page.regions.map(r=><rect key={r.id} x={r.box.x} y={r.box.y} width={r.box.width} height={r.box.height} className="scan-region-outline"/>)}
      {rectangle&&<rect {...rectangle} className="scan-region-outline"/>}
    </svg>
   </div>
  </div>
 </section>;
}
