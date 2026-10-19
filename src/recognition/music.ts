import {createProject,makeNote,id,TONICS,signatureInfo,noteStart,noteDuration,type Project,type NoteEvent,type Tonic,type Track} from '../music/model.ts';
import {convertSolfa} from '../solfa/converter.ts';
import {choirTracks,VOICE_COLORS} from '../music/voices.ts';
import {measureAt,invalidateTimeline,measureCount} from '../music/timeline.ts';
import {copyMeasures,pasteBlock} from '../music/editing.ts';
import {splitLyrics,linkSyllable} from '../lyrics/lyrics.ts';
import {validateProject} from '../storage/migrations.ts';
import {type ScanSession,type ScanRow,type ScanIssue} from './types.ts';
export const SCAN_SYLLABLES=Array.from({length:12},(_,i)=>convertSolfa(60+i,'C').syllable);
const pitchOffset=(syllable:string)=>SCAN_SYLLABLES.indexOf(syllable);
export interface ParsedCell {kind:'note'|'rest'|'hold';syllables:{syllable:string;octave:number}[];start:number;duration:number;measure:number;index:number}
export function splitBars(text:string){const parts=text.trim().split('|').map(s=>s.trim());if(!parts[0])parts.shift();if(!parts.at(-1))parts.pop();return parts;}
/** An explicit grammar, never a duration quantizer: inconsistent punctuation is rejected. */
export function parseMusicRow(row:ScanRow,session:ScanSession):{cells:ParsedCell[];issues:ScanIssue[];bars:number}{
 const issues:ScanIssue[]=[],cells:ParsedCell[]=[];const signature=session.hints.signature;
 const bars=splitBars(row.text);if(!signature)return {cells,issues:[{rowId:row.id,message:'Renseignez la signature rythmique.',severity:'error'}],bars:bars.length};
 const info=signatureInfo(signature),pulse=session.hints.pulseBeats??(info.compound&&session.hints.compoundPulse?info.pulse*3:info.pulse);
 if(![.5,1,1.5,2].includes(pulse))return {cells,issues:[{rowId:row.id,message:'Valeur du temps imprimé invalide.',severity:'error'}],bars:bars.length};
 const problem=(message:string,measure:number)=>issues.push({rowId:row.id,measure,message,severity:'error'});
 if(!row.text.trim())problem('Ligne vide : saisissez les signes ou excluez cette zone.',row.firstMeasure);
 let time=0,index=0;
 bars.forEach((bar,barIndex)=>{
  const measure=row.firstMeasure+barIndex,length=measure===1&&session.hints.pickupBeats>0?session.hints.pickupBeats:info.barBeats;
  const tokens=bar.split(':').map(s=>s.trim()),wanted=Math.ceil(length/pulse);
  if(tokens.length!==wanted){problem(`Mesure ${measure} : ${tokens.length} temps lus, ${wanted} attendus (${signature}${info.compound&&session.hints.compoundPulse?', groupes de trois croches':''}).`,measure);time+=length;return;}
  tokens.forEach((part,pi)=>{
   const span=Math.min(pulse,length-pi*pulse);
   // Previously rejected combination: Curwen's dot+comma separates 3/4 and 1/4.
   const dotted=part.match(/^([^.,]+)\.\s*,([^.,]+)$/);
   const halves=dotted?[dotted[1],dotted[2]]:part.split('.');
   if(halves.length>2){problem(`Mesure ${measure} : plusieurs points dans un temps. Utilisez une seule séparation de demi-temps.`,measure);return;}
   halves.forEach((half,hi)=>{
    const thirds=half.split(','),allowed=halves.length===2?[1,2,3]:[1,3];
    if(!allowed.includes(thirds.length)){problem(`Mesure ${measure} : virgule ambiguë. Trois parties sont attendues ; une octave basse s’écrit _1.`,measure);return;}
    thirds.forEach((value,di)=>{
     const symbol=value.trim().replaceAll('’',"'").replaceAll('′',"'").replaceAll('–','-').replaceAll('−','-');
     const share=dotted?(hi===0?.75:.25):1/halves.length,start=time+pi*pulse+(dotted?(hi===0?0:.75):hi/halves.length)*span+di*span*share/thirds.length,duration=span*share/thirds.length;
     if(symbol==='0'||symbol==='-'){cells.push({kind:symbol==='0'?'rest':'hold',syllables:[],start,duration,measure,index:index++});return;}
     const values=symbol.split('/'),syllables:ParsedCell['syllables']=[];let valid=values.length<=8;
     for(const v of values){const match=v.match(/^(di|ri|fi|si|ta|[drmfslt])(?:(\'+)|\^([1-4])|_([1-4]))?$/);if(!match){valid=false;break;}const octave=match[2]?.length??(match[3]?+match[3]:match[4]?-Number(match[4]):0);syllables.push({syllable:match[1],octave});}
     if(!valid||!syllables.length){problem(`Mesure ${measure} : signe « ${symbol||'vide'} » indéterminé. Aucune note ne sera inventée.`,measure);return;}
     cells.push({kind:'note',syllables,start,duration,measure,index:index++});
    });
   });
  });time+=length;
 });return {cells,issues,bars:bars.length};
}
export interface ScanConversion {project:Project;issues:ScanIssue[];noteSources:Record<string,{rowId:string;glyphId?:string}>;importable:boolean;includedRows:number;omittedRows:number;barCount:number;includedMeasures:number;omittedMeasures:number;draft:boolean}
export function convertScan(session:ScanSession,{preview=false,partial=false,draft=false}:{preview?:boolean;partial?:boolean;draft?:boolean}={}):ScanConversion {
 partial=partial||draft;
 const hints=session.hints,issues:ScanIssue[]=[],project=createProject({title:hints.title||session.title,author:hints.author,composer:hints.composer,tonic:hints.tonic||'C',timeSignature:hints.signature||'4/4',tempo:hints.tempo}),noteSources:ScanConversion['noteSources']={};
 const pageOrder=new Map(session.pages.map((p,i)=>[p.id,i]));
 const rows=session.rows.filter(r=>r.kind==='music'&&r.included).slice().sort((a,b)=>a.firstMeasure-b.firstMeasure||a.voice-b.voice||a.system-b.system||(pageOrder.get(a.pageId)??0)-(pageOrder.get(b.pageId)??0));
 const count=Math.min(64,Math.max(1,hints.voiceCount||Math.max(0,...rows.map(r=>r.voice+1))));
 const template=choirTracks(hints.choir),namedTemplate=template.length===count&&hints.choir!=='Personnalisé';
 project.tracks=Array.from({length:Math.min(count,64)},(_,i)=>({id:'scan-voice-'+i,name:hints.voiceNames[i]||(namedTemplate?template[i].name:'Voix '+(i+1)),shortName:namedTemplate?template[i].shortName:'V'+(i+1),color:VOICE_COLORS[i%VOICE_COLORS.length],volume:.72,mute:false,solo:false,events:[]}));
 project.settings.choirTemplate=namedTemplate?hints.choir:count===1?'Solo':'Personnalisé';project.settings.rehearsalVoice=project.tracks[0].id;project.settings.pickupBeats=hints.pickupBeats;project.layout.compoundPulse=hints.compoundPulse;
 if(hints.measuresPerLine>0)project.layout.measuresPerSystem=hints.measuresPerLine;
 project.layout.orientation='landscape';
 if(!hints.tonic)issues.push({message:'La tonalité doit être choisie ou confirmée.',severity:'error'});
 if(!hints.signature)issues.push({message:'La signature rythmique doit être choisie ou confirmée.',severity:'error'});
 if(!hints.reviewed&&!preview)issues.push({message:'Vérifiez la tonalité, la signature et les registres des voix avant l’import.',severity:'error'});
 if(hints.pickupBeats<0||hints.pickupBeats>=signatureInfo(project.timeSignature).barBeats)issues.push({message:'La levée doit être plus courte qu’une mesure complète.',severity:'error'});
 const occupied=new Set<string>(),lastNotes=new Map<number,NoteEvent[]>(),includedRowIds=new Set<string>(),omittedRowIds=new Set<string>(),omittedKeys=new Set<string>(),marked=new Set<string>();let barCount=1;
 const mark=(row:ScanRow,text:string)=>{const measure=Math.max(1,Math.trunc(row.firstMeasure)||1),key=row.voice+':'+measure+':'+text;if(marked.has(key))return;marked.add(key);project.indications.push({id:id(),measure,kind:'text',trackId:project.tracks[row.voice]?.id,text});};
 const omittedMeasure=(row:ScanRow,message:string,bars=1)=>{omittedRowIds.add(row.id);for(let i=0;i<bars;i++)omittedKeys.add(row.voice+':'+(row.firstMeasure+i));issues.push({rowId:row.id,measure:row.firstMeasure,message,severity:partial?'warning':'error'});if(partial)mark(row,'À vérifier · V'+(row.voice+1)+' · passage non transcrit');};
 const units=rows.flatMap(row=>{
  const parsed=parseMusicRow(row,session),bars=splitBars(row.text);barCount=Math.max(barCount,row.firstMeasure+Math.max(1,parsed.bars)-1);
  if(!partial||!bars.length)return [{row,parsed}];
  const groups:ScanRow['glyphs'][]=[[]];for(const glyph of row.glyphs){if(glyph.label==='|')groups.push([]);else groups.at(-1)!.push(glyph);}if(!groups[0].length)groups.shift();if(!groups.at(-1)?.length)groups.pop();
  return bars.map((text,index)=>{const measure=row.firstMeasure+index,info=signatureInfo(project.timeSignature),shift=index*info.barBeats-(row.firstMeasure===1&&index>0&&hints.pickupBeats>0?info.barBeats-hints.pickupBeats:0);return {row:{...row,text,firstMeasure:measure,glyphs:groups.length===bars.length?groups[index]:[]},parsed:{bars:1,cells:parsed.cells.filter(c=>c.measure===measure).map(c=>({...c,start:c.start-shift})),issues:parsed.issues.filter(i=>i.measure===undefined||i.measure===measure)}};});
 });
 for(const {row,parsed} of units){
  const page=session.pages.find(p=>p.id===row.pageId);
  if(!Number.isInteger(row.voice)||row.voice<0||row.voice>=count||!Number.isInteger(row.firstMeasure)||row.firstMeasure<1){omittedMeasure(row,'Numéro de mesure ou voix invalide : zone à réassigner.',parsed.bars);continue;}
  if(page&&page.revision!==row.revision){omittedMeasure(row,'Image modifiée : réalignez ou relancez cette zone avant de l’importer.',parsed.bars);continue;}
  if(!preview&&!draft&&!row.confirmed){omittedMeasure(row,'Cette ligne n’a pas été validée.',parsed.bars);continue;}
  if(!partial&&row.glyphs.some(g=>g.label==='?')&&!row.manual){omittedMeasure(row,'Des signes indéterminés restent dans cette ligne.',parsed.bars);continue;}
  if(parsed.issues.length){issues.push(...parsed.issues.map(i=>({...i,severity:partial?'warning' as const:i.severity})));omittedMeasure(row,'Mesure rythmique incomplète ou ambiguë.',parsed.bars);continue;}
  const duplicates=Array.from({length:parsed.bars},(_,i)=>row.voice+':'+(row.firstMeasure+i));
  if(duplicates.some(key=>occupied.has(key))){omittedMeasure(row,'Deux zones occupent les mêmes mesures de la même voix. Réassignez ou excluez une zone.',parsed.bars);continue;}
  const offset=measureAt(project,row.firstMeasure).start,track=project.tracks[row.voice],added:NoteEvent[]=[],previous=lastNotes.get(row.voice)?.map(n=>structuredClone(n))??[];let held=previous;
  let bad=false,glyphIndex=0;const noteGlyphs=row.manual?[]:row.glyphs.filter(g=>/^(di|ri|fi|si|ta|[drmfslt])$/.test(g.label));
  for(const cell of parsed.cells){
   if(cell.kind==='rest'){held=[];continue;}
   if(cell.kind==='hold'){
    if(!held.length||held.some(n=>Math.abs(noteStart(n)+noteDuration(n)-(offset+cell.start))>1e-6)){issues.push({rowId:row.id,measure:cell.measure,message:'Prolongation sans note contiguë : vérifiez le début ou la voix.',severity:partial?'warning':'error'});bad=true;break;}
    held.forEach(n=>{n.originalDuration+=cell.duration;n.endTime=(n.originalStart+n.originalDuration)*60/project.tempo;n.duration=n.originalDuration*60/project.tempo;});continue;
   }
   held=[];
   for(const value of cell.syllables){const pitch=60+TONICS.indexOf(project.tonic)+pitchOffset(value.syllable)+(value.octave+(hints.voiceOctaves[row.voice]??0))*12;
    if(pitch<0||pitch>127){issues.push({rowId:row.id,measure:cell.measure,message:'Octave hors de la plage MIDI ; corrigez le registre.',severity:partial?'warning':'error'});bad=true;break;}
    const note=makeNote(track.id,pitch,offset+cell.start,cell.duration,project.tempo);note.id='scan-note-'+row.id+'-'+cell.index+'-'+held.length;added.push(note);held.push(note);
    const glyph=noteGlyphs[glyphIndex++];noteSources[note.id]={rowId:row.id,glyphId:glyph?.id};
   }if(bad)break;
  }
  if(bad){omittedMeasure(row,'Mesure non importée en raison de ses prolongations ou octaves.',parsed.bars);continue;}
  for(const previousNote of previous){const original=track.events.find(n=>n.id===previousNote.id);if(original)Object.assign(original,previousNote);}
  duplicates.forEach(key=>occupied.add(key));track.events.push(...added);lastNotes.set(row.voice,held);includedRowIds.add(row.id);if(draft&&!row.confirmed)mark(row,'Proposition à vérifier · V'+(row.voice+1));
 }
 // A lyric link is imported only after an explicit choice of its note IDs.
 for(const row of session.rows.filter(r=>r.kind==='lyrics'&&r.included&&r.confirmed)){
  const track=project.tracks[row.voice];if(!track)continue;const syllables=splitLyrics(row.text),ids=row.lyricNotes??[];
  if(syllables.length!==ids.length||ids.some(keys=>!keys?.length||keys.some(key=>!track.events.some(n=>n.id===key)))){issues.push({rowId:row.id,message:'Paroles conservées dans le brouillon : validez les liens syllabe–note.',severity:'warning'});continue;}
  const line={id:id(),trackId:track.id,text:row.text,verse:row.verse||1,kind:'verse' as const,syllables};project.lyrics.push(line);
  ids.forEach((keys,i)=>linkSyllable(project,line.id,i,keys));
 }
 project.settings.measureCount=barCount;project.settings.loopEnd=measureAt(project,barCount).end;
 if(draft){if(!/^Brouillon\b/i.test(project.title))project.title='Brouillon · '+project.title;if(!project.indications.length)mark(rows[0]??({id:'document',voice:0,firstMeasure:1} as ScanRow),'À vérifier · brouillon');}
 if(!project.tracks.some(t=>t.events.length)&&!(draft&&(rows.length||session.pages.length)))issues.push({message:'Aucune note musicale exploitable. Gardez le brouillon et corrigez les zones.',severity:'error'});
 try{validateProject(project);}catch(e){issues.push({message:e instanceof Error?e.message:'Conversion invalide.',severity:'error'});}
 return {project,issues,noteSources,importable:!issues.some(i=>i.severity==='error'),includedRows:includedRowIds.size,omittedRows:omittedRowIds.size,barCount,includedMeasures:occupied.size,omittedMeasures:omittedKeys.size,draft};
}
export interface ScanImportOptions {mode:'measures'|'voices';afterMeasure:number;voiceMap:Record<string,string>}
/** Pure preview and application share exactly this operation. Call on a store.update clone. */
export function mergeScan(target:Project,source:Project,options:ScanImportOptions,barCount:number){
 if(!Number.isInteger(options.afterMeasure)||options.afterMeasure<0||options.afterMeasure>10000)throw new Error('Position d’import invalide.');
 const tracks=new Map<string,string>();
 for(const voice of source.tracks){
  const requested=options.mode==='voices'?'new':options.voiceMap[voice.id]??'new';
  if(requested==='skip')continue;
  if(requested==='new'){if(target.tracks.length>=64)throw new Error('64 voix maximum.');const key=id();target.tracks.push({...structuredClone(voice),id:key,name:'Numérisé · '+voice.name,events:[]});tracks.set(voice.id,key);}
  else {const existing=target.tracks.find(t=>t.id===requested);if(!existing)throw new Error('Voix de destination absente.');if(existing.locked)throw new Error('Une voix de destination est verrouillée.');if([...tracks.values()].includes(requested))throw new Error('Choisissez une destination différente pour chaque voix.');tracks.set(voice.id,requested);}
 }
 if(!tracks.size)throw new Error('Choisissez au moins une voix à importer.');
 const remapped=structuredClone(source);remapped.tracks=source.tracks.filter(t=>tracks.has(t.id)).map(t=>({...structuredClone(t),id:tracks.get(t.id)!,events:t.events.map(n=>({...structuredClone(n),trackId:tracks.get(t.id)!}))}));
 remapped.lyrics=source.lyrics.filter(l=>tracks.has(l.trackId)).map(l=>({...structuredClone(l),trackId:tracks.get(l.trackId)!}));
 remapped.links=source.links?.filter(l=>tracks.has(l.trackId)).map(l=>({...l,trackId:tracks.get(l.trackId)!}));
 remapped.indications=source.indications.filter(i=>!i.trackId||tracks.has(i.trackId)).map(i=>({...i,trackId:i.trackId?tracks.get(i.trackId):undefined}));
 const block=copyMeasures(remapped,1,barCount,'all');
 if(options.mode==='measures'){
  const boundary=measureAt(target,options.afterMeasure+1).start;
  if(target.tracks.some(t=>t.locked&&t.events.some(n=>noteStart(n)+noteDuration(n)>boundary)))throw new Error('L’insertion déplacerait une voix verrouillée. Déverrouillez-la ou ajoutez de nouvelles voix.');
  pasteBlock(target,block,options.afterMeasure,'all');
 }else{
  for(let i=1;i<=barCount;i++)if(Math.abs(measureAt(target,options.afterMeasure+i).barBeats-measureAt(source,i).barBeats)>1e-7)throw new Error('Les signatures des mesures ne correspondent pas pour superposer des voix. Insérez plutôt des mesures.');
  pasteBlock(target,block,options.afterMeasure,'all',false);target.settings.measureCount=Math.max(measureCount(target),options.afterMeasure+barCount);
 }
 target.settings.choirTemplate='Personnalisé';invalidateTimeline(target);validateProject(target);
}
