// Áudio Morse via Web Audio. Sem DOM no import; testável com AudioContext falso via env.
import { clampWpm, timelineDuration } from "./morse.js";

export const TONE_HZ = 600;
export const PEAK_GAIN = 0.12;
const RAMP_SECONDS = 0.005;

// Segmentos agendados em segundos: [{start, duration, isTone}] — puro.
export function buildAudioPlan(timeline, wpm) {
  let t = 0;
  return timeline.map((seg) => {
    const duration = timelineDuration([seg], wpm);
    const item = { start: t, duration, isTone: seg.type === "tone" };
    t += duration;
    return item;
  });
}

export function createPlayer(env = {}) {
  const Ctor = env.AudioContext || globalThis.AudioContext || globalThis.webkitAudioContext || null;
  let ctx = null;
  let run = null; // { nodes: [{osc, gain}], endTimer }
  let generation = 0; // identifica a chamada de play() mais recente
  const endCallbacks = [];
  const errorCallbacks = [];

  function cancelCurrent(fireEnd) {
    if (!run) return; // no-op quando ocioso
    const current = run;
    run = null;
    if (current.endTimer != null) clearTimeout(current.endTimer);
    const now = ctx ? ctx.currentTime : 0;
    for (const node of current.nodes) {
      // stop() após start() é sempre legal; cancela inclusive fontes futuras.
      try { node.osc.stop(now); } catch { /* já parado/ilegal */ }
      try { node.gain.gain.cancelScheduledValues(now); } catch { /* param sem suporte no fake */ }
      try { node.osc.disconnect(); } catch { /* noop */ }
      try { node.gain.disconnect(); } catch { /* noop */ }
    }
    if (fireEnd) for (const cb of endCallbacks) { try { cb(); } catch { /* callback não deve quebrar */ } }
  }

  async function play(timeline, wpm) {
    const myGen = ++generation; // passa a ser a execução mais recente
    if (!Ctor) return { ok: false, code: "no_audio" };
    cancelCurrent(false); // play duplo nunca sobrepõe
    // Safari/iOS trata Web Audio como som ambiente por padrão, sujeito ao
    // modo Silencioso. Um clique explícito em Reproduzir é reprodução de mídia.
    // https://bugs.webkit.org/show_bug.cgi?id=252746#c2
    // API opcional: não impedir Web Audio nos navegadores sem suporte.
    try {
      const nav = env.navigator ?? globalThis.navigator;
      if (nav?.audioSession) nav.audioSession.type = "playback";
    } catch { /* navegador sem suporte à configuração de sessão */ }
    if (!ctx || ctx.state === "closed") {
      try { ctx = new Ctor(); } catch { return { ok: false, code: "no_audio" }; }
    }
    // Criar/resumir apenas dentro do gesto do usuário (chamada vem de clique).
    if ((ctx.state === "suspended" || ctx.state === "interrupted") && typeof ctx.resume === "function") {
      try {
        await ctx.resume();
      } catch {
        for (const cb of errorCallbacks) { try { cb(new Error("resume_failed")); } catch { /* noop */ } }
        return { ok: false, code: "resume_failed" };
      }
    }
    // Após QUALQUER await: se outro play()/stop() entrou enquanto aguardávamos,
    // esta chamada foi substituída — não agenda nada (evita sobreposição no
    // caminho de resume assíncrono, ex.: iOS Safari com contexto suspenso).
    if (myGen !== generation) return { ok: true, superseded: true };
    if (ctx.state !== "running") return { ok: false, code: "audio_not_running" };
    const speed = clampWpm(wpm);
    const base = ctx.currentTime;
    const nodes = [];
    for (const seg of buildAudioPlan(timeline, speed)) {
      if (!seg.isTone) continue;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(TONE_HZ, base + seg.start);
      const start = base + seg.start;
      const end = start + seg.duration;
      const ramp = Math.min(RAMP_SECONDS, seg.duration / 2);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(PEAK_GAIN, start + ramp);
      gain.gain.setValueAtTime(PEAK_GAIN, end - ramp);
      gain.gain.linearRampToValueAtTime(0, end);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(end);
      nodes.push({ osc, gain });
    }
    const total = timelineDuration(timeline, speed);
    run = { nodes, endTimer: null, base, total };
    run.endTimer = setTimeout(() => cancelCurrent(true), Math.ceil(total * 1000) + 50);
    return { ok: true };
  }

  return {
    play,
    stop() { generation++; cancelCurrent(false); },
    isPlaying() { return run !== null; },
    position() { return run ? Math.max(0, Math.min(run.total, ctx.currentTime - run.base)) : null; },
    onEnd(cb) { endCallbacks.push(cb); },
    onError(cb) { errorCallbacks.push(cb); },
  };
}
