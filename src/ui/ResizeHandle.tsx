import {useRef} from 'react';
import {clamp} from '../storage/ui-preferences';
interface Props {label:string;axis:'x'|'y';value:number;min:number;max:number;onChange:(n:number)=>void;reset:number;direction?:number;ratio?:boolean}
export function ResizeHandle({label,axis,value,min,max,onChange,reset,direction=1,ratio=false}:Props){
  const drag=useRef<{start:number;value:number;size:number}|null>(null);
  return <div className={'resize-handle resize-'+axis} role="separator" aria-label={label} aria-orientation={axis==='x'?'vertical':'horizontal'}
    tabIndex={0} aria-valuemin={Math.round(min*100)/100} aria-valuemax={Math.round(max*100)/100} aria-valuenow={Math.round(value*100)/100}
    onDoubleClick={()=>onChange(reset)} onKeyDown={e=>{
      if(e.key==='Home'){e.preventDefault();e.stopPropagation();onChange(reset);}
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopPropagation();onChange(clamp(value+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)*(ratio?.025:8),min,max));}
    }} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);const r=e.currentTarget.parentElement!.getBoundingClientRect();drag.current={start:axis==='x'?e.clientX:e.clientY,value,size:axis==='x'?r.width:r.height};}}
    onPointerMove={e=>{const d=drag.current;if(d){const distance=(axis==='x'?e.clientX:e.clientY)-d.start;onChange(clamp(d.value+distance*direction/(ratio?d.size:1),min,max));}}}
    onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}><span/></div>;
}
