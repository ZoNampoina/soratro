import {id,type ChoirTemplate,type Signature,type Tonic} from '../music/model.ts';
export type Point={x:number;y:number};
export type Box={x:number;y:number;width:number;height:number};
export type Quad=[Point,Point,Point,Point];
export type ScanStage='document'|'prepare'|'recognize'|'correct'|'import';
export type Writing='printed'|'pen'|'pencil'|'damaged';
export interface Preparation {quad:Quad;rotation:0|90|180|270;deskew:number;brightness:number;contrast:number;sharpness:number;noise:number;grayscale:boolean;adaptive:boolean;flatten:boolean;invert:boolean}
export const DEFAULT_PREPARATION:Preparation={quad:[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}],rotation:0,deskew:0,brightness:0,contrast:1,sharpness:0,noise:0,grayscale:true,adaptive:false,flatten:false,invert:false};
export const PREPARATION_PRESETS:Record<string,Partial<Preparation>>={
 'Imprimé propre':{brightness:0,contrast:1.15,sharpness:.2,noise:0,adaptive:false,flatten:false,invert:false},
 'Photocopie ancienne':{brightness:3,contrast:1.3,sharpness:.3,noise:.2,adaptive:true,flatten:true,invert:false},
 'Manuscrit au stylo':{brightness:0,contrast:1.2,sharpness:.1,noise:.1,adaptive:true,flatten:true,invert:false},
 'Manuscrit au crayon':{brightness:-8,contrast:1.5,sharpness:.3,noise:0,adaptive:false,flatten:true,invert:false},
 'Document dégradé':{brightness:0,contrast:1.35,sharpness:.15,noise:.3,adaptive:true,flatten:true,invert:false}
};
export interface ScanHints {title:string;composer:string;author:string;tonic:Tonic|'';signature:Signature|'';tempo:number;choir:ChoirTemplate;voiceCount:number;measuresPerLine:number;verses:number;writing:Writing;compoundPulse:boolean;pickupBeats:number;reviewed:boolean;voiceNames:string[];voiceOctaves:number[]}
export interface ScanRegion {id:string;box:Box;kind:'music'|'lyrics'|'ignore';system:number;voice:number;firstMeasure:number;verse:number}
export interface ScanPage {id:string;sourceId:string;rasterId:string;name:string;width:number;height:number;originalWidth:number;originalHeight:number;sourcePage:number;preparation:Preparation;revision:number;regions:ScanRegion[]}
export interface GlyphAlternative {label:string;distance:number}
export interface ScanGlyph {id:string;box:Box;sourceQuad:Quad;label:string;alternatives:GlyphAlternative[];distance?:number;state:'review'|'unknown'|'validated';origin:'classifier'|'manual'|'profile';anchor?:boolean;mask?:number[]}
export interface ScanRow {id:string;pageId:string;revision:number;regionId?:string;box:Box;system:number;voice:number;firstMeasure:number;kind:'music'|'lyrics';verse:number;glyphs:ScanGlyph[];text:string;confirmed:boolean;included:boolean;manual:boolean;lyricNotes?:string[][]}
export interface ScanCorrection {at:string;rowId:string;glyphId?:string;before:string;after:string}
export interface ScanSession {schema:1;id:string;title:string;createdAt:string;updatedAt:string;revision:number;stage:ScanStage;pages:ScanPage[];rows:ScanRow[];hints:ScanHints;profileId?:string;resources?:{id:string;bytes:number}[];corrections:ScanCorrection[];imported?:{projectId:string;at:string;method:string};selection?:{pageId:string;rowId?:string;glyphId?:string};view:{mode:'original'|'result'|'compare';zoom:number;prepared:boolean}}
export interface ScanSummary {id:string;title:string;updatedAt:string;pages:number;rows:number;bytes:number;imported:boolean}
export interface ScanAsset {id:string;sessionId:string;name:string;blob:Blob;kind:'source'|'raster';bytes:number}
export interface GlyphSample {label:string;mask:number[];aspect:number;createdAt:string}
export interface ScanProfile {id:string;name:string;writing:Writing;samples:GlyphSample[];updatedAt:string}
export interface GlyphTemplate {label:string;mask:number[];aspect:number;origin:'classifier'|'profile'}
export interface ScanIssue {rowId?:string;measure?:number;message:string;severity:'error'|'warning'}
export const MAX_SCAN_FILE=24*1024*1024,MAX_SCAN_TOTAL=96*1024*1024,MAX_SCAN_PAGES=24,MAX_WORK_PIXELS=2400000,MAX_SCAN_ROWS=3000;
export function newScanSession():ScanSession {const at=new Date().toISOString();return {schema:1,id:id(),title:'Nouvelle numérisation',createdAt:at,updatedAt:at,revision:0,stage:'document',pages:[],rows:[],hints:{title:'',composer:'',author:'',tonic:'',signature:'',tempo:72,choir:'SATB',voiceCount:0,measuresPerLine:0,verses:0,writing:'printed',compoundPulse:true,pickupBeats:0,reviewed:false,voiceNames:[],voiceOctaves:[]},corrections:[],view:{mode:'compare',zoom:1,prepared:true}};}
export const boxContains=(b:Box,p:Point)=>p.x>=b.x&&p.x<=b.x+b.width&&p.y>=b.y&&p.y<=b.y+b.height;
export const boxOverlap=(a:Box,b:Box)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
