import {fmt,esc,table,stats,bar,source} from './ui.js';
import {cableById} from './coaxiais.js';

const caption='Especificações físicas e elétricas';
// Both layouts use these same labels and formatted values from the cable catalog.
export function cableSpecs(c){return [
 ['Diâmetro (mm)',fmt(c.diameter)],
 ['Impedância (Ω)',fmt(c.impedance)],
 ['Fator de velocidade',fmt(c.velocity,3)],
 ['Raio mínimo (mm)',`${fmt(c.bend)} instalação${c.repeated?`; ${fmt(c.repeated)} repetido`:''}`],
 ['Faixa válida (MHz)',`${fmt(c.range[0])}–${fmt(c.range[1])}`]
];}
export function renderCableSpecs(cables){
 const rows=cables.map(c=>({manufacturer:esc(c.manufacturer),model:esc(c.model),specs:cableSpecs(c)}));
 return `<section class="cable-specs" aria-labelledby="cable-specs-title">
 <h3 id="cable-specs-title">${caption}</h3>
 <ul class="cable-specs__cards" role="list">${rows.map(c=>`<li class="cable-specs__card">
 <p class="cable-specs__manufacturer">${c.manufacturer}</p><h4>${c.model}</h4>
 <dl>${c.specs.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
 </li>`).join('')}</ul>
 <div class="cable-specs__table">${table(['Fabricante / produto',...cableSpecs(cables[0]).map(([label])=>label)],rows.map(c=>[`${c.manufacturer} ${c.model}`,...c.specs.map(([,value])=>value)]),caption)}</div>
 </section>`;
}


const icon=kind=>`<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${kind==='radio'?'<rect x="5" y="10" width="22" height="17" rx="3"/><path d="M9 10 23 4M9 16h7M9 21h3"/><circle cx="22" cy="20" r="2.5"/>':'<path d="m10 27 6-15 6 15M12 22h8M16 12V5M8 7a11 11 0 0 0 0 10M24 7a11 11 0 0 1 0 10M4 3a17 17 0 0 0 0 18M28 3a17 17 0 0 1 0 18"/>'}</svg>`;
const signed=value=>`${value>0?'+':''}${fmt(value)}`;
export function renderCoaxResult(c,r,{frequency,length,power}){
 return `<article class="coax-summary">
 <header class="coax-summary__head"><div><p class="eyebrow">Resultado estimado</p><h3>${esc(c.model)}</h3><p class="coax-summary__context">${esc(c.manufacturer)} · ${fmt(length)} m · ${fmt(frequency,6)} MHz</p></div><span class="coax-tag">${fmt(r.efficiency,1)}% entregue</span></header>
 <div class="coax-flow">
 <div class="coax-flow__end"><span class="coax-flow__icon">${icon('radio')}</span><strong>${fmt(power)} W</strong><span>No rádio</span></div>
 <div class="coax-flow__link"><span>Perda total</span><strong>${r.totalDb>0?'−':''}${fmt(r.totalDb)} dB</strong><span class="coax-flow__arrow" aria-hidden="true">⟶</span><span>${fmt(length)} m de cabo</span></div>
 <div class="coax-flow__end coax-flow__end--antenna"><span class="coax-flow__icon">${icon('antenna')}</span><strong>${fmt(r.output)} W</strong><span>Na antena</span></div>
 </div>
 <div class="coax-balance">${bar(r.efficiency,`${fmt(r.efficiency)}% entregue à antena; ${fmt(r.lostPercent)}% perdido`)}<div class="coax-balance__labels"><span><strong>${fmt(r.efficiency,1)}%</strong> chega à antena</span><span><strong>${fmt(r.lostPercent,1)}%</strong> perdido</span></div></div>
 </article>
 <section class="coax-details"><h3>Detalhes do cálculo</h3>${stats([['Perda total',`${fmt(r.totalDb)} dB`],['Potência perdida',`${fmt(r.lost)} W`],['Atenuação do cabo',`${fmt(r.attenuation)} dB/100 m`],['Eficiência do trecho',`${fmt(r.efficiency)}%`]])}
 <p class="coax-details__note">Dos ${fmt(r.lost)} W perdidos, ${fmt(r.cableLost)} W são dissipados no cabo e ${fmt(r.connectorLost)} W nas perdas adicionais agrupadas na saída. A perda somente no cabo é ${fmt(r.cableDb)} dB.</p>
 <details><summary>Dados e método de cálculo</summary><p>${esc(c.method)} Faixa válida: ${fmt(c.range[0])}–${fmt(c.range[1])} MHz. ${esc(c.conditions)} ${source(c.source)}</p></details></section>`;
}
export function renderCoaxComparison(results,base,selectedId){
 return `<p class="coax-comparison__reference">Comparação com ${esc(cableById(base.id).model)} como referência.</p><ul class="coax-comparison" role="list">${results.map(r=>{
  const c=cableById(r.id),selected=r.id===selectedId;
  return `<li class="coax-compare${selected?' coax-compare--selected':''}">
  <div class="coax-compare__head"><div><span class="coax-compare__manufacturer">${esc(c.manufacturer)}</span><h3>${esc(c.model)}</h3>${selected?'<span class="coax-tag">Selecionado</span>':''}</div><div class="coax-compare__values"><strong>${fmt(r.totalDb)} dB</strong><span>${fmt(r.output)} W na antena</span></div></div>
  ${bar(r.efficiency,`${c.model}: ${fmt(r.efficiency)}% da potência de entrada entregue à antena`)}
  <div class="coax-compare__footer"><span>${fmt(r.efficiency,1)}% entregue</span><span>${signed(r.output-base.output)} W vs. referência</span></div>
  <details><summary>Ver perdas e especificações</summary><dl class="coax-compare__specs"><div><dt>Potência perdida (W)</dt><dd>${fmt(r.lost)}</dd></div>${cableSpecs(c).map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></details>
  </li>`;
 }).join('')}</ul>`;
}
