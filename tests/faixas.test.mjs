import test from 'node:test';import assert from 'node:assert/strict';
import {BANDS,filterBands,wavelength,bandAt,spectrum} from '../site/assets/js/tecnica/faixas.js';
test('comprimento de onda e classificações',()=>{assert.equal(wavelength(299.792458),1);assert.equal(spectrum(30),'VHF');assert.equal(spectrum(300),'UHF');assert.throws(()=>wavelength(0));});
test('classes e lacunas não são generalizadas para a faixa inteira',()=>{assert.equal(bandAt(7.1)[0].classes,'AB');assert.equal(bandAt(7.02)[0].classes,'ABC');assert.equal(bandAt(910).length,0);assert.equal(bandAt(440).length,0);assert.equal(bandAt(14.2)[0].classes,'A');assert.ok(!filterBands({operator:'C'}).some(b=>b.name==='20 m'));});
test('todos os intervalos são crescentes e filtros preservam dados',()=>{for(const b of BANDS)assert.ok(b.high>b.low);assert.equal(filterBands({region:'VHF'}).length,3);assert.equal(filterBands({query:'nada'}).length,0);assert.equal(filterBands({query:'146'})[0].name,'2 m');assert.equal(filterBands({query:'1,3 m'})[0].low,220);});

test('apresentações compartilham os 34 segmentos sem alterar os dados',async()=>{
 const {renderBands,bandView}=await import('../site/assets/js/tecnica/faixas-view.js');
 const original=JSON.stringify(BANDS);
 const html=renderBands(BANDS);
 assert.equal(BANDS.length,34);
 assert.equal((html.match(/class="band-card"/g)||[]).length,34);
 assert.equal((html.match(/<th scope="row">/g)||[]).length,34);
 for(const b of BANDS){
  const view=bandView(b);
  for(const limit of [b.low,b.high])assert.ok(view.limits.includes(new Intl.NumberFormat('pt-BR',{maximumFractionDigits:20}).format(limit)));
  assert.ok(html.includes(view.description));
 }
 assert.equal(JSON.stringify(BANDS),original);
 assert.match(bandView(BANDS[0]).length,/2\.180/);
 assert.match(bandView(BANDS.at(-1)).length,/0,0012/);
 assert.match(renderBands([]),/Nenhuma faixa/);
 assert.equal((renderBands(filterBands({region:'VHF'})).match(/class="band-card"/g)||[]).length,3);
});

test('busca aceita nomes compactos e números de faixa, além de frequências',()=>{
 const forty=BANDS.filter(b=>b.name==='40 m');
 for(const query of ['40','40m','40 m',' 40 M '])assert.deepEqual(filterBands({query}),forty);
 for(const query of ['1,3m','1.3 m'])assert.deepEqual(filterBands({query}),BANDS.filter(b=>b.name==='1,3 m'));
 assert.deepEqual(filterBands({query:'70cm'}),BANDS.filter(b=>b.name==='70 cm'));
 assert.deepEqual(filterBands({query:'6mm'}),BANDS.filter(b=>b.name==='6 mm'));
 assert.deepEqual(filterBands({query:'7,1'}),bandAt(7.1));
 assert.deepEqual(filterBands({query:'146'}),bandAt(146));
 assert.deepEqual(filterBands({query:'40m',operator:'C'}),[forty[0]]);
 assert.deepEqual(filterBands({query:'40',region:'VHF'}),[]);
 assert.deepEqual(filterBands({query:''}),BANDS);
});
