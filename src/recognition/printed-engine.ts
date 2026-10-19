import {id} from '../music/model.ts';
import {type Box,type GlyphTemplate,type ScanGlyph,type ScanHints,type ScanRegion,type ScanRow,boxContains,boxOverlap} from './types.ts';
import {binaryPixels,components,normalizedMask,shapeDistance,sourceQuad,type PreparedPixels,type Component,type Binary} from './image-processing.ts';
const median=(numbers:number[])=>numbers.length?numbers.slice().sort((a,b)=>a-b)[Math.floor(numbers.length/2)]:12;
const union=(a:Box,b:Box):Box=>({x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),width:Math.max(a.x+a.width,b.x+b.width)-Math.min(a.x,b.x),height:Math.max(a.y+a.height,b.y+b.height)-Math.min(a.y,b.y)});
const quadBox=(q:{x:number;y:number}[]):Box=>({x:Math.min(...q.map(p=>p.x)),y:Math.min(...q.map(p=>p.y)),width:Math.max(...q.map(p=>p.x))-Math.min(...q.map(p=>p.x)),height:Math.max(...q.map(p=>p.y))-Math.min(...q.map(p=>p.y))});
export interface PrintedResult {rows:ScanRow[];components:number;barLines:number;engine:'soratro-glyphs-1';unresolved:number}
export function recognizePrinted(image:PreparedPixels,templates:GlyphTemplate[],hints:ScanHints,pageId:string,revision:number,regions:ScanRegion[]=[],previous:ScanRow[]=[]):PrintedResult {
 const binary=binaryPixels(image),all=components(binary).filter(c=>c.area>=1),normal=all.filter(c=>c.height>=5&&c.height<=70&&c.width>=Math.max(2,c.height*.18)&&c.width<c.height*2.5&&c.area>=8),typical=median(normal.map(c=>c.height));
 const bars=all.filter(c=>c.height>Math.max(22,typical*2.5)&&c.width<Math.max(7,typical*.45)&&c.area/c.height>=.7);
 // A single-voice rule is shorter, but extends below the neighboring note baseline.
 const short=all.filter(c=>!bars.includes(c)&&c.height>=Math.max(12,typical*1.15)&&c.height<=typical*2.6&&c.width<=Math.max(3,typical*.23)&&c.area/c.height>=.7);
 for(const c of short){const neighbors=normal.filter(n=>n!==c&&n.x>c.x-typical*12&&n.x<c.x+typical*12&&Math.abs(n.y+n.height/2-c.y-c.height/2)<typical*.6&&n.width>c.width*1.5);if(neighbors.length<2)continue;const bottom=median(neighbors.map(n=>n.y+n.height)),top=median(neighbors.map(n=>n.y));if(c.y<=top&&c.y+c.height>=bottom+Math.max(1,typical*.08)&&short.some(o=>o!==c&&Math.abs(o.y-c.y)<typical*.3&&Math.abs(o.height-c.height)<typical*.3&&Math.abs(o.x-c.x)>typical*3))bars.push(c);}

 const systems:{y:number;bottom:number}[]=[];for(const b of bars.slice().sort((a,b)=>a.y-b.y)){const sys=systems.find(s=>Math.abs(s.y-b.y)<typical*1.2&&Math.abs(s.bottom-b.y-b.height)<typical*1.2);if(!sys)systems.push({y:b.y,bottom:b.y+b.height});}
 // Some Solfa editions draw beat separators as dashed vertical rules through all voices.
 const dashed=new Set<Component>(),beatRules:{x:number;system:number}[]=[];
 systems.forEach((system,index)=>{const candidates=all.filter(c=>!bars.includes(c)&&c.y>=system.y-2&&c.y+c.height<=system.bottom+2&&c.width<=Math.max(3,typical*.25)&&c.height>=3&&c.height<=typical*1.2&&c.area/c.height>=.7),columns:{x:number;parts:Component[]}[]=[];
  for(const c of candidates){let column=columns.find(g=>Math.abs(g.x-c.x-c.width/2)<=Math.max(2,typical*.18));if(!column){column={x:c.x+c.width/2,parts:[]};columns.push(column);}column.parts.push(c);column.x=median(column.parts.map(c=>c.x+c.width/2));}
  for(const column of columns){const span=Math.max(...column.parts.map(c=>c.y+c.height))-Math.min(...column.parts.map(c=>c.y));if(column.parts.length>=6&&span>(system.bottom-system.y)*.65){column.parts.forEach(c=>dashed.add(c));beatRules.push({x:column.x,system:index});}}
 });
 const letters=all.filter(c=>!bars.includes(c)&&!dashed.has(c)&&c.height>=typical*.48&&c.height<=typical*2.2&&c.width<=typical*4&&c.area>=4);
 const holds=all.filter(c=>!dashed.has(c)&&!bars.includes(c)&&c.width>=typical*.45&&c.width<=typical*1.8&&c.height<typical*.3&&c.area/c.width>.6);

 const groups:{parts:Component[];y:number}[]=[];
 for(const c of [...letters,...holds].slice().sort((a,b)=>a.y+a.height/2-b.y-b.height/2)){const cy=c.y+c.height/2,g=groups.find(g=>Math.abs(g.y-cy)<typical*.65);if(g){g.parts.push(c);g.y=median(g.parts.map(p=>p.y+p.height/2));}else groups.push({parts:[c],y:cy});}

 const rows:ScanRow[]=[];const voiceCounts=new Map<number,number>(),systemBars=new Map<number,number>(),consumed=new Set<Component>();
 for(const group of groups.sort((a,b)=>a.y-b.y)){
  const bodies=group.parts.filter(p=>p.height>=typical*.48),height=Math.max(typical*.6,median(bodies.map(p=>p.height))),baseline=bodies.length?median(bodies.map(p=>p.y+p.height)):group.y+height*.35,lineBox=group.parts.reduce<Box>(union,group.parts[0]),middle={x:lineBox.x+lineBox.width/2,y:group.y};
  const region=regions.find(r=>r.kind!=='ignore'&&boxContains(r.box,middle));if(regions.some(r=>r.kind==='ignore'&&boxContains(r.box,middle)))continue;if(regions.some(r=>r.kind==='music')&&!region)continue;
  const sysIndex=systems.findIndex(s=>group.y>=s.y-height*.5&&group.y<=s.bottom+height*.3),crossbars=bars.filter(b=>group.y>=b.y-height*.3&&group.y<=b.y+b.height+height*.3).sort((a,b)=>a.x-b.x);
  const small=all.filter(c=>!bars.includes(c)&&!dashed.has(c)&&!group.parts.includes(c)&&!consumed.has(c)&&c.height<=height*.6&&c.y>=baseline-height*1.65&&c.y+c.height<=baseline+height*.6&&c.x>=Math.min(lineBox.x-height*2,crossbars[0]?.x??Infinity)&&c.x<=Math.max(lineBox.x+lineBox.width+height*2,crossbars.at(-1)?.x??-Infinity));
  const parts=[...group.parts,...small].sort((a,b)=>a.x-b.x),glyphs:ScanGlyph[]=[];const used=new Set<Component>();
  for(const c of parts){if(used.has(c))continue;let box:Box=c,label='?',alternatives:ScanGlyph['alternatives']=[],distance:number|undefined,origin:ScanGlyph['origin']='classifier';
   const other=parts.find(o=>o!==c&&!used.has(o)&&c.height<height*.62&&o.height<height*.62&&Math.abs((o.x+o.width/2)-(c.x+c.width/2))<Math.max(3,height*.22)&&o.y>c.y+c.height&&o.y-c.y<height*.9&&o.y+o.height-c.y>height*.5);
   if(c.width>=Math.max(3,height*.25)&&c.width/c.height>=3&&c.height<height*.3&&c.y<baseline-height*.08)label='-';
   else if(other){box=union(c,other);label=':';used.add(other);}
   else if(c.height<height*.55&&c.width<height*.65){
    const left=group.parts.filter(p=>p.x+p.width<=c.x+2).sort((a,b)=>b.x-a.x)[0],gap=left?c.x-left.x-left.width:Infinity;
    if(c.y+c.height<baseline-height*.5&&gap<height*.65)label="'";
    else if(c.y>baseline+height*.06&&gap<height*.45)label='_1';
    else if(c.y+c.height>=baseline-height*.35)label=c.height>Math.max(c.width*1.4,height*.25)?',':'.';
   }else if(c.width>height*.4&&c.height<height*.25)label='-';
   else {
    const mask=normalizedMask(binary,c),scores=new Map<string,{distance:number;origin:ScanGlyph['origin']}>();
    for(const t of templates){if(Math.abs(Math.log((c.width/c.height)/t.aspect))>1.5)continue;const d=shapeDistance(mask,t.mask,c.width/c.height,t.aspect),old=scores.get(t.label);if(!old||d<old.distance)scores.set(t.label,{distance:d,origin:t.origin});}
    const sorted=[...scores].sort((a,b)=>a[1].distance-b[1].distance);alternatives=sorted.slice(0,3).map(([label,x])=>({label,distance:x.distance}));distance=alternatives[0]?.distance;
    if(distance!==undefined&&distance<.43&&(alternatives.length<2||alternatives[1].distance-distance>.018)){label=alternatives[0].label;origin=sorted[0][1].origin;}
   }
   if(label==='?'&&c.height<height*.23&&c.area<3)continue;
   const mapped=sourceQuad(image.toSource,box),mappedBox=quadBox(mapped);
   const old=previous.flatMap(r=>r.glyphs).find(g=>g.anchor&&boxOverlap(quadBox(g.sourceQuad),mappedBox)/Math.max(1,mappedBox.width*mappedBox.height)>.65);
   glyphs.push(old?{...old,box,sourceQuad:sourceQuad(image.toSource,box)}:{id:id(),box,sourceQuad:sourceQuad(image.toSource,box),label,alternatives,distance,origin,state:label==='?'?'unknown':'review'});used.add(c);consumed.add(c);
  }
  const recognized=glyphs.filter(g=>/^[drmfslt]|^0$/.test(g.label)).length,unknown=glyphs.filter(g=>g.label==='?').length;
  const holdCount=glyphs.filter(g=>g.label==='-').length;
  if(!region&&(crossbars.length<2||(recognized<2||recognized/Math.max(1,recognized+unknown)<.4)&&holdCount<2))continue;
  const kind=region?.kind==='lyrics'?'lyrics':'music',system=region?.system??(sysIndex>=0?sysIndex+1:(hints.voiceCount>1?Math.floor(rows.length/hints.voiceCount)+1:rows.length+1)),voice=region?.voice??(voiceCounts.get(system)??0);
  voiceCounts.set(system,voice+1);
  for(const rule of beatRules.filter(r=>r.system===sysIndex)){if(region&&!boxContains(region.box,{x:rule.x,y:group.y}))continue;const b={x:rule.x-1,y:baseline-height*.75,width:2,height:height*.6};glyphs.push({id:id(),box:b,sourceQuad:sourceQuad(image.toSource,b),label:':',alternatives:[],state:'review',origin:'classifier'});}
  for(const bar of crossbars){if(region&&!boxContains(region.box,{x:bar.x,y:group.y}))continue;glyphs.push({id:id(),box:{x:bar.x,y:baseline-height,width:bar.width,height},sourceQuad:sourceQuad(image.toSource,{x:bar.x,y:baseline-height,width:bar.width,height}),label:'|',alternatives:[],state:'review',origin:'classifier'});}
  glyphs.sort((a,b)=>a.box.x-b.box.x);const text=glyphText(glyphs),barCount=Math.max(1,text.split('|').filter(x=>x.trim()).length);systemBars.set(system,Math.max(systemBars.get(system)??0,barCount));
  const firstMeasure=region?.firstMeasure??(1+[...systemBars].filter(([key])=>key<system).reduce((n,[,count])=>n+count,0));
  rows.push({id:id(),pageId,revision,regionId:region?.id,box:{x:Math.max(0,lineBox.x-height),y:baseline-height*1.6,width:Math.min(image.width-lineBox.x+height,lineBox.width+height*2),height:height*2.3},system,voice,firstMeasure,kind,verse:region?.verse??1,glyphs,text,confirmed:false,included:true,manual:false});
 }
 // Regions intentionally identified as lyrics remain available for manual transcription.
 for(const region of regions.filter(r=>r.kind==='lyrics'))if(!rows.some(r=>r.regionId===region.id))rows.push({id:id(),pageId,revision,regionId:region.id,box:region.box,system:region.system,voice:region.voice,firstMeasure:region.firstMeasure,kind:'lyrics',verse:region.verse,glyphs:[],text:'',confirmed:false,included:true,manual:true});
 return {rows,components:all.length,barLines:bars.length,engine:'soratro-glyphs-1',unresolved:rows.flatMap(r=>r.glyphs).filter(g=>g.state==='unknown').length};
}
export function glyphText(glyphs:ScanGlyph[]){let text='';for(const g of glyphs){if(g.label==='_1'&&/_\d$/.test(text)){text=text.replace(/_(\d)$/,(_,n)=>'_'+Math.min(4,+n+1));continue;}text+=g.label;}return text.replace(/\|+/g,'|');}
