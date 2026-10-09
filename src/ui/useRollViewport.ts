import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {noteStart,type Project} from '../music/model';
import {measureAt,measureForBeat,musicEnd} from '../music/timeline';
import {selectionBounds} from '../music/selection-editing';
import type {Selection} from '../music/note-editing';
import {DEFAULT_ROLL,normalizeRoll,clamp,type RollFit} from '../storage/ui-preferences';
import {usePreference} from './usePreference';
import type {FocusRequest} from './SolfaScore';

export function useRollViewport(project:Project,selected:Selection|null,beat:number,visible:boolean,focus?:FocusRequest){
  const [viewport,setViewport,ready]=usePreference('roll:'+project.id,DEFAULT_ROLL,normalizeRoll);
  const scroll=useRef<HTMLDivElement>(null),appliedFocus=useRef(-1);
  const [bounds,setBounds]=useState({width:0,height:0});
  useEffect(()=>{
    const el=scroll.current;if(!visible||!el)return;
    const read=()=>setBounds({width:el.clientWidth,height:el.clientHeight});read();
    if(typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(read);observer.observe(el);return ()=>observer.disconnect();
  },[visible]);
  const chosen=selectionBounds(project,selected);
  function fitted(fit:RollFit){
    const m=measureForBeat(project,beat);
    const range=fit==='selection'&&chosen?chosen:fit==='all'?(selectionBounds(project,{trackId:project.tracks[0].id,id:'',ids:project.tracks.flatMap(t=>t.events.map(n=>n.id))})??{start:0,end:musicEnd(project),low:48,high:76}):{start:m.start,end:fit==='four'?measureAt(project,m.number+3).end:m.end,low:48,high:76};
    const zoom=clamp((bounds.width-96)/Math.max(.125,range.end-range.start),1,256);
    const rowHeight=clamp((bounds.height-86)/Math.max(8,range.high-range.low+3),8,32);
    return {zoom,rowHeight,left:Math.max(0,range.start*zoom-24),top:Math.max(0,38+(127-range.high)*rowHeight-24),fit};
  }
  // Automatic framing reacts to available space. Manual zoom remains untouched.
  useEffect(()=>{
    if(visible&&ready&&bounds.width>100&&bounds.height>80&&viewport.fit!=='manual')setViewport(v=>({...v,...fitted(v.fit)}));
  },[visible,ready,bounds.width,bounds.height,viewport.fit,chosen?.start,chosen?.end,chosen?.low,chosen?.high,project.tracks]);
  useLayoutEffect(()=>{
    if(visible&&ready&&scroll.current){scroll.current.scrollLeft=viewport.left;scroll.current.scrollTop=viewport.top;}
  },[visible,ready,viewport.zoom,viewport.rowHeight,viewport.fit]);
  useEffect(()=>{
    const el=scroll.current;if(!visible||!ready||!focus||!el||appliedFocus.current===focus.id)return;
    const note=project.tracks.flatMap(t=>t.events).find(n=>n.id===focus.noteId),x=48+(note?noteStart(note):focus.beat)*viewport.zoom;
    if(x<el.scrollLeft+48||x>el.scrollLeft+el.clientWidth-32)el.scrollLeft=Math.max(0,x-el.clientWidth/2);
    if(note){const y=38+(127-note.midiPitch)*viewport.rowHeight;if(y<el.scrollTop+38||y>el.scrollTop+el.clientHeight-32)el.scrollTop=Math.max(0,y-el.clientHeight/2);}
    appliedFocus.current=focus.id;
  },[visible,ready,focus?.id,viewport.zoom,viewport.rowHeight]);
  function zoomTo(zoom:number){
    const next=clamp(zoom,1,256),el=scroll.current;
    setViewport(v=>({...v,zoom:next,fit:'manual',left:el?Math.max(0,(el.scrollLeft+el.clientWidth/2-48)*next/v.zoom-el.clientWidth/2+48):v.left}));
  }
  function heightTo(rowHeight:number){
    const next=clamp(rowHeight,8,32),el=scroll.current;
    setViewport(v=>({...v,rowHeight:next,fit:'manual',top:el?Math.max(0,(el.scrollTop+el.clientHeight/2-38)*next/v.rowHeight-el.clientHeight/2+38):v.top}));
  }
  function fitTo(fit:RollFit){setViewport(v=>fit==='manual'?{...v,fit}:{...v,...fitted(fit)});}
  return {viewport,setViewport,ready,scroll,zoomTo,heightTo,fitTo};
}
