/// <reference lib="webworker" />
import {preparePixels,deskewAngle,type Pixels} from './image-processing';
import {recognizePrinted} from './printed-engine';
self.onmessage=(event:MessageEvent)=>{const {id,operation,input,settings,templates,hints,pageId,revision,regions,previous}=event.data;try{if(operation==='deskew'){self.postMessage({id,value:deskewAngle(input)});return;}const prepared=preparePixels(input as Pixels,settings);if(operation==='prepare'){self.postMessage({id,value:prepared},[prepared.data.buffer]);return;}const value=recognizePrinted(prepared,templates,hints,pageId,revision,regions,previous);self.postMessage({id,value});}catch(e){self.postMessage({id,error:e instanceof Error?e.message:'Analyse locale impossible.'});}};
