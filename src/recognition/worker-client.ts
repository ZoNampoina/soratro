import type {Pixels,PreparedPixels} from './image-processing';
import type {Preparation,GlyphTemplate,ScanHints,ScanRegion,ScanRow} from './types';
import type {PrintedResult} from './printed-engine';
export class ScanProcessor {
 private worker:Worker|null=null;private next=0;private jobs=new Map<number,{resolve:(value:any)=>void;reject:(error:Error)=>void}>();
 private start(){if(this.worker)return this.worker;const worker=new Worker(new URL('./scan.worker.ts',import.meta.url),{type:'module'});worker.onmessage=e=>{const job=this.jobs.get(e.data.id);if(!job)return;this.jobs.delete(e.data.id);e.data.error?job.reject(new Error(e.data.error)):job.resolve(e.data.value);};worker.onerror=()=>this.cancel('Le traitement a été interrompu. La session sauvegardée est conservée.');this.worker=worker;return worker;}
 private request<T>(payload:Record<string,unknown>):Promise<T>{return new Promise((resolve,reject)=>{const id=++this.next;this.jobs.set(id,{resolve,reject});try{this.start().postMessage({id,...payload});}catch(e){this.jobs.delete(id);reject(e);}});}
 prepare(input:Pixels,settings:Preparation){return this.request<PreparedPixels>({operation:'prepare',input,settings});}
 deskew(input:Pixels){return this.request<number>({operation:'deskew',input});}
 recognize(input:Pixels,settings:Preparation,templates:GlyphTemplate[],hints:ScanHints,pageId:string,revision:number,regions:ScanRegion[],previous:ScanRow[]){return this.request<PrintedResult>({operation:'recognize',input,settings,templates,hints,pageId,revision,regions,previous});}
 cancel(message='Traitement annulé.'){this.worker?.terminate();this.worker=null;for(const job of this.jobs.values())job.reject(new Error(message));this.jobs.clear();}
}
