import { Capacitor,registerPlugin,type PluginListenerHandle } from '@capacitor/core';
export const isAndroid=()=>Capacitor.getPlatform()==='android';
interface NativeFiles {
  open():Promise<{text:string;name:string}>;
  save(options:{name:string;mime:string;base64:string}):Promise<void>;
  print(options:{name:string;base64:string}):Promise<void>;
  consumePending():Promise<{text?:string;name?:string}>;
  addListener(event:'incoming',callback:()=>void):Promise<PluginListenerHandle>;
}
interface NativeMidi {
  list():Promise<{inputs:{id:string;name:string;manufacturer?:string}[]}>;
  open(options:{id:string}):Promise<void>;
  close():Promise<void>;
  addListener(event:'devices',callback:()=>void):Promise<PluginListenerHandle>;
  addListener(event:'data',callback:(data:{id:string;bytes:number[];timestamp:string})=>void):Promise<PluginListenerHandle>;
}
export const AndroidFiles=registerPlugin<NativeFiles>('SoratroFiles');
export const AndroidMidi=registerPlugin<NativeMidi>('SoratroMidi');
