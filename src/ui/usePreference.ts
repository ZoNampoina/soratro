import {useEffect,useMemo,useSyncExternalStore} from 'react';
import {store} from '../storage/store';

const records=new Map<string,PreferenceRecord<unknown>>();
class PreferenceRecord<T> {
  private state:{value:T;ready:boolean};
  private listeners=new Set<()=>void>();
  private loading:Promise<void>|null=null;
  private revision=0;
  private timer:ReturnType<typeof setTimeout>|undefined;
  private pending:Promise<unknown>=Promise.resolve();
  constructor(readonly key:string,defaults:T,private normalize:(value:unknown)=>T){this.state={value:structuredClone(defaults),ready:false};}
  subscribe=(fn:()=>void)=>{this.listeners.add(fn);return ()=>this.listeners.delete(fn);};
  snapshot=()=>this.state;
  private emit(value:T,ready=true){this.state={value,ready};this.listeners.forEach(fn=>fn());}
  init(){return this.loading??=store.repository.preference(this.key).then(value=>{
    // A gesture before the read completes wins over an older saved preference.
    this.emit(this.revision?this.state.value:value===undefined?this.state.value:this.normalize(value));
  }).catch(()=>{this.emit(this.state.value);this.error();});}
  set=(next:T|((previous:T)=>T))=>{
    const value=this.normalize(typeof next==='function'?(next as (previous:T)=>T)(this.state.value):next);
    if(JSON.stringify(value)===JSON.stringify(this.state.value))return;
    this.revision++;this.emit(value);clearTimeout(this.timer);
    this.timer=setTimeout(()=>void this.flush().catch(()=>this.error()),160);
  };
  async flush(){clearTimeout(this.timer);this.timer=undefined;const value=this.state.value;if(!this.revision)return;this.pending=this.pending.catch(()=>{}).then(()=>store.repository.setPreference(this.key,value));await this.pending;}
  private error(){window.dispatchEvent(new CustomEvent('soratro-preference-error',{detail:'Les préférences n’ont pas pu être sauvegardées. Les notes restent dans votre projet.'}));}
}
export function usePreference<T>(key:string,defaults:T,normalize:(value:unknown)=>T){
  const record=useMemo(()=>{
    let row=records.get(key);
    if(!row){row=new PreferenceRecord(key,defaults,normalize) as PreferenceRecord<unknown>;records.set(key,row);}
    return row as PreferenceRecord<T>;
  },[key]);
  const state=useSyncExternalStore(record.subscribe,record.snapshot);
  useEffect(()=>{void record.init();return ()=>{void record.flush().catch(()=>{});};},[record]);
  return [state.value,record.set,state.ready] as const;
}
export async function flushPreferences(){await Promise.all([...records.values()].map(record=>record.flush()));}
