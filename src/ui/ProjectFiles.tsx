import { useEffect,useRef,useState } from 'react';
import { Download,History,Upload } from 'lucide-react';
import type { Project } from '../music/model';
import { decodeProject,encodeProject,MAX_PROJECT_BYTES,projectFilename } from '../storage/project-file';
import type { ProjectVersion } from '../storage/repository';
import { store } from '../storage/store';
import { saveFile } from '../platform/files';
import { isAndroid,AndroidFiles } from '../platform/native';
import { audio } from '../audio/engine';
import { Dialog } from './Dialog';
import { SolfaScore } from './SolfaScore';
export function ProjectFiles({project,locked,notice}:{project:Project|null;locked:boolean;notice:(text:string)=>void}) {
  const input=useRef<HTMLInputElement>(null);const [versions,setVersions]=useState<ProjectVersion[]|null>(null),[preview,setPreview]=useState<ProjectVersion|null>(null),[duplicate,setDuplicate]=useState(true),[busy,setBusy]=useState(false);const activeActions=useRef(0);
  async function action(fn:()=>Promise<unknown>){activeActions.current++;setBusy(true);try{await fn();}catch(e){notice(e instanceof Error?e.message:'Cette opération a échoué.');}finally{setBusy(--activeActions.current>0);}}
  async function importText(text:string){const imported=await decodeProject(text);audio.stop();await store.importProject(imported);notice('Projet importé : '+imported.title);}
  useEffect(()=>{if(!isAndroid())return;let disposed=false;const receive=()=>void action(async()=>{const pending=await AndroidFiles.consumePending();if(pending.text&&!disposed)await importText(pending.text);});const handle=AndroidFiles.addListener('incoming',receive);receive();return ()=>{disposed=true;void handle.then(h=>h.remove());};},[]);
  return <><div className="file-actions">
    <input ref={input} type="file" accept=".soratro,application/json" hidden onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void action(async()=>{if(file.size>MAX_PROJECT_BYTES)throw new Error('Fichier trop volumineux (32 Mo maximum).');const imported=await decodeProject(await file.text());await store.importProject(imported);notice('Projet importé : '+imported.title);});}}/>
    <button disabled={locked||busy} title="Importer un projet .soratro" onClick={()=>isAndroid()?void action(async()=>importText((await AndroidFiles.open()).text)):input.current?.click()}><Upload size={16}/><span>Importer</span></button>
    {project&&<><button disabled={busy} title="Exporter le projet complet .soratro" onClick={()=>void action(async()=>{await saveFile(projectFilename(project),new Blob([await encodeProject(project)],{type:'application/json'}));notice('Le fichier .soratro contient votre composition complète.');})}><Download size={16}/><span>.soratro</span></button>
    <button disabled={locked||busy} title="Historique du projet" onClick={()=>void action(async()=>{await store.saveNow();const rows=await store.repository.versions(project.id);setVersions(rows);setPreview(null);})}><History size={16}/><span>Historique</span></button></>}
  </div>{versions&&<Dialog title="Historique du projet" wide onClose={()=>{if(!busy)setVersions(null);}}><div className="version-history"><aside><p>La version actuelle est sauvegardée en continu. Les points de restauration espacés sont conservés pendant 30 jours.</p><button className={!preview?'selected-version':''} onClick={()=>setPreview(null)}><strong>Version actuelle</strong><small>{project?.title}</small></button>{versions.map(v=><button key={v.id} className={preview?.id===v.id?'selected-version':''} onClick={()=>setPreview(v)}><strong>{new Date(v.savedAt).toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'})}</strong><small>{v.reason} · {v.project.tracks.reduce((n,t)=>n+t.events.length,0)} notes</small></button>)}</aside><section>{project&&<SolfaScore project={preview?.project??project} beat={0} running={false}/>}</section></div><label className="checkbox-label"><input type="checkbox" checked={duplicate} onChange={e=>setDuplicate(e.target.checked)}/>Dupliquer la version actuelle avant restauration</label><div className="dialog-actions"><button onClick={()=>setVersions(null)} disabled={busy}>Fermer</button><button className="primary-button" disabled={!preview||busy} onClick={()=>void action(async()=>{await store.restoreVersion(preview!.id,duplicate);setVersions(null);notice('Version restaurée. Annuler reste disponible.');})}>Restaurer cette version</button></div></Dialog>}</>;
}
