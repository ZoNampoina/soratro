import {RotateCw,Scan,SlidersHorizontal} from 'lucide-react';
import {type ScanPage,type Preparation,PREPARATION_PRESETS,DEFAULT_PREPARATION} from '../../recognition/types';
export function ScanPreparation({page,change,onDeskew,tool,setTool,busy}:{page:ScanPage;change:(fn:(p:ScanPage)=>void)=>void;onDeskew:()=>void;tool:string;setTool:(value:'inspect'|'region'|'perspective')=>void;busy:boolean}){
 function set<K extends keyof Preparation>(key:K,value:Preparation[K]){change(p=>{p.preparation[key]=value;p.revision++;p.regions=[];});}
 return <fieldset disabled={busy} className="scan-fields"><legend>Préparer la page</legend>
  <label>Préréglage<select aria-label="Préréglage de préparation" value="" onChange={e=>change(p=>{Object.assign(p.preparation,PREPARATION_PRESETS[e.target.value]);p.revision++;p.regions=[];})}><option value="" disabled>Choisir un document…</option>{Object.keys(PREPARATION_PRESETS).map(name=><option key={name}>{name}</option>)}</select></label>
  <div className="scan-actions"><button onClick={()=>set('rotation',((page.preparation.rotation+90)%360) as Preparation['rotation'])}><RotateCw size={15}/>90°</button><button className={tool==='perspective'?'active':''} onClick={()=>setTool(tool==='perspective'?'inspect':'perspective')}><Scan size={15}/>Recadrage / perspective</button><button onClick={onDeskew}>Redresser les lignes</button></div>
  <p className="scan-help">Le recadrage déplace les quatre coins de l’original. Les modifications restent réversibles. Les petits signes sont conservés ; vérifiez-les sur l’image préparée.</p>
  <details><summary><SlidersHorizontal size={14}/>Réglages de l’image</summary>
   {([['brightness','Luminosité',-70,70,1],['contrast','Contraste',.5,2.5,.05],['sharpness','Netteté',0,1,.05],['noise','Réduction du grain',0,1,.05],['deskew','Inclinaison (degrés)',-12,12,.1]] as const).map(([key,label,min,max,step])=><label key={key}>{label} <output>{page.preparation[key]}</output><input aria-label={label} type="range" min={min} max={max} step={step} value={page.preparation[key]} onChange={e=>set(key,+e.target.value)}/></label>)}
   {([['grayscale','Niveaux de gris'],['adaptive','Noir et blanc adaptatif'],['flatten','Corriger le fond et l’éclairage'],['invert','Inverser noir / blanc']] as const).map(([key,label])=><label className="checkbox-label" key={key}><input type="checkbox" checked={page.preparation[key]} onChange={e=>set(key,e.target.checked)}/>{label}</label>)}
   <button onClick={()=>change(p=>{p.preparation=structuredClone(DEFAULT_PREPARATION);p.revision++;p.regions=[];})}>Rétablir l’image originale</button>
  </details>
 </fieldset>;
}
