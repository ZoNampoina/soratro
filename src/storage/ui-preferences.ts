import { DEFAULT_SOLFA,type SolfaDisplay } from '../score/display.ts';
import type {Selection} from '../music/note-editing.ts';
export type WorkMode = 'composition' | 'partition' | 'rehearsal';
export type MusicView = 'roll' | 'solfa' | 'split';
export interface NavigationPreferences {mode:WorkMode;view:MusicView;trackId:string;selected:Selection|null}
export function normalizeNavigation(input:unknown):NavigationPreferences {
  const p=(input??{}) as Partial<NavigationPreferences>;
  const selected=p.selected&&typeof p.selected.id==='string'&&typeof p.selected.trackId==='string'?{
    id:p.selected.id,trackId:p.selected.trackId,
    ids:[...new Set([p.selected.id,...(Array.isArray(p.selected.ids)?p.selected.ids.filter(id=>typeof id==='string').slice(0,200000):[])])],
  }:null;
  return {mode:['composition','partition','rehearsal'].includes(p.mode??'')?p.mode!:'composition',view:['roll','solfa','split'].includes(p.view??'')?p.view!:'roll',trackId:typeof p.trackId==='string'?p.trackId:'soprano',selected};
}
export interface WorkspacePreferences {
  schema: 1;
  header: boolean;
  tools: boolean;
  toolbar: boolean;
  tracks: 'open' | 'compact' | 'hidden';
  piano: boolean;
  inspector: boolean;
  trackWidth: number;
  pianoHeight: number;
  split: number;
  sync: boolean;
  follow: boolean;
  preview: boolean;
  previewVolume: number;
  previewDuration: number;
  solfa: SolfaDisplay;
}
export const DEFAULT_WORKSPACE:WorkspacePreferences = {
  schema: 1, header: true, tools: true, toolbar: true, tracks: 'open',
  piano: true, inspector: true, trackWidth: 206, pianoHeight: 145, split: .6,
  sync: true, follow: true, preview: true, previewVolume: .65, previewDuration: .25,
  solfa: DEFAULT_SOLFA,
};
export const clamp = (value:number,min:number,max:number) => Math.max(min,Math.min(max,value));
const finite = (value:unknown,fallback:number,min:number,max:number) => typeof value==='number'&&Number.isFinite(value)?clamp(value,min,max):fallback;
const bool = (value:unknown,fallback:boolean) => typeof value==='boolean'?value:fallback;
export function normalizeWorkspace(input:unknown):WorkspacePreferences {
  const p=(input&&typeof input==='object'?input:{}) as Partial<WorkspacePreferences>;
  const s=p.solfa&&typeof p.solfa==='object'?p.solfa:DEFAULT_SOLFA;
  return { ...DEFAULT_WORKSPACE,
    ...Object.fromEntries(['header','tools','toolbar','piano','inspector','sync','follow','preview'].map(k=>[k,bool(p[k as keyof WorkspacePreferences],DEFAULT_WORKSPACE[k as keyof WorkspacePreferences] as boolean)])),
    tracks:['open','compact','hidden'].includes(p.tracks??'')?p.tracks!:DEFAULT_WORKSPACE.tracks,
    trackWidth:finite(p.trackWidth,206,150,380),pianoHeight:finite(p.pianoHeight,145,65,240),split:finite(p.split,.6,.2,.8),
    previewVolume:finite(p.previewVolume,.65,.05,1),previewDuration:finite(p.previewDuration,.25,.05,1),
    solfa:{rests:bool(s.rests,false),measureNumbers:bool(s.measureNumbers,true),markers:bool(s.markers,true),holds:bool(s.holds,true),
      separators:['standard','bars','none'].includes(s.separators)?s.separators:'standard',
      noteScale:finite(s.noteScale,1,.7,1.5),spacing:finite(s.spacing,1,.75,1.6),
      density:['compact','standard','airy'].includes(s.density)?s.density:'standard'},
  };
}
export type RollFit='manual'|'selection'|'measure'|'four'|'all';
export type ScoreFit='manual'|'width'|'height'|'page'|'two';
export interface RollViewport {zoom:number;rowHeight:number;left:number;top:number;fit:RollFit}
export interface ScoreViewport {zoom:number;left:number;top:number;fit:ScoreFit;page:number; navigator:boolean}
export const DEFAULT_ROLL:RollViewport={zoom:64,rowHeight:20,left:0,top:1130,fit:'manual'};
export const DEFAULT_SCORE:ScoreViewport={zoom:1,left:0,top:0,fit:'width',page:0,navigator:false};
export function normalizeRoll(input:unknown):RollViewport {
  const p=(input??{}) as Partial<RollViewport>;
  return {zoom:finite(p.zoom,64,1,256),rowHeight:finite(p.rowHeight,20,8,32),left:finite(p.left,0,0,1e8),top:finite(p.top,1130,0,4096),fit:['manual','selection','measure','four','all'].includes(p.fit??'')?p.fit!:'manual'};
}
export function normalizeScore(input:unknown):ScoreViewport {
  const p=(input??{}) as Partial<ScoreViewport>;
  return {zoom:finite(p.zoom,1,.1,3),left:finite(p.left,0,0,1e8),top:finite(p.top,0,0,1e8),fit:['manual','width','height','page','two'].includes(p.fit??'')?p.fit!:'width',page:Math.floor(finite(p.page,0,0,10000)),navigator:bool(p.navigator,false)};
}
export const LAYOUTS = ['Composition classique','Piano Roll dominant','Vue partagée','Partition dominante','Immersion'] as const;
export function layoutPreset(name:string):{workspace:WorkspacePreferences;view:MusicView;immersion:boolean} {
  const workspace=structuredClone(DEFAULT_WORKSPACE);
  if(name==='Piano Roll dominant'){workspace.tools=false;workspace.inspector=false;workspace.pianoHeight=95;}
  if(name==='Partition dominante'){workspace.piano=false;workspace.tools=false;workspace.split=.25;}
  return {workspace,view:name==='Composition classique'||name==='Piano Roll dominant'||name==='reset'?'roll':'split',immersion:name==='Immersion'};
}
