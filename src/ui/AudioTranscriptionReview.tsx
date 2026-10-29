import {useMemo,useState} from 'react';
import {Dialog} from './Dialog';
import {NumericInput} from './NumericInput';
import {audio} from '../audio/engine';
import {noteName,TONICS,type Project,type Tonic,id} from '../music/model';
import {assertTracksUnlocked} from '../music/locks';
import {cleanLyrics} from '../music/editing';
import {removeRanges} from '../recording/replacement';
import {audioToBeat} from '../reference/mapping';
import {detectedNotes,type DetectedNote} from '../reference/transcription';
const TRANSPOSITIONS=[{key:'concert',label:'Hauteurs réelles / concert',offset:0},{key:'alto',label:'Saxophone alto en Mib (+9)',offset:9},{key:'soprano',label:'Saxophone soprano en Sib (+2)',offset:2},{key:'tenor',label:'Saxophone ténor en Sib (+14)',offset:14},{key:'custom',label:'Instrument personnalisé',offset:0}];
export default function AudioTranscriptionReview({project,proposals,trackId,update,notice,onClose}:{project:Project;proposals:DetectedNote[];trackId:string;update:(fn:(p:Project)=>void)=>boolean;notice:(s:string)=>void;onClose:()=>void}){
 const [notes,setNotes]=useState(proposals),[selected,setSelected]=useState<string[]>([]),[destination,setDestination]=useState(trackId),[instrument,setInstrument]=useState('concert'),[custom,setCustom]=useState(0),[quantize,setQuantize]=useState(false),[mode,setMode]=useState<'overdub'|'replace'>('overdub'),[tonic,setTonic]=useState<Tonic>(project.tonic),[applyTonic,setApplyTonic]=useState(false),[page,setPage]=useState(0),[error,setError]=useState('');
 const transpose=instrument==='custom'?custom:TRANSPOSITIONS.find(t=>t.key===instrument)!.offset,r=project.referenceAudio!,items=notes.slice(page*100,(page+1)*100);
 const output=useMemo(()=>detectedNotes(project,notes,destination,transpose,quantize),[project,notes,destination,transpose,quantize]);
 function patch(key:string,values:Partial<DetectedNote>){setNotes(rows=>rows.map(n=>n.id===key?{...n,...values}:n));}
 function action(fn:()=>void|Promise<unknown>){setError('');Promise.resolve().then(fn).catch(e=>setError((e as Error).message));}
 function insert(){if(!output.length){setError('Aucune note musicale à insérer.');return;}if(output.length!==notes.length){setError('Certaines notes sont hors de la plage MIDI ou avant le début de la partition. Corrigez-les avant insertion.');return;}if(transpose!==0&&tonic!==project.tonic&&!applyTonic){setError('Validez la tonalité écrite proposée, ou choisissez explicitement la tonalité actuelle du projet.');return;}
  const start=Math.max(0,audioToBeat(r,r.region.start)),end=Math.max(start,audioToBeat(r,r.region.end));
  const okay=update(p=>{assertTracksUnlocked(p,[destination]);const t=p.tracks.find(t=>t.id===destination)!;if(mode==='replace')t.events=removeRanges(t.events,[{start,end}]);t.events.push(...structuredClone(output));if(applyTonic)p.tonic=tonic;cleanLyrics(p);});
  if(okay){audio.stop();notice(`${output.length} notes insérées dans ${project.tracks.find(t=>t.id===destination)?.name}. Ctrl+Z pour annuler.`);onClose();}
 }
 return <Dialog title="Vérifier la transcription audio" wide onClose={()=>{audio.stop();onClose();}} className="audio-review">
  <p>{notes.length} notes proposées · {notes.filter(n=>n.uncertain).length} à vérifier. Les modifications restent dans cet aperçu jusqu’à validation.</p>
  <div className="audio-review-tools"><label>Voix de destination<select aria-label="Voix de destination audio" value={destination} onChange={e=>setDestination(e.target.value)}>{project.tracks.map(t=><option key={t.id} value={t.id} disabled={t.locked}>{t.name}{t.locked?' · verrouillée':''}</option>)}</select></label>
   <label>Instrument écrit<select aria-label="Instrument de transcription" value={instrument} onChange={e=>{const key=e.target.value;setInstrument(key);const offset=TRANSPOSITIONS.find(t=>t.key===key)!.offset;setTonic(TONICS[(TONICS.indexOf(project.tonic)+offset+120)%12]);setApplyTonic(false);}}>{TRANSPOSITIONS.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}</select></label>
   {instrument==='custom'&&<label>Transposition (demi-tons)<NumericInput min={-36} max={36} value={custom} onValueChange={setCustom}/></label>}
   <label>Tonalité écrite<select value={tonic} onChange={e=>setTonic(e.target.value as Tonic)}>{TONICS.map(t=><option key={t}>{t}</option>)}</select></label>
   <label className="checkbox-label"><input type="checkbox" checked={applyTonic} onChange={e=>setApplyTonic(e.target.checked)}/>Appliquer cette tonalité au projet entier</label>
   <label className="checkbox-label"><input type="checkbox" checked={quantize} onChange={e=>setQuantize(e.target.checked)}/>Quantifier avec la grille actuelle</label>
  </div>
  <p className="audio-hint">Concert Do = {project.tonic} · hauteur écrite = hauteur détectée {transpose>=0?'+':''}{transpose} demi-tons, octaves comprises. La partition utilise une tonalité commune à toutes les voix.</p>
  <div className="audio-review-actions"><button onClick={()=>action(()=>audio.auditionTake({...project,referenceAudio:{...r,solo:false,mute:false}},destination,output,Math.max(0,audioToBeat(r,r.region.start)),Math.max(.125,audioToBeat(r,r.region.end))))}>Écouter les notes avec l’audio</button><button onClick={()=>audio.stop()}>Arrêter l’aperçu</button>
   <button onClick={()=>{const at=notes.find(n=>selected.includes(n.id))?.start??r.region.start;if(at<r.region.end)setNotes(rows=>[...rows,{id:id(),pitch:69,start:at,end:Math.min(r.region.end,at+.3),confidence:1,meanMidi:69,spread:0,uncertain:false}]);}}>Ajouter une note</button>
   <button disabled={selected.length!==2} onClick={()=>{const pair=notes.filter(n=>selected.includes(n.id)).sort((a,b)=>a.start-b.start);if(pair.length!==2)return;patch(pair[0].id,{end:Math.max(...pair.map(n=>n.end)),uncertain:false});setNotes(rows=>rows.filter(n=>n.id!==pair[1].id));setSelected([]);}}>Fusionner les deux notes</button>
   <button disabled={!selected.length} onClick={()=>{setNotes(rows=>rows.filter(n=>!selected.includes(n.id)));setSelected([]);}}>Supprimer la sélection</button>
  </div>
  <div className="audio-review-table"><table><thead><tr><th>Choix</th><th>Détectée</th><th>Écrite</th><th>Début (s)</th><th>Fin (s)</th><th>Confiance</th><th>Correction</th></tr></thead><tbody>{items.map(n=><tr key={n.id} className={n.uncertain?'uncertain':''}><td><input type="checkbox" aria-label={'Sélectionner la note '+n.id} checked={selected.includes(n.id)} onChange={e=>setSelected(rows=>e.target.checked?[...rows,n.id]:rows.filter(id=>id!==n.id))}/></td><td><NumericInput aria-label={'Hauteur détectée '+n.id} min={0} max={127} value={n.pitch} onValueChange={pitch=>patch(n.id,{pitch,uncertain:false})}/><small>{noteName(n.pitch)}</small></td><td>{noteName(n.pitch+transpose)}</td>
   <td><NumericInput aria-label={'Début audio '+n.id} min={r.region.start} max={n.end-.001} step="any" value={+n.start.toFixed(3)} onValueChange={start=>patch(n.id,{start})}/></td><td><NumericInput aria-label={'Fin audio '+n.id} min={n.start+.001} max={r.region.end} step="any" value={+n.end.toFixed(3)} onValueChange={end=>patch(n.id,{end})}/></td><td>{Math.round(n.confidence*100)} %{n.uncertain?' · à vérifier':''}</td><td><button aria-label={'Octave inférieure '+n.id} onClick={()=>patch(n.id,{pitch:Math.max(0,n.pitch-12),uncertain:false})}>−8ve</button><button aria-label={'Octave supérieure '+n.id} onClick={()=>patch(n.id,{pitch:Math.min(127,n.pitch+12),uncertain:false})}>+8ve</button><button onClick={()=>{const half=(n.start+n.end)/2;patch(n.id,{end:half});setNotes(rows=>[...rows,{...n,id:id(),start:half}].sort((a,b)=>a.start-b.start));}}>Scinder</button><button onClick={()=>patch(n.id,{uncertain:false})}>Vérifiée</button></td></tr>)}</tbody></table></div>
  {notes.length>100&&<div className="audio-review-actions"><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>Précédent</button><span>Page {page+1} / {Math.ceil(notes.length/100)}</span><button disabled={(page+1)*100>=notes.length} onClick={()=>setPage(p=>p+1)}>Suivant</button></div>}
  {!notes.length&&<p>Aucune note stable détectée. Essayez un passage isolé, une sensibilité plus élevée ou une plage de hauteurs adaptée.</p>}
  {error&&<p role="alert">{error}</p>}
  <div className="dialog-actions"><label>Insertion<select aria-label="Mode d’insertion audio" value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="overdub">Ajouter aux notes existantes</option><option value="replace">Remplacer dans la région et la voix choisies</option></select></label><button onClick={onClose}>Annuler</button><button className="primary-button" disabled={!notes.length||project.tracks.find(t=>t.id===destination)?.locked} onClick={insert}>Valider et insérer les notes</button></div>
 </Dialog>;
}
