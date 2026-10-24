import {locatorCell,routeDiagram} from '../visuals.js';
import {toLocator,fromLocator,parsePoint,route} from './locator.js';
import {fmt,esc,stats,render} from './ui.js';
const $=id=>document.getElementById(id);
function bind(form,output,calculate){$(form).addEventListener('submit',event=>{event.preventDefault();render($(output),calculate);});}
bind('coordinates-form','coordinates-result',()=>{
 const locator=toLocator($('latitude').value,$('longitude').value,Number($('precision').value));
 return `<p class="locator-code">${esc(locator)}</p><p>Seu locator Maidenhead de ${locator.length} caracteres. Ele identifica uma área, não um endereço.</p>${locatorCell(fromLocator(locator))}`;
});
// One request per explicit click; no tracking, storage or network submission.
const locationButton=$('use-location'),locationStatus=$('location-status');
let locating=false,coordinatesEdited=false;
for(const id of ['latitude','longitude']) $(id).addEventListener('input',()=>{if(locating) coordinatesEdited=true;});
locationButton.hidden=false;
locationButton.addEventListener('click',()=>{
 if(locating) return;
 if(!window.isSecureContext){
  locationStatus.textContent='A localização precisa de uma conexão HTTPS. Neste endereço HTTP, use as coordenadas manualmente ou abra o site publicado com HTTPS.';return;
 }
 if(!navigator.geolocation){locationStatus.textContent='Este navegador não oferece localização. Você pode preencher as coordenadas manualmente.';return;}
 locating=true;coordinatesEdited=false;locationButton.disabled=true;locationButton.setAttribute('aria-busy','true');
 locationStatus.textContent='Buscando sua localização… Aguarde e autorize o acesso no navegador.';
 const finish=()=>{locating=false;locationButton.disabled=false;locationButton.removeAttribute('aria-busy');};
 const fail=error=>{
  finish();
  const messages={1:'Permissão de localização negada. Você pode liberar o acesso nas configurações do navegador ou preencher as coordenadas manualmente.',2:'Não foi possível obter sua localização. Tente novamente em um local com melhor sinal ou preencha as coordenadas manualmente.',3:'O tempo para obter a localização terminou. Tente novamente ou preencha as coordenadas manualmente.'};
  locationStatus.textContent=messages[error?.code]||'A localização não está disponível. Tente novamente ou preencha as coordenadas manualmente.';
 };
 try{navigator.geolocation.getCurrentPosition(position=>{
  const {latitude,longitude,accuracy}=position.coords;
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180){fail({code:2});return;}
  finish();
  if(coordinatesEdited){locationStatus.textContent='Você editou as coordenadas durante a busca. Seus valores foram mantidos. Toque novamente para usar a localização.';return;}
  $('latitude').value=String(latitude);$('longitude').value=String(longitude);
  $('coordinates-form').requestSubmit();
  locationStatus.textContent='Localização preenchida.'+(Number.isFinite(accuracy)&&accuracy>=0?` Margem de precisão informada pelo dispositivo: aproximadamente ${fmt(Math.ceil(accuracy),0)} m.`:'')+' O locator representa uma área; a precisão depende do sinal e da permissão concedida.';
 },fail,{enableHighAccuracy:true,timeout:15000,maximumAge:0});}catch(error){fail(error);}
});
bind('locator-form','locator-result',()=>{
 const p=fromLocator($('grid').value);
 return stats([['Latitude do centro',`${fmt(p.lat,6)}°`],['Longitude do centro',`${fmt(p.lon,6)}°`]])+`<p>Centro da célula ${esc(p.locator)}. Dimensões: ${fmt(p.width,6)}° de longitude × ${fmt(p.height,6)}° de latitude.</p>${locatorCell(p)}`;
});
bind('route-form','route-result',()=>{
 const from=parsePoint($('origin').value),to=parsePoint($('destination').value),r=route(from,to);
 const bearing=value=>value===null?'Não definido':`${fmt(value,1)}°`;
 const compass=r.bearing===null?'':`<svg class="locator-compass" viewBox="0 0 120 120" role="img" aria-label="Azimute inicial: ${esc(bearing(r.bearing))}, a partir do norte verdadeiro"><circle cx="60" cy="60" r="44"/><text x="60" y="10">N</text><text x="112" y="64">L</text><text x="60" y="118">S</text><text x="8" y="64">O</text><g transform="rotate(${r.bearing.toFixed(5)} 60 60)"><path d="M60 91V29m-7 10 7-13 7 13"/></g><circle cx="60" cy="60" r="3"/></svg>`;
 return `${routeDiagram(from,to,r)}<div class="locator-route">${compass}${stats([['Distância aproximada',`${fmt(r.distance,1)} km`],['Azimute inicial A → B',bearing(r.bearing)],['Azimute inicial B → A',bearing(r.reverse)]])}</div><p>${from.center||to.center?'Locators foram convertidos para o centro de suas células. ':''}Direções medidas a partir do norte verdadeiro, no sentido horário. O rumo muda ao longo do trajeto.</p>${r.bearing===null?'<p>Não há rumo inicial único para pontos coincidentes, antípodas ou a partir de um polo.</p>':''}`;
});
