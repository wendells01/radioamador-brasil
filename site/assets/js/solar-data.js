// Snapshot do XML HamQSL; classes são categóricas, não percentuais de sucesso.
export const BAND_LABELS = {'80m-40m':'80–40 m', '30m-20m':'30–20 m', '17m-15m':'17–15 m', '12m-10m':'12–10 m'};
export const CONDITIONS = {good:'Boa', fair:'Regular', poor:'Ruim', unknown:'Sem dados'};
export const STALE_MS = 6 * 60 * 60 * 1000;
const numericKeys = ['flux', 'sunspots', 'aIndex', 'kIndex', 'wind', 'magneticField'];
const textKeys = ['xray', 'geomag', 'noise'];
export function validateSnapshot(raw) {
  if (!raw || raw.version !== 1 || !raw.indicators || !Array.isArray(raw.bands)) throw new Error('Formato de dados solares inválido.');
  for (const key of ['updatedAt','fetchedAt']) {
    if (typeof raw[key] !== 'string' || !/^\d{4}-\d\d-\d\dT.*Z$/.test(raw[key]) || !Number.isFinite(Date.parse(raw[key]))) throw new Error('Horário dos dados solares inválido.');
  }
  const indicators = {};
  for (const key of numericKeys) {
    const value = raw.indicators[key];
    indicators[key] = typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
  for (const key of textKeys) indicators[key] = typeof raw.indicators[key] === 'string' ? raw.indicators[key].slice(0,48) : null;
  const bands = Object.keys(BAND_LABELS).map(name => {
    const rows = raw.bands.filter(row => row?.name === name);
    if (rows.length > 1) throw new Error('Faixa duplicada nos dados solares.');
    const row = rows[0];
    const condition = period => Object.hasOwn(CONDITIONS, row?.[period]) ? row[period] : 'unknown';
    return {name, day:condition('day'), night:condition('night')};
  });
  if (bands.every(row => row.day === 'unknown' && row.night === 'unknown')) throw new Error('Condições solares indisponíveis.');
  return {updatedAt:raw.updatedAt, fetchedAt:raw.fetchedAt, indicators, bands};
}
export function isStale(snapshot, now = Date.now()) {
  return now - Date.parse(snapshot.updatedAt) > STALE_MS || now - Date.parse(snapshot.fetchedAt) > STALE_MS;
}
export function geomagneticLabel(value) {
  const labels = {'QUIET':'Calmo','UNSETTLED':'Instável','ACTIVE':'Ativo','MINOR STORM':'Tempestade fraca','MODERATE STORM':'Tempestade moderada','MAJOR STORM':'Tempestade forte','SEVERE STORM':'Tempestade severa','STORM':'Tempestade'};
  return labels[String(value).trim().toUpperCase()] || 'Sem classificação disponível';
}
export function solarDate(value) {
  return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(value));
}
