import {useEffect,useRef,useState} from 'react';
import {scanRepository,ScanConflict} from '../recognition/repository';
import {newScanSession,type ScanSession,type ScanAsset} from '../recognition/types';
import {ScanHistory} from '../recognition/history';
/** Metadata autosave is serialized and version-checked; blob writes are explicit transactions. */
export function useScanSession(){
 const [session,setSession]=useState<ScanSession|null>(null),[saveStatus,setSaveStatus]=useState<'saved'|'saving'|'error'>('saved'),[saveError,setSaveError]=useState(''),[historyVersion,setHistoryVersion]=useState(0);
 const queuedAssets=useRef<ScanAsset[]>([]);
 const current=useRef<ScanSession|null>(null),history=useRef(new ScanHistory<ScanSession>(25)),serial=useRef<Promise<unknown>>(Promise.resolve()),revision=useRef(0),edit=useRef(0),savedEdit=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),conflicted=useRef(false),mounted=useRef(true);
 const report=(status:typeof saveStatus,error='')=>{if(mounted.current){setSaveStatus(status);setSaveError(error);}};
 const flush=async(assets:ScanAsset[]=[])=>{
  if(assets.length)queuedAssets.current=[...new Map([...queuedAssets.current,...assets].map(a=>[a.id,a])).values()];
  clearTimeout(timer.current);const key=current.current?.id;if(!key)return;
  const task=serial.current.catch(()=>{}).then(async()=>{
   if(conflicted.current)throw new ScanConflict();const snapshot=current.current;if(!snapshot||snapshot.id!==key)return;const writingAssets=queuedAssets.current.slice();if(edit.current===savedEdit.current&&!writingAssets.length)return;
   const version=edit.current;report('saving');
   try{const result=await scanRepository.save({...snapshot,revision:revision.current},revision.current,writingAssets);queuedAssets.current=queuedAssets.current.filter(a=>!writingAssets.some(done=>done.id===a.id));revision.current=result.revision;savedEdit.current=version;
    if(current.current?.id===key){current.current={...current.current,revision:result.revision,updatedAt:result.updatedAt,resources:result.resources};if(mounted.current)setSession(current.current);}report(edit.current===savedEdit.current?'saved':'saving');
   }catch(e){if(e instanceof ScanConflict)conflicted.current=true;report('error',e instanceof Error?e.message:'La session n’a pas pu être sauvegardée.');throw e;}
  });serial.current=task;await task;
 };
 const schedule=()=>{clearTimeout(timer.current);report('saving');timer.current=setTimeout(()=>{void flush().catch(()=>{});},300);};
 const load=async(value:ScanSession,discard=false)=>{if(discard)await serial.current.catch(()=>{});else await flush();clearTimeout(timer.current);queuedAssets.current=[];current.current=value;revision.current=value.revision;edit.current=0;savedEdit.current=0;conflicted.current=false;history.current.reset();setSession(value);report('saved');setHistoryVersion(v=>v+1);};
 const ensure=()=>{if(current.current)return current.current;const value=newScanSession();current.current=value;revision.current=0;edit.current=0;savedEdit.current=0;setSession(value);return value;};
 const change=(mutate:(value:ScanSession)=>void,{undo=true,save=true}:{undo?:boolean;save?:boolean}={})=>{const before=ensure(),next=structuredClone(before);mutate(next);if(JSON.stringify(next)===JSON.stringify(before))return;if(undo)history.current.commit(before);next.updatedAt=new Date().toISOString();current.current=next;edit.current++;setSession(next);setHistoryVersion(v=>v+1);if(save)schedule();};
 const undo=()=>{if(!current.current)return;const value=history.current.undo(current.current);if(value){current.current={...value,revision:revision.current};edit.current++;setSession(current.current);setHistoryVersion(v=>v+1);schedule();}};
 const redo=()=>{if(!current.current)return;const value=history.current.redo(current.current);if(value){current.current={...value,revision:revision.current};edit.current++;setSession(current.current);setHistoryVersion(v=>v+1);schedule();}};
 const reset=async(discard=false)=>{if(discard)await serial.current.catch(()=>{});else await flush();clearTimeout(timer.current);queuedAssets.current=[];conflicted.current=false;current.current=null;revision.current=0;edit.current=0;savedEdit.current=0;history.current.reset();setSession(null);report('saved');setHistoryVersion(v=>v+1);};
 useEffect(()=>{mounted.current=true;const save=()=>{if(document.hidden)void flush().catch(()=>{});},leave=(e:BeforeUnloadEvent)=>{if(edit.current!==savedEdit.current){void flush().catch(()=>{});e.preventDefault();e.returnValue='';}};document.addEventListener('visibilitychange',save);window.addEventListener('beforeunload',leave);return ()=>{mounted.current=false;clearTimeout(timer.current);document.removeEventListener('visibilitychange',save);window.removeEventListener('beforeunload',leave);void flush().catch(()=>{});};},[]);
 return {session,current,saveStatus,saveError,historyVersion,canUndo:history.current.canUndo,canRedo:history.current.canRedo,change,ensure,flush,load,reset,undo,redo};
}
