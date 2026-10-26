import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {challengeFor,CHALLENGE_STATS} from '../site/assets/js/daily-challenge.js';
import {DATA} from '../site/assets/js/referencia.js';
import {EXAM_QUESTIONS} from '../site/assets/js/daily-challenge-bank.js';
import {generatedBank,extractBank,verifyDailyBank} from '../scripts/generate-daily-bank.mjs';
const start=Date.UTC(2026,0,1,12);
test('pergunta diária determinística e virada de dia em Brasília',()=>{
 const a=challengeFor(new Date('2026-10-23T03:00:00Z'));
 assert.deepEqual(a,challengeFor(new Date('2026-10-24T02:59:59Z')));
 assert.equal(a.day,'2026-10-23');
 const b=challengeFor(new Date('2026-10-24T03:00:00Z'));assert.equal(b.day,'2026-10-24');assert.notEqual(a.id,b.id);
});
test('ciclo inteiro sem repetir questões e com temas distribuídos',()=>{
 const seen=new Set(),topics=new Map();
 assert.equal(CHALLENGE_STATS.total,EXAM_QUESTIONS.length+DATA.alphabet.length+DATA.qcodes.length);
 assert.ok(CHALLENGE_STATS.total>=250);assert.equal(CHALLENGE_STATS.topics,8);
 for(let day=0;day<CHALLENGE_STATS.total;day++){
  const q=challengeFor(new Date(start+day*86400000));
  assert.ok(!seen.has(q.id),`repetição antes do fim do ciclo: ${q.id}`);seen.add(q.id);
  assert.ok([2,4].includes(q.options.length));assert.equal(new Set(q.options).size,q.options.length);
  assert.ok(q.options.includes(q.answer));assert.ok(q.explanation.includes(q.answer));assert.ok(q.studyUrl.startsWith('/'));
  if(!topics.has(q.topic))topics.set(q.topic,[]);topics.get(q.topic).push(day);
 }
 assert.equal(topics.size,8);
 assert.equal(challengeFor(new Date(start)).id,challengeFor(new Date(start+CHALLENGE_STATS.total*86400000)).id);
 // Each subject remains spread throughout the cycle, not concentrated in a block.
 // Discrete day slots allow one rounding step per other subject.
 for(const [topic,days] of topics){
  const gaps=days.map((day,i)=>i?day-days[i-1]:day+CHALLENGE_STATS.total-days.at(-1));
  assert.ok(Math.max(...gaps)<=Math.ceil(CHALLENGE_STATS.total/days.length)+topics.size-1,topic);
 }
});
test('banco derivado é reproduzível, sem enunciados duplicados e com proveniência',()=>{
 verifyDailyBank('site');
 assert.equal(readFileSync('site/assets/js/daily-challenge-bank.js','utf8'),generatedBank('site'));
 assert.equal(new Set(EXAM_QUESTIONS.map(q=>q.id)).size,EXAM_QUESTIONS.length);
 assert.equal(new Set(EXAM_QUESTIONS.map(q=>q.question.toLocaleLowerCase('pt-BR'))).size,EXAM_QUESTIONS.length);
 const banks=new Map(['a','b','c'].map(cls=>[`/simulados/classe-${cls}.html`,extractBank(readFileSync(`site/simulados/classe-${cls}.html`,'utf8'))]));
 for(const q of EXAM_QUESTIONS){
  const original=banks.get(q.studyUrl).find(row=>row.id===q.sourceId);
  assert.ok(original);assert.notEqual(original.category,'Legislação');
  assert.equal(q.answer,original.answer?'Certo':'Errado');
  assert.ok(q.explanation.includes(original.explanation));
  assert.ok(q.question.endsWith(original.text.replace(/^(?:Situação de prova|Questão aplicada)\s*—\s*/i,'').trim()));
 }
 assert.ok(EXAM_QUESTIONS.filter(q=>q.answer==='Errado').length>EXAM_QUESTIONS.length/4);
 const originals=JSON.parse(readFileSync('sources/quiz-banks.json')).banks;
 for(const cls of ['a','b','c'])assert.equal(createHash('sha256').update(JSON.stringify(extractBank(readFileSync(`site/simulados/classe-${cls}.html`,'utf8')))).digest('hex'),originals[cls]);
});
test('extrai somente JSON, inclusive colchetes em strings, sem executar scripts',()=>{
 const rows=[{text:'Texto com ]; e "aspas"',answer:true}];
 assert.deepEqual(extractBank(`<script>const BANK=${JSON.stringify(rows)};throw new Error('não executar');</script>`),rows);
 assert.throws(()=>extractBank('<html>sem banco</html>'),/ausente/);
});
