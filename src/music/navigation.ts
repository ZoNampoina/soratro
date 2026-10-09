import type {Project,MusicalIndication,NavigationSymbol} from './model.ts';
export const NAVIGATION_LABELS:Record<NavigationSymbol,string>={segno:'Segno',coda:'Coda','to-coda':'To Coda',fine:'Fine',dc:'D.C.','dc-fine':'D.C. al Fine','dc-coda':'D.C. al Coda',ds:'D.S.','ds-fine':'D.S. al Fine','ds-coda':'D.S. al Coda'};
export interface NavigationProblem {id:string;measure:number;message:string}
export function navigationProblems(p:Project):NavigationProblem[]{
  const nav=p.indications.filter(i=>i.kind==='navigation'),errors:NavigationProblem[]=[];
  const target=(i:MusicalIndication,symbol:NavigationSymbol)=>nav.find(n=>n.symbol===symbol&&(!i.targetId||n.id===i.targetId));
  for(const i of nav){const s=i.symbol;if(!s||!NAVIGATION_LABELS[s]){errors.push({id:i.id,measure:i.measure,message:'Signe de navigation inconnu.'});continue;}
    if(s.startsWith('ds')&&!target(i,'segno'))errors.push({id:i.id,measure:i.measure,message:'D.S. sans Segno correspondant.'});
    if(s.endsWith('fine')&&!nav.some(n=>n.symbol==='fine'&&n.measure<=i.measure&&n.measure>=(s.startsWith('ds')?(target(i,'segno')?.measure??1):1)))errors.push({id:i.id,measure:i.measure,message:'Renvoi al Fine sans Fine sur le parcours.'});
    if(s.endsWith('coda')&&s!=='to-coda'&&(!nav.some(n=>n.symbol==='to-coda'&&n.measure<=i.measure&&n.measure>=(s.startsWith('ds')?(target(i,'segno')?.measure??1):1))||!nav.some(n=>n.symbol==='coda')))errors.push({id:i.id,measure:i.measure,message:'Renvoi al Coda : To Coda ou destination Coda manquant.'});
    if(s==='to-coda'&&!target(i,'coda'))errors.push({id:i.id,measure:i.measure,message:'To Coda sans destination Coda.'});
    if(s.startsWith('ds')&&target(i,'segno')&&target(i,'segno')!.measure>i.measure)errors.push({id:i.id,measure:i.measure,message:'Le Segno doit précéder le renvoi D.S.'});
    if(s==='to-coda'&&target(i,'coda')&&target(i,'coda')!.measure<=i.measure)errors.push({id:i.id,measure:i.measure,message:'La destination Coda doit suivre le signe To Coda.'});
  }return errors;
}
/** Resolve jumps at bar ends; repeats play on the first pass and are omitted after D.C./D.S. */
export function applyNavigation(p:Project,initialOrder:number[],count:number):number[]{
  const nav=p.indications.filter(i=>i.kind==='navigation');if(!nav.length)return initialOrder;
  const problems=navigationProblems(p);if(problems.length)throw new Error(problems[0].message);
  const result:number[]=[],executed=new Set<string>();let order=initialOrder,index=0,ending:'fine'|'coda'|'end'|null=null;
  while(index<order.length){if(result.length>=100000)throw new Error('Parcours musical trop long ou boucle de renvois.');const number=order[index++];result.push(number);
    const signs=nav.filter(i=>i.measure===number);
    if((ending==='fine'||!nav.some(i=>i.symbol?.startsWith('dc')||i.symbol?.startsWith('ds')))&&signs.some(i=>i.symbol==='fine'))break;
    if(ending==='coda'){
      const to=signs.find(i=>i.symbol==='to-coda');if(to){const destination=nav.find(i=>i.symbol==='coda'&&(!to.targetId||i.id===to.targetId))!;order=Array.from({length:Math.max(0,count-destination.measure+1)},(_,n)=>n+destination.measure);index=0;ending='end';continue;}
    }
    const jump=signs.find(i=>i.symbol&&(i.symbol.startsWith('dc')||i.symbol.startsWith('ds'))&&!executed.has(i.id));
    if(jump){executed.add(jump.id);const symbol=jump.symbol!;const destination=symbol.startsWith('dc')?1:nav.find(i=>i.symbol==='segno'&&(!jump.targetId||i.id===jump.targetId))!.measure;
      order=Array.from({length:count-destination+1},(_,n)=>n+destination);index=0;ending=symbol.endsWith('fine')?'fine':symbol.endsWith('coda')?'coda':'end';
    }
  }return result;
}
