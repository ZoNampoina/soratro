import score from '../assets/ScoreFont.ttf?url';
import sans from '../assets/print/sans-regular.ttf?url';
import serif from '../assets/print/serif-regular.ttf?url';
import italic from '../assets/print/serif-regular-italic.ttf?url';
import {binaryPixels,components,normalizedMask} from './image-processing';
import type {GlyphTemplate,ScanProfile} from './types';
let built:Promise<GlyphTemplate[]>|undefined;
async function referenceTemplates(){
 const fonts=[['ScanSans',sans],['ScanSerif',serif],['ScanItalic',italic],['ScanScore',score]];for(const [name,url] of fonts){const face=await new FontFace(name,`url(${url})`).load();document.fonts.add(face);}

 const canvas=document.createElement('canvas');canvas.width=100;canvas.height=90;const c=canvas.getContext('2d',{willReadFrequently:true})!,templates:GlyphTemplate[]=[];
 for(const name of ['ScanSans','ScanSerif','ScanItalic','ScanScore'])for(const weight of ['normal','bold'])for(const size of [12,20,40])for(const label of ['d','r','m','f','s','l','t','i','a','0','-','/']){
  c.fillStyle='#fff';c.fillRect(0,0,100,90);c.fillStyle='#000';c.font=`${weight} ${size}px ${name}`;c.fillText(label,15,62);
  const binary=binaryPixels({width:100,height:90,data:c.getImageData(0,0,100,90).data}),parts=components(binary);if(!parts.length)continue;const x=Math.min(...parts.map(p=>p.x)),y=Math.min(...parts.map(p=>p.y)),right=Math.max(...parts.map(p=>p.x+p.width)),bottom=Math.max(...parts.map(p=>p.y+p.height)),box={x,y,width:right-x,height:bottom-y};templates.push({label,mask:normalizedMask(binary,box),aspect:box.width/box.height,origin:'classifier'});
 }return templates;
}
export async function glyphTemplates(profile?:ScanProfile){const base=await (built??=referenceTemplates());return [...base,...(profile?.samples??[]).map(s=>({label:s.label,mask:s.mask,aspect:s.aspect,origin:'profile' as const}))];}
