const filters=document.querySelector('#antenna-filters');
if(filters){
 const cards=[...document.querySelectorAll('[data-antenna-card]')],query=document.querySelector('#antenna-search'),application=document.querySelector('#antenna-application'),family=document.querySelector('#antenna-family');
 const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const update=()=>{
  const text=normalize(query.value.trim());let count=0;
  for(const card of cards){
   const show=normalize(card.textContent).includes(text)&&(!application.value||card.dataset.applications.split(' ').includes(application.value))&&(!family.value||card.dataset.family===family.value);
   card.hidden=!show;if(show)count++;
  }
  document.querySelector('#antenna-count').textContent=`${count} ${count===1?'tipo encontrado':'tipos encontrados'}`;
  document.querySelector('#antenna-empty').hidden=count!==0;
 };
 filters.addEventListener('submit',event=>{event.preventDefault();update();});filters.addEventListener('input',update);filters.addEventListener('change',update);
 document.querySelector('#antenna-reset').addEventListener('click',()=>{filters.reset();update();query.focus();});update();
}
