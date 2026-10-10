import {LocalPitchDetector} from './pitch';
import {vocalSettings,type VocalSettings} from './types';
let settings:VocalSettings=vocalSettings();const detector=new LocalPitchDetector();
self.onmessage=(event:MessageEvent)=>{if(event.data.settings){settings=event.data.settings;return;}const {samples,sampleRate,time}=event.data;try{self.postMessage({frame:detector.analyze(samples,sampleRate,time,settings)});}catch{self.postMessage({error:'Analyse vocale interrompue.'});}};
