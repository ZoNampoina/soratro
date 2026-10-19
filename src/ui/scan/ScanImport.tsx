import {useMemo,useState} from 'react';
import type {Project} from '../../music/model';
import type {ScanSession} from '../../recognition/types';
import {convertScan,mergeScan,type ScanImportOptions} from '../../recognition/music';
import {NumericInput} from '../NumericInput';
export interface ImportPlan {project:Project;source:Project;options:ScanImportOptions|null;barCount:number;targetFingerprint?:string}
export function ScanImport({session,target,busy,changeHints,preview,onImport}:{session:ScanSession;target:Project|null;busy:boolean;changeHints:(reviewed:boolean)=>void;preview:(project:Project|null)=>void;onImport:(plan:ImportPlan)=>Promise<void>}){
 const [partial,setPartial]=useState(false),[destination,setDestination]=useState('new'),[after,setAfter]=useState(0),[mapping,setMapping]=useState<Record<string,string>>({}),[confirmed,setConfirmed]=useState(false);
 const conversion=useMemo(()=>convertScan(session,{partial}),[session,partial]);
 const fingerprint=target?JSON.stringify(target):'';
 const result=useMemo(()=>{try{const options=destination==='new'?null:{mode:destination as ScanImportOptions['mode'],afterMeasure:Math.trunc(after),voiceMap:mapping};const project=options&&target?structuredClone(target):conversion.project;if(options){if(!target)throw new Error('Ouvrez une partition pour y importer des mesures.');mergeScan(project,conversion.project,options,conversion.barCount);}return {plan:{project,source:conversion.project,options,barCount:conversion.barCount,targetFingerprint:options?fingerprint:undefined} as ImportPlan,error:''};}catch(e){return {plan:null,error:e instanceof Error?e.message:'Import impossible.'};}},[conversion,destination,after,mapping,fingerprint]);
 const key=JSON.stringify([session.hints,session.rows,session.pages.map(p=>[p.id,p.revision]),partial,destination,after,mapping,fingerprint]);
 const [confirmationKey,setConfirmationKey]=useState('');
 const valid=conversion.importable&&!result.error&&!!result.plan&&!session.imported;
 return <div className="scan-fields scan-import"><h3>Vérifier avant de créer la partition</h3>
  <p>{conversion.barCount} mesures · {conversion.project.tracks.length} voix · {conversion.project.tracks.reduce((n,t)=>n+t.events.length,0)} notes</p><p>{session.hints.tonic||'Tonalité à identifier'} · {session.hints.signature||'Signature à identifier'} · ♩ = {session.hints.tempo}</p>
  <label className="checkbox-label"><input aria-label="Confirmer les informations musicales" type="checkbox" checked={session.hints.reviewed} onChange={e=>{changeHints(e.target.checked);setConfirmed(false);}}/>J’ai vérifié la tonalité, la signature et le Do de base des voix</label>
  <label className="checkbox-label"><input aria-label="Importer un brouillon incomplet" type="checkbox" checked={partial} onChange={e=>{setPartial(e.target.checked);setConfirmed(false);preview(null);}}/>Autoriser un brouillon incomplet : omettre les zones non validées et les signaler</label>
  <p className="scan-help">Les zones omises restent dans cette session. Elles ne deviennent pas des notes ou des silences reconnus.</p>
  <div className="scan-issue-list" aria-live="polite">{conversion.issues.map((i,n)=><p key={n} className={i.severity==='error'?'scan-problem':'scan-help'}>{i.measure?'m. '+i.measure+' · ':''}{i.message}</p>)}</div>
  <label>Destination<select aria-label="Destination de la transcription" value={destination} disabled={busy||!!session.imported} onChange={e=>{setDestination(e.target.value);setConfirmed(false);preview(null);}}><option value="new">Nouvelle partition SORATRO</option>{target&&<><option value="measures">Insérer des mesures dans « {target.title} »</option><option value="voices">Ajouter de nouvelles voix dans « {target.title} »</option></>}</select></label>
  {destination!=='new'&&target&&<><label>{destination==='voices'?'Superposer après la mesure (0 = début)':'Insérer après la mesure (0 = début)'}<NumericInput aria-label="Position de l’import" type="number" min={0} max={10000} value={after} onValueChange={n=>{setAfter(n);setConfirmed(false);preview(null);}}/></label>
   {destination==='measures'&&conversion.project.tracks.map(t=><label key={t.id}>{t.name} →<select aria-label={'Destination de '+t.name} value={mapping[t.id]??'new'} onChange={e=>{setMapping(m=>({...m,[t.id]:e.target.value}));setConfirmed(false);preview(null);}}><option value="new">Nouvelle voix</option><option value="skip">Ne pas importer</option>{target.tracks.map(d=><option key={d.id} value={d.id} disabled={d.locked}>{d.name}{d.locked?' (verrouillée)':''}</option>)}</select></label>)}
   <p className="scan-help">L’insertion utilise l’historique Annuler / Rétablir du projet. Les hauteurs MIDI restent celles du document numérisé. {target.tonic!==conversion.project.tonic?'La tonalité de destination est différente : la notation sera relative à '+target.tonic+'.':''}</p>
  </>}
  {result.error&&<p className="scan-problem">{result.error}</p>}
  <button disabled={!valid||busy} onClick={()=>{preview(result.plan!.project);setConfirmationKey(key);setConfirmed(false);}}>Afficher l’aperçu final</button>
  {confirmationKey===key&&valid&&<><label className="checkbox-label"><input aria-label="Confirmer l’importation" type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>J’ai vérifié l’aperçu et je confirme {destination==='new'?'la création de cette partition':'cette modification du projet'}</label><button className="primary-button" disabled={!confirmed||busy} onClick={()=>void onImport(result.plan!)}>{destination==='new'?'Créer la partition numérique':'Importer dans la partition ouverte'}</button></>}
  {session.imported&&<p className="scan-success">Import effectué le {new Date(session.imported.at).toLocaleString('fr-FR')}. Vous pouvez fermer l’atelier pour éditer et écouter la partition.</p>}
 </div>;
}
