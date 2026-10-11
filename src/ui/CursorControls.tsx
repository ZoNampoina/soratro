import {useState} from 'react';
import {Crosshair} from 'lucide-react';
import type {Project} from '../music/model';
import {measureAt,measureCount} from '../music/timeline';
import {beatAtCursorAddress,cursorAddress,cursorLabel,cursorStep} from '../music/cursor';
import {Dialog} from './Dialog';
import {NumericInput} from './NumericInput';

interface Props {project:Project;cursor:number;beat:number;running:boolean;locked:boolean;selectionBeat?:number;onGo:(beat:number)=>void;onPlay:(beat:number)=>void;onInsert:(at:number,pitch:number,duration:number)=>void;onDraw:(at:number,pitch:number,duration:number)=>void}
const SUBDIVISIONS=[1,2,3,4,6,8];
export function CursorControls({project,cursor,beat,running,locked,selectionBeat,onGo,onPlay,onInsert,onDraw}:Props){
 const [open,setOpen]=useState(false),[measure,setMeasure]=useState(1),[time,setTime]=useState(1),[division,setDivision]=useState('1:1'),[pitch,setPitch]=useState(60),[duration,setDuration]=useState(.5),[error,setError]=useState('');
 const current=cursorAddress(project,running?beat:cursor),label=cursorLabel(project,cursor),metric=measureAt(project,measure);
 function show(){const a=cursorAddress(project,cursor);setMeasure(a.measure);setTime(a.time);setDivision(a.division+':'+a.part);setDuration(cursorStep(project));setError('');setOpen(true);}
 function destination(){const [d,part]=division.split(':').map(Number);return beatAtCursorAddress(project,{measure,time,division:d,part});}
 function action(fn:(at:number)=>void){try{const at=destination();onGo(at);fn(at);setOpen(false);}catch(e){setError(e instanceof Error?e.message:'Position invalide.');}}
 return <>
  <button className="position-display cursor-position-button" aria-label="Aller à…" title={label+' · Aller à…'} disabled={locked} onClick={show} data-cursor-beat={cursor}>
   <span className="eyebrow">{running?'LECTURE':'CURSEUR'} <Crosshair size={11}/></span>
   <strong aria-label={cursorLabel(project,running?beat:cursor)}>{String(current.measure).padStart(3,'0')}<span> : </span>{current.time}{!running&&current.division!==1&&<small> + {current.part-1}/{current.division}</small>}</strong>
  </button>
  {open&&<Dialog title="Aller à…" onClose={()=>setOpen(false)}>
   <form className="cursor-dialog" onSubmit={e=>{e.preventDefault();action(()=>{});}}>
    <p className="cursor-work-position">Position de travail : {label}</p>
    <div className="form-grid three-columns">
     <label>Mesure<NumericInput aria-label="Mesure du curseur" type="number" min={1} max={measureCount(project)} value={measure} onValueChange={n=>{setMeasure(Math.trunc(n));setTime(1);}}/></label>
     <label>Temps<NumericInput aria-label="Temps du curseur" type="number" min={1} max={Math.ceil(metric.barBeats/metric.pulse)} value={time} onValueChange={n=>setTime(Math.trunc(n))}/></label>
     <label>Subdivision<select aria-label="Subdivision du curseur" value={division} onChange={e=>setDivision(e.target.value)}>
      {!SUBDIVISIONS.includes(+division.split(':')[0])&&<option value={division}>Position actuelle ({division.replace(':',' / ')})</option>}
      {SUBDIVISIONS.flatMap(d=>Array.from({length:d},(_,i)=><option key={d+':'+(i+1)} value={d+':'+(i+1)}>{d===1?'Temps entier':d===2?'Demi-temps '+(i+1):d===3?'Tiers '+(i+1):(i+1)+' / '+d}</option>))}
     </select></label>
    </div>
    {error&&<p role="alert">{error}</p>}
    <p className="cursor-route-help">Départ au premier passage de cette mesure. Les reprises et renvois rencontrés ensuite restent actifs. Une boucle active utilise sa propre zone.</p>
    <div className="cursor-play-actions">
     <button type="button" onClick={()=>action(at=>onPlay(at))}>Lire depuis le curseur</button>
     <button type="button" onClick={()=>{onGo(0);onPlay(0);setOpen(false);}}>Lire depuis le début</button>
     <button type="button" disabled={selectionBeat===undefined} onClick={()=>{if(selectionBeat!==undefined){onPlay(selectionBeat);setOpen(false);}}}>Lire depuis la sélection</button>
    </div>
    <details><summary>Insérer une note</summary><div className="form-grid">
     <label>Hauteur MIDI<NumericInput aria-label="Hauteur de la note à insérer" type="number" min={0} max={127} value={pitch} onValueChange={n=>setPitch(Math.trunc(n))}/></label>
     <label>Durée (noires)<NumericInput aria-label="Durée de la note à insérer" type="number" min={.03125} max={64} step="any" value={duration} onValueChange={setDuration}/></label>
    </div><div className="cursor-play-actions"><button type="button" onClick={()=>action(at=>onInsert(at,pitch,duration))}>Insérer au curseur</button><button type="button" onClick={()=>action(at=>onDraw(at,pitch,duration))}>Placer des notes dans la partition</button></div></details>
    <div className="dialog-actions"><button type="button" onClick={()=>setOpen(false)}>Annuler</button><button className="primary-button">Positionner le curseur</button></div>
   </form>
  </Dialog>}
 </>;
}
