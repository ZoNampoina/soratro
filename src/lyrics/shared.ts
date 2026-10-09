import {id,noteStart,noteDuration,type Project,type LyricLine,type Syllable} from '../music/model.ts';
import {splitLyrics,assignSequential} from './lyrics.ts';

/** One authoritative text; each voice keeps its own stable syllable-to-note links. */
export function shareLyrics(p:Project,lineId:string,trackIds:string[],name='Paroles communes'){
  const line=p.lyrics.find(l=>l.id===lineId);if(!line)throw new Error('Paroles introuvables.');
  const ids=[...new Set(trackIds)].filter(key=>p.tracks.some(t=>t.id===key));if(!ids.length)throw new Error('Choisissez au moins une voix.');
  if(!ids.includes(line.trackId))ids.unshift(line.trackId);
  p.sharedLyrics??=[];
  let shared=p.sharedLyrics.find(s=>s.id===line.sharedTextId);
  if(!shared){shared={id:id(),name,text:line.text,trackIds:ids,syllables:line.syllables.map(s=>({id:s.id??id(),text:s.text,hyphenAfter:s.hyphenAfter}))};p.sharedLyrics.push(shared);}
  shared.trackIds=ids;line.sharedTextId=shared.id;
  for(const trackId of ids){let own=p.lyrics.find(l=>l.sharedTextId===shared!.id&&l.trackId===trackId);
    if(!own){own={...structuredClone(line),id:id(),trackId,sharedTextId:shared.id,syllables:shared.syllables.map(s=>({...s}))};p.lyrics.push(own);assignSequential(p,own.id);}
    own.text=shared.text;own.syllables=shared.syllables.map((s,i)=>({...own!.syllables[i],...s}));
  }
  for(const own of p.lyrics.filter(l=>l.sharedTextId===shared!.id&&!ids.includes(l.trackId)))delete own.sharedTextId;
  return shared.id;
}
export function setLyricText(p:Project,lineId:string,text:string){
  const line=p.lyrics.find(l=>l.id===lineId);if(!line)return;const shared=p.sharedLyrics?.find(s=>s.id===line.sharedTextId);
  if(shared){shared.text=text;for(const own of p.lyrics.filter(l=>l.sharedTextId===shared.id))own.text=text;}else line.text=text;
}
/** Preserve exact-match syllables through insertions using an ordered match, never erase all links. */
function syllableMapping(previous:Syllable[],next:Syllable[]):number[]{
  const positions=new Map<string,number[]>();previous.forEach((s,i)=>{const list=positions.get(s.text)??[];list.push(i);positions.set(s.text,list);});
  let cursor=0;return next.map((s,i)=>{const match=(positions.get(s.text)??[]).find(n=>n>=cursor);
    if(match!==undefined){cursor=match+1;return match;}
    // A spelling correction at the same position retains the musical association.
    if(previous.length===next.length&&i>=cursor){cursor=i+1;return i;}return -1;
  });
}
export function splitSharedLyrics(p:Project,lineId:string,realign=false){
  const line=p.lyrics.find(l=>l.id===lineId);if(!line)return;const shared=p.sharedLyrics?.find(s=>s.id===line.sharedTextId),next=splitLyrics(line.text),previous=shared?.syllables??line.syllables,mapping=syllableMapping(previous,next);
  const canonical=next.map((s,i)=>({...s,id:previous[mapping[i]]?.id??s.id}));
  const lines=shared?p.lyrics.filter(l=>l.sharedTextId===shared.id):[line];
  for(const own of lines){const old=own.syllables;own.syllables=canonical.map((s,i)=>({...old[mapping[i]],...s}));if(realign)assignSequential(p,own.id);}
  if(shared){shared.text=line.text;shared.syllables=canonical;}
}
export function correctSharedSyllable(p:Project,lineId:string,index:number,text:string){
  const line=p.lyrics.find(l=>l.id===lineId);if(!line?.syllables[index])return;const shared=p.sharedLyrics?.find(s=>s.id===line.sharedTextId);
  if(shared){shared.syllables[index].text=text;for(const own of p.lyrics.filter(l=>l.sharedTextId===shared.id))if(own.syllables[index])own.syllables[index].text=text;}
  else line.syllables[index].text=text;
  let cursor=0;const raw=line.text.replace(/[^\s‐‑-]+/g,token=>cursor++===index?text:token);setLyricText(p,lineId,raw);
}
export function unlinkSharedLyrics(p:Project,lineId:string){const line=p.lyrics.find(l=>l.id===lineId);if(line)delete line.sharedTextId;}
export function compatibleLyricAlignment(p:Project,lines:LyricLine[]):boolean{
  if(lines.length<2)return true;const notes=new Map(p.tracks.flatMap(t=>t.events.map(n=>[n.id,n] as const)));
  const timing=(line:LyricLine)=>line.syllables.map(s=>{
    const linked=(s.noteIds??(s.noteId?[s.noteId]:[])).map(key=>notes.get(key)).filter(n=>!!n);
    return [s.text,s.hyphenAfter,linked.length?+Math.min(...linked.map(noteStart)).toFixed(4):null,linked.length?+Math.max(...linked.map(n=>noteStart(n)+noteDuration(n))).toFixed(4):null];
  });const first=JSON.stringify(timing(lines[0]));return lines.slice(1).every(l=>JSON.stringify(timing(l))===first);
}
export interface LyricPlacement {line:LyricLine;trackIndex:number;common:boolean}
export function lyricPlacements(p:Project):LyricPlacement[]{
  const result:LyricPlacement[]=[],visited=new Set<string>(),mode=p.layout.lyricPlacement??'auto';
  for(const line of p.lyrics){if(!line.syllables.some(s=>s.noteIds?.length||s.noteId))continue;const trackIndex=p.tracks.findIndex(t=>t.id===line.trackId);if(trackIndex<0)continue;
    const key=line.sharedTextId;if(key&&mode!=='voice'){
      if(visited.has(key))continue;const lines=p.lyrics.filter(l=>l.sharedTextId===key),indices=lines.map(l=>p.tracks.findIndex(t=>t.id===l.trackId));
      if(compatibleLyricAlignment(p,lines)){visited.add(key);result.push({line,trackIndex:Math.max(...indices),common:true});continue;}
      // Different rhythms always keep their own associations and visual rows.
    }
    result.push({line,trackIndex,common:false});
  }return result.sort((a,b)=>a.trackIndex-b.trackIndex||(a.line.verse??1)-(b.line.verse??1));
}
