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
