import {id} from '../music/model';
import {DEFAULT_PREPARATION,MAX_SCAN_FILE,MAX_SCAN_TOTAL,MAX_SCAN_PAGES,MAX_WORK_PIXELS,type ScanAsset,type ScanPage} from './types';
import type {Pixels} from './image-processing';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
function imageSize(bytes:Uint8Array):{width:number;height:number}|null {const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),text=(a:number,b:number)=>String.fromCharCode(...bytes.subarray(a,b));if(bytes[0]===137&&text(1,4)==='PNG'&&bytes.length>=24)return {width:v.getUint32(16),height:v.getUint32(20)};if(bytes[0]===255&&bytes[1]===216){let i=2;while(i+9<bytes.length){if(bytes[i]!==255){i++;continue;}const marker=bytes[i+1],length=v.getUint16(i+2);if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker))return {height:v.getUint16(i+5),width:v.getUint16(i+7)};if(length<2)break;i+=2+length;}}if(text(0,4)==='RIFF'&&text(8,12)==='WEBP'&&bytes.length>=30){if(text(12,16)==='VP8X')return {width:1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16),height:1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16)};if(text(12,16)==='VP8L')return {width:1+bytes[21]+((bytes[22]&63)<<8),height:1+(bytes[22]>>6)+(bytes[23]<<2)+((bytes[24]&15)<<10)};if(text(12,16)==='VP8 ')return {width:v.getUint16(26,true)&16383,height:v.getUint16(28,true)&16383};}return null;}
function exifSwaps(bytes:Uint8Array){
 if(bytes[0]!==255||bytes[1]!==216)return false;const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let i=2;
 while(i+12<bytes.length){if(bytes[i]!==255)break;const marker=bytes[i+1],length=v.getUint16(i+2);if(length<2||i+length+2>bytes.length)break;
  if(marker===225&&String.fromCharCode(...bytes.subarray(i+4,i+10))==='Exif\0\0'){const t=i+10,little=v.getUint16(t)===0x4949;if(t+8>bytes.length)return false;const offset=t+v.getUint32(t+4,little);if(offset+2>bytes.length)return false;const count=v.getUint16(offset,little);for(let n=0;n<count;n++){const entry=offset+2+n*12;if(entry+12>bytes.length)break;if(v.getUint16(entry,little)===274)return [5,6,7,8].includes(v.getUint16(entry+8,little));}}
  i+=length+2;
 }return false;
}
function workSize(w:number,h:number){if(!Number.isFinite(w)||!Number.isFinite(h)||w<2||h<2||w*h>40000000||Math.max(w,h)>16000)throw new Error('Image trop grande : choisissez une copie JPEG/PNG de moins de 40 mégapixels. L’original ne sera pas modifié.');const k=Math.min(1,2000/Math.max(w,h),Math.sqrt(MAX_WORK_PIXELS/(w*h)));return {width:Math.max(2,Math.round(w*k)),height:Math.max(2,Math.round(h*k))};}
function canvasBlob(canvas:HTMLCanvasElement){return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Impossible de préparer l’image.')),'image/png'));}
export async function importDocuments(files:File[],sessionId:string,existingPages:number,signal:AbortSignal,progress:(message:string)=>void):Promise<{pages:ScanPage[];assets:ScanAsset[]}>{
 if(!files.length)return {pages:[],assets:[]};if(files.some(f=>!f.size||f.size>MAX_SCAN_FILE)||files.reduce((n,f)=>n+f.size,0)>MAX_SCAN_TOTAL)throw new Error('Limites : 24 Mo par fichier, 96 Mo par session.');
 const pages:ScanPage[]=[],assets:ScanAsset[]=[];
 const check=()=>{signal.throwIfAborted();if(existingPages+pages.length>=MAX_SCAN_PAGES)throw new Error('24 pages maximum par session. Séparez ce document en plusieurs sessions.');};
 for(const file of files){check();progress('Lecture de '+file.name);const sourceId=id(),head=new Uint8Array(await file.slice(0,1024*1024).arrayBuffer()),pdf=String.fromCharCode(...head.subarray(0,5))==='%PDF-';
  if(!pdf&&!imageSize(head))throw new Error('Format non reconnu : utilisez JPG, PNG, WebP ou PDF.');
  assets.push({id:sourceId,sessionId,kind:'source',name:file.name,blob:file,bytes:file.size});
  const add=async(canvas:HTMLCanvasElement,sourcePage:number,originalWidth:number,originalHeight:number)=>{check();signal.throwIfAborted();const blob=await canvasBlob(canvas),rasterId=id();assets.push({id:rasterId,sessionId,kind:'raster',name:file.name+' · page '+sourcePage,blob,bytes:blob.size});pages.push({id:id(),sourceId,rasterId,name:file.name+(pdf?' · '+sourcePage:''),width:canvas.width,height:canvas.height,originalWidth,originalHeight,sourcePage,preparation:structuredClone(DEFAULT_PREPARATION),revision:0,regions:[]});canvas.width=1;canvas.height=1;};
  if(pdf){
   const library=await import('pdfjs-dist');library.GlobalWorkerOptions.workerSrc=pdfWorkerUrl;
   const base=import.meta.env.BASE_URL+'scan-pdf/';const task=library.getDocument({data:new Uint8Array(await file.arrayBuffer()),standardFontDataUrl:base+'standard_fonts/',wasmUrl:base+'wasm/',enableXfa:false,useSystemFonts:false});
   const abort=()=>void task.destroy();signal.addEventListener('abort',abort,{once:true});
   try{const document=await task.promise;if(existingPages+pages.length+document.numPages>MAX_SCAN_PAGES)throw new Error('Ce PDF dépasse la limite de 24 pages par session.');for(let i=1;i<=document.numPages;i++){check();progress(`Conversion PDF · page ${i} / ${document.numPages}`);const page=await document.getPage(i),original=page.getViewport({scale:1.8}),size=workSize(original.width,original.height),viewport=page.getViewport({scale:1.8*size.width/original.width}),canvas=documentCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));await page.render({canvas,viewport}).promise;await add(canvas,i,original.width,original.height);page.cleanup();}}
   catch(e){if(e instanceof Error&&e.name==='PasswordException')throw new Error('PDF protégé : importez une copie déverrouillée.');throw e;}finally{signal.removeEventListener('abort',abort);await task.destroy();}
  }else{
   const dimensions=imageSize(head)!;if(exifSwaps(head))[dimensions.width,dimensions.height]=[dimensions.height,dimensions.width];const size=workSize(dimensions.width,dimensions.height),bitmap=await createImageBitmap(file,{resizeWidth:size.width,resizeHeight:size.height,resizeQuality:'high',imageOrientation:'from-image'});
   try{const canvas=documentCanvas(bitmap.width,bitmap.height),context=canvas.getContext('2d')!;context.fillStyle='#fff';context.fillRect(0,0,bitmap.width,bitmap.height);context.drawImage(bitmap,0,0);await add(canvas,1,dimensions.width,dimensions.height);}finally{bitmap.close();}
  }
 }
 if(assets.reduce((n,a)=>n+a.bytes,0)>MAX_SCAN_TOTAL)throw new Error('Sources et images de travail dépassent 96 Mo. Importez moins de pages.');return {pages,assets};
}
export function documentCanvas(width:number,height:number){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;}
export async function blobPixels(blob:Blob):Promise<Pixels>{const bitmap=await createImageBitmap(blob);try{if(bitmap.width*bitmap.height>MAX_WORK_PIXELS*1.02)throw new Error('Image de travail trop grande. Réimportez le document.');const canvas=documentCanvas(bitmap.width,bitmap.height),context=canvas.getContext('2d',{willReadFrequently:true})!;context.fillStyle='#fff';context.fillRect(0,0,bitmap.width,bitmap.height);context.drawImage(bitmap,0,0);const data=context.getImageData(0,0,bitmap.width,bitmap.height);return {width:bitmap.width,height:bitmap.height,data:data.data};}finally{bitmap.close();}}
export async function pixelsBlob(input:Pixels){const canvas=documentCanvas(input.width,input.height);canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(input.data),input.width,input.height),0,0);return canvasBlob(canvas);}
