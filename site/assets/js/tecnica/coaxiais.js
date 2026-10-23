// Dados nominais dos produtos identificados, nunca de uma designação RG genérica.
export const VERIFIED = '2026-10-23';
const frequencies = [1,10,50,100,200,400,700,900,1000];
const belden = (id, model, diameter, velocity, bend, construction, values, impedance = 50) => ({
  id, manufacturer:'Belden', model, diameter, velocity, bend, impedance, construction,
  source:`https://catalog.belden.com/techdata/EN/${id}_techdata.pdf`,
  range:[1,values.length === 10 ? 4000 : 1000],
  points:values.map((v,i)=>[frequencies[i] ?? 4000,v / 0.3048]),
  method:'Interpolação log-log entre pontos nominais; conversão exata de dB/100 ft para dB/100 m.',
  conditions:'Linha adaptada; valores nominais, sem tolerância de fabricação ou correção térmica.'
});
const lmr = (size,diameter,velocity,bend,repeated,a,b,conductor) => ({
  id:`lmr${size}`,manufacturer:'Times Microwave',model:`LMR-${size}`,diameter,velocity,bend,repeated,impedance:50,
  construction:`${conductor}; polietileno expandido; fita de alumínio e malha de cobre estanhado; capa PE.`,
  source:`https://timesmicrowave.com/wp-content/uploads/2022/${size===600?'03/lmr-600-coax-cables':'06/lmr-'+size}-datasheet.pdf`,
  range:[30,8000],coefficients:[a,b],method:'A = (a√f + bf) / 0,3048; f em MHz, coeficientes em dB/100 ft.',
  conditions:'Atenuação típica a 25 °C e ROE 1:1. Versão padrão, não UltraFlex.'
});
export const CABLES = [
  belden('8259','RG-58 (8259)',4.90,.66,48,'Cobre estanhado multifilar; PE sólido; malha estanhada 95%; PVC.',[.4,1.5,3.7,5.4,8.1,12.4,17.7,21.1,22.8]),
  belden('9201','RG-58/U (9201)',4.90,.66,49,'Cobre sólido; PE sólido; malha de cobre 80%; PVC.',[.3,1.1,2.5,3.8,5.6,8.4,11.7,13.7,14.5],52),
  belden('9258','RG-8X (9258)',6.15,.82,61,'Cobre multifilar; PE expandido; malha de cobre 95%; PVC.',[.3,.9,2.1,3.1,4.5,6.6,9.1,10.7,11.2]),
  belden('8267','RG-213/U (8267)',10.3,.66,100,'Cobre multifilar; PE sólido; malha de cobre 95%; PVC não contaminante.',[.17,.55,1.3,1.9,2.7,4.1,6.5,7.6,8,21.5]),
  belden('8237','RG-8/U (8237)',10.2,.66,110,'Cobre multifilar; PE sólido; malha de cobre 95%; PVC.',[.2,.6,1.3,1.9,2.8,4.2,5.9,6.9,7.4,23.2]),
  lmr(195,4.95,.80,12.7,50.8,.356859,.000470,'Cobre sólido'),
  lmr(240,6.10,.83,19.1,63.5,.242080,.000330,'Cobre sólido'),
  lmr(400,10.29,.84,25.4,101.6,.122290,.000260,'Alumínio cobreado sólido'),
  lmr(600,14.99,.85,38.1,152.4,.075550,.000260,'Alumínio cobreado sólido')
];
export function number(raw, name, min=0, max=1e9) {
  if (typeof raw !== 'number') {
    if (typeof raw !== 'string' || !/^\d+(?:[.,]\d+)?$/.test(raw.trim())) throw new RangeError(`${name}: informe um número válido, sem separador de milhares.`);
    raw=Number(raw.trim().replace(',','.'));
  }
  if (!Number.isFinite(raw) || raw < min || raw > max) throw new RangeError(`${name}: use um valor entre ${min} e ${max}.`);
  return raw;
}
export function cableById(id) {
  const c=CABLES.find(c=>c.id===id);
  if (!c) throw new RangeError('Cabo não cadastrado.');
  return c;
}
export function attenuation(id, frequency) {
  const c=cableById(id), f=number(frequency,'Frequência',...c.range);
  if(c.coefficients) return (c.coefficients[0]*Math.sqrt(f)+c.coefficients[1]*f)/.3048;
  const exact=c.points.find(p=>p[0]===f); if(exact) return exact[1];
  const i=c.points.findIndex(p=>p[0]>f), [f0,a0]=c.points[i-1], [f1,a1]=c.points[i];
  return a0 * (f/f0)**(Math.log(a1/a0)/Math.log(f1/f0));
}
export function coaxLoss(id, frequency, length, power, additional=0) {
  const a=attenuation(id,frequency), m=number(length,'Comprimento',0,100000), p=number(power,'Potência',0.000001,1e7), extra=number(additional,'Perdas adicionais',0,100);
  const cableDb=a*m/100, totalDb=cableDb+extra;
  const afterCable=p*10**(-cableDb/10), output=afterCable*10**(-extra/10);
  const efficiency=100*10**(-totalDb/10);
  return {id,attenuation:a,cableDb,totalDb,output,lost:p-output,cableLost:p-afterCable,connectorLost:afterCable-output,efficiency,lostPercent:100-efficiency};
}
export function compareCables(ids, frequency, length, power, additional=0, sort='loss') {
  if(!Array.isArray(ids)||new Set(ids).size<2) throw new RangeError('Selecione pelo menos dois cabos.');
  if(!['loss','efficiency'].includes(sort)) throw new RangeError('Ordenação inválida.');
  return [...new Set(ids)].map(id=>coaxLoss(id,frequency,length,power,additional)).sort((a,b)=>sort==='loss'?a.totalDb-b.totalDb:b.efficiency-a.efficiency);
}
