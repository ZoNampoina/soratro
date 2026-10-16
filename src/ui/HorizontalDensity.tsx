import type {PageSettings} from '../music/model';

/** A document setting, shared by layout and export; never scales the Solfa type. */
export function HorizontalDensity({layout,change}:{layout:PageSettings;change:(value:number)=>void}){
 const value=Math.round((layout.horizontalDensity??1)*100);
 return <label className="horizontal-density">Densité horizontale · {value} %
  <input aria-label="Densité horizontale (%)" type="range" min={70} max={150} step={5} value={value} onChange={e=>change(Number(e.target.value)/100)}/>
  <small>70 % : aéré · 150 % : compact. Ajuste les espaces et les marges internes des mesures, à taille Solfa constante. Les lignes justifiées gardent la largeur utile du papier.</small>
 </label>;
}
