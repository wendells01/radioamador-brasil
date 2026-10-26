export const CATEGORIES=['Legislação','Técnica e Ética Operacional','Eletrônica e Eletricidade'];
export const RULES={C:{count:15,minimum:8,minutes:20},B:{count:20,minimum:11,minutes:30},A:{count:30,minimum:16,minutes:40}};
export const cleanText=text=>text.replace(/^(?:(?:Situação de prova|Questão aplicada)\s*—\s*)+/i,'').trim();
const normalize=text=>cleanText(text).normalize('NFKC').toLocaleLowerCase('pt-BR').replace(/\s+/g,' ').trim();
export const questionKey=q=>`${q.category}|${normalize(q.text)}`;
// Numeric variants belong to one study family; keep their distinct statements.
export const conceptKey=q=>`${q.category}|${normalize(q.explanation).replace(/\d+(?:[.,]\d+)?/g,'#')}`;
export function prepareBank(bank){
 const groups=new Map();
 for(const q of bank){
  const key=questionKey(q),existing=groups.get(key);
  if(existing){if(existing.answer!==q.answer)throw new Error(`Gabaritos conflitantes: ${q.id}`);existing.aliases.push(q.id);}
  else groups.set(key,{...q,text:cleanText(q.text),aliases:[q.id],concept:conceptKey(q)});
 }
 return [...groups.values()];
}
export function randomInt(max){
 if(max<=1)return 0;
 if(globalThis.crypto?.getRandomValues){const a=new Uint32Array(1),limit=2**32-(2**32%max);do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%max;}
 return Math.floor(Math.random()*max);
}
export function shuffle(rows,rng=randomInt){const out=[...rows];for(let i=out.length-1;i>0;i--){const j=rng(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
export const seenCount=(usage,id)=>Number.isSafeInteger(usage[id])&&usage[id]>0?usage[id]:0;
// Least-seen statements first, then alternate concepts. Never select a duplicate.
export function selectQuestions(pool,n,usage={},rng=randomInt){
 if(!Number.isFinite(n)||n<=0)return [];
 n=Math.floor(n);
 const tiers=new Map(),out=[],conceptTotals=new Map(),sessionTotals=new Map();
 for(const q of pool){const count=seenCount(usage,q.id);if(!tiers.has(count))tiers.set(count,[]);tiers.get(count).push(q);conceptTotals.set(q.concept,(conceptTotals.get(q.concept)||0)+count);}
 for(const count of [...tiers.keys()].sort((a,b)=>a-b)){
  const groups=new Map();for(const q of shuffle(tiers.get(count),rng)){if(!groups.has(q.concept))groups.set(q.concept,[]);groups.get(q.concept).push(q);}
  while(groups.size&&out.length<Math.min(n,pool.length)){
   const keys=shuffle([...groups.keys()],rng).sort((a,b)=>(sessionTotals.get(a)||0)-(sessionTotals.get(b)||0)||(conceptTotals.get(a)||0)-(conceptTotals.get(b)||0));
   const key=keys[0],rows=groups.get(key);out.push(rows.pop());sessionTotals.set(key,(sessionTotals.get(key)||0)+1);if(!rows.length)groups.delete(key);
  }
  if(out.length>=Math.min(n,pool.length))break;
 }
 return out;
}
export function scoreQuiz(quiz,answers,cls,exam){
 const parts=CATEGORIES.filter(cat=>quiz.some(q=>q.category===cat)).map(category=>{
  const rows=quiz.filter(q=>q.category===category);let hits=0,misses=0,blank=0;
  for(const q of rows){const a=answers[q.id];if(typeof a!=='boolean')blank++;else if(a===q.answer)hits++;else misses++;}
  return {category,total:rows.length,hits,misses,blank,passed:hits>=RULES[cls].minimum};
 });
 const total=quiz.length,hits=parts.reduce((n,p)=>n+p.hits,0),misses=parts.reduce((n,p)=>n+p.misses,0),blank=total-hits-misses;
 return {parts,total,hits,misses,blank,pct:total?Math.round(100*hits/total):0,passed:exam?parts.length===3&&parts.every(p=>p.passed):null};
}
export const remainingSeconds=(deadline,now=Date.now())=>Math.max(0,Math.ceil((deadline-now)/1000));
export function readStored(storage,key,fallback,valid){try{const value=JSON.parse(storage.getItem(key));return valid(value)?value:fallback;}catch{return fallback;}}
export function canonicalErrors(bank,ids){return bank.filter(q=>q.aliases.some(id=>ids.includes(id))).map(q=>q.id);}
