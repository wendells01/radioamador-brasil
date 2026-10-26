export const MOTOROLA_MANUAL='https://docs-be.motorolasolutions.com/bundle/59627/raw/resource/enus/MN006555A01_AD_multilingual_Talkabout_Two-Way_Radio_T21X_T27X_Series_User_Guide.pdf';
const channels=frequencies=>frequencies.map((frequency,i)=>({channel:i+1,frequency}));
export const PROFILES=[
 {id:'talkabout-br',name:'Talkabout · Brasil · 26 canais',file:'talkabout-t21x-t27x-br-rx.csv',prefix:'BR',origin:'Motorola · MN006555A01-AD · tabela 6',source:MOTOROLA_MANUAL+'#page=19',scope:'Referência do manual T21X/T27X para a versão brasileira. Não é uma tabela universal de todos os Talkabout.',channels:channels([462562500,462575000,462587500,462600000,462612500,462625000,462637500,462650000,462662500,462675000,462687500,462700000,462712500,467562500,467575000,467587500,467600000,467612500,467625000,467637500,467650000,467662500,467675000,467687500,467700000,467712500])},
 {id:'bf777',name:'BF-777S · referência de 16 canais',file:'bf777-referencia-rx.csv',prefix:'BF',origin:'UV Rápido · lista reportada para BF-777S',source:'https://www.uvrapido.com.br/bf-777_frequencias.php',scope:'Lista publicada pelo UV Rápido, não confirmada como programação de fábrica de toda unidade BF-777S/BF-888S. Um rádio já programado pode ter outros canais.',channels:channels([462125000,462225000,462325000,462425000,462525000,462625000,462725000,462825000,462925000,463025000,463125000,463225000,463525000,450225000,460325000,469950000])},
 {id:'talkabout-int',name:'Talkabout · internacional · 22 canais',file:'talkabout-t21x-t27x-internacional-rx.csv',prefix:'INT',origin:'Motorola · MN006555A01-AD · tabela 4',source:MOTOROLA_MANUAL+'#page=18',scope:'Tabela para EUA, Canadá, México e Panamá no manual T21X/T27X. A numeração difere da tabela Brasil; confira o modelo e a região do seu rádio.',channels:channels([462562500,462587500,462612500,462637500,462662500,462687500,462712500,467562500,467587500,467612500,467637500,467662500,467687500,467712500,462550000,462575000,462600000,462625000,462650000,462675000,462700000,462725000])}
];
// Frequencies are integer Hz. Never round or infer channel numbers from a region name.
export const mhz=frequency=>(frequency/1e6).toFixed(6);
export const memoryName=(profile,channel)=>`${profile.prefix}${String(channel).padStart(2,'0')}`;
const csvCell=value=>/[",\r\n]/.test(String(value))?`"${String(value).replaceAll('"','""')}"`:String(value);
export function chirpCsv(profile){
 const header=['Location','Name','Frequency','Duplex','Offset','Tone','rToneFreq','cToneFreq','DtcsCode','DtcsPolarity','RxDtcsCode','CrossMode','Mode','TStep','Skip','Comment'];
 const rows=profile.channels.map(({channel,frequency})=>[channel,memoryName(profile,channel),mhz(frequency),'off','0.000000','','88.5','88.5','023','NN','023','Tone->Tone','NFM','5.00','',`RX only; sem filtro de tom; ${profile.origin}`]);
 return [header,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
