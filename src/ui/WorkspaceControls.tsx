import {Maximize2,Minimize2,PanelLeft,Keyboard,SlidersHorizontal,PanelTop,ChevronDown} from 'lucide-react';
import {DEFAULT_WORKSPACE,LAYOUTS,layoutPreset,type MusicView,type WorkspacePreferences} from '../storage/ui-preferences';
interface Props {workspace:WorkspacePreferences;change:(patch:Partial<WorkspacePreferences>)=>void;view:MusicView;setView:(view:MusicView)=>void;immersion:boolean;setImmersion:(enabled:boolean)=>void;openPreferences:()=>void}
export function WorkspaceControls({workspace:w,change,setView,immersion,setImmersion,openPreferences}:Props){
  return <div className="workspace-controls" aria-label="Disposition de l’atelier">
    <button aria-label={immersion?'Quitter Immersion':'Mode Immersion'} aria-pressed={immersion} onClick={()=>setImmersion(!immersion)} title="Immersion · F10">{immersion?<Minimize2 size={16}/>:<Maximize2 size={16}/>}<span>{immersion?'Quitter':'Immersion'}</span></button>
    <button aria-label="État du panneau des pistes" title="Pistes : ouvertes, réduites, masquées" onClick={()=>change({tracks:w.tracks==='open'?'compact':w.tracks==='compact'?'hidden':'open'})}><PanelLeft size={16}/></button>
    <button aria-label={w.piano?'Masquer le clavier piano':'Afficher le clavier piano'} aria-pressed={w.piano} onClick={()=>change({piano:!w.piano})}><Keyboard size={16}/></button>
    <button aria-label={w.toolbar?'Rabattre le ruban':'Afficher le ruban'} aria-pressed={w.toolbar} onClick={()=>change({toolbar:!w.toolbar})}><ChevronDown size={16}/></button>
    <button aria-label={w.header?'Masquer la barre supérieure':'Afficher la barre supérieure'} aria-pressed={w.header} onClick={()=>change({header:!w.header})}><PanelTop size={16}/></button>
    <button aria-label="Préférences d’affichage" onClick={openPreferences}><SlidersHorizontal size={16}/></button>
    <select aria-label="Disposition prédéfinie" value="" onChange={e=>{const p=layoutPreset(e.target.value);if(p.immersion)setImmersion(true);else{setImmersion(false);change(p.workspace);setView(p.view);}}}>
      <option value="" disabled>Disposition</option>{LAYOUTS.map(name=><option key={name}>{name}</option>)}
      <option value="reset">Réinitialiser la disposition</option>
    </select>
    <button className="reset-layout" title="Réinitialiser la disposition" aria-label="Réinitialiser la disposition" onClick={()=>{setImmersion(false);change(structuredClone(DEFAULT_WORKSPACE));setView('roll');}}>↺</button>
  </div>;
}
