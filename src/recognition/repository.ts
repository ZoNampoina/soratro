import {type ScanSession,type ScanAsset,type ScanProfile,type ScanSummary,MAX_SCAN_TOTAL,MAX_SCAN_PAGES} from './types.ts';
export class ScanConflict extends Error {constructor(){super('Cette session a été modifiée dans un autre onglet. Rechargez sa dernière version avant de continuer.');}}
/** Separate database; never opens, upgrades or deletes the music database. */
export class ScanRepository {
 private promise:Promise<IDBDatabase>|null=null;
 private name:string;
 constructor(name='soratro-scans'){this.name=name;}
 private db(){return this.promise??=new Promise((resolve,reject)=>{const r=indexedDB.open(this.name,1);r.onupgradeneeded=()=>{const db=r.result;db.createObjectStore('sessions',{keyPath:'id'});const a=db.createObjectStore('assets',{keyPath:'id'});a.createIndex('sessionId','sessionId');db.createObjectStore('profiles',{keyPath:'id'});db.createObjectStore('catalog',{keyPath:'id'});};r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Fermez les autres ateliers de numérisation pour ouvrir les sessions.'));r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};});}
 async all(){const db=await this.db();return new Promise<ScanSummary[]>((resolve,reject)=>{const t=db.transaction('catalog'),r=t.objectStore('catalog').getAll();t.oncomplete=()=>resolve((r.result as ScanSummary[]).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)));t.onerror=()=>reject(t.error);});}
 async get(key:string){const db=await this.db();return new Promise<ScanSession|undefined>((resolve,reject)=>{const t=db.transaction('sessions'),r=t.objectStore('sessions').get(key);t.oncomplete=()=>resolve(r.result);t.onerror=()=>reject(t.error);});}
 async save(session:ScanSession,expectedRevision:number,assets:ScanAsset[]=[]):Promise<ScanSession>{
  if(session.pages.length>MAX_SCAN_PAGES)throw new Error('24 pages maximum par session.');if(assets.reduce((n,a)=>n+a.bytes,0)>MAX_SCAN_TOTAL)throw new Error('Documents trop volumineux.');
  const db=await this.db(),copy=structuredClone(session);copy.revision=expectedRevision+1;copy.updatedAt=new Date().toISOString();
  return new Promise((resolve,reject)=>{let conflict=false;const tx=db.transaction(['sessions','assets','catalog'],'readwrite'),s=tx.objectStore('sessions'),a=tx.objectStore('assets'),r=s.get(copy.id);
   r.onsuccess=()=>{const previous=r.result as ScanSession|undefined;if(previous&&previous.revision!==expectedRevision||!previous&&expectedRevision!==0){conflict=true;tx.abort();return;}const map=new Map((previous?.resources??[]).map(x=>[x.id,x.bytes]));for(const asset of assets)map.set(asset.id,asset.bytes);if([...map.values()].reduce((n,b)=>n+b,0)>MAX_SCAN_TOTAL){tx.abort();return;}for(const asset of assets){if(asset.sessionId!==copy.id){tx.abort();return;}a.put(asset);}copy.resources=[...map].map(([id,bytes])=>({id,bytes}));s.put(copy);tx.objectStore('catalog').put({id:copy.id,title:copy.title,updatedAt:copy.updatedAt,pages:copy.pages.length,rows:copy.rows.length,bytes:[...map.values()].reduce((n,b)=>n+b,0),imported:!!copy.imported});};
   tx.oncomplete=()=>resolve(copy);tx.onabort=tx.onerror=()=>reject(conflict?new ScanConflict():tx.error??new Error('Sauvegarde impossible : stockage plein ou données trop volumineuses. Les projets musicaux sont conservés.'));
  });
 }
 async asset(key:string){const db=await this.db();return new Promise<ScanAsset|undefined>((resolve,reject)=>{const tx=db.transaction('assets'),r=tx.objectStore('assets').get(key);tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);});}
 async assets(sessionId:string){const db=await this.db();return new Promise<ScanAsset[]>((resolve,reject)=>{const tx=db.transaction('assets'),r=tx.objectStore('assets').index('sessionId').getAll(sessionId);tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);});}
 async delete(key:string){const db=await this.db();return new Promise<void>((resolve,reject)=>{const tx=db.transaction(['sessions','assets','catalog'],'readwrite');tx.objectStore('sessions').delete(key);tx.objectStore('catalog').delete(key);const a=tx.objectStore('assets'),r=a.index('sessionId').getAllKeys(key);r.onsuccess=()=>r.result.forEach(k=>a.delete(k));tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error);});}
 async profiles(){const db=await this.db();return new Promise<ScanProfile[]>((resolve,reject)=>{const t=db.transaction('profiles'),r=t.objectStore('profiles').getAll();t.oncomplete=()=>resolve(r.result);t.onerror=()=>reject(t.error);});}
 async saveProfile(profile:ScanProfile){if(profile.samples.length>256)throw new Error('256 exemples maximum par profil.');const db=await this.db();return new Promise<void>((resolve,reject)=>{const t=db.transaction('profiles','readwrite');t.objectStore('profiles').put(structuredClone(profile));t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);});}
 async deleteProfile(key:string){const db=await this.db();return new Promise<void>((resolve,reject)=>{const t=db.transaction('profiles','readwrite');t.objectStore('profiles').delete(key);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);});}
 async close(){if(this.promise)(await this.promise).close();this.promise=null;}
}
export const scanRepository=new ScanRepository();
