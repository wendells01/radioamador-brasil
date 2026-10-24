import {DATA} from './referencia.js';
import {EXAM_QUESTIONS} from './daily-challenge-bank.js';
const references=[
 ...DATA.alphabet.map(row=>({id:`alphabet-${row.letra}`,topic:'Alfabeto fonético',question:`Como se soletra a letra ${row.letra} no alfabeto fonético?`,answer:row.palavra,pool:DATA.alphabet.map(r=>r.palavra),explanation:`A letra ${row.letra} é soletrada como ${row.palavra}.`,studyUrl:'/referencia.html',studyLabel:'Consultar o alfabeto fonético'})),
 ...DATA.qcodes.map(row=>({id:row.codigo,topic:'Código Q',question:`Qual código Q corresponde a “${row.significado}”?`,answer:row.codigo,pool:DATA.qcodes.map(r=>r.codigo),explanation:`${row.codigo}: ${row.significado}.`,studyUrl:'/referencia.html',studyLabel:'Consultar os códigos Q'}))
];
// Space each topic across the whole cycle, rather than exhausting one block first.
const groups=new Map();
for(const q of [...references,...EXAM_QUESTIONS]){
 if(!groups.has(q.topic))groups.set(q.topic,[]);
 groups.get(q.topic).push(q);
}
const questions=[...groups].flatMap(([topic,rows])=>rows.map((q,i)=>({q,rank:(i+.5)/rows.length,topic})))
 .sort((a,b)=>a.rank-b.rank||(a.topic<b.topic?-1:a.topic>b.topic?1:0)).map(row=>row.q);
export const CHALLENGE_STATS=Object.freeze({total:questions.length,topics:groups.size,examQuestions:EXAM_QUESTIONS.length});
const mod=(n,m)=>(n%m+m)%m;
export function challengeFor(date=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
 const get=type=>parts.find(p=>p.type===type).value;
 const day=`${get('year')}-${get('month')}-${get('day')}`;
 const seed=Math.floor(Date.UTC(Number(get('year')),Number(get('month'))-1,Number(get('day')))/86400000);
 const q=questions[mod(seed,questions.length)];
 if(q.options)return {...q,day,options:[...q.options]};
 const distractors=[];
 for(let step=0;distractors.length<3;step++){
  const option=q.pool[mod(seed+step*7,q.pool.length)];
  if(option!==q.answer&&!distractors.includes(option))distractors.push(option);
 }
 const options=[...distractors];options.splice(mod(seed,4),0,q.answer);
 return {...q,pool:undefined,day,options};
}
