import {useEffect,useRef,type RefObject} from 'react';
/** Two fingers zoom the document preview. One finger keeps native scrolling. */
export function useScoreGestures(ref:RefObject<HTMLDivElement|null>,zoom:number,change:(zoom:number,point?:{x:number;y:number})=>void,fit:()=>void,cancelEdit:()=>void){
 const latest=useRef({zoom,change,fit,cancelEdit});latest.current={zoom,change,fit,cancelEdit};
 const suppress=useRef(false);
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  let pinch:{distance:number;zoom:number}|null=null,start:{x:number;y:number}|null=null,moved=false,lastTap:{time:number;x:number;y:number}|null=null,release:ReturnType<typeof setTimeout>;
  const distance=(touches:TouchList)=>Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
  const begin=(e:TouchEvent)=>{clearTimeout(release);if(e.touches.length===2){pinch={distance:distance(e.touches),zoom:latest.current.zoom};moved=true;suppress.current=true;latest.current.cancelEdit();}else if(e.touches.length===1){start={x:e.touches[0].clientX,y:e.touches[0].clientY};moved=false;suppress.current=false;}};
  const move=(e:TouchEvent)=>{
   if(pinch&&e.touches.length===2){e.preventDefault();const rect=el.getBoundingClientRect();latest.current.change(pinch.zoom*distance(e.touches)/Math.max(1,pinch.distance),{x:(e.touches[0].clientX+e.touches[1].clientX)/2-rect.left,y:(e.touches[0].clientY+e.touches[1].clientY)/2-rect.top});}
   else if(start&&e.touches.length===1&&Math.hypot(e.touches[0].clientX-start.x,e.touches[0].clientY-start.y)>8){moved=true;suppress.current=true;}
  };
  const end=(e:TouchEvent)=>{if(e.touches.length)return;pinch=null;const now=performance.now(),tap=e.changedTouches[0];if(!moved&&tap&&e.type!=='touchcancel'){if(lastTap&&now-lastTap.time<300&&Math.hypot(tap.clientX-lastTap.x,tap.clientY-lastTap.y)<30){latest.current.fit();suppress.current=true;lastTap=null;}else lastTap={time:now,x:tap.clientX,y:tap.clientY};}else lastTap=null;start=null;release=setTimeout(()=>{suppress.current=false;},400);};
  el.addEventListener('touchstart',begin,{passive:true});el.addEventListener('touchmove',move,{passive:false});el.addEventListener('touchend',end);el.addEventListener('touchcancel',end);
  return()=>{clearTimeout(release);el.removeEventListener('touchstart',begin);el.removeEventListener('touchmove',move);el.removeEventListener('touchend',end);el.removeEventListener('touchcancel',end);};
 },[ref]);
 return suppress;
}
