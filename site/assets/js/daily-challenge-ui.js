import {challengeFor,CHALLENGE_STATS} from './daily-challenge.js';
import {esc} from './tecnica/ui.js';
const target=document.querySelector('[data-daily-challenge]');
if(target){
 const q=challengeFor(),date=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'numeric',month:'long'}).format(new Date());
 target.innerHTML=`<p class="daily-challenge__date">${esc(date)} · ${esc(q.topic)}</p><p class="daily-challenge__bank">Banco com ${CHALLENGE_STATS.total} questões em ${CHALLENGE_STATS.topics} temas</p><form><fieldset><legend>${esc(q.question)}</legend><div class="daily-challenge__choices">${q.options.map((option,i)=>`<label><input type="radio" name="daily-answer" value="${i}" required><span>${esc(option)}</span></label>`).join('')}</div></fieldset><button class="btn btn--accent" type="submit">Conferir resposta</button></form><p class="daily-challenge__feedback" role="status" aria-live="polite" tabindex="-1" hidden></p>`;
 const form=target.querySelector('form'),feedback=target.querySelector('[role=status]');
 form.addEventListener('submit',event=>{
  event.preventDefault();const chosen=new FormData(form).get('daily-answer');if(chosen===null)return;
  const correct=q.options[Number(chosen)]===q.answer;
  feedback.innerHTML=`${correct?'Acertou!':'Quase!'} ${esc(q.explanation)} <a href="${esc(q.studyUrl)}">${esc(q.studyLabel)}</a>.`;
  feedback.dataset.correct=String(correct);feedback.hidden=false;feedback.focus();
  for(const input of form.querySelectorAll('input'))input.disabled=true;
  const button=form.querySelector('button');button.textContent='Respondido';button.disabled=true;
 });
}
