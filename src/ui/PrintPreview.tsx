import {useEffect,useMemo,useRef,useState} from 'react';
import {Download,Printer,Settings2} from 'lucide-react';
import type {PageSettings,Project} from '../music/model';
import {engraveProject,pageSVG,systemPage,type ScorePage} from '../score/engraving';
import {DEFAULT_SOLFA,type SolfaDisplay} from '../score/display';
import {measureCount} from '../music/timeline';
import {checkScore} from '../score/checker';
import {store} from '../storage/store';
import {saveFile,shareFile,blobBase64} from '../platform/files';
import {isAndroid,AndroidFiles} from '../platform/native';
import {DEFAULT_SCORE,normalizeScore,clamp} from '../storage/ui-preferences';
import {usePreference,flushPreferences} from './usePreference';
import {SolfaScore} from './SolfaScore';
import {Dialog} from './Dialog';
interface ExportPreferences {
  format:'pdf'|'png'|'svg';scope:'document'|'page'|'system'|'measures';
  page:number;system:number;first:number;last:number;colors:boolean;params:boolean;width:number;height:number;
}
const DEFAULT_EXPORT:ExportPreferences={format:'pdf',scope:'document',page:0,system:0,first:1,last:4,colors:false,params:true,width:1120,height:760};
function normalizeExport(input:unknown):ExportPreferences {
  const p=(input??{}) as Partial<ExportPreferences>,number=(n:unknown,fallback:number,min:number,max:number)=>typeof n==='number'&&Number.isFinite(n)?clamp(n,min,max):fallback;
  return {format:['pdf','png','svg'].includes(p.format??'')?p.format!:'pdf',scope:['document','page','system','measures'].includes(p.scope??'')?p.scope!:'document',
    page:Math.floor(number(p.page,0,0,10000)),system:Math.floor(number(p.system,0,0,10000)),first:Math.floor(number(p.first,1,1,10000)),last:Math.max(Math.floor(number(p.first,1,1,10000)),Math.floor(number(p.last,4,1,10000))),
    colors:typeof p.colors==='boolean'?p.colors:false,params:typeof p.params==='boolean'?p.params:true,width:number(p.width,1120,400,1600),height:number(p.height,760,300,1200)};
}
export function PrintPreview({project,notice,onClose,display=DEFAULT_SOLFA}:{project:Project;notice:(s:string)=>void;onClose:()=>void;display?:SolfaDisplay}){
  const [settings,setSettings]=usePreference('export-v1',{...DEFAULT_EXPORT,params:window.innerWidth>760},normalizeExport);
  const [previewView]=usePreference('export-score-v1',{...DEFAULT_SCORE,fit:'page'},normalizeScore);
  const [draft,setDraft]=useState(()=>structuredClone(project.layout));
  const previewProject=useMemo(()=>({...project,layout:draft}),[project,draft]);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const root=useRef<HTMLDivElement>(null),alive=useRef(true);
  const fullResult=useMemo(()=>{try{return {full:engraveProject(previewProject,undefined,display,settings.colors),error:''};}catch(e){return {full:null,error:e instanceof Error?e.message:'Mise en page impossible.'};}},[previewProject,display,settings.colors]);
  const result=useMemo(()=>{
    try {
      if(!fullResult.full)throw new Error(fullResult.error);const full=fullResult.full;
      let doc=full;
      if(settings.scope==='measures')doc=engraveProject(previewProject,{first:settings.first,last:settings.last},display,settings.colors);
      if(settings.scope==='page'){const page=full.pages[Math.min(settings.page,full.pages.length-1)];doc={...full,pages:[page],systems:page.systems};}
      if(settings.scope==='system'){const s=full.systems[Math.min(settings.system,full.systems.length-1)],page=systemPage(full.pages[s.page],s);doc={pages:[page],systems:[s],measureCount:s.last-s.first+1};}
      return {full,doc,error:''};
    } catch(e){return {full:null,doc:null,error:e instanceof Error?e.message:'Mise en page impossible.'};}
  },[fullResult,settings.scope,settings.page,settings.system,settings.first,settings.last]);
  const doc=result.doc;
  const issues=useMemo(()=>checkScore(previewProject,fullResult.full??undefined),[previewProject,fullResult.full]),[ignored,setIgnored]=useState(false);
  useEffect(()=>setIgnored(false),[previewProject]);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{
    const dialog=root.current?.parentElement as HTMLDialogElement|null;if(!dialog)return;
    const remember=()=>{const r=dialog.getBoundingClientRect();setSettings(s=>({...s,width:r.width,height:r.height}));};
    dialog.addEventListener('pointerup',remember);
    return ()=>dialog.removeEventListener('pointerup',remember);
  },[setSettings]);
  function setting<K extends keyof PageSettings>(key:K,value:PageSettings[K]){setDraft(d=>({...d,[key]:value,...(key==='pageNumbers'&&d.footer?{footer:d.footer.map(f=>f.field==='page'||f.field==='pages'?{...f,visible:value as boolean}:f)}:{}),...(key==='titleSize'&&d.header?{header:d.header.map(f=>f.field==='title'?{...f,size:value as number}:f)}:{})}));}
  function applyLayout(){if(!doc)return;store.update(p=>{p.layout=structuredClone(draft);});}
  function close(){void flushPreferences().catch(()=>{});onClose();}
  async function run(fn:()=>Promise<void>){
    if(busy)return;setBusy(true);setError('');
    try{await fn();}catch(e){if(alive.current)setError(e instanceof Error?e.message:'Export impossible. Réessayez.');}
    finally{if(alive.current)setBusy(false);}
  }
  function imagePage():ScorePage{
    if(!doc)throw new Error(result.error);return doc.pages[Math.min(previewView.page,doc.pages.length-1)];
  }
  const base=project.title.replace(/[<>:"/\\|?*]/g,'_').slice(0,80)||'partition';
  async function exportFile(format:ExportPreferences['format'],share=false){
    if(!doc)throw new Error(result.error);
    const {pdfBytes,scoreFonts,svgPNG}=await import('../score/export');
    const font=await scoreFonts(doc);if(!alive.current)return;
    let blob:Blob;
    if(format==='pdf')blob=new Blob([await pdfBytes(doc,font,previewProject)],{type:'application/pdf'});
    else {const svg=pageSVG(imagePage(),font);blob=format==='svg'?new Blob([svg],{type:'image/svg+xml'}):await svgPNG(svg);}
    if(!alive.current)return;
    await (share?shareFile:saveFile)(base+'.'+format,blob);
    applyLayout();if(alive.current)notice(format.toUpperCase()+' exporté'+(format==='pdf'?' : '+doc.pages.length+' page(s).':'.'));
  }
  async function print(){
    if(!doc)return;const {printPages,pdfBytes,scoreFonts}=await import('../score/export');const font=await scoreFonts(doc);if(!alive.current)return;
    if(isAndroid()){const bytes=await pdfBytes(doc,font,previewProject);if(alive.current)await AndroidFiles.print({name:base+'.pdf',base64:await blobBase64(new Blob([bytes],{type:'application/pdf'}))});}
    else await printPages(doc,font);
    applyLayout();
  }
  return <Dialog title="Exporter la partition" className="export-dialog" style={{'--export-width':settings.width+'px','--export-height':settings.height+'px'} as React.CSSProperties} subtitle={settings.format.toUpperCase()+' · '+draft.paper+' '+(draft.orientation==='portrait'?'portrait':'paysage')} onClose={close}>
    <div className={'export-body '+(settings.params?'params-open':'')} ref={root} style={{'--export-width':settings.width+'px','--export-height':settings.height+'px'} as React.CSSProperties}>
      <div className="export-settings-toggle"><button aria-label="Paramètres de l’export" aria-expanded={settings.params} onClick={()=>setSettings(s=>({...s,params:!s.params}))}><Settings2 size={15}/>Paramètres</button><span>{doc?.pages.length??0} page(s) · aperçu fidèle</span></div>
      <aside className="export-settings" aria-label="Réglages de l’export">
        <details className="export-check"><summary>Vérification : {issues.filter(i=>i.severity==='error').length} erreur(s), {issues.filter(i=>i.severity==='warning').length} avertissement(s)</summary><ul>{issues.filter(i=>i.severity!=='info').map(i=><li key={i.id}>M. {i.measure} · {i.message}<small>{i.recommendation}</small></li>)}</ul>{!issues.some(i=>i.severity!=='info')&&<p>Aucune erreur ou collision détectée.</p>}<label className="checkbox-label"><input type="checkbox" checked={ignored} onChange={e=>setIgnored(e.target.checked)}/>J’ai vérifié les avertissements</label><p>Les indications imprimées peuvent être exportées même si elles n’agissent pas sur l’audio.</p></details>
        <label>Format d’export<select value={settings.format} onChange={e=>setSettings(s=>({...s,format:e.target.value as typeof s.format}))}><option value="pdf">PDF vectoriel</option><option value="png">PNG</option><option value="svg">SVG</option></select></label>
        <div className="form-grid"><label>Papier<select aria-label="Papier" value={draft.paper} onChange={e=>setting('paper',e.target.value as PageSettings['paper'])}>{['A4','A5','Letter'].map(s=><option key={s}>{s}</option>)}</select></label><label>Orientation<select aria-label="Orientation" value={draft.orientation} onChange={e=>setting('orientation',e.target.value as PageSettings['orientation'])}><option value="portrait">Portrait</option><option value="landscape">Paysage</option></select></label></div>
        <div className="form-grid"><label>Marges (mm)<input aria-label="Marges (mm)" type="number" min={5} max={50} value={draft.margin} onChange={e=>{const n=+e.target.value;if(n>=5&&n<=50)setting('margin',n);}}/></label><label>Mesures par système<select aria-label="Mesures par système" value={draft.measuresPerSystem} onChange={e=>setting('measuresPerSystem',+e.target.value)}><option value={0}>Auto</option>{[1,2,3,4,5,6,8,12].map(n=><option key={n} value={n}>{n}</option>)}</select></label></div>
        <div className="form-grid">{([['noteSize','Taille Solfa',10,32],['lyricSize','Taille paroles',8,24]] as const).map(([key,label,min,max])=><label key={key}>{label}<input type="number" min={min} max={max} value={draft[key]} onChange={e=>{const n=+e.target.value;if(n>=min&&n<=max)setting(key,n);}}/></label>)}</div>
        <label>Portée de l’export<select value={settings.scope} onChange={e=>setSettings(s=>({...s,scope:e.target.value as typeof s.scope}))}><option value="document">Toute la partition</option><option value="page">Une page</option><option value="system">Un système</option><option value="measures">Plage de mesures</option></select></label>
        {settings.scope==='page'&&<label>Page à exporter<input type="number" min={1} max={result.full?.pages.length??1} value={Math.min(settings.page+1,result.full?.pages.length??1)} onChange={e=>setSettings(s=>({...s,page:clamp(+e.target.value-1,0,(result.full?.pages.length??1)-1)}))}/></label>}
        {settings.scope==='system'&&<label>Système à exporter<input type="number" min={1} max={result.full?.systems.length??1} value={Math.min(settings.system+1,result.full?.systems.length??1)} onChange={e=>setSettings(s=>({...s,system:clamp(+e.target.value-1,0,(result.full?.systems.length??1)-1)}))}/></label>}
        {settings.scope==='measures'&&<div className="form-grid"><label>De la mesure<input type="number" min={1} max={measureCount(project)} value={settings.first} onChange={e=>setSettings(s=>({...s,first:clamp(+e.target.value,1,measureCount(project)),last:Math.max(s.last,+e.target.value)}))}/></label><label>À la mesure<input type="number" min={settings.first} max={measureCount(project)} value={settings.last} onChange={e=>setSettings(s=>({...s,last:clamp(+e.target.value,s.first,measureCount(project))}))}/></label></div>}
        <label className="checkbox-label"><input type="checkbox" checked={settings.colors} onChange={e=>setSettings(s=>({...s,colors:e.target.checked}))}/>Utiliser les couleurs des voix dans l’export</label>
        <details><summary>Réglages avancés</summary><div className="form-grid">{([['voiceGap','Espace des voix',20,70],['systemGap','Espace systèmes',8,80],['titleSize','Taille titre',14,48]] as const).map(([key,label,min,max])=><label key={key}>{label}<input type="number" min={min} max={max} value={draft[key]} onChange={e=>{const n=+e.target.value;if(n>=min&&n<=max)setting(key,n);}}/></label>)}</div><label className="checkbox-label"><input type="checkbox" checked={draft.pageNumbers} onChange={e=>setting('pageNumbers',e.target.checked)}/>Numéros de page</label><label>Sauts après les mesures<input defaultValue={draft.systemBreaks.join(', ')} placeholder="4, 8, 16" onBlur={e=>setting('systemBreaks',e.target.value.split(/[,;\s]+/).filter(Boolean).map(Number).filter(n=>Number.isInteger(n)&&n>0&&n<100000))}/></label></details>
        <p>PDF et impression : les pages de l’aperçu. PNG et SVG : la page affichée. La police est incorporée, y compris hors ligne.</p>
      </aside>
      <section className="export-preview">{result.error?<p role="alert">{result.error}</p>:<SolfaScore project={previewProject} display={display} document={doc!} beat={0} running={false} preview preferenceKey="export-score-v1"/>}</section>
    </div>
    <footer className="export-footer">
      {error&&<p role="alert" className="export-error">{error}</p>}
      <div><button disabled={busy||!doc} onClick={()=>void run(print)}><Printer size={15}/>Imprimer</button><button disabled={busy||!doc} onClick={()=>void run(()=>exportFile('svg'))}>SVG</button><button disabled={busy||!doc} onClick={()=>void run(()=>exportFile('png'))}>PNG</button>{isAndroid()&&<button disabled={busy||!doc} onClick={()=>void run(()=>exportFile(settings.format,true))}>Partager</button>}</div>
<div><button disabled={busy||!doc} onClick={()=>{try{applyLayout();notice("Réglages de page appliqués.");}catch(e){setError(String(e));}}}>Appliquer les réglages</button><button onClick={close}>Annuler</button><button className="primary-button" disabled={busy||!doc} onClick={()=>void run(()=>exportFile(settings.format))}><Download size={15}/>{busy?'Export…':'Exporter '+settings.format.toUpperCase()}</button></div>
    </footer>
  </Dialog>;
}
