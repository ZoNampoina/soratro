import { noteDuration,noteStart,type Project } from '../music/model.ts';
import { displayedTempo,measureAt,measureCount,tempoLabel,unitBeats } from '../music/timeline.ts';
import { beatToScoreX,layoutMeasure,measureGeometry,type MeasureGeometry } from './layout.ts';
import { midiToSolfa } from '../solfa/converter.ts';
import { textWidth } from './font-metrics.ts';
export type DrawOp={kind:'text';x:number;y:number;text:string;size:number;color?:string;noteIds?:string[];beat?:number}|{kind:'line';x:number;y:number;x2:number;y2:number;width:number;color?:string}|{kind:'circle';x:number;y:number;radius:number;color?:string};
export interface EngravedMeasure {number:number;x:number;y:number;width:number;height:number;geometry:MeasureGeometry;scale:number}
export interface ScoreSystem {index:number;page:number;first:number;last:number;x:number;y:number;width:number;height:number;measures:EngravedMeasure[];ops:DrawOp[]}
export interface ScorePage {index:number;width:number;height:number;widthMm:number;heightMm:number;ops:DrawOp[];systems:ScoreSystem[]}
export interface ScoreDocument {pages:ScorePage[];systems:ScoreSystem[];measureCount:number}
export const PX_PER_MM=96/25.4;
export function paperSize(p:Project){const sizes={A4:[210,297],A5:[148,210],Letter:[215.9,279.4]},[a,b]=sizes[p.layout.paper];const [widthMm,heightMm]=p.layout.orientation==='portrait'?[a,b]:[b,a];return {widthMm,heightMm,width:widthMm*PX_PER_MM,height:heightMm*PX_PER_MM};}
function putText(ops:DrawOp[],text:string,x:number,y:number,size:number,color='#26232d',noteIds?:string[],beat?:number){if(text)ops.push({kind:'text',text,x,y,size,color,noteIds,beat});}
function line(ops:DrawOp[],x:number,y:number,x2:number,y2:number,width=1,color='#37333e'){ops.push({kind:'line',x,y,x2,y2,width,color});}
function lyricLines(p:Project,trackId:string){return p.lyrics.filter(l=>l.trackId===trackId&&l.syllables.some(s=>s.noteId||s.noteIds?.length)).sort((a,b)=>(a.verse??1)-(b.verse??1));}
export function engraveProject(project:Project,selection?:{first:number;last:number}):ScoreDocument {
  const size=paperSize(project),margin=project.layout.margin*PX_PER_MM,gutter=54,available=size.width-margin*2-gutter,layout=project.layout,first=selection?.first??1,last=selection?.last??measureCount(project),count=last-first+1;
  if(count<=0||count>10000)throw new Error('Sélection de partition invalide.');
  const noteIndex=new Map(project.tracks.flatMap(t=>t.events.map(n=>[n.id,n] as const))),geometries=new Map<number,MeasureGeometry>();
  for(let number=first;number<=last;number++){
    const m=measureAt(project,number),geometry=measureGeometry(project,number-1,m.barBeats*layout.noteSize*1.05,layout.noteSize*1.15);
    const gaps=geometry.anchors.map((a,i)=>{const notes=project.tracks.flatMap(t=>t.events.filter(n=>Math.abs(noteStart(n)-a.beat)<.0001));const labels=project.tracks.map(t=>notes.filter(n=>n.trackId===t.id));const music=Math.max(layout.noteSize*1.1,...labels.map(notes=>textWidth(notes.map(n=>midiToSolfa(n.midiPitch,project.tonic)).join('/'),layout.noteSize)+12));
      const words=project.lyrics.flatMap(l=>l.syllables.filter(s=>{const key=s.noteIds?.[0]??s.noteId;return key&&Math.abs(noteStart(noteIndex.get(key)!)-a.beat)<.0001;}).map(s=>textWidth(s.text+(s.hyphenAfter?'-':''),layout.lyricSize)+8));return Math.max(music,...words,geometry.anchors[i+1]?Math.min(24,(geometry.anchors[i+1].beat-a.beat)*layout.noteSize*1.1):0);});
    let x=0;geometry.anchors=geometry.anchors.map((a,i)=>{const anchor={...a,x};x+=gaps[i];return anchor;});geometry.width=Math.max(34,x+8);geometries.set(number,geometry);
  }
  const voiceHeights=project.tracks.map(t=>Math.max(layout.voiceGap,layout.noteSize+9+lyricLines(project,t.id).length*(layout.lyricSize+6))),voiceY=voiceHeights.map((_,i)=>voiceHeights.slice(0,i).reduce((a,b)=>a+b,0));const musicHeight=voiceHeights.reduce((a,b)=>a+b,0),systemHeight=musicHeight+35,doc:ScoreDocument={pages:[],systems:[],measureCount:count};
  function newPage(){const page:ScorePage={index:doc.pages.length,...size,ops:[],systems:[]};doc.pages.push(page);const headerY=margin+layout.titleSize;putText(page.ops,project.title,margin,headerY,layout.titleSize);putText(page.ops,'Do = '+project.tonic+'  ·  '+project.timeSignature+'  ·  '+tempoLabel(project.settings.tempoUnit)+' = '+Number(displayedTempo(project).toFixed(2)),margin,headerY+24,12);const credits=[project.author&&'Paroles : '+project.author,project.composer&&'Composition : '+project.composer].filter(Boolean).join('  ·  ');putText(page.ops,credits,margin,headerY+43,10,'#68616f');putText(page.ops,project.tracks.map(t=>t.shortName+' : '+t.name).join('   '),margin,headerY+61,9,'#68616f');return page;}
  let page=newPage(),pageY=margin+layout.titleSize+85,number=first;
  while(number<=last){const group:number[]=[],max=layout.measuresPerSystem||12;let natural=0;
    while(number<=last&&group.length<max){const width=geometries.get(number)!.width+14;if(group.length&&natural+width>available)break;group.push(number);natural+=width;number++;if(layout.systemBreaks.includes(number-1))break;}
    if(systemHeight>size.height-margin*2-90)throw new Error('Les voix et couplets ne tiennent pas sur une page. Réduisez l’espace des voix ou choisissez un format plus grand.');
    if(pageY+systemHeight>size.height-margin-30){page=newPage();pageY=margin+layout.titleSize+85;}
    const scale=Math.min(1,available/natural);if(scale<.5)throw new Error('Mesure trop dense pour cette page. Réduisez la taille ou choisissez le paysage.');
    const extra=scale===1&&(number<=last||group.length===(layout.measuresPerSystem||group.length))?(available-natural)/group.length:0,system:ScoreSystem={index:doc.systems.length,page:page.index,first:group[0],last:group.at(-1)!,x:margin,y:pageY,width:available+gutter,height:systemHeight,measures:[],ops:[]};
    project.tracks.forEach((track,ti)=>putText(system.ops,track.shortName,margin+5,pageY+35+voiceY[ti]+layout.noteSize,12));let x=margin+gutter;
    for(const bar of group){const m=measureAt(project,bar),geometry=geometries.get(bar)!,width=(geometry.width+14)*scale+extra,localScale=(width-14)/geometry.width,y=pageY+35,barHeight=musicHeight-8;const position:EngravedMeasure={number:bar,x,y,width,height:barHeight,geometry,scale:localScale};system.measures.push(position);
      putText(system.ops,String(bar)+(bar===1&&project.settings.pickupBeats?' · levée':''),x+3,pageY+25,9,'#77717d');line(system.ops,x,y,x,y+barHeight,.9);
      const annotations=[...project.markers.filter(marker=>marker.measure===bar).map(marker=>marker.label),...project.indications.filter(i=>i.measure===bar&&!i.trackId).map(i=>i.text),...project.tempoMap.filter(t=>t.measure===bar).map(t=>tempoLabel(project.settings.tempoUnit)+' = '+Number((t.bpm/unitBeats(project.settings.tempoUnit)).toFixed(2))),...project.signatureMap.filter(s=>s.measure===bar).map(s=>s.signature)];putText(system.ops,annotations.join(' · '),x+3,pageY+9,10);
      for(let ti=0;ti<project.tracks.length;ti++){
        const track=project.tracks[ti],baseline=y+voiceY[ti]+layout.noteSize,cells=layoutMeasure(project,ti,bar-1,geometry.width,geometry);
        cells.forEach((cell,ci)=>{const px=x+6+cell.x*localScale,text=cell.symbols.join('/').replaceAll('–','-');putText(system.ops,text,px,baseline,layout.noteSize*scale,cell.kind==='rest'?'#96909b':'#26232d',cell.noteIds,cell.beat);if(ci<cells.length-1){const next=cells[ci+1],middle=m.groups.slice(0,-1).reduce<number[]>((result,n)=>[...result,(result.at(-1)??0)+n],[]).some(n=>Math.abs(next.beat-m.start-n*m.pulse)<.0001);putText(system.ops,middle?'|':':',x+next.x*localScale-3,baseline,layout.noteSize*.65*scale,'#a49dab');}});
        const lyrics=lyricLines(project,track.id);lyrics.forEach((l,li)=>{const lyricY=baseline+layout.lyricSize+6+li*(layout.lyricSize+6);if(bar===group[0])putText(system.ops,l.kind==='refrain'?'R.':l.kind==='common'?'':String(l.verse??1)+'.',margin+25,lyricY,8,'#77717d');
          for(const s of l.syllables){const ids=s.noteIds??(s.noteId?[s.noteId]:[]),notes=ids.map(key=>noteIndex.get(key)).filter((n):n is NonNullable<typeof n>=>!!n);if(!notes.length)continue;const start=Math.min(...notes.map(noteStart)),end=Math.max(...notes.map(n=>noteStart(n)+noteDuration(n)));const sx=x+6+beatToScoreX(geometry,Math.max(m.start,start))*localScale,ex=x+beatToScoreX(geometry,Math.min(m.end,end))*localScale;
            if(start>=m.start-1e-7&&start<m.end-1e-7){putText(system.ops,s.text+(s.hyphenAfter?'-':''),sx,lyricY,layout.lyricSize*scale);if(ids.length>1&&ex>sx+textWidth(s.text,layout.lyricSize*scale)+9)line(system.ops,sx+textWidth(s.text,layout.lyricSize*scale)+4,lyricY+2,ex,lyricY+2,.65,'#8d8492');}else if(ids.length>1&&start<m.start&&end>m.start)line(system.ops,x+6,lyricY+2,ex,lyricY+2,.65,'#8d8492');
          }
        });project.indications.filter(i=>i.measure===bar&&i.trackId===track.id).forEach(i=>putText(system.ops,i.text,x+6,baseline-20,9));
      }
      let cursor=0;for(const groupSize of m.groups.slice(0,-1)){cursor+=groupSize;const gx=x+beatToScoreX(geometry,m.start+cursor*m.pulse)*localScale;line(system.ops,gx,y,gx,y+barHeight,.35,'#ded9e2');}
      const repeatStart=project.repeats.find(r=>r.startMeasure===bar),repeatEnd=project.repeats.find(r=>r.endMeasure===bar);if(repeatStart){line(system.ops,x+3,y,x+3,y+barHeight,1.7);project.tracks.forEach((_,ti)=>{for(const dy of [-4,4])system.ops.push({kind:'circle',x:x+8,y:y+voiceY[ti]+layout.noteSize-5+dy,radius:1.3});});}if(repeatEnd){line(system.ops,x+width-3,y,x+width-3,y+barHeight,1.7);putText(system.ops,'×'+repeatEnd.times,x+width-24,pageY+25,9);project.tracks.forEach((_,ti)=>{for(const dy of [-4,4])system.ops.push({kind:'circle',x:x+width-9,y:y+voiceY[ti]+layout.noteSize-5+dy,radius:1.3});});}
      for(const r of project.repeats){const firstEnd=r.firstEndingStart!==undefined&&bar>=r.firstEndingStart&&bar<=r.endMeasure,secondEnd=r.secondEndingEnd!==undefined&&bar>r.endMeasure&&bar<=r.secondEndingEnd;if(firstEnd||secondEnd){line(system.ops,x,pageY+14,x+width,pageY+14,.6);if(bar===(firstEnd?r.firstEndingStart:r.endMeasure+1)){line(system.ops,x,pageY+14,x,pageY+22,.6);putText(system.ops,firstEnd?(r.times>2?'1-'+(r.times-1):'1')+'.':'2.',x+3,pageY+12,9);}}}
      x+=width;line(system.ops,x,y,x,y+barHeight,.9);
    }
    page.ops.push(...system.ops);page.systems.push(system);doc.systems.push(system);pageY+=systemHeight+layout.systemGap;
  }
  for(const p of doc.pages){putText(p.ops,'SORATRO  ·  Solfa',margin,size.height-margin+10,8,'#8d8492');if(layout.pageNumbers){const text=(p.index+1)+' / '+doc.pages.length;putText(p.ops,text,size.width-margin-textWidth(text,9),size.height-margin+10,9,'#77717d');}}
  return doc;
}
function escapeXML(value:string){return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));}
const number=(v:number)=>Number(v.toFixed(3));
export function pageSVG(page:ScorePage,fontBase64?:string):string {
  const font=fontBase64?'@font-face{font-family:SoratroPrint;src:url(data:font/ttf;base64,'+fontBase64+') format("truetype");}':'';
  const ops=page.ops.map(op=>op.kind==='text'?`<text x="${number(op.x)}" y="${number(op.y)}" font-size="${number(op.size)}" fill="${op.color??'#26232d'}"${op.noteIds?.length?' data-note-id="'+escapeXML(op.noteIds[0])+'"':''}${op.beat!==undefined?' data-score-beat="'+op.beat+'"':''}>${escapeXML(op.text)}</text>`:op.kind==='line'?`<line x1="${number(op.x)}" y1="${number(op.y)}" x2="${number(op.x2)}" y2="${number(op.y2)}" stroke="${op.color??'#37333e'}" stroke-width="${number(op.width)}"/>`:`<circle cx="${number(op.x)}" cy="${number(op.y)}" r="${op.radius}" fill="${op.color??'#37333e'}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${number(page.width)}" height="${number(page.height)}" viewBox="0 0 ${number(page.width)} ${number(page.height)}"><style>${font}text{font-family:SoratroPrint,DejaVu Sans,sans-serif;font-kerning:none;font-variant-ligatures:none;}</style><rect width="100%" height="100%" fill="#fff"/>${ops}</svg>`;
}
export function systemPage(page:ScorePage,system:ScoreSystem):ScorePage {const margin=20;return {...page,width:system.width+margin*2,height:system.height+margin*2,widthMm:(system.width+margin*2)/PX_PER_MM,heightMm:(system.height+margin*2)/PX_PER_MM,ops:system.ops.map(op=>({...op,x:op.x-system.x+margin,y:op.y-system.y+margin,...(op.kind==='line'?{x2:op.x2-system.x+margin,y2:op.y2-system.y+margin}:{})})),systems:[system]};}
