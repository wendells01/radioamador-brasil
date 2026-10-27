import {CATEGORIES,RULES,prepareBank,selectQuestions,scoreQuiz,remainingSeconds,readStored,canonicalErrors,seenCount} from './core.js';
const $=id=>document.getElementById(id),root=document.querySelector('[data-exam-class]');
const cls=root.dataset.examClass,rule=RULES[cls],bank=prepareBank(BANK),byId=new Map(bank.map(q=>[q.id,q]));
const keys={C:['radioBrasilC2026Errors','radioBrasilC2026History'],B:['monstroB_errors_v3','monstroB_history_v3'],A:['radioBrasilA_errors_v1','radioBrasilA_history_v1']};
const [errorKey,historyKey]=keys[cls],usageKey=`radioBrasil${cls}Usage_v1`,activeKey=`radioBrasil${cls}Session_v1`;
let storage=null;try{storage=window.localStorage;}catch{}
const array=value=>Array.isArray(value),object=value=>value&&typeof value==='object'&&!Array.isArray(value);
let usage=readStored(storage,usageKey,{},object);
let errors=canonicalErrors(bank,readStored(storage,errorKey,[],array));
let history=readStored(storage,historyKey,[],array).filter(row=>object(row)&&typeof row.date==='string'&&Number.isFinite(row.hits)&&Number.isFinite(row.total));
const validSession=s=>object(s)&&['exam','train','errors'].includes(s.mode)&&Array.isArray(s.ids)&&s.ids.length>0&&s.ids.length<=bank.length&&new Set(s.ids).size===s.ids.length&&s.ids.every(id=>byId.has(id))&&Number.isInteger(s.index)&&s.index>=0&&s.index<s.ids.length&&object(s.answers)&&Object.entries(s.answers).every(([id,a])=>s.ids.includes(Number(id))&&typeof a==='boolean')&&Array.isArray(s.shown)&&s.shown.every(id=>s.ids.includes(id))&&(s.mode!=='exam'||(Number.isFinite(s.deadline)&&typeof s.category==='string'&&s.ids.length===rule.count*3&&CATEGORIES.every(c=>s.ids.filter(id=>byId.get(id).category===c).length===rule.count)));
let session=readStored(storage,activeKey,null,validSession),timer=null,view='home';
const element=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
function write(key,value){try{if(!storage)throw Error();storage.setItem(key,JSON.stringify(value));return true;}catch{$('storage-note').hidden=false;$('storage-note').textContent='O armazenamento do navegador está indisponível ou cheio. Você pode continuar nesta visita, mas o progresso pode não ser salvo.';return false;}}
function remove(key){try{storage?.removeItem(key);}catch{}}
function notice(text){$('exam-notice').textContent=text;$('exam-notice').hidden=!text;}
function isTimed(){return session?.mode==='exam'&&session.timed!==false;}
function saveSession(){if(session)write(activeKey,session);}
function show(id){view=id;for(const name of ['home','quiz','result','history'])$(name).hidden=name!==id;clearInterval(timer);timer=null;document.body.dataset.quizView=id;window.scrollTo({top:0,behavior:'instant'});}
function renderHome(){
 show('home');
 for(const cat of CATEGORIES)document.querySelector(`[data-bank-count="${cat}"]`).textContent=bank.filter(q=>q.category===cat).length;
 const seen=bank.filter(q=>seenCount(usage,q.id)>0).length;
 $('coverage-label').textContent=`${seen} de ${bank.length} enunciados distintos já apresentados.`;$('coverage').max=bank.length;$('coverage').value=seen;
 $('error-count').textContent=errors.length;
 $('resume-panel').hidden=!session;
 if(session)$('resume-info').textContent=`Questão ${session.index+1} de ${session.ids.length}. ${isTimed()?'O tempo da matéria continua correndo enquanto você está fora.':'Sessão sem limite de tempo.'}`;
 trainingCount();
}
function trainingCount(){const pool=poolFor($('catSel').value),requested=$('countSel').value==='all'?pool.length:Number($('countSel').value);$('training-count').textContent=`Esta rodada terá ${Math.min(requested,pool.length)} questões de ${pool.length} enunciados distintos disponíveis.`;}
function poolFor(category){return category==='all'?bank:bank.filter(q=>q.category===category);}
function start(mode,category='all',requested=rule.count){
 if(session&&!confirm('Começar uma nova rodada e substituir a sessão salva? Seu histórico e seus erros serão mantidos.'))return;
 notice('');
 let quiz;
 if(mode==='exam')quiz=CATEGORIES.flatMap(c=>selectQuestions(poolFor(c),rule.count,usage));
 else if(mode==='errors'){const pool=bank.filter(q=>errors.includes(q.id));if(!pool.length){notice('Você não tem erros pendentes nesta classe. Faça um treino para começar.');return;}quiz=selectQuestions(pool,pool.length,usage);}
 else {const pool=poolFor(category);quiz=selectQuestions(pool,requested==='all'?pool.length:Number(requested),usage);}
 if(!quiz.length)return;
 const timed=mode==='exam'&&$('exam-use-timer').checked;
 session={mode,timed,ids:quiz.map(q=>q.id),index:0,answers:{},shown:[],category:quiz[0].category,deadline:timed?Date.now()+rule.minutes*60000:0};
 show('quiz');loadQuestion();
}
function currentQuiz(){return session.ids.map(id=>byId.get(id));}
function setErrors(q,correct){errors=errors.filter(id=>id!==q.id);if(!correct)errors.push(q.id);write(errorKey,errors);}
function markSeen(q){if(session.shown.includes(q.id))return;session.shown.push(q.id);usage[q.id]=seenCount(usage,q.id)+1;write(usageKey,usage);}
function updateTimer(){
 if(!session||view!=='quiz')return;
 if(!isTimed()){$('timer').textContent='Sem limite';return;}
 const seconds=remainingSeconds(session.deadline);
 $('timer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
 $('timer').classList.toggle('exam-timer--urgent',seconds<=60);
 if(seconds===0)expireBlock();
}
function expireBlock(){
 clearInterval(timer);timer=null;
 const category=session.category;
 while(session.index<session.ids.length&&byId.get(session.ids[session.index]).category===category)session.index++;
 notice(`O tempo de ${category} terminou. Questões sem resposta contam no total da matéria.`);
 if(session.index>=session.ids.length){finish();return;}
 session.category=byId.get(session.ids[session.index]).category;session.deadline=Date.now()+rule.minutes*60000;loadQuestion();
}
function scoreStats(){
 const quiz=currentQuiz(),score=scoreQuiz(quiz,session.answers,cls,session.mode==='exam');
 $('num').textContent=`${session.index+1}/${quiz.length}`;
 $('quiz-progress').max=quiz.length;$('quiz-progress').value=Object.keys(session.answers).length;
 $('session-score').textContent=session.mode==='exam'?`${Object.keys(session.answers).length} respostas registradas`:`${score.hits} acertos · ${score.misses} erros`;
}
function renderFeedback(q){
 const response=session.answers[q.id],answered=typeof response==='boolean';
 $('answerBtns').hidden=answered;$('feedback').hidden=!answered;$('next').hidden=!answered;
 $('feedback').replaceChildren();
 if(!answered)return;
 if(session.mode==='exam'){$('feedback').className='exam-feedback';$('feedback').append(element('strong',`Resposta registrada: ${response?'Certo':'Errado'}.`),element('p','O gabarito e as explicações estarão no resultado.'));}
 else {const ok=response===q.answer;$('feedback').className=`exam-feedback ${ok?'is-correct':'is-wrong'}`;const title=element('strong',ok?'Resposta correta':'Resposta incorreta');title.prepend(checkIcon(ok));$('feedback').append(title,element('p',`Gabarito: ${q.answer?'Certo':'Errado'}. ${q.explanation}`));}
 $('next').textContent=session.index===session.ids.length-1?'Ver resultado →':'Próxima questão →';
}
function checkIcon(ok){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',ok?'m5 12 4 4L19 6':'m6 6 12 12M18 6 6 18');svg.append(path);return svg;}
function loadQuestion(){
 if(session.index>=session.ids.length){finish();return;}
 const q=byId.get(session.ids[session.index]);
 if(isTimed()&&session.category!==q.category){session.category=q.category;session.deadline=Date.now()+rule.minutes*60000;}
 // An expired restored block advances before displaying or counting a new question.
 if(isTimed()&&remainingSeconds(session.deadline)===0){expireBlock();return;}
 markSeen(q);saveSession();
 $('sectionLabel').textContent=session.mode==='exam'?`Completo · Classe ${cls}`:session.mode==='errors'?'Revisão dos seus erros':`Treino · Classe ${cls}`;
 $('qcat').textContent=q.category;$('qtext').textContent=q.text;
 $('quiz-help').textContent=session.mode==='exam'?`Aprovação no simulado: pelo menos ${rule.minimum}/${rule.count} em cada matéria. ${isTimed()?'O cronômetro continua ao sair ou bloquear a tela.':'Cronômetro desativado nesta sessão.'}`:'Sem cronômetro. Leia a explicação antes de avançar; acertar remove a questão da lista de erros.';
 $('timer').classList.remove('exam-timer--urgent');renderFeedback(q);scoreStats();clearInterval(timer);updateTimer();if(isTimed())timer=setInterval(updateTimer,250);
 $('qtext').focus({preventScroll:true});
}
function answer(choice){
 if(!session||view!=='quiz')return;
 if(isTimed()&&remainingSeconds(session.deadline)===0){expireBlock();return;}
 const q=byId.get(session.ids[session.index]);if(typeof session.answers[q.id]==='boolean')return;
 session.answers[q.id]=choice;
 // Keep the exam's answer key hidden until its result, including the errors badge.
 if(session.mode!=='exam')setErrors(q,choice===q.answer);
 saveSession();renderFeedback(q);scoreStats();$('next').focus({preventScroll:true});
}
function next(){if(!session||view!=='quiz'||typeof session.answers[session.ids[session.index]]!=='boolean')return;if(isTimed()&&remainingSeconds(session.deadline)===0){expireBlock();return;}session.index++;loadQuestion();window.scrollTo({top:0,behavior:'instant'});}
function finish(){
 clearInterval(timer);
 const quiz=currentQuiz(),answers={...session.answers},mode=session.mode,timed=isTimed(),score=scoreQuiz(quiz,answers,cls,mode==='exam');
 for(const q of quiz)if(typeof answers[q.id]==='boolean'){errors=errors.filter(id=>id!==q.id);if(answers[q.id]!==q.answer)errors.push(q.id);}else if(mode==='exam'&&!errors.includes(q.id))errors.push(q.id);
 write(errorKey,errors);
 const scores=Object.fromEntries(score.parts.map(p=>[p.category,{hit:p.hits,miss:p.misses,blank:p.blank,total:p.total}]));
 history.unshift({date:new Date().toLocaleString('pt-BR'),mode:mode==='exam'?'official':mode,hits:score.hits,total:score.total,pct:score.pct,passed:score.passed,blank:score.blank,scores,timed,version:2});history=history.slice(0,30);write(historyKey,history);
 session=null;remove(activeKey);show('result');
 $('resultTitle').textContent=mode==='exam'?(score.passed?'Meta atingida nas três matérias.':'Há matérias para reforçar.'):'Treino concluído.';
 $('resultTitle').className=mode==='exam'?(score.passed?'is-correct':'is-wrong'):'';
 $('resultText').textContent=`${score.hits} acertos de ${score.total} questões (${score.pct}%). ${score.misses} erros e ${score.blank} sem resposta.`;
 $('breakdown').replaceChildren();
 for(const p of score.parts){const article=element('article',undefined,'guide-tile');article.append(element('h2',p.category),element('strong',`${p.hits}/${p.total}`,'exam-number'),element('p',`${p.misses} erros · ${p.blank} sem resposta`));if(mode==='exam')article.append(element('p',p.passed?'Meta da matéria atingida':`Mínimo: ${rule.minimum} acertos`,p.passed?'is-correct':'is-wrong'));$('breakdown').append(article);}
 $('answer-review').replaceChildren();
 for(const [i,q] of quiz.entries()){const response=answers[q.id],ok=response===q.answer,details=element('details'),summary=element('summary',`${i+1}. ${typeof response!=='boolean'?'Sem resposta':ok?'Correta':'Incorreta'} · ${q.category}`);summary.className=ok?'is-correct':'is-wrong';details.append(summary,element('p',q.text),element('p',`Sua resposta: ${typeof response==='boolean'?(response?'Certo':'Errado'):'não respondida'}. Gabarito: ${q.answer?'Certo':'Errado'}.`),element('p',q.explanation));$('answer-review').append(details);}
 $('resultTitle').focus({preventScroll:true});
}
function renderHistory(){
 show('history');$('historyBody').replaceChildren();
 if(!history.length)$('historyBody').append(element('p','Você ainda não concluiu uma sessão nesta classe.'));
 for(const row of history){const article=element('article',undefined,'exam-history-row');article.append(element('strong',`${row.hits}/${row.total} · ${row.pct}%`),element('span',`${row.date} · ${row.mode==='official'?`Simulado completo${row.timed===false?' · sem cronômetro':''}`:row.mode==='errors'?'Revisão de erros':'Treino'}${row.version===2?'':' · registro anterior'}`));$('historyBody').append(article);}
 $('history-title').focus({preventScroll:true});
}
function timingHint(){
 $('exam-timer-help').textContent=($('exam-use-timer').checked?`${rule.minutes} minutos por matéria.`:'Sem limite de tempo para concluir.')+` A correção segue os critérios da Classe ${cls}.`;
}
for(const input of document.querySelectorAll('[name="exam-timing"]'))input.addEventListener('change',timingHint);
$('start-exam').addEventListener('click',()=>start('exam'));
for(const button of document.querySelectorAll('[data-subject]'))button.addEventListener('click',()=>start('train',button.dataset.subject));
$('toggle-training').addEventListener('click',()=>{$('training').hidden=!$('training').hidden;$('toggle-training').setAttribute('aria-expanded',String(!$('training').hidden));if(!$('training').hidden)$('catSel').focus();});
$('catSel').addEventListener('change',trainingCount);$('countSel').addEventListener('change',trainingCount);
$('training').addEventListener('submit',event=>{event.preventDefault();start('train',$('catSel').value,$('countSel').value);});
for(const id of ['start-errors','result-errors'])$(id).addEventListener('click',()=>start('errors'));
$('resume-quiz').addEventListener('click',()=>{notice('');show('quiz');loadQuestion();});
$('quit-quiz').addEventListener('click',()=>{saveSession();renderHome();});
$('answer-true').addEventListener('click',()=>answer(true));$('answer-false').addEventListener('click',()=>answer(false));$('next').addEventListener('click',next);
$('show-history').addEventListener('click',renderHistory);
for(const id of ['new-quiz','history-back'])$(id).addEventListener('click',()=>{notice('');renderHome();});
$('reset-progress').addEventListener('click',()=>{if(!confirm(`Apagar histórico, erros, questões vistas e sessão salva apenas da Classe ${cls}?`))return;errors=[];history=[];usage={};session=null;for(const key of [errorKey,historyKey,usageKey,activeKey])remove(key);renderHistory();});
window.addEventListener('pagehide',()=>{if(session&&view==='quiz')saveSession();});
for(const button of document.querySelectorAll('button[disabled]'))button.disabled=false;
renderHome();
if(!storage)write(usageKey,usage);
