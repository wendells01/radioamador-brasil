const bench=document.querySelector('[data-bench]');
if(bench){
 const controls=[...bench.querySelectorAll('[data-bench-part]')],panels=[...document.querySelectorAll('[data-part-panel]')];
 const select=(id,reveal=false)=>{
  for(const panel of panels)panel.hidden=panel.dataset.partPanel!==id;
  for(const control of controls){
   if(control.dataset.benchPart===id)control.setAttribute('aria-current','true');else control.removeAttribute('aria-current');
  }
  bench.dataset.selected=id;
  for(const line of bench.querySelectorAll('[data-bench-leader]'))line.classList.toggle('is-selected',line.dataset.benchLeader===id);
  if(reveal){
   const panel=document.querySelector(`[data-part-panel="${id}"]`),rect=panel.getBoundingClientRect();
   if(rect.top>innerHeight-120||rect.bottom<100)panel.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  const heading=document.querySelector(`[data-part-panel="${id}"] h3`);
  document.querySelector('#bench-announcement').textContent=`Selecionado: ${heading.textContent}. A explicação selecionada está junto ao desenho.`;
 };
 for(const control of controls)control.addEventListener('click',event=>{event.preventDefault();select(control.dataset.benchPart,true);});
 select('radio');
}
