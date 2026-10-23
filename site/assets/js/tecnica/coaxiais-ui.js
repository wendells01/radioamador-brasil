import {CABLES,coaxLoss,compareCables,cableById} from './coaxiais.js';
import {fmt,esc,source,table,stats,bar,render,bindForm} from './ui.js';
const $=id=>document.getElementById(id);
const options=CABLES.map(c=>`<option value="${c.id}">${c.manufacturer} — ${c.model}</option>`).join('');
$('cable').innerHTML=options;$('cable').value='lmr400';$('baseline').innerHTML=options;
$('compare-choices').insertAdjacentHTML('beforeend',CABLES.map(c=>`<label><input type="checkbox" value="${c.id}" ${['8259','8267','lmr400'].includes(c.id)?'checked':''}>${c.manufacturer} ${c.model}</label>`).join(''));
const params=()=>['frequency','length','power','additional'].map(id=>$(id).value || (id==='additional'?'0':''));
function update(){
 render($('coax-result'),()=>{
 const c=cableById($('cable').value),r=coaxLoss(c.id,...params());
 return stats([['Atenuação',`${fmt(r.attenuation)} dB/100 m`],['Perda total',`${fmt(r.totalDb)} dB`],['Potência na antena',`${fmt(r.output)} W`],['Potência perdida total',`${fmt(r.lost)} W`],['Eficiência',`${fmt(r.efficiency)}%`],['Potência perdida',`${fmt(r.lostPercent)}%`]])+bar(r.efficiency,`${fmt(r.efficiency)}% entregue e ${fmt(r.lostPercent)}% perdida`)+`<p>Verde: potência entregue. Laranja: potência perdida. Dos ${fmt(r.lost)} W perdidos, ${fmt(r.cableLost)} W são dissipados no cabo e ${fmt(r.connectorLost)} W nas perdas adicionais agrupadas na saída. A perda somente no cabo é ${fmt(r.cableDb)} dB.</p><p>${esc(c.method)} Faixa válida: ${fmt(c.range[0])}–${fmt(c.range[1])} MHz. ${esc(c.conditions)} ${source(c.source)}</p>`;
 });
 render($('compare-result'),()=>{
 const ids=[...$('compare-choices').querySelectorAll('input:checked')].map(x=>x.value);
 const results=compareCables(ids,...params(),$('sort').value), base=coaxLoss($('baseline').value,...params());
 return table(['Cabo','Perda total (dB)','Entregue (W)','Perdida (W)','Eficiência','Δ W vs. referência','Diâmetro (mm)','Impedância (Ω)','Fator de velocidade','Raio mínimo de instalação (mm)'],results.map(r=>{const c=cableById(r.id);return [esc(c.model),fmt(r.totalDb),fmt(r.output),fmt(r.lost),`${fmt(r.efficiency)}%`,`${r.output>=base.output?'+':''}${fmt(r.output-base.output)}`,fmt(c.diameter),fmt(c.impedance),fmt(c.velocity,3),fmt(c.bend)];}),'Resultados nas mesmas condições')+results.map(r=>`<p>${esc(cableById(r.id).model)}: ${fmt(r.output)} W</p>${bar(r.efficiency,`${cableById(r.id).model}: ${fmt(r.efficiency)}% entregue`)}`).join('');
 });
}
$('compare-choices').addEventListener('change',update);$('sort').addEventListener('change',update);$('baseline').addEventListener('change',update);
$('cable-guide').innerHTML=table(['Fabricante / produto','Diâmetro (mm)','Impedância (Ω)','Fator de velocidade','Raio mínimo (mm)','Faixa válida (MHz)'],CABLES.map(c=>[`${esc(c.manufacturer)} ${esc(c.model)}`,fmt(c.diameter),fmt(c.impedance),fmt(c.velocity,3),`${fmt(c.bend)} instalação${c.repeated?`; ${fmt(c.repeated)} repetido`:''}`,`${fmt(c.range[0])}–${fmt(c.range[1])}`]),'Especificações físicas e elétricas')+CABLES.map(c=>`<details><summary>${esc(c.manufacturer)} ${esc(c.model)} — construção e atenuação</summary><p>${esc(c.construction)} ${esc(c.conditions)} ${esc(c.method)}</p>${c.points?table(['MHz','dB/100 m'],c.points.map(([f,a])=>[fmt(f),fmt(a)]),'Pontos nominais de atenuação'):`<p>Coeficientes a = ${fmt(c.coefficients[0],6)}, b = ${fmt(c.coefficients[1],6)}. Sem extrapolação além de 30–8.000 MHz.</p>`}<p>${source(c.source)} · Verificação: 23/10/2026.</p></details>`).join('');
bindForm('coax-form',update);
