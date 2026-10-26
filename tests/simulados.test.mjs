import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractBank} from '../scripts/generate-daily-bank.mjs';
import {CATEGORIES,RULES,prepareBank,selectQuestions,scoreQuiz,questionKey,seenCount,remainingSeconds,readStored,canonicalErrors} from '../site/assets/js/simulados/core.js';
const banks=Object.fromEntries(['C','B','A'].map(cls=>[cls,extractBank(readFileSync(`site/simulados/classe-${cls.toLowerCase()}.html`,'utf8'))]));
const rng=()=>{let state=12345;return max=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state%max;};};
for(const cls of ['C','B','A']){
 test(`${cls}: agrupamento remove cópias e preserva cada ID antigo`,()=>{
  const bank=prepareBank(banks[cls]);assert(bank.length<1000);assert.equal(new Set(bank.map(questionKey)).size,bank.length);
  assert.equal(bank.flatMap(q=>q.aliases).length,1000);
  for(const original of banks[cls]){const q=bank.find(q=>q.aliases.includes(original.id));assert(q);assert.equal(q.answer,original.answer);assert.equal(questionKey(q),questionKey(original));}
  assert.equal(prepareBank(bank).length,bank.length);
 });
 test(`${cls}: todas as inéditas vêm antes de repetir, inclusive entre modos`,()=>{
  const bank=prepareBank(banks[cls]);const usage={},random=rng(),seen=new Set();
  for(const cat of CATEGORIES){const pool=bank.filter(q=>q.category===cat);while(pool.some(q=>!seen.has(q.id))){const batch=selectQuestions(pool,RULES[cls].count,usage,random);assert.equal(new Set(batch.map(questionKey)).size,batch.length);let repeated=false;for(const q of batch){if(seen.has(q.id))repeated=true;else{assert(!repeated,'inédita depois de repetida');seen.add(q.id);}usage[q.id]=seenCount(usage,q.id)+1;}if(repeated)assert(pool.every(q=>seen.has(q.id)));}}
  assert.equal(seen.size,bank.length);assert.equal(selectQuestions(bank,9999,usage,random).length,bank.length);
 });
 test(`${cls}: cópias com outros IDs não reaparecem na revisão de erros`,()=>{
  const bank=prepareBank(banks[cls]),q=bank.find(q=>q.aliases.length>1);assert.deepEqual(canonicalErrors(bank,q.aliases),[q.id]);
 });
 test(`${cls}: aprovação exige mínimo em todas as matérias, sem respostas contam no total`,()=>{
  const rule=RULES[cls],bank=prepareBank(banks[cls]);const quiz=CATEGORIES.flatMap(cat=>bank.filter(q=>q.category===cat).slice(0,rule.count));
  const answers={};for(const cat of CATEGORIES)for(const q of quiz.filter(q=>q.category===cat).slice(0,rule.minimum))answers[q.id]=q.answer;
  const approved=scoreQuiz(quiz,answers,cls,true);assert.equal(approved.passed,true);assert.equal(approved.total,3*rule.count);assert.equal(approved.blank,3*(rule.count-rule.minimum));
  delete answers[quiz.find(q=>q.category===CATEGORIES[2]).id];assert.equal(scoreQuiz(quiz,answers,cls,true).passed,false);
  const oneBlock=Object.fromEntries(quiz.filter(q=>q.category===CATEGORIES[0]).map(q=>[q.id,q.answer]));const result=scoreQuiz(quiz,oneBlock,cls,true);assert.equal(result.passed,false);assert.equal(result.parts.length,3);assert.equal(result.parts[1].blank,rule.count);
  assert.equal(scoreQuiz(quiz,{},cls,true).passed,false);assert.equal(scoreQuiz(quiz,{},cls,false).passed,null);
 });
}
test('mesmo conceito não ocupa duas vagas enquanto há conceitos distintos disponíveis',()=>{
 const bank=prepareBank(banks.C),pool=bank.filter(q=>q.category===CATEGORIES[0]);const count=Math.min(15,new Set(pool.map(q=>q.concept)).size);const batch=selectQuestions(pool,count,{},rng());assert.equal(new Set(batch.map(q=>q.concept)).size,count);
 assert.deepEqual(selectQuestions(pool,0),[]);assert.deepEqual(selectQuestions(pool,NaN),[]);
});
test('cópias com gabarito conflitante falham em vez de escolher uma silenciosamente',()=>{
 const q=banks.C[0];assert.throws(()=>prepareBank([q,{...q,id:9999,answer:!q.answer}]),/conflitantes/);
});
test('cronômetro deriva do prazo absoluto, inclusive após suspensão',()=>{
 assert.equal(remainingSeconds(120000,0),120);assert.equal(remainingSeconds(120000,119001),1);assert.equal(remainingSeconds(120000,999999),0);
});
test('storage inválido, bloqueado ou corrompido não quebra o treino',()=>{
 assert.deepEqual(readStored(null,'key',[],Array.isArray),[]);assert.deepEqual(readStored({getItem:()=>'{wrong'},'key',[],Array.isArray),[]);assert.deepEqual(readStored({getItem:()=>'{}'},'key',[],Array.isArray),[]);
});
