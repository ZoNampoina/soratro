export interface Voice {release:(at?:number)=>void;stop:()=>void}
export function pianoVoice(context:BaseAudioContext,output:AudioNode,pitch:number,velocity:number,at:number,duration?:number):Voice {
  const frequency=440*Math.pow(2,(pitch-69)/12);
  const fundamental=context.createOscillator();const harmonic=context.createOscillator();const envelope=context.createGain();const overtone=context.createGain();
  fundamental.type='triangle';fundamental.frequency.value=frequency;harmonic.type='sine';harmonic.frequency.value=frequency*2; overtone.gain.value=.13;
  fundamental.connect(envelope);harmonic.connect(overtone).connect(envelope);envelope.connect(output);
  const level=Math.max(.01,Math.min(1,velocity/127))*.30;
  envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(level,at+.005);envelope.gain.exponentialRampToValueAtTime(level*.55,at+.15);envelope.gain.exponentialRampToValueAtTime(.001,at+12);
  fundamental.start(at);harmonic.start(at);let finished=false;let scheduledRelease=false;
  const cleanup=()=>{envelope.disconnect();overtone.disconnect();fundamental.disconnect();harmonic.disconnect();};fundamental.onended=cleanup;
  const release=(when=context.currentTime)=>{if(finished)return;const time=Math.max(at+.006,when);envelope.gain.cancelAndHoldAtTime(time);envelope.gain.exponentialRampToValueAtTime(.0001,time+.12);try{fundamental.stop(time+.14);harmonic.stop(time+.14);}catch{}scheduledRelease=true;};
  const stop=()=>{if(finished)return;finished=true;try{fundamental.stop();harmonic.stop();}catch{};};
  if(duration!==undefined)release(at+Math.max(.025,duration));else {fundamental.stop(at+12.1);harmonic.stop(at+12.1);}
  return {release:(when)=>{if(!scheduledRelease)release(when);else if(when===undefined)stop();},stop};
}
export function clickVoice(context:BaseAudioContext,output:AudioNode,at:number,accent:2|1|0,volume:number) {
  const oscillator=context.createOscillator();const envelope=context.createGain();oscillator.type='sine';oscillator.frequency.value=accent===2?1500:accent===1?1150:850;
  envelope.gain.setValueAtTime(volume*(accent===2?.24:accent===1?.16:.09),at);envelope.gain.exponentialRampToValueAtTime(.0001,at+.035);oscillator.connect(envelope).connect(output);oscillator.start(at);oscillator.stop(at+.045);oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};return oscillator;
}
