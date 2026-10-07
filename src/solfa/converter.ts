import { TONICS, type Tonic } from '../music/model.ts';
export interface SolfaNote {degree:number;alteration:-1|0|1;octave:number;syllable:string}
const CHROMATIC: [number,0|1,string][] = [[1,0,'d'],[1,1,'di'],[2,0,'r'],[2,1,'ri'],[3,0,'m'],[4,0,'f'],[4,1,'fi'],[5,0,'s'],[5,1,'si'],[6,0,'l'],[6,1,'li'],[7,0,'t']];
export function convertSolfa(midiPitch:number,tonic:Tonic): SolfaNote {
  const relative=midiPitch-(60+TONICS.indexOf(tonic));
  const octave=Math.floor(relative/12);const [degree,alteration,syllable]=CHROMATIC[((relative%12)+12)%12];
  return {degree,alteration,octave,syllable};
}
export function formatSolfa(note:SolfaNote, upper="'", lower=',') {return note.syllable+(note.octave>0?upper.repeat(note.octave):lower.repeat(-note.octave));}
export function midiToSolfa(midi:number,tonic:Tonic) {return formatSolfa(convertSolfa(midi,tonic));}
