import {lossChart} from '../visuals.js';
import {renderCableSpecs,renderCoaxResult,renderCoaxComparison} from './coaxiais-view.js';
import {CABLES,coaxLoss,compareCables,cableById,number} from './coaxiais.js';
import {fmt,esc,source,table,render,bindForm} from './ui.js';
const $=id=>document.getElementById(id);
const options=CABLES.map(c=>`<option value="${c.id}">${c.manufacturer} — ${c.model}</option>`).join('');
$('cable').innerHTML=options;$('cable').value='lmr400';$('baseline').innerHTML=options;
$('compare-choices').insertAdjacentHTML('beforeend',CABLES.map(c=>`<label><input type="checkbox" value="${c.id}" ${['8259','8267','lmr400'].includes(c.id)?'checked':''}>${c.manufacturer} ${c.model}</label>`).join(''));
const params=()=>['frequency','length','power','additional'].map(id=>$(id).value || (id==='additional'?'0':''));
function update(){
 render($('coax-result'),()=>{
 const c=cableById($('cable').value),r=coaxLoss(c.id,...params());
 const frequency=number($('frequency').value,'Frequência'),length=number($('length').value,'Comprimento'),power=number($('power').value,'Potência');
 const maxLength=Math.min(100000,Math.max(10,length*2));
 const samples=Array.from({length:33},(_,i)=>{const distance=maxLength*i/32;return {length:distance,...coaxLoss(c.id,frequency,distance,power,$('additional').value||'0')};});
 return renderCoaxResult(c,r,{frequency,length,power})+lossChart(samples,{length,output:r.output});
 });
 render($('compare-result'),()=>{
 const ids=[...$('compare-choices').querySelectorAll('input:checked')].map(x=>x.value);
 const results=compareCables(ids,...params(),$('sort').value), base=coaxLoss($('baseline').value,...params());
 return renderCoaxComparison(results,base,$('cable').value);
 });
}
$('compare-choices').addEventListener('change',update);$('sort').addEventListener('change',update);$('baseline').addEventListener('change',update);
$('cable-guide').innerHTML=renderCableSpecs(CABLES)+CABLES.map(c=>`<details><summary>${esc(c.manufacturer)} ${esc(c.model)} — construção e atenuação</summary><p>${esc(c.construction)} ${esc(c.conditions)} ${esc(c.method)}</p>${c.points?table(['MHz','dB/100 m'],c.points.map(([f,a])=>[fmt(f),fmt(a)]),'Pontos nominais de atenuação'):`<p>Coeficientes a = ${fmt(c.coefficients[0],6)}, b = ${fmt(c.coefficients[1],6)}. Sem extrapolação além de 30–8.000 MHz.</p>`}<p>${source(c.source)} · Verificação: 23/10/2026.</p></details>`).join('');
bindForm('coax-form',update);
