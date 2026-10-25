import {reflection,envelope} from './roe.js';
import {fmt} from '../tecnica/ui.js';
const form=document.querySelector('#roe-lab');
if(form){
 const slider=form.querySelector('#roe-value'),power=form.querySelector('#roe-power'),error=document.querySelector('#roe-error');
 const update=()=>{
  try{
   const value=Number(power.value.trim().replace(',','.'));
   const r=reflection(Number(slider.value),value);
   error.hidden=true;error.textContent='';
   document.querySelector('#roe-value-label').textContent=`${fmt(r.swr,1)}:1`;
   document.querySelector('#roe-direct').textContent=`${fmt(r.forward,1)} W`;
   document.querySelector('#roe-reflected').textContent=`${fmt(r.reflected,2)} W`;
   document.querySelector('#roe-net').textContent=`${fmt(r.net,2)} W`;
   document.querySelector('#roe-percentage').textContent=`${fmt(r.fraction*100,2)}%`;
   document.querySelector('#roe-return-loss').textContent=r.returnLoss===Infinity?'∞ dB':`${fmt(r.returnLoss,2)} dB`;
   document.querySelector('#roe-reflection-bar').style.width=`${r.fraction*100}%`;
   document.querySelector('#roe-net-bar').style.width=`${(1-r.fraction)*100}%`;
   document.querySelector('#roe-needle').setAttribute('transform',`rotate(${-80+(r.swr-1)/4*160} 210 205)`);
   const samples=envelope(r.gamma),line=sign=>samples.map(({x,amplitude},i)=>`${i?'L':'M'}${(25+x*550).toFixed(2)} ${(95+sign*amplitude*35).toFixed(2)}`).join(' ');
   document.querySelector('#roe-envelope-top').setAttribute('d',line(-1));
   document.querySelector('#roe-envelope-bottom').setAttribute('d',line(1));
   document.querySelector('#roe-wave-title').textContent=`Envoltória normalizada de tensão para ROE ${fmt(r.swr,1)} para 1`;
   document.querySelector('#roe-lab-results').hidden=false;
   document.querySelector('#roe-meter-reading').textContent=`${fmt(r.swr,1)}:1`;
  }catch(e){
   error.textContent=e.message;error.hidden=false;
   document.querySelector('#roe-lab-results').hidden=true;
  }
 };
 form.addEventListener('submit',e=>{e.preventDefault();update();});
 form.addEventListener('input',update);form.addEventListener('change',update);update();
}
