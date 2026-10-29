/** Local WSOLA: preserve waveform periods instead of resampling pitches.
 * Both stereo channels use the same correlation offset. No third-party DSP. */
export function stretchChannels(input:Float32Array[],outputLength:number,sampleRate:number):Float32Array[]{
 const length=input[0]?.length??0;outputLength=Math.max(1,Math.round(outputLength));
 if(!length)return input.map(()=>new Float32Array(outputLength));
 if(Math.abs(outputLength-length)<2)return input.map(c=>c.slice());
 const factor=outputLength/length;if(factor<.125||factor>8)throw new Error('Écart de tempo trop important : rapprochez le BPM ou ajoutez des ancrages.');
 const size=Math.min(length,Math.max(128,Math.round(sampleRate*.04))),hop=Math.max(1,Math.floor(size/2)),overlap=size-hop,search=Math.round(sampleRate*.008);
 const result=input.map(()=>new Float32Array(outputLength)),weights=new Float32Array(outputLength),window=Float32Array.from({length:size},(_,i)=>Math.sin(Math.PI*(i+.5)/size)**2);
 let previous=0;
 for(let out=0;out<outputLength;out+=hop){
  const expected=Math.round(out/factor);let chosen=Math.min(Math.max(0,expected),Math.max(0,length-size));
  if(out&&length>size){let best=-Infinity;const lo=Math.max(0,expected-search),hi=Math.min(length-size,expected+search),channel=input[0];
   const correlation=(at:number)=>{let xy=0,xx=1e-12,yy=1e-12;for(let j=0;j<overlap;j+=8){const x=channel[Math.min(length-1,previous+hop+j)]??0,y=channel[at+j];xy+=x*y;xx+=x*x;yy+=y*y;}return xy/Math.sqrt(xx*yy)-Math.abs(at-expected)*1e-7;};
   for(let at=lo;at<=hi;at+=16){const score=correlation(at);if(score>best){best=score;chosen=at;}}
   const coarse=chosen;for(let at=Math.max(lo,coarse-16);at<=Math.min(hi,coarse+16);at+=2){const score=correlation(at);if(score>best){best=score;chosen=at;}}
  }
  const count=Math.min(size,outputLength-out,length-chosen);
  for(let i=0;i<count;i++){const w=window[i];weights[out+i]+=w;for(let c=0;c<input.length;c++)result[c][out+i]+=input[c][chosen+i]*w;}
  previous=chosen;
 }
 for(let i=0;i<outputLength;i++)if(weights[i]>1e-9)for(const c of result)c[i]/=weights[i];
 return result;
}
