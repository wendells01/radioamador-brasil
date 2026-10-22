import test from "node:test";
import assert from "node:assert/strict";
import {
  MORSE, MAX_INPUT, normalizeText, toMorse, buildTimeline,
  totalUnits, unitDuration, timelineDuration, randomChar,
} from "../site/assets/js/morse.js";

const EXPECTED = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.",
  H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.",
  O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-",
  V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
};

test("MORSE tem exatamente 36 entradas e bate com a tabela fixa", () => {
  assert.equal(Object.keys(MORSE).length, 36);
  assert.deepEqual(MORSE, EXPECTED);
});

test("toMorse('SOS') produz '... --- ...'", () => {
  const r = toMorse("SOS");
  assert.equal(r.ok, true);
  assert.equal(r.morse, "... --- ...");
});

test("acentos normalizam: 'São Paulo' vira SAO PAULO", () => {
  const r = toMorse("São Paulo");
  assert.equal(r.ok, true);
  assert.equal(r.chars, "SAO PAULO");
  assert.equal(r.morse, "... .- --- / .--. .- ..- .-.. ---");
});

test("espaços múltiplos, quebras e tabs colapsam em um gap de palavra", () => {
  const r = toMorse("A\t\t\n  B");
  assert.equal(r.ok, true);
  assert.equal(r.morse, ".- / -...");
});

test("'E E' a 20 WPM: 9 unidades = 0,54 s", () => {
  const t = buildTimeline(toMorse("E E").morse, 20);
  assert.equal(totalUnits(t), 9);
  assert.ok(Math.abs(timelineDuration(t, 20) - 0.54) < 1e-9);
});

test("'SOS': 27 unidades, 1,62 s a 20 WPM, sem gap final", () => {
  const t = buildTimeline(toMorse("SOS").morse, 20);
  assert.equal(totalUnits(t), 27);
  assert.ok(Math.abs(timelineDuration(t, 20) - 1.62) < 1e-9);
  assert.equal(t[t.length - 1].type, "tone");
});

test("unitDuration(20) === 0,06", () => {
  assert.equal(unitDuration(20), 0.06);
});

test("estrutura 'EE': tom 1u, gap 3u, tom 1u (letras separadas por 3)", () => {
  assert.deepEqual(buildTimeline(toMorse("EE").morse, 15), [
    { type: "tone", units: 1 },
    { type: "gap", units: 3 },
    { type: "tone", units: 1 },
  ]);
});

test("estrutura 'E E': tom 1u, gap 7u, tom 1u (palavras separadas por 7)", () => {
  assert.deepEqual(buildTimeline(toMorse("E E").morse, 15), [
    { type: "tone", units: 1 },
    { type: "gap", units: 7 },
    { type: "tone", units: 1 },
  ]);
});

test("traço vale 3 unidades e gap intraletra vale 1", () => {
  const t = buildTimeline(toMorse("I").morse, 15); // ".."
  assert.deepEqual(t, [
    { type: "tone", units: 1 },
    { type: "gap", units: 1 },
    { type: "tone", units: 1 },
  ]);
  const m = buildTimeline(toMorse("M").morse, 15); // "--"
  assert.deepEqual(m, [
    { type: "tone", units: 3 },
    { type: "gap", units: 1 },
    { type: "tone", units: 3 },
  ]);
});

test("rejeita vazio, espaços, pontuação e símbolo", () => {
  assert.deepEqual(toMorse(""), { ok: false, code: "empty" });
  assert.deepEqual(toMorse("   "), { ok: false, code: "empty" });
  const r = toMorse("hello!");
  assert.equal(r.ok, false);
  assert.equal(r.code, "unsupported");
  assert.deepEqual(r.unsupported, ["!"]);
  assert.deepEqual(toMorse("#"), { ok: false, code: "unsupported", unsupported: ["#"] });
});

test("Ç é aceito como C", () => {
  const r = toMorse("Ç");
  assert.equal(r.ok, true);
  assert.equal(r.morse, "-.-.");
});

test("limite: 201 caracteres rejeita (too_long), 200 aceita", () => {
  assert.equal(MAX_INPUT, 200);
  assert.deepEqual(toMorse("A".repeat(201)), { ok: false, code: "too_long" });
  assert.equal(toMorse("A".repeat(200)).ok, true);
});

test("randomChar com rng injetado é determinístico e pertence ao conjunto", () => {
  assert.equal(randomChar(() => 0), "A");
  assert.equal(randomChar(() => 0.99999), "9");
  assert.equal(randomChar(() => 0), randomChar(() => 0));
  const valid = new Set(Object.keys(MORSE));
  for (const seed of [0.1, 0.4, 0.5, 0.7, 0.9]) {
    assert.ok(valid.has(randomChar(() => seed)));
  }
});
