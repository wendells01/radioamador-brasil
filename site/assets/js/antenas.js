import {dipoleDiagram} from './visuals.js';
// Calculadora de antenas — lógica pura + binding DOM (sem DOM no import Node).
export const MIN_MHZ = 0.1;
export const MAX_MHZ = 100000;
export const FACTOR = 0.954; // fator prático/ideal aproximado, apenas informativo
export const WAVELENGTH_NUMERATOR = 299.792458;
export const DIPOLE_TOTAL_NUMERATOR = 143;
export const DIPOLE_ARM_NUMERATOR = 71.5;

const FREQ_RE = /^\d+(?:[.,]\d+)?$/;

// Valida a string inteira antes de converter. Aceita vírgula OU ponto, não ambos.
export function parseFrequencyMHz(raw) {
  const s = String(raw == null ? "" : raw).trim();
  if (s === "") return { ok: false, code: "empty" };
  if (!FREQ_RE.test(s)) return { ok: false, code: "format" };
  const mhz = Number(s.replace(",", "."));
  if (!Number.isFinite(mhz)) return { ok: false, code: "format" };
  if (mhz < MIN_MHZ || mhz > MAX_MHZ) return { ok: false, code: "range" };
  return { ok: true, mhz };
}

export function calculate(mhz) {
  return {
    wavelength: WAVELENGTH_NUMERATOR / mhz,
    dipoleTotal: DIPOLE_TOTAL_NUMERATOR / mhz,
    dipoleArm: DIPOLE_ARM_NUMERATOR / mhz,
  };
}

export function formatMeters(value) {
  return `${value.toFixed(3).replace(".", ",")} m`;
}

const MESSAGES = {
  empty: "Informe uma frequência.",
  format: "Formato inválido. Use apenas números com vírgula ou ponto decimal (ex.: 146 ou 14,2).",
  range: `Use uma frequência entre ${formatMhzLabel(MIN_MHZ)} e ${formatMhzLabel(MAX_MHZ)} MHz.`,
};

function formatMhzLabel(v) {
  return String(v).replace(".", ",");
}

function init() {
  const form = document.getElementById("antena-form");
  if (!form) return;
  const input = form.querySelector(".field__input");
  const error = form.querySelector(".field__error");
  const result = document.getElementById("antena-result");

  function update() {
    const parsed = parseFrequencyMHz(input.value);
    input.setAttribute('aria-invalid',String(!parsed.ok));
    for(const button of form.querySelectorAll('[data-antenna-frequency]')){
      button.setAttribute('aria-pressed',String(parsed.ok&&Number(button.dataset.antennaFrequency.replace(',','.'))===parsed.mhz));
    }
    if (!parsed.ok) {
      error.textContent = MESSAGES[parsed.code] || MESSAGES.format;
      result.textContent = ""; // limpa resultado anterior (sem números obsoletos)
      return;
    }
    error.textContent = "";
    const r = calculate(parsed.mhz);
    result.textContent = "";
    const context=document.createElement('p');context.className='antenna-result-context';context.textContent=`Dipolo de meia onda · ${formatMhzLabel(parsed.mhz)} MHz`;
    result.append(context);
    result.append(
      makeRow("Comprimento de onda", formatMeters(r.wavelength)),
      makeRow("Dipolo total", formatMeters(r.dipoleTotal)),
      makeRow("Cada braço", formatMeters(r.dipoleArm)),
    );
    const meta = document.createElement("p");
    meta.className = "result__meta";
    meta.textContent =
      "Dipolo total e cada braço usam o comprimento prático de um dipolo de meia onda (fator aproximado 0,954 sobre a meia onda ideal).";
    result.append(meta);
    result.insertAdjacentHTML("beforeend", dipoleDiagram(r));
  }
  form.addEventListener("submit", event=>{event.preventDefault();update();});
  input.addEventListener("input",update);
  for(const button of form.querySelectorAll('[data-antenna-frequency]'))button.addEventListener('click',()=>{
    input.value=button.dataset.antennaFrequency;update();
  });
  update();
}

function makeRow(label, value) {
  const row = document.createElement("div");
  row.className = "result__row";
  const l = document.createElement("span");
  l.className = "result__label";
  l.textContent = label;
  const v = document.createElement("span");
  v.className = "result__value";
  v.textContent = value;
  row.append(l, v);
  return row;
}

if (typeof document !== "undefined") {
  init();
}
