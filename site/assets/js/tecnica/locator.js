// Maidenhead (4/6 characters) and shortest great-circle routes on a mean sphere.
const R=6371.0088;
const rad=n=>n*Math.PI/180;
const deg=n=>n*180/Math.PI;
export function coordinate(value,label,min,max){
 if(typeof value==='string'){
  if(!/^[+-]?\d+(?:[.,]\d+)?$/.test(value.trim()))throw new RangeError(`${label}: use graus decimais, com ponto ou vírgula.`);
  value=Number(value.trim().replace(',','.'));
 }
 if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new RangeError(`${label}: informe um valor entre ${min} e ${max}.`);
 return value;
}
export function point(lat,lon){return {lat:coordinate(lat,'Latitude',-90,90),lon:coordinate(lon,'Longitude',-180,180)};}
export function toLocator(lat,lon,precision=6){
 const p=point(lat,lon);
 if(![4,6].includes(precision))throw new RangeError('Use locator de 4 ou 6 caracteres.');
 let x=p.lon===180?0:p.lon+180,y=Math.min(p.lat+90,180-1e-10);
 const a=Math.floor(x/20),b=Math.floor(y/10);x-=a*20;y-=b*10;
 const c=Math.floor(x/2),d=Math.floor(y);x-=c*2;y-=d;
 return String.fromCharCode(65+a,65+b)+`${c}${d}`+(precision===6?String.fromCharCode(97+Math.min(23,Math.floor(x*12)),97+Math.min(23,Math.floor(y*24))):'');
}
export function fromLocator(value){
 const locator=String(value).trim().toUpperCase();
 if(!/^[A-R]{2}\d{2}(?:[A-X]{2})?$/.test(locator))throw new RangeError('Locator inválido. Use 4 ou 6 caracteres, como GG66 ou GG66qk.');
 let lon=(locator.charCodeAt(0)-65)*20+Number(locator[2])*2-180;
 let lat=(locator.charCodeAt(1)-65)*10+Number(locator[3])-90;
 const width=locator.length===6?1/12:2,height=locator.length===6?1/24:1;
 if(locator.length===6){lon+=(locator.charCodeAt(4)-65)/12;lat+=(locator.charCodeAt(5)-65)/24;}
 return {lat:lat+height/2,lon:lon+width/2,locator:toLocator(lat+height/2,lon+width/2,locator.length),width,height,center:true};
}
export function parsePoint(value){
 const text=String(value).trim();
 if(text.includes(';')){
  const parts=text.split(';');
  if(parts.length!==2)throw new RangeError('Use latitude; longitude, separadas por ponto e vírgula.');
  return {...point(parts[0],parts[1]),center:false};
 }
 return fromLocator(text);
}
export function route(from,to){
 const a=point(from.lat,from.lon),b=point(to.lat,to.lon);
 const p=rad(a.lat),q=rad(b.lat),dl=rad(b.lon-a.lon),dp=q-p;
 const h=Math.max(0,Math.min(1,Math.sin(dp/2)**2+Math.cos(p)*Math.cos(q)*Math.sin(dl/2)**2));
 const angle=2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
 const undefinedRoute=angle<1e-12||Math.PI-angle<1e-7;
 const bearing=(x,y,delta)=>{
  if(undefinedRoute||Math.abs(Math.cos(x))<1e-12)return null;
  return (deg(Math.atan2(Math.sin(delta)*Math.cos(y),Math.cos(x)*Math.sin(y)-Math.sin(x)*Math.cos(y)*Math.cos(delta)))+360)%360;
 };
 return {distance:R*angle,bearing:bearing(p,q,dl),reverse:bearing(q,p,-dl)};
}
