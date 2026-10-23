import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateSnapshot, isStale, solarDate, geomagneticLabel, CONDITIONS, STALE_MS} from '../site/assets/js/solar-data.js';
const current = JSON.parse(readFileSync(new URL('./fixtures/solar.json',import.meta.url),'utf8'));
test('snapshot com valores reais e tradução de todas as condições',()=>{
 const data=validateSnapshot(current);
 assert.equal(data.bands.length,4); assert.equal(data.indicators.flux,106);
 assert.deepEqual(Object.values(CONDITIONS),['Boa','Regular','Ruim','Sem dados']);
 assert.equal(geomagneticLabel('QUIET'),'Calmo');assert.equal(geomagneticLabel('outro'),'Sem classificação disponível');
 assert.match(solarDate('2026-10-23T19:07:00Z'),/23\/10\/2026.*16:07/);
});
test('envelhecimento usa data da fonte e da coleta',()=>{
 const data=validateSnapshot(current), time=Date.parse(data.updatedAt);
 assert.equal(isStale(data,time),false);
 assert.equal(isStale(data,time+STALE_MS+1),true);
 assert.equal(isStale({...data,fetchedAt:'2026-10-22T00:00:00Z'},time),true);
});
test('respostas inválidas, classificações novas e campos ausentes',()=>{
 for(const value of [null,{}, {...current,version:2}, {...current,updatedAt:'inválida'}, {...current,bands:[]}])assert.throws(()=>validateSnapshot(value));
 const copy=structuredClone(current);copy.indicators.flux=null;copy.bands[0].day='Amazing';
 const data=validateSnapshot(copy);assert.equal(data.indicators.flux,null);assert.equal(data.bands[0].day,'unknown');
 copy.bands.push(copy.bands[0]);assert.throws(()=>validateSnapshot(copy),/duplicada/);
});
