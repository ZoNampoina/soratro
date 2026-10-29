/** Deterministic PCM; no claim of a real saxophone or singer recording. */
export function referenceWav(duration=3){
 const rate=16000,length=Math.ceil(duration*rate),bytes=new Uint8Array(44+length*2),view=new DataView(bytes.buffer),text=(at:number,s:string)=>{for(let i=0;i<s.length;i++)bytes[at+i]=s.charCodeAt(i);};
 text(0,'RIFF');view.setUint32(4,36+length*2,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,length*2,true);
 for(const [start,end,pitch] of [[.2,.9,69],[1.1,1.5,72],[1.7,2.5,81]])for(let i=Math.round(start*rate);i<Math.min(length,end*rate);i++){const time=i/rate,env=Math.min(1,(time-start)*100,(end-time)*100),phase=2*Math.PI*440*Math.pow(2,(pitch-69)/12)*time;view.setInt16(44+i*2,Math.round(env*(.3*Math.sin(phase)+.08*Math.sin(phase*2))*32767),true);}
 return bytes;
}
