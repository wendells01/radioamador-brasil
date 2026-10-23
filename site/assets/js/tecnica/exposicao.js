import {number} from './coaxiais.js';
export const RF_SOURCE='https://informacoes.anatel.gov.br/legislacao/atos-de-requisitos-tecnicos-de-gestao-do-espectro/2023/1914-ato-17865';
// Conversão convencional: ganho relativo ao dipolo de meia onda + 2,15 dB = dBi.
export function gainDbi(raw,unit='dBi'){
 if(!['dBi','dBd'].includes(unit))throw new RangeError('Unidade de ganho inválida.');
 let v=raw;
 if(typeof v==='string'&&/^-?\d+(?:[.,]\d+)?$/.test(v.trim()))v=Number(v.trim().replace(',','.'));
 v=number(v,'Ganho',-30,60);
 return v+(unit==='dBd'?2.15:0);
}
export function radiatedPower({power,loss=0,gain=0,unit='dBi',basis='conducted'}){
 const p=number(power,'Potência',.000001,1e7);
 if(!['conducted','ERP','EIRP'].includes(basis))throw new RangeError('Tipo de potência inválido.');
 if(basis!=='conducted')return {antennaPower:null,eirp:basis==='EIRP'?p:p*10**(.215),erp:basis==='ERP'?p:p/10**(.215),gainDbi:null,loss:null};
 const l=number(loss,'Perdas da linha',0,100),g=gainDbi(gain,unit);
 const antennaPower=p*10**(-l/10),eirp=antennaPower*10**(g/10);
 return {antennaPower,eirp,erp:eirp/10**(.215),gainDbi:g,loss:l};
}
export function exposureBand(frequency){
 const f=number(frequency,'Frequência',1,300000);
 // Tabela D.I usa fronteiras compartilhadas; sem expressões verificadas, não calculamos distância em nenhuma delas.
 return f<=30?'1–30 MHz':f<=400?'30–400 MHz':f<=2000?'400–2.000 MHz':'2.000–300.000 MHz';
}
export function referenceDistance(frequency){
 exposureBand(frequency);
 throw new RangeError('Distância normativa indisponível: as expressões gráficas da Tabela D.I do Subanexo IV não puderam ser verificadas na fonte oficial em manutenção. Nenhuma distância ou conformidade é inferida.');
}
