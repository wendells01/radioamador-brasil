import {number} from './coaxiais.js';
export const BAND_SOURCE='https://informacoes.anatel.gov.br/legislacao/atos-de-requisitos-tecnicos-de-gestao-do-espectro/2024/1919-ato-926';
// MHz. Classes da Tabela I; não representa autorização de todos os modos em todo o intervalo.
const rows=[
 ['2200 m',.1357,.1378,'ABC'],['630 m',.472,.479,'ABC'],
 ['160 m',1.8,1.85,'ABC'],['160 m',1.85,2,'A'],['80 m',3.5,3.8,'ABC'],['80 m',3.8,4,'A'],
 ['60 m',5.3515,5.3665,'A'],['40 m',7,7.047,'ABC'],['40 m',7.047,7.3,'AB'],['30 m',10.1,10.15,'A'],
 ['20 m',14,14.35,'A'],['17 m',18.068,18.168,'A'],['15 m',21,21.15,'ABC'],['15 m',21.15,21.3,'AB'],['15 m',21.3,21.45,'A'],
 ['12 m',24.89,24.99,'ABC'],['10 m',28,29.7,'ABC'],['6 m',50,54,'ABC'],['2 m',144,148,'ABC'],['1,3 m',220,225,'ABC'],
 ['70 cm',430,440,'ABC'],['33 cm',902,907.5,'ABC'],['33 cm',915,928,'ABC'],['23 cm',1240,1300,'ABC'],['13 cm',2300,2450,'ABC'],
 ['9 cm',3300,3500,'ABC'],['5 cm',5650,5925,'ABC'],['3 cm',10000,10500,'ABC'],['1,2 cm',24000,24250,'ABC'],
 ['6 mm',47000,47200,'ABC'],['4 mm',76000,81500,'ABC'],['2,5 mm',122250,123000,'ABC'],['2 mm',134000,141000,'ABC'],['1 mm',241000,250000,'ABC']
];
export const spectrum=f=>f<.3?'LF':f<3?'MF':f<30?'HF':f<300?'VHF':f<3000?'UHF':f<30000?'SHF':'EHF';
export const BANDS=rows.map(([name,low,high,classes])=>({name,low,high,classes,region:spectrum(low)}));
export function wavelength(f){return 299.792458/number(f,'Frequência',.000001,300000);}
export function filterBands({query='',region='',operator=''}={}){
 const normalize=value=>value.toLocaleLowerCase('pt-BR').replaceAll(',','.').replace(/\s+/g,'');
 const q=normalize(query);
 const numeric=/^\d+(?:\.\d+)?$/.test(q);
 return BANDS.filter(b=>{
  if((region&&b.region!==region)||(operator&&!b.classes.includes(operator)))return false;
  const name=normalize(b.name);
  // A number can name a band (40 m) or locate a frequency in MHz.
  if(numeric)return Number(q)===Number(name.replace(/(?:cm|mm|m)$/,''))||(Number(q)>=b.low&&Number(q)<b.high);
  return `${name} ${b.low} ${b.high}`.includes(q);
 });
}
export function bandAt(f){f=number(f,'Frequência',.000001,300000);return BANDS.filter(b=>f>=b.low&&f<b.high);}
export function bandDescription(b){
 if(b.low<3)return 'CW e digitais estreitos nos segmentos próprios; onda terrestre e ionosfera noturna, com antenas fisicamente exigentes.';
 if(b.low<10)return 'CW, digitais e fonia conforme o segmento; contatos regionais e DX. Absorção diurna costuma ser maior nas faixas baixas.';
 if(b.low<30)return 'CW, digitais e SSB nos segmentos próprios; DX ionosférico varia com horário, caminho e atividade solar.';
 if(b.low<60)return 'Fonia, CW e digitais por segmento; contatos locais, esporádica-E e possíveis aberturas ionosféricas.';
 if(b.low<3000)return 'FM, SSB, CW e digitais por segmento; simplex, repetidoras, satélites e sinais fracos. Relevo e linha de visada pesam no alcance.';
 return 'Micro-ondas: enlaces direcionais, experimentação, satélites onde previstos e sinais fracos. Alinhamento e perdas de alimentação são críticos.';
}
