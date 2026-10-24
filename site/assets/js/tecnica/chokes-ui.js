import {chokeDiagram} from '../visuals.js';
import {CABLES,cableById} from './coaxiais.js';import {airChoke,ferriteChoke,CHOKE_REFERENCES} from './construcao.js';import {fmt,esc,stats,table,render,bindForm} from './ui.js';
const $=id=>document.getElementById(id);
$('choke-cable').innerHTML=CABLES.map(c=>`<option value="${c.id}">${c.manufacturer} ${c.model} — ${fmt(c.diameter)} mm</option>`).join('');
$('choke-references').innerHTML=table(['Suporte (mm)','Espiras','Autorressonância (MHz)'],CHOKE_REFERENCES.map(r=>[r.former,r.turns,r.resonance]),'Resultados experimentais de VK2ZOI');
function update(){const ferrite=$('choke-type').value==='ferrite';$('air-fields').hidden=ferrite;$('ferrite-fields').hidden=!ferrite;
 for(const input of $('air-fields').querySelectorAll('input'))input.disabled=ferrite;$('cores').disabled=!ferrite;
 render($('choke-result'),()=>{const cable=$('choke-cable').value,f=$('choke-frequency').value;
 if(ferrite){const r=ferriteChoke(cable,f,$('cores').value);return chokeDiagram(r,true)+stats([['Núcleo',r.model],['Material',r.material],['Abertura mínima',`${fmt(r.aperture)} mm`],['Comprimento dos núcleos alinhados',`${fmt(r.length)} mm`]])+`<p>${r.count} núcleo(s), cada um com uma passagem do cabo inteiro, sem remover a blindagem. O cabo de ${fmt(r.cableDiameter)} mm cabe na abertura. Reserva mecânica para travas e montagem não incluída.</p><p>Não se estima impedância: confirme os dados atuais do fabricante e meça a montagem final. Sem avaliação de potência ou temperatura.</p>`;}
 const r=airChoke({cable,frequency:f,former:$('former').value,turns:$('turns').value,spacing:$('spacing').value});
 return chokeDiagram(r)+stats([['Cabo no enrolamento',`${fmt(r.length,3)} m`],['Diâmetro externo',`${fmt(r.outerDiameter)} mm`],['Altura aproximada',`${fmt(r.height)} mm`],['Raio na linha central',`${fmt(r.radius)} mm`]])+`<p>Cabo ${esc(cableById(cable).model)} em uma camada. Adicione comprimento para ligações e folga. Frequência informada: ${fmt(r.frequency)} MHz; a geometria não determina sozinha o bloqueio nesta frequência.</p><p>Impedância de modo comum indisponível: não existe modelo validado para este conjunto arbitrário. Consulte as referências medidas abaixo e valide a construção com VNA.</p>`;
 });}
bindForm('choke-form',update);
