import test from "node:test";
import assert from "node:assert/strict";
import { buildTimeline, timelineDuration, toMorse } from "../site/assets/js/morse.js";
import { createPlayer, buildAudioPlan, PEAK_GAIN } from "../site/assets/js/morse-audio.js";

function makeFakeContext(options = {}) {
  const oscillators = [];
  const gains = [];
  const contexts = [];
  class FakeParam {
    constructor(name) { this.name = name; this.events = []; }
    setValueAtTime(v, t) { this.events.push(["set", v, t]); return this; }
    linearRampToValueAtTime(v, t) { this.events.push(["ramp", v, t]); return this; }
    cancelScheduledValues(t) { this.events.push(["cancel", t]); return this; }
  }
  class FakeOsc {
    constructor() {
      this.type = ""; this.frequency = new FakeParam("frequency");
      this.started = []; this.stopped = []; this.disconnected = false;
    }
    connect() {} disconnect() { this.disconnected = true; }
    start(t) { this.started.push(t); } stop(t) { this.stopped.push(t); }
  }
  class FakeGain {
    constructor() { this.gain = new FakeParam("gain"); this.disconnected = false; }
    connect() {} disconnect() { this.disconnected = true; }
  }
  class FakeCtx {
    constructor() {
      this.currentTime = 0;
      this.state = options.state || "running";
      this.destination = {};
      contexts.push(this);
    }
    createOscillator() { const o = new FakeOsc(); oscillators.push(o); return o; }
    createGain() { const g = new FakeGain(); gains.push(g); return g; }
    resume() {
      this.resumeCalls = (this.resumeCalls || 0) + 1;
      if (options.resumeFails) return Promise.reject(new Error("blocked"));
      if (!options.resumeKeepsState) this.state = "running";
      return Promise.resolve();
    }
  }
  return { FakeCtx, oscillators, gains, contexts };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test("play agenda um oscilador por segmento de tom com envelope de 5 ms", async () => {
  const { FakeCtx, oscillators, gains } = makeFakeContext();
  const player = createPlayer({ AudioContext: FakeCtx });
  const timeline = buildTimeline(toMorse("SOS").morse, 15); // 9 tons
  const res = await player.play(timeline, 15);
  assert.equal(res.ok, true);
  assert.equal(oscillators.length, 9);
  assert.equal(gains.length, 9);
  assert.equal(oscillators[0].type, "sine");

  const unit = 0.08; // 1.2/15
  const dot = gains[0].gain.events; // primeiro ponto de S: start 0, dur unit
  assert.deepEqual(dot[0], ["set", 0, 0]);
  assert.deepEqual(dot[1], ["ramp", PEAK_GAIN, 0.005]);
  assert.ok(Math.abs(dot[2][2] - (unit - 0.005)) < 1e-9);
  assert.ok(Math.abs(dot[3][2] - unit) < 1e-9);

  // Traço (4º evento de ganho, O começa após S+gap): ramp também 5 ms.
  const dash = gains[3].gain.events;
  assert.equal(dash[1][0], "ramp");
  assert.ok(dash[1][2] - dash[0][2] <= 0.005 + 1e-12);
});

test("ramp é limitado à metade da duração do tom", async () => {
  const { FakeCtx, gains } = makeFakeContext();
  const player = createPlayer({ AudioContext: FakeCtx });
  await player.play([{ type: "tone", units: 0.05 }], 15); // d = 0.004 s
  const ev = gains[0].gain.events;
  assert.ok(Math.abs(ev[1][2] - 0.002) < 1e-12); // ramp = d/2, não 5 ms
});

test("ganho de pico nunca excede 0,12", async () => {
  const { FakeCtx, gains } = makeFakeContext();
  const player = createPlayer({ AudioContext: FakeCtx });
  await player.play(buildTimeline(toMorse("TESTE 123").morse, 5), 5);
  for (const g of gains) {
    for (const ev of g.gain.events) {
      const value = ev[0] === "cancel" ? 0 : ev[1];
      assert.ok(value <= 0.12, `ganho ${value} > 0.12`);
    }
  }
});

test("play duplo cancela a primeira execução, sem sobreposição", async () => {
  const { FakeCtx, oscillators } = makeFakeContext();
  const player = createPlayer({ AudioContext: FakeCtx });
  const timeline = buildTimeline(toMorse("SOS").morse, 15);
  await player.play(timeline, 15);
  const first = oscillators.slice();
  assert.ok(player.isPlaying());
  await player.play(timeline, 15);
  for (const osc of first) {
    assert.equal(osc.disconnected, true);
    assert.ok(osc.stopped.length >= 2, "stop() chamado na primeira execução também");
  }
  const second = oscillators.slice(first.length);
  assert.equal(second.length, 9);
  assert.ok(second.every((o) => !o.disconnected));
  assert.ok(player.isPlaying());
});

test("play duplo com resume assíncrono agenda UMA execução (9 osciladores)", async () => {
  const { FakeCtx, oscillators } = makeFakeContext({ state: "suspended" });
  const resolvers = [];
  FakeCtx.prototype.resume = function () {
    return new Promise((r) => resolvers.push(() => { this.state = "running"; r(); }));
  };
  const player = createPlayer({ AudioContext: FakeCtx });
  const timeline = buildTimeline(toMorse("SOS").morse, 15);
  const p1 = player.play(timeline, 15);
  const p2 = player.play(timeline, 15); // segundo clique antes do primeiro resume resolver
  assert.equal(resolvers.length, 2, "ambas as chamadas aguardaram resume()");
  resolvers.forEach((r) => r());
  const [r1, r2] = await Promise.all([p1, p2]);
  assert.equal(r1.superseded, true, "a chamada substituída não agenda nada");
  assert.equal(r2.ok, true);
  assert.equal(oscillators.length, 9, "apenas uma SOS agendada");
  assert.ok(player.isPlaying());
});

test("stop() imediato cancela fontes futuras e limpa o timer de término", async () => {
  const { FakeCtx, oscillators } = makeFakeContext();
  const player = createPlayer({ AudioContext: FakeCtx });
  let ended = 0;
  player.onEnd(() => { ended += 1; });
  // Timer natural dispararia em ~90 ms; stop deve impedi-lo.
  await player.play([{ type: "tone", units: 1 }], 30);
  player.stop();
  assert.equal(player.isPlaying(), false);
  assert.equal(oscillators[0].disconnected, true);
  assert.ok(oscillators[0].stopped.length >= 1);
  await sleep(200);
  assert.equal(ended, 0, "onEnd não deve disparar após stop()");
  player.stop(); // no-op quando ocioso, sem lançar
});

test("onEnd dispara naturalmente após a duração total", async () => {
  const { FakeCtx } = makeFakeContext();
  const player = createPlayer({ AudioContext: FakeCtx });
  let ended = 0;
  player.onEnd(() => { ended += 1; });
  await player.play([{ type: "tone", units: 1 }], 30); // 0,04 s + folga
  await sleep(250);
  assert.equal(ended, 1);
  assert.equal(player.isPlaying(), false);
});

test("sem Web Audio: play devolve no_audio sem lançar", async () => {
  assert.ok(typeof globalThis.AudioContext === "undefined");
  assert.ok(typeof globalThis.webkitAudioContext === "undefined");
  const player = createPlayer({});
  let threw = false;
  let res;
  try {
    res = await player.play(buildTimeline(".-", 15), 15);
  } catch {
    threw = true;
  }
  assert.equal(threw, false);
  assert.deepEqual(res, { ok: false, code: "no_audio" });
});

test("resume rejeitado: resume_failed + onError, sem lançar", async () => {
  const { FakeCtx } = makeFakeContext({ state: "suspended", resumeFails: true });
  const player = createPlayer({ AudioContext: FakeCtx });
  let errors = 0;
  player.onError(() => { errors += 1; });
  const res = await player.play(buildTimeline(".", 15), 15);
  assert.deepEqual(res, { ok: false, code: "resume_failed" });
  assert.equal(errors, 1);
});

test("buildAudioPlan: inícios monótonos e fim igual a timelineDuration", () => {
  for (const wpm of [5, 15, 30]) {
    const timeline = buildTimeline(toMorse("SOS").morse, wpm);
    const plan = buildAudioPlan(timeline, wpm);
    assert.equal(plan.length, timeline.length);
    let prevEnd = 0;
    for (const seg of plan) {
      assert.ok(seg.start >= prevEnd - 1e-12);
      assert.ok(seg.duration > 0);
      prevEnd = seg.start + seg.duration;
    }
    assert.ok(Math.abs(prevEnd - timelineDuration(timeline, wpm)) < 1e-9);
    assert.equal(plan.filter((s) => s.isTone).length, 9);
  }
});


test("iOS: sessão playback só é solicitada no play, antes de criar o contexto", async () => {
  const { FakeCtx } = makeFakeContext();
  const events = [];
  const session = { set type(value) { events.push(value); } };
  class Context extends FakeCtx { constructor() { events.push("context"); super(); } }
  const player = createPlayer({ AudioContext: Context, navigator: { audioSession: session } });
  assert.deepEqual(events, []);
  const result = await player.play(buildTimeline(".", 15), 15);
  assert.equal(result.ok, true);
  assert.deepEqual(events, ["playback", "context"]);
  player.stop();
});

test("sessão opcional ausente ou com setter rejeitado preserva Web Audio", async () => {
  for (const navigator of [{}, { audioSession: { set type(value) { throw new Error("unsupported"); } } }]) {
    const { FakeCtx, oscillators } = makeFakeContext();
    const player = createPlayer({ AudioContext: FakeCtx, navigator });
    assert.equal((await player.play(buildTimeline(".", 15), 15)).ok, true);
    assert.equal(oscillators.length, 1);
    player.stop();
  }
});

test("contexto interrupted é retomado antes de agendar o som", async () => {
  const { FakeCtx, contexts, oscillators } = makeFakeContext({ state: "interrupted" });
  const player = createPlayer({ AudioContext: FakeCtx });
  assert.equal((await player.play(buildTimeline(".", 15), 15)).ok, true);
  assert.equal(contexts[0].resumeCalls, 1);
  assert.equal(contexts[0].state, "running");
  assert.equal(oscillators.length, 1);
  player.stop();
});

test("contexto que continua interrompido não informa reprodução falsa", async () => {
  const { FakeCtx, oscillators } = makeFakeContext({ state: "interrupted", resumeKeepsState: true });
  const player = createPlayer({ AudioContext: FakeCtx });
  assert.deepEqual(await player.play(buildTimeline(".", 15), 15), { ok: false, code: "audio_not_running" });
  assert.equal(player.isPlaying(), false);
  assert.equal(oscillators.length, 0);
});

test("contexto fechado é recriado no próximo clique", async () => {
  const { FakeCtx, contexts } = makeFakeContext();
  const player = createPlayer({ AudioContext: FakeCtx });
  await player.play(buildTimeline(".", 15), 15);
  player.stop();
  contexts[0].state = "closed";
  assert.equal((await player.play(buildTimeline(".", 15), 15)).ok, true);
  assert.equal(contexts.length, 2);
  player.stop();
});

test("Parar enquanto resume aguarda impede o agendamento tardio", async () => {
  const { FakeCtx, oscillators } = makeFakeContext({ state: "interrupted" });
  let release;
  FakeCtx.prototype.resume = function () { return new Promise(resolve => { release = () => { this.state = "running"; resolve(); }; }); };
  const player = createPlayer({ AudioContext: FakeCtx });
  const pending = player.play(buildTimeline(".", 15), 15);
  player.stop();
  assert.equal(typeof release, "function");
  release();
  assert.equal((await pending).superseded, true);
  assert.equal(oscillators.length, 0);
  assert.equal(player.isPlaying(), false);
});

test('posição visual usa o relógio do AudioContext e é anulada ao parar', async () => {
  const {FakeCtx,contexts}=makeFakeContext();
  const player=createPlayer({AudioContext:FakeCtx});
  assert.equal(player.position(),null);
  const timeline=buildTimeline('.-');
  await player.play(timeline,15);
  contexts[0].currentTime=.12;
  assert.equal(player.position(),.12);
  player.stop();assert.equal(player.position(),null);
});
