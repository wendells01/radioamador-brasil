import {flowerDiagram} from '../visuals.js';
import {flowerpot} from './construcao.js';import {fmt,stats,render,bindForm} from './ui.js';
const $=id=>document.getElementById(id);
function update(){render($('flower-result'),()=>{const r=flowerpot($('flower-model').value,$('flower-frequency').value);
 const sleeve=r.sleeve;
 return stats([['Elemento superior',`${fmt(r.upper,0)} mm`],['Elemento inferior',`${fmt(r.lower,0)} mm`],['Radiador físico total',`${fmt(r.upper+r.lower,0)} mm`]])+
 flowerDiagram(r)+
 `<p>${r.scaled?'Escala geométrica inicial a partir do protótipo; requer ajuste experimental.':'Dimensões do protótipo de 2 m.'} ${r.choke?`Referência inicial de choke: ${r.choke.turns} espiras de RG58 em suporte de ${r.choke.former} mm; autorressonância documentada em ${r.choke.resonance} MHz. Confirme por medição e confira o raio de curvatura do cabo.`:'Não há choke próximo ao alvo na tabela experimental: dimensionamento do choke indisponível para este ponto; não construir sem desenvolver e medir um choke adequado.'}</p>`+
 (sleeve?`<p>Manga externa: ${sleeve.length} mm, início ${sleeve.top} mm abaixo do topo do radiador e término ${sleeve.bottom} mm acima do choke. Tubo de 25 mm e choke de 9 espiras. Destina-se à banda próxima da terceira harmônica; não autoriza operação fora dos limites brasileiros de 430–440 MHz.</p>`:'')+`<p>Alvo indicativo de ressonância do choke: ${fmt(r.target,1)} MHz (5,5% abaixo). A seleção da tabela é aproximada; no protótipo de 146 MHz preserva-se o choke original de 9 espiras.</p>`;
});}
bindForm('flower-form',update);
