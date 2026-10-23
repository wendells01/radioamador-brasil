export const fmt=(n,d=2)=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:d}).format(n);
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const source=(url,label='Fonte técnica')=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} (nova aba)</a>`;
export function table(headers,rows,caption){return `<div class="tech-table" role="region" tabindex="0" aria-label="${esc(caption)}"><table><caption>${esc(caption)}</caption><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>i?`<td>${v}</td>`:`<th scope="row">${v}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
export function stats(entries){return `<dl class="tech-stats">${entries.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;}
export const bar=(eff,label)=>`<div class="power-bar" role="img" aria-label="${esc(label)}"><span style="width:${Math.max(0,Math.min(100,eff))}%"></span></div>`;
export function render(target,fn){try{target.innerHTML=fn();target.dataset.state='valid';}catch(e){target.innerHTML=`<p class="tech-error">${esc(e.message)}</p>`;target.dataset.state='error';}}
export function bindForm(id,update){const f=document.getElementById(id);f.addEventListener('submit',e=>{e.preventDefault();update();});f.addEventListener('input',update);f.addEventListener('change',update);update();}
