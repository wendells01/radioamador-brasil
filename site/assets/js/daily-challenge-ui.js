import {challengeFor,CHALLENGE_STATS} from './daily-challenge.js';
import {esc} from './tecnica/ui.js';
const target=document.querySelector('[data-daily-challenge]');
if(target){
 const q=challengeFor(),date=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'numeric',month:'long'}).format(new Date());
 target.innerHTML=`<p class="daily-challenge__date">${esc(date)} · ${esc(q.topic)}</p><p class="daily-challenge__bank">Banco com ${CHALLENGE_STATS.total} questões em ${CHALLENGE_STATS.topics} temas</p><form><fieldset><legend>${esc(q.question)}</legend><div class="daily-challenge__choices">${q.options.map((option,i)=>`<label><input type="radio" name="daily-answer" value="${i}" required><span>${esc(option)}</span></label>`).join('')}</div></fieldset><button class="btn btn--accent" type="submit">Conferir resposta</button></form><div class="daily-challenge__feedback" role="status" aria-live="polite" tabindex="-1" hidden></div>`;
 const form=target.querySelector('form'),feedback=target.querySelector('[role=status]');
 const storageKey='daily-challenge-answer';
 const showAnswer=(chosen,focus=false)=>{
  const correct=q.options[chosen]===q.answer;
  for(const input of form.querySelectorAll('input')){input.checked=Number(input.value)===chosen;input.disabled=true;}
  feedback.innerHTML=`<strong class="daily-challenge__result">${correct?'Resposta correta':'Resposta incorreta'}</strong><p>${esc(q.explanation)}</p><a href="${esc(q.studyUrl)}">${esc(q.studyLabel)} <span aria-hidden="true">→</span></a>`;
  feedback.dataset.correct=String(correct);feedback.hidden=false;if(focus)feedback.focus();
  const button=form.querySelector('button');button.textContent='Respondido';button.disabled=true;
 };
 try{
  const saved=JSON.parse(localStorage.getItem(storageKey));
  if(saved?.day===q.day&&saved.id===q.id&&Number.isInteger(saved.chosen)&&saved.chosen>=0&&saved.chosen<q.options.length)showAnswer(saved.chosen);
  else localStorage.removeItem(storageKey);
 }catch{}
 form.addEventListener('submit',event=>{
  event.preventDefault();const chosen=new FormData(form).get('daily-answer');if(chosen===null)return;
  showAnswer(Number(chosen),true);
  try{localStorage.setItem(storageKey,JSON.stringify({day:q.day,id:q.id,chosen:Number(chosen)}));}catch{}
 });
}
