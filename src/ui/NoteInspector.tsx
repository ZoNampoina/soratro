import {Copy,Trash2,Music2} from 'lucide-react';
import {noteDuration,noteName,noteStart,type Project} from '../music/model';
import {convertSolfa,midiToSolfa} from '../solfa/converter';
import {selectedNotes,transposeSelected,moveSelected,durationSelected,alignSelected,solfaToMidi,type Alignment} from '../music/selection-editing';
import {gridStep} from '../quantization/quantizer';
import {copyNotes,pasteNotes,type Selection} from '../music/note-editing';
import {measureForBeat} from '../music/timeline';
import {useState} from 'react';
interface Props {project:Project;selected:Selection|null;recording:boolean;update:(fn:(p:Project)=>void)=>boolean;select:(s:Selection|null)=>void;remove:()=>void;lyricsOpen:boolean;lyrics:()=>void;hidden:boolean}
export function NoteInspector({project:p,selected,recording,update,select,remove,lyricsOpen,lyrics,hidden}:Props){
  const [alignment,setAlignment]=useState<Alignment>('starts');
  const notes=selectedNotes(p,selected),note=notes.find(n=>n.id===selected?.id)??notes[0];
  const lockedTracks=p.tracks.filter(t=>t.locked&&notes.some(n=>n.trackId===t.id)),disabled=recording||lockedTracks.length>0;
  const solfa=note?convertSolfa(note.midiPitch,p.tonic):null;
  function changeSolfa(degree:number,alteration:number,octave:number){if(!note)return;update(current=>transposeSelected(current,selected,solfaToMidi(degree,alteration,octave,current.tonic)-note.midiPitch));}
  const step=gridStep(p.settings.quantization,notes,b=>measureForBeat(p,b).start)||.125;
  return <div hidden={hidden} className="note-inspector" aria-label="Inspecteur des notes">{note&&solfa?<>
    <span className="inspector-title" style={{color:p.tracks.find(t=>t.id===note.trackId)?.color}}>{midiToSolfa(note.midiPitch,p.tonic)}<small>{noteName(note.midiPitch)} · {notes.length} note{notes.length>1?'s':''}</small></span>
    {lockedTracks.length>0&&<span className="locked-note-message">Piste verrouillée : {lockedTracks.map(t=>t.name).join(', ')}. Déverrouillez-la pour éditer.</span>}
    <label>Hauteur<select aria-label="Hauteur de la note" value={note.midiPitch} disabled={disabled} onChange={e=>update(p=>transposeSelected(p,selected,+e.target.value-note.midiPitch))}>{Array.from({length:128},(_,m)=><option key={m} value={m}>{noteName(m)} · MIDI {m}</option>)}</select></label>
    <label>Solfa<select aria-label="Degré Solfa" value={solfa.degree} disabled={disabled} onChange={e=>changeSolfa(+e.target.value,solfa.alteration,solfa.octave)}>{['d','r','m','f','s','l','t'].map((s,i)=><option key={s} value={i+1}>{s}</option>)}</select></label>
    <label>Altération<select aria-label="Altération Solfa" value={solfa.alteration} disabled={disabled} onChange={e=>changeSolfa(solfa.degree,+e.target.value,solfa.octave)}><option value={-1}>♭</option><option value={0}>♮</option><option value={1}>♯</option></select></label>
    <label>Octave<input aria-label="Octave Solfa" type="number" min={-6} max={5} step={1} disabled={disabled} value={solfa.octave} onChange={e=>{if(e.target.value!=='')changeSolfa(solfa.degree,solfa.alteration,+e.target.value);}}/></label>
    <label>Début<input aria-label="Début de la note" type="number" min={0} step={.125} value={+noteStart(note).toFixed(4)} disabled={disabled} onChange={e=>{if(e.target.value!==''&&+e.target.value>=0)update(p=>moveSelected(p,selected,+e.target.value-noteStart(note)));}}/></label>
    <label>Durée<input aria-label="Durée de la note" type="number" min={.03125} step={.125} value={+noteDuration(note).toFixed(4)} disabled={disabled} onChange={e=>{if(+e.target.value>=.03125)update(p=>durationSelected(p,selected,+e.target.value));}}/></label>
    <div className="inspector-actions">{[-12,-1,1,12].map(delta=><button key={delta} aria-label={'Transposer la sélection de '+delta+' demi-tons'} disabled={disabled} onClick={()=>update(p=>transposeSelected(p,selected,delta))}>{delta>0?'+':''}{delta}</button>)}<button aria-label="Copier la note" title="Dupliquer la sélection" disabled={disabled} onClick={()=>{const copy=copyNotes(p,selected);let next:Selection|null=null;if(copy&&update(p=>{next=pasteNotes(p,copy,copy.origin+copy.duration);}))select(next);}}><Copy size={16}/></button><button aria-label="Supprimer la note" className="danger-text" disabled={disabled} onClick={remove}><Trash2 size={16}/></button></div>
    <label>Alignement<select aria-label="Alignement intelligent" value={alignment} disabled={disabled} onChange={e=>setAlignment(e.target.value as Alignment)}><option value="starts">Aligner les débuts</option><option value="ends">Aligner les fins</option><option value="duration">Uniformiser les durées</option><option value="spread">Répartir régulièrement</option><option value="grid">Aligner sur la grille</option></select></label><button aria-label="Appliquer l’alignement" disabled={disabled||notes.length<2} onClick={()=>update(p=>alignSelected(p,selected,alignment,step))}>Aligner</button>
    <span className="raw-note">Brut : {note.startTime.toFixed(3)} s · {note.duration.toFixed(3)} s</span>
  </>:<><span className="empty-selection">Sélectionnez une note pour la corriger.</span><button aria-label="Ouvrir ou fermer les paroles" className="text-button" onClick={lyrics}><Music2 size={15}/>{lyricsOpen?'Fermer les paroles':'Paroles'}</button></>}</div>;
}
