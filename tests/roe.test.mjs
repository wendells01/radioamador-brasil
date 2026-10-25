import test from 'node:test';
import assert from 'node:assert/strict';
import {reflection,envelope} from '../site/assets/js/aprendizado/roe.js';
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} ≠ ${expected}`);
test('casamento ideal: sem reflexão e perda de retorno infinita',()=>{
 const r=reflection(1,100);assert.equal(r.reflected,0);assert.equal(r.net,100);assert.equal(r.returnLoss,Infinity);
});
test('ROE de tensão converte para potência usando o quadrado do coeficiente',()=>{
 close(reflection(2).reflected,100/9);close(reflection(3).reflected,25);close(reflection(5).reflected,400/9);
 close(reflection(2).returnLoss,20*Math.log10(3));
 for(const swr of [1,1.1,1.5,2,3,5,100]){const r=reflection(swr,57.3);close(r.net+r.reflected,r.forward);assert.ok(r.net>0);}
});
test('envoltória reproduz a razão entre máximos e mínimos de tensão',()=>{
 for(const swr of [1,1.5,2,3,5]){
  const r=reflection(swr),values=envelope(r.gamma).map(p=>p.amplitude);
  close(Math.max(...values)/Math.min(...values),swr);
 }
});
test('rejeita valores inválidos sem inventar resultado',()=>{
 for(const swr of [0,-1,NaN,Infinity])assert.throws(()=>reflection(swr),RangeError);
 for(const power of [0,-1,NaN,Infinity])assert.throws(()=>reflection(2,power),RangeError);
});
