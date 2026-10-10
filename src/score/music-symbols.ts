import type {DrawOp,OpMeta} from './engraving.ts';
import {NAVIGATION_LABELS} from '../music/navigation.ts';
/** Shared vector shapes for printed signs and library thumbnails. */
export function musicalSymbol(symbol:string,x:number,y:number,meta:OpMeta={},size=12):DrawOp[]{
 const ops:DrawOp[]=[],line=(a:number,b:number,c:number,d:number,w=1)=>ops.push({kind:'line',x:a,y:b,x2:c,y2:d,width:w,color:'#37333e',...meta}),curve=(a:number,b:number,c:number,d:number,e:number,f:number,g:number,h:number,w=1)=>ops.push({kind:'curve',x:a,y:b,cx1:c,cy1:d,cx2:e,cy2:f,x2:g,y2:h,width:w,...meta}),dot=(a:number,b:number,r=1.3)=>ops.push({kind:'circle',x:a,y:b,radius:r,...meta});
 if(symbol==='coda'){ops.push({kind:'circle',x:x+6,y:y-5,radius:5,color:'#37333e',outline:true,...meta});line(x-2,y-5,x+14,y-5);line(x+6,y-13,x+6,y+3);}
 else if(symbol==='segno'){curve(x+10,y-13,x-5,y-15,x+19,y+1,x+1,y,1.5);line(x-1,y+2,x+12,y-15);dot(x-2,y-10);dot(x+13,y-1);}
 else if(symbol==='breath')curve(x,y-12,x+5,y-17,x+6,y-7,x,y-4,1.5);
 else if(symbol==='fermata'){curve(x-8,y-3,x-6,y-16,x+6,y-16,x+8,y-3,1.1);dot(x,y-5,1.5);}
 else if(symbol==='accent'){line(x-5,y-10,x+5,y-7);line(x+5,y-7,x-5,y-4);}
 else if(symbol==='tenuto')line(x-5,y-7,x+5,y-7);
 else if(symbol==='crescendo'||symbol==='diminuendo'){const a=symbol==='crescendo'?0:5,b=5-a;line(x-14,y-6-a,x+18,y-6-b);line(x-14,y-6+a,x+18,y-6+b);}
 else if(symbol==='tie'||symbol==='phrase'||symbol==='melisma')curve(x-15,y-5,x-9,y-15,x+12,y-15,x+18,y-5);
 else if(symbol==='repeat'){line(x-14,y-18,x-14,y+4,1.7);line(x-10,y-18,x-10,y+4,.8);dot(x-5,y-10);dot(x-5,y-3);line(x+16,y-18,x+16,y+4,1.7);line(x+12,y-18,x+12,y+4,.8);dot(x+7,y-10);dot(x+7,y-3);}
 else if(symbol==='final'){line(x-3,y-18,x-3,y+4,.8);line(x+2,y-18,x+2,y+4,2);}
 else ops.push({kind:'text',x,y,text:Object.hasOwn(NAVIGATION_LABELS,symbol)?NAVIGATION_LABELS[symbol as keyof typeof NAVIGATION_LABELS]:symbol,size,color:'#26232d',...meta});
 return ops;
}
