export interface RenderPiece {start:number;end:number;duration:number}
/** Each job owns its worker and can be cancelled without blocking transport/UI. */
export function referenceJob<T>(message:object,transfer:Transferable[]=[],signal?:AbortSignal,onProgress?:(value:number)=>void):Promise<T>{
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./reference.worker.ts',import.meta.url),{type:'module'});
  const cleanup=()=>{worker.terminate();signal?.removeEventListener('abort',abort);};
  const abort=()=>{cleanup();reject(new DOMException('Analyse annulée.','AbortError'));};
  if(signal?.aborted){abort();return;}signal?.addEventListener('abort',abort,{once:true});
  worker.onmessage=e=>{if('progress' in e.data){onProgress?.(e.data.progress);return;}cleanup();if(e.data.error)reject(new Error(e.data.error));else resolve(e.data.result);};
  worker.onerror=e=>{cleanup();reject(new Error(e.message||'Le traitement audio a échoué.'));};
  worker.postMessage(message,transfer);
 });
}
