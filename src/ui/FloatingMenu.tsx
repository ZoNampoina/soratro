import {useLayoutEffect,useRef,useState,type ReactNode,type RefObject} from 'react';
export function FloatingMenu({x,y,className,children,label,role='menu',menuRef}:{x:number;y:number;className:string;children:ReactNode;label?:string;role?:'menu'|'group';menuRef?:RefObject<HTMLDivElement|null>}){
 const own=useRef<HTMLDivElement>(null),ref=menuRef??own,[position,setPosition]=useState({left:8,top:8,maxHeight:window.innerHeight-16});
 useLayoutEffect(()=>{
  const read=()=>{const el=ref.current;if(!el)return;const viewport=window.visualViewport,left=viewport?.offsetLeft??0,top=viewport?.offsetTop??0,width=viewport?.width??window.innerWidth,height=viewport?.height??window.innerHeight,box=el.getBoundingClientRect(),h=Math.min(el.scrollHeight,height-16);setPosition({left:Math.max(left+8,Math.min(x,left+width-box.width-8)),top:Math.max(top+8,Math.min(y+h<=top+height-8?y:y-h-8,top+height-h-8)),maxHeight:height-16});};
  read();window.addEventListener('resize',read);window.visualViewport?.addEventListener('resize',read);window.visualViewport?.addEventListener('scroll',read);
  const observer=new ResizeObserver(read);if(ref.current)observer.observe(ref.current);
  return()=>{observer.disconnect();window.removeEventListener('resize',read);window.visualViewport?.removeEventListener('resize',read);window.visualViewport?.removeEventListener('scroll',read);};
 },[x,y,ref]);
 return <div ref={ref} className={className} role={role} aria-label={label} style={{...position,overflowY:'auto',maxWidth:'calc(100vw - 16px)'}}>{children}</div>;
}
