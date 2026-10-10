import {id,type Project,type Contributor,type CreditRole,type CreditSettings,type DocumentLanguage} from '../music/model.ts';
export const CREDIT_ROLES:CreditRole[]=['author','composer','arranger','harmonizer','adapter'];
export const CREDIT_LABELS:Record<CreditSettings['preset'],Record<CreditRole,string>>={
 fr:{author:'Paroles',composer:'Composition',arranger:'Arrangement',harmonizer:'Harmonisation',adapter:'Adaptation'},
 mg:{author:'Tonony',composer:'Feony',arranger:'Fandrindrana',harmonizer:'Fampirindrana',adapter:'Fampifanarahana'},
 short:{author:'P.',composer:'A/C',arranger:'Arr.',harmonizer:'Harm.',adapter:'Ad.'},
 custom:{author:'Paroles',composer:'Composition',arranger:'Arrangement',harmonizer:'Harmonisation',adapter:'Adaptation'}
};
export function projectCredits(p:Project,language:DocumentLanguage='fr'):CreditSettings{
 return p.credits?structuredClone(p.credits):{language,preset:language,labels:{},grouped:true,contributors:([
  {id:'legacy-author',name:p.author,role:'author'},{id:'legacy-composer',name:p.composer,role:'composer'}
 ] as Pick<Contributor,'id'|'name'|'role'>[]).map((c,order)=>({...c,label:'',order,visible:true}))};
}
export function creditLabel(settings:CreditSettings,role:CreditRole){return settings.labels[role]??CREDIT_LABELS[settings.preset][role];}
export function creditLines(p:Project,roles:CreditRole[]=CREDIT_ROLES):string[]{
 const settings=projectCredits(p),contributors=settings.contributors.filter(c=>roles.includes(c.role)&&c.visible&&c.name.trim()).sort((a,b)=>a.order-b.order),groups=new Map<string,string[]>();
 for(const c of contributors){const label=c.label||creditLabel(settings,c.role),key=settings.grouped?label:c.id;const group=groups.get(key)??[];group.push(c.name.trim());groups.set(key,group);}
 return [...groups].map(([key,names])=>{const label=settings.grouped?key:contributors.find(c=>c.id===key)!.label||creditLabel(settings,contributors.find(c=>c.id===key)!.role);return label?label+' : '+names.join(', '):names.join(', ');});
}
export function syncLegacyCredits(p:Project){if(!p.credits)return;for(const role of ['author','composer'] as const)p[role]=p.credits.contributors.filter(c=>c.role===role).sort((a,b)=>a.order-b.order)[0]?.name??'';}
export function setDocumentLanguage(p:Project,language:DocumentLanguage){p.credits=projectCredits(p,language);p.credits.language=language;p.credits.preset=language;}
export function editLegacyCredits(p:Project,author:string,composer:string){p.author=author;p.composer=composer;if(!p.credits)return;for(const role of ['author','composer'] as const){const first=p.credits.contributors.filter(c=>c.role===role).sort((a,b)=>a.order-b.order)[0];if(first)first.name=p[role];else if(p[role])p.credits.contributors.push({id:id(),role,name:p[role],label:'',visible:true,order:p.credits.contributors.length});}}
