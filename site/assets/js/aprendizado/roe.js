// Same measurement plane and reference impedance for forward and reflected waves.
export function reflection(swr,forward=100){
 if(!Number.isFinite(swr)||swr<1)throw new RangeError('A ROE precisa ser um número igual ou maior que 1.');
 if(!Number.isFinite(forward)||forward<=0)throw new RangeError('A potência direta precisa ser maior que zero.');
 const gamma=(swr-1)/(swr+1),fraction=gamma*gamma;
 return {swr,forward,gamma,fraction,reflected:forward*fraction,net:forward*(1-fraction),returnLoss:gamma===0?Infinity:-20*Math.log10(gamma)};
}
export function envelope(gamma,points=181){
 return Array.from({length:points},(_,i)=>{
  const x=i/(points-1);
  return {x,amplitude:Math.sqrt(Math.max(0,1+gamma*gamma+2*gamma*Math.cos(6*Math.PI*x)))};
 });
}
