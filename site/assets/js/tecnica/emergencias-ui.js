import {EMERGENCIES,filterEmergencies} from './emergencias.js';
import {esc,source} from './ui.js';
const $=id=>document.getElementById(id);
for(const [id,key] of [['em-category','category'],['em-type','classification']]) $(id).insertAdjacentHTML('beforeend',[...new Set(EMERGENCIES.map(r=>r[key]))].map(v=>`<option>${esc(v)}</option>`).join(''));
function update(){const rows=filterEmergencies($('em-query').value,$('em-category').value,$('em-type').value);
$('em-count').textContent=`${rows.length} referências encontradas.`;
$('em-results').innerHTML=rows.map(r=>`<article class="tech-panel"><h3>${r.category==='Telefones'?`<a href="tel:${r.frequency}">${r.frequency}</a>`:esc(r.frequency)}</h3><p><strong>${esc(r.classification)}</strong> · ${esc(r.category)}</p><p>${esc(r.purpose)}. Modo: ${esc(r.mode)}. Abrangência: ${esc(r.scope)}.</p><p>${esc(r.restriction)}</p><p class="tech-source">${source(r.source)} · Verificado em 23/10/2026.</p></article>`).join('')||'<p>Nenhuma referência encontrada.</p>';
}
for(const id of ['em-query','em-category','em-type'])$(id).addEventListener('input',update);update();
