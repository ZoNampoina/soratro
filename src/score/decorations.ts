import type {Project,PageDecoration,PageSettings} from '../music/model.ts';
import {tempoLabel,displayedTempo} from '../music/timeline.ts';
import {DECORATION_WIDTHS} from './decoration-font-metrics.ts';
export type FontKey=`${PageDecoration['font']}:${string}`;
export const decorationFontKey=(d:Pick<PageDecoration,'font'|'bold'|'italic'>):FontKey=>`${d.font}:${d.bold?'bold':'regular'}${d.italic?'-italic':''}`;
export const decorationWidth=(text:string,size:number,key:FontKey)=>[...text].reduce((total,c)=>total+(DECORATION_WIDTHS[key]?.[String(c.codePointAt(0))]??.65)*size,0);
export function decoration(field:PageDecoration['field'],align:PageDecoration['align'],row=0,text='',size=11):PageDecoration{
  return {id:'decoration-'+field+'-'+align+'-'+row,field,text,align,row,size,bold:false,italic:false,color:'#26232d',font:'sans',visible:true,offsetX:0,offsetY:0};
}
export function defaultHeader(p:Project):PageDecoration[]{return [{...decoration('title','center',0,'',p.layout.titleSize),bold:true},decoration('tonic','left',1),decoration('signature','center',1),decoration('tempo','right',1),decoration('author','left',2),decoration('composer','right',2)];}
export function defaultFooter(p:Project):PageDecoration[]{return [decoration('custom','left',0,'SORATRO · Solfa',8),{...decoration('page','right',0,'{page} / {pages}',9),visible:p.layout.pageNumbers}];}
export function decorationText(d:PageDecoration,p:Project,page:number,total:number){
  const text=d.field==='title'?p.title:d.field==='author'?(p.author?'Paroles : '+p.author:''):d.field==='composer'?(p.composer?'Composition : '+p.composer:''):d.field==='tonic'?'Do = '+p.tonic:d.field==='signature'?p.timeSignature:d.field==='tempo'?tempoLabel(p.settings.tempoUnit)+' = '+Number(displayedTempo(p).toFixed(2)):d.field==='date'?p.createdAt.slice(0,10):d.field==='page'?(d.text||'{page} / {pages}'):d.field==='pages'?String(total):d.text;
  return text.replaceAll('{title}',p.title).replaceAll('{page}',String(page+1)).replaceAll('{pages}',String(total));
}
export function showDecoration(mode:PageSettings['headerOn'],index:number){return mode!=='none'&&(mode!=='first'||index===0)&&(mode!=='following'||index>0);}
export const PRINT_FONT_URLS:Record<string,URL>={
  'sans:regular':new URL('../assets/print/sans-regular.ttf',import.meta.url),'sans:bold':new URL('../assets/print/sans-bold.ttf',import.meta.url),'sans:regular-italic':new URL('../assets/print/sans-regular-italic.ttf',import.meta.url),'sans:bold-italic':new URL('../assets/print/sans-bold-italic.ttf',import.meta.url),
  'serif:regular':new URL('../assets/print/serif-regular.ttf',import.meta.url),'serif:bold':new URL('../assets/print/serif-bold.ttf',import.meta.url),'serif:regular-italic':new URL('../assets/print/serif-regular-italic.ttf',import.meta.url),'serif:bold-italic':new URL('../assets/print/serif-bold-italic.ttf',import.meta.url),
  'mono:regular':new URL('../assets/print/mono-regular.ttf',import.meta.url),'mono:bold':new URL('../assets/print/mono-bold.ttf',import.meta.url),'mono:regular-italic':new URL('../assets/print/mono-regular-italic.ttf',import.meta.url),'mono:bold-italic':new URL('../assets/print/mono-bold-italic.ttf',import.meta.url),
};
