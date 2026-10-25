import {icon,cardArtwork,htDiagram,signalPath,coaxSection,waveLesson} from './visuals.js';
const drawings={ht:htDiagram,simplex:()=>signalPath(false),repeater:()=>signalPath(true),coax:coaxSection,wave:waveLesson};
for(const mount of document.querySelectorAll('[data-drawing]')){
 const draw=drawings[mount.dataset.drawing];if(draw)mount.innerHTML=draw();
}
const routeIcons=[['estacao-base','radio'],['/aprendizado/roe','waves'],['ht.html','radio'],['locator','locator'],['coaxiais','cable'],['faixas','waves'],['emergencias','shield'],['flowerpot','antenna'],['chokes','coil'],['exposicao','shield'],['antenas','antenna'],['morse','morse'],['repet','antenna'],['simulado','book']];
for(const card of document.querySelectorAll('.card')){
 const href=card.querySelector('.card__actions a')?.getAttribute('href')||'';
 const kind=routeIcons.find(([part])=>href.includes(part))?.[1]||'book';
 if(card.closest('.home-highlights')){
  const art=document.createElement('div');art.className=`card-art card-art--${kind}`;art.setAttribute('aria-hidden','true');
  const label=kind==='radio'?'VFO / MR':kind==='locator'?'MAIDENHEAD':'HF / VHF / UHF';
  art.innerHTML=`${cardArtwork(kind)}<span class="card-art__label">${label}</span>`;card.prepend(art);
 }else{
  const title=card.querySelector('.card__title');if(title)title.insertAdjacentHTML('beforebegin',`<span class="card-symbol">${icon(kind)}</span>`);
 }
}
for(const heading of document.querySelectorAll('.site-menu__group-title')){
 const label=heading.textContent.toLocaleLowerCase('pt-BR');
 const kind=label.includes('ferramentas')?'tools':label.includes('aprendizado')?'book':label.includes('comunidade')?'people':label.includes('simulados')?'book':null;
 if(kind)heading.insertAdjacentHTML('afterbegin',icon(kind));
}
