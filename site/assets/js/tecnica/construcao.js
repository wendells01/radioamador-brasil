import {number,cableById} from './coaxiais.js';
export const FLOWER_SOURCE='https://vk2zoi.com/articles/half-wave-flower-pot/';
export const DUAL_SOURCE='https://vk2zoi.com/articles/dual-band-half-wave-flower-pot/';
// Frequências de autorressonância medidas por VK2ZOI para RG58 genérico.
export const CHOKE_REFERENCES=[
 [25,5,150],[25,8,142],[25,9,135],[25,10,129],[25,12,117],[25,15,105],
 [32,4,160],[32,5,136],[32,8,106],[32,9,100],[32,10,95],[32,12,84],[32,15,75],
 [50,5,85],[50,8,65],[50,9,60],[50,10,57],[50,12,52],[50,15,47]
].map(([former,turns,resonance])=>({former,turns,resonance}));
export function flowerpot(model,frequency){
 if(!['half','dual'].includes(model))throw new RangeError('Modelo Flowerpot não documentado.');
 const f=number(frequency,'Frequência de projeto',50,150);
 if(model==='dual'&&f!==146)throw new RangeError('A variante dual-band está disponível somente nas dimensões documentadas do protótipo de 2 m (referência 146 MHz). Não há modelo validado para escalar a manga.');
 const scale=146/f;
 const target=f*.945;
 const candidates=CHOKE_REFERENCES.filter(c=>Math.abs(c.resonance-target)/target<.06).sort((a,b)=>Math.abs(a.resonance-target)-Math.abs(b.resonance-target));
 const choke=f===146?CHOKE_REFERENCES.find(c=>c.former===25&&c.turns===9):candidates[0]??null;
 return {model,frequency:f,upper:457*scale,lower:447*scale,choke,target,
 sleeve:model==='dual'?{top:345,length:235,bottom:324}:null,
 scaled:f!==146};
}
// Geometria apenas: hélice de uma camada com diâmetro interno = diâmetro do suporte.
export function airChoke({cable,frequency,former,turns,spacing=0}){
 const c=cableById(cable),f=number(frequency,'Frequência',.1,3000),d=number(former,'Diâmetro do suporte',1,10000),n=number(turns,'Espiras',1,200),s=number(spacing,'Espaçamento',0,1000);
 if(n*2!==Math.round(n*2))throw new RangeError('Use espiras inteiras ou meias espiras.');
 const radius=(d+c.diameter)/2, pitch=c.diameter+s;
 if(radius<c.bend)throw new RangeError(`Raio da linha central (${radius.toFixed(1)} mm) inferior ao mínimo de instalação do cabo (${c.bend} mm). Aumente o suporte.`);
 return {frequency:f,meanDiameter:d+c.diameter,outerDiameter:d+2*c.diameter,height:n*c.diameter+(n-1)*s,length:n*Math.hypot(Math.PI*(d+c.diameter),pitch)/1000,radius,
 references:CHOKE_REFERENCES.filter(r=>Math.abs(r.resonance-f)/f<.1)};
}
export const FERRITE_SOURCE='https://fair-rite.com/product/round-cable-snap-its-431177081/';
export function ferriteChoke(cable,frequency,count=1){
 const c=cableById(cable),f=number(frequency,'Frequência',1,250),n=number(count,'Quantidade de núcleos',1,100);
 if(!Number.isInteger(n))throw new RangeError('Quantidade de núcleos deve ser inteira.');
 if(c.diameter>25.15)throw new RangeError('O cabo não cabe na abertura mínima documentada.');
 return {model:'Fair-Rite 0431177081',material:'31 (MnZn)',count:n,aperture:25.15,cableDiameter:c.diameter,length:42.95*n,frequency:f};
}
