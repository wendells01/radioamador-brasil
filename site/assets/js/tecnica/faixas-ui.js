import {filterBands} from './faixas.js';
import {renderBands} from './faixas-view.js';
const $=id=>document.getElementById(id);
const regions={LF:'Ondas longas',MF:'Ondas médias',HF:'Ondas curtas',VHF:'Muito altas',UHF:'Ultra-altas',SHF:'Superaltas',EHF:'Extremamente altas'};
const overview=$('spectrum-overview');
function drawSpectrum(){
 const selected=$('region').value;
 overview.innerHTML=`<div class="spectrum-heading"><strong>Explore o espectro</strong><span>Menor frequência → maior frequência</span></div><div class="spectrum-map" role="group" aria-label="Filtrar por região do espectro">${Object.entries(regions).map(([region,label])=>{
 const count=filterBands({query:$('band-query').value,operator:$('operator').value,region}).length;
 return `<button type="button" data-region="${region}" aria-pressed="${selected===region}" aria-label="${region}: ${label}, ${count} segmentos nos filtros atuais"><strong>${region}</strong><span>${count} seg.</span></button>`;
 }).join('')}</div><p class="spectrum-note">Blocos esquemáticos, sem escala. Toque em uma região para filtrar; toque novamente para mostrar todas. Os limites exatos permanecem nos registros abaixo.</p>`;
}
overview.addEventListener('click',event=>{
 const button=event.target.closest('[data-region]');if(!button)return;
 const value=button.dataset.region;$('region').value=$('region').value===value?'':value;update();
 overview.querySelector(`[data-region="${value}"]`).focus();
});
function update(){const rows=filterBands({query:$('band-query').value,region:$('region').value,operator:$('operator').value});
 $('band-count').textContent=`${rows.length} segmentos encontrados.`;
 $('bands').innerHTML=renderBands(rows);drawSpectrum();
}
for(const id of ['band-query','region','operator'])$(id).addEventListener('input',update);update();
