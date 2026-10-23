import {wavelength,bandDescription} from './faixas.js';
import {esc,table} from './ui.js';

// Preserve every regulatory decimal; wavelengths are educational approximations.
const frequency=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:20});
const length=new Intl.NumberFormat('pt-BR',{maximumSignificantDigits:3});
const range=(low,high,format)=>`<span class="band-value">${format.format(low)}</span> – <span class="band-value">${format.format(high)}</span>`;
export function bandView(b){return {
 name:esc(b.name),
 limits:range(b.low,b.high,frequency),
 length:range(wavelength(b.high),wavelength(b.low),length),
 classes:esc(b.classes.split('').join(', ')),
 description:esc(bandDescription(b))
};}
function card(b){return `<li class="band-card"><h4>${b.name}</h4>
 <dl><div><dt>Frequência (MHz)</dt><dd>${b.limits}</dd></div>
 <div><dt>λ aproximado (m)</dt><dd>≈ ${b.length}</dd></div>
 <div><dt>Classes autorizadas</dt><dd>${b.classes}</dd></div></dl>
 <details><summary>Usos e propagação</summary><p>${b.description}</p></details></li>`;}
export function renderBands(rows){
 if(!rows.length)return '<p>Nenhuma faixa encontrada. Tente outro filtro.</p>';
 const bands=rows.map(bandView);
 const desktop=table(['Faixa','Limites (MHz)','λ aproximado (m), superior a inferior','Classes','Usos e propagação típicos'],bands.map(b=>[b.name,b.limits,`≈ ${b.length}`,b.classes,b.description]),'Índice da Tabela I do Ato 926/2024');
 return `<section class="band-results" aria-labelledby="band-index-title"><h3 id="band-index-title">Índice da Tabela I do Ato 926/2024</h3>
 <ul class="band-cards" role="list">${bands.map(card).join('')}</ul>
 <div class="band-desktop">${desktop}</div></section>`;
}
