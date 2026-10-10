import type {Project,TempoUnit} from './model.ts';
import {unitBeats} from './timeline.ts';
export interface TapOptions {minBpm:number;maxBpm:number;pauseMs:number}
export interface TapResult {bpm:number;stable:boolean;taps:number;acceptedIntervals:number;spread:number}
const median=(values:number[])=>{const sorted=values.slice().sort((a,b)=>a-b),i=Math.floor(sorted.length/2);return sorted.length%2?sorted[i]:(sorted[i-1]+sorted[i])/2;};
export class TapTempoEstimator {
 private taps:number[]=[];options:TapOptions;
 constructor(options:Partial<TapOptions>={}){this.options={minBpm:30,maxBpm:240,pauseMs:4000,...options};if(!Number.isFinite(this.options.minBpm)||!Number.isFinite(this.options.maxBpm)||this.options.minBpm<20||this.options.maxBpm>300||this.options.maxBpm<=this.options.minBpm||this.options.pauseMs<2000)throw new Error('Plage Tap invalide.');}
 reset(){this.taps=[];}
 tap(timeMs:number):TapResult|null{
  if(!Number.isFinite(timeMs))throw new Error('Horodatage Tap invalide.');const previous=this.taps.at(-1);if(previous!==undefined){if(timeMs<=previous||timeMs-previous<60000/this.options.maxBpm*.45)return this.result();if(timeMs-previous>this.options.pauseMs)this.reset();}
  this.taps.push(timeMs);if(this.taps.length>10)this.taps.shift();return this.result();
 }
 private result():TapResult|null{
  if(this.taps.length<3)return null;const intervals=this.taps.slice(1).map((t,i)=>t-this.taps[i]).filter(n=>n>=60000/this.options.maxBpm&&n<=60000/this.options.minBpm);if(intervals.length<2)return null;const center=median(intervals),accepted=intervals.filter(n=>Math.abs(n-center)/center<=.25);if(accepted.length<2)return null;const period=median(accepted),deviation=median(accepted.map(n=>Math.abs(n-period)))/period,bpm=Math.max(this.options.minBpm,Math.min(this.options.maxBpm,60000/period));return {bpm:Number(bpm.toFixed(1)),stable:accepted.length>=3&&deviation<.04,taps:this.taps.length,acceptedIntervals:accepted.length,spread:deviation};
 }
}
export function internalTapTempo(bpm:number,unit:TempoUnit){const internal=bpm*unitBeats(unit);if(!Number.isFinite(internal)||internal<10||internal>600)throw new Error('Tempo hors de la plage musicale.');return internal;}
export function applyTapTempo(p:Project,internal:number,scope:'project'|'measure',measure:number){if(!Number.isFinite(internal)||internal<10||internal>600)throw new Error('Tempo invalide.');if(scope==='project')p.tempo=internal;else {if(!Number.isInteger(measure)||measure<1)throw new Error('Mesure invalide.');p.tempoMap=p.tempoMap.filter(t=>t.measure!==measure);p.tempoMap.push({measure,bpm:internal});}}
