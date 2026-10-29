export interface AudioAnchor {id:string;audioTime:number;beat:number}
/** Metadata only. The untouched source remains in soratro-audio IndexedDB. */
export interface ReferenceAudio {
 id:string;name:string;mime:string;bytes:number;duration:number;capturedAt:string;
 mode:'audio'|'score';bpm:number;anchors:AudioAnchor[];offsetMs:number;
 volume:number;mute:boolean;solo:boolean;speed:number;region:{start:number;end:number};
}
export function validateReference(r:ReferenceAudio){
 if(!r||typeof r!=='object'||typeof r.id!=='string'||!r.id||r.id.length>200||typeof r.name!=='string'||r.name.length>500||typeof r.mime!=='string'||r.mime.length>120||!Number.isFinite(Date.parse(r.capturedAt)))throw new Error('Référence audio invalide.');
 for(const [key,min,max] of [['duration',.001,900],['bytes',1,80*1024*1024],['bpm',10,600],['offsetMs',-900000,900000],['volume',0,1],['speed',25,200]] as const)if(!Number.isFinite(r[key])||r[key]<min||r[key]>max)throw new Error('Réglage audio invalide : '+key);
 if(!['audio','score'].includes(r.mode)||typeof r.mute!=='boolean'||typeof r.solo!=='boolean'||!r.region||!Number.isFinite(r.region.start)||!Number.isFinite(r.region.end)||r.region.start<0||r.region.end>r.duration+.001||r.region.end<=r.region.start)throw new Error('Région audio invalide.');
 if(!Array.isArray(r.anchors)||!r.anchors.length||r.anchors.length>1000)throw new Error('Ajoutez au moins un point d’ancrage.');
 const ids=new Set<string>();let beat=-Infinity,time=-Infinity;
 for(const a of r.anchors){if(typeof a.id!=='string'||!a.id||a.id.length>200||ids.has(a.id)||!Number.isFinite(a.beat)||a.beat<0||a.beat>1000000||!Number.isFinite(a.audioTime)||a.audioTime<0||a.audioTime>r.duration||a.beat<=beat||a.audioTime<=time)throw new Error('Les ancrages doivent avancer dans le même ordre, sans doublon ni croisement.');ids.add(a.id);beat=a.beat;time=a.audioTime;}
}
