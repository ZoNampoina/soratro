import {id} from '../music/model.ts';
export const MAX_AUDIO_BYTES=80*1024*1024;
export interface LocalAudio {id:string;projectId:string;blob:Blob;duration:number;mime:string;bytes:number;createdAt:string}
/** Separate blob database: app-cache updates and score schema migrations never erase audio. */
export class AudioRepository {
 private promise:Promise<IDBDatabase>|null=null;
 private db(){return this.promise??=new Promise((resolve,reject)=>{const r=indexedDB.open('soratro-audio',1);r.onupgradeneeded=()=>r.result.createObjectStore('audio',{keyPath:'id'});r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Fermez les autres onglets pour ouvrir les audios.'));});}
 private async request<T>(mode:IDBTransactionMode,fn:(s:IDBObjectStore)=>IDBRequest):Promise<T>{const db=await this.db();return new Promise((resolve,reject)=>{const t=db.transaction('audio',mode),r=fn(t.objectStore('audio'));let result:T;r.onsuccess=()=>result=r.result;t.oncomplete=()=>resolve(result);t.onabort=t.onerror=()=>reject(t.error||new Error('Sauvegarde audio interrompue.'));});}
 async put(projectId:string,blob:Blob,duration:number,key=id()){if(blob.size>MAX_AUDIO_BYTES)throw new Error('Audio trop volumineux (80 Mo maximum).');if(blob.size===0)throw new Error('Aucun audio à conserver.');const row:LocalAudio={id:key,projectId,blob,duration,mime:blob.type,bytes:blob.size,createdAt:new Date().toISOString()};await this.request('readwrite',s=>s.put(row));return row;}
 get(key:string){return this.request<LocalAudio|undefined>('readonly',s=>s.get(key));}
 all(){return this.request<LocalAudio[]>('readonly',s=>s.getAll());}
 async delete(key:string){await this.request('readwrite',s=>s.delete(key));}
 async capacity(){const estimate=await navigator.storage?.estimate?.();const local=(await this.all()).reduce((s,a)=>s+a.bytes,0);return {local,usage:estimate?.usage??null,quota:estimate?.quota??null};}
 async close(){if(this.promise)(await this.promise).close();this.promise=null;}
}
export const audioRepository=new AudioRepository();
