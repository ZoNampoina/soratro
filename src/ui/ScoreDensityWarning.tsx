import type {PageSettings} from '../music/model';
import type {ScoreDocument} from '../score/engraving';
export function ScoreDensityWarning({document,layout,change}:{document:ScoreDocument|null;layout:PageSettings;change?:(patch:Partial<PageSettings>)=>void}){
 const warnings=document?.warnings??[];
 if(!warnings.length)return null;
 return <details className="score-density-warning" open><summary>{warnings.length} ligne(s) trop dense(s)</summary>
  <p role="alert">{warnings[0].message}</p>
  {change?<div>
   {layout.orientation==='portrait'&&<button onClick={()=>change({orientation:'landscape'})}>Passer en paysage</button>}
   {layout.margin>5&&<button onClick={()=>change({margin:Math.max(5,layout.margin-5)})}>Réduire les marges</button>}
   {layout.measuresPerSystem>1&&<button onClick={()=>change({measuresPerSystem:layout.measuresPerSystem-1})}>{layout.measuresPerSystem-1} mesures par ligne</button>}
   {layout.measureAlignment!=='adaptive'&&<button onClick={()=>change({measureAlignment:'adaptive'})}>Mode adaptatif</button>}
  </div>:null}
  <small>Vous pouvez aussi diminuer manuellement la taille Solfa. Corrigez le dépassement avant l’export.</small>
 </details>;
}
