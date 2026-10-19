/** Local, reproducible printed fixtures; optionally measures a private reference without publishing it. */
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
const output=process.env.SORATRO_SCAN_QA_DIR||'tmp/scan-benchmark';await mkdir(output,{recursive:true});
const port=4188,base=`http://127.0.0.1:${port}`,server=spawn('npm',['run','dev','--','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'});let browser;
try{
 for(let i=0;i<150;i++){try{if((await fetch(base+'/tests/browser.html')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.SORATRO_CHROMIUM_PATH||undefined,args:['--no-sandbox']});const page=await browser.newPage();await page.goto(base+'/tests/browser.html');
 const report=await page.evaluate(async()=>{
  const {glyphTemplates}=await import('/src/recognition/templates.ts'),{preparePixels,deskewAngle}=await import('/src/recognition/image-processing.ts'),{recognizePrinted}=await import('/src/recognition/printed-engine.ts'),{newScanSession,DEFAULT_PREPARATION}=await import('/src/recognition/types.ts'),{convertScan,splitBars}=await import('/src/recognition/music.ts');
  const templates=await glyphTemplates(),cases=[
   {name:'Clean SATB, 4/4',signature:'4/4',voices:4,rows:['d:r:m:f','r:m:f:d','m:f:d:r','f:d:r:m'],font:'ScanSans',notes:16},
   {name:'Solo, 2/4',signature:'2/4',voices:1,rows:['d:r'],font:'ScanSans',notes:2},
   {name:'SA, 3/4',signature:'3/4',voices:2,rows:['d:r:m','m:f:s'],font:'ScanSans',notes:6},
   {name:'SATB halves and thirds, 4/4',signature:'4/4',voices:4,rows:Array(4).fill('d:r.m:f,s,l:0'),font:'ScanSans',notes:24},
   {name:'SATB thirds, 6/8',signature:'6/8',voices:4,rows:Array(4).fill('d,r,m:f,s,l'),font:'ScanSans',notes:24},
   {name:'Solo upper octave and rest',signature:'4/4',voices:1,rows:["d':r:m:0"],font:'ScanSerif',notes:3},
   {name:'Solo continuation',signature:'4/4',voices:1,rows:['d:-:s:0'],font:'ScanSans',notes:2},
   {name:'Small italic, 4/4',signature:'4/4',voices:4,rows:Array(4).fill('d:r:m:f'),font:'ScanItalic',size:12,notes:16},
   {name:'Blurred, 4/4',signature:'4/4',voices:4,rows:Array(4).fill('d:r:m:f'),font:'ScanSans',blur:1.1,notes:16},
   {name:'Inclined, 4/4 with deskew',signature:'4/4',voices:4,rows:Array(4).fill('d:r:m:f'),font:'ScanSans',angle:3,notes:16},
   {name:'Touching letters, intentionally ambiguous',signature:'4/4',voices:1,rows:['dr:m:f:s'],font:'ScanSans',glued:true,notes:5},
   {name:'Irregular meter, must remain blocked',signature:'4/4',voices:1,rows:['d:r:m'],font:'ScanSans',notes:3}
  ],results=[];
  const edits=(a,b)=>{let previous=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));previous=next;}return previous[b.length];};
  for(const item of cases){const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=400;let c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,1000,400);c.save();if(item.angle){c.translate(500,200);c.rotate(item.angle*Math.PI/180);c.translate(-500,-200);}c.fillStyle='#000';const size=item.size||20;c.font=size+'px '+item.font;let right=0;
   for(let voice=0;voice<item.voices;voice++){let x=80;const y=75+voice*48;for(const value of item.rows[voice]){c.fillText(value,x,y);x+=c.measureText(value).width+(item.glued?0:Math.max(9,size*.5));}right=Math.max(right,x+15);}c.fillRect(60,48,2,(item.voices-1)*48+45);c.fillRect(right,48,2,(item.voices-1)*48+45);c.restore();
   if(item.blur){const copy=document.createElement('canvas');copy.width=1000;copy.height=400;copy.getContext('2d').drawImage(canvas,0,0);c.filter=`blur(${item.blur}px)`;c.drawImage(copy,0,0);c.filter='none';}
   const input={width:1000,height:400,data:c.getImageData(0,0,1000,400).data},settings=structuredClone(DEFAULT_PREPARATION);if(item.angle)settings.deskew=deskewAngle(input);const prepared=preparePixels(input,settings),session=newScanSession();Object.assign(session.hints,{tonic:'C',signature:item.signature,voiceCount:item.voices,choir:item.voices===4?'SATB':'Personnalisé',reviewed:true});const start=performance.now(),recognized=recognizePrinted(prepared,templates,session.hints,'synthetic',0);session.rows=recognized.rows.map(r=>({...r,confirmed:true}));const converted=convertScan(session),expected=item.rows.map(s=>'|'+s+'|'),actual=recognized.rows.map(r=>r.text),distance=expected.reduce((n,row,i)=>n+edits(row,actual[i]||''),0)+actual.slice(expected.length).reduce((n,row)=>n+row.length,0);
   results.push({name:item.name,reference:expected,actual,referenceSigns:expected.join('').length,editDistance:distance,rows:{expected:item.voices,actual:actual.length},measureVoiceCells:{expected:item.voices,actual:actual.reduce((n,s)=>n+splitBars(s).length,0)},voicesExact:recognized.rows.length===item.voices&&recognized.rows.every((r,i)=>r.voice===i),notes:{expected:item.notes,actual:converted.project.tracks.reduce((n,t)=>n+t.events.length,0)},rhythmImportableAfterHumanConfirmation:converted.importable,unknown:recognized.unresolved,milliseconds:Math.round(performance.now()-start),deskew:settings.deskew});
  }return {engine:'soratro-glyphs-1',templates:templates.length,scope:'Synthetic controlled fonts, including fonts present in the reference templates; not an independent accuracy corpus. Human confirmation is simulated only after capturing raw recognition.',cases:results};
 });
 const referenceIndex=process.argv.indexOf('--reference');if(referenceIndex>=0){const bytes=await readFile(process.argv[referenceIndex+1]);report.privateReference=await page.evaluate(async data=>{const {blobPixels}=await import('/src/recognition/documents.ts'),{preparePixels}=await import('/src/recognition/image-processing.ts'),{glyphTemplates}=await import('/src/recognition/templates.ts'),{recognizePrinted}=await import('/src/recognition/printed-engine.ts'),{newScanSession,DEFAULT_PREPARATION}=await import('/src/recognition/types.ts'),{parseMusicRow}=await import('/src/recognition/music.ts');const input=await blobPixels(await (await fetch('data:image/jpeg;base64,'+data)).blob()),settings={...DEFAULT_PREPARATION,flatten:true,contrast:1.2},s=newScanSession();s.hints.tonic='Bb';const start=performance.now(),r=recognizePrinted(preparePixels(input,settings),await glyphTemplates(),s.hints,'private',0);return {pixels:[input.width,input.height],rows:r.rows.length,barLines:r.barLines,unknown:r.unresolved,milliseconds:Math.round(performance.now()-start),signature:'Not asserted: no validated complete transcription reference.',completeMusicalAccuracy:'Not measured. Source requires assisted correction; no automatic import.'};},bytes.toString('base64'));report.privateReference.sha256=createHash('sha256').update(bytes).digest('hex');}
 await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 if(report.cases[0].editDistance!==0||report.cases[0].notes.actual!==16)throw new Error('The clean controlled SATB reference regressed.');
}finally{await browser?.close();server.kill();setTimeout(()=>process.exit(process.exitCode||0),100);}
