import {SOLFA_PRESETS} from '../score/display';
import type {WorkspacePreferences} from '../storage/ui-preferences';
export function DisplayPreferences({workspace:w,change,exportSettings,canExport=true}:{workspace:WorkspacePreferences;change:(patch:Partial<WorkspacePreferences>)=>void;exportSettings:()=>void;canExport?:boolean}){
  return <>
    <section><h3>Interface</h3><div className="preference-checks">
      {([['header','Barre supérieure'],['tools','Outils et timeline'],['toolbar','Ruban de composition'],['piano','Clavier piano'],['inspector','Inspecteur des notes']] as const).map(([key,label])=><label className="checkbox-label" key={key}><input type="checkbox" checked={w[key]} onChange={e=>change({[key]:e.target.checked})}/>{label}</label>)}
    </div><label>Panneau des pistes<select value={w.tracks} onChange={e=>change({tracks:e.target.value as typeof w.tracks})}><option value="open">Ouvert</option><option value="compact">Réduit aux voix</option><option value="hidden">Masqué</option></select></label></section>
    <section><h3>Composition</h3><label className="checkbox-label"><input type="checkbox" checked={w.sync} onChange={e=>change({sync:e.target.checked})}/>Synchroniser les vues</label>
      <label className="checkbox-label"><input type="checkbox" checked={w.preview} onChange={e=>change({preview:e.target.checked})}/>Préécoute des notes</label>
      <div className="form-grid"><label>Volume de préécoute<input type="range" min={.05} max={1} step={.05} value={w.previewVolume} onChange={e=>change({previewVolume:+e.target.value})}/></label><label>Durée de préécoute (s)<input type="number" min={.05} max={1} step={.05} value={w.previewDuration} onChange={e=>{if(+e.target.value>=.05&&+e.target.value<=1)change({previewDuration:+e.target.value});}}/></label></div>
    </section>
    <section><h3>Affichage Solfa</h3><label>Préréglage Solfa<select value="" onChange={e=>change({solfa:structuredClone(SOLFA_PRESETS[e.target.value])})}><option value="" disabled>Personnaliser</option>{Object.keys(SOLFA_PRESETS).map(name=><option key={name}>{name}</option>)}</select></label>
      <div className="preference-checks">{([['rests','Afficher les silences'],['measureNumbers','Afficher les numéros de mesures'],['markers','Afficher les repères'],['holds','Afficher les prolongations']] as const).map(([key,label])=><label key={key} className="checkbox-label"><input type="checkbox" checked={w.solfa[key]} onChange={e=>change({solfa:{...w.solfa,[key]:e.target.checked}})}/>{label}</label>)}</div>
      <p>La taille Solfa du document se règle dans Mise en page. Le zoom de la partition agrandit seulement l’affichage.</p><label>Espacement<input type="range" min={.75} max={1.6} step={.05} value={w.solfa.spacing} onChange={e=>change({solfa:{...w.solfa,spacing:+e.target.value}})}/></label>
      <div className="form-grid"><label>Séparateurs<select value={w.solfa.separators} onChange={e=>change({solfa:{...w.solfa,separators:e.target.value as typeof w.solfa.separators}})}><option value="standard">Temps et groupes</option><option value="bars">Barres de mesure</option><option value="none">Sans séparateurs</option></select></label><label>Densité<select value={w.solfa.density} onChange={e=>change({solfa:{...w.solfa,density:e.target.value as typeof w.solfa.density}})}><option value="compact">Compacte</option><option value="standard">Standard</option><option value="airy">Aérée</option></select></label></div>
      <label className="checkbox-label"><input type="checkbox" checked={w.follow} onChange={e=>change({follow:e.target.checked})}/>Suivre la lecture automatiquement</label>
    </section>
    <section><h3>Export</h3><button className="secondary-button" disabled={!canExport} onClick={exportSettings}>Mise en page et aperçu d’export</button></section>
  </>;
}
