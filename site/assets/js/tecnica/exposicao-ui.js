import {radiatedPower,exposureBand} from './exposicao.js';import {fmt,stats,render,bindForm} from './ui.js';
const $=id=>document.getElementById(id);
function update(){const conducted=$('rf-basis').value==='conducted';$('rf-line-fields').hidden=!conducted;for(const input of $('rf-line-fields').querySelectorAll('input,select'))input.disabled=!conducted;
 render($('rf-result'),()=>{const band=exposureBand($('rf-frequency').value),r=radiatedPower({power:$('rf-power').value,basis:$('rf-basis').value,loss:$('rf-loss').value,gain:$('rf-gain').value,unit:$('rf-unit').value});
 return stats([...(r.antennaPower===null?[]:[['Potência na antena',`${fmt(r.antennaPower)} W`],['Ganho isotrópico',`${fmt(r.gainDbi)} dBi`]]),['EIRP',`${fmt(r.eirp)} W`],['ERP',`${fmt(r.erp)} W`]])+`<p>Intervalo da tabela: ${band}. Distância de referência indisponível até a verificação das expressões oficiais. Conversões de potência não comprovam isenção nem atendimento aos limites de exposição.</p>`;
 });}
bindForm('rf-form',update);
