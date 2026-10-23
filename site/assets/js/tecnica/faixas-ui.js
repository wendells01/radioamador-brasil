import {filterBands,wavelength,bandDescription} from './faixas.js';
import {fmt,esc,table} from './ui.js';
const $=id=>document.getElementById(id);
function update(){const rows=filterBands({query:$('band-query').value,region:$('region').value,operator:$('operator').value});
 $('band-count').textContent=`${rows.length} segmentos encontrados.`;
 $('bands').innerHTML=rows.length?table(['Faixa','Limites (MHz)','λ (m), superior a inferior','Classes','Usos e propagação típicos'],rows.map(b=>[esc(b.name),`${fmt(b.low,4)}–${fmt(b.high,4)}`,`${fmt(wavelength(b.high),4)}–${fmt(wavelength(b.low),4)}`,b.classes.split('').join(', '),bandDescription(b)]),'Índice da Tabela I do Ato 926/2024'): '<p>Nenhuma faixa encontrada. Tente outro filtro.</p>';
}
for(const id of ['band-query','region','operator'])$(id).addEventListener('input',update);update();
