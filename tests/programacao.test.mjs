import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PROFILES,chirpCsv} from '../site/assets/js/programacao.js';
test('referências de canais preservam modelo, região e numeração',()=>{
 assert.deepEqual(PROFILES.map(p=>p.channels.length),[26,16,22]);
 assert.equal(PROFILES[0].channels[13].frequency,467562500);
 assert.equal(PROFILES[2].channels[13].frequency,467712500);
 assert.equal(PROFILES[1].channels[8].frequency,462925000);
});
test('downloads correspondem aos perfis e desativam transmissão sem filtro de tom',async()=>{
 for(const profile of PROFILES){
  const csv=await readFile(new URL(`../site/downloads/${profile.file}`,import.meta.url),'utf8');
  assert.equal(csv,chirpCsv(profile));
  for(const row of csv.trim().split('\r\n').slice(1)){
   const fields=row.split(',');assert.equal(fields[3],'off');assert.equal(fields[5],'');assert.equal(fields[12],'NFM');
  }
 }
});
test('prévia estática contém todos os canais mesmo sem JavaScript',async()=>{
 const html=await readFile(new URL('../site/downloads.html',import.meta.url),'utf8');
 assert.equal((html.match(/<tr><td>/g)||[]).length,64);
 for(const p of PROFILES){assert(html.includes(`data-program-profile="${p.id}"`));assert(html.includes(`/downloads/${p.file}`));}
});
