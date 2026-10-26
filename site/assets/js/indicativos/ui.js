import {makeLookup,normalizeCall,validCall,ageDays} from './core.js';
const $=id=>document.getElementById(id),lookup=makeLookup();
let controller=null,sequence=0;
const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
const date=value=>new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'});
function metadata(meta){
 $('lookup-base-date').textContent=`Base coletada em ${date(meta.collectedAt)} · conferida em ${date(meta.checkedAt)} (Brasília).`;
 $('lookup-records').textContent=meta.records.toLocaleString('pt-BR');$('lookup-calls').textContent=meta.callsigns.toLocaleString('pt-BR');
 $('lookup-stale').hidden=ageDays(meta.checkedAt)<=3;
 if(!$('lookup-stale').hidden)$('lookup-stale').textContent=`A última verificação desta cópia foi há ${ageDays(meta.checkedAt)} dias. Confirme alterações recentes na Anatel.`;
}
function setStatus(message,state){$('lookup-status').textContent=message;$('lookup-status').dataset.state=state;}
function result({call,rows}){
 $('lookup-results').replaceChildren();$('lookup-result-heading').textContent=rows.length?`${call} · ${rows.length} ${rows.length===1?'registro de estação':'registros de estações'}`:`${call} não foi encontrado nesta base.`;
 $('lookup-result-summary').textContent=rows.length?'Os campos abaixo são reproduzidos da base pública. Um indicativo pode identificar mais de uma estação.':'Isso não comprova disponibilidade do indicativo. Cadastros recentes, indicativos especiais e alterações podem exigir confirmação na Anatel.';
 $('lookup-qrz').href=`https://www.qrz.com/db/${encodeURIComponent(call)}`;$('lookup-qrz').hidden=!rows.length;
 for(const [i,row] of rows.entries()){
  const card=node('article',undefined,'lookup-station');card.append(node('p',`Registro ${String(i+1).padStart(2,'0')} · ${row.type||'Tipo não informado'}`,'eyebrow'),node('h3',row.name));
  const sections=[
   ['Titular e identificação',[
    ['Tipo de identificação',row.identificationType],
    [row.identificationType==='CPF'?'CPF (máscara da Anatel)':row.identificationType==='CNPJ'?'CNPJ':'CPF/CNPJ',row.document],
    ['Classe COER',row.class],['UF do titular / entidade',row.holderState],
   ]],
   ['Estação e operação',[
    ['Indicativo',call],['Nome da estação',row.stationName],['Número da estação',row.stationNumber],
    ['Tipo de estação',row.type],['Município da estação',row.city],['UF da estação',row.state],
    ['Serviço',row.service],['Fistel do serviço da estação',row.fistel],
    ['Frequências cadastradas',row.frequencies],
   ]],
   ['Licenciamento',[
    ['Primeiro licenciamento',row.firstLicensed],['Último licenciamento',row.lastLicensed],
    ['Validade da estação',row.validUntil],['Status de validade no arquivo',row.status],
   ]],
  ];
  for(const [title,fields] of sections){
   const section=node('section',undefined,'lookup-field-group');section.append(node('h4',title));
   const list=node('dl');
   for(const [label,value] of fields){const div=node('div');if(label==='Frequências cadastradas')div.className='lookup-field-wide';div.append(node('dt',label),node('dd',value||'Não informado'));list.append(div);}
   section.append(list);card.append(section);
  }
  $('lookup-results').append(card);
 }
 $('lookup-result').hidden=false;
}
async function submit(event){
 event?.preventDefault();controller?.abort();const token=++sequence;
 const call=normalizeCall($('lookup-call').value);$('lookup-call').value=call;
 if(!validCall(call)){$('lookup-submit').disabled=false;$('lookup-form').removeAttribute('aria-busy');$('lookup-call').setAttribute('aria-invalid','true');setStatus('Digite o indicativo completo, como PU2TSL, sem sufixos de operação como /P.','invalid');$('lookup-call').focus();return;}
 $('lookup-call').removeAttribute('aria-invalid');controller?.abort();controller=new AbortController();
 $('lookup-submit').disabled=true;$('lookup-form').setAttribute('aria-busy','true');$('lookup-result').hidden=true;setStatus(`Consultando ${call}…`,'loading');
 try{const response=await lookup.lookup(call,controller.signal);if(token!==sequence)return;metadata(response.metadata);result(response);setStatus(response.rows.length?`Consulta concluída: ${response.rows.length} ${response.rows.length===1?'registro encontrado':'registros encontrados'}.`:'Consulta concluída: nenhum registro encontrado.','done');$('lookup-result-heading').focus({preventScroll:true});}
 catch(error){if(token!==sequence||error.name==='AbortError')return;setStatus('Não foi possível consultar a base agora. Tente novamente ou confira diretamente no painel da Anatel.','error');}
 finally{if(token===sequence){$('lookup-submit').disabled=false;$('lookup-form').removeAttribute('aria-busy');}}
}
$('lookup-form').addEventListener('submit',submit);
$('lookup-call').addEventListener('input',()=>{$('lookup-call').removeAttribute('aria-invalid');});
$('lookup-clear').addEventListener('click',()=>{sequence++;controller?.abort();$('lookup-call').value='';$('lookup-result').hidden=true;$('lookup-results').replaceChildren();$('lookup-call').removeAttribute('aria-invalid');$('lookup-submit').disabled=false;$('lookup-form').removeAttribute('aria-busy');setStatus('Digite um indicativo para começar.','idle');$('lookup-call').focus();});
lookup.metadata().then(metadata).catch(()=>{$('lookup-base-date').textContent='A data da base estará disponível quando a conexão for restabelecida.';});
