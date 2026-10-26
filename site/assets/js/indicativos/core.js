export const DATA_ROOT='/assets/data/indicativos';
export const normalizeCall=value=>value.normalize('NFKC').trim().toLocaleUpperCase('pt-BR');
export const validCall=value=>/^[\p{L}]{2}[0-9][\p{L}0-9-]{1,6}$/u.test(value);
export const FIELDS=['name','class','type','city','state','firstLicensed','lastLicensed','validUntil','status'];
export function validManifest(data){return data?.schema===1&&/^[a-f0-9]{20}$/.test(data.revision)&&Number.isSafeInteger(data.records)&&data.records>0&&Number.isSafeInteger(data.callsigns)&&data.callsigns>0&&Array.isArray(data.prefixes)&&data.prefixes.every(p=>/^[\p{L}]{2}[0-9]$/u.test(p))&&Number.isFinite(Date.parse(data.collectedAt))&&Number.isFinite(Date.parse(data.checkedAt));}
export function validShard(data,manifest,prefix){return data?.schema===1&&data.revision===manifest.revision&&data.prefix===prefix&&data.calls&&typeof data.calls==='object'&&!Array.isArray(data.calls);}
export function validRows(rows){return Array.isArray(rows)&&rows.length>0&&rows.every(row=>row&&typeof row==='object'&&FIELDS.every(key=>row[key]===null||typeof row[key]==='string')&&typeof row.name==='string'&&row.name.trim().length>0);}
export function ageDays(timestamp,now=Date.now()){return Math.max(0,Math.floor((now-Date.parse(timestamp))/86400000));}
export function makeLookup(fetcher=globalThis.fetch){
 let manifest=null;
 const cache=new Map();
 async function json(url,signal){const response=await fetcher(url,{signal,cache:'no-cache'});if(!response.ok)throw new Error('A base não respondeu.');return response.json();}
 async function metadata(signal){const value=await json(`${DATA_ROOT}/manifest.json`,signal);if(!validManifest(value))throw new Error('Metadados inválidos.');manifest=value;return value;}
 async function lookup(raw,signal){
  const call=normalizeCall(raw);if(!validCall(call))throw new TypeError('Digite um indicativo completo, como PU2TSL.');
  // Refresh the manifest per search, so long-lived tabs see daily updates.
  const meta=await metadata(signal),prefix=call.slice(0,3),key=`${meta.revision}/${prefix}`;
  if(!meta.prefixes.includes(prefix))return {call,rows:[],metadata:meta};
  let shard=cache.get(key);
  if(!shard){shard=await json(`${DATA_ROOT}/versions/${meta.revision}/${encodeURIComponent(prefix)}.json`,signal);if(!validShard(shard,meta,prefix))throw new Error('Dados inválidos.');cache.set(key,shard);}
  const rows=Object.hasOwn(shard.calls,call)?shard.calls[call]:[];
  if(rows.length&&!validRows(rows))throw new Error('Registros inválidos.');
  return {call,rows,metadata:meta};
 }
 return {metadata,lookup};
}
