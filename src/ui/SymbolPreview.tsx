import {useMemo} from 'react';
import {musicalSymbol} from '../score/music-symbols';
import {pageSVG} from '../score/engraving';
export function SymbolPreview({symbol,large=false}:{symbol:string;large?:boolean}){
 const html=useMemo(()=>pageSVG({index:0,width:130,height:48,widthMm:34,heightMm:13,systems:[],ops:musicalSymbol(symbol,['crescendo','diminuendo','repeat','final','tie','phrase','melisma','breath','fermata','accent','tenuto','segno','coda'].includes(symbol)?61:16,31,{},16)}),[symbol]);
 return <span aria-hidden="true" className={'symbol-preview '+(large?'large':'')} dangerouslySetInnerHTML={{__html:html}}/>;
}
