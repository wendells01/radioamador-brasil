import test from 'node:test';import assert from 'node:assert/strict';
import {dipoleDiagram,locatorCell,lossChart,flowerDiagram,chokeDiagram,morseRhythm} from '../site/assets/js/visuals.js';
import {calculate} from '../site/assets/js/antenas.js';
import {fromLocator} from '../site/assets/js/tecnica/locator.js';
import {coaxLoss} from '../site/assets/js/tecnica/coaxiais.js';
import {flowerpot,airChoke} from '../site/assets/js/tecnica/construcao.js';
import {buildTimeline,unitDuration} from '../site/assets/js/morse.js';
test('diagramas exibem as medidas dos motores existentes e escapam rótulos',()=>{
 const dipole=calculate(14.2);assert.match(dipoleDiagram(dipole),/5,035 m/);
 const cell=fromLocator('GG66qk');assert.match(locatorCell(cell),/GG66qk/);assert.match(locatorCell({...cell,locator:'<script>'}),/&lt;script&gt;/);
 const flower=flowerpot('half',146);assert.match(flowerDiagram(flower),/457 mm/);assert.match(flowerDiagram(flower),/447 mm/);
 const choke=airChoke({cable:'8259',frequency:14.2,former:120,turns:6});assert.match(chokeDiagram(choke),/129,8 mm/);
});
test('gráfico de coaxial usa a potência calculada e fornece alternativa textual',()=>{
 const samples=Array.from({length:33},(_,i)=>({length:i,...coaxLoss('lmr400',146,i,100)}));
 const html=lossChart(samples,{length:16,output:samples[16].output});
 assert.match(html,/Consultar valores do gráfico/);assert.match(html,/16 m/);assert.match(html,/100 W/);
 assert.doesNotMatch(html,/NaN|Infinity/);
});
test('ritmo usa os mesmos segmentos e a duração unitária do áudio',()=>{
 const plan=buildTimeline('... --- ...'),html=morseRhythm(plan,unitDuration(15));
 assert.equal((html.match(/data-beat=/g)||[]).length,plan.length);
 assert.match(html,/Ponto: 0,08 s · traço: 0,24 s/);
});

test('prévia geográfica acompanha os pontos e divide o antimeridiano',async()=>{
 const {routeGeometry}=await import('../site/assets/js/visuals.js');
 const {route}=await import('../site/assets/js/tecnica/locator.js');
 const a={lat:0,lon:179},b={lat:0,lon:-179};
 const g=routeGeometry(a,b,route(a,b).distance);
 assert.ok(g.a[0]>400);assert.ok(g.b[0]<40);
 assert.equal((g.path.match(/M/g)||[]).length,2);
 assert.doesNotMatch(g.path,/NaN|Infinity/);
 assert.equal(routeGeometry(a,a,0).path,'');
});
