import { createProject, id, type Project } from '../music/model.ts';
import { ProjectRepository } from './repository.ts';
import { migrateProject,validateProject } from './migrations.ts';
import { cleanLyrics } from '../music/editing.ts';
import { invalidateTimeline } from '../music/timeline.ts';
import { assertLockedTracksUnchanged } from '../music/locks.ts';
export type SaveStatus='saved'|'saving'|'error';
export interface Snapshot {project:Project|null;projects:Project[];loading:boolean;saveStatus:SaveStatus;error:string;undoCount:number;redoCount:number}
export class ProjectStore {
  readonly repository=new ProjectRepository();
  private state:Snapshot={project:null,projects:[],loading:true,saveStatus:'saved',error:'',undoCount:0,redoCount:0};
  private listeners=new Set<()=>void>();private undoStack:Project[]=[];private redoStack:Project[]=[];private revision=0;private pending:Promise<unknown>=Promise.resolve();private take:Project|null=null;
  subscribe=(fn:()=>void)=>{this.listeners.add(fn);return ()=>this.listeners.delete(fn);};
  getSnapshot=()=>this.state;
  private emit(part:Partial<Snapshot>){this.state={...this.state,...part};this.listeners.forEach(fn=>fn());}
  async init(){try{const projects=(await this.repository.all()).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));this.emit({projects,loading:false});const key=location.hash.startsWith('#project=')?decodeURIComponent(location.hash.slice(9)):'';if(key)await this.open(key);}catch(error){this.emit({loading:false,error:error instanceof Error&&error.message.includes('onglets')?error.message:'Le stockage local est indisponible. Autorisez les données du site pour sauvegarder.',saveStatus:'error'});}}
  async create(values:Parameters<typeof createProject>[0]){const p=createProject(values);await this.add(p);return p;}
  async add(p:Project){p=migrateProject(p);await this.repository.save(p);this.emit({projects:[p,...this.state.projects.filter(x=>x.id!==p.id)]});await this.open(p.id);}
  async importProject(p:Project){await this.flush();const incoming=migrateProject(p);if(await this.repository.get(incoming.id)){incoming.id=id();incoming.title+=' — import';}await this.add(incoming);return incoming;}
  async restoreVersion(versionId:string,duplicateFirst=true){const current=this.state.project;if(!current)return;await this.flush();const version=(await this.repository.versions(current.id)).find(v=>v.id===versionId);if(!version)throw new Error('Cette version n’est plus disponible.');if(duplicateFirst)await this.duplicate(current.id);await this.repository.checkpoint(current,'Avant restauration');this.update(p=>Object.assign(p,structuredClone(version.project),{id:current.id,createdAt:current.createdAt}));await this.flush();await this.repository.checkpoint(this.state.project!,'Restauration');}
  async open(key:string){await this.flush();const p=await this.repository.get(key);if(!p)return;this.undoStack=[];this.redoStack=[];history.replaceState(null,'','#project='+encodeURIComponent(key));this.emit({project:p,undoCount:0,redoCount:0,error:'',saveStatus:'saved'});}
  async close(){await this.flush();history.replaceState(null,'',location.pathname);this.emit({project:null});}
  async remove(key:string){await this.flush();await this.repository.delete(key);if(this.state.project?.id===key)this.emit({project:null});this.emit({projects:this.state.projects.filter(p=>p.id!==key)});}
  async duplicate(key:string){const p=await this.repository.get(key);if(!p)return;const date=new Date().toISOString();const copy={...structuredClone(p),id:id(),title:p.title+' — copie',createdAt:date,updatedAt:date};await this.repository.save(copy);this.emit({projects:[copy,...this.state.projects]});}
  async rename(key:string,title:string){const p=await this.repository.get(key);if(!p)return;p.title=title.trim()||p.title;p.updatedAt=new Date().toISOString();await this.repository.save(p);this.emit({projects:this.state.projects.map(x=>x.id===key?p:x)});}
  update(fn:(p:Project)=>void,historyEntry=true){if(!this.state.project)return;const before=this.state.project;const p=structuredClone(before);fn(p);assertLockedTracksUnchanged(before,p);invalidateTimeline(p);if(p.lyrics.some(l=>l.syllables.length)||p.links?.length||p.sharedLyrics?.length||p.indications.some(i=>i.trackId||i.trackIds))cleanLyrics(p);if(JSON.stringify(p)===JSON.stringify(before))return;validateProject(p);p.updatedAt=new Date().toISOString();if(historyEntry){this.undoStack.push(before);if(this.undoStack.length>100)this.undoStack.shift();this.redoStack=[];}this.emit({project:p,undoCount:this.undoStack.length,redoCount:this.redoStack.length});this.persist(p);}
  beginTake(){this.take=this.state.project?structuredClone(this.state.project):null;}
  endTake(){if(!this.take)return;if(this.state.project&&JSON.stringify(this.take.tracks)!==JSON.stringify(this.state.project.tracks)){this.undoStack.push(this.take);this.redoStack=[];this.emit({undoCount:this.undoStack.length,redoCount:0});}this.take=null;}
  undo(){const previous=this.undoStack.pop();if(!previous||!this.state.project)return;this.redoStack.push(this.state.project);previous.updatedAt=new Date().toISOString();this.emit({project:previous,undoCount:this.undoStack.length,redoCount:this.redoStack.length});this.persist(previous);}
  redo(){const next=this.redoStack.pop();if(!next||!this.state.project)return;this.undoStack.push(this.state.project);next.updatedAt=new Date().toISOString();this.emit({project:next,undoCount:this.undoStack.length,redoCount:this.redoStack.length});this.persist(next);}
  private persist(p:Project){const rev=++this.revision;this.emit({saveStatus:'saving'});this.pending=this.pending.catch(()=>{}).then(()=>this.repository.save(p)).then(()=>{if(rev===this.revision)this.emit({saveStatus:'saved',error:'',projects:[p,...this.state.projects.filter(x=>x.id!==p.id)]});},error=>{this.emit({saveStatus:'error',error:'La sauvegarde a échoué. Exportez un fichier .soratro et réessayez.'});throw error;});void this.pending.catch(()=>{});}
  async flush(){await this.pending;}
  async saveNow(){if(this.state.project)this.persist(this.state.project);await this.flush();}
}
export const store=new ProjectStore();
