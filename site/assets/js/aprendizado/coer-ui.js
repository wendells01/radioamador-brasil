const steps=[...document.querySelectorAll('[data-coer-step]')];
if(steps.length){
 const key='primeiro-coer-roteiro-v1';
 const status=document.querySelector('#coer-progress-label');
 let canSave=true;
 try{
  const saved=JSON.parse(localStorage.getItem(key)||'[]');
  if(Array.isArray(saved))for(const step of steps)step.checked=saved.includes(step.dataset.coerStep);
 }catch{canSave=false;}
 const render=()=>{
  const count=steps.filter(step=>step.checked).length;
  status.textContent=`${count} de ${steps.length} etapas marcadas`;
  document.querySelector('#coer-progress').value=count;
  document.querySelector('#coer-save-note').textContent=canSave?'Seu roteiro fica salvo neste navegador.':'Marcações disponíveis nesta visita; armazenamento local indisponível.';
 };
 const save=()=>{
  try{localStorage.setItem(key,JSON.stringify(steps.filter(step=>step.checked).map(step=>step.dataset.coerStep)));canSave=true;}catch{canSave=false;}
  render();
 };
 for(const step of steps)step.addEventListener('change',save);
 document.querySelector('#coer-reset').addEventListener('click',()=>{for(const step of steps)step.checked=false;save();});
 document.querySelector('[data-coer-progress]').hidden=false;
 render();
}
