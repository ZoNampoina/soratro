import {useEffect} from 'react';
/** Keyboard/browser bars change the usable screen without remounting either music editor. */
export function useVisualViewport(){
 useEffect(()=>{
  const viewport=window.visualViewport,root=document.documentElement;
  const read=()=>{root.style.setProperty('--visual-height',(viewport?.height??window.innerHeight)+'px');root.style.setProperty('--visual-top',(viewport?.offsetTop??0)+'px');};
  read();window.addEventListener('resize',read);viewport?.addEventListener('resize',read);viewport?.addEventListener('scroll',read);
  return()=>{window.removeEventListener('resize',read);viewport?.removeEventListener('resize',read);viewport?.removeEventListener('scroll',read);};
 },[]);
}
