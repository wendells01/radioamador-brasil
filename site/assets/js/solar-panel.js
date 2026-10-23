/* Painel próprio pt-BR. O navegador só lê o snapshot local, nunca o XML
   externo (sem CORS). A coleta horária fica em scripts/update-solar-data.py.
   Créditos, data da fonte e aviso de indisponibilidade permanecem visíveis. */
import {BAND_LABELS, CONDITIONS, validateSnapshot, isStale, geomagneticLabel, solarDate} from './solar-data.js';

const panel = document.querySelector('[data-solar-panel]');
if (panel) {
  const content = panel.querySelector('[data-solar-content]');
  const status = panel.querySelector('[data-solar-status]');
  const retry = panel.querySelector('[data-solar-retry]');
  const format = new Intl.NumberFormat('pt-BR', {maximumFractionDigits:1});
  let busy = false;
  let lastGood = null;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function metric(label, value, suffix='') {
    const card = element('div', 'solar-dashboard__metric');
    card.append(element('dt', '', label), element('dd', '', value === null ? 'Sem dados' : `${typeof value === 'number' ? format.format(value) : value}${suffix}`));
    return card;
  }

  function conditionCell(key) {
    const cell = element('td', `solar-condition solar-condition--${key}`);
    cell.append(element('span', 'solar-condition__dot'), element('span', '', CONDITIONS[key]));
    cell.firstChild.setAttribute('aria-hidden', 'true');
    return cell;
  }

  function render(data) {
    content.replaceChildren();
    const time = element('time', '', solarDate(data.updatedAt));
    time.dateTime = data.updatedAt;
    const date = element('p', 'solar-dashboard__updated', 'Atualização da fonte: ');
    date.append(time, document.createTextNode(' · horário de Brasília'));
    content.append(date);
    const layout = element('div', 'solar-dashboard__layout');
    const table = element('table', 'solar-dashboard__table');
    table.append(element('caption', '', 'Condições estimadas de propagação em HF'));
    const head = element('thead');
    const heading = element('tr');
    for (const text of ['Faixas', 'Dia', 'Noite']) {
      const th = element('th', '', text); th.scope = 'col'; heading.append(th);
    }
    head.append(heading); table.append(head);
    const body = element('tbody');
    for (const band of data.bands) {
      const row = element('tr');
      const th = element('th', '', BAND_LABELS[band.name]); th.scope = 'row';
      row.append(th, conditionCell(band.day), conditionCell(band.night)); body.append(row);
    }
    table.append(body); layout.append(table);
    const metrics = element('dl', 'solar-dashboard__metrics');
    const i = data.indicators;
    metrics.append(metric('Fluxo solar (SFI)', i.flux), metric('Manchas solares (SN)', i.sunspots), metric('Índice A', i.aIndex), metric('Índice K', i.kIndex), metric('Vento solar', i.wind, ' km/s'), metric('Raios-X', i.xray));
    layout.append(metrics); content.append(layout);
    content.append(element('p','solar-dashboard__summary', `Campo geomagnético: ${geomagneticLabel(i.geomag)}. Ruído estimado pela fonte: ${i.noise || 'Sem dados'}.`));
    content.hidden = false;
  }

  async function load() {
    if (busy) return;
    busy = true;
    retry.disabled = true;
    retry.hidden = true;
    status.textContent = 'Carregando dados solares…';
    panel.dataset.solarState = 'loading';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      // Nova leitura do arquivo local, não nova consulta ao HamQSL.
      const response = await fetch('/assets/data/solar.json', {signal:controller.signal, cache:'no-cache'});
      if (!response.ok) throw new Error('Snapshot indisponível.');
      const data = validateSnapshot(await response.json());
      lastGood = data;
      render(data);
      const stale = isStale(data);
      panel.dataset.solarState = stale ? 'stale' : 'loaded';
      status.textContent = stale
        ? 'Dados com mais de 6 horas. Exibindo a última informação disponível; ela pode não representar as condições atuais.'
        : 'Dados reais do HamQSL, coletados no máximo uma vez por hora.';
      retry.hidden = !stale;
    } catch {
      panel.dataset.solarState = 'unavailable';
      status.textContent = lastGood
        ? 'Não foi possível atualizar. A última leitura continua abaixo; confira a data.'
        : 'Dados indisponíveis no momento. Tente novamente ou consulte a fonte HamQSL.';
      content.hidden = !lastGood;
      retry.hidden = false;
    } finally {
      clearTimeout(timer);
      retry.disabled = false;
      busy = false;
    }
  }
  retry.addEventListener('click', load);
  load();
}
