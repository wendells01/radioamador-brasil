// Treinador de Morse — lógica pura de texto/timing (sem DOM no import).
// Binding de UI no fim, protegido por `typeof document`, como em antenas.js.

export const MORSE = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.",
  H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.",
  O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-",
  V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
};

export const MAX_INPUT = 200;
export const DEFAULT_WPM = 15;
export const MIN_WPM = 5;
export const MAX_WPM = 30;

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// NFD, remove marcas combinantes (Ç→C, Ã→A), uppercase, espaços colapsados, trim.
export function normalizeText(raw) {
  return String(raw == null ? "" : raw)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/\s+/gu, " ")
    .trim();
}

export function toMorse(raw) {
  const s = String(raw == null ? "" : raw);
  // Limite aplicado ao texto BRUTO, antes de normalizar.
  if (s.length > MAX_INPUT) return { ok: false, code: "too_long" };
  const text = normalizeText(s);
  if (text === "") return { ok: false, code: "empty" };
  const unsupported = [];
  for (const ch of text) {
    if (ch === " " || Object.prototype.hasOwnProperty.call(MORSE, ch)) continue;
    if (!unsupported.includes(ch)) unsupported.push(ch);
  }
  if (unsupported.length > 0) return { ok: false, code: "unsupported", unsupported };
  const morse = text
    .split(" ")
    .map((word) => word.split("").map((c) => MORSE[c]).join(" "))
    .join(" / ");
  return { ok: true, morse, chars: text };
}

// WPM fora de 5–30 é LIMITADO (clamp), não lança. Padrão 15.
export function clampWpm(wpm) {
  const n = Math.round(Number(wpm));
  if (!Number.isFinite(n)) return DEFAULT_WPM;
  return Math.min(MAX_WPM, Math.max(MIN_WPM, n));
}

// Timeline em unidades: tom 1 (ponto) / 3 (traço); gaps 1/3/7; sem gap final.
export function buildTimeline(morse, wpm = DEFAULT_WPM) {
  const text = String(morse == null ? "" : morse).trim();
  if (text === "") return [];
  const out = [];
  const words = text.split(" / ");
  words.forEach((word, wi) => {
    if (wi > 0) out.push({ type: "gap", units: 7 });
    const letters = word === "" ? [] : word.split(" ");
    letters.forEach((letter, li) => {
      if (li > 0) out.push({ type: "gap", units: 3 });
      for (let i = 0; i < letter.length; i++) {
        if (i > 0) out.push({ type: "gap", units: 1 });
        out.push({ type: "tone", units: letter[i] === "-" ? 3 : 1 });
      }
    });
  });
  return out;
}

export function totalUnits(timeline) {
  return timeline.reduce((sum, seg) => sum + seg.units, 0);
}

// Ponto de referência PARIS: 1,2 segundos por unidade.
export function unitDuration(wpm) {
  return 1.2 / clampWpm(wpm);
}

// Assinatura pedida é timelineDuration(timeline); wpm é opcional (padrão 15)
// porque a duração em segundos depende da velocidade.
export function timelineDuration(timeline, wpm = DEFAULT_WPM) {
  return totalUnits(timeline) * unitDuration(wpm);
}

export function randomChar(rng = Math.random) {
  const r = rng();
  return CHARS[Math.min(CHARS.length - 1, Math.floor(r * CHARS.length))];
}

// ---------------------------------------------------------------------------
// Binding de UI (somente no navegador)
// ---------------------------------------------------------------------------

const UI_MESSAGES = {
  too_long: `Limite de ${MAX_INPUT} caracteres excedido. Encurte o texto.`,
  empty: "Digite um texto para converter.",
};

function unsupportedMessage(chars) {
  return `Caractere${chars.length > 1 ? "s" : ""} não suportado${chars.length > 1 ? "s" : ""}: ${chars.join(", ")}. Use apenas A–Z, 0–9 e espaços.`;
}

async function initMorseUI() {
  const input = document.getElementById("morse-input");
  const output = document.getElementById("morse-output");
  const error = document.getElementById("morse-error");
  const playBtn = document.getElementById("morse-play");
  const stopBtn = document.getElementById("morse-stop");
  const wpmInput = document.getElementById("morse-wpm");
  const status = document.getElementById("morse-status");
  const exInput = document.getElementById("ex-input");
  const exHear = document.getElementById("ex-hear");
  const exCheck = document.getElementById("ex-check");
  const exNew = document.getElementById("ex-new");
  const exFeedback = document.getElementById("ex-feedback");
  if (!input || !output) return;

  const { createPlayer } = await import("./morse-audio.js");
  const player = createPlayer();

  let current = null; // último resultado ok da conversão
  let exerciseChar = randomChar();

  function wpm() {
    return clampWpm(wpmInput ? wpmInput.value : DEFAULT_WPM);
  }

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function convert() {
    const result = toMorse(input.value);
    if (!result.ok) {
      error.textContent = result.code === "unsupported"
        ? unsupportedMessage(result.unsupported)
        : UI_MESSAGES[result.code];
      output.textContent = ""; // nunca deixar resultado antigo obsoleto
      current = null;
      if (player.isPlaying()) { player.stop(); setStatus("Parado"); }
      return;
    }
    error.textContent = "";
    output.textContent = result.morse;
    current = result;
  }

  player.onEnd(() => setStatus("Parado"));
  player.onError(() => setStatus("Falha ao iniciar o áudio. Tente novamente."));

  async function playMorse(morseText) {
    if (!morseText) return;
    const timeline = buildTimeline(morseText, wpm());
    const res = await player.play(timeline, wpm());
    if (!res.ok) {
      setStatus(res.code === "no_audio"
        ? "Web Audio indisponível neste navegador; a conversão em texto continua funcionando."
        : "Não foi possível reproduzir (áudio bloqueado). Clique novamente no botão.");
    } else if (!res.superseded) {
      setStatus("Reproduzindo…");
    }
  }

  input.addEventListener("input", convert);

  if (playBtn) playBtn.addEventListener("click", () => {
    if (!current) { setStatus(UI_MESSAGES.empty); return; }
    playMorse(current.morse);
  });
  if (stopBtn) stopBtn.addEventListener("click", () => { player.stop(); setStatus("Parado"); });
  if (wpmInput) wpmInput.addEventListener("change", () => { player.stop(); setStatus("Parado"); });

  // Exercício: um caractere A–Z/0–9 sorteado; solução só revelada após "Conferir".
  function resetExercise() {
    player.stop();
    exerciseChar = randomChar();
    if (exInput) exInput.value = "";
    if (exFeedback) { exFeedback.textContent = ""; exFeedback.className = "exercise__feedback"; }
  }

  if (exHear) exHear.addEventListener("click", () => playMorse(toMorse(exerciseChar).morse));
  if (exCheck) exCheck.addEventListener("click", () => {
    const guess = normalizeText(exInput ? exInput.value : "");
    if (guess === "") {
      exFeedback.textContent = "Digite sua resposta antes de conferir.";
      exFeedback.className = "exercise__feedback is-bad";
      return;
    }
    if (guess === exerciseChar) {
      exFeedback.textContent = `Correto! ${exerciseChar}.`;
      exFeedback.className = "exercise__feedback is-ok";
    } else {
      exFeedback.textContent = `Você digitou ${guess}. A resposta era ${exerciseChar}.`;
      exFeedback.className = "exercise__feedback is-bad";
    }
  });
  if (exNew) exNew.addEventListener("click", resetExercise);

  window.addEventListener("pagehide", () => player.stop());

  convert(); // converte o exemplo estático inicial
}

if (typeof document !== "undefined") {
  initMorseUI().catch(() => { /* sem binding (ex.: import falhou); página segue estática */ });
}
