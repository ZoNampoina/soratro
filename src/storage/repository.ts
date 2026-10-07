import { id, type Project } from '../music/model.ts';
import { migrateProject } from './migrations.ts';
export interface ProjectVersion {id:string;projectId:string;savedAt:string;reason:string;fingerprint:string;project:Project}
export function projectFingerprint(project:Project) {const {updatedAt,...content}=project;return JSON.stringify(content);}
/** Five-minute checkpoints for 24 h, hourly for a week, daily for a month; 48 maximum. */
export function retainedVersions(versions:ProjectVersion[],now:number):ProjectVersion[] {
  const sorted=versions.slice().sort((a,b)=>b.savedAt.localeCompare(a.savedAt));const buckets=new Set<string>();
  return sorted.filter((v,index)=>{const timestamp=Date.parse(v.savedAt),age=now-timestamp;if(age>30*86400000&&index!==0)return false;const bucket=age<86400000?'recent:'+Math.floor(timestamp/300000):age<7*86400000?'hour:'+Math.floor(timestamp/3600000):'day:'+Math.floor(timestamp/86400000);if(buckets.has(bucket)&&index!==0&&v.reason==='Automatique')return false;buckets.add(bucket);return true;}).slice(0,48);
}
export class ProjectRepository {
  private dbPromise:Promise<IDBDatabase>;
  constructor(name='soratro'){
    this.dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(name,2);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('projects'))db.createObjectStore('projects',{keyPath:'id'});if(!db.objectStoreNames.contains('preferences'))db.createObjectStore('preferences');if(!db.objectStoreNames.contains('versions')){const versions=db.createObjectStore('versions',{keyPath:'id'});versions.createIndex('projectId','projectId');}};
      req.onsuccess=()=>{req.result.onversionchange=()=>req.result.close();resolve(req.result);};req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('Fermez les autres onglets SORATRO pour mettre le stockage à jour.'));
    });
  }
  private async request<T>(store:string,mode:IDBTransactionMode,operation:(s:IDBObjectStore)=>IDBRequest):Promise<T>{const db=await this.dbPromise;return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode);const req=operation(tx.objectStore(store));let result:T;req.onsuccess=()=>{result=req.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Sauvegarde interrompue'));});}
  async all(){const rows=await this.request<unknown[]>('projects','readonly',s=>s.getAll());return rows.map(migrateProject);}
  async get(key:string){const row=await this.request<unknown>('projects','readonly',s=>s.get(key));return row===undefined?undefined:migrateProject(row);}
  async save(project:Project,reason='Automatique',forceSnapshot=false,now=Date.now()):Promise<IDBValidKey>{
    const db=await this.dbPromise,p=structuredClone(project),fingerprint=projectFingerprint(p);
    return new Promise((resolve,reject)=>{const tx=db.transaction(['projects','versions'],'readwrite');const projects=tx.objectStore('projects'),versions=tx.objectStore('versions');const history=versions.index('projectId').getAll(p.id);
      history.onsuccess=()=>{const existing=(history.result as ProjectVersion[]).sort((a,b)=>b.savedAt.localeCompare(a.savedAt));const latest=existing[0],changed=!latest||latest.fingerprint!==fingerprint,due=!latest||now-Date.parse(latest.savedAt)>=300000;
        if(changed&&(due||forceSnapshot)){const version:ProjectVersion={id:id(),projectId:p.id,savedAt:new Date(Math.max(now,latest?Date.parse(latest.savedAt)+1:now)).toISOString(),reason,fingerprint,project:p};versions.put(version);existing.unshift(version);}
        const retained=new Set(retainedVersions(existing,now).map(v=>v.id));for(const v of existing)if(!retained.has(v.id))versions.delete(v.id);projects.put(p);
      };tx.oncomplete=()=>resolve(p.id);tx.onabort=tx.onerror=()=>reject(tx.error||new Error('Sauvegarde interrompue'));
    });
  }
  async versions(projectId:string){const rows=await this.request<ProjectVersion[]>('versions','readonly',s=>s.index('projectId').getAll(projectId));return rows.sort((a,b)=>b.savedAt.localeCompare(a.savedAt)).map(v=>({...v,project:migrateProject(v.project)}));}
  async checkpoint(project:Project,reason:string){return this.save(project,reason,true);}
  async delete(key:string){const db=await this.dbPromise;return new Promise<void>((resolve,reject)=>{const tx=db.transaction(['projects','versions'],'readwrite');tx.objectStore('projects').delete(key);const versions=tx.objectStore('versions'),req=versions.index('projectId').getAllKeys(key);req.onsuccess=()=>{for(const k of req.result)versions.delete(k);};tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error);});}
  preference<T>(key:string){return this.request<T|undefined>('preferences','readonly',s=>s.get(key));}
  setPreference<T>(key:string,value:T){return this.request<IDBValidKey>('preferences','readwrite',s=>s.put(value,key));}
  async close(){(await this.dbPromise).close();}
}
