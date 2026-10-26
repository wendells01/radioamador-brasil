import test from 'node:test';import assert from 'node:assert/strict';
import {makeLookup,normalizeCall,validCall,validManifest,ageDays,FIELDS,BASE_FIELDS,validRows} from '../site/assets/js/indicativos/core.js';
const manifest={schema:1,revision:'a'.repeat(20),records:2,callsigns:1,prefixes:['PU2'],collectedAt:'2026-10-26T10:00:00Z',checkedAt:'2026-10-26T12:00:00Z'};
const row=Object.fromEntries(FIELDS.map(k=>[k,k==='name'?'TITULAR FICTÍCIO':null]));
const shard={schema:1,revision:manifest.revision,prefix:'PU2',calls:{PU2ABC:[row,{...row,type:'Móvel'}]}};
test('entrada normaliza sem remover caracteres para inventar outro indicativo',()=>{
 assert.equal(normalizeCall('  pu2abc  '),'PU2ABC');assert(validCall('PU2ABC'));assert(validCall('PP5TI-0'));assert(validCall('PY2A'));assert(!validCall('PU2ABC/P'));assert(!validCall('../PU2'));assert(!validCall('<script>'));assert(!validCall('PU2'));
});
test('busca exata carrega só o prefixo e preserva múltiplas estações',async()=>{
 const urls=[];const client=makeLookup(async url=>{urls.push(url);return {ok:true,json:async()=>url.endsWith('manifest.json')?manifest:shard};});
 const found=await client.lookup('pu2abc');assert.equal(found.call,'PU2ABC');assert.equal(found.rows.length,2);assert.equal(urls.length,2);assert(urls[1].endsWith('/PU2.json'));
 assert.equal((await client.lookup('PU2XYZ')).rows.length,0);assert.equal(urls.length,3,'prefixo já consultado reutilizado; manifest revalidado');
 assert.equal((await client.lookup('PY6ABC')).rows.length,0);assert.equal(urls.length,4,'prefixo ausente não requisita shard inexistente');
});
test('indisponibilidade e dados corrompidos não são tratados como não encontrado',async()=>{
 await assert.rejects(makeLookup(async()=>({ok:false,status:503})).lookup('PU2ABC'));
 await assert.rejects(makeLookup(async()=>({ok:true,json:async()=>({})})).lookup('PU2ABC'));
 await assert.rejects(makeLookup(async url=>({ok:true,json:async()=>url.endsWith('manifest.json')?manifest:{...shard,revision:'outdated'}})).lookup('PU2ABC'));
});
test('mudança da revisão força carregamento da nova base',async()=>{
 let revision=manifest.revision;const client=makeLookup(async url=>({ok:true,json:async()=>url.endsWith('manifest.json')?{...manifest,revision}:{...shard,revision,calls:{PU2ABC:[{...row,name:revision}]}}}));
 assert.equal((await client.lookup('PU2ABC')).rows[0].name,revision);revision='b'.repeat(20);assert.equal((await client.lookup('PU2ABC')).rows[0].name,revision);
});
test('data de conferência evidencia cópia antiga',()=>{assert(validManifest(manifest));assert(!validManifest({...manifest,revision:'../'}));assert.equal(ageDays('2026-10-20T12:00:00Z',Date.parse('2026-10-26T12:00:00Z')),6);});

test('campos novos preservam a máscara e a base anterior continua legível',()=>{
 const full={...row,identificationType:'CPF',document:'***12345**',fistel:'00000000000',stationNumber:'000000001',holderState:'SP',stationName:'ESTAÇÃO FICTÍCIA',service:'Radioamador',frequencies:'144–146 MHz'};
 assert(validRows([full]));assert(!validRows([{...full,document:'12345678901'}]));
 assert(validRows([Object.fromEntries(BASE_FIELDS.map(key=>[key,row[key]]))]));
});
