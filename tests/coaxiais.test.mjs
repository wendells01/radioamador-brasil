import test from 'node:test';
import assert from 'node:assert/strict';
import {CABLES,attenuation,coaxLoss,compareCables,number} from '../site/assets/js/tecnica/coaxiais.js';
const near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<e,`${a} ≠ ${b}`);
test('Belden: cada ponto do datasheet e conversão de pés',()=>{
 near(attenuation('8259',100),5.4/0.3048); near(attenuation('9201',400),8.4/0.3048);
 near(attenuation('8267',400),4.1/0.3048);
 for(const c of CABLES.filter(c=>c.points)) for(const [f,a] of c.points) near(attenuation(c.id,f),a);
});
test('LMR: confronto com tabela independente dos coeficientes (dB/100 m)',()=>{
 for(const [id,expected] of [['lmr195',14.6],['lmr240',9.9],['lmr400',5.0],['lmr600',3.2]]) near(attenuation(id,150),expected,.06);
});
test('3,0103 dB entrega metade; balanço de energia e perdas separadas',()=>{
 const r=coaxLoss('8259',100,0,100,3.010299956639812);
 near(r.output,50); near(r.lost,50); near(r.cableLost,0); near(r.connectorLost,50); near(r.efficiency,50);
 const s=coaxLoss('lmr400',146,30,100,1);near(s.output+s.cableLost+s.connectorLost,100);
});
test('domínio, nulos, extremos, interpolação monotônica e consistência',()=>{
 for(const v of ['',null,undefined,-1,NaN,Infinity,'1.000,5']) assert.throws(()=>number(v,'Teste'));
 for(const c of CABLES){assert.throws(()=>attenuation(c.id,c.range[0]-.01));assert.throws(()=>attenuation(c.id,c.range[1]+1));}
 assert.throws(()=>coaxLoss('8259',100,1,0));assert.throws(()=>coaxLoss('8259',100,-1,1));assert.throws(()=>attenuation('fake',100));
 assert.ok(attenuation('8259',75)>attenuation('8259',50));assert.ok(attenuation('8259',75)<attenuation('8259',100));
 near(coaxLoss('8259',100,0,100).output,100);near(coaxLoss('8259',100,100000,1e7).output,0);
 const r=compareCables(['8259','lmr400'],146,20,50);assert.deepEqual(r[0],coaxLoss(r[0].id,146,20,50));assert.ok(r[0].output>r[1].output);
 assert.throws(()=>compareCables([],146,20,50));assert.throws(()=>compareCables(['8259','8259'],146,20,50));assert.equal(number('14,2','f'),14.2);
});

test('especificações em cartões e tabela preservam todo o catálogo',async()=>{
 const {renderCableSpecs,cableSpecs}=await import('../site/assets/js/tecnica/coaxiais-view.js');
 const original=JSON.stringify(CABLES);
 const html=renderCableSpecs(CABLES);
 assert.equal((html.match(/class="cable-specs__card"/g)||[]).length,CABLES.length);
 assert.equal((html.match(/<th scope="row">/g)||[]).length,CABLES.length);
 for(const c of CABLES){
  const specs=cableSpecs(c);
  assert.equal(specs.length,5);
  for(const [,value] of specs)assert.ok(html.includes(value));
  assert.ok(html.includes(c.model));
  assert.equal(specs[3][1].includes('repetido'),Boolean(c.repeated));
 }
 assert.deepEqual(cableSpecs(CABLES.find(c=>c.id==='lmr400')),[
  ['Diâmetro (mm)','10,29'],['Impedância (Ω)','50'],['Fator de velocidade','0,84'],
  ['Raio mínimo (mm)','25,4 instalação; 101,6 repetido'],['Faixa válida (MHz)','30–8.000']
 ]);
 assert.equal(JSON.stringify(CABLES),original);
});

test('resultado visual preserva balanço de potência, perdas adicionais e fonte',async()=>{
 const {renderCoaxResult}=await import('../site/assets/js/tecnica/coaxiais-view.js');
 const c=CABLES.find(c=>c.id==='8259');
 const r=coaxLoss(c.id,100,0,100,3.010299956639812);
 const html=renderCoaxResult(c,r,{frequency:100,length:0,power:100});
 assert.match(html,/100 W/);assert.match(html,/50 W/);assert.match(html,/−3,01 dB/);
 assert.match(html,/50% entregue à antena; 50% perdido/);
 assert.match(html,/0 W são dissipados no cabo e 50 W nas perdas adicionais/);
 assert.ok(html.includes(c.source));
});
test('cartões do comparador mantêm escala de eficiência, referência e todas as especificações',async()=>{
 const {renderCoaxComparison,cableSpecs}=await import('../site/assets/js/tecnica/coaxiais-view.js');
 const results=compareCables(['8259','8267','lmr400'],435,8,25),base=coaxLoss('8259',435,8,25);
 const html=renderCoaxComparison(results,base,'lmr400');
 assert.equal((html.match(/class="coax-compare(?: coax-compare--selected)?"/g)||[]).length,3);
 assert.equal((html.match(/coax-compare--selected/g)||[]).length,1);
 for(const r of results){
  assert.ok(html.includes(`width:${r.efficiency}%`),'barras usam a mesma escala de 0 a 100%');
  for(const [,value] of cableSpecs(CABLES.find(c=>c.id===r.id)))assert.ok(html.includes(value));
 }
 assert.match(html,/0 W vs\. referência/);
 assert.ok(html.indexOf(results[0].id==='lmr400'?'LMR-400':'RG-213')<html.lastIndexOf('RG-58'));
});
