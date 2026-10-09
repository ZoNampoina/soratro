import {LockKeyhole,LockKeyholeOpen,Volume2} from 'lucide-react';
import type {Project,Track} from '../music/model';
import {VOICE_COLORS} from '../music/voices';
interface Props {track:Track;active:boolean;meter:number;recording:boolean;index:number;select:()=>void;update:(fn:(p:Project)=>void)=>void;mix:(fn:(p:Project)=>void)=>void}
export function TrackStrip({track:t,active,meter,recording,index,select,update,mix}:Props){
  const change=(fn:(t:Track)=>void)=>update(p=>fn(p.tracks.find(x=>x.id===t.id)!));
  return <div className={'track-strip '+(active?'selected-track':'')} style={{'--track-color':t.color} as React.CSSProperties}>
    <button className="track-select" onClick={select} disabled={recording}><span className="track-letter">{t.shortName}</span><span><strong>{t.name}</strong><small>{t.events.length} notes</small></span>{active&&<span className="armed-dot"/>}</button>
    <div className="track-options"><button aria-label={(t.locked?'Déverrouiller ':'Verrouiller ')+t.name} aria-pressed={!!t.locked} disabled={recording} onClick={()=>change(t=>{t.locked=!t.locked;})}>{t.locked?<LockKeyhole size={14}/>:<LockKeyholeOpen size={14}/>}</button><label title={'Couleur '+t.name}><input aria-label={'Couleur '+t.name} type="color" value={t.color} disabled={recording} onChange={e=>change(t=>{t.color=e.target.value;})}/></label><select aria-label={'Palette '+t.name} value={VOICE_COLORS.includes(t.color)?t.color:''} disabled={recording} onChange={e=>change(t=>{t.color=e.target.value;})}><option value="" disabled>Personnalisée</option>{VOICE_COLORS.map((c,i)=><option key={c} value={c}>{['Violet','Turquoise','Orange','Bleu','Rose','Vert'][i]}</option>)}</select><button title="Restaurer la couleur d’origine" aria-label={'Couleur d’origine '+t.name} disabled={recording} onClick={()=>change(t=>{t.color=VOICE_COLORS[index%VOICE_COLORS.length];})}>↺</button></div>
    <div className="track-mix"><button className={t.mute?'muted':''} aria-label={'Mute '+t.name} aria-pressed={t.mute} onClick={()=>mix(p=>{const tr=p.tracks.find(x=>x.id===t.id)!;tr.mute=!tr.mute;})}>M</button><button className={t.solo?'soloed':''} aria-label={'Solo '+t.name} aria-pressed={t.solo} onClick={()=>mix(p=>{const tr=p.tracks.find(x=>x.id===t.id)!;tr.solo=!tr.solo;})}>S</button><Volume2 size={13}/><input type="range" min={0} max={100} value={Math.round(t.volume*100)} aria-label={'Volume '+t.name} onChange={e=>mix(p=>{p.tracks.find(x=>x.id===t.id)!.volume=+e.target.value/100;})}/></div>
    <div className="track-meter" aria-hidden="true"><span style={{width:meter*100+'%'}}/></div>
  </div>;
}
