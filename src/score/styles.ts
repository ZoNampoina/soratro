import {id,createProject,type Project,type PageSettings} from '../music/model.ts';
import {validateProject} from '../storage/migrations.ts';
export interface ScoreStyle {id:string;name:string;layout:PageSettings}
export function createScoreStyle(name:string,layout:PageSettings):ScoreStyle{return {id:id(),name:name.trim()||'Style de partition',layout:structuredClone(layout)};}
export function applyScoreStyle(p:Project,style:ScoreStyle){const copy=structuredClone(p);copy.layout=structuredClone(style.layout);validateProject(copy);p.layout=copy.layout;}
export function automaticLayout(layout:PageSettings):PageSettings{return {...layout,systemBreaks:[],pageBreaks:[],systemCounts:{},measureWidths:{},systemGaps:{},systemAlignments:{}};}
export function publicationProfiles():ScoreStyle[]{const base=createProject().layout;const profiles:ScoreStyle[]=[
 {id:'profile-clean',name:'Épuré',layout:{...base,numbering:{...base.numbering!,mode:'none'},voiceLabels:'first',noteSize:18,systemAlignment:'natural'}},
 {id:'profile-rehearsal',name:'Répétition chorale',layout:{...base,numbering:{...base.numbering!,mode:'measure',size:12,color:'#3c306c'},voiceLabels:'page',voiceGap:40,systemGap:32}},
 {id:'profile-collection',name:'Recueil',layout:{...base,margin:12,noteSize:15,lyricSize:10,voiceGap:26,systemGap:16,systemAlignment:'auto',numbering:{...base.numbering!,mode:'system'}}},
 {id:'profile-print',name:'Impression professionnelle',layout:{...base,margin:18,noteSize:18,lyricSize:12,headerGap:24,footerGap:20,systemAlignment:'full',numbering:{...base.numbering!,mode:'system'}}}
 ];return profiles.map(s=>structuredClone(s));}
