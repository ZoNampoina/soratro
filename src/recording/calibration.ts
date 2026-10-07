export interface CalibrationResult {valid:boolean;offsetMs:number;compensationMs:number;spreadMs:number;accepted:number;reason:string}
export function estimateLatency(samples:number[]):CalibrationResult{
  const usable=samples.slice(2).filter(x=>Number.isFinite(x)&&Math.abs(x)<=400).sort((a,b)=>a-b);
  if(usable.length<6)return {valid:false,offsetMs:0,compensationMs:0,spreadMs:0,accepted:usable.length,reason:'Au moins huit frappes régulières sont nécessaires.'};
  const median=usable[Math.floor(usable.length/2)];const deviations=usable.map(x=>Math.abs(x-median)).sort((a,b)=>a-b);const mad=deviations[Math.floor(deviations.length/2)];const accepted=usable.filter(x=>Math.abs(x-median)<=Math.max(35,mad*3));const average=accepted.reduce((a,b)=>a+b,0)/accepted.length,spread=Math.sqrt(accepted.reduce((s,x)=>s+(x-average)**2,0)/accepted.length);const valid=accepted.length>=6&&spread<=45&&Math.abs(average)<=250;
  return {valid,offsetMs:Math.round(average),compensationMs:-Math.round(average),spreadMs:Math.round(spread),accepted:accepted.length,reason:valid?'Frappes cohérentes. Cette estimation inclut aussi votre réaction au clic.':'Frappes irrégulières ou décalage trop grand. Refaites le test ; aucune correction n’est appliquée.'};
}
