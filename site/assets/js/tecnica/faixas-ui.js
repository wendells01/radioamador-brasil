import {filterBands} from './faixas.js';
import {renderBands} from './faixas-view.js';
const $=id=>document.getElementById(id);
function update(){const rows=filterBands({query:$('band-query').value,region:$('region').value,operator:$('operator').value});
 $('band-count').textContent=`${rows.length} segmentos encontrados.`;
 $('bands').innerHTML=renderBands(rows);
}
for(const id of ['band-query','region','operator'])$(id).addEventListener('input',update);update();
