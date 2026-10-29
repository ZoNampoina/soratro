import {stretchChannels} from './stretch.ts';
import {analyzeMono,estimateTempo} from './transcription.ts';
import type {RenderPiece} from './worker-client.ts';
self.onmessage=e=>{try{
 const m=e.data;
 if(m.kind==='render'){
  const pieces=m.pieces as RenderPiece[],channels=m.channels as Float32Array[],lengths=pieces.map(p=>Math.max(1,Math.round(p.duration*m.sampleRate))),length=lengths.reduce((a,b)=>a+b,0);
  if(length*channels.length>32000000)throw new Error('Audio ralenti trop volumineux en mémoire. Utilisez un passage plus court ou une vitesse plus proche de 100 %.');
  const result=channels.map(()=>new Float32Array(length));let at=0;
  pieces.forEach((p,i)=>{const lo=Math.round(p.start*m.sampleRate),hi=Math.round(p.end*m.sampleRate),output=stretchChannels(channels.map(c=>c.subarray(lo,hi)),lengths[i],m.sampleRate);for(let c=0;c<result.length;c++)result[c].set(output[c],at);at+=lengths[i];self.postMessage({progress:(i+1)/pieces.length});});
  self.postMessage({result},result.map(c=>c.buffer));
 }else if(m.kind==='analyze'){
  const result=analyzeMono(m.samples,m.sampleRate,m.offset,m.options,v=>self.postMessage({progress:v}));self.postMessage({result});
 }else if(m.kind==='tempo')self.postMessage({result:estimateTempo(m.samples,m.sampleRate,m.offset)});
 else throw new Error('Traitement audio inconnu.');
 }catch(error){self.postMessage({error:error instanceof Error?error.message:'Traitement audio impossible.'});}};
