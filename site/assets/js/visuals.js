// Lightweight, shared SVG drawings. Numeric results are supplied by the existing engines.
import {esc,fmt} from './tecnica/ui.js';
const paths={
 download:'<path d="M16 3v18m-7-7 7 7 7-7M5 23v6h22v-6"/>',
 search:'<circle cx="14" cy="14" r="10"/><path d="m21 21 8 8"/>',
 radio:'<rect x="6" y="9" width="20" height="20" rx="3"/><path d="M10 9V3m12 6V6M10 14h12M10 18h5M10 23h4"/><circle cx="22" cy="23" r="2"/>',
 antenna:'<path d="m9 29 7-20 7 20M12 22h8M16 9V3M8 6a12 12 0 0 0 0 12M24 6a12 12 0 0 1 0 12M5 2a18 18 0 0 0 0 20M27 2a18 18 0 0 1 0 20"/>',
 locator:'<rect x="5" y="5" width="22" height="22" rx="3"/><path d="M5 12h22M5 20h22M12 5v22M20 5v22"/><circle cx="16" cy="16" r="3"/>',
 waves:'<path d="M2 16c4-16 10-16 14 0s10 16 14 0M2 24h28"/>',
 cable:'<circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="8"/><circle cx="16" cy="16" r="3"/>',
 book:'<path d="M16 8C11 4 5 5 3 6v21c5-2 9-1 13 2 4-3 8-4 13-2V6c-5-2-9-1-13 2Zm0 0v21"/>',
 people:'<circle cx="12" cy="11" r="5"/><path d="M2 29v-4a10 10 0 0 1 20 0v4M22 6a5 5 0 0 1 0 10m4 4a9 9 0 0 1 4 9"/>',
 tools:'<path d="m7 3 6 6-4 4-6-6a9 9 0 0 0 11 11l9 10a4 4 0 0 0 6-6l-10-9A9 9 0 0 0 7 3Z"/>',
 sun:'<circle cx="16" cy="16" r="6"/><path d="M16 2v4m0 20v4M2 16h4m20 0h4M6 6l3 3m14 14 3 3M6 26l3-3M23 9l3-3"/>',
 moon:'<path d="M27 20A12 12 0 0 1 12 5a12 12 0 1 0 15 15Z"/>',
 bolt:'<path d="m18 2-13 17h10l-1 11 13-17H17l1-11Z"/>',
 wind:'<path d="M2 12h20a4 4 0 1 0-4-4M2 18h25a3 3 0 1 1-3 3M2 24h12"/>',
 morse:'<circle cx="5" cy="10" r="2"/><path d="M13 10h15M3 22h15"/><circle cx="26" cy="22" r="2"/>',
 shield:'<path d="m16 3 12 5v8c0 7-12 14-12 14S4 23 4 16V8l12-5Z"/><path d="m10 16 4 4 8-9"/>',
 coil:'<path d="M2 23h4V13c0-8 7-8 7 0v8c0 4-5 4-5 0v-8c0-8 7-8 7 0v8c0 4-5 4-5 0v-8c0-8 7-8 7 0v8c0 4-5 4-5 0v-8c0-8 7-8 7 0v10h7"/>',
 clock:'<circle cx="16" cy="16" r="12"/><path d="M16 8v9l6 4"/>'
};
export function icon(kind,extra=''){return `<svg class="ui-icon ${extra}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[kind]||paths.waves}</svg>`;}
const svg=(title,body,box='0 0 440 240')=>`<svg class="visual-svg" viewBox="${box}" role="img" aria-label="${esc(title)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const text=(x,y,value,cls='')=>`<text x="${x}" y="${y}" class="${cls}">${esc(value)}</text>`;
const figure=(title,body,caption,cls='')=>`<figure class="visual-figure ${cls}">${body}<figcaption><strong>${esc(title)}</strong>${caption?`<span>${esc(caption)}</span>`:''}</figcaption></figure>`;
const radio=(x,y)=>`<g transform="translate(${x} ${y})" class="drawing-line"><rect x="0" y="18" width="48" height="80" rx="9" class="drawing-surface"/><path d="M10 18V0m25 18V9"/><rect x="9" y="32" width="30" height="19" rx="3" class="drawing-tint"/><path d="M10 64h28m-28 8h20m-20 8h20"/><circle cx="37" cy="84" r="3"/></g>`;
export function htDiagram(){return figure('Conheça os controles',''+svg('HT genérico com antena, volume, visor e PTT',`${radio(188,24)}<g class="drawing-line drawing-muted"><path d="M198 24H128M223 33h83M188 80h-60M236 65h70M212 122v30"/></g>${text(35,29,'Antena')}${text(310,38,'Volume')}${text(40,85,'PTT')}${text(310,70,'Visor')}${text(165,175,'Teclado / menu')}`,'0 0 440 195'),'Ilustração genérica. A posição e a função dos controles variam conforme o modelo.');}
export function signalPath(repeater=false){
 const body=repeater?`${radio(30,70)}${radio(360,70)}<g class="drawing-line"><path d="m192 133 28-88 28 88m-43-38h30m-36 20h42M220 45V24"/><path d="M92 92q48-55 100-40m-10-8 10 8-10 6M249 53q53-15 96 40m-1-12 1 12-13-2" class="drawing-accent"/></g>${text(28,202,'Estação A')}${text(178,157,'Repetidora')}${text(348,202,'Estação B')}`:`${radio(65,55)}${radio(327,55)}<g class="drawing-line drawing-accent"><path d="M137 85h164m-10-7 10 7-10 7M301 117H137m10-7-10 7 10 7"/></g>${text(62,187,'Estação A')}${text(326,187,'Estação B')}${text(163,154,'Mesma frequência')}`;
 return figure(repeater?'Via repetidora':'Contato simplex',svg(repeater?'Estação A transmite na entrada da repetidora; a saída é recebida pela estação B.':'Duas estações alternam transmissão e recepção na mesma frequência.',body),repeater?'O HT transmite na entrada e escuta a saída. RX e TX devem ser conferidos separadamente.':'Uma estação fala de cada vez. O caminho se inverte quando muda quem transmite.');
}
export function dipoleDiagram(r){return figure('Seu dipolo, medida por medida',svg('Dipolo com dois braços de '+fmt(r.dipoleArm,3)+' metros e alimentação ao centro',`<g class="drawing-line"><path d="M34 74h177m18 0h177" class="drawing-accent drawing-wire"/><circle cx="220" cy="74" r="7"/><path d="M220 81v84M34 39v15m177-15v15M34 46h177M229 39v15m177-15v15M229 46h177"/><path d="M34 185v14m372-14v14M34 192h372" class="drawing-muted"/></g>${text(67,30,fmt(r.dipoleArm,3)+' m')}${text(260,30,fmt(r.dipoleArm,3)+' m')}${text(237,137,'Alimentação')}${text(147,223,'Total: '+fmt(r.dipoleTotal,3)+' m')}`),'Dimensões iniciais do cálculo. Desenho sem escala; montagem e ajuste por medição continuam necessários.');}
export function locatorCell(p){
 const west=p.lon-p.width/2,south=p.lat-p.height/2;
 let lines='';for(let i=0;i<=4;i++){lines+=`<path d="M${80+i*70} 26v140M80 ${26+i*35}h280"/>`;}
 return figure('Uma célula, não um endereço',svg('Célula '+p.locator+', com centro e limites de latitude e longitude',`<g class="drawing-line drawing-grid">${lines}</g><rect x="150" y="61" width="140" height="70" class="drawing-cell"/><path d="M220 53v86m-78-43h156" class="drawing-line drawing-muted"/><circle cx="220" cy="96" r="5" class="drawing-dot"/>${text(245,90,'Centro')}${text(150,153,p.locator,'drawing-code')}${text(23,195,fmt(west,6)+'°')}${text(416,195,fmt(west+p.width,6)+'°','drawing-right')}${text(65,222,fmt(south,5)+'° a '+fmt(south+p.height,5)+'° lat.')}`),'Esquema ampliado, sem mapa. Limites em graus com sinal: negativos a sul e oeste; positivos a norte e leste.');
}
// Equirectangular preview of the actual great-circle route. Split at the dateline.
export function routeGeometry(a,b,distance){
 const rad=n=>n*Math.PI/180,project=p=>[30+(p.lon+180)/360*380,25+(90-p.lat)/180*160];
 const va=[Math.cos(rad(a.lat))*Math.cos(rad(a.lon)),Math.cos(rad(a.lat))*Math.sin(rad(a.lon)),Math.sin(rad(a.lat))];
 const vb=[Math.cos(rad(b.lat))*Math.cos(rad(b.lon)),Math.cos(rad(b.lat))*Math.sin(rad(b.lon)),Math.sin(rad(b.lat))];
 const angle=distance/6371.0088,paths=[];let last=null;
 if(angle>1e-12&&Math.PI-angle>1e-7){
  for(let i=0;i<=96;i++){
   const t=i/96,u=Math.sin((1-t)*angle)/Math.sin(angle),v=Math.sin(t*angle)/Math.sin(angle);
   const p=va.map((n,j)=>u*n+v*vb[j]);
   const lat=Math.atan2(p[2],Math.hypot(p[0],p[1]))*180/Math.PI,lon=Math.atan2(p[1],p[0])*180/Math.PI;
   const xy=project({lat,lon});
   paths.push(`${last&&Math.abs(xy[0]-last[0])<190?'L':'M'}${xy[0].toFixed(3)} ${xy[1].toFixed(3)}`);last=xy;
  }
 }
 return {a:project(a),b:project(b),path:paths.join(' ')};
}
export function routeDiagram(a,b,r){
 const g=routeGeometry(a,b,r.distance);
 let grid='';for(let x=30;x<=410;x+=95)grid+=`<path d="M${x} 25v160"/>`;for(let y=25;y<=185;y+=40)grid+=`<path d="M30 ${y}h380"/>`;
 const mark=(xy,label)=>`<circle cx="${xy[0]}" cy="${xy[1]}" r="4" class="drawing-dot"/>${text(Math.max(43,Math.min(388,xy[0]+10)),Math.max(42,Math.min(178,xy[1]-10)),label,'drawing-code')}`;
 return figure('Da estação A à estação B',svg('Grade geográfica com as posições das estações e o menor arco entre elas',`<g class="drawing-line drawing-grid">${grid}</g><path d="${g.path}" class="drawing-line drawing-accent"/>${mark(g.a,'A')}${mark(g.b,'B')}${text(30,213,'180° O')}${text(220,213,'0°','drawing-center')}${text(410,213,'180° L','drawing-right')}`),`Grade geográfica sem mapa-base, em projeção retangular. ${fmt(r.distance,1)} km pelo menor arco. ${g.path?'Trajetos que cruzam o antimeridiano aparecem divididos nas bordas.':'Arco não desenhado para pontos coincidentes ou antípodas.'}`);
}
export function chokeDiagram(r,ferrite=false){
 let body='';
 if(ferrite){const n=Math.min(6,r.count);for(let i=0;i<n;i++)body+=`<rect x="${110+i*35}" y="63" width="27" height="83" rx="7" class="drawing-core"/>`;body+=`<path d="M40 105h360" class="drawing-line drawing-accent drawing-wire"/>${text(55,194,fmt(r.count)+' núcleo(s) · '+fmt(r.length)+' mm de conjunto')}`;}
 else{body='<rect x="90" y="65" width="260" height="90" rx="14" class="drawing-support"/>';for(let i=0;i<9;i++)body+=`<ellipse cx="${110+i*27}" cy="110" rx="11" ry="57" class="drawing-line drawing-accent"/>`;body+=`<path d="M40 110h60m236 0h64" class="drawing-line"/>${text(75,205,'Ø externo: '+fmt(r.outerDiameter)+' mm')}${text(90,232,'Altura: '+fmt(r.height)+' mm')}`;}
 return figure(ferrite?'Ferrites sobre o cabo':'Bobina de coaxial',svg(ferrite?'Núcleos alinhados sobre o coaxial intacto.':'Enrolamento de coaxial em uma camada.',body),ferrite?'Cada núcleo tem uma passagem do cabo inteiro. Quantidade desenhada ilustrativa; use o número calculado.':'Esquema sem escala; o número de voltas desenhadas é ilustrativo. As dimensões seguem os parâmetros do cálculo.');
}
export function coaxSection(){return figure('Por dentro de um coaxial',svg('Seção de um cabo coaxial com condutor central, dielétrico, blindagem e capa',`<circle cx="118" cy="110" r="77" class="drawing-core"/><circle cx="118" cy="110" r="65" class="drawing-shield"/><circle cx="118" cy="110" r="53" class="drawing-insulator"/><circle cx="118" cy="110" r="18" class="drawing-conductor"/><g class="drawing-line drawing-muted"><path d="M118 110h114M158 83h74M175 61h57M185 38h47"/></g>${text(246,43,'Capa externa')}${text(246,67,'Blindagem')}${text(246,90,'Dielétrico')}${text(246,116,'Condutor central')}`),'Construção genérica, sem escala. Materiais e camadas variam entre os produtos do catálogo.');}
export function lossChart(samples,selected){
 const maxX=samples.at(-1).length,maxY=Math.max(...samples.map(p=>p.output)),x=n=>58+342*n/maxX,y=n=>175-135*n/Math.max(maxY,1e-12);
 const curve=samples.map((p,i)=>`${i?'L':'M'}${x(p.length).toFixed(3)} ${y(p.output).toFixed(3)}`).join(' ');
 const axis=n=>n===0?'0':n<.01?new Intl.NumberFormat('pt-BR',{notation:'scientific',maximumFractionDigits:1}).format(n):n>=10000?new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1}).format(n):fmt(n,1);
 const ticks=[0,.5,1].map(t=>`<path d="M58 ${y(maxY*t)}h342" class="drawing-line drawing-grid"/>${text(48,y(maxY*t)+5,axis(maxY*t),'drawing-right')}${text(58+342*t,202,axis(maxX*t),t===1?'drawing-right':t===.5?'drawing-center':'')}`).join('');
 return figure('Potência entregue × comprimento',svg('Curva da potência entregue à antena em watts pelo comprimento em metros',`${ticks}<path d="${curve}" class="drawing-line drawing-accent drawing-wire"/><path d="M${x(selected.length)} 40v135" class="drawing-line drawing-dashed"/><circle cx="${x(selected.length)}" cy="${y(selected.output)}" r="5" class="drawing-dot"/>${text(8,22,'W')}${text(395,226,'m')}`),`Mesmo cabo, frequência e perdas adicionais do cálculo. Ponto destacado: ${fmt(selected.length)} m e ${fmt(selected.output)} W. Linha adaptada; valores nominais.`,'loss-chart')+`<details class="chart-data"><summary>Consultar valores do gráfico</summary><dl class="chart-values">${samples.filter((_,i)=>i%8===0).map(p=>`<div><dt>${fmt(p.length)} m</dt><dd>${fmt(p.output)} W</dd></div>`).join('')}</dl></details>`;
}
export function flowerDiagram(r){return figure('Do topo ao ponto de alimentação',svg('Flowerpot: elemento superior sem malha, inferior com coaxial intacto e choke na base',`<g class="drawing-line"><rect x="88" y="17" width="54" height="215" rx="8" class="drawing-support"/><path d="M115 32v85" class="drawing-accent drawing-wire"/><path d="M115 117v87" class="drawing-secondary drawing-wire"/><path d="M115 210c-40 0-40 9 0 9s40 9 0 9-40 9 0 9v25" class="drawing-secondary"/><path d="M155 32h22v85h-22m0 0h22v87h-22" class="drawing-muted"/>${r.sleeve?'<rect x="79" y="96" width="72" height="53" class="drawing-cell"/>':''}</g>${text(195,53,'① Elemento superior')}${text(195,78,fmt(r.upper,0)+' mm · sem malha')}${text(195,139,'② Elemento inferior')}${text(195,164,fmt(r.lower,0)+' mm · intacto')}${text(195,221,'③ Choke na base')}`,'0 0 440 280'),'Esquema sem escala. Preserve o dielétrico do elemento superior. '+(r.sleeve?'A manga externa da variante dual-band está destacada.':'A transição entre os elementos é o final da malha.'));}
export function waveLesson(){
 const wave=(cycles,amp,yy)=>Array.from({length:121},(_,i)=>`${i?'L':'M'}${30+i*3.15} ${(yy-amp*Math.sin(i/120*Math.PI*2*cycles)).toFixed(2)}`).join(' ');
 return figure('Leia uma onda',svg('Duas ondas: a primeira tem menor frequência e maior amplitude que a segunda',`<path d="M30 65h378M30 160h378" class="drawing-line drawing-grid"/><path d="${wave(2,26,65)}" class="drawing-line drawing-accent"/><path d="${wave(4,14,160)}" class="drawing-line drawing-secondary"/>${text(30,21,'Menor frequência · maior amplitude')}${text(30,119,'Maior frequência · menor amplitude')}${text(30,225,'Mesmo intervalo de tempo →')}`),'Frequência é o número de ciclos por segundo; amplitude é a excursão da grandeza representada. No mesmo meio, maior frequência corresponde a menor comprimento de onda.');
}
export function morseRhythm(timeline,unit){
 return `<div class="rhythm-meta"><strong>O ritmo do sinal</strong><span>Ponto: ${fmt(unit,3)} s · traço: ${fmt(unit*3,3)} s</span></div><div class="rhythm-track" aria-hidden="true">${timeline.map((seg,i)=>`<span data-beat="${i}" class="rhythm-beat ${seg.type==='tone'?'rhythm-beat--tone':'rhythm-beat--gap'}" style="--units:${seg.units}">${seg.type==='tone'?(seg.units===3?'−':'·'):''}</span>`).join('')}</div><p class="rhythm-hint">O destaque acompanha o áudio. Ponto = 1 unidade; traço = 3. Pausas entre sinais, letras e palavras: 1, 3 e 7 unidades.</p>`;
}
export function cardArtwork(kind){
 let body;
 if(kind==='radio')body=`${radio(138,15)}<g class="drawing-line drawing-muted"><path d="M58 38h54m-45 13h35M58 91h54m94-53h54m-45 13h35m-45 40h54"/></g><g class="drawing-line drawing-accent"><path d="M126 30q-13 18 0 36m72-36q13 18 0 36M117 23q-20 25 0 50m90-50q20 25 0 50"/></g>`;
 else if(kind==='locator')body=`<g class="drawing-line drawing-grid"><path d="M55 22h210M55 54h210M55 86h210M55 118h210M55 22v96M90 22v96M125 22v96M160 22v96M195 22v96M230 22v96M265 22v96"/></g><rect x="125" y="54" width="35" height="32" class="drawing-cell"/><path d="M142 70q45-58 95-10" class="drawing-line drawing-secondary"/><circle cx="142" cy="70" r="4" class="drawing-dot"/><circle cx="237" cy="60" r="4" class="drawing-dot"/>`;
 else{
  const points=Array.from({length:100},(_,i)=>`${i?'L':'M'}${35+i*2.5} ${(75-Math.sin(i/99*Math.PI*6)*25).toFixed(2)}`).join(' ');
  body=`<g class="drawing-line drawing-grid"><path d="M35 110h250M35 35v75M85 103v14m50-14v14m50-14v14m50-14v14m50-14v14"/></g><path d="${points}" class="drawing-line drawing-accent"/><path d="M35 75h250" class="drawing-line drawing-muted drawing-dashed"/>`;
 }
 return `<svg class="visual-svg card-art__drawing" viewBox="0 0 320 140" aria-hidden="true" focusable="false">${body}</svg>`;
}
