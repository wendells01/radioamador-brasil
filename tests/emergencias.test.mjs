import test from 'node:test';import assert from 'node:assert/strict';import {EMERGENCIES,filterEmergencies} from '../site/assets/js/tecnica/emergencias.js';
test('busca sem acentos, filtros e rastreabilidade',()=>{assert.ok(filterEmergencies('satelites').length);assert.equal(filterEmergencies('','Telefones').length,5);assert.equal(filterEmergencies('inexistente').length,0);for(const r of EMERGENCIES){assert.ok(new URL(r.source));assert.match(r.verified,/^2026-10-23$/);assert.ok(r.restriction);}});
test('radioamador não é canal oficial e SRC mantém lacuna explícita',()=>{assert.ok(filterEmergencies('','Radioamadorismo').every(r=>!r.classification.includes('Oficial')));assert.match(filterEmergencies('','Rádio do Cidadão')[0].restriction,/não foi confirmada/);});

test('146,520 MHz consta como referência LABRE em FM simplex e é pesquisável com ponto ou vírgula',()=>{
 const records=filterEmergencies('146,520','Radioamadorismo');
 assert.equal(records.length,1);
 const r=records[0];
 assert.equal(r.frequency,'146,520 MHz');
 assert.equal(r.mode,'FM simplex');
 assert.match(r.classification,/Referência nacional/);
 assert.match(r.purpose,/LABRE/);
 assert.match(r.restriction,/não há garantia de escuta/);
 assert.equal(r.source,'https://www.labre.org.br/frequencias-de-emergencia-do-radioamadorismo-uma-responsabilidade-de-todos/');
 assert.deepEqual(filterEmergencies('146.520','Radioamadorismo'),records);
 assert.deepEqual(filterEmergencies('146.520','',r.classification),records);
 assert.deepEqual(filterEmergencies('146.520','Marítimo'),[]);
 assert.deepEqual(filterEmergencies('156.800'),filterEmergencies('156,800'));
});
