const picker=document.querySelector('#channel-profile');
if(picker){
 const panels=[...document.querySelectorAll('[data-program-profile]')],query=document.querySelector('#channel-query');
 const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replaceAll(',','.');
 const update=()=>{
  let shown=0,total=0;
  for(const panel of panels){
   const active=panel.dataset.programProfile===picker.value;panel.hidden=!active;
   const rows=[...panel.querySelectorAll('tbody tr')];
   for(const row of rows){row.hidden=active&&!normalize(row.textContent).includes(normalize(query.value.trim()));if(active){total++;if(!row.hidden)shown++;}}
  }
  document.querySelector('#channel-count').textContent=`${shown} de ${total} canais exibidos`;
  document.querySelector('#channel-empty').hidden=shown!==0;
 };
 picker.addEventListener('change',()=>{query.value='';update();});query.addEventListener('input',update);
 for(const link of document.querySelectorAll('[data-preview-profile]'))link.addEventListener('click',()=>{picker.value=link.dataset.previewProfile;query.value='';update();});
 document.querySelector('#channel-reset').addEventListener('click',()=>{query.value='';update();query.focus();});update();
}
