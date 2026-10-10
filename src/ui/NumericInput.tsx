import {useEffect,useRef,useState,type InputHTMLAttributes} from 'react';
type Props=Omit<InputHTMLAttributes<HTMLInputElement>,'value'|'defaultValue'|'onChange'>&{value:number;onValueChange:(value:number)=>void};
/** Keep intermediate keyboard input (empty, or the first digit) without changing the valid document. */
export function NumericInput({value,onValueChange,min,max,step=1,onBlur,...props}:Props){
 const [entry,setEntry]=useState(String(value)),submitted=useRef(value);
 useEffect(()=>{if(value!==submitted.current){submitted.current=value;setEntry(String(value));}},[value]);
 return <input {...props} type="number" min={min} max={max} step={step} value={entry} onChange={e=>{
  const raw=e.target.value,n=Number(raw);setEntry(raw);
  if(raw!==''&&Number.isFinite(n)&&(min===undefined||n>=Number(min))&&(max===undefined||n<=Number(max))&&(step!==1||Number.isInteger(n))){submitted.current=n;onValueChange(n);}
 }} onBlur={e=>{setEntry(String(value));onBlur?.(e);}}/>;
}
