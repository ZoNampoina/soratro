/** Bounded metadata history. Image blobs are stored once, outside undo snapshots. */
export class ScanHistory<T> {
 private past:T[]=[];private future:T[]=[];
 private limit:number;
 constructor(limit=35){this.limit=limit;}
 commit(previous:T){this.past.push(structuredClone(previous));if(this.past.length>this.limit)this.past.shift();this.future=[];while(this.past.length>1&&this.past.reduce((n,v)=>n+JSON.stringify(v).length,0)>8*1024*1024)this.past.shift();}
 undo(current:T){const value=this.past.pop();if(value===undefined)return;this.future.push(structuredClone(current));return value;}
 redo(current:T){const value=this.future.pop();if(value===undefined)return;this.past.push(structuredClone(current));return value;}
 get canUndo(){return this.past.length>0;}get canRedo(){return this.future.length>0;}
 reset(){this.past=[];this.future=[];}
}
