import {useState} from 'react';
import type {PageSettings,RhythmicPunctuation} from '../music/model';
import {punctuationSettings,PUNCTUATION_PRESETS} from '../score/punctuation';
import {NumericInput} from './NumericInput';

export function RhythmicPunctuationEditor({layout,change}:{layout:PageSettings;change:(value:RhythmicPunctuation)=>void}){
 const settings=punctuationSettings(layout),[advanced,setAdvanced]=useState(layout.punctuation?.style==='custom');
 function edit(patch:Partial<RhythmicPunctuation>){change({...settings,...patch,style:'custom'});}
 return <section className="punctuation-editor" aria-label="Ponctuations rythmiques">
  <h3>Ponctuations rythmiques</h3>
  <label>Visibilité des ponctuations<select aria-label="Style des ponctuations" value={layout.punctuation?.style??'reinforced'} onChange={e=>{const style=e.target.value as RhythmicPunctuation['style'];change({...(layout.punctuation??PUNCTUATION_PRESETS.reinforced),style});setAdvanced(style==='custom');}}><option value="normal">Normal</option><option value="reinforced">Renforcé</option><option value="custom">Personnalisé</option></select></label>
  <small>Les signes restent centrés sur leurs frontières rythmiques. Les marques d’octave gardent leur taille et leur position près des notes.</small>
  <details className="layout-advanced" open={advanced} onToggle={e=>setAdvanced(e.currentTarget.open)}>
   <summary>Réglages fins des ponctuations</summary>
   <div className="form-grid">
    <label>Taille relative (%)<NumericInput aria-label="Taille relative des ponctuations (%)" min={70} max={130} value={Math.round(settings.size*100)} onValueChange={n=>edit({size:n/100})}/></label>
    <label>Contraste (%)<NumericInput aria-label="Contraste des ponctuations (%)" min={40} max={100} value={Math.round(settings.contrast*100)} onValueChange={n=>edit({contrast:n/100})}/></label>
    <label>Épaisseur (×)<NumericInput aria-label="Épaisseur des ponctuations" min={1} max={2} step={.05} value={settings.weight} onValueChange={n=>edit({weight:n})}/></label>
    <label>Espace de sécurité (px)<NumericInput aria-label="Espace de sécurité des ponctuations (px)" min={0} max={8} step={.25} value={settings.gap} onValueChange={n=>edit({gap:n})}/></label>
   </div>
   <small>Ces réglages personnalisent les séparateurs. Une ligne trop dense est signalée ; les notes conservent leur taille.</small>
  </details>
 </section>;
}
