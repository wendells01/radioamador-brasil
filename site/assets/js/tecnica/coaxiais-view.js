import {fmt,esc,table} from './ui.js';

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
