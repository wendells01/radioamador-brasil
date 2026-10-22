import test from "node:test";
import assert from "node:assert/strict";
import {
  parseFrequencyMHz,
  calculate,
  formatMeters,
  MIN_MHZ,
  MAX_MHZ,
} from "../site/assets/js/antenas.js";

test("importing the module in Node does not require a DOM", () => {
  assert.equal(typeof parseFrequencyMHz, "function");
  assert.equal(typeof calculate, "function");
  assert.equal(typeof formatMeters, "function");
});

test("146 MHz produces exact wavelength, total and arm", () => {
  const { mhz } = parseFrequencyMHz("146");
  assert.equal(mhz, 146);
  const r = calculate(mhz);
  assert.ok(Math.abs(r.wavelength - 299.792458 / 146) < 1e-9);
  assert.ok(Math.abs(r.dipoleTotal - 143 / 146) < 1e-9);
  assert.ok(Math.abs(r.dipoleArm - 71.5 / 146) < 1e-9);
});

test("14.2 and 14,2 produce identical results", () => {
  const a = parseFrequencyMHz("14.2");
  const b = parseFrequencyMHz("14,2");
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.deepEqual(calculate(a.mhz), calculate(b.mhz));
});

test("inclusive bounds 0.1 and 100000 are accepted", () => {
  assert.equal(parseFrequencyMHz("0.1").ok, true);
  assert.equal(parseFrequencyMHz("100000").ok, true);
  assert.equal(parseFrequencyMHz("0,1").ok, true);
});

test("out of range 0.09 and 100001 are rejected with range", () => {
  assert.deepEqual(parseFrequencyMHz("0.09"), { ok: false, code: "range" });
  assert.deepEqual(parseFrequencyMHz("100001"), { ok: false, code: "range" });
});

test("invalid inputs are rejected", () => {
  const bad = [
    "",
    "   ",
    "0",
    "-1",
    "1e3",
    "14,2.3",
    "146 MHz",
    "Infinity",
    "NaN",
    "abc",
    "<script>",
    "+1",
    "1,2,3",
  ];
  for (const raw of bad) {
    const res = parseFrequencyMHz(raw);
    assert.equal(res.ok, false, `expected rejection for ${JSON.stringify(raw)}`);
    assert.ok(typeof res.code === "string" && res.code.length > 0);
  }
});

test("empty string gives empty code", () => {
  assert.deepEqual(parseFrequencyMHz(""), { ok: false, code: "empty" });
  assert.deepEqual(parseFrequencyMHz("   "), { ok: false, code: "empty" });
});

test("formatMeters uses pt-BR comma and 3 decimals", () => {
  assert.equal(formatMeters(299.792458 / 146), "2,053 m");
  assert.equal(formatMeters(143 / 146), "0,979 m");
  assert.equal(formatMeters(71.5 / 146), "0,490 m");
});

test("formatMeters rounds up when needed", () => {
  assert.equal(formatMeters(1.23456), "1,235 m");
});

test("constants match the contract", () => {
  assert.equal(MIN_MHZ, 0.1);
  assert.equal(MAX_MHZ, 100000);
});
