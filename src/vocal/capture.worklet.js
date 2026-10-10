/* Audio thread: filtering is upstream, here only bounded capture/downsampling. */
class SoratroCapture extends AudioWorkletProcessor {
 constructor(){super();this.rate=24000;this.phase=0;this.sum=0;this.count=0;this.ring=new Float32Array(2048);this.index=0;this.filled=0;this.hop=0;this.enabled=true;this.port.onmessage=e=>{if(e.data==='stop')this.enabled=false;};}
 process(inputs){if(!this.enabled)return false;const input=inputs[0]?.[0];if(!input)return true;
  for(let i=0;i<input.length;i++){this.sum+=input[i];this.count++;this.phase+=this.rate;if(this.phase<sampleRate)continue;this.phase-=sampleRate;this.ring[this.index]=this.sum/this.count;this.sum=0;this.count=0;this.index=(this.index+1)%2048;this.filled++;this.hop++;
   if(this.filled>=2048&&this.hop>=240){this.hop=0;const samples=new Float32Array(2048);for(let j=0;j<2048;j++)samples[j]=this.ring[(this.index+j)%2048];const time=(currentFrame+i+1)/sampleRate-2047/(2*this.rate);this.port.postMessage({samples,sampleRate:this.rate,time},[samples.buffer]);}
  }return true;
 }
}
registerProcessor('soratro-vocal-capture',SoratroCapture);
