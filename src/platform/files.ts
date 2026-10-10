import { isAndroid,AndroidFiles } from './native';
export async function blobBase64(data:Blob):Promise<string>{const bytes=new Uint8Array(await data.arrayBuffer());let binary='';for(let offset=0;offset<bytes.length;offset+=16384)binary+=String.fromCharCode(...bytes.subarray(offset,offset+16384));return btoa(binary);}
export async function saveFile(name:string,data:Blob):Promise<void>{
  if(isAndroid()){await AndroidFiles.save({name,mime:name.endsWith('.soratro')?'application/x-soratro':data.type||'application/octet-stream',base64:await blobBase64(data)});return;}
  const url=URL.createObjectURL(data);const anchor=document.createElement('a');anchor.href=url;anchor.download=name;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export async function shareFile(name:string,data:Blob):Promise<'shared'|'downloaded'|'cancelled'>{
 if(!isAndroid()){
  const file=new File([data],name,{type:data.type});
  if(navigator.share&&navigator.canShare?.({files:[file]})){
   try{await navigator.share({title:'SORATRO · '+name,files:[file]});return 'shared';}
   catch(e){if(e instanceof DOMException&&e.name==='AbortError')return 'cancelled';if(!(e instanceof DOMException&&['NotAllowedError','NotSupportedError'].includes(e.name)))throw e;}
  }
  await saveFile(name,data);return 'downloaded';
 }
 const {Filesystem,Directory}=await import('@capacitor/filesystem'),{Share}=await import('@capacitor/share');const path='exports/'+name;await Filesystem.mkdir({path:'exports',directory:Directory.Cache,recursive:true}).catch(()=>{});const file=await Filesystem.writeFile({path,directory:Directory.Cache,data:await blobBase64(data)});await Share.share({title:'SORATRO · '+name,files:[file.uri],dialogTitle:'Partager la partition'});
 return 'shared';
}
