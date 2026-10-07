import type { Project } from '../music/model.ts';
export class ProjectRepository {
  private dbPromise:Promise<IDBDatabase>;
  constructor(){this.dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open('soratro',1);req.onupgradeneeded=()=>{const db=req.result;db.createObjectStore('projects',{keyPath:'id'});db.createObjectStore('preferences');};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  private async request<T>(store:string,mode:IDBTransactionMode,operation:(s:IDBObjectStore)=>IDBRequest):Promise<T>{const db=await this.dbPromise;return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode);const req=operation(tx.objectStore(store));let result:T;req.onsuccess=()=>{result=req.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Sauvegarde interrompue'));});}
  all(){return this.request<Project[]>('projects','readonly',s=>s.getAll());}
  get(id:string){return this.request<Project|undefined>('projects','readonly',s=>s.get(id));}
  save(project:Project){return this.request<IDBValidKey>('projects','readwrite',s=>s.put(project));}
  delete(id:string){return this.request<void>('projects','readwrite',s=>s.delete(id));}
  preference<T>(key:string){return this.request<T|undefined>('preferences','readonly',s=>s.get(key));}
  setPreference<T>(key:string,value:T){return this.request<IDBValidKey>('preferences','readwrite',s=>s.put(value,key));}
}
