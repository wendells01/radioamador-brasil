import test from 'node:test';import assert from 'node:assert/strict';
import {point,toLocator,fromLocator,parsePoint,route} from '../site/assets/js/tecnica/locator.js';
const near=(a,b,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);
test('referências Maidenhead e coordenadas pt-BR',()=>{
 assert.equal(toLocator('-23,5505','-46,6333'),'GG66qk');
 assert.equal(toLocator(41.714,-72.728),'FN31pr');
 assert.equal(toLocator(41.714,-72.728,4),'FN31');
 assert.equal(fromLocator(' fn31PR ').locator,'FN31pr');
 assert.deepEqual(parsePoint(' -23,5505; -46.6333 '),{lat:-23.5505,lon:-46.6333,center:false});
 assert.equal(parsePoint('GG66').center,true);
});
test('centros de células e subcélulas voltam ao mesmo locator em todo o globo',()=>{
 for(const precision of [4,6])for(let lat=-89.5;lat<90;lat+=7.1)for(let lon=-179.5;lon<180;lon+=13.3){
  const locator=toLocator(lat,lon,precision),p=fromLocator(locator);
  assert.equal(toLocator(p.lat,p.lon,precision),locator);
  assert.ok(Math.abs(p.lat-lat)<=p.height/2+1e-9);
  assert.ok(Math.abs(p.lon-lon)<=p.width/2+1e-9);
 }
 near(fromLocator('JJ00').lat,.5);near(fromLocator('JJ00').lon,1);
 assert.equal(toLocator(-90,-180),'AA00aa');
 assert.equal(toLocator(90,180),'AR09ax');
 assert.equal(toLocator(0,180),toLocator(0,-180));
});
test('equador, antimeridiano, rumo de retorno e casos sem rumo único',()=>{
 const quarter=route(point(0,0),point(0,90));near(quarter.distance,6371.0088*Math.PI/2);near(quarter.bearing,90);near(quarter.reverse,270);
 const crossing=route(point(0,179),point(0,-179));near(crossing.distance,222.390160467);near(crossing.bearing,90);
 const north=route(point(-10,0),point(10,0));near(north.bearing,0);near(north.reverse,180);
 const same=route(point(0,0),point(0,0));assert.equal(same.distance,0);assert.equal(same.bearing,null);
 const antipodes=route(point(0,0),point(0,180));assert.equal(antipodes.bearing,null);assert.equal(antipodes.reverse,null);
 assert.equal(route(point(90,0),point(0,0)).bearing,null);
 const a=point(-23.5505,-46.6333),b=point(-22.9068,-43.1729);near(route(a,b).distance,route(b,a).distance);
});
test('entradas inválidas não são interpretadas como coordenadas ou locators',()=>{
 for(const value of ['',null,Infinity,NaN,'23 graus','1.000,5'])assert.throws(()=>point(value,0));
 assert.throws(()=>point(91,0));assert.throws(()=>point(0,181));assert.throws(()=>toLocator(0,0,8));
 for(const value of ['ZZ99','JJ0','JJ00zz','JJ0000','JJ00aaaa',';','1;2;3','-91;0'])assert.throws(()=>parsePoint(value));
});
