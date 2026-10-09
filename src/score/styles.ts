import {id,type Project,type PageSettings} from '../music/model.ts';
import {validateProject} from '../storage/migrations.ts';
export interface ScoreStyle {id:string;name:string;layout:PageSettings}
export function createScoreStyle(name:string,layout:PageSettings):ScoreStyle{return {id:id(),name:name.trim()||'Style de partition',layout:structuredClone(layout)};}
export function applyScoreStyle(p:Project,style:ScoreStyle){const copy=structuredClone(p);copy.layout=structuredClone(style.layout);validateProject(copy);p.layout=copy.layout;}
export function automaticLayout(layout:PageSettings):PageSettings{return {...layout,systemBreaks:[],pageBreaks:[],systemCounts:{},measureWidths:{},systemGaps:{}};}
