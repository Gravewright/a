// AGPL-3.0-only. Adapt Gravewright's authoritative dice facts, not expressions/RNG.
import {SUPPORTED} from './geometry.js';
export function notation(message) {
 const roll=message?.roll;if(!roll)return [];
 const results=roll.batch?.map(b=>b.result) ?? [roll.result],out=[];
 for(const result of results) for(const pool of result?.rolls ?? []) {
  const initial=pool.plan?.initial;
  for(const fact of pool.facts ?? []) {
   const definition=initial?.definition?.dice?.find(d=>d.id===fact.dieId);
   const labels=definition?.faces?.map(f=>f.value);
   const sides=initial?.sides ?? labels?.length;
   const discarded=pool.selection?.[fact.id]==='discarded';
   if(sides===100) {
    out.push({sides:10,value:Math.floor((Number(fact.face)%100)/10)*10,labels:[10,20,30,40,50,60,70,80,90,0],percentile:true,discarded});
    out.push({sides:10,value:Number(fact.face)%10,labels:[1,2,3,4,5,6,7,8,9,0],discarded});
   } else if(SUPPORTED.includes(sides))out.push({sides,value:fact.face,labels,discarded});
  }
 }
 return out;
}
export const DEFAULTS=Object.freeze({diceColor:'#b99754',textColor:'#171b20',font:'atkinsonhyperlegible'});
export const FONTS=Object.freeze({atkinsonhyperlegible:'Atkinson Hyperlegible',notosans:'Noto Sans',notoserif:'Noto Serif',ibmplexmono:'IBM Plex Mono',montserrat:'Montserrat'});
export function preferences(value) {
 const color=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
 return {diceColor:color(value?.diceColor)?value.diceColor:DEFAULTS.diceColor,textColor:color(value?.textColor)?value.textColor:DEFAULTS.textColor,font:Object.hasOwn(FONTS,value?.font)?value.font:DEFAULTS.font};
}
